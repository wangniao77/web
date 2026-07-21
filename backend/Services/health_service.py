from Routers.Models.resp.common_model import HealthResp
from core.config import get_settings


class HealthService:
    """健康检查业务层。"""

    async def get_health(self) -> HealthResp:
        settings = get_settings()
        return HealthResp(status="ok", app_name=settings.app_name)
