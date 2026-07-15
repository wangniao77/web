from typing import Any

from Utils.Analytics.student_derive import derive_student_dashboard
from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


class StudentService:
    async def get_dashboard(self, student_id: str) -> dict[str, Any]:
        records = await StudentAcademicRecord.filter(student_id=student_id).order_by("-grade")
        if not records:
            raise LookupError("学生不存在")

        latest = records[0]
        college = await latest.college

        grade = latest.grade
        major_name = latest.major_name or ""
        class_name = latest.class_name or ""

        grade_peers: list[StudentAcademicRecord] = []
        major_peers: list[StudentAcademicRecord] = []
        class_peers: list[StudentAcademicRecord] = []

        if grade is not None:
            grade_peers = await StudentAcademicRecord.filter(grade=grade).all()
            if major_name:
                major_peers = [p for p in grade_peers if (p.major_name or "") == major_name]
            if class_name:
                class_peers = [p for p in grade_peers if (p.class_name or "") == class_name]

        if not grade_peers:
            grade_peers = [latest]
        if not major_peers:
            major_peers = [latest]
        if not class_peers:
            class_peers = [latest]

        college_name = college.name if college else (latest.teaching_department or None)
        return derive_student_dashboard(
            latest,
            class_peers=class_peers,
            major_peers=major_peers,
            grade_peers=grade_peers,
            college_name=college_name,
        )
