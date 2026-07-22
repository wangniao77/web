from tortoise import Tortoise

from core.config import get_settings

settings = get_settings()

TORTOISE_ORM = {
    "connections": {
        "default": settings.postgres_dsn,
    },
    "apps": {
        "models": {
            "models": [
                "Utils.DB.Models",
                "aerich.models",
            ],
            "default_connection": "default",
        }
    },
}


async def init_db(*, generate_schema: bool = False) -> None:
    """初始化 Tortoise；首次开发调试时可临时开启 generate_schema。"""

    # Tortoise 1.1+ 在 lifespan 初始化、请求任务查询时分属不同 context，需开启全局 fallback
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    if generate_schema:
        await Tortoise.generate_schemas(safe=True)


async def close_db() -> None:
    await Tortoise.close_connections()
