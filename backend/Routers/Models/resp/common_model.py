from typing import Any, Generic, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    """统一 API 响应结构。"""

    code: int = Field(default=0, description="业务状态码，0 表示成功")
    message: str = Field(default="ok", description="提示信息")
    data: T | None = Field(default=None, description="业务数据")


class PageData(BaseModel, Generic[T]):
    """分页数据结构。"""

    items: list[T] = Field(default_factory=list)
    total: int = 0
    page: int = 1
    page_size: int = 20


class HealthResp(BaseModel):
    """健康检查响应。"""

    status: str
    app_name: str
