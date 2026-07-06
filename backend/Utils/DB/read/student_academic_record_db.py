from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


async def get_by_student_id(student_id: str) -> StudentAcademicRecord | None:
    """按学号查询学籍记录。"""

    return await StudentAcademicRecord.filter(student_id=student_id).first()


async def list_by_grade(grade: int, *, offset: int = 0, limit: int = 20) -> list[StudentAcademicRecord]:
    """按年级分页查询学籍记录。"""

    return await StudentAcademicRecord.filter(grade=grade).offset(offset).limit(limit).all()
