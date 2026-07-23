"""Inspect PostgreSQL schema and row counts."""
import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from tortoise import Tortoise

from core.config import get_settings


async def main() -> None:
    settings = get_settings()
    dsn = settings.postgres_dsn
    safe = dsn.split("@")[-1] if "@" in dsn else dsn
    print("target:", safe)

    await Tortoise.init(
        db_url=dsn,
        modules={"models": ["Utils.DB.Models"]},
        _enable_global_fallback=True,
    )
    conn = Tortoise.get_connection("default")
    tables = await conn.execute_query_dict(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1"
    )
    print("TABLES", [t["tablename"] for t in tables])
    for t in [
        "student_academic_records",
        "colleges",
        "key_tasks",
        "majors",
        "classes",
        "courses",
        "school_events",
    ]:
        try:
            r = await conn.execute_query_dict(f"SELECT COUNT(*) AS c FROM {t}")
            print(f"{t}: {r[0]['c']}")
        except Exception as e:
            print(f"{t}: ERR {e}")
    cols = await conn.execute_query_dict(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='student_academic_records' ORDER BY ordinal_position"
    )
    print("student_cols", [c["column_name"] for c in cols])
    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
