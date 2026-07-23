"""OpenViking HTTP 客户端（对齐 /api/v1/content|fs|search|sessions）。

服务不可达时降级为进程内内存，保证 Agent 链路可跑通。
"""

from __future__ import annotations

import json
import logging
from typing import Any
from urllib.parse import quote

import httpx

from core.config import get_settings

logger = logging.getLogger(__name__)

_memory_store: dict[str, str] = {}


def _parent_dir(uri: str) -> str:
    raw = uri.rstrip("/")
    if "/" not in raw:
        return uri
    parent = raw.rsplit("/", 1)[0]
    return parent if parent.endswith("://") or parent.count("/") < 3 else parent + "/"


def _unwrap(data: Any) -> Any:
    if isinstance(data, dict) and "result" in data:
        return data.get("result")
    return data


class OpenVikingClient:
    def __init__(self, base_url: str | None = None, api_key: str | None = None) -> None:
        settings = get_settings()
        self.base_url = (base_url or settings.openviking_url).rstrip("/")
        self.api_key = api_key if api_key is not None else settings.openviking_api_key
        self._online: bool | None = None

    def _headers(self) -> dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.api_key:
            headers["X-API-Key"] = self.api_key
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get(f"{self.base_url}/health", headers=self._headers())
                self._online = resp.status_code < 500
                return self._online
        except Exception:
            self._online = False
            return False

    async def mkdir(self, uri: str) -> bool:
        if not await self._ensure_online():
            return False
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/fs/mkdir",
                    headers=self._headers(),
                    json={"uri": uri if uri.endswith("/") else uri + "/"},
                )
                return resp.status_code < 400
        except Exception as exc:
            logger.debug("OpenViking mkdir failed: %s", exc)
            return False

    async def store(
        self,
        path: str,
        content: str | dict[str, Any],
        *,
        metadata: dict | None = None,
        mode: str | None = None,
    ) -> bool:
        del metadata  # 官方 content/write 无此字段；保留参数兼容调用方
        body = content if isinstance(content, str) else json.dumps(content, ensure_ascii=False)
        if not await self._ensure_online():
            _memory_store[path] = body
            logger.debug("OpenViking offline, stored in-memory: %s", path)
            return True

        await self.mkdir(_parent_dir(path))
        modes = [mode] if mode else ["replace", "create"]
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for m in modes:
                    if not m:
                        continue
                    resp = await client.post(
                        f"{self.base_url}/api/v1/content/write",
                        headers=self._headers(),
                        json={"uri": path, "content": body, "mode": m},
                    )
                    if resp.status_code < 400:
                        _memory_store[path] = body
                        return True
                    # create 已存在则改 replace；replace 不存在则改 create
                resp = await client.post(
                    f"{self.base_url}/api/v1/content/write",
                    headers=self._headers(),
                    json={"uri": path, "content": body, "mode": "create"},
                )
                if resp.status_code < 400:
                    _memory_store[path] = body
                    return True
                logger.warning("OpenViking store failed: %s %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            logger.warning("OpenViking store exception, fallback memory: %s", exc)

        _memory_store[path] = body
        return True

    async def read(self, path: str) -> str | None:
        if not await self._ensure_online():
            return _memory_store.get(path)
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/content/read",
                    headers=self._headers(),
                    params={"uri": path},
                )
                if resp.status_code < 400:
                    data = _unwrap(resp.json())
                    if isinstance(data, str):
                        return data
                    if isinstance(data, dict):
                        return data.get("content") or json.dumps(data, ensure_ascii=False)
                    return str(data)
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

        payload: dict[str, Any] = {"query": query}
        if root:
            payload["target_uri"] = root
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/search/find",
                    headers=self._headers(),
                    json=payload,
                )
                if resp.status_code < 400:
                    data = _unwrap(resp.json()) or {}
                    resources = []
                    if isinstance(data, dict):
                        resources = data.get("resources") or data.get("memories") or []
                    elif isinstance(data, list):
                        resources = data
                    out = []
                    for item in resources[:top_k]:
                        if isinstance(item, dict):
                            out.append(
                                {
                                    "path": item.get("uri") or item.get("path"),
                                    "snippet": item.get("abstract") or item.get("overview") or "",
                                    "score": item.get("score"),
                                }
                            )
                    return out
        except Exception as exc:
            logger.warning("OpenViking search failed: %s", exc)
        return []

    async def ensure_session(self, session_id: str) -> bool:
        if not await self._ensure_online():
            return False
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    f"{self.base_url}/api/v1/sessions",
                    headers=self._headers(),
                    json={"session_id": session_id},
                )
                return resp.status_code < 400
        except Exception as exc:
            logger.warning("OpenViking ensure_session failed: %s", exc)
            return False

    async def add_session_message(self, session_id: str, role: str, content: str) -> bool:
        if not await self._ensure_online():
            await self.append_memory_fallback(session_id, role, content)
            return True
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                await self.ensure_session(session_id)
                resp = await client.post(
                    f"{self.base_url}/api/v1/sessions/{quote(session_id, safe='')}/messages",
                    headers=self._headers(),
                    json={"role": role, "content": content},
                )
                if resp.status_code < 400:
                    return True
                logger.warning("OpenViking add message failed: %s %s", resp.status_code, resp.text[:200])
        except Exception as exc:
            logger.warning("OpenViking add_session_message failed: %s", exc)
        await self.append_memory_fallback(session_id, role, content)
        return True

    async def get_session_context_text(self, session_id: str) -> str:
        if not await self._ensure_online():
            return _memory_store.get(f"session:{session_id}", "")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(
                    f"{self.base_url}/api/v1/sessions/{quote(session_id, safe='')}/context",
                    headers=self._headers(),
                )
                if resp.status_code >= 400:
                    return _memory_store.get(f"session:{session_id}", "")
                data = _unwrap(resp.json()) or {}
                lines: list[str] = []
                for msg in data.get("messages") or []:
                    role = msg.get("role") or ""
                    parts = msg.get("parts") or []
                    text = ""
                    for p in parts:
                        if isinstance(p, dict) and p.get("type") == "text":
                            text += str(p.get("text") or "")
                    if not text and msg.get("content"):
                        text = str(msg.get("content"))
                    if text:
                        lines.append(f"{role}: {text}")
                return "\n".join(lines)
        except Exception as exc:
            logger.warning("OpenViking get_session_context failed: %s", exc)
            return _memory_store.get(f"session:{session_id}", "")

    async def append_memory(self, path: str, line: str) -> None:
        """兼容旧调用：优先按文件 append，失败则整文件重写。"""
        if await self._ensure_online():
            await self.mkdir(_parent_dir(path))
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    resp = await client.post(
                        f"{self.base_url}/api/v1/content/write",
                        headers=self._headers(),
                        json={"uri": path, "content": line + "\n", "mode": "append"},
                    )
                    if resp.status_code < 400:
                        return
            except Exception:
                pass
        existing = await self.read(path) or ""
        merged = f"{existing.rstrip()}\n{line}".lstrip("\n")
        await self.store(path, merged)

    async def append_memory_fallback(self, session_id: str, role: str, content: str) -> None:
        key = f"session:{session_id}"
        prev = _memory_store.get(key, "")
        _memory_store[key] = f"{prev}\n{role}: {content}".lstrip("\n")

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


def reset_openviking_client() -> None:
    global _client
    _client = None
