from tortoise import fields
from tortoise.models import Model


class DictScholarshipType(Model):
    """奖学金类型字典小表：类型可扩展，不与业务事实混写。"""

    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=64, unique=True, description="类型编码，如 national / national-inspire / school-1")
    name = fields.CharField(max_length=128, description="类型名称，如 国家奖学金")
    level = fields.CharField(max_length=32, description="等级：国家级/省部级/校级/院级")
    amount_hint = fields.DecimalField(max_digits=12, decimal_places=2, null=True, description="参考金额（元）")
    sort_order = fields.IntField(default=0, description="展示排序，越小越靠前")
    is_active = fields.BooleanField(default=True, description="是否启用")
    remark = fields.CharField(max_length=255, null=True, description="备注")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "dict_scholarship_types"


class StudentScholarship(Model):
    """学生奖学金事实小表：每人每学年每类型一条可扩展记录。"""

    id = fields.IntField(pk=True)
    student_id = fields.CharField(max_length=32, index=True, description="学号")
    academic_year = fields.CharField(max_length=32, description="学年，如 2024-2025")
    scholarship_type = fields.ForeignKeyField(
        "models.DictScholarshipType",
        related_name="awards",
        description="奖学金类型（字典小表）",
    )
    amount = fields.DecimalField(max_digits=12, decimal_places=2, null=True, description="实发金额（元）")
    award_date = fields.DateField(null=True, description="获评日期")
    source = fields.CharField(max_length=64, null=True, description="数据来源：学工/教务/自填")
    remark = fields.CharField(max_length=255, null=True, description="备注")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_scholarships"
        unique_together = (("student_id", "academic_year", "scholarship_type_id"),)


class DictWarningCategory(Model):
    """预警类别字典小表：心理/学业/就业等可配置扩展。"""

    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=64, unique=True, description="类别编码")
    name = fields.CharField(max_length=64, description="类别名称")
    sort_order = fields.IntField(default=0)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "dict_warning_categories"


class DictHighPotentialTag(Model):
    """高潜标签字典小表：学业高潜/竞赛高潜等可配置扩展。"""

    id = fields.IntField(pk=True)
    code = fields.CharField(max_length=64, unique=True, description="标签编码")
    name = fields.CharField(max_length=64, description="标签名称")
    sort_order = fields.IntField(default=0)
    is_active = fields.BooleanField(default=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "dict_high_potential_tags"
