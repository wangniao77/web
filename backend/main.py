from contextlib import asynccontextmanager

from fastapi import FastAPI

from Routers import health_router
from core.config import get_settings
from core.database import close_db, init_db
from core.logger import logger

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时初始化数据库，关闭时释放连接。"""

    logger.info("正在初始化数据库连接…")
    await init_db()
    logger.info("数据库连接已就绪")
    yield
    logger.info("正在关闭数据库连接…")
    await close_db()
    logger.info("应用已停止")


app = FastAPI(
    title=settings.app_name,
    debug=settings.app_debug,
    lifespan=lifespan,
)

app.include_router(health_router.router, prefix="/api")
