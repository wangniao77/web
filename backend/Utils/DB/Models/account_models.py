from tortoise import fields
from tortoise.models import Model


class Account(Model):
    """系统账号。"""

    ROLE_STUDENT = "student"
    ROLE_TEACHER = "teacher"
    ROLE_ADMIN = "admin"
    ROLE_SUPERADMIN = "superadmin"

    id = fields.IntField(pk=True)
    username = fields.CharField(max_length=64, unique=True, description="登录名")
    password_hash = fields.CharField(max_length=255, description="密码哈希")
    role = fields.CharField(max_length=32, description="角色：student/teacher/admin/superadmin")
    display_name = fields.CharField(max_length=64, null=True, description="显示名称")
    student_id = fields.CharField(max_length=32, null=True, description="关联学号（学生角色）")
    college = fields.ForeignKeyField(
        "models.College",
        related_name="accounts",
        null=True,
        description="关联学院（教师/管理员）",
    )
    is_active = fields.BooleanField(default=True, description="是否启用")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "accounts"
