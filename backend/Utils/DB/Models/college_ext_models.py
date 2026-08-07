"""学院驾驶舱扩展表（L1）：师资、平台、成果、排名、招生、标签、KPI 快照。"""

from tortoise import fields
from tortoise.models import Model


class Teacher(Model):
    """教师主档（可由写真文件名 / 毕设导师 / 科研负责人汇聚）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="teachers",
        null=True,
        description="所属学院",
    )
    teacher_no = fields.CharField(max_length=64, null=True, index=True, description="工号")
    name = fields.CharField(max_length=64, description="姓名")
    gender = fields.CharField(max_length=16, null=True)
    title = fields.CharField(max_length=64, null=True, description="职称")
    title_level = fields.CharField(max_length=64, null=True, description="职称级别")
    degree = fields.CharField(max_length=64, null=True, description="学位")
    education = fields.CharField(max_length=64, null=True, description="学历")
    is_phd = fields.BooleanField(null=True, description="是否博士")
    department = fields.CharField(max_length=128, null=True, description="部门/系所")
    position = fields.CharField(max_length=255, null=True, description="岗位")
    hire_date = fields.CharField(max_length=32, null=True, description="参加工作时间")
    school_hire_date = fields.CharField(max_length=32, null=True, description="来校时间")
    status = fields.CharField(max_length=32, default="active")
    photo_path = fields.CharField(max_length=512, null=True, description="本地写真相对路径")
    source = fields.CharField(max_length=64, null=True, description="汇聚来源标记")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "teachers"
        unique_together = (("college_id", "name"),)
        indexes = (("college_id", "teacher_no"),)


class ResearchPlatform(Model):
    """科研平台 / 团队 / 工程中心等。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="research_platforms",
        null=True,
    )
    name = fields.CharField(max_length=512)
    category = fields.CharField(max_length=128, null=True, description="类型：工程中心/重点实验室/团队等")
    level = fields.CharField(max_length=64, null=True)
    leader = fields.CharField(max_length=64, null=True)
    member_count = fields.IntField(null=True)
    founded_at = fields.CharField(max_length=64, null=True)
    approved_by = fields.CharField(max_length=255, null=True)
    eval_passed_at = fields.CharField(max_length=64, null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "research_platforms"


class AchievementItem(Model):
    """精品成果统一事实表。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="achievements",
        null=True,
    )
    section = fields.CharField(
        max_length=32,
        description="topic/output/paper/award/talent/platform/competition/collective/service",
    )
    name = fields.CharField(max_length=512)
    category = fields.CharField(max_length=128, null=True)
    level = fields.CharField(max_length=64, null=True)
    org = fields.CharField(max_length=255, null=True)
    leader = fields.CharField(max_length=128, null=True)
    department = fields.CharField(max_length=128, null=True, description="系部")
    major_name = fields.CharField(max_length=128, null=True, description="专业")
    occurred_on = fields.CharField(max_length=64, null=True)
    note = fields.TextField(null=True)
    source_file = fields.CharField(max_length=255, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "achievement_items"
        indexes = (
            ("college_id", "section"),
            ("college_id", "department"),
            ("college_id", "major_name"),
        )


class TeacherHonor(Model):
    """教师荣誉称号（教学名师、学者头衔、党员表彰等）。

    口径示例：教学质量优秀奖、最佳授课教师、十佳青年教师、授课优秀青年教师、
    青年教学名师、教学名师、市级以上教学竞赛获奖、省厅级以上荣誉表彰、
    三八红旗手、五四劳动奖章、珠江学者特聘教授、南岭学者、优秀共产党员等。
    """

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="teacher_honors",
        null=True,
    )
    teacher_name = fields.CharField(max_length=64, index=True, description="教师姓名")
    honor_title = fields.CharField(max_length=255, description="荣誉称号全称")
    honor_kind = fields.CharField(
        max_length=64,
        null=True,
        description="教学名师/学者头衔/竞赛获奖/先进表彰/党员表彰/其他",
    )
    level = fields.CharField(
        max_length=32,
        null=True,
        description="国家级/省部级/市级/校级/其他",
    )
    year = fields.CharField(max_length=16, null=True, description="获评年份（可空）")
    org = fields.CharField(max_length=255, null=True, description="授予单位")
    note = fields.TextField(null=True)
    source = fields.CharField(max_length=128, null=True, description="数据来源标记")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "teacher_honors"
        unique_together = (("college_id", "teacher_name", "honor_title", "year"),)
        indexes = (("college_id", "teacher_name"), ("college_id", "honor_kind"),)


class MajorRankSnapshot(Model):
    """专业排名 / 软科五维快照（缺源时表空，供后续导入）。"""

    id = fields.IntField(pk=True)
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="rank_snapshots",
        null=True,
    )
    college = fields.ForeignKeyField(
        "models.College",
        related_name="major_rank_snapshots",
        null=True,
    )
    year = fields.IntField(description="快照年份")
    grade_label = fields.CharField(max_length=32, null=True)
    national_rank = fields.IntField(null=True)
    province_rank = fields.IntField(null=True)
    finance_rank = fields.IntField(null=True)
    yoy_change = fields.IntField(null=True, description="全国名次变化，正=上升")
    soft_dimensions = fields.JSONField(default=list, description="五维得分数组")
    peer_schools = fields.JSONField(default=list, description="综合/省内对标校 [{school,rank,isSelf?}]")
    finance_peer_schools = fields.JSONField(
        default=list, description="财经对标校 [{school,rank,isSelf?}]"
    )
    source = fields.CharField(max_length=128, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "major_rank_snapshots"
        unique_together = (("major_id", "year"),)


class EnrollmentCohort(Model):
    """招生队列聚合（缺源时表空）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="enrollment_cohorts",
        null=True,
    )
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="enrollment_cohorts",
        null=True,
    )
    year = fields.IntField()
    enrolled_count = fields.IntField(null=True)
    first_choice_rate = fields.DecimalField(max_digits=8, decimal_places=4, null=True)
    avg_score = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    min_score = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    rank_cutoff = fields.IntField(null=True)
    source = fields.CharField(max_length=128, null=True)
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "enrollment_cohorts"
        unique_together = (("college_id", "major_id", "year"),)


