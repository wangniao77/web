"""验证百炼 LLM 连通性（不打印密钥）。"""
import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from core.config import get_settings
from Utils.Agent.API.llm import LLMClient


async def main() -> None:
    get_settings.cache_clear()
    s = get_settings()
    print("base:", s.llm_api_base)
    print("model:", s.llm_model)
    print("key_set:", bool(s.llm_api_key), "key_prefix:", (s.llm_api_key or "")[:7] + "…")
    client = LLMClient()
    print("enabled:", client.enabled)
    data = await client.complete_json(
        system='只输出 JSON：{"ok": true, "model": "string"}',
        user="确认你可用，model 填你的模型名。",
    )
    print("complete_json:", data)
    chunks: list[str] = []
    async for t in client.stream_text("用一句话介绍你自己。", "你好"):
        chunks.append(t)
    text = "".join(chunks)
    print("stream_preview:", text[:120].replace("\n", " "))


if __name__ == "__main__":
    asyncio.run(main())
