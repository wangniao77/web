"""OpenViking HTTP 客户端。

未启动 OpenViking 时自动降级为进程内内存存储，保证 analyze/chat 链路可跑通。
默认服务地址: http://127.0.0.1:1933
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)

_memory_store: dict[str, str] = {}


class OpenVikingClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        settings = get_settings()
        self.base_url = (base_url or settings.openviking_url).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.openviking_api_key
        self._online: bool | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(f"{self.base_url}/health", headers=self._headers())
                self._online = resp.status_code < 500
                return self._online
        except Exception:
            self._online = False
            return False

    async def store(self, path: str, content: str | dict[str, Any], *, metadata: dict | None = None) -> bool:
        body = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)
        if not await self._ensure_online():
            _memory_store[path] = body
            logger.debug("OpenViking offline, stored in-memory: %s", path)
            return True

        payload = {"path": path, "content": body, "metadata": metadata or {}}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # 兼容常见 REST 形态；服务端字段名以 OpenViking 实际为准时可再适配
                for endpoint in ("/v1/store", "/store", "/api/v1/files"):
                    resp = await client.post(
                        f"{self.base_url}{endpoint}",
                        headers=self._headers(),
                        json=payload,
                    )
                    if resp.status_code < 400:
                        return True
            _memory_store[path] = body
            return True
        except Exception as exc:
            logger.warning("OpenViking store failed, fallback memory: %s", exc)
            _memory_store[path] = body
            return True

    async def read(self, path: str) -> str | None:
        if not await self._ensure_online():
            return _memory_store.get(path)

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                for endpoint in (f"/v1/read", f"/read"):
                    resp = await client.post(
                        f"{self.base_url}{endpoint}",
                        headers=self._headers(),
                        json={"path": path},
                    )
                    if resp.status_code < 400:
                        data = resp.json()
                        if isinstance(data, dict):
                            return data.get("content") or data.get("data") or json.dumps(data)
                        return str(data)
            return _memory_store.get(path)
        except Exception as exc:
            logger.warning("OpenViking read failed: %s", exc)
            return _memory_store.get(path)

    async def search(self, query: str, *, root: str | None = None, top_k: int = 5) -> list[dict[str, Any]]:
        if not await self._ensure_online():
            hits = []
            for path, content in _memory_store.items():
                if root and not path.startswith(root):
                    continue
                if query.lower() in content.lower() or query.lower() in path.lower():
                    hits.append({"path": path, "snippet": content[:240]})
                if len(hits) >= top_k:
                    break
            return hits

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/v1/search",
                    headers=self._headers(),
                    json={"query": query, "root": root, "top_k": top_k},
                )
                if resp.status_code < 400:
                    data = resp.json()
                    if isinstance(data, list):
                        return data
                    if isinstance(data, dict):
                        return data.get("results") or data.get("data") or []
        except Exception as exc:
            logger.warning("OpenViking search failed: %s", exc)
        return []

    async def append_memory(self, path: str, line: str) -> None:
        existing = await self.read(path) or ""
        merged = f"{existing.rstrip()}\n{line}".lstrip("\n")
        await self.store(path, merged)

    async def _ensure_online(self) -> bool:
        if self._online is None:
            await self.health()
        return bool(self._online)


_client: OpenVikingClient | None = None


def get_openviking_client() -> OpenVikingClient:
    global _client
    if _client is None:
        _client = OpenVikingClient()
    return _client
