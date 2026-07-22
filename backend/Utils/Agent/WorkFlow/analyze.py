"""重点任务分析工作流：OpenViking 上下文 + 规则/LLM 生成洞察。"""

from __future__ import annotations

import json
import uuid
from typing import Any

from Routers.Models.req.agent_model import AgentAnalyzeContext
from Routers.Models.resp.agent_model import AgentAnalyzeData, AgentInsight
from Services.college_service import CollegeService
from Utils.Agent.API.llm import LLMClient
from Utils.Agent.OpenViking import (
    KEY_TASKS_SKILL_DOC,
    get_openviking_client,
    memory_session,
    resource_key_tasks,
    skill_key_tasks_analysis,
)


def _rule_insights_from_snapshot(snapshot: dict[str, Any]) -> AgentAnalyzeData:
    summary = snapshot.get("summary") or {}
    tasks = snapshot.get("tasks") or []
    total = int(summary.get("total") or len(tasks) or 0)
    completed = int(summary.get("completed") or 0)
    ongoing = int(summary.get("ongoing") or 0)
    delayed = int(summary.get("delayed") or 0)
    completion_rate = summary.get("completionRate")
    if completion_rate is None and total:
        completion_rate = round(completed / total * 100, 1)
    completion_rate = float(completion_rate or 0)

    attention_share = round(delayed / total * 100) if total else 0

    def _cat(t: dict) -> str:
        return str(t.get("category") or "")

    research = [t for t in tasks if _cat(t) == "research"]
    teaching = [t for t in tasks if _cat(t) == "teaching"]

    def avg(items: list[dict]) -> int:
        if not items:
            return 0
        return round(sum(float(t.get("progress") or 0) for t in items) / len(items))

    research_avg = avg(research)
    teaching_avg = avg(teaching)
    low = sorted(tasks, key=lambda t: float(t.get("progress") or 0))[:2]
    risk = [
        t
        for t in tasks
        if str(t.get("statusClass") or "") == "delayed"
        or "关注" in str(t.get("statusLabel") or "")
        or str(t.get("status") or "") in {"delayed", "overdue", "attention"}
    ]

    insights = [
        AgentInsight(
            title="总体完成节奏可控",
            detail=(
                f"年度完成率 {completion_rate}%，已完成 {completed} 项、推进中 {ongoing} 项；"
                "主体任务按节点推进。"
            ),
            tone="good",
        ),
        AgentInsight(
            title="风险仍集中在少数任务",
            detail=(
                f"需关注 {delayed} 项，占比约 {attention_share}%。"
                + (f"当前最紧的是「{risk[0].get('name')}」。" if risk else "")
            ),
            tone="warn",
        ),
        AgentInsight(
            title="科研与教学进度差可拆解",
            detail=(
                f"科研均进度 {research_avg}%、教学均进度 {teaching_avg}%，"
                f"差距 {abs(research_avg - teaching_avg)} 个百分点；低进度任务："
                f"{'、'.join(str(t.get('name')) for t in low) or '暂无'}。"
            ),
            tone="info",
        ),
    ]
    actions = [
        "对「需关注」任务建立双周督导清单，明确责任人与补救节点",
        "把低进度科研任务与学院科研例会绑定，提前预审材料",
        "教学竞赛类任务提前锁定参赛教师课表，避免报名窗口冲突",
    ]
    return AgentAnalyzeData(
        insights=insights,
        actions=actions,
        sessionId="",
        traceId="",
        source="rule",
    )


async def _load_snapshot(context: AgentAnalyzeContext, college_service: CollegeService) -> dict[str, Any]:
    if context.summarySnapshot:
        return context.summarySnapshot
    if context.page == "key-tasks":
        detail = await college_service.get_key_tasks_detail(college_id=context.collegeId)
        return detail
    return {"summary": {}, "tasks": []}


async def run_analyze(
    *,
    context: AgentAnalyzeContext,
    session_id: str | None,
    refresh: bool,
    college_service: CollegeService | None = None,
    llm: LLMClient | None = None,
) -> AgentAnalyzeData:
    college_service = college_service or CollegeService()
    llm = llm or LLMClient()
    viking = get_openviking_client()

    sid = session_id or f"sess-{uuid.uuid4().hex[:12]}"
    trace_id = f"trace-{uuid.uuid4().hex[:12]}"

    snapshot = await _load_snapshot(context, college_service)
    college_id = context.collegeId or "default"

    # 确保技能与资源写入 OpenViking（或内存降级）
    await viking.store(skill_key_tasks_analysis(), KEY_TASKS_SKILL_DOC)
    await viking.store(
        resource_key_tasks(college_id),
        snapshot,
        metadata={"page": context.page, "scope": context.scope},
    )

    skill_text = await viking.read(skill_key_tasks_analysis()) or KEY_TASKS_SKILL_DOC
    source: str = "rule"
    result = _rule_insights_from_snapshot(snapshot)

    if llm.enabled:
        system = (
            "你是高校治理驾驶舱分析助手。严格按技能说明输出 JSON，"
            "字段仅限 insights/actions，tone 只能是 good|warn|info。"
        )
        user = (
            f"技能说明:\n{skill_text}\n\n"
            f"页面: {context.scope}/{context.page}\n"
            f"任务快照:\n{json.dumps(snapshot, ensure_ascii=False)[:8000]}"
        )
        parsed = await llm.complete_json(system, user)
        if parsed and isinstance(parsed.get("insights"), list):
            insights = []
            for item in parsed["insights"][:5]:
                if not isinstance(item, dict):
                    continue
                tone = item.get("tone") if item.get("tone") in {"good", "warn", "info"} else "info"
                insights.append(
                    AgentInsight(
                        title=str(item.get("title") or "洞察"),
                        detail=str(item.get("detail") or ""),
                        tone=tone,
                    )
                )
            actions = [str(a) for a in (parsed.get("actions") or []) if a][:5]
            if insights:
                result = AgentAnalyzeData(
                    insights=insights,
                    actions=actions or result.actions,
                    sessionId=sid,
                    traceId=trace_id,
                    source="agent",
                )
                source = "agent"

    if source != "agent":
        result.sessionId = sid
        result.traceId = trace_id
        result.source = "rule"

    # 会话记忆
    await viking.append_memory(
        memory_session(sid),
        json.dumps(
            {
                "type": "analyze",
                "traceId": trace_id,
                "refresh": refresh,
                "page": context.page,
                "insightCount": len(result.insights),
                "source": result.source,
            },
            ensure_ascii=False,
        ),
    )
    return result
