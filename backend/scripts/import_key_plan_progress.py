"""导入《学院重点工作进展.xlsx》到 key_tasks。

用法（在 backend 目录）:
  python scripts/import_key_plan_progress.py
  python scripts/import_key_plan_progress.py --file "D:/UGit/data/学院重点工作进展.xlsx"
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from decimal import Decimal
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND))
sys.path.insert(0, str(SCRIPTS))

from tortoise import Tortoise
from tortoise.transactions import in_transaction

from core.config import get_settings
from core.database import TORTOISE_ORM
from parse_key_plan_xlsx import parse_key_plan_xlsx
from Utils.DB.Models import College, KeyTask


DEFAULT_XLSX = Path(r"D:\UGit\data\学院重点工作进展.xlsx")
FRONTEND_MOCK = BACKEND.parent / "frontend" / "src" / "mock" / "college" / "key-plan-progress.generated.json"


async def ensure_college() -> College:
    college = await College.get_or_none(code="big-data-ai")
    if college:
        return college
    return await College.create(code="big-data-ai", name="大数据与人工智能学院")


def _status_to_db(status: str) -> str:
    if status in {"completed", "ongoing", "attention", "delayed", "overdue"}:
        return status
    return "ongoing"


async def import_key_plan(path: Path) -> dict:
    data = parse_key_plan_xlsx(path)
    college = await ensure_college()

    async with in_transaction():
        deleted = await KeyTask.filter(scope=KeyTask.SCOPE_COLLEGE, college_id=college.id).delete()
        created = 0
        for group in data["groups"]:
            for metric in group["metrics"]:
                materials = metric.get("materials") or []
                await KeyTask.create(
                    scope=KeyTask.SCOPE_COLLEGE,
                    college=college,
                    name=metric["name"],
                    description=metric.get("milestone") or "",
                    progress=Decimal(str(metric.get("progress") or 0)),
                    status=_status_to_db(metric.get("status") or "attention"),
                    lead_dept=metric.get("owner") or group.get("owner") or "",
                    academic_year=data.get("year") or "2025",
                    category=metric.get("category") or group["id"],
                    task_type=metric.get("taskType") or group["title"],
                    project_level=metric.get("projectLevel") or "学院重点",
                    major_direction=metric.get("majorDirection") or group["title"],
                    target=metric.get("target") or "",
                    actual=metric.get("actual") or "",
                    unit=metric.get("unit") or "",
                    materials="；".join(materials) if isinstance(materials, list) else str(materials or ""),
                    planned_node=metric.get("deadline") or "",
                    milestones=[
                        {"label": s, "done": metric.get("status") == "completed"}
                        for s in (materials[:5] if isinstance(materials, list) else [])
                    ],
                    extra={
                        "groupId": group["id"],
                        "groupTitle": group["title"],
                        "groupSubtitle": group.get("subtitle") or "",
                        "sourceFile": data.get("sourceFile") or path.name,
                    },
                )
                created += 1

    FRONTEND_MOCK.parent.mkdir(parents=True, exist_ok=True)
    FRONTEND_MOCK.write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    return {
        "deleted": deleted,
        "created": created,
        "overview": data["overview"],
        "groups": [
            {"id": g["id"], "title": g["title"], "count": len(g["metrics"])} for g in data["groups"]
        ],
        "mockJson": str(FRONTEND_MOCK),
    }


async def main() -> None:
    parser = argparse.ArgumentParser(description="导入学院重点工作进展 Excel")
    parser.add_argument("--file", type=Path, default=DEFAULT_XLSX, help="Excel 路径")
    args = parser.parse_args()
    if not args.file.exists():
        raise SystemExit(f"file not found: {args.file}")

    settings = get_settings()
    print("DSN host/db:", settings.postgres_dsn.split("@")[-1])
    print("file:", args.file)

    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    try:
        result = await import_key_plan(args.file)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
