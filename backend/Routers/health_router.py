from fastapi import APIRouter

from Routers.Models.resp.common_model import ApiResponse, HealthResp, ok
from Services.health_service import HealthService

router = APIRouter(tags=["健康检查"])
health_service = HealthService()


@router.get("/health", response_model=ApiResponse[HealthResp])
async def health_check() -> ApiResponse[HealthResp]:
    """服务健康检查。"""

    data = await health_service.get_health()
    return ok(data)
