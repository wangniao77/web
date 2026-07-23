from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# backend 根目录，用于定位 .env
BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """应用配置，从 backend/.env 读取。"""

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "数字建模系统"
    app_debug: bool = False

    postgres_dsn: str = (
        "postgres://root:123456@192.168.8.110:5432/studentmodelingdata"
    )

    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440

    superadmin_username: str = "superadmin"
    superadmin_password: str = "superadmin123"
    cors_origins: str = (
        "http://localhost:5173,http://127.0.0.1:5173,"
        "http://localhost:5174,http://127.0.0.1:5174"
    )

    # OpenViking 上下文库
    openviking_url: str = "http://127.0.0.1:1933"
    openviking_api_key: str = ""

    # LLM（OpenAI 兼容；默认指向阿里云百炼）
    llm_api_base: str = "https://dashscope.aliyuncs.com/compatible-mode/v1"
    llm_api_key: str = ""
    llm_model: str = "deepseek-v4-flash"


@lru_cache
def get_settings() -> Settings:
    return Settings()
