from tortoise import fields
from tortoise.models import Model


class Course(Model):
    """专业课程 / 课程建设。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="courses",
        null=True,
        description="开课学院",
    )
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="courses",
        null=True,
        description="所属专业",
    )
    name = fields.CharField(max_length=128, description="课程名称")
    level = fields.CharField(max_length=32, null=True, description="建设级别：国家级/省级/校级")
    leader = fields.CharField(max_length=64, null=True, description="课程负责人")
    hours = fields.IntField(null=True, description="学时")
    student_count = fields.IntField(default=0, description="选课人数")
    academic_year = fields.CharField(max_length=16, null=True, description="开课学年")
    status = fields.CharField(max_length=32, default="ongoing", description="建设状态")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "courses"
