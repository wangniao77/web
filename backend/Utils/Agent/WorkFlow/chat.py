"""追问工作流：读取 OpenViking 会话记忆 + 页面资源，流式回复。"""

from __future__ import annotations

import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from Routers.Models.req.agent_model import AgentAnalyzeContext
from Utils.Agent.API.llm import LLMClient
from Utils.Agent.OpenViking import get_openviking_client, memory_session, resource_key_tasks


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

    college_id = context.collegeId or "default"
    snapshot_raw = await viking.read(resource_key_tasks(college_id))
    memory_raw = await viking.read(memory_session(session_id))

    system = (
        "你是高校治理驾驶舱助手。结合给定的重点任务快照与会话记忆回答用户追问，"
        "语气简洁、可执行；不要编造快照中不存在的任务。"
    )
    user = (
        f"页面: {context.scope}/{context.page}\n"
        f"快照:\n{(snapshot_raw or '')[:4000]}\n\n"
        f"近期记忆:\n{(memory_raw or '')[-2000:]}\n\n"
        f"用户问题: {message}"
    )

    await viking.append_memory(
        memory_session(session_id),
        json.dumps({"type": "user", "content": message, "traceId": trace_id}, ensure_ascii=False),
    )

    collected: list[str] = []
    if llm.enabled:
        async for token in llm.stream_text(system, user):
            collected.append(token)
            yield {"type": "token", "content": token, "traceId": trace_id}
    else:
        # 规则回复：从快照摘要拼一句可落地建议
        hint = "建议先核对需关注任务的责任人与下一里程碑，再安排双周督导。"
        if snapshot_raw:
            try:
                data = json.loads(snapshot_raw)
                tasks = data.get("tasks") or []
                delayed = [
                    t
                    for t in tasks
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

    await viking.append_memory(
        memory_session(session_id),
        json.dumps(
            {"type": "assistant", "content": "".join(collected), "traceId": trace_id},
            ensure_ascii=False,
        ),
    )
    yield {"type": "done", "traceId": trace_id}
