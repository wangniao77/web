#!/usr/bin/env python3
"""Enable Agent on REAL instance: sync LLM settings into remote .env and restart.

Reads LLM_* / OPENVIKING_* from:
  1) process env, or
  2) local backend/.env

Does not print secrets. Does not touch Mock instance.
"""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

import paramiko

HOST = os.environ.get("REAL_HOST", "117.72.60.47")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_ENV = "/opt/governance-cockpit-real/backend/.env"
LOCAL_ENV = Path(__file__).resolve().parents[2] / "backend" / ".env"

KEYS = (
    "LLM_API_BASE",
    "LLM_API_KEY",
    "LLM_MODEL",
    "OPENVIKING_URL",
    "OPENVIKING_API_KEY",
)


def load_local_dotenv(path: Path) -> dict[str, str]:
    out: dict[str, str] = {}
    if not path.exists():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s or s.startswith("#") or "=" not in s:
            continue
        k, v = s.split("=", 1)
        out[k.strip()] = v.strip().strip('"').strip("'")
    return out


def upsert_env_text(text: str, updates: dict[str, str]) -> str:
    lines = text.splitlines()
    seen: set[str] = set()
    new_lines: list[str] = []
    for line in lines:
        m = re.match(r"^([A-Za-z_][A-Za-z0-9_]*)=", line)
        if m and m.group(1) in updates:
            key = m.group(1)
            new_lines.append(f"{key}={updates[key]}")
            seen.add(key)
        else:
            new_lines.append(line)
    for key, val in updates.items():
        if key not in seen:
            new_lines.append(f"{key}={val}")
    if new_lines and new_lines[-1] != "":
        new_lines.append("")
    return "\n".join(new_lines)


def main() -> None:
    if not PASSWORD:
        sys.exit("Set DEPLOY_PASSWORD")

    local = load_local_dotenv(LOCAL_ENV)
    updates: dict[str, str] = {}
    for key in KEYS:
        val = os.environ.get(key) or local.get(key, "")
        if key == "LLM_API_KEY" and not val:
            sys.exit("LLM_API_KEY missing (set env or backend/.env)")
        if val != "" or key in {"OPENVIKING_URL", "OPENVIKING_API_KEY", "LLM_API_BASE", "LLM_MODEL"}:
            # Keep defaults for empty optional keys
            if key == "LLM_API_BASE" and not val:
                val = "https://dashscope.aliyuncs.com/compatible-mode/v1"
            if key == "LLM_MODEL" and not val:
                val = "deepseek-v4-flash"
            if key == "OPENVIKING_URL" and not val:
                val = "http://127.0.0.1:1933"
            updates[key] = val

    print("=== REAL Agent enable ===")
    print(f"  Host: {HOST}")
    print(f"  LLM_API_BASE: {updates.get('LLM_API_BASE')}")
    print(f"  LLM_MODEL: {updates.get('LLM_MODEL')}")
    print(f"  LLM_API_KEY: set={bool(updates.get('LLM_API_KEY'))} len={len(updates.get('LLM_API_KEY') or '')}")
    print(f"  OPENVIKING_URL: {updates.get('OPENVIKING_URL')}")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username="root", password=PASSWORD, timeout=30)

    sftp = ssh.open_sftp()
    with sftp.file(REMOTE_ENV, "r") as f:
        current = f.read().decode("utf-8")
    patched = upsert_env_text(current, updates)
    with sftp.file(REMOTE_ENV, "w") as f:
        f.write(patched)
    sftp.close()

    script = """#!/bin/bash
set -euo pipefail
systemctl restart governance-cockpit-real
sleep 2
systemctl is-active governance-cockpit-real
curl -sf http://127.0.0.1:8081/api/health
echo
# smoke: analyze should not be 404
code=$(curl -sS -o /tmp/agent_an.json -w '%{http_code}' -X POST http://127.0.0.1:8081/api/v1/agent/analyze \\
  -H 'Content-Type: application/json' \\
  -d '{"context":{"scope":"college","page":"enrollment-employment","collegeId":"big-data-ai","filters":{}},"refresh":true}')
echo "analyze_http:$code"
python3 - <<'PY'
import json
from pathlib import Path
p = Path('/tmp/agent_an.json')
raw = p.read_text(encoding='utf-8') if p.exists() else ''
print('analyze_body_prefix:', raw[:240].replace('\\n',' '))
try:
    data = json.loads(raw)
    d = data.get('data') or {}
    print('source:', d.get('source'))
    print('headline:', (d.get('headline') or '')[:120])
    print('insights:', len(d.get('insights') or []))
except Exception as e:
    print('parse_err:', e)
PY
echo ENABLE_AGENT_SUCCESS
"""
    sftp = ssh.open_sftp()
    with sftp.file("/tmp/enable_real_agent.sh", "w") as f:
        f.write(script)
    sftp.chmod("/tmp/enable_real_agent.sh", 0o700)
    sftp.close()

    _, stdout, stderr = ssh.exec_command("bash /tmp/enable_real_agent.sh", timeout=180)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print(out)
    if err.strip():
        print(err[:2000], file=sys.stderr)
    if "ENABLE_AGENT_SUCCESS" not in out:
        sys.exit(1)
    ssh.close()
    print("REAL Agent backend ready (OpenViking optional; rules/LLM as configured).")


if __name__ == "__main__":
    main()
