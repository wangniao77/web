"""LLM 客户端封装（OpenAI 兼容，含阿里云百炼）。未配置密钥时由工作流走规则引擎。"""

from __future__ import annotations

import json
import logging
import re
from typing import Any, AsyncIterator

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)


def _extract_json(text: str) -> dict[str, Any] | None:
    text = (text or "").strip()
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    # 容错：从 markdown 代码块或夹杂文本中抽 JSON
    fence = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.S)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        try:
            return json.loads(text[start : end + 1])
        except json.JSONDecodeError:
            return None
    return None


class LLMClient:
    def __init__(self) -> None:
        settings = get_settings()
        self.api_base = settings.llm_api_base.rstrip("/")
        self.api_key = settings.llm_api_key
        self.model = settings.llm_model

    @property
    def enabled(self) -> bool:
        return bool(self.api_key and self.api_base)

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def complete_json(self, system: str, user: str) -> dict[str, Any] | None:
        if not self.enabled:
            return None

        payloads = [
            # 百炼 DeepSeek V4：关闭思考，便于稳定输出 JSON
            {
                "model": self.model,
                "temperature": 0.2,
                "response_format": {"type": "json_object"},
                "enable_thinking": False,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            },
            {
                "model": self.model,
                "temperature": 0.2,
                "enable_thinking": False,
                "messages": [
                    {"role": "system", "content": system + "\n只输出 JSON 对象，不要其它文字。"},
                    {"role": "user", "content": user},
                ],
            },
        ]

        async with httpx.AsyncClient(timeout=90.0) as client:
            last_err: Exception | None = None
            for payload in payloads:
                try:
                    resp = await client.post(
                        f"{self.api_base}/chat/completions",
                        headers=self._headers(),
                        json=payload,
                    )
                    if resp.status_code >= 400:
                        last_err = RuntimeError(f"{resp.status_code} {resp.text[:300]}")
                        logger.warning("LLM complete_json http error: %s", last_err)
                        continue
                    content = resp.json()["choices"][0]["message"]["content"]
                    parsed = _extract_json(content)
                    if parsed is not None:
                        return parsed
                    last_err = RuntimeError(f"non-json content: {str(content)[:200]}")
                except Exception as exc:
                    last_err = exc
                    logger.warning("LLM complete_json failed: %s", exc)
            if last_err:
                logger.warning("LLM complete_json exhausted retries: %s", last_err)
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
                    headers=self._headers(),
                    json={
                        "model": self.model,
                        "stream": True,
                        "temperature": 0.3,
                        "enable_thinking": False,
                        "messages": [
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                    },
                ) as resp:
                    if resp.status_code >= 400:
                        body = await resp.aread()
                        yield f"模型调用失败：HTTP {resp.status_code} {body[:200]!r}"
                        return
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
