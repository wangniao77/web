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
