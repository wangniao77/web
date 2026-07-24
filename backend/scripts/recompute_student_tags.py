"""批算高潜 / 预警标签并写入 student_tags（对齐前端枚举）。

用法（在 backend 目录）:
  python scripts/recompute_student_tags.py
  python scripts/recompute_student_tags.py --college big-data-ai
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from tortoise import Tortoise

from core.database import TORTOISE_ORM
from Utils.Analytics.student_tag_service import rebuild_student_tags
from Utils.DB.read.college_db import resolve_college


async def main(college_code: str | None) -> None:
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    try:
        college = await resolve_college(college_code)
        if not college:
            raise SystemExit("college not found")
        print("college:", college.code, college.name)
        stats = await rebuild_student_tags(college)
        print("TAGS", stats)
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Recompute student high-potential / warning tags")
    parser.add_argument("--college", type=str, default="big-data-ai")
    args = parser.parse_args()
    asyncio.run(main(args.college or None))
