from tortoise import fields
from tortoise.models import Model


class Major(Model):
    """专业主数据。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="majors",
        description="所属学院",
    )
    code = fields.CharField(max_length=64, null=True, description="专业编码")
    name = fields.CharField(max_length=128, description="专业名称")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "majors"
        unique_together = (("college_id", "name"),)
