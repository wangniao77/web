"""LLM 客户端封装。未配置密钥时返回 None，由工作流走规则引擎。"""

from __future__ import annotations

import json
import logging
from typing import Any, AsyncIterator

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)


class LLMClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_base = settings.llm_api_base.rstrip("/")
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.api_base)

    async def complete_json(self, system: str, user: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                resp = await client.post(
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "temperature": 0.2,
                        "response_format": {"type": "json_object"},
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    },
                )
                resp.raise_for_status()
                content = resp.json()["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception as exc:
            logger.warning("LLM complete_json failed: %s", exc)
            return None

    async def stream_text(self, system: str, user: str) -> AsyncIterator[str]:
        if not self.enabled:
            yield "当前未配置大模型密钥，已使用规则回复："
            yield user[:80]
            return

        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    f"{self.api_base}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": self.model,
                        "stream": True,
                        "temperature": 0.3,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    },
                ) as resp:
                    resp.raise_for_status()
                    async for line in resp.aiter_lines():
                        if not line.startswith("data:"):
                            continue
                        raw = line[5:].strip()
                        if not raw or raw == "[DONE]":
                            break
                        try:
                            payload = json.loads(raw)
                            delta = payload["choices"][0].get("delta", {})
                            token = delta.get("content")
                            if token:
                                yield token
                        except Exception:
                            continue
        except Exception as exc:
            logger.warning("LLM stream failed: %s", exc)
            yield f"模型调用失败：{exc}"
