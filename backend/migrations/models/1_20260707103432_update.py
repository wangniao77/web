from tortoise import BaseDBAsyncClient


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "colleges" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(128) NOT NULL,
    "short_name" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON COLUMN "colleges"."code" IS '学院编码，如 big-data-ai';
COMMENT ON COLUMN "colleges"."name" IS '学院名称';
COMMENT ON COLUMN "colleges"."short_name" IS '学院简称';
COMMENT ON TABLE "colleges" IS '学院主数据。';
        CREATE TABLE IF NOT EXISTS "majors" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "code" VARCHAR(64),
    "name" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "college_id" INT NOT NULL REFERENCES "colleges" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_majors_college_49ccae" UNIQUE ("college_id", "name")
);
COMMENT ON COLUMN "majors"."code" IS '专业编码';
COMMENT ON COLUMN "majors"."name" IS '专业名称';
COMMENT ON COLUMN "majors"."college_id" IS '所属学院';
COMMENT ON TABLE "majors" IS '专业主数据。';
        CREATE TABLE IF NOT EXISTS "classes" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "grade" INT NOT NULL,
    "name" VARCHAR(128) NOT NULL,
    "counselor_name" VARCHAR(64),
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "major_id" INT NOT NULL REFERENCES "majors" ("id") ON DELETE CASCADE,
    CONSTRAINT "uid_classes_major_i_534171" UNIQUE ("major_id", "name")
);
COMMENT ON COLUMN "classes"."grade" IS '年级，如 2021';
COMMENT ON COLUMN "classes"."name" IS '班级名称，如 计科2101';
COMMENT ON COLUMN "classes"."counselor_name" IS '辅导员';
COMMENT ON COLUMN "classes"."major_id" IS '所属专业';
COMMENT ON TABLE "classes" IS '班级主数据。';
        CREATE TABLE IF NOT EXISTS "accounts" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "username" VARCHAR(64) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(32) NOT NULL,
    "display_name" VARCHAR(64),
    "student_id" VARCHAR(32),
    "is_active" BOOL NOT NULL  DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "college_id" INT REFERENCES "colleges" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "accounts"."username" IS '登录名';
COMMENT ON COLUMN "accounts"."password_hash" IS '密码哈希';
COMMENT ON COLUMN "accounts"."role" IS '角色：student/teacher/admin/superadmin';
COMMENT ON COLUMN "accounts"."display_name" IS '显示名称';
COMMENT ON COLUMN "accounts"."student_id" IS '关联学号（学生角色）';
COMMENT ON COLUMN "accounts"."is_active" IS '是否启用';
COMMENT ON COLUMN "accounts"."college_id" IS '关联学院（教师/管理员）';
COMMENT ON TABLE "accounts" IS '系统账号。';
        CREATE TABLE IF NOT EXISTS "courses" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "name" VARCHAR(128) NOT NULL,
    "level" VARCHAR(32),
    "leader" VARCHAR(64),
    "hours" INT,
    "student_count" INT NOT NULL  DEFAULT 0,
    "academic_year" VARCHAR(16),
    "status" VARCHAR(32) NOT NULL  DEFAULT 'ongoing',
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "college_id" INT REFERENCES "colleges" ("id") ON DELETE CASCADE,
    "major_id" INT REFERENCES "majors" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "courses"."name" IS '课程名称';
