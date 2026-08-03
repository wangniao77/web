"""一键同步专业排名（易路径：网络拉取 / Excel/inbox → 标准 JSON → 入库）。

用法（在 backend 目录）:
  # 推荐：软科公开接口拉取后入库
  python scripts/sync_major_ranks.py --fetch --year 2025

  # 指定本院排名 Excel/CSV
  python scripts/sync_major_ranks.py --excel D:\\UGit\\data\\softke_2025.xlsx --year 2025

  # 从 inbox 取最新文件（data/major_ranks/inbox/）
  python scripts/sync_major_ranks.py --from-inbox --year 2025

  # 已有 JSON，只入库（默认读 data/major_ranks/<year>.json）
  python scripts/sync_major_ranks.py --import-only --year 2025

  # 只生成 JSON，不入库
  python scripts/sync_major_ranks.py --fetch --year 2025 --dry-run
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SCRIPTS))

from collect_major_ranks import (  # noqa: E402
    DEFAULT_FETCH_MAJORS,
    attach_peers,
    build_payload,
    fetch_majors_from_bcmr,
    load_peer_config,
    majors_from_excel,
)

INBOX = BACKEND / "data" / "major_ranks" / "inbox"
OUT_DIR = BACKEND / "data" / "major_ranks"
INBOX_GLOBS = ("*.xlsx", "*.xls", "*.csv")


def _pick_inbox_file() -> Path:
    candidates: list[Path] = []
    for pattern in INBOX_GLOBS:
        candidates.extend(INBOX.glob(pattern))
    skip_names = {"template.csv", "template.xlsx", "template.xls", "readme.md"}
    candidates = [
        p
        for p in candidates
        if p.is_file()
        and not p.name.startswith("~$")
        and p.name.lower() not in skip_names
    ]
    if not candidates:
        raise FileNotFoundError(
            f"inbox 为空：请将排名 Excel/CSV 放入 {INBOX}\n"
            f"或使用 --excel 指定文件。表头见 inbox/README.md"
        )
    candidates.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return candidates[0]


def _write_payload(payload: dict, output: Path) -> dict:
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[collect] wrote {output} majors={len(payload.get('majors') or [])}")
    return payload


def _collect_excel(
    *,
    excel: Path,
    year: int,
    source: str,
    lookup_peers: Path | None,
    peer_config: Path | None,
    output: Path,
) -> dict:
    cfg = load_peer_config(peer_config)
    majors = majors_from_excel(excel)
    if not majors:
        raise SystemExit(f"未解析到专业行: {excel}")
    if lookup_peers:
        attach_peers(majors, lookup_peers, cfg)
    return _write_payload(
        build_payload(
            year=year,
            majors=majors,
            source=source,
            self_school=cfg["selfSchool"],
        ),
        output,
    )


def _collect_fetch(
    *,
    year: int,
    majors: list[str],
    peer_config: Path | None,
    output: Path,
    national_csv: Path | None,
) -> dict:
    cfg = load_peer_config(peer_config)
    nat = national_csv or (OUT_DIR / f"national_{year}_slice.csv")
    items = fetch_majors_from_bcmr(
        year=year,
        major_names=majors,
        cfg=cfg,
        national_csv=nat,
    )
    return _write_payload(
        build_payload(
            year=year,
            majors=items,
            source="softke-bcmr-api",
            self_school=cfg["selfSchool"],
        ),
        output,
    )


def _import_json(data_root: Path) -> None:
    cmd = [
        sys.executable,
        str(SCRIPTS / "import_ugit_data.py"),
        "--data-root",
        str(data_root),
        "--only",
        "major_ranks",
    ]
    print("[import]", " ".join(cmd))
    result = subprocess.run(cmd, cwd=str(BACKEND), check=False)
    if result.returncode != 0:
        raise SystemExit(result.returncode)


def main() -> None:
    parser = argparse.ArgumentParser(description="Sync major ranks: Excel → JSON → DB")
    parser.add_argument("--year", type=int, default=None, help="排名年份，默认当前年")
    parser.add_argument("--source", type=str, default="softke")
    parser.add_argument("--excel", type=Path, default=None, help="本院排名明细 Excel/CSV")
    parser.add_argument("--from-inbox", action="store_true", help="从 data/major_ranks/inbox 取最新文件")
    parser.add_argument(
        "--fetch",
        action="store_true",
        help="从软科公开 bcmr 接口拉取本院专业与对标校",
    )
    parser.add_argument(
        "--majors",
        type=str,
        default="",
        help="--fetch 时的专业名，逗号分隔",
    )
    parser.add_argument("--lookup-peers", type=Path, default=None, help="全国全量榜 CSV/JSON（可选）")
    parser.add_argument("--peer-config", type=Path, default=None)
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="输出 JSON 路径，默认 data/major_ranks/<year>.json",
    )
    parser.add_argument(
        "--import-only",
        action="store_true",
        help="跳过采集，直接导入已有 major_ranks JSON",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="只写 JSON，不入库",
    )
    parser.add_argument(
        "--data-root",
        type=Path,
        default=BACKEND / "data",
        help="导入时的 data-root（默认 backend/data）",
    )
    args = parser.parse_args()

    year = args.year or datetime.now().year
    out = args.output or (OUT_DIR / f"{year}.json")

    if args.import_only:
        if not out.exists() and not list((args.data_root / "major_ranks").glob("*.json")):
            raise SystemExit(f"找不到待导入 JSON：{out} 或 {args.data_root / 'major_ranks'}")
        print(f"[sync] import-only year={year}")
        _import_json(args.data_root)
        print("[sync] done")
        return

    if args.fetch:
        names = [x.strip() for x in args.majors.split(",") if x.strip()] or list(
            DEFAULT_FETCH_MAJORS
        )
        print(f"[sync] fetch year={year} majors={len(names)}")
        _collect_fetch(
            year=year,
            majors=names,
            peer_config=args.peer_config,
            output=out,
            national_csv=OUT_DIR / f"national_{year}_slice.csv",
        )
    else:
        excel: Path | None = args.excel
        if args.from_inbox or excel is None:
            if excel is None:
                INBOX.mkdir(parents=True, exist_ok=True)
                excel = _pick_inbox_file()
                print(f"[sync] inbox → {excel.name}")
        if excel is None or not excel.exists():
            raise SystemExit(
                "请使用 --fetch，或提供 --excel / --from-inbox"
            )
        _collect_excel(
            excel=excel,
            year=year,
            source=args.source,
            lookup_peers=args.lookup_peers,
            peer_config=args.peer_config,
            output=out,
        )

    if args.dry_run:
        print("[sync] dry-run：已跳过入库")
        return

    _import_json(args.data_root)
    print("[sync] done — 刷新学院看板「专业发展全景」即可看到新数据")


if __name__ == "__main__":
    main()
