from typing import Any

from Utils.Analytics.student_derive import derive_student_dashboard
from Utils.DB.Models.dict_and_scholarship_models import StudentScholarship
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

        # 小表：学生奖学金事实 + 类型字典
        scholarship_rows: list[dict[str, Any]] = []
        try:
            awards = await StudentScholarship.filter(student_id=student_id).prefetch_related(
                "scholarship_type"
            ).order_by("-academic_year", "id")
            for item in awards:
                type_name = item.scholarship_type.name if item.scholarship_type else "奖学金"
                scholarship_rows.append(
                    {
                        "name": type_name,
                        "year": item.academic_year,
                    }
                )
        except Exception:
            # 表未迁移时不阻断驾驶舱
            scholarship_rows = []

        return derive_student_dashboard(
            latest,
            class_peers=class_peers,
            major_peers=major_peers,
            grade_peers=grade_peers,
            college_name=college_name,
            scholarships=scholarship_rows,
        )
