# 数据导入说明（D:\UGit\data → PostgreSQL）

## 步骤

```bash
cd backend
python scripts/migrate_college_schema.py
python scripts/import_ugit_data.py
# 补充目录（例：7_27）
python scripts/import_ugit_data.py --data-root D:\UGit\data\7_27 --only employment,graduates,leadership,awards,teaching_hours
```

| `--only` 步骤 | 源 | 目标表 |
|---------------|-----|--------|
| students | `全年级…/*级学籍.xls` | `student_academic_records` + majors |
| gpa | `*绩点.xls` | 学分/GPA |
| cet | 四六级 `*.xls` | cet4/cet6 |
| dorm | 本院住宿 xlsx | 校区/班主任/辅导员 |
| employment | `*就业信息*.xlsx`（glob） | `employment_records` |
| graduates | `*研究生名册*` | `students` / 宽表（培养层次=研究生） |
| leadership | 班委 / 部门干部名单 | `student_leadership_roles` + `student_tags(leadership)` |
| awards | 省级以上荣誉获奖 xlsx | `competition_awards` / `student_projects` / `student_papers` |
| teaching_hours | `*课时数据*` | `teaching_course_hours` |
| internships | `*实习*.xlsx` | `student_internships` + `student_tags(internship)` |
| research | `科研成果A3大表*.xls` | projects/papers/ips/platforms/achievements |
| thesis | `*毕业设计指导*.xls` | `thesis_advisors` + teachers |
| teachers | 教师写真 jpg + 科研负责人 | `teachers` |
| classes | 由学籍同步 | `classes` + `school_class_id` |
| tags | 规则计算（保留 `source=import`） | `student_tags` |
| kpi | 聚合 | `college_kpi_snapshots` |

**隐私策略：** 身份证/银行卡不入库；**手机、地址、宿舍号按源表写入**（主档 `students`、宽表、干部表）。

缺失数据清单见 [`docs/college-db-architecture.md`](../docs/college-db-architecture.md)。
实现模块：`scripts/importers_supplement.py`。