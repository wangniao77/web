#!/usr/bin/env python3
"""Deploy gdut-governance-cockpit to remote server."""
from __future__ import annotations

import os
import stat
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

NGINX_CONF = f"""server {{
    listen 80;
    server_name _;

    root {REMOTE_DIR}/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
"""

SYSTEMD_UNIT = f"""[Unit]
Description=Governance Cockpit FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}/backend
Environment=PATH={REMOTE_DIR}/backend/venv/bin
ExecStart={REMOTE_DIR}/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port 8080
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

SERVER_ENV = """POSTGRES_DSN=postgres://cockpit:cockpit123@127.0.0.1:5432/governance_cockpit
APP_NAME=数字建模系统
APP_DEBUG=false
JWT_SECRET=change-me-in-production-use-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
"""

SETUP_SCRIPT = f"""#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "[1/8] Installing system packages..."
apt-get update -qq
apt-get install -y -qq nginx python3-venv python3-pip postgresql postgresql-contrib

echo "[2/8] Setting up PostgreSQL..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='cockpit'" | grep -q 1 || \\
  sudo -u postgres psql -c "CREATE USER cockpit WITH PASSWORD 'cockpit123';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='governance_cockpit'" | grep -q 1 || \\
  sudo -u postgres psql -c "CREATE DATABASE governance_cockpit OWNER cockpit;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE governance_cockpit TO cockpit;"

echo "[3/8] Setting up Python venv..."
cd {REMOTE_DIR}/backend
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt

echo "[4/8] Writing backend .env..."
cat > {REMOTE_DIR}/backend/.env << 'ENVEOF'
{SERVER_ENV.strip()}
ENVEOF

echo "[5/8] Running database migrations..."
cd {REMOTE_DIR}/backend
./venv/bin/aerich upgrade

echo "[6/8] Configuring systemd..."
cat > /etc/systemd/system/{APP_NAME}.service << 'UNITEOF'
{SYSTEMD_UNIT.strip()}
UNITEOF
systemctl daemon-reload
systemctl enable {APP_NAME}
systemctl restart {APP_NAME}

echo "[6/8] Configuring nginx..."
cat > /etc/nginx/sites-available/{APP_NAME} << 'NGXEOF'
{NGINX_CONF.strip()}
NGXEOF
ln -sf /etc/nginx/sites-available/{APP_NAME} /etc/nginx/sites-enabled/{APP_NAME}
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx

echo "[7/8] Opening firewall port 80 if ufw active..."
if command -v ufw >/dev/null 2>&1 && ufw status | grep -q active; then
  ufw allow 80/tcp || true
fi

echo "[8/8] Health check..."
sleep 2
curl -sf http://127.0.0.1/api/health && echo ""
curl -sf -o /dev/null -w "Frontend HTTP %{{http_code}}\\n" http://127.0.0.1/

echo "DEPLOY_SUCCESS"
"""


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    return code, out, err


def sftp_mkdir_p(sftp: paramiko.SFTPClient, remote: str) -> None:
    parts = remote.strip("/").split("/")
    cur = ""
    for part in parts:
        cur += f"/{part}"
        try:
            sftp.stat(cur)
        except FileNotFoundError:
            sftp.mkdir(cur)


def create_tarball(tar_path: Path) -> None:
    dist = LOCAL_ROOT / "frontend" / "dist"
    backend = LOCAL_ROOT / "backend"
    if not dist.exists():
        raise SystemExit("frontend/dist not found; run npm run build first")

    with tarfile.open(tar_path, "w:gz") as tar:
        for item in dist.rglob("*"):
            arc = f"frontend/dist/{item.relative_to(dist).as_posix()}"
            tar.add(item, arcname=arc)

        for rel in [
            "main.py",
            "requirements.txt",
            "pyproject.toml",
            "core",
            "Routers",
            "Services",
            "Utils",
            "migrations",
        ]:
            src = backend / rel
            if src.is_file():
                tar.add(src, arcname=f"backend/{rel}")
            elif src.is_dir():
                for item in src.rglob("*"):
                    if item.is_file() and "__pycache__" not in item.parts:
                        arc = f"backend/{item.relative_to(backend).as_posix()}"
                        tar.add(item, arcname=arc)


def main() -> None:
    if not PASSWORD:
        print("Set DEPLOY_PASSWORD environment variable", file=sys.stderr)
        sys.exit(1)

    print("Connecting to server...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = Path(tmp.name)

    try:
        print("Creating deployment package...")
        create_tarball(tar_path)
        print(f"Package size: {tar_path.stat().st_size / 1024 / 1024:.1f} MB")

        print("Uploading to server...")
        sftp = ssh.open_sftp()
        run(ssh, f"mkdir -p {REMOTE_DIR}")
        sftp.put(str(tar_path), f"{REMOTE_DIR}/release.tar.gz")
        sftp.close()

        print("Extracting on server...")
        code, out, err = run(
            ssh,
            f"cd {REMOTE_DIR} && rm -rf frontend backend && "
            f"mkdir -p frontend backend && "
            f"tar -xzf release.tar.gz && rm -f release.tar.gz",
            timeout=120,
        )
        if code != 0:
            print(out, err, file=sys.stderr)
            sys.exit(code)

        setup_path = f"{REMOTE_DIR}/setup.sh"
        sftp = ssh.open_sftp()
        with sftp.file(setup_path, "w") as f:
            f.write(SETUP_SCRIPT)
        sftp.chmod(setup_path, stat.S_IRWXU)
        sftp.close()

        print("Running server setup (may take a few minutes)...")
        code, out, err = run(ssh, f"bash {setup_path}", timeout=900)
        print(out)
        if err:
            print(err, file=sys.stderr)
        if code != 0 or "DEPLOY_SUCCESS" not in out:
            sys.exit(code or 1)

        print(f"\nDeployed successfully!")
        print(f"  Frontend: http://{HOST}/")
        print(f"  API health: http://{HOST}/api/health")
    finally:
        tar_path.unlink(missing_ok=True)
        ssh.close()


if __name__ == "__main__":
    main()
