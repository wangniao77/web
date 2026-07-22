#!/usr/bin/env python3
"""Quick update: upload changed code and restart services (no full reinstall)."""
from __future__ import annotations

import os
import subprocess
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = "117.72.60.47"
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
APP_NAME = "governance-cockpit"
REMOTE_DIR = f"/opt/{APP_NAME}"
LOCAL_ROOT = Path(__file__).resolve().parents[1]

UPDATE_SCRIPT = f"""#!/bin/bash
set -euo pipefail
cd {REMOTE_DIR}

echo "[1/5] Extracting release..."
rm -rf frontend/dist
mkdir -p frontend/dist backend
tar -xzf release.tar.gz
rm -f release.tar.gz

echo "[2/5] Updating Python dependencies (if changed)..."
cd backend
if [ ! -d venv ]; then
  python3 -m venv venv
fi
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo "[3/5] Running database migrations..."
./venv/bin/aerich upgrade

echo "[4/5] Restarting services..."
systemctl restart {APP_NAME}
systemctl reload nginx || systemctl restart nginx

echo "[5/5] Health check..."
sleep 2
curl -sf http://127.0.0.1/api/health && echo ""
curl -sf -o /dev/null -w "Frontend HTTP %{{http_code}}\\n" http://127.0.0.1/
echo UPDATE_SUCCESS
"""


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print(f"> {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd, check=True)


def run_ssh(ssh: paramiko.SSHClient, cmd: str, timeout: int = 300) -> tuple[int, str, str]:
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    return code, stdout.read().decode(errors="replace"), stderr.read().decode(errors="replace")


def create_tarball(tar_path: Path) -> None:
    dist = LOCAL_ROOT / "frontend" / "dist"
    backend = LOCAL_ROOT / "backend"
    if not dist.exists():
        raise SystemExit("frontend/dist not found")

    with tarfile.open(tar_path, "w:gz") as tar:
        for item in dist.rglob("*"):
            tar.add(item, arcname=f"frontend/dist/{item.relative_to(dist).as_posix()}")

        for rel in ["main.py", "requirements.txt", "pyproject.toml", "core", "Routers", "Services", "Utils", "migrations"]:
            src = backend / rel
            if src.is_file():
                tar.add(src, arcname=f"backend/{rel}")
            elif src.is_dir():
                for item in src.rglob("*"):
                    if item.is_file() and "__pycache__" not in item.parts:
                        tar.add(item, arcname=f"backend/{item.relative_to(backend).as_posix()}")


def main() -> None:
    if not PASSWORD:
        print("请设置环境变量 DEPLOY_PASSWORD", file=sys.stderr)
        sys.exit(1)

    skip_build = "--skip-build" in sys.argv

    if not skip_build:
        print("=== 构建前端 ===")
        run(["npm", "run", "build"], cwd=LOCAL_ROOT / "frontend")

    print("=== 连接服务器 ===")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = Path(tmp.name)

    try:
        print("=== 打包并上传 ===")
        create_tarball(tar_path)
        print(f"包大小: {tar_path.stat().st_size / 1024 / 1024:.1f} MB")

        sftp = ssh.open_sftp()
        sftp.put(str(tar_path), f"{REMOTE_DIR}/release.tar.gz")

        with sftp.file(f"{REMOTE_DIR}/update.sh", "w") as f:
            f.write(UPDATE_SCRIPT)
        sftp.chmod(f"{REMOTE_DIR}/update.sh", 0o700)
        sftp.close()

        print("=== 服务器更新中 ===")
        code, out, err = run_ssh(ssh, f"bash {REMOTE_DIR}/update.sh")
        print(out)
        if err:
            print(err, file=sys.stderr)
        if code != 0 or "UPDATE_SUCCESS" not in out:
            sys.exit(code or 1)

        print(f"\n更新成功！")
        print(f"  前端: http://{HOST}/")
        print(f"  API:  http://{HOST}/api/health")
    finally:
        tar_path.unlink(missing_ok=True)
        ssh.close()


if __name__ == "__main__":
    main()
