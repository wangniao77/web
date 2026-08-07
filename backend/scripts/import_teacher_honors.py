"""创建/同步教师荣誉称号表 teacher_honors，并镜像到 achievement_items(section=talent)。

用法:
  cd backend
  python scripts/import_teacher_honors.py
  python scripts/import_teacher_honors.py --college-code big-data-ai
"""

from __future__ import annotations

import argparse
import asyncio
import sys
from pathlib import Path
from typing import Any

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from tortoise import Tortoise

from core.database import TORTOISE_ORM
from Utils.DB.Models.college_ext_models import AchievementItem, TeacherHonor
from Utils.DB.read.college_db import resolve_college

SOURCE_TAG = "manual:teacher_honors_2026"

# (teacher_name, honor_title, honor_kind, level)
HONOR_ROWS: list[tuple[str, str, str, str]] = [
    # 王丽敏
    ("王丽敏", "三八红旗手", "先进表彰", "省部级"),
    ("王丽敏", "长白山学者特聘教授", "学者头衔", "省部级"),
    ("王丽敏", "珠江学者特聘教授", "学者头衔", "省部级"),
    ("王丽敏", "吉林省“拔尖创新人才”", "先进表彰", "省部级"),
    ("王丽敏", "吉林省高校“新世纪科学技术优秀人才”", "先进表彰", "省部级"),
    ("王丽敏", "吉林省“三育人”先进个人", "先进表彰", "省部级"),
    # 教学类荣誉
    ("李曼", "青年教学名师", "教学名师", "校级"),
    ("白雪梅", "最佳授课教师", "教学名师", "校级"),
    ("容哲", "十佳青年教师", "教学名师", "校级"),
    # 南岭学者
    ("肖银皓", "南岭学者", "学者头衔", "省部级"),
    ("周锋", "南岭学者", "学者头衔", "省部级"),
    ("薛耀红", "南岭学者", "学者头衔", "省部级"),
    # 竞赛 / 青年人才
    ("操慧子", "教学创新大赛校级优秀奖", "竞赛获奖", "校级"),
    ("周雅兰", "广东省高等学校优秀青年教师", "先进表彰", "省部级"),
    ("周雅兰", "广州市珠江科技新星", "先进表彰", "市级"),
    ("周雅兰", "广东高校优秀青年创新人才", "先进表彰", "省部级"),
    ("周雅兰", "广东省千百十工程培养对象", "先进表彰", "省部级"),
    ("许波", "广东省高等学校“千百十人才工程”第七批校级培养对象", "先进表彰", "校级"),
    # 优秀共产党员
    ("周立", "优秀共产党员", "党员表彰", "其他"),
    ("胡苏", "优秀共产党员", "党员表彰", "其他"),
    ("杨仁宇", "优秀共产党员", "党员表彰", "其他"),
]


async def _upsert_honor(college_id: int | None, row: tuple[str, str, str, str]) -> str:
    teacher_name, honor_title, honor_kind, level = row
    existing = await TeacherHonor.get_or_none(
        college_id=college_id,
        teacher_name=teacher_name,
        honor_title=honor_title,
        year=None,
    )
    payload: dict[str, Any] = {
        "honor_kind": honor_kind,
        "level": level,
        "source": SOURCE_TAG,
    }
    if existing:
        await existing.update_from_dict(payload)
        await existing.save()
        return "updated"
    await TeacherHonor.create(
        college_id=college_id,
        teacher_name=teacher_name,
        honor_title=honor_title,
        year=None,
        **payload,
    )
    return "created"


async def _mirror_talent(college_id: int | None) -> dict[str, int]:
    """把本批荣誉镜像到 talent 成果，供名师·头雁等模块读取。"""
    from Utils.DB.dept_major import (
        build_teacher_department_map,
        resolve_achievement_affiliation,
    )

    stats = {"talent_deleted": 0, "talent_created": 0}
    deleted = await AchievementItem.filter(
        college_id=college_id,
        section="talent",
        source_file=SOURCE_TAG,
    ).delete()
    stats["talent_deleted"] = int(deleted)

    teacher_dept_map = await build_teacher_department_map(college_id)
    for teacher_name, honor_title, honor_kind, level in HONOR_ROWS:
        dept, major = resolve_achievement_affiliation(
            leader=teacher_name,
            teacher_dept_map=teacher_dept_map,
        )
        await AchievementItem.create(
            college_id=college_id,
            section="talent",
            name=honor_title,
            category=honor_title,
            level=level,
            leader=teacher_name,
            department=dept,
            major_name=major,
            note=honor_kind,
            source_file=SOURCE_TAG,
        )
        stats["talent_created"] += 1
    return stats


async def main() -> None:
    parser = argparse.ArgumentParser(description="导入教师荣誉称号")
    parser.add_argument("--college-code", default="big-data-ai")
    parser.add_argument(
        "--skip-schema",
        action="store_true",
        help="跳过 Tortoise.generate_schemas（真数库常用，表需已由 postgres 建好）",
    )
    args = parser.parse_args()

    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    if not args.skip_schema:
        await Tortoise.generate_schemas(safe=True)

    college = await resolve_college(args.college_code)
    college_id = college.id if college else None
    print(f"college={getattr(college, 'code', None)} id={college_id}")

    created = updated = 0
    for row in HONOR_ROWS:
        action = await _upsert_honor(college_id, row)
        if action == "created":
            created += 1
        else:
            updated += 1

    talent_stats = await _mirror_talent(college_id)
    total = await TeacherHonor.filter(college_id=college_id).count()
    print(
        f"teacher_honors created={created} updated={updated} total={total}; "
        f"talent mirror deleted={talent_stats['talent_deleted']} "
        f"created={talent_stats['talent_created']}"
    )
    print("IMPORT_TEACHER_HONORS_OK")
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
