from typing import Any

from Utils.DB.Models.student_academic_record_models import StudentAcademicRecord


async def create_record(**kwargs: Any) -> StudentAcademicRecord:
    """创建学籍记录。"""

    return await StudentAcademicRecord.create(**kwargs)


async def update_record(record: StudentAcademicRecord, **kwargs: Any) -> StudentAcademicRecord:
    """更新学籍记录。"""

    for key, value in kwargs.items():
        setattr(record, key, value)
    await record.save()
    return record
