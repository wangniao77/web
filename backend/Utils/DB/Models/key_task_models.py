from tortoise import fields
from tortoise.models import Model


class KeyTask(Model):
    """学院 / 学校年度重点任务。"""

    SCOPE_COLLEGE = "college"
    SCOPE_UNIVERSITY = "university"

    id = fields.IntField(pk=True)
    scope = fields.CharField(max_length=16, description="范围：college / university")
    college = fields.ForeignKeyField(
        "models.College",
        related_name="key_tasks",
        null=True,
        description="学院级任务所属学院",
    )
    name = fields.CharField(max_length=255, description="任务名称")
    description = fields.TextField(null=True, description="任务描述")
    progress = fields.DecimalField(max_digits=5, decimal_places=2, default=0, description="完成进度 0-100")
    status = fields.CharField(
        max_length=32,
        default="ongoing",
        description="状态：ongoing/completed/delayed/attention/overdue",
    )
    lead_dept = fields.CharField(max_length=128, null=True, description="牵头部门")
    deadline = fields.DateField(null=True, description="截止日期")
    risk_level = fields.CharField(max_length=16, null=True, description="风险等级")
    planned_node = fields.CharField(max_length=128, null=True, description="计划节点")
    current_issue = fields.TextField(null=True, description="当前问题")
    next_action = fields.TextField(null=True, description="下一步行动")
    academic_year = fields.CharField(max_length=16, null=True, description="学年")
    milestones = fields.JSONField(default=list, description="里程碑列表 [{label, done}]")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "key_tasks"
        indexes = (("scope", "academic_year"),)
