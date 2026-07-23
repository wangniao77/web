# 数据导入说明（D:\UGit\data → PostgreSQL）

## 已实现

脚本：`backend/scripts/import_ugit_data.py`

| 步骤 | 源文件 | 目标表 |
|------|--------|--------|
| students | `全年级…/*级学籍.xls` | `student_academic_records` |
| gpa | `全年级…/*绩点.xls` | 同上（学分/GPA） |
| cet | `…/四六级成绩/*.xls` | 同上（cet4/cet6） |
| dorm | 本院住宿 xlsx | 同上（校区/班主任/辅导员） |
| employment | `就业信息20260623.xlsx` | `employment_records` |
| research | `科研成果A3大表*.xls` | `research_projects/papers/ips` |
| thesis | `*毕业设计指导*.xls` | `thesis_advisors` |

**故意未导入：** 课程成绩大表、带照片学籍、教师写真 jpg、获奖 docx；身份证/银行账号/电话等敏感列。

## 执行

1. 在 `backend/.env` 配置可连通的库：

```env
POSTGRES_DSN=postgres://USER:PASSWORD@HOST:5432/studentmodelingdata
```

2. 安装依赖并导入：

```bash
cd backend
pip install -r requirements.txt
python scripts/import_ugit_data.py
```

仅导入部分步骤：

```bash
python scripts/import_ugit_data.py --only students,gpa,cet
```

解析自检（不连库）：

```bash
python scripts/dryrun_parse_data.py
```
