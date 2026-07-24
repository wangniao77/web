from tortoise import fields
from tortoise.models import Model


class EmploymentRecord(Model):
    """就业去向（来自就业信息 Excel）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="employment_records",
        null=True,
        description="所属学院",
    )
    student_id = fields.CharField(max_length=32, index=True, description="学号")
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="employment_records",
        null=True,
        source_field="student_pk",
        description="规范化主档 FK",
    )
    name = fields.CharField(max_length=64, null=True, description="姓名")
    education_level = fields.CharField(max_length=32, null=True, description="学历（本科/硕士等）")
    education_status = fields.CharField(max_length=64, null=True, description="学历状况（如本科生毕业）")
    major_name = fields.CharField(max_length=128, null=True, description="专业名称（就业表）")
    class_name = fields.CharField(max_length=128, null=True, description="班级名称（就业表）")
    destination = fields.CharField(max_length=128, null=True, description="毕业去向")
    unit_name = fields.CharField(max_length=255, null=True, description="单位/院校名称")
    unit_type = fields.CharField(max_length=128, null=True, description="单位类型")
    industry = fields.CharField(max_length=128, null=True, description="所属行业")
    region = fields.CharField(max_length=128, null=True, description="所属地区")
    job_title = fields.CharField(max_length=255, null=True, description="岗位/专业名称")
    occupation_type = fields.CharField(max_length=128, null=True, description="职业类型")
    salary = fields.CharField(max_length=64, null=True, description="薪酬")
    relevance = fields.CharField(max_length=64, null=True, description="专业与就业相关度")
    signed_at = fields.CharField(max_length=64, null=True, description="签约/入职时间原文")
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "employment_records"
        unique_together = (("student_id",),)


class ResearchProject(Model):
    """科研项目（纵向/横向）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="research_projects",
        null=True,
    )
    kind = fields.CharField(max_length=32, description="vertical|horizontal")
    project_no = fields.CharField(max_length=128, null=True, index=True)
    title = fields.CharField(max_length=512)
    leader = fields.CharField(max_length=64, null=True)
    level = fields.CharField(max_length=64, null=True)
    category = fields.CharField(max_length=128, null=True)
    main_type = fields.CharField(max_length=128, null=True)
    start_date = fields.CharField(max_length=64, null=True)
    funding = fields.CharField(max_length=64, null=True)
    source_org = fields.CharField(max_length=255, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "research_projects"


class ResearchPaper(Model):
    """科研论文。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="research_papers",
        null=True,
    )
    category = fields.CharField(max_length=64, null=True)
    title = fields.CharField(max_length=512)
    authors = fields.CharField(max_length=255, null=True)
    level = fields.CharField(max_length=64, null=True)
    published_at = fields.CharField(max_length=64, null=True)
    venue = fields.CharField(max_length=255, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "research_papers"


class ResearchIp(Model):
    """知识产权/专利。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="research_ips",
        null=True,
    )
    patent_type = fields.CharField(max_length=64, null=True)
    title = fields.CharField(max_length=512)
    inventor = fields.CharField(max_length=64, null=True)
    patent_no = fields.CharField(max_length=128, null=True, index=True)
    grant_date = fields.CharField(max_length=64, null=True)
    status = fields.CharField(max_length=64, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "research_ips"


class ThesisAdvisor(Model):
    """毕业设计指导关系。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="thesis_advisors",
        null=True,
    )
    student_id = fields.CharField(max_length=32, index=True)
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="thesis_advisors",
        null=True,
        source_field="student_pk",
        description="规范化主档 FK",
    )
    student_name = fields.CharField(max_length=64, null=True)
    major_name = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=128, null=True)
    advisor_name = fields.CharField(max_length=64, null=True)
    advisor_no = fields.CharField(max_length=64, null=True)
    status = fields.CharField(max_length=64, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "thesis_advisors"
        unique_together = (("student_id",),)
