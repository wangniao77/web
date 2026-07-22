from typing import Literal

from pydantic import BaseModel, Field


class AgentInsight(BaseModel):
    title: str
    detail: str
    tone: Literal["good", "warn", "info"] = "info"


class AgentAnalyzeData(BaseModel):
    insights: list[AgentInsight] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    sessionId: str
    traceId: str
    source: Literal["agent", "rule", "mock"] = "rule"
