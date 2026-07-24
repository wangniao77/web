# 学生域目标 3NF 重构蓝图

> 范围：学院驾驶舱 · big-data-ai  
> 原则：兼容演进；学号作业务键；敏感字段永不入库  
> 状态：**S1–S4 已落地**（2026-07）；宽表保留作 ETL 源，读路径优先兼容视图

## 设计目标

把「一人多指标宽表」`student_academic_records` 拆成：

- 稳定主档 `students`
- 学年/年级快照 `academic_snapshots`
- 招生属性 `student_admission`
- 事件/标签事实表（tags / employment / thesis）
- 分析批算批次 `analysis_rule_runs`
- 官方招生队列 `enrollment_cohorts`（与个人录取分并存）

驾驶舱读兼容视图 `v_student_academic_records`，高潜/预警结构统计读 `student_tags`。

## 目标 ER

```
colleges ──┬── majors ── classes
           │
           ├── students ──┬── student_admission      (1:1)
           │              ├── academic_snapshots     (1:N 人×年级)
           │              ├── student_tags           (1:N)
           │              ├── employment_records     (1:1 现状)
           │              ├── thesis_advisors        (1:1)
           │              ├── course_scores*         (可选 L2)
           │              └── competition_awards*    (可选 L2)
           │
           ├── analysis_rule_runs → student_tags
           └── enrollment_cohorts ← majors           (学院×专业×年)
```

## 已落地表清单

| 表 | 粒度 | 主键 / 唯一 | 主要字段 | 现状（big-data-ai） |
|----|------|-------------|----------|---------------------|
| `students` | 一人一档 | `id`；`uk(student_no)` | name, gender, status, college_id, major_id, class_id… | ≈2754 |
| `student_admission` | 一人一份 | `pk→students.id` | admission_score, source_place, native_place, hmt_status | ≈2754；录取分非空 ≈2720 |
| `academic_snapshots` | 人×年级 | `uk(student_id, grade)` | gpa, credits, fail, cet, counselor, competition… | ≈2754（≈宽表行数） |
| `student_tags` | 人×标签 | uk(student_id, grade, tag_type, tag_key) + `student_pk` | tag_type, tag_key, level, reason, rule_run_id, source | 批算：预警≈842 + 高潜≈3263 |
| `analysis_rule_runs` | 批算批次 | `id` | kind(hp\|warning\|both), rule_version, student_count, tag_count | 有 |
| `employment_records` / `thesis_advisors` | 事实 | + `student_pk` FK | 既有列 | 已 FK 化 |
| `enrollment_cohorts` | 学院×专业×年 | 已有 uk | 官方一志愿/位次 | **仍空**（待官方表） |
| `v_student_academic_records` | 视图 | — | 列名对齐旧宽表 | `college_db` 优先读 |

`tag_key` 对齐前端枚举：

- 高潜：`academic|competition|leadership|rural|internship|career`
- 预警：`academic|credit|psychological|employment`
- `psychological` / `leadership` / `rural` **仅外部名单导入时写入**，规则批算不造假

## 宽表字段迁移动线

| 宽表字段族 | 迁入 | 说明 |
|------------|------|------|
| 学号/姓名/性别/状态/院专班/校区/培养层次 | `students` | 主档；名称以维度表为准 |
| admission_score / source_place / native_place / hmt_status | `student_admission` | 入口桑基与高考分 |
| GPA/学分/挂科/缺考补考重修/四六级/班主任辅导员/竞赛计数 | `academic_snapshots` | 按 grade；视图取最新年级 |
| 高潜/预警结果 | `student_tags` + `analysis_rule_runs` | `scripts/recompute_student_tags.py` |

## 读路径

1. **`Utils/DB/read/college_db.fetch_college_records`**  
   有 `students` 数据 → `v_student_academic_records`；异常回退宽表。
2. **人才培养高潜/预警结构统计**  
   `talent_overview_service` 读 `student_tags`；表空时回退内存规则。
3. **花名册下钻**  
   仍可用规则即时算明细；批算结果供结构统计与追溯。

## 运维命令

```bash
cd backend
python scripts/migrate_college_schema.py
python scripts/import_ugit_data.py --only normalize-students
python scripts/recompute_student_tags.py --college big-data-ai
```

## 分阶段落地

| 阶段 | 工作 | 状态 |
|------|------|------|
| S1 | 建 students / admission / snapshots / analysis_rule_runs | ✅ |
| S2 | 宽表 ETL 回填 | ✅ |
| S3 | 兼容视图 + college_db 读视图 | ✅ |
| S4 | tags/employment/thesis FK + 批算落库 | ✅ |
| S5 | 课明细/竞赛/官方 cohorts | 可选 |

## 明确不做

- 电话 / 身份证 / 银行卡 / 宿舍号不入库
- S1–S4 不强行上课级明细
- 不删除 `enrollment_cohorts`（个人分 ≠ 官方队列）
- 培养方案继续放 OpenViking，不进关系库
