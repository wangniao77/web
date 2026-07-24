# 学院驾驶舱数据库落地说明

## 执行顺序

```bash
cd backend
python scripts/migrate_college_schema.py   # 补列 + 建新表
python scripts/import_ugit_data.py         # 从 D:\UGit\data 灌库
```

## 本次灌库结果（big-data-ai）

| 表 | 行数 | 来源 |
|----|------|------|
| `student_academic_records` | 2754 | 学籍+绩点+CET+住宿回填 |
| `classes` | 110 | 由学籍班级同步 |
| `employment_records` | 709 | 就业信息20260623.xlsx |
| `research_projects` | 84 | 纵向+横向 |
| `research_papers` | 115 | 科研论文 |
| `research_ips` | 4 | 知识产权 |
| `research_platforms` | 7 | 平台/团队/工程中心 |
| `achievement_items` | 218 | 项目/论文/专利/平台/学术报告 |
| `teachers` | 84 | 写真75 + 导师/科研负责人汇聚 |
| `thesis_advisors` | 521 | 22级毕设指导 |
| `student_tags` | ~4105 | 规则批算（预警+高潜）；`tag_key` 对齐前端枚举；含 `student_pk`/`rule_run_id`/`source` |
| `college_kpi_snapshots` | 1 | 聚合快照（发展指数约 85.27） |

## 学生域 3NF 现状

宽表 `student_academic_records` 仍保留作 ETL 源；规范化表已回填，读路径优先兼容视图。

| 对象 | 说明 | 约行数 |
|------|------|--------|
| `students` | 一人一档主档（`student_no` UK） | 2754 |
| `student_admission` | 1:1 招生属性（录取分/生源地） | 2754（录取分非空 ≈2720） |
| `academic_snapshots` | 人×年级学业快照 | 2754 |
| `analysis_rule_runs` | 高潜/预警批算批次 | ≥1 |
| `v_student_academic_records` | students ⋈ admission ⋈ 最新 snapshot | 2754 |
| 读路径 | `college_db.fetch_college_records` → 视图优先 | — |
| 标签统计 | `talent_overview_service` 读 `student_tags` | — |

回填：`python scripts/import_ugit_data.py --only normalize-students`  
批算：`python scripts/recompute_student_tags.py --college big-data-ai`  
权威设计：[`student-3nf-blueprint.md`](./student-3nf-blueprint.md)

## 缺失数据汇总（需补文件或手工录入）

### A. `D:\UGit\data` 有文件但未结构化入库

| 数据 | 现状文件 | 原因 | 建议 |
|------|----------|------|------|
| 竞赛获奖明细 | `66-104 竞赛获奖数据…docx`、`五年获奖情况汇总（A3打印版）.docx` | Word 非结构化，无稳定表格解析 | 提供 Excel：学生学号、赛事名称、级别、获奖时间、奖项等级 |
| 课程成绩明细 | `全年级…/*级课程成绩表.xls`、`成绩/*合并_每人一行.xlsx` | 体量大、字段与学籍宽表策略冲突；当前仅用绩点汇总 | 若要课程门数/挂科门次，提供「每人每年级一行」汇总列或允许导入课程维度表 |
| 带照片学籍 | `学生学籍（带照片）/*.xls` | 含嵌入图片，体积大 | 已用无照片学籍；照片路径可选另表 |
| 教师写真本体 | `教师个人照合集/*.jpg` | 仅登记姓名与相对路径，未存二进制 | 如需头像服务，指定静态资源目录挂载 |
| 学生基础数据 xlsx | `…学生基础数据260616.xlsx` | 存在 Excel 锁/`~$` 临时文件，无法可靠打开 | 关闭占用后另存为标准 xlsx，再约定字段 |
| 培养方案 PDF | `2024级培养方案.pdf` | 文本版 txt 已进 OpenViking | PDF 可不入库 |
| 发展白皮书模板 | `…2025年发展白皮书（框架模板）` | 模板非数据 | 若有正式定稿指标表，导出 Excel |

### B. 驾驶舱需要、当前完全无源

| 模块/字段 | 目标表 | 缺什么 |
|-----------|--------|--------|
| 年度重点规划任务 | `key_tasks` | 任务清单 Excel：名称、进度、状态、牵头部门、截止日、领域、目标/实际、风险 |
| 课程建设明细 | `courses` | 课程名称、建设级别、负责人、学时、选课人数、学年、状态 |
| 教师职称/学历结构 | `teachers` 扩展列 | 工号、职称、学位、是否博导、入职时间、所属系所（现仅有姓名级主档） |
| 专业软科排名/五维 | `major_rank_snapshots` | 专业、年份、全国/省内/财经排名、五维分数 |
| 招生质量 | `enrollment_cohorts` | 年份、专业、录取人数、一志愿率、均分/最低分/位次 |
| 心理预警 | `student_tags` | 心理中心名单（学号、等级、原因）；当前规则不产出 psychological |
| 高潜：干部/双百/农村 | `student_tags` | 学工系统标签名单；当前仅学业/竞赛/就业相关规则 |
| 就业预警名单 | 同上 | 专属就业困难生名单（现仅用毕业年级+低 GPA 近似） |
| 第二课堂学分 | 学籍或标签 | 第二课堂学分完成情况 |
| 教评明细 | 新表（L2） | 课程/教师教评分数 |
| 师生比口径佐证 | KPI | 官方在校生口径、专任教师口径说明 |
| 研究生人数 | 学籍 | 当前学籍以本科为主，缺研究生名册 |
| 对标院校/里程碑叙事 | `achievement_items` note 或独立表 | 精品成果「里程碑」「对标」文案与年度大事记 |

### C. 已有数据但质量/覆盖缺口

| 项 | 说明 |
|----|------|
| 毕设指导仅 22 级 | 缺 23/24/25 级指导关系 |
| 住宿回填 | 外院宿舍行已跳过；本院未命中学籍的更新失败计入 skip |
| 竞赛次数字段 | 学籍 `competition_award_count` 多数为空，因未解析获奖 docx |
| KPI `courses=0` | 无课程建设导入 |
| 发展指数 | 占位公式，非正式白皮书口径 |
| 学籍生源字段 | `admission_score` / `source_place` / `native_place` / `hmt_status` 已从 `*级学籍.xls` 回填；支撑入口桑基与高考分聚合 |

## 隐私

电话 / 身份证 / 银行卡 / 宿舍号等敏感列**永不入库**。录取分数与生源地属学业公开统计字段，已入库。
