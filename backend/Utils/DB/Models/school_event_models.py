from tortoise import fields
from tortoise.models import Model


class SchoolEvent(Model):
    """学校发展大事 / 重点事项。"""

    id = fields.IntField(pk=True)
    category = fields.CharField(
        max_length=32,
        description="类别：teaching/research/talent/service/international/safety",
    )
    title = fields.CharField(max_length=255, description="标题")
    summary = fields.TextField(null=True, description="摘要")
    event_date = fields.DateField(description="事件日期")
    status = fields.CharField(
        max_length=32,
        default="ongoing",
        description="状态：completed/ongoing/planned",
    )
    needs_attention = fields.BooleanField(default=False, description="是否需要关注")
    lead_dept = fields.CharField(max_length=128, null=True, description="牵头部门")
    next_action = fields.TextField(null=True, description="下一步行动")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "school_events"
        indexes = (("category", "event_date"),)
