"""OpenViking 虚拟路径约定（对齐官方 scope：resources / agent / user）。"""

from __future__ import annotations


def resource_key_tasks(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/key-tasks/snapshot.json"


def skill_key_tasks_analysis() -> str:
    return "viking://agent/skills/college/key-tasks-analysis/SKILL.md"


def resource_academic_risk(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/academic-risk/snapshot.json"


def skill_academic_risk_analysis() -> str:
    return "viking://agent/skills/college/academic-risk-analysis/SKILL.md"


def resource_enrollment_employment(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/enrollment-employment/snapshot.json"


def resource_enrollment_employment_report(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/enrollment-employment/analysis-report.json"


def skill_enrollment_employment_analysis() -> str:
    return "viking://agent/skills/college/enrollment-employment-analysis/SKILL.md"


def resource_graduate_cultivation(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/graduate-cultivation/snapshot.json"


def skill_graduate_cultivation_analysis() -> str:
    return "viking://agent/skills/college/graduate-cultivation-analysis/SKILL.md"


def resource_benchmark_swot(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/benchmark-swot/snapshot.json"


def skill_benchmark_swot_analysis() -> str:
    return "viking://agent/skills/college/benchmark-swot-analysis/SKILL.md"


def resource_benchmark_overview(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/benchmark-overview/snapshot.json"


def skill_benchmark_overview_analysis() -> str:
    return "viking://agent/skills/college/benchmark-overview-analysis/SKILL.md"


def resource_discipline_overview(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/discipline-overview/snapshot.json"


def skill_discipline_overview_analysis() -> str:
    return "viking://agent/skills/college/discipline-overview-analysis/SKILL.md"


def resource_cultivation_plans(year: str = "2024") -> str:
    """培养方案知识库根目录（导入脚本目标 parent）。"""
    return f"viking://resources/college/cultivation-plans/{year}/"


def memory_session(session_id: str) -> str:
    """兼容旧路径；会话优先走 /api/v1/sessions。"""
    return f"viking://user/default/sessions/{session_id}/transcript.jsonl"


KEY_TASKS_SKILL_DOC = """# 学院重点任务分析技能

## 目标
根据任务汇总与明细，输出 3 条结构化洞察与 3 条可执行建议。

## 输出 JSON Schema
{
  "insights": [{"title": "string", "detail": "string", "tone": "good|warn|info"}],
  "actions": ["string"]
}

## 口径
- 完成率、需关注占比、科研/教学均进度差是核心拆解维度
- 不要编造不在快照中的任务名称
- 建议动作需可落地（责任人、例会、课表等）
"""

ACADEMIC_RISK_SKILL_DOC = """# 学院学业风险聚合分析技能

## 目标
根据年级/专业聚合预警快照，输出 3 条洞察与 3 条可执行建议。

## 输出 JSON Schema
{
  "insights": [{"title": "string", "detail": "string", "tone": "good|warn|info"}],
  "actions": ["string"]
}

## 硬性约束
- 快照仅含聚合指标，禁止点名学生、禁止编造学号/姓名
- 关注 warnRate、高风险人次、年级与专业集中度、CET 通过率
- 建议动作面向辅导员/班主任/专业责任人，可院内落地
"""

EMPLOYMENT_SKILL_DOC = """# 学院就业深度分析技能

## 目标
基于无 PII 的就业聚合快照，输出可核对的结构化就业分析报告。

## 输出 JSON Schema
{
  "headline": "一句话总判断",
  "insights": [
    {
      "title": "string",
      "detail": "string",
      "tone": "good|warn|info",
      "evidence": [
        {
          "source": "db|openviking|web",
          "label": "指标名",
          "value": "指标值",
          "ref": "可选：路径或公开信源名+年份"
        }
      ]
    }
  ],
  "actions": ["可执行建议"],
  "sections": [{"title": "分段标题", "bullets": ["要点"]}]
}

## 硬性约束
- 禁止输出学生姓名、学号或可识别个人的信息
- 每条 insight 至少 1 条 source=db 的 evidence，数值必须来自快照
- 允许补充省级/全国公开就业率等对比，须 source=web 且 ref 写明机构名+年份；无法核对则省略
- 关注落实率、高质量率、专业差距、行业集中度、待就业、历年趋势
- 建议动作面向就业办/辅导员/专业责任人，可院内落地
"""

GRADUATE_CULTIVATION_SKILL_DOC = """# 学院研究生培养分析技能

## 目标
基于无 PII 的研究生培养聚合快照，输出可核对的结构化分析报告。

## 输出 JSON Schema
{
  "headline": "一句话总判断",
  "insights": [
    {
      "title": "string",
      "detail": "string",
      "tone": "good|warn|info",
      "evidence": [
        {
          "source": "db|openviking|web",
          "label": "指标名",
          "value": "指标值",
          "ref": "可选"
        }
      ]
    }
  ],
  "actions": ["可执行建议"],
  "sections": [{"title": "分段标题", "bullets": ["要点"]}]
}

## 硬性约束
- 禁止输出学生姓名、学号
- 每条 insight 至少 1 条 source=db 的 evidence，数值必须来自快照
- 关注：研究生规模与占比、专业集中度、导师覆盖、论文/课题科研参与、研究生就业出口
- 建议动作面向研究生秘书/导师组/学院科研与就业协同
"""

BENCHMARK_SWOT_SKILL_DOC = """# 学院精品成果短板分析技能

## 目标
根据对标快照，为每个缺口写一句研判，供一级劣势卡片展示。

## 输出 JSON Schema
{
  "headline": "一句话总判断",
  "insights": [
    {
      "title": "research|teaching|talent|discipline|party",
      "detail": "不超过40字的研判",
      "tone": "warn"
    }
  ],
  "actions": ["可执行建议"]
}

## 写法
- detail 只写研判和补齐方向，卡片上已有指标名和 x/y，不要再写一遍
- 例如：「培育与申报明显滞后」「台账或口径缺失，需尽快补齐」
- 不要写成「教学成果1/8项，缺口7项，…」
- empty：写台账/口径缺失，不要编造成果

## 硬性约束
- insights.title 必须是快照 items[].key，禁止改成中文标题
- detail 必须引用快照里的原数字，禁止改数、禁止编造成果名称
- 只为 status=gap|near|empty 的条目写说明
- 不要输出学生姓名或学号
"""

BENCHMARK_OVERVIEW_SKILL_DOC = """# 学院精品成果总览分析技能

## 目标
根据五维对标快照，输出 3～5 条结构化洞察与 3 条可执行建议，供二级总览页展示。

## 输出 JSON Schema
{
  "headline": "一句话总判断",
  "insights": [
    {
      "title": "中文标题",
      "detail": "40～80字研判，须引用快照原数字",
      "tone": "good|warn|info"
    }
  ],
  "actions": ["可执行建议"]
}

## 关注
- gauges[].status / value / target / gap
- summary.met / near / gap / empty
- heroes 与 evidenceCounts
- 优势支点与最紧缺口

## 硬性约束
- 禁止改数、禁止编造成果名称
- 不要输出学生姓名或学号
"""

DISCIPLINE_OVERVIEW_SKILL_DOC = """# 学院专业发展全景分析技能

## 目标
根据专业排名与软科五维细分快照，输出一句总判断、3 条有依据的研判与 3 条可执行建议。
第一条写学院矩阵总势，后两条落到具体专业，禁止三条并列空话。

## 输出 JSON Schema
{
  "headline": "一句话总判断",
  "insights": [
    {
      "title": "中文标题",
      "detail": "40～90字研判，须引用快照原数字",
      "tone": "good|warn|info",
      "evidence": [
        { "source": "db", "label": "指标名", "value": "指标值" }
      ]
    }
  ],
  "actions": ["可执行建议"]
}

## 关注
- majors[].name / nationalRank / grade / yoyChange / provincialRank / financePeerRank
- majors[].softDimensions[]（学校条件、学科支撑、专业生源、专业就业、专业条件）
- dimensions[] 学院五维均值 vs peerAverage
- ranking 学院中位排名
- 把学院弱维落到具体专业，不要只写“整体一般”

## 硬性约束
- 禁止改数、禁止编造未上榜专业的全国名次
- 缺源字段用「缺源」表述，不要补假数
- 不要输出学生姓名或学号
"""
