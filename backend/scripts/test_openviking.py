"""验证 OpenViking 真实 API 联调。"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from core.config import get_settings
from Utils.Agent.OpenViking import get_openviking_client, reset_openviking_client
from Utils.Agent.OpenViking.paths import (
    resource_academic_risk,
    skill_academic_risk_analysis,
)


async def main() -> None:
    get_settings.cache_clear()
    reset_openviking_client()
    s = get_settings()
    print("url:", s.openviking_url)
    client = get_openviking_client()
    ok = await client.health()
    print("health:", ok)
    if not ok:
        raise SystemExit(1)

    skill = skill_academic_risk_analysis()
    resource = resource_academic_risk("big-data-ai")
    await client.store(skill, "# academic risk skill\n")
    await client.store(resource, {"ok": True, "from": "test_openviking"})
    got = await client.read(resource)
    print("read_resource:", (got or "")[:80])

    sid = "web-ov-e2e"
    await client.ensure_session(sid)
    await client.add_session_message(sid, "user", "ping")
    await client.add_session_message(sid, "assistant", "pong")
    ctx = await client.get_session_context_text(sid)
    print("session_ctx:", ctx.replace("\n", " | ")[:160])

    hits = await client.search("academic risk", root="viking://resources/college/")
    print("search_hits:", len(hits), hits[:1])


if __name__ == "__main__":
    asyncio.run(main())
