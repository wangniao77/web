"""为已有表补 college_id 等列，并 generate_schemas 创建新表。

用法:
  cd backend
  python scripts/migrate_college_schema.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from tortoise import Tortoise

from core.database import TORTOISE_ORM

ALTER_STATEMENTS = [
    # employment
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS college_id INT NULL",
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS education_level VARCHAR(32) NULL",
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS education_status VARCHAR(64) NULL",
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS major_name VARCHAR(128) NULL",
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS class_name VARCHAR(128) NULL",
    "COMMENT ON COLUMN employment_records.education_level IS '学历（本科/硕士等，来自就业表）'",
    "COMMENT ON COLUMN employment_records.education_status IS '学历状况（如本科生毕业/硕士研究生毕业）'",
    "COMMENT ON COLUMN employment_records.major_name IS '专业名称（来自就业表）'",
    "COMMENT ON COLUMN employment_records.class_name IS '班级名称（来自就业表）'",
    # research
    "ALTER TABLE research_projects ADD COLUMN IF NOT EXISTS college_id INT NULL",
    "ALTER TABLE research_papers ADD COLUMN IF NOT EXISTS college_id INT NULL",
    "ALTER TABLE research_ips ADD COLUMN IF NOT EXISTS college_id INT NULL",
    "ALTER TABLE thesis_advisors ADD COLUMN IF NOT EXISTS college_id INT NULL",
    # key_tasks extensions
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS category VARCHAR(32) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS task_type VARCHAR(64) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS project_level VARCHAR(64) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS major_direction VARCHAR(128) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS target VARCHAR(128) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS actual VARCHAR(128) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS unit VARCHAR(32) NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS materials TEXT NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS risk_reason TEXT NULL",
    "ALTER TABLE key_tasks ADD COLUMN IF NOT EXISTS extra JSONB NULL DEFAULT '{}'::jsonb",
    # 学籍：录取分 / 生源地 / 籍贯 / 港澳台侨外
    "ALTER TABLE student_academic_records ADD COLUMN IF NOT EXISTS admission_score NUMERIC(8,2) NULL",
    "ALTER TABLE student_academic_records ADD COLUMN IF NOT EXISTS source_place VARCHAR(128) NULL",
    "ALTER TABLE student_academic_records ADD COLUMN IF NOT EXISTS native_place VARCHAR(128) NULL",
    "ALTER TABLE student_academic_records ADD COLUMN IF NOT EXISTS hmt_status VARCHAR(64) NULL",
    "COMMENT ON COLUMN student_academic_records.admission_score IS '录取分数（高考分）'",
    "COMMENT ON COLUMN student_academic_records.source_place IS '生源所在地'",
    "COMMENT ON COLUMN student_academic_records.native_place IS '籍贯'",
    "COMMENT ON COLUMN student_academic_records.hmt_status IS '港澳台侨外'",
    # 学生域 3NF：附属表挂主档 FK（列名 student_pk，避免与学号 student_id 冲突）
    "ALTER TABLE student_tags ADD COLUMN IF NOT EXISTS student_pk INT NULL",
    "ALTER TABLE student_tags ADD COLUMN IF NOT EXISTS rule_run_id INT NULL",
    "ALTER TABLE student_tags ADD COLUMN IF NOT EXISTS source VARCHAR(32) NULL",
    "ALTER TABLE employment_records ADD COLUMN IF NOT EXISTS student_pk INT NULL",
    "ALTER TABLE thesis_advisors ADD COLUMN IF NOT EXISTS student_pk INT NULL",
]

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_students_college_status ON students (college_id, status)",
    "CREATE INDEX IF NOT EXISTS idx_academic_snapshots_student_grade ON academic_snapshots (student_id, grade DESC)",
    "CREATE INDEX IF NOT EXISTS idx_academic_snapshots_college_grade ON academic_snapshots (college_id, grade)",
    "CREATE INDEX IF NOT EXISTS idx_student_admission_source ON student_admission (source_place)",
    "CREATE INDEX IF NOT EXISTS idx_student_tags_college_type_key ON student_tags (college_id, tag_type, tag_key)",
    "CREATE INDEX IF NOT EXISTS idx_student_tags_student_pk ON student_tags (student_pk)",
    "CREATE INDEX IF NOT EXISTS idx_employment_student_pk ON employment_records (student_pk)",
    "CREATE INDEX IF NOT EXISTS idx_thesis_student_pk ON thesis_advisors (student_pk)",
]

# 兼容视图：主档 ⋈ 招生 ⋈ 每人最新年级快照，列名对齐宽表
VIEW_SQL = """
CREATE OR REPLACE VIEW v_student_academic_records AS
SELECT
  snap.id AS id,
  snap.grade AS grade,
  sp.student_no AS student_id,
  sp.name AS name,
  sp.gender AS gender,
  sp.college_id AS college_id,
  sp.major_id AS major_id,
  sp.school_class_id AS school_class_id,
  sp.student_picture_path AS student_picture_path,
  sp.status AS status,
  sp.teaching_department AS teaching_department,
  COALESCE(snap.major_name, sp.major_name) AS major_name,
  sp.major_direction_name AS major_direction_name,
  COALESCE(snap.class_name, sp.class_name) AS class_name,
  sp.campus AS campus,
  sp.enrollment_year AS enrollment_year,
  sp.education_level AS education_level,
  snap.major_course_count,
  snap.major_course_avg_score,
  snap.subject_basic_course_count,
  snap.subject_basic_course_avg_score,
  snap.general_course_count,
  snap.general_course_avg_score,
  snap.required_course_count,
  snap.required_course_avg_score,
  snap.elective_course_count,
  snap.elective_course_avg_score,
  snap.all_course_count,
  snap.all_course_avg_score,
  snap.absent_exam_count,
  snap.makeup_exam_count,
  snap.retake_count,
  snap.required_credits,
  snap.elective_credits,
  snap.earned_total_credits,
  snap.failed_total_credits,
  snap.average_credit_gpa,
  snap.cet4_score,
  snap.cet6_score,
  snap.class_teacher,
  snap.counselor,
  snap.competition_award_count,
  snap.competition_award_detail,
  adm.admission_score,
  adm.source_place,
  adm.native_place,
  adm.hmt_status,
  snap.created_at,
  snap.updated_at
