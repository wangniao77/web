from tortoise import fields
from tortoise.models import Model


class College(Model):
    """学院主数据。"""

    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=64, unique=True, description="学院编码，如 big-data-ai")
    name = fields.CharField(max_length=128, description="学院名称")
    short_name = fields.CharField(max_length=64, null=True, description="学院简称")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "colleges"
