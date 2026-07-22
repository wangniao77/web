#!/usr/bin/env python3
"""One-off: run aerich upgrade on remote server and verify APIs."""
from __future__ import annotations

import os
import sys

import paramiko

HOST = "117.72.60.47"
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/opt/governance-cockpit"


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 300) -> tuple[int, str, str]:
    print(f"> {cmd}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print(err.rstrip(), file=sys.stderr)
    return code, out, err


def main() -> None:
    if not PASSWORD:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        sys.exit(1)

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print("Connecting...")
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    print("=== Service status before ===")
    run(ssh, "systemctl is-active governance-cockpit || true")

    print("=== Running aerich upgrade ===")
    code, _, _ = run(ssh, f"cd {REMOTE_DIR}/backend && ./venv/bin/aerich upgrade")
    if code != 0:
        print("Migration failed, checking logs...")
        run(ssh, "journalctl -u governance-cockpit -n 50 --no-pager")
        ssh.close()
        sys.exit(code)

    print("=== Restarting service ===")
    run(ssh, "systemctl restart governance-cockpit")
    run(ssh, "sleep 2 && systemctl is-active governance-cockpit")

    print("=== Health check on server ===")
    run(ssh, "curl -sf http://127.0.0.1/api/health && echo")
    run(
        ssh,
        'curl -sf -o /dev/null -w "university/overview HTTP:%{http_code}\\n" '
        "http://127.0.0.1/api/v1/university/overview",
    )
    run(
        ssh,
        'curl -sf -o /dev/null -w "college/overview/hub HTTP:%{http_code}\\n" '
        '"http://127.0.0.1/api/v1/college/overview/hub?collegeId=big-data-ai"',
    )

    ssh.close()
    print("DONE")


if __name__ == "__main__":
    main()
