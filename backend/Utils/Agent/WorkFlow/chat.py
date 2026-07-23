"""追问工作流：OpenViking 资源快照 + sessions 会话记忆 + LLM/规则流式回复。"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from Routers.Models.req.agent_model import AgentAnalyzeContext
from Utils.Agent.API.llm import LLMClient
from Utils.Agent.OpenViking import (
    get_openviking_client,
    resource_academic_risk,
    resource_key_tasks,
)


def _resource_path(context: AgentAnalyzeContext) -> str:
    college_id = context.collegeId or "default"
    if context.page in {"academic-risk", "warning", "warnings"}:
        return resource_academic_risk(college_id)
    return resource_key_tasks(college_id)


async def run_chat_stream(
    *,
    session_id: str,
    message: str,
    context: AgentAnalyzeContext,
    llm: LLMClient | None = None,
) -> AsyncIterator[dict[str, Any]]:
    llm = llm or LLMClient()
    viking = get_openviking_client()
    trace_id = f"chat-{uuid.uuid4().hex[:12]}"

    await viking.ensure_session(session_id)
    snapshot_raw = await viking.read(_resource_path(context))
    memory_raw = await viking.get_session_context_text(session_id)

    system = (
        "你是高校治理驾驶舱助手。结合给定页面快照与会话记忆回答用户追问，"
        "语气简洁、可执行；禁止输出学生姓名或学号；不要编造快照中不存在的数据。"
    )
    user = (
        f"页面: {context.scope}/{context.page}\n"
        f"快照:\n{(snapshot_raw or '')[:4000]}\n\n"
        f"近期记忆:\n{(memory_raw or '')[-2000:]}\n\n"
        f"用户问题: {message}"
    )

    await viking.add_session_message(session_id, "user", message)

    collected: list[str] = []
    if llm.enabled:
        async for token in llm.stream_text(system, user):
            collected.append(token)
            yield {"type": "token", "content": token, "traceId": trace_id}
    else:
        hint = "建议先核对预警率最高的年级与专业，安排辅导员双周跟进。"
        if snapshot_raw:
            try:
                data = json.loads(snapshot_raw)
                if "topRiskMajors" in data:
                    top = (data.get("topRiskMajors") or [None])[0]
                    summary = data.get("summary") or {}
                    if top:
                        hint = (
                            f"当前聚合预警率 {summary.get('warnRate')}%，"
                            f"风险较集中在「{top.get('major')}」"
                            f"（预警率 {top.get('warnRate')}%）。"
                            "建议召开专业学业辅导会并建立帮扶台账。"
                        )
                elif data.get("tasks"):
                    delayed = [
                        t
                        for t in data.get("tasks") or []
                        if str(t.get("status") or t.get("statusClass") or "")
                        in {"delayed", "overdue", "attention"}
                        or "关注" in str(t.get("statusLabel") or "")
                    ]
                    if delayed:
                        hint = (
                            f"针对「{delayed[0].get('name')}」，"
                            f"建议明确责任人（{delayed[0].get('leadDept') or '承办单位'}）"
                            "并在两周内复核里程碑材料。"
                        )
            except Exception:
                pass
        text = f"已结合「{context.page}」上下文理解：「{message}」。{hint}"
        for ch in text:
            collected.append(ch)
            yield {"type": "token", "content": ch, "traceId": trace_id}

    await viking.add_session_message(session_id, "assistant", "".join(collected))
    yield {"type": "done", "traceId": trace_id}
