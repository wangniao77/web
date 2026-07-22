from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from Routers import (
    admin_router,
    agent_router,
    auth_router,
    college_router,
    health_router,
    student_router,
    university_router,
)
from Services.auth_service import AuthService
from Utils.Admin.bootstrap import init_admin_registry
from core.config import get_settings
from core.database import close_db, init_db
from core.logger import logger

settings = get_settings()
auth_service = AuthService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("正在初始化数据库连接…")
    init_admin_registry()
    await init_db()
    await auth_service.ensure_superadmin()
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

origins = [item.strip() for item in settings.cors_origins.split(",") if item.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router.router, prefix="/api")
app.include_router(auth_router.router, prefix="/api/v1")
app.include_router(admin_router.router, prefix="/api/v1")
app.include_router(college_router.router, prefix="/api/v1")
app.include_router(university_router.router, prefix="/api/v1")
app.include_router(student_router.router, prefix="/api/v1")
app.include_router(agent_router.router, prefix="/api/v1")