FROM students sp
INNER JOIN academic_snapshots snap ON snap.student_id = sp.id
INNER JOIN (
  SELECT student_id, MAX(grade) AS max_grade
  FROM academic_snapshots
  GROUP BY student_id
) latest ON latest.student_id = snap.student_id AND latest.max_grade = snap.grade
LEFT JOIN student_admission adm ON adm.student_id = sp.id
"""


async def main() -> None:
    await Tortoise.init(config=TORTOISE_ORM, _enable_global_fallback=True)
    conn = Tortoise.get_connection("default")
    for sql in ALTER_STATEMENTS:
        try:
            await conn.execute_script(sql)
            print("OK", sql[:80])
        except Exception as exc:
            print("FAIL", sql[:60], exc)

    await Tortoise.generate_schemas(safe=True)
    print("generate_schemas done")

    for sql in INDEX_STATEMENTS:
        try:
            await conn.execute_script(sql)
            print("IDX", sql[:70])
        except Exception as exc:
            print("IDX skip", exc)

    try:
        await conn.execute_script(VIEW_SQL)
        print("VIEW v_student_academic_records ok")
    except Exception as exc:
        print("VIEW skip", exc)

    fk_sqls = [
        """
        DO $$ BEGIN
          ALTER TABLE employment_records
            ADD CONSTRAINT fk_employment_college
            FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
          ALTER TABLE student_tags
            ADD CONSTRAINT fk_student_tags_student_pk
            FOREIGN KEY (student_pk) REFERENCES students(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
          ALTER TABLE employment_records
            ADD CONSTRAINT fk_employment_student_pk
            FOREIGN KEY (student_pk) REFERENCES students(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
          ALTER TABLE thesis_advisors
            ADD CONSTRAINT fk_thesis_student_pk
            FOREIGN KEY (student_pk) REFERENCES students(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
        """
        DO $$ BEGIN
          ALTER TABLE student_tags
            ADD CONSTRAINT fk_student_tags_rule_run
            FOREIGN KEY (rule_run_id) REFERENCES analysis_rule_runs(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
        """,
    ]
    for sql in fk_sqls:
        try:
            await conn.execute_script(sql)
            print("FK ok")
        except Exception as exc:
            print("FK skip", exc)

    await Tortoise.close_connections()


if __name__ == "__main__":
    asyncio.run(main())
