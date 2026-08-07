"""回填成果 / 竞赛的系部、专业字段。

口径：
  - 成果：leader → teachers.department；已有非空则跳过
  - 竞赛：major_name → 系部映射；已有非空则跳过

用法:
  cd backend
  python scripts/backfill_dept_major.py
  python scripts/backfill_dept_major.py --college-code big-data-ai --dry-run
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
from Utils.DB.Models.college_ext_models import AchievementItem
from Utils.DB.Models.student_extra_models import CompetitionAward
from Utils.DB.dept_major import (
    build_teacher_department_map,
    resolve_achievement_affiliation,
    resolve_competition_department,
)
from Utils.DB.read.college_db import resolve_college


async def backfill_achievements(college_id: int, *, dry_run: bool) -> dict[str, int]:
    teacher_map = await build_teacher_department_map(college_id)
    stats = {"scanned": 0, "dept_filled": 0, "major_filled": 0, "skip": 0}
    items = await AchievementItem.filter(college_id=college_id)
    for item in items:
        stats["scanned"] += 1
        need_dept = not (item.department or "").strip()
        need_major = not (item.major_name or "").strip()
        if not need_dept and not need_major:
            stats["skip"] += 1
            continue
        dept, major = resolve_achievement_affiliation(
            leader=item.leader,
            explicit_department=None if need_dept else item.department,
            explicit_major=None if need_major else item.major_name,
            teacher_dept_map=teacher_map,
        )
        changed = False
        if need_dept and dept:
            item.department = dept
            stats["dept_filled"] += 1
            changed = True
        if need_major and major:
            item.major_name = major
            stats["major_filled"] += 1
            changed = True
        if changed and not dry_run:
            await item.save()
        if not changed:
            stats["skip"] += 1
    return stats


async def backfill_competitions(college_id: int, *, dry_run: bool) -> dict[str, int]:
    stats = {"scanned": 0, "dept_filled": 0, "skip": 0}
    awards = await CompetitionAward.filter(college_id=college_id)
    for a in awards:
        stats["scanned"] += 1
        if (a.department or "").strip():
            stats["skip"] += 1
            continue
        dept = resolve_competition_department(major_name=a.major_name)
        if not dept:
            stats["skip"] += 1
            continue
        a.department = dept
        stats["dept_filled"] += 1
        if not dry_run:
            await a.save()
    return stats


async def main() -> None:
    parser = argparse.ArgumentParser(description="回填成果/竞赛系部专业")
    parser.add_argument("--college-code", default="big-data-ai")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    college = await resolve_college(args.college_code)
    if not college:
        raise SystemExit(f"college not found: {args.college_code}")
    print(f"college={college.code} id={college.id} dry_run={args.dry_run}")

    ach = await backfill_achievements(college.id, dry_run=args.dry_run)
    comp = await backfill_competitions(college.id, dry_run=args.dry_run)
    print("ACHIEVEMENTS", ach)
    print("COMPETITIONS", comp)
    print("BACKFILL_DEPT_MAJOR_OK")
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
