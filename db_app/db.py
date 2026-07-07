import os

from tortoise import Tortoise


POSTGRES_DSN = os.getenv(
    "POSTGRES_DSN",
    "postgres://root:123456@192.168.8.127:5432/studentmodelingdata",
)

TORTOISE_ORM = {
    "connections": {
        "default": POSTGRES_DSN
    },
    "apps": {
        "models": {
            "models": [
                "app.models",
                "aerich.models"
            ],
            "default_connection": "default",
        }
    },
}


async def init_db(*, generate_schema: bool = False) -> None:
    """初始化 Tortoise；首次开发调试时可临时开启 generate_schema。"""

    await Tortoise.init(config=TORTOISE_ORM)
    if generate_schema:
        await Tortoise.generate_schemas(safe=True)


async def close_db() -> None:
    await Tortoise.close_connections()
