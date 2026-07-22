from fastapi import APIRouter, HTTPException

from Routers.Models.resp.common_model import ApiResponse, ok
from Services.student_service import StudentService

router = APIRouter(prefix="/student", tags=["学生大屏"])
student_service = StudentService()


@router.get("/{student_id}/dashboard", response_model=ApiResponse)
async def student_dashboard(student_id: str) -> ApiResponse:
    try:
        return ok(await student_service.get_dashboard(student_id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
