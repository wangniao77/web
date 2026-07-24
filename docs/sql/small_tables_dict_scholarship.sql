-- 小表模式：字典表 + 事实表（奖学金 / 预警类别 / 高潜标签）
-- 说明：类型配置放字典小表，学生获得记录放事实小表，便于扩展与维护。

CREATE TABLE IF NOT EXISTS dict_scholarship_types (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  level VARCHAR(32) NOT NULL,
  amount_hint NUMERIC(12, 2) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_scholarships (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(32) NOT NULL,
  academic_year VARCHAR(32) NOT NULL,
  scholarship_type_id INT NOT NULL REFERENCES dict_scholarship_types(id),
  amount NUMERIC(12, 2) NULL,
  award_date DATE NULL,
  source VARCHAR(64) NULL,
  remark VARCHAR(255) NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, academic_year, scholarship_type_id)
);

CREATE INDEX IF NOT EXISTS idx_student_scholarships_student_id
  ON student_scholarships (student_id);

CREATE TABLE IF NOT EXISTS dict_warning_categories (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dict_high_potential_tags (
  id SERIAL PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 种子：奖学金类型
INSERT INTO dict_scholarship_types (code, name, level, amount_hint, sort_order) VALUES
  ('national', '国家奖学金', '国家级', 8000, 10),
  ('national-inspire', '国家励志奖学金', '国家级', 5000, 20),
  ('school-1', '校级一等奖学金', '校级', 3000, 30),
  ('school-2', '校级二等奖学金', '校级', 2000, 40),
  ('school-3', '校级三等奖学金', '校级', 1000, 50),
  ('college', '学院奖学金', '院级', 800, 60)
ON CONFLICT (code) DO NOTHING;

INSERT INTO dict_warning_categories (code, name, sort_order) VALUES
  ('psy', '心理预警', 10),
  ('academic', '学业预警', 20),
  ('employment', '就业预警', 30)
ON CONFLICT (code) DO NOTHING;

INSERT INTO dict_high_potential_tags (code, name, sort_order) VALUES
  ('academic', '学业高潜', 10),
  ('competition', '竞赛高潜', 20),
  ('cadre', '干部奉献高潜', 30),
  ('innovation', '创新创业高潜', 40)
ON CONFLICT (code) DO NOTHING;
