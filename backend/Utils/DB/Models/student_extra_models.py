"""学生补充事实表：干部任职、竞赛获奖、课题、论文、课时。"""

from tortoise import fields
from tortoise.models import Model


class StudentLeadershipRole(Model):
    """班委 / 学生会等干部任职。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="leadership_roles",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="leadership_roles",
        null=True,
        source_field="student_pk",
    )
    student_id = fields.CharField(max_length=32, null=True, index=True, description="学号")
    name = fields.CharField(max_length=64, null=True)
    role_kind = fields.CharField(max_length=32, description="class_committee|student_org")
    role_title = fields.CharField(max_length=128, description="职务")
    department = fields.CharField(max_length=128, null=True, description="所属部门（学生会等）")
    class_name = fields.CharField(max_length=128, null=True)
    campus = fields.CharField(max_length=64, null=True)
    academic_year = fields.CharField(max_length=32, null=True, description="学年或年级，如 2023级/2026-2027")
    phone = fields.CharField(max_length=64, null=True, description="手机")
    address = fields.CharField(max_length=512, null=True, description="家庭住址")
    dormitory = fields.CharField(max_length=128, null=True, description="宿舍号")
    political_status = fields.CharField(max_length=64, null=True)
    gender = fields.CharField(max_length=16, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_leadership_roles"
        indexes = (("college_id", "role_kind"), ("student_id",))


class CompetitionAward(Model):
    """学生竞赛获奖明细。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="competition_awards",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="competition_awards",
        null=True,
        source_field="student_pk",
    )
    student_id = fields.CharField(max_length=32, index=True)
    name = fields.CharField(max_length=64, null=True)
    major_name = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=128, null=True)
    contest_name = fields.CharField(max_length=512)
    organizer = fields.CharField(max_length=255, null=True)
    contest_category = fields.CharField(max_length=128, null=True, description="竞赛类别，如学术科技")
    award_level = fields.CharField(max_length=64, null=True, description="国家级/省部级/校级")
    award_rank = fields.CharField(max_length=64, null=True, description="一等奖等")
    contest_type = fields.CharField(max_length=128, null=True)
    awarded_on = fields.CharField(max_length=64, null=True)
    team_size = fields.IntField(null=True)
    teammates = fields.TextField(null=True)
    advisor = fields.CharField(max_length=255, null=True)
    note = fields.CharField(max_length=255, null=True)
    member_role = fields.CharField(
        max_length=16,
        default="primary",
        description="primary|teammate",
    )
    primary_student_id = fields.CharField(
        max_length=32,
        null=True,
        index=True,
        description="主获奖人学号（队友行指向主记录）",
    )
    dedupe_key = fields.CharField(
        max_length=640,
        null=True,
        description="幂等键：college|sid|contest|date|rank|role",
    )
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "competition_awards"
        unique_together = (("college_id", "dedupe_key"),)
        indexes = (("college_id", "award_level"), ("student_id",))


class StudentProject(Model):
    """学生课题 / 大创 / 双百等。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="student_projects",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="student_projects",
        null=True,
        source_field="student_pk",
    )
    student_id = fields.CharField(max_length=32, null=True, index=True, description="负责人学号（可空）")
    name = fields.CharField(max_length=64, null=True, description="负责人姓名")
    project_type = fields.CharField(max_length=128, null=True)
    project_category = fields.CharField(max_length=64, null=True, description="重点/一般")
    project_level = fields.CharField(max_length=64, null=True, description="国家级/省级/校级")
    title = fields.CharField(max_length=512)
    leader = fields.CharField(max_length=64, null=True)
    members = fields.TextField(null=True)
    advisor = fields.CharField(max_length=255, null=True)
    result_grade = fields.CharField(max_length=64, null=True, description="结项等级")
    member_role = fields.CharField(
        max_length=16,
        default="leader",
        description="leader|member",
    )
    dedupe_key = fields.CharField(max_length=640, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "student_projects"
        unique_together = (("college_id", "dedupe_key"),)
        indexes = (("college_id", "project_level"),)


class StudentPaper(Model):
    """学生发表论文。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="student_papers",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="student_papers",
        null=True,
        source_field="student_pk",
    )
    student_id = fields.CharField(max_length=32, index=True)
    name = fields.CharField(max_length=64, null=True)
    title = fields.CharField(max_length=512)
    journal = fields.CharField(max_length=255, null=True)
    published_on = fields.CharField(max_length=64, null=True)
    author_order = fields.CharField(max_length=32, null=True)
    indexed_in = fields.CharField(max_length=128, null=True, description="EI/SCI 等")
    dedupe_key = fields.CharField(max_length=640, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "student_papers"
        unique_together = (("college_id", "dedupe_key"),)
        indexes = (("college_id", "student_id"),)


class TeachingCourseHour(Model):
    """学期课时事实（课程-教师-班级）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="teaching_course_hours",
        null=True,
    )
    term = fields.CharField(max_length=32, description="如 2025-2026-1")
    course_name = fields.CharField(max_length=255)
    teacher_name = fields.CharField(max_length=64, null=True)
    teacher_department = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=255, null=True)
    total_hours = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    weekly_hours = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "teaching_course_hours"
        indexes = (("college_id", "term"),)


class StudentInternship(Model):
    """学生实习记录（毕业实习/专业实习等）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="student_internships",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="internships",
        null=True,
        source_field="student_pk",
    )
    student_id = fields.CharField(max_length=32, index=True)
    name = fields.CharField(max_length=64, null=True)
    enrollment_year = fields.IntField(null=True)
    department = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=128, null=True)
    major_name = fields.CharField(max_length=128, null=True)
    course_name = fields.CharField(max_length=255, null=True)
    course_code = fields.CharField(max_length=64, null=True)
    credits = fields.CharField(max_length=32, null=True)
    internship_type = fields.CharField(max_length=64, null=True, description="毕业实习/专业实习")
    organization_form = fields.CharField(max_length=64, null=True, description="集中/分散")
    practice_mode = fields.CharField(max_length=64, null=True, description="现场实习等")
    academic_year = fields.CharField(max_length=32, null=True)
    school_advisor = fields.CharField(max_length=64, null=True)
    company_name = fields.CharField(max_length=255, null=True)
    company_credit_code = fields.CharField(max_length=64, null=True)
    region = fields.CharField(max_length=128, null=True)
    address = fields.CharField(max_length=512, null=True, description="实习详细地址")
    job_title = fields.CharField(max_length=255, null=True)
    start_date = fields.CharField(max_length=64, null=True)
    end_date = fields.CharField(max_length=64, null=True)
    days = fields.IntField(null=True)
    salary = fields.CharField(max_length=64, null=True)
    company_mentor = fields.CharField(max_length=64, null=True)
    has_liability_insurance = fields.CharField(max_length=16, null=True)
    has_accident_insurance = fields.CharField(max_length=16, null=True)
    safety_trained = fields.CharField(max_length=16, null=True)
    signed_tripartite = fields.CharField(max_length=16, null=True)
    is_base = fields.CharField(max_length=16, null=True, description="是否校级及以上基地")
    audit_status = fields.CharField(max_length=64, null=True)
    snapshot_month = fields.CharField(max_length=16, null=True, description="统计月份，如 2026-04")
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_internships"
        indexes = (("college_id", "academic_year"), ("student_id", "snapshot_month"))
