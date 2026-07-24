# 数据导入说明（D:\UGit\data → PostgreSQL）

## 步骤

```bash
cd backend
python scripts/migrate_college_schema.py
python scripts/import_ugit_data.py
```

| `--only` 步骤 | 源 | 目标表 |
|---------------|-----|--------|
| students | `全年级…/*级学籍.xls` | `student_academic_records` + majors |
| gpa | `*绩点.xls` | 学分/GPA |
| cet | 四六级 `*.xls` | cet4/cet6 |
| dorm | 本院住宿 xlsx | 校区/班主任/辅导员 |
| employment | `就业信息20260623.xlsx` | `employment_records` |
| research | `科研成果A3大表*.xls` | projects/papers/ips/platforms/achievements |
| thesis | `*毕业设计指导*.xls` | `thesis_advisors` + teachers |
| teachers | 教师写真 jpg + 科研负责人 | `teachers` |
| classes | 由学籍同步 | `classes` + `school_class_id` |
| tags | 规则计算 | `student_tags` |
| kpi | 聚合 | `college_kpi_snapshots` |

**故意未导入：** 课程成绩大表、带照片学籍、获奖 docx、电话/身份证/银行。

缺失数据清单见 [`docs/college-db-architecture.md`](../docs/college-db-architecture.md)。