class StudentTag(Model):
    """高潜 / 预警等学生标签（可由规则计算后落库）。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="student_tags",
        null=True,
    )
    profile = fields.ForeignKeyField(
        "models.StudentProfile",
        related_name="tags",
        null=True,
        source_field="student_pk",
        description="规范化主档 FK",
    )
    rule_run = fields.ForeignKeyField(
        "models.AnalysisRuleRun",
        related_name="tags",
        null=True,
    )
    student_id = fields.CharField(max_length=32, index=True, description="学号（业务键）")
    grade = fields.IntField(null=True)
    tag_type = fields.CharField(max_length=32, description="high_potential|warning")
    tag_key = fields.CharField(
        max_length=64,
        description="academic/competition/leadership/rural/internship/career|academic/credit/psychological/employment",
    )
    level = fields.CharField(max_length=16, null=True)
    reason = fields.CharField(max_length=512, null=True)
    academic_year = fields.CharField(max_length=16, null=True)
    source = fields.CharField(max_length=32, null=True, description="rule|import")
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_tags"
        unique_together = (("student_id", "grade", "tag_type", "tag_key"),)
        indexes = (("college_id", "tag_type", "tag_key"),)


class CollegeKpiSnapshot(Model):
    """学院综合指数 / hub KPI 快照。"""

    id = fields.IntField(pk=True)
    college = fields.ForeignKeyField(
        "models.College",
        related_name="kpi_snapshots",
    )
    academic_year = fields.CharField(max_length=16, null=True)
    semester = fields.CharField(max_length=8, null=True)
    development_index = fields.DecimalField(max_digits=8, decimal_places=2, null=True)
    payload = fields.JSONField(default=dict)
    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "college_kpi_snapshots"
        unique_together = (("college_id", "academic_year", "semester"),)
