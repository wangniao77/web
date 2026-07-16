from tortoise import fields
from tortoise.models import Model


class SchoolClass(Model):
    """班级主数据。"""

    id = fields.IntField(pk=True)
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="classes",
        description="所属专业",
    )
    grade = fields.IntField(description="年级，如 2021")
    name = fields.CharField(max_length=128, description="班级名称，如 计科2101")
    counselor_name = fields.CharField(max_length=64, null=True, description="辅导员")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "classes"
        unique_together = (("major_id", "name"),)
