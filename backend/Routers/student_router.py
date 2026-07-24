from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from Routers.Models.resp.common_model import ApiResponse, ok
from Services.student_service import StudentService
from Utils.Excel.export_workbook import build_workbook

router = APIRouter(prefix="/student", tags=["学生大屏"])
student_service = StudentService()


@router.get("/{student_id}/dashboard", response_model=ApiResponse)
async def student_dashboard(student_id: str) -> ApiResponse:
    try:
        return ok(await student_service.get_dashboard(student_id))
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/{student_id}/export.xlsx")
async def student_dashboard_export(student_id: str) -> Response:
    """将学生驾驶舱关键数据导出为 Excel。"""
    try:
        data = await student_service.get_dashboard(student_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc

    profile = data.get("profile") or {}
    academic = data.get("academic") or {}
    credit = data.get("creditProgress") or {}
    growth = data.get("growthOverview") or {}
    scholarships = data.get("scholarships") or []
    attention = data.get("attention") or []
    competition = data.get("competition") or {}
    highlights = competition.get("highlights") or []

    sheets = [
        {
            "name": "基本信息",
            "headers": ["字段", "值"],
            "rows": [
                ["姓名", profile.get("name")],
                ["学号", profile.get("studentId")],
                ["学院", profile.get("college")],
                ["专业", profile.get("major")],
                ["班级", profile.get("className")],
                ["辅导员", profile.get("counselor")],
            ],
        },
        {
            "name": "学业指标",
            "headers": ["指标", "值"],
            "rows": [
                ["GPA", academic.get("gpa")],
                ["专排", f"{academic.get('majorRank')}/{academic.get('majorTotal')}"],
                ["已修学分", credit.get("earned")],
                ["应修学分", credit.get("required")],
                ["综合指数", growth.get("growthIndex")],
            ],
        },
        {
            "name": "奖学金",
            "headers": ["学年", "奖学金名称"],
            "rows": [[s.get("year"), s.get("name")] for s in scholarships],
        },
        {
            "name": "预警关注",
            "headers": ["类别", "等级", "说明"],
            "rows": [
                [a.get("category"), a.get("levelLabel") or a.get("level"), a.get("label")]
                for a in attention
            ],
        },
        {
            "name": "竞赛获奖",
            "headers": ["名称", "明细"],
            "rows": [[h.get("label"), h.get("detail") or ""] for h in highlights],
        },
    ]
    content = build_workbook(sheets)
    filename = f"student_{student_id}_dashboard.xlsx"
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
