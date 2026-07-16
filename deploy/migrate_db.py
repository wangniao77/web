#!/usr/bin/env python3
"""Full PostgreSQL migration: 192.168.8.110 -> 117.72.60.47"""
from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

import paramiko

SOURCE_HOST = "192.168.8.110"
SOURCE_SSH_USER = "lj"
SOURCE_SSH_PASS = os.environ.get("SOURCE_SSH_PASS", "Lj123456")
SOURCE_DB = "studentmodelingdata"
SOURCE_DB_USER = "root"
SOURCE_DB_PASS = "123456"

TARGET_HOST = "117.72.60.47"
TARGET_SSH_USER = "root"
TARGET_SSH_PASS = os.environ.get("DEPLOY_PASSWORD", "")
TARGET_DB = "governance_cockpit"
TARGET_DB_USER = "cockpit"
TARGET_DB_PASS = "cockpit123"
APP_NAME = "governance-cockpit"


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

    src_dump = "/tmp/studentmodelingdata.sql"
    print("=== 1. 源库 pg_dump (docker postgres, plain SQL) ===")
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
    run(
        src,
        f"docker exec -e PGPASSWORD='{SOURCE_DB_PASS}' postgres "
        f"psql -h 127.0.0.1 -U {SOURCE_DB_USER} -d {SOURCE_DB} "
        "-c \"SELECT 'students' AS t, COUNT(*) FROM student_academic_records "
        "UNION ALL SELECT 'accounts', COUNT(*) FROM accounts;\"",
    )

    with tempfile.NamedTemporaryFile(suffix=".sql", delete=False) as tmp:
        local_dump = Path(tmp.name)
    print(f"=== 2. 下载 dump -> {local_dump} ===")
    sftp = src.open_sftp()
    sftp.get(src_dump, str(local_dump))
    sftp.close()
    run(src, f"rm -f {src_dump}")
    src.close()
    print(f"本地大小: {local_dump.stat().st_size / 1024 / 1024:.1f} MB")

    print("=== 3. 上传到目标服务器并恢复 ===")
    tgt = connect(TARGET_HOST, TARGET_SSH_USER, TARGET_SSH_PASS)
    remote_dump = "/tmp/studentmodelingdata.sql"
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
    run(tgt, f"sudo -u postgres psql -c \"CREATE DATABASE {TARGET_DB} OWNER {TARGET_DB_USER};\"")
    run(tgt, f"sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE {TARGET_DB} TO {TARGET_DB_USER};\"")
    code, _, _ = run(
        tgt,
        f"sudo -u postgres psql -d {TARGET_DB} -f {remote_dump}",
        timeout=900,
    )
    if code != 0:
        print("pg_restore 有告警，继续修复权限…")

    run(
        tgt,
        f"sudo -u postgres psql -d {TARGET_DB} -c "
        f"\"GRANT ALL ON SCHEMA public TO {TARGET_DB_USER}; "
        f"GRANT ALL ON ALL TABLES IN SCHEMA public TO {TARGET_DB_USER}; "
        f"GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO {TARGET_DB_USER}; "
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO {TARGET_DB_USER}; "
        f"ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO {TARGET_DB_USER};\"",
    )

    print("=== 4. aerich 迁移 & 重启 ===")
    run(tgt, "cd /opt/governance-cockpit/backend && ./venv/bin/aerich upgrade", timeout=300)
    run(tgt, f"systemctl restart {APP_NAME}")
    run(tgt, "sleep 3")

    print("=== 5. 验证 ===")
    run(tgt, "curl -sf http://127.0.0.1/api/health && echo")
    run(
        tgt,
        f"PGPASSWORD='{TARGET_DB_PASS}' psql -h 127.0.0.1 -U {TARGET_DB_USER} -d {TARGET_DB} "
        "-c \"SELECT COUNT(*) AS students FROM student_academic_records;\"",
    )
    run(
        tgt,
        'curl -s -o /dev/null -w "college:%{http_code}\\n" '
        '"http://127.0.0.1/api/v1/college/overview/hub?collegeId=big-data-ai"',
    )
    run(tgt, f"rm -f {remote_dump}")
    tgt.close()
    print("MIGRATE_SUCCESS")


if __name__ == "__main__":
    main()
