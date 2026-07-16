from fastapi import APIRouter

from Routers.Models.resp.common_model import ApiResponse, ok
from Services.university_service import UniversityService

router = APIRouter(prefix="/university", tags=["学校大屏"])
university_service = UniversityService()


@router.get("/overview", response_model=ApiResponse)
async def overview() -> ApiResponse:
    return ok(await university_service.get_overview())


@router.get("/tasks/detail", response_model=ApiResponse)
async def tasks_detail() -> ApiResponse:
    return ok(await university_service.get_tasks_detail())


@router.get("/employment/detail", response_model=ApiResponse)
async def employment_detail() -> ApiResponse:
    return ok(await university_service.get_employment_detail())


@router.get("/events/detail", response_model=ApiResponse)
async def events_detail() -> ApiResponse:
    return ok(await university_service.get_events_detail())


@router.get("/research/detail", response_model=ApiResponse)
async def research_detail() -> ApiResponse:
    return ok(await university_service.get_research_detail())


@router.get("/disciplines/detail", response_model=ApiResponse)
async def discipline_detail() -> ApiResponse:
    return ok(await university_service.get_discipline_detail())


@router.get("/academic-risk/detail", response_model=ApiResponse)
async def academic_risk_detail() -> ApiResponse:
    return ok(await university_service.get_academic_risk_detail())


@router.get("/metrics/detail", response_model=ApiResponse)
async def metrics_detail() -> ApiResponse:
    return ok(await university_service.get_metrics_detail())
