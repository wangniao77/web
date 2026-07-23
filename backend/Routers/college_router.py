from fastapi import APIRouter, Query

from Routers.Models.resp.common_model import ApiResponse, ok
from Services.college_service import CollegeService

router = APIRouter(prefix="/college", tags=["学院大屏"])
college_service = CollegeService()


@router.get("/overview/hub", response_model=ApiResponse)
async def overview_hub(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_hub(college_id=collegeId))


@router.get("/tasks/annual-progress", response_model=ApiResponse)
async def key_tasks(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_key_tasks(college_id=collegeId))


@router.get("/tasks/detail", response_model=ApiResponse)
async def key_tasks_detail(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_key_tasks_detail(college_id=collegeId))


@router.get("/students/overview", response_model=ApiResponse)
async def student_overview(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_student_overview(college_id=collegeId))


@router.get("/teaching/overview", response_model=ApiResponse)
async def teaching_overview(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_teaching_overview(college_id=collegeId))


@router.get("/teaching/courses", response_model=ApiResponse)
async def teaching_courses(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_teaching_courses(college_id=collegeId))


@router.get("/research/overview", response_model=ApiResponse)
async def research_overview(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_research_overview(college_id=collegeId))


@router.get("/research/platforms", response_model=ApiResponse)
async def research_platforms(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_research_platforms(college_id=collegeId))


@router.get("/warnings/overview", response_model=ApiResponse)
async def warning_overview(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_warning_overview(college_id=collegeId))


@router.get("/warnings/{warning_type}", response_model=ApiResponse)
async def warning_detail(warning_type: str, collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_warning_detail(warning_type, college_id=collegeId))


@router.get("/analytics/academic-risk", response_model=ApiResponse)
async def academic_risk_aggregate(
    collegeId: str | None = None,
    warningType: str | None = None,
) -> ApiResponse:
    """学业风险聚合（年级/专业），不含花名册 PII。"""
    return ok(
        await college_service.get_academic_risk_aggregate(
            college_id=collegeId,
            warning_type=warningType,
        )
    )


@router.get("/high-potential/overview", response_model=ApiResponse)
async def high_potential_overview(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_high_potential_overview(college_id=collegeId))


@router.get("/high-potential/roster", response_model=ApiResponse)
async def high_potential_roster(
    collegeId: str | None = None,
    moduleId: str | None = None,
) -> ApiResponse:
    return ok(await college_service.get_hp_roster(college_id=collegeId, module_id=moduleId))


@router.get("/warnings/{warning_type}/roster", response_model=ApiResponse)
async def warning_roster(warning_type: str, collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_warning_roster(warning_type, college_id=collegeId))


@router.get("/students/employment-detail", response_model=ApiResponse)
async def employment_detail(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_employment_detail(college_id=collegeId))


@router.get("/students/employment-roster", response_model=ApiResponse)
async def employment_roster(collegeId: str | None = None) -> ApiResponse:
    return ok(await college_service.get_employment_roster(college_id=collegeId))
