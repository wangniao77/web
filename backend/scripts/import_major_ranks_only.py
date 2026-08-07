"""仅导入 major_ranks JSON → major_rank_snapshots（不 generate_schemas）。

用法:
  cd backend
  python scripts/import_major_ranks_only.py --data-root data
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SCRIPTS))

from tortoise import Tortoise

from core.database import TORTOISE_ORM
from importers_supplement import import_major_ranks
from Utils.DB.read.college_db import resolve_college


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-root", type=Path, default=BACKEND / "data")
    parser.add_argument("--college-code", default="big-data-ai")
    args = parser.parse_args()

    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    college = await resolve_college(args.college_code)
    if not college:
        raise SystemExit("college not found")
    print(f"college={college.code} id={college.id}")
    stats = await import_major_ranks(args.data_root, college)
    print("RESULTS", stats)
    print("IMPORT_MAJOR_RANKS_ONLY_OK")
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
