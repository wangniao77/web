import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from Routers.Models.req.agent_model import AgentAnalyzeReq, AgentChatReq
from Routers.Models.resp.agent_model import AgentAnalyzeData
from Routers.Models.resp.common_model import ApiResponse, ok
from Services.agent_service import AgentService

router = APIRouter(prefix="/agent", tags=["Agent 分析"])
agent_service = AgentService()


@router.post("/analyze", response_model=ApiResponse[AgentAnalyzeData])
async def analyze(req: AgentAnalyzeReq) -> ApiResponse:
    data = await agent_service.analyze(req)
    return ok(data)


@router.post("/chat")
async def chat(req: AgentChatReq) -> StreamingResponse:
    async def event_gen():
        async for chunk in agent_service.chat_stream(req):
            yield f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_gen(), media_type="text/event-stream")
