import asyncio
import os
import sys
from pathlib import Path

from tortoise import Tortoise

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app.importers import import_student_academic_records_from_xlsx  # noqa: E402


async def import_xlsx_to_postgresql(xlsx_path: str) -> None:
    """传入 xlsx 文件路径，直接把每一行写入 PostgreSQL。"""

    await Tortoise.init(
        config={
            "connections": {
                "default": os.getenv(
                    "POSTGRES_DSN",
                    "postgres://root:123456@192.168.8.110:5432/studentmodelingdata",
                )
            },
            "apps": {
                "models": {
                    "models": ["app.models"],
                    "default_connection": "default",
                }
            },
        }
    )
    try:
        result = await import_student_academic_records_from_xlsx(
            xlsx_path,
            update_existing=True,
        )
        print(result)
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(import_xlsx_to_postgresql("Datas/25级学籍成绩合并_每人一行.xlsx"))
