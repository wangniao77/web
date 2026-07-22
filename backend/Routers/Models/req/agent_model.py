from pydantic import BaseModel, Field


class AgentAnalyzeContext(BaseModel):
    scope: str = Field(description="college | university | student")
    page: str = Field(description="页面标识，如 key-tasks")
    collegeId: str | None = None
    studentId: str | None = None
    filters: dict[str, str] = Field(default_factory=dict)
    summarySnapshot: dict | None = None


class AgentAnalyzeReq(BaseModel):
    context: AgentAnalyzeContext
    sessionId: str | None = None
    refresh: bool = False


class AgentChatReq(BaseModel):
    sessionId: str
    message: str
    context: AgentAnalyzeContext
