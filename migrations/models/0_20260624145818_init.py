from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "student_academic_records" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "grade" INT,
    "student_id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(64),
    "name_pinyin" VARCHAR(128),
    "gender" VARCHAR(16),
    "teaching_department" VARCHAR(128),
    "major_name" VARCHAR(128),
    "major_direction_name" VARCHAR(128),
    "class_name" VARCHAR(128),
    "campus" VARCHAR(64),
    "admission_subject" VARCHAR(64),
    "minor_major_name" VARCHAR(128),
    "birth_date" DATE,
    "enrollment_year" INT,
    "education_level" VARCHAR(64),
    "research_direction" VARCHAR(128),
    "supervisor_name" VARCHAR(64),
    "ethnicity" VARCHAR(64),
    "native_place" VARCHAR(128),
    "political_status" VARCHAR(128),
    "hongkong_macao_taiwan_overseas" VARCHAR(64),
    "health_status" VARCHAR(64),
    "phone" VARCHAR(32),
    "pe_standard" VARCHAR(64),
    "course_selection_group" VARCHAR(128),
    "major_course_count" INT,
    "major_course_avg_score" DECIMAL(8,3),
    "major_course_max_score" DECIMAL(8,3),
    "major_course_min_score" DECIMAL(8,3),
    "major_course_variance" DECIMAL(10,4),
    "subject_basic_course_count" INT,
    "subject_basic_course_avg_score" DECIMAL(8,3),
    "subject_basic_course_max_score" DECIMAL(8,3),
    "subject_basic_course_min_score" DECIMAL(8,3),
    "subject_basic_course_variance" DECIMAL(10,4),
    "general_course_count" INT,
    "general_course_avg_score" DECIMAL(8,3),
    "general_course_max_score" DECIMAL(8,3),
    "general_course_min_score" DECIMAL(8,3),
    "general_course_variance" DECIMAL(10,4),
    "required_course_count" INT,
    "required_course_avg_score" DECIMAL(8,3),
    "required_course_max_score" DECIMAL(8,3),
    "required_course_min_score" DECIMAL(8,3),
    "required_course_variance" DECIMAL(10,4),
    "elective_course_count" INT,
    "elective_course_avg_score" DECIMAL(8,3),
    "elective_course_max_score" DECIMAL(8,3),
    "elective_course_min_score" DECIMAL(8,3),
    "elective_course_variance" DECIMAL(10,4),
    "all_course_count" INT,
    "all_course_avg_score" DECIMAL(8,3),
    "all_course_max_score" DECIMAL(8,3),
    "all_course_min_score" DECIMAL(8,3),
    "all_course_variance" DECIMAL(10,4),
    "absent_exam_count" INT,
    "makeup_exam_count" INT,
    "retake_count" INT,
    "required_credits" DECIMAL(8,3),
    "elective_credits" DECIMAL(8,3),
    "other_credits" DECIMAL(8,3),
    "retake_credits" DECIMAL(8,3),
    "earned_total_credits" DECIMAL(8,3),
    "failed_total_credits" DECIMAL(8,3),
    "major_total_credits" DECIMAL(8,3),
    "minor_total_credits" DECIMAL(8,3),
    "total_grade_points" DECIMAL(10,3),
    "average_credit_gpa" DECIMAL(8,3),
    "cet4_exam_count" INT,
    "cet4_score" DECIMAL(8,3),
    "cet6_exam_count" INT,
    "cet6_score" DECIMAL(8,3),
    "building" VARCHAR(64),
    "dormitory_name" VARCHAR(128),
    "class_teacher" VARCHAR(64),
    "counselor" VARCHAR(64),
    "competition_award_count" INT,
    "competition_award_detail" TEXT,
    "source_file" VARCHAR(255),
    "source_sheet" VARCHAR(128),
    "row_number" INT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uid_student_aca_grade_004f3f" UNIQUE ("grade", "student_id")
);
CREATE INDEX IF NOT EXISTS "idx_student_aca_student_346c73" ON "student_academic_records" ("student_id");
COMMENT ON COLUMN "student_academic_records"."grade" IS '年级';
COMMENT ON COLUMN "student_academic_records"."student_id" IS '学号';
COMMENT ON COLUMN "student_academic_records"."name" IS '姓名';
COMMENT ON COLUMN "student_academic_records"."name_pinyin" IS '姓名拼音';
COMMENT ON COLUMN "student_academic_records"."gender" IS '性别';
COMMENT ON COLUMN "student_academic_records"."teaching_department" IS '上课院系';
COMMENT ON COLUMN "student_academic_records"."major_name" IS '专业名称';
COMMENT ON COLUMN "student_academic_records"."major_direction_name" IS '专业方向名称';
COMMENT ON COLUMN "student_academic_records"."class_name" IS '班级';
COMMENT ON COLUMN "student_academic_records"."campus" IS '校区';
COMMENT ON COLUMN "student_academic_records"."admission_subject" IS '招生学科';
COMMENT ON COLUMN "student_academic_records"."minor_major_name" IS '辅修专业名称';
COMMENT ON COLUMN "student_academic_records"."birth_date" IS '出生日期';
COMMENT ON COLUMN "student_academic_records"."enrollment_year" IS '入学年份';
COMMENT ON COLUMN "student_academic_records"."education_level" IS '培养层次';
COMMENT ON COLUMN "student_academic_records"."research_direction" IS '研究方向';
COMMENT ON COLUMN "student_academic_records"."supervisor_name" IS '导师姓名';
COMMENT ON COLUMN "student_academic_records"."ethnicity" IS '民族';
COMMENT ON COLUMN "student_academic_records"."native_place" IS '籍贯';
COMMENT ON COLUMN "student_academic_records"."political_status" IS '政治面貌';
COMMENT ON COLUMN "student_academic_records"."hongkong_macao_taiwan_overseas" IS '港澳台侨外';
COMMENT ON COLUMN "student_academic_records"."health_status" IS '健康状况';
COMMENT ON COLUMN "student_academic_records"."phone" IS '电话';
COMMENT ON COLUMN "student_academic_records"."pe_standard" IS '体育达标';
COMMENT ON COLUMN "student_academic_records"."course_selection_group" IS '选课组';
COMMENT ON COLUMN "student_academic_records"."major_course_count" IS '专业课_课程数';
COMMENT ON COLUMN "student_academic_records"."major_course_avg_score" IS '专业课_平均分';
COMMENT ON COLUMN "student_academic_records"."major_course_max_score" IS '专业课_最高分';
COMMENT ON COLUMN "student_academic_records"."major_course_min_score" IS '专业课_最低分';
COMMENT ON COLUMN "student_academic_records"."major_course_variance" IS '专业课_方差';
COMMENT ON COLUMN "student_academic_records"."subject_basic_course_count" IS '学科基础课_课程数';
COMMENT ON COLUMN "student_academic_records"."subject_basic_course_avg_score" IS '学科基础课_平均分';
COMMENT ON COLUMN "student_academic_records"."subject_basic_course_max_score" IS '学科基础课_最高分';
COMMENT ON COLUMN "student_academic_records"."subject_basic_course_min_score" IS '学科基础课_最低分';
COMMENT ON COLUMN "student_academic_records"."subject_basic_course_variance" IS '学科基础课_方差';
COMMENT ON COLUMN "student_academic_records"."general_course_count" IS '通识课_课程数';
COMMENT ON COLUMN "student_academic_records"."general_course_avg_score" IS '通识课_平均分';
COMMENT ON COLUMN "student_academic_records"."general_course_max_score" IS '通识课_最高分';
COMMENT ON COLUMN "student_academic_records"."general_course_min_score" IS '通识课_最低分';
COMMENT ON COLUMN "student_academic_records"."general_course_variance" IS '通识课_方差';
COMMENT ON COLUMN "student_academic_records"."required_course_count" IS '必修_课程数';
COMMENT ON COLUMN "student_academic_records"."required_course_avg_score" IS '必修_平均分';
COMMENT ON COLUMN "student_academic_records"."required_course_max_score" IS '必修_最高分';
COMMENT ON COLUMN "student_academic_records"."required_course_min_score" IS '必修_最低分';
COMMENT ON COLUMN "student_academic_records"."required_course_variance" IS '必修_方差';
COMMENT ON COLUMN "student_academic_records"."elective_course_count" IS '选修_课程数';
COMMENT ON COLUMN "student_academic_records"."elective_course_avg_score" IS '选修_平均分';
COMMENT ON COLUMN "student_academic_records"."elective_course_max_score" IS '选修_最高分';
COMMENT ON COLUMN "student_academic_records"."elective_course_min_score" IS '选修_最低分';
COMMENT ON COLUMN "student_academic_records"."elective_course_variance" IS '选修_方差';
COMMENT ON COLUMN "student_academic_records"."all_course_count" IS '全部课程_课程数';
COMMENT ON COLUMN "student_academic_records"."all_course_avg_score" IS '全部课程_平均分';
COMMENT ON COLUMN "student_academic_records"."all_course_max_score" IS '全部课程_最高分';
COMMENT ON COLUMN "student_academic_records"."all_course_min_score" IS '全部课程_最低分';
COMMENT ON COLUMN "student_academic_records"."all_course_variance" IS '全部课程_方差';
COMMENT ON COLUMN "student_academic_records"."absent_exam_count" IS '缺考次数';
COMMENT ON COLUMN "student_academic_records"."makeup_exam_count" IS '补考次数';
COMMENT ON COLUMN "student_academic_records"."retake_count" IS '重修次数';
COMMENT ON COLUMN "student_academic_records"."required_credits" IS '必修';
COMMENT ON COLUMN "student_academic_records"."elective_credits" IS '选修';
COMMENT ON COLUMN "student_academic_records"."other_credits" IS '其它';
COMMENT ON COLUMN "student_academic_records"."retake_credits" IS '重修学分';
COMMENT ON COLUMN "student_academic_records"."earned_total_credits" IS '获得总学分';
COMMENT ON COLUMN "student_academic_records"."failed_total_credits" IS '不及格总学分';
COMMENT ON COLUMN "student_academic_records"."major_total_credits" IS '主修总学分';
COMMENT ON COLUMN "student_academic_records"."minor_total_credits" IS '辅修总学分';
COMMENT ON COLUMN "student_academic_records"."total_grade_points" IS '总绩点分';
COMMENT ON COLUMN "student_academic_records"."average_credit_gpa" IS '平均学分绩点';
COMMENT ON COLUMN "student_academic_records"."cet4_exam_count" IS '考四级次数';
COMMENT ON COLUMN "student_academic_records"."cet4_score" IS '四级';
COMMENT ON COLUMN "student_academic_records"."cet6_exam_count" IS '考六级次数';
COMMENT ON COLUMN "student_academic_records"."cet6_score" IS '六级';
COMMENT ON COLUMN "student_academic_records"."building" IS '楼栋';
COMMENT ON COLUMN "student_academic_records"."dormitory_name" IS '宿舍名称';
COMMENT ON COLUMN "student_academic_records"."class_teacher" IS '班主任';
COMMENT ON COLUMN "student_academic_records"."counselor" IS '辅导员';
COMMENT ON COLUMN "student_academic_records"."competition_award_count" IS '学科竞赛获奖次数';
COMMENT ON COLUMN "student_academic_records"."competition_award_detail" IS '学科竞赛获奖明细';
COMMENT ON COLUMN "student_academic_records"."source_file" IS '来源文件';
COMMENT ON COLUMN "student_academic_records"."source_sheet" IS '来源工作表';
COMMENT ON COLUMN "student_academic_records"."row_number" IS 'Excel 行号';
COMMENT ON TABLE "student_academic_records" IS '学籍成绩合并表：Excel 每人一行，对应数据库一行。';
CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """
