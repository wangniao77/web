"""用整理后的财经类排名表（学校/专业/全国排名/评级/财经类排名）整表替换 finance 对标。

支持单元格带 markdown 加粗（**广东财经大学**）。

用法:
  cd backend
  python scripts/update_finance_ranks_from_table.py \\
    --csv \"C:/Users/11298/Downloads/table-xxx.csv\" --year 2026 --import-db
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

BACKEND = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND / "data" / "major_ranks"
SELF_SCHOOL = "广东财经大学"


def _clean(text: str | None) -> str:
    return re.sub(r"\*+", "", (text or "").strip()).strip()


def _as_int(raw: str | None) -> int | None:
    text = _clean(raw)
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        rows = []
        for row in csv.DictReader(f):
            cleaned = {_clean(k): _clean(v) for k, v in row.items() if k}
            if cleaned.get("学校") and cleaned.get("专业"):
                rows.append(cleaned)
        return rows


def _build_by_major(rows: list[dict[str, str]]) -> dict[str, list[dict[str, Any]]]:
    by_major: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for r in rows:
        major = r.get("专业") or ""
        school = r.get("学校") or ""
        national = _as_int(r.get("全国排名"))
        finance = _as_int(r.get("财经类排名"))
        grade = r.get("评级") or ""
        if not major or not school or national is None:
            continue
        item: dict[str, Any] = {
            "school": school,
            "rank": national,
            "financeRank": finance,
            "grade": grade,
            "relative": r.get("相对位置") or "",
        }
        if school == SELF_SCHOOL:
            item["isSelf"] = True
        by_major[major].append(item)

    for major, items in by_major.items():
        items.sort(
            key=lambda x: (
                x.get("financeRank") if isinstance(x.get("financeRank"), int) else 10**9,
                int(x["rank"]),
                x["school"],
            )
        )
    return by_major


def _finance_peers(items: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int | None, str | None, int | None]:
    peers: list[dict[str, Any]] = []
    self_finance_rank: int | None = None
    self_grade: str | None = None
    self_national: int | None = None
    for it in items:
        peer: dict[str, Any] = {"school": it["school"], "rank": int(it["rank"])}
        if it.get("isSelf"):
            peer["isSelf"] = True
            self_national = int(it["rank"])
            self_grade = it.get("grade") or None
            self_finance_rank = it.get("financeRank") if isinstance(it.get("financeRank"), int) else None
        peers.append(peer)
    if self_finance_rank is None:
        for i, p in enumerate(peers, start=1):
            if p.get("isSelf"):
                self_finance_rank = i
                break
    return peers, self_finance_rank, self_grade, self_national


def update_payload(payload: dict[str, Any], by_major: dict[str, list[dict[str, Any]]], *, csv_name: str) -> dict[str, Any]:
    majors = payload.get("majors") or []
    by_name = {str(m.get("name") or ""): m for m in majors if isinstance(m, dict)}
    finance_pool: set[str] = set()

    for major_name, items in by_major.items():
        peers, finance_peer_rank, self_grade, self_national = _finance_peers(items)
        for p in peers:
            finance_pool.add(str(p["school"]))

        item = by_name.get(major_name)
        if not item:
            item = {
                "name": major_name,
                "grade": self_grade or "",
                "nationalRank": self_national,
                "yoyChange": None,
                "provincialRank": None,
                "financePeerRank": finance_peer_rank,
                "softDimensions": [],
                "peerSchools": [],
                "financePeerSchools": peers,
            }
            majors.append(item)
            by_name[major_name] = item
            print(f"[add] {major_name}")
        else:
            # 整表替换财经对标；本校全国名次/评级同步为表内最新值
            item["financePeerSchools"] = peers
            item["financePeerRank"] = finance_peer_rank
            if self_grade:
                item["grade"] = self_grade
            if self_national is not None:
                # 同步 peerSchools 中本校 rank，保持全国对标一致口径
                item["nationalRank"] = self_national
                peers_nat = item.get("peerSchools") or []
                if isinstance(peers_nat, list):
                    for p in peers_nat:
                        if isinstance(p, dict) and (p.get("isSelf") or p.get("school") == SELF_SCHOOL):
                            p["rank"] = self_national
                            p["isSelf"] = True
            print(
                f"[replace] {major_name}: financePeerRank={finance_peer_rank} "
                f"nationalRank={self_national} grade={self_grade} peers={len(peers)}"
            )

    payload["majors"] = majors
    meta = payload.setdefault("meta", {})
    meta["financePool"] = sorted(finance_pool)
    meta["financeCsv"] = csv_name
    meta["financeUpdatedFrom"] = "finance-rank-table-replace"
    payload["source"] = "finance-rank-table"
    return payload


def _update_yaml_finance_pool(pool: list[str]) -> None:
    yaml_path = BACKEND / "scripts" / "config" / "peer_schools.yaml"
    if not yaml_path.exists():
        return
    lines = yaml_path.read_text(encoding="utf-8").splitlines()
    out: list[str] = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.strip() == "finance:":
            out.append("finance:")
            i += 1
            while i < len(lines) and (lines[i].startswith("  - ") or lines[i].strip() == ""):
                i += 1
            for school in pool:
                out.append(f"  - {school}")
            continue
        out.append(line)
        i += 1
    yaml_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"[yaml] finance pool={len(pool)}")


def main() -> None:
    parser = argparse.ArgumentParser(description="用财经排名整理表整表替换 finance 对标")
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--json", type=Path, default=None)
    parser.add_argument("--import-db", action="store_true")
    args = parser.parse_args()

    csv_path = args.csv.expanduser().resolve()
    if not csv_path.exists():
        raise SystemExit(f"CSV 不存在: {csv_path}")

    out = args.json or (OUT_DIR / f"{args.year}.json")
    if out.exists():
        payload = json.loads(out.read_text(encoding="utf-8"))
    else:
        payload = {
            "year": args.year,
            "source": "finance-rank-table",
            "selfSchool": SELF_SCHOOL,
            "majors": [],
            "meta": {},
        }

    rows = _load_rows(csv_path)
    by_major = _build_by_major(rows)
    if not by_major:
        raise SystemExit("未解析到有效排名行")

    archive = OUT_DIR / f"finance_{args.year}_table.csv"
    archive.write_bytes(csv_path.read_bytes())
    print(f"[archive] {archive}")

    payload["year"] = args.year
    payload["selfSchool"] = SELF_SCHOOL
    update_payload(payload, by_major, csv_name=csv_path.name)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[write] {out}")

    pool = payload.get("meta", {}).get("financePool") or []
    if pool:
        _update_yaml_finance_pool(pool)

    if args.import_db:
        cmd = [
            sys.executable,
            str(BACKEND / "scripts" / "import_ugit_data.py"),
            "--only",
            "major_ranks",
            "--data-root",
            str(OUT_DIR.parent),
        ]
        print(">", " ".join(cmd))
        subprocess.run(cmd, cwd=str(BACKEND), check=True)

    print("REPLACE_FINANCE_TABLE_OK")


if __name__ == "__main__":
    main()
