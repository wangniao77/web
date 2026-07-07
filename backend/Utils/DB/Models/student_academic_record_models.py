from tortoise import fields
from tortoise.models import Model


class StudentAcademicRecord(Model):
    """学生学籍成绩表：主档 + Excel 学业数据，每人每年级一行。"""

    id = fields.IntField(pk=True)

    grade = fields.IntField(null=True, description="年级")
    student_id = fields.CharField(max_length=32, index=True, description="学号")
    name = fields.CharField(max_length=64, null=True, description="姓名")
    gender = fields.CharField(max_length=16, null=True, description="性别")

    college = fields.ForeignKeyField(
        "models.College",
        related_name="students",
        null=True,
        description="所属学院",
    )
    major = fields.ForeignKeyField(
        "models.Major",
        related_name="students",
        null=True,
        description="所属专业",
    )
    school_class = fields.ForeignKeyField(
        "models.SchoolClass",
        related_name="students",
        null=True,
        description="所属班级",
    )
    student_picture_path = fields.CharField(max_length=255, null=True, description="学生照片路径")
    status = fields.CharField(max_length=32, default="active", description="学籍状态")

    teaching_department = fields.CharField(max_length=128, null=True, description="上课院系")
    major_name = fields.CharField(max_length=128, null=True, description="专业名称")
    major_direction_name = fields.CharField(max_length=128, null=True, description="专业方向名称")
    class_name = fields.CharField(max_length=128, null=True, description="班级")
    campus = fields.CharField(max_length=64, null=True, description="校区")
    enrollment_year = fields.IntField(null=True, description="入学年份")
    education_level = fields.CharField(max_length=64, null=True, description="培养层次")

    major_course_count = fields.IntField(null=True, description="专业课_课程数")
    major_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="专业课_平均分")
    subject_basic_course_count = fields.IntField(null=True, description="学科基础课_课程数")
    subject_basic_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="学科基础课_平均分")
    general_course_count = fields.IntField(null=True, description="通识课_课程数")
    general_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="通识课_平均分")
    required_course_count = fields.IntField(null=True, description="必修_课程数")
    required_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="必修_平均分")
    elective_course_count = fields.IntField(null=True, description="选修_课程数")
    elective_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="选修_平均分")
    all_course_count = fields.IntField(null=True, description="全部课程_课程数")
    all_course_avg_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="全部课程_平均分")

    absent_exam_count = fields.IntField(null=True, description="缺考次数")
    makeup_exam_count = fields.IntField(null=True, description="补考次数")
    retake_count = fields.IntField(null=True, description="重修次数")
    required_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="必修学分")
    elective_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="选修学分")
    earned_total_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="获得总学分")
    failed_total_credits = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="不及格总学分")
    average_credit_gpa = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="平均学分绩点")

    cet4_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="四级成绩")
    cet6_score = fields.DecimalField(max_digits=8, decimal_places=3, null=True, description="六级成绩")
    class_teacher = fields.CharField(max_length=64, null=True, description="班主任")
    counselor = fields.CharField(max_length=64, null=True, description="辅导员")
    competition_award_count = fields.IntField(null=True, description="学科竞赛获奖次数")
    competition_award_detail = fields.TextField(null=True, description="学科竞赛获奖明细")

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "student_academic_records"
        unique_together = (("grade", "student_id"),)
