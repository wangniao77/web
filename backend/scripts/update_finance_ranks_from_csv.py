"""从「财经类院校计算机专业排名」原始 CSV 更新 major_ranks/<year>.json 的财经对标。

规则：
- 只取最新年份的排名数据（跳过教育部第四轮评估、无年份建设点、旧年校友会等）
- 每个专业在同年份多源时，优先含本校且有数字排名的来源；来源优先级 cnur.com > 金平果 > 校友会
- 保留原 JSON 的全国/省内对标与 nationalRank（若 CSV 未提供全国榜）
- 用最新财经榜重写 financePeerSchools / financePeerRank / grade（本校评级）

用法:
  cd backend
  python scripts/update_finance_ranks_from_csv.py \\
    --csv \"C:/Users/11298/Downloads/财经类院校计算机专业排名原始数据.csv\" \\
    --year 2026 --import-db
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

SOURCE_PRIORITY = {
    "cnur.com": 30,
    "金平果": 20,
    "校友会": 10,
}

SKIP_SOURCES = {
    "教育部第四轮学科评估",
    "一流本科专业建设点",
}


def _year_score(raw: str) -> int:
    text = (raw or "").strip()
    if not text:
        return 0
    # 2026-2027 → 取起始年；纯年份 → 该年
    m = re.match(r"^(\d{4})", text)
    return int(m.group(1)) if m else 0


def _as_rank(raw: str) -> int | None:
    text = (raw or "").strip()
    if not text:
        return None
    try:
        return int(float(text))
    except ValueError:
        return None


def _grade_from_label(raw: str) -> str | None:
    text = (raw or "").strip()
    if not text:
        return None
    # "3★ / B+" → 取字母评级；否则保留星级原文缩短
    for token in re.split(r"[/｜|]", text):
        token = token.strip()
        if re.fullmatch(r"[A-D][+-]?", token):
            return token
        if re.fullmatch(r"[A-D]\+\+", token):
            return token
    if "★" in text:
        return text.split()[0][:8]
    return text[:16]


def _load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as f:
        return [{k.strip(): (v or "").strip() for k, v in row.items()} for row in csv.DictReader(f)]


def _pick_latest_groups(rows: list[dict[str, str]]) -> dict[str, list[dict[str, str]]]:
    """major -> selected ranking rows (latest year + preferred source)."""
    by_major: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in rows:
        major = row.get("专业") or ""
        source = row.get("数据来源") or ""
        if not major or source in SKIP_SOURCES:
            continue
        if _as_rank(row.get("排名") or "") is None:
            continue
        if _year_score(row.get("年份") or "") <= 0:
            continue
        by_major[major].append(row)

    selected: dict[str, list[dict[str, str]]] = {}
    for major, items in by_major.items():
        max_year = max(_year_score(r.get("年份") or "") for r in items)
        candidates = [r for r in items if _year_score(r.get("年份") or "") == max_year]
        # group by source
        by_source: dict[str, list[dict[str, str]]] = defaultdict(list)
        for r in candidates:
            by_source[r.get("数据来源") or ""].append(r)

        def source_key(src: str) -> tuple[int, int, int]:
            group = by_source[src]
            has_self = any(r.get("学校") == SELF_SCHOOL for r in group)
            return (
                1 if has_self else 0,
                SOURCE_PRIORITY.get(src, 0),
                len(group),
            )

        best_source = max(by_source.keys(), key=source_key)
        selected[major] = sorted(
            by_source[best_source],
            key=lambda r: (_as_rank(r.get("排名") or "") or 10**9, r.get("学校") or ""),
        )
        print(
            f"[pick] {major}: year={max_year} source={best_source} "
            f"schools={len(selected[major])} "
            f"self={[r for r in selected[major] if r.get('学校') == SELF_SCHOOL]}"
        )
    return selected


def _finance_peers(rows: list[dict[str, str]]) -> tuple[list[dict[str, Any]], int | None, str | None]:
    peers: list[dict[str, Any]] = []
    self_rank: int | None = None
    self_grade: str | None = None
    for r in rows:
        school = r.get("学校") or ""
        rank = _as_rank(r.get("排名") or "")
        if not school or rank is None:
            continue
        item: dict[str, Any] = {"school": school, "rank": rank}
        if school == SELF_SCHOOL:
            item["isSelf"] = True
            self_rank = rank
            self_grade = _grade_from_label(r.get("评级/星级/档次") or "")
        peers.append(item)
    peers.sort(key=lambda x: (int(x["rank"]), x["school"]))
    finance_peer_rank = None
    for i, p in enumerate(peers, start=1):
        if p.get("isSelf"):
            finance_peer_rank = i
            break
    return peers, finance_peer_rank, self_grade


def update_payload(payload: dict[str, Any], selected: dict[str, list[dict[str, str]]], *, csv_name: str) -> dict[str, Any]:
    majors = payload.get("majors") or []
    by_name = {str(m.get("name") or ""): m for m in majors if isinstance(m, dict)}
    finance_pool: set[str] = set()

    for major_name, rows in selected.items():
        peers, finance_peer_rank, self_grade = _finance_peers(rows)
        for p in peers:
            finance_pool.add(str(p["school"]))
        source = rows[0].get("数据来源") if rows else ""
        year_label = rows[0].get("年份") if rows else ""

        item = by_name.get(major_name)
        if not item:
            # 新建专业条目（无全国榜时先用财经榜本校名次占位）
            self_peer = next((p for p in peers if p.get("isSelf")), None)
            item = {
                "name": major_name,
                "grade": self_grade or "",
                "nationalRank": self_peer["rank"] if self_peer else None,
                "yoyChange": None,
                "provincialRank": None,
                "financePeerRank": finance_peer_rank,
                "softDimensions": [],
                "peerSchools": [],
                "financePeerSchools": peers,
            }
            majors.append(item)
            by_name[major_name] = item
            print(f"[add] major={major_name}")
        else:
            item["financePeerSchools"] = peers
            item["financePeerRank"] = finance_peer_rank
            if self_grade:
                item["grade"] = self_grade
            # 若原全国名次缺失，用财经榜本校名次兜底
            if item.get("nationalRank") in (None, "", "**") and self_peer_rank(peers) is not None:
                item["nationalRank"] = self_peer_rank(peers)
            print(
                f"[update] {major_name}: financePeerRank={finance_peer_rank} "
                f"peers={len(peers)} grade={item.get('grade')} source={source}/{year_label}"
            )

    payload["majors"] = majors
    meta = payload.setdefault("meta", {})
    meta["financePool"] = sorted(finance_pool)
    meta["financeCsv"] = csv_name
    meta["financeUpdatedFrom"] = "finance-rank-csv-latest"
    payload["source"] = f"{payload.get('source') or 'softke'}+finance-csv"
    return payload


def self_peer_rank(peers: list[dict[str, Any]]) -> int | None:
    for p in peers:
        if p.get("isSelf"):
            return int(p["rank"])
    return None


def main() -> None:
    parser = argparse.ArgumentParser(description="用最新财经类院校排名 CSV 更新 major_ranks JSON")
    parser.add_argument("--csv", required=True, type=Path)
    parser.add_argument("--year", type=int, default=2026)
    parser.add_argument("--json", type=Path, default=None, help="默认 data/major_ranks/<year>.json")
    parser.add_argument("--import-db", action="store_true", help="更新 JSON 后执行入库")
    parser.add_argument("--college-code", default="big-data-ai")
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
            "source": "finance-csv",
            "selfSchool": SELF_SCHOOL,
            "majors": [],
            "meta": {},
        }

    rows = _load_csv(csv_path)
    selected = _pick_latest_groups(rows)
    if not selected:
        raise SystemExit("未解析到可用的最新排名行")

    # 归档原始 CSV
    archive = OUT_DIR / f"finance_{args.year}_raw.csv"
    archive.write_bytes(csv_path.read_bytes())
    print(f"[archive] {archive}")

    payload["year"] = args.year
    payload["selfSchool"] = SELF_SCHOOL
    update_payload(payload, selected, csv_name=csv_path.name)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[write] {out}")

    # 同步财经池配置
    yaml_path = BACKEND / "scripts" / "config" / "peer_schools.yaml"
    if yaml_path.exists() and payload.get("meta", {}).get("financePool"):
        pool = payload["meta"]["financePool"]
        text = yaml_path.read_text(encoding="utf-8")
        # 粗替换 finance 段：保留文件其他内容，重写 finance 列表
        lines = text.splitlines()
        out_lines: list[str] = []
        i = 0
        while i < len(lines):
            line = lines[i]
            if line.strip() == "finance:":
                out_lines.append("finance:")
                i += 1
                while i < len(lines) and (lines[i].startswith("  - ") or lines[i].strip() == ""):
                    i += 1
                for school in pool:
                    out_lines.append(f"  - {school}")
                continue
            out_lines.append(line)
            i += 1
        yaml_path.write_text("\n".join(out_lines) + "\n", encoding="utf-8")
        print(f"[yaml] updated finance pool ({len(pool)})")

    if args.import_db:
        cmd = [
            sys.executable,
            str(BACKEND / "scripts" / "import_ugit_data.py"),
            "--only",
            "major_ranks",
            "--data-root",
            str(OUT_DIR.parent),  # backend/data
        ]
        # import_ugit_data 期望 data_root 下有 major_ranks/
        print(">", " ".join(cmd))
        subprocess.run(cmd, cwd=str(BACKEND), check=True)

    print("UPDATE_FINANCE_RANKS_OK")


if __name__ == "__main__":
    main()
