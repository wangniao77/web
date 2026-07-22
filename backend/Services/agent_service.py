from collections.abc import AsyncIterator
from typing import Any

from Routers.Models.req.agent_model import AgentAnalyzeContext, AgentAnalyzeReq, AgentChatReq
from Routers.Models.resp.agent_model import AgentAnalyzeData
from Utils.Agent.WorkFlow import run_analyze, run_chat_stream


class AgentService:
    async def analyze(self, req: AgentAnalyzeReq) -> AgentAnalyzeData:
        return await run_analyze(
            context=req.context,
            session_id=req.sessionId,
            refresh=req.refresh,
        )

    async def chat_stream(self, req: AgentChatReq) -> AsyncIterator[dict[str, Any]]:
        async for chunk in run_chat_stream(
            session_id=req.sessionId,
            message=req.message,
            context=req.context,
        ):
            yield chunk