COMMENT ON COLUMN "courses"."level" IS '建设级别：国家级/省级/校级';
COMMENT ON COLUMN "courses"."leader" IS '课程负责人';
COMMENT ON COLUMN "courses"."hours" IS '学时';
COMMENT ON COLUMN "courses"."student_count" IS '选课人数';
COMMENT ON COLUMN "courses"."academic_year" IS '开课学年';
COMMENT ON COLUMN "courses"."status" IS '建设状态';
COMMENT ON COLUMN "courses"."college_id" IS '开课学院';
COMMENT ON COLUMN "courses"."major_id" IS '所属专业';
COMMENT ON TABLE "courses" IS '专业课程 / 课程建设。';
        CREATE TABLE IF NOT EXISTS "key_tasks" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "scope" VARCHAR(16) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "progress" DECIMAL(5,2) NOT NULL  DEFAULT 0,
    "status" VARCHAR(32) NOT NULL  DEFAULT 'ongoing',
    "lead_dept" VARCHAR(128),
    "deadline" DATE,
    "risk_level" VARCHAR(16),
    "planned_node" VARCHAR(128),
    "current_issue" TEXT,
    "next_action" TEXT,
    "academic_year" VARCHAR(16),
    "milestones" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "college_id" INT REFERENCES "colleges" ("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "idx_key_tasks_scope_731e79" ON "key_tasks" ("scope", "academic_year");
COMMENT ON COLUMN "key_tasks"."scope" IS '范围：college / university';
COMMENT ON COLUMN "key_tasks"."name" IS '任务名称';
COMMENT ON COLUMN "key_tasks"."description" IS '任务描述';
COMMENT ON COLUMN "key_tasks"."progress" IS '完成进度 0-100';
COMMENT ON COLUMN "key_tasks"."status" IS '状态：ongoing/completed/delayed/attention/overdue';
COMMENT ON COLUMN "key_tasks"."lead_dept" IS '牵头部门';
COMMENT ON COLUMN "key_tasks"."deadline" IS '截止日期';
COMMENT ON COLUMN "key_tasks"."risk_level" IS '风险等级';
COMMENT ON COLUMN "key_tasks"."planned_node" IS '计划节点';
COMMENT ON COLUMN "key_tasks"."current_issue" IS '当前问题';
COMMENT ON COLUMN "key_tasks"."next_action" IS '下一步行动';
COMMENT ON COLUMN "key_tasks"."academic_year" IS '学年';
COMMENT ON COLUMN "key_tasks"."milestones" IS '里程碑列表 [{label, done}]';
COMMENT ON COLUMN "key_tasks"."college_id" IS '学院级任务所属学院';
COMMENT ON TABLE "key_tasks" IS '学院 / 学校年度重点任务。';
        CREATE TABLE IF NOT EXISTS "school_events" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "category" VARCHAR(32) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "summary" TEXT,
    "event_date" DATE NOT NULL,
    "status" VARCHAR(32) NOT NULL  DEFAULT 'ongoing',
    "needs_attention" BOOL NOT NULL  DEFAULT False,
    "lead_dept" VARCHAR(128),
    "next_action" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL  DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_school_even_categor_c8154a" ON "school_events" ("category", "event_date");
COMMENT ON COLUMN "school_events"."category" IS '类别：teaching/research/talent/service/international/safety';
COMMENT ON COLUMN "school_events"."title" IS '标题';
COMMENT ON COLUMN "school_events"."summary" IS '摘要';
COMMENT ON COLUMN "school_events"."event_date" IS '事件日期';
COMMENT ON COLUMN "school_events"."status" IS '状态：completed/ongoing/planned';
COMMENT ON COLUMN "school_events"."needs_attention" IS '是否需要关注';
COMMENT ON COLUMN "school_events"."lead_dept" IS '牵头部门';
COMMENT ON COLUMN "school_events"."next_action" IS '下一步行动';
COMMENT ON TABLE "school_events" IS '学校发展大事 / 重点事项。';
        ALTER TABLE "student_academic_records" ADD "status" VARCHAR(32) NOT NULL  DEFAULT 'active';
        ALTER TABLE "student_academic_records" ADD "student_picture_path" VARCHAR(255);
        ALTER TABLE "student_academic_records" ADD "major_id" INT;
        ALTER TABLE "student_academic_records" ADD "college_id" INT;
        ALTER TABLE "student_academic_records" ADD "school_class_id" INT;
        ALTER TABLE "student_academic_records" DROP COLUMN "general_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "source_sheet";
        ALTER TABLE "student_academic_records" DROP COLUMN "political_status";
        ALTER TABLE "student_academic_records" DROP COLUMN "general_course_variance";
        ALTER TABLE "student_academic_records" DROP COLUMN "birth_date";
        ALTER TABLE "student_academic_records" DROP COLUMN "major_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "course_selection_group";
        ALTER TABLE "student_academic_records" DROP COLUMN "native_place";
        ALTER TABLE "student_academic_records" DROP COLUMN "all_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "health_status";
        ALTER TABLE "student_academic_records" DROP COLUMN "cet6_exam_count";
        ALTER TABLE "student_academic_records" DROP COLUMN "dormitory_name";
        ALTER TABLE "student_academic_records" DROP COLUMN "major_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "cet4_exam_count";
        ALTER TABLE "student_academic_records" DROP COLUMN "row_number";
        ALTER TABLE "student_academic_records" DROP COLUMN "hongkong_macao_taiwan_overseas";
        ALTER TABLE "student_academic_records" DROP COLUMN "retake_credits";
        ALTER TABLE "student_academic_records" DROP COLUMN "all_course_variance";
        ALTER TABLE "student_academic_records" DROP COLUMN "ethnicity";
        ALTER TABLE "student_academic_records" DROP COLUMN "research_direction";
        ALTER TABLE "student_academic_records" DROP COLUMN "minor_total_credits";
        ALTER TABLE "student_academic_records" DROP COLUMN "minor_major_name";
        ALTER TABLE "student_academic_records" DROP COLUMN "phone";
        ALTER TABLE "student_academic_records" DROP COLUMN "admission_subject";
        ALTER TABLE "student_academic_records" DROP COLUMN "general_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "total_grade_points";
        ALTER TABLE "student_academic_records" DROP COLUMN "subject_basic_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "required_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "building";
        ALTER TABLE "student_academic_records" DROP COLUMN "elective_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "elective_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "name_pinyin";
        ALTER TABLE "student_academic_records" DROP COLUMN "all_course_max_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "major_course_variance";
        ALTER TABLE "student_academic_records" DROP COLUMN "elective_course_variance";
        ALTER TABLE "student_academic_records" DROP COLUMN "subject_basic_course_variance";
        ALTER TABLE "student_academic_records" DROP COLUMN "subject_basic_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "source_file";
        ALTER TABLE "student_academic_records" DROP COLUMN "pe_standard";
        ALTER TABLE "student_academic_records" DROP COLUMN "required_course_min_score";
        ALTER TABLE "student_academic_records" DROP COLUMN "other_credits";
        ALTER TABLE "student_academic_records" DROP COLUMN "supervisor_name";
        ALTER TABLE "student_academic_records" DROP COLUMN "major_total_credits";
        ALTER TABLE "student_academic_records" DROP COLUMN "required_course_variance";
        ALTER TABLE "student_academic_records" ALTER COLUMN "class_teacher" TYPE VARCHAR(64) USING "class_teacher"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "name" TYPE VARCHAR(64) USING "name"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "education_level" TYPE VARCHAR(64) USING "education_level"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "teaching_department" TYPE VARCHAR(128) USING "teaching_department"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "cet4_score" TYPE DECIMAL(8,3) USING "cet4_score"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "campus" TYPE VARCHAR(64) USING "campus"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "counselor" TYPE VARCHAR(64) USING "counselor"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "student_id" TYPE VARCHAR(32) USING "student_id"::VARCHAR(32);
        ALTER TABLE "student_academic_records" ALTER COLUMN "major_direction_name" TYPE VARCHAR(128) USING "major_direction_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "gender" TYPE VARCHAR(16) USING "gender"::VARCHAR(16);
        ALTER TABLE "student_academic_records" ALTER COLUMN "class_name" TYPE VARCHAR(128) USING "class_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "elective_credits" TYPE DECIMAL(8,3) USING "elective_credits"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "major_name" TYPE VARCHAR(128) USING "major_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "cet6_score" TYPE DECIMAL(8,3) USING "cet6_score"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "required_credits" TYPE DECIMAL(8,3) USING "required_credits"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD CONSTRAINT "fk_student__classes_197b0ed4" FOREIGN KEY ("school_class_id") REFERENCES "classes" ("id") ON DELETE CASCADE;
        ALTER TABLE "student_academic_records" ADD CONSTRAINT "fk_student__colleges_9d913833" FOREIGN KEY ("college_id") REFERENCES "colleges" ("id") ON DELETE CASCADE;
        ALTER TABLE "student_academic_records" ADD CONSTRAINT "fk_student__majors_71fd98b7" FOREIGN KEY ("major_id") REFERENCES "majors" ("id") ON DELETE CASCADE;"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE "student_academic_records" DROP CONSTRAINT "fk_student__majors_71fd98b7";
        ALTER TABLE "student_academic_records" DROP CONSTRAINT "fk_student__colleges_9d913833";
        ALTER TABLE "student_academic_records" DROP CONSTRAINT "fk_student__classes_197b0ed4";
        ALTER TABLE "student_academic_records" ADD "general_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "source_sheet" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "political_status" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "general_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" ADD "birth_date" DATE;
        ALTER TABLE "student_academic_records" ADD "major_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "course_selection_group" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "native_place" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "all_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "health_status" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "cet6_exam_count" INT;
        ALTER TABLE "student_academic_records" ADD "dormitory_name" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "major_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "cet4_exam_count" INT;
        ALTER TABLE "student_academic_records" ADD "row_number" INT;
        ALTER TABLE "student_academic_records" ADD "hongkong_macao_taiwan_overseas" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "retake_credits" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "all_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" ADD "ethnicity" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "research_direction" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "minor_total_credits" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "minor_major_name" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "phone" VARCHAR(32);
        ALTER TABLE "student_academic_records" ADD "admission_subject" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "general_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "total_grade_points" DECIMAL(10,3);
        ALTER TABLE "student_academic_records" ADD "subject_basic_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "required_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "building" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "elective_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "elective_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "name_pinyin" VARCHAR(128);
        ALTER TABLE "student_academic_records" ADD "all_course_max_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "major_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" ADD "elective_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" ADD "subject_basic_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" ADD "subject_basic_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "source_file" VARCHAR(255);
        ALTER TABLE "student_academic_records" ADD "pe_standard" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "required_course_min_score" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "other_credits" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "supervisor_name" VARCHAR(64);
        ALTER TABLE "student_academic_records" ADD "major_total_credits" DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ADD "required_course_variance" DECIMAL(10,4);
        ALTER TABLE "student_academic_records" DROP COLUMN "status";
        ALTER TABLE "student_academic_records" DROP COLUMN "student_picture_path";
        ALTER TABLE "student_academic_records" DROP COLUMN "major_id";
        ALTER TABLE "student_academic_records" DROP COLUMN "college_id";
        ALTER TABLE "student_academic_records" DROP COLUMN "school_class_id";
        ALTER TABLE "student_academic_records" ALTER COLUMN "class_teacher" TYPE VARCHAR(64) USING "class_teacher"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "name" TYPE VARCHAR(64) USING "name"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "education_level" TYPE VARCHAR(64) USING "education_level"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "teaching_department" TYPE VARCHAR(128) USING "teaching_department"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "cet4_score" TYPE DECIMAL(8,3) USING "cet4_score"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "campus" TYPE VARCHAR(64) USING "campus"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "counselor" TYPE VARCHAR(64) USING "counselor"::VARCHAR(64);
        ALTER TABLE "student_academic_records" ALTER COLUMN "student_id" TYPE VARCHAR(32) USING "student_id"::VARCHAR(32);
        ALTER TABLE "student_academic_records" ALTER COLUMN "major_direction_name" TYPE VARCHAR(128) USING "major_direction_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "gender" TYPE VARCHAR(16) USING "gender"::VARCHAR(16);
        ALTER TABLE "student_academic_records" ALTER COLUMN "class_name" TYPE VARCHAR(128) USING "class_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "elective_credits" TYPE DECIMAL(8,3) USING "elective_credits"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "major_name" TYPE VARCHAR(128) USING "major_name"::VARCHAR(128);
        ALTER TABLE "student_academic_records" ALTER COLUMN "cet6_score" TYPE DECIMAL(8,3) USING "cet6_score"::DECIMAL(8,3);
        ALTER TABLE "student_academic_records" ALTER COLUMN "required_credits" TYPE DECIMAL(8,3) USING "required_credits"::DECIMAL(8,3);
        DROP TABLE IF EXISTS "accounts";
        DROP TABLE IF EXISTS "colleges";
        DROP TABLE IF EXISTS "courses";
        DROP TABLE IF EXISTS "key_tasks";
        DROP TABLE IF EXISTS "majors";
        DROP TABLE IF EXISTS "classes";
        DROP TABLE IF EXISTS "school_events";"""
