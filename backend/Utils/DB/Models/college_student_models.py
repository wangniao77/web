"""学生域 3NF 核心表：主档 / 招生 / 学业快照 / 规则跑批。"""

from tortoise import fields
from tortoise.models import Model


class StudentProfile(Model):
    """学生主档：一人一档。业务键 student_no（学号）。"""

    id = fields.IntField(pk=True)
    student_no = fields.CharField(max_length=32, unique=True, description="学号")
    name = fields.CharField(max_length=64, null=True)
    gender = fields.CharField(max_length=16, null=True)
    status = fields.CharField(max_length=32, default="active")

    college = fields.ForeignKeyField(
        "models.College",
        related_name="student_profiles",
        null=True,
    )
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="student_profiles",
        null=True,
    )
    school_class = fields.ForeignKeyField(
        "models.SchoolClass",
        related_name="student_profiles",
        null=True,
    )

    campus = fields.CharField(max_length=64, null=True)
    education_level = fields.CharField(max_length=64, null=True)
    enrollment_year = fields.IntField(null=True)
    teaching_department = fields.CharField(max_length=128, null=True)
    major_name = fields.CharField(max_length=128, null=True, description="专业名称冗余（导入便利）")
    major_direction_name = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=128, null=True)
    student_picture_path = fields.CharField(max_length=255, null=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "students"
        indexes = (("college_id", "status"),)


class StudentAdmission(Model):
    """招生/生源属性：与主档 1:1。"""

    id = fields.IntField(pk=True)
    student = fields.OneToOneField(
        "models.StudentProfile",
        related_name="admission",
    )
    admission_score = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    source_place = fields.CharField(max_length=128, null=True)
    native_place = fields.CharField(max_length=128, null=True)
    hmt_status = fields.CharField(max_length=64, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_admission"
        indexes = (("source_place",),)


class AcademicSnapshot(Model):
    """学业快照：人 × 年级。"""

    id = fields.IntField(pk=True)
    student = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="snapshots",
    )
    college = fields.ForeignKeyField(
        "models.College",
        related_name="academic_snapshots",
        null=True,
    )
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="academic_snapshots",
        null=True,
    )
    grade = fields.IntField(description="年级，如 2024")
    academic_year = fields.CharField(max_length=16, null=True)

    major_name = fields.CharField(max_length=128, null=True)
    class_name = fields.CharField(max_length=128, null=True)

    major_course_count = fields.IntField(null=True)
    major_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    subject_basic_course_count = fields.IntField(null=True)
    subject_basic_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    general_course_count = fields.IntField(null=True)
    general_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    required_course_count = fields.IntField(null=True)
    required_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    elective_course_count = fields.IntField(null=True)
    elective_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    all_course_count = fields.IntField(null=True)
    all_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)

    absent_exam_count = fields.IntField(null=True)
    makeup_exam_count = fields.IntField(null=True)
    retake_count = fields.IntField(null=True)
    required_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    elective_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    earned_total_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    failed_total_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    average_credit_gpa = fields.DecimalField(max_digits=8, decimal_places=3, null=True)

    cet4_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    cet6_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True)
    class_teacher = fields.CharField(max_length=64, null=True)
    counselor = fields.CharField(max_length=64, null=True)
    competition_award_count = fields.IntField(null=True)
    competition_award_detail = fields.TextField(null=True)

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "academic_snapshots"
        unique_together = (("student_id", "grade"),)
        indexes = (("college_id", "grade"),)


class AnalysisRuleRun(Model):
    """高潜 / 预警规则跑批记录。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="analysis_rule_runs",
        null=True,
    )
    kind = fields.CharField(max_length=32, description="hp|warning|both")
    rule_version = fields.CharField(max_length=64, default="v1")
    computed_at = fields.DatetimeField(auto_now_add=True)
    student_count = fields.IntField(default=0)
    tag_count = fields.IntField(default=0)
    note = fields.CharField(max_length=512, null=True)

    class Meta:
        table = "analysis_rule_runs"
        indexes = (("college_id", "kind"),)
