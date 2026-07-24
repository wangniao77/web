#!/usr/bin/env python3
"""Migrate source DB -> REAL target DB only.

Does NOT write to Mock DB governance_cockpit or restart Mock service.
"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import paramiko

SOURCE_HOST = os.environ.get("SOURCE_HOST", "192.168.8.110")
SOURCE_SSH_USER = os.environ.get("SOURCE_SSH_USER", "lj")
SOURCE_SSH_PASS = os.environ.get("SOURCE_SSH_PASS", "Lj123456")
SOURCE_DB = os.environ.get("SOURCE_DB", "studentmodelingdata")
SOURCE_DB_USER = os.environ.get("SOURCE_DB_USER", "root")
SOURCE_DB_PASS = os.environ.get("SOURCE_DB_PASS", "123456")

TARGET_HOST = os.environ.get("REAL_HOST", "117.72.60.47")
TARGET_SSH_USER = "root"
TARGET_SSH_PASS = os.environ.get("DEPLOY_PASSWORD", "")
TARGET_DB = "governance_cockpit_real"
TARGET_DB_USER = "cockpit_real"
TARGET_DB_PASS = os.environ.get("REAL_DB_PASS", "cockpit_real_change_me")
APP_NAME = "governance-cockpit-real"
HTTP_PORT = int(os.environ.get("REAL_HTTP_PORT", "8088"))
BACKEND_PORT = int(os.environ.get("REAL_BACKEND_PORT", "8081"))
REMOTE_DIR = f"/opt/{APP_NAME}"


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 900) -> tuple[int, str, str]:
    print(f"> {cmd[:240]}{'...' if len(cmd) > 240 else ''}")
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    if out.strip():
        print(out.rstrip())
    if err.strip():
        print("STDERR:", err.rstrip()[:2000])
    print(f"[exit {code}]")
    return code, out, err


def connect(host: str, user: str, password: str) -> paramiko.SSHClient:
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, password=password, timeout=30)
    return ssh


def main() -> None:
    if not TARGET_SSH_PASS:
        print("Set DEPLOY_PASSWORD", file=sys.stderr)
        sys.exit(1)

    print("=== REAL DB migrate (Mock DB untouched) ===")
    print(f"  Target DB: {TARGET_DB}  user={TARGET_DB_USER}")
    print(f"  Target app: {APP_NAME}")

    src_dump = "/tmp/studentmodelingdata_real.sql"
    print("=== 1. Source pg_dump ===")
    src = connect(SOURCE_HOST, SOURCE_SSH_USER, SOURCE_SSH_PASS)
    run(
        src,
        f"docker exec -e PGPASSWORD='{SOURCE_DB_PASS}' postgres "
        f"pg_dump -h 127.0.0.1 -U {SOURCE_DB_USER} "
        f"--no-owner --no-acl --clean --if-exists {SOURCE_DB} "
        f"> {src_dump}",
        timeout=900,
    )
    run(src, f"ls -lh {src_dump}")

    with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as tmp:
        local_dump = Path(tmp.name)
    print(f"=== 2. Download dump -> {local_dump} ===")
    sftp = src.open_sftp()
    sftp.get(src_dump, str(local_dump))
    sftp.close()
    run(src, f"rm -f {src_dump}")
    src.close()
    print(f"Local size: {local_dump.stat().st_size / 1024 / 1024:.1f} MB")

    print("=== 3. Restore into REAL database only ===")
    tgt = connect(TARGET_HOST, TARGET_SSH_USER, TARGET_SSH_PASS)
    remote_dump = "/tmp/studentmodelingdata_real.sql"
    sftp = tgt.open_sftp()
    sftp.put(str(local_dump), remote_dump)
    sftp.close()
    local_dump.unlink(missing_ok=True)

    run(tgt, f"systemctl stop {APP_NAME} || true")
    run(
        tgt,
        "sudo -u postgres psql -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        f"WHERE datname='{TARGET_DB}' AND pid <> pg_backend_pid();\"",
    )
    run(tgt, f"sudo -u postgres dropdb --if-exists {TARGET_DB}")
    # Ensure role exists
    run(
        tgt,
        f"sudo -u postgres psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='{TARGET_DB_USER}'\" | grep -q 1 || "
        f"sudo -u postgres psql -c \"CREATE USER {TARGET_DB_USER} WITH PASSWORD '{TARGET_DB_PASS}';\"",
    )
    run(tgt, f"sudo -u postgres psql -c \"CREATE DATABASE {TARGET_DB} OWNER {TARGET_DB_USER};\"")
    run(tgt, f"sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE {TARGET_DB} TO {TARGET_DB_USER};\"")
    code, _, _ = run(
        tgt,
        f"sudo -u postgres psql -d {TARGET_DB} -f {remote_dump}",
        timeout=900,
    )
    if code != 0:
        print("psql restore had warnings; continuing privilege fix…")

    run(
        tgt,
        f"sudo -u postgres psql -d {TARGET_DB} -c "
        f"\"GRANT ALL ON SCHEMA public TO {TARGET_DB_USER}; "
        f"GRANT ALL ON ALL TABLES IN SCHEMA public TO {TARGET_DB_USER}; "
        f"GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO {TARGET_DB_USER}; "
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {TARGET_DB_USER}; "
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {TARGET_DB_USER};\"",
    )

    print("=== 4. aerich + restart REAL only ===")
    run(tgt, f"cd {REMOTE_DIR}/backend && ./venv/bin/aerich upgrade", timeout=300)
    run(tgt, f"systemctl restart {APP_NAME}")
    run(tgt, "sleep 3")

    print("=== 5. Verify REAL endpoints (not :80) ===")
    run(tgt, f"curl -sf http://127.0.0.1:{BACKEND_PORT}/api/health && echo")
    run(tgt, f"curl -sf http://127.0.0.1:{HTTP_PORT}/api/health && echo")
    run(
        tgt,
        f"PGPASSWORD='{TARGET_DB_PASS}' psql -h 127.0.0.1 -U {TARGET_DB_USER} -d {TARGET_DB} "
        "-c \"SELECT COUNT(*) AS students FROM student_academic_records;\"",
    )
    run(tgt, f"rm -f {remote_dump}")
    tgt.close()
    print("MIGRATE_REAL_SUCCESS")


if __name__ == "__main__":
    main()
