"""OpenViking 虚拟路径约定（学院重点任务试点）。"""

from __future__ import annotations


def resource_key_tasks(college_id: str) -> str:
    cid = college_id or "default"
    return f"viking://resources/college/{cid}/key-tasks/snapshot.json"


def skill_key_tasks_analysis() -> str:
    return "viking://skills/college/key-tasks-analysis/SKILL.md"


def memory_session(session_id: str) -> str:
    return f"viking://memory/sessions/{session_id}/transcript.jsonl"


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
