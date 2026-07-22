from decimal import Decimal
from typing import Any

from tortoise.expressions import Q

from Utils.DB.Models.college_models import College
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


def to_float(value: Decimal | float | int | None) -> float:
    return float(value or 0)


async def resolve_college(college_code: str | None) -> College | None:
    if college_code:
        college = await College.get_or_none(code=college_code)
        if college:
            return college
    return await College.first()


async def fetch_college_records(college: College | None) -> list[StudentAcademicRecord]:
    """获取学院范围内的学籍记录（FK 或院系名称匹配）。"""

    qs = StudentAcademicRecord.all().order_by("-grade", "student_id")
    if college:
        name = college.name
        short_name = college.short_name or ""
        qs = qs.filter(
            Q(college_id=college.id)
            | Q(teaching_department__icontains=name)
            | Q(teaching_department__icontains=short_name)
        )
    return await qs


def latest_records_by_student(records: list[StudentAcademicRecord]) -> list[StudentAcademicRecord]:
    """同一学号只保留最新年级记录。"""

    latest: dict[str, StudentAcademicRecord] = {}
    for record in records:
        if record.student_id not in latest:
            latest[record.student_id] = record
    return list(latest.values())


def record_to_roster(record: StudentAcademicRecord, *, hp: list[dict], warnings: list[dict]) -> dict[str, Any]:
    """转为前端花名册结构（不含敏感字段）。"""

    warn = warnings[0] if warnings else None
    level_map = {"high": "红色预警", "medium": "黄色预警", "low": "蓝色预警"}
    return {
        "id": str(record.id),
        "name": record.name or "",
        "gender": record.gender or "未知",
        "studentId": record.student_id,
        "className": record.class_name or "",
        "major": record.major_name or "",
        "grade": f"{record.grade}级" if record.grade else "",
        "counselor": record.counselor or "",
        "dorm": "",
        "gpa": to_float(record.average_credit_gpa),
        "political": "",
        "phone": "",
        "hp": [t["dimension"] for t in hp],
        "warnings": [w["type"] for w in warnings],
        "highlight": hp[0]["highlight"] if hp else "",
        "warnReason": warn["reason"] if warn else None,
        "warnLevel": level_map.get(warn["level"], "蓝色预警") if warn else None,
    }
