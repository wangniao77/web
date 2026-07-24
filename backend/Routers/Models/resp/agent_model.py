from typing import Any, Literal

from pydantic import BaseModel, Field


class AgentEvidence(BaseModel):
    source: Literal["db", "openviking", "web"] = "db"
    label: str
    value: str
    ref: str | None = None


class AgentInsight(BaseModel):
    title: str
    detail: str
    tone: Literal["good", "warn", "info"] = "info"
    evidence: list[AgentEvidence] = Field(default_factory=list)


class AgentReportSection(BaseModel):
    title: str
    bullets: list[str] = Field(default_factory=list)


class AgentAnalyzeData(BaseModel):
    insights: list[AgentInsight] = Field(default_factory=list)
    actions: list[str] = Field(default_factory=list)
    sessionId: str
    traceId: str
    source: Literal["agent", "rule", "mock"] = "rule"
    # 就业深度分析等扩展字段（其他 page 可为空）
    headline: str | None = None
    dataFingerprint: str | None = None
    filters: dict[str, Any] | None = None
    sections: list[AgentReportSection] | None = None
    generatedAt: str | None = None
