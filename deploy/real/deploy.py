#!/usr/bin/env python3
"""Deploy REAL-data cockpit to a dedicated port/dir/DB.

Does NOT touch Mock instance:
  - /opt/governance-cockpit
  - port 80 / backend 8080
  - DB governance_cockpit
  - systemd governance-cockpit

Run only after explicit confirmation.
"""
from __future__ import annotations

import os
import stat
import sys
import tarfile
import tempfile
from pathlib import Path

import paramiko

HOST = os.environ.get("REAL_HOST", "117.72.60.47")
USER = "root"
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")

APP_NAME = "governance-cockpit-real"
REMOTE_DIR = f"/opt/{APP_NAME}"
HTTP_PORT = int(os.environ.get("REAL_HTTP_PORT", "8088"))
BACKEND_PORT = int(os.environ.get("REAL_BACKEND_PORT", "8081"))
SERVER_NAME = os.environ.get("REAL_SERVER_NAME", "_")
DB_NAME = "governance_cockpit_real"
DB_USER = "cockpit_real"
DB_PASS = os.environ.get("REAL_DB_PASS", "cockpit_real_change_me")
SKIP_DB_CREATE = os.environ.get("REAL_SKIP_DB_CREATE", "") == "1"

LOCAL_ROOT = Path(__file__).resolve().parents[2]

NGINX_CONF = f"""# REAL instance only — do not replace Mock site on :80
server {{
    listen {HTTP_PORT};
    server_name {SERVER_NAME};

    root {REMOTE_DIR}/frontend/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://127.0.0.1:{BACKEND_PORT};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }}
}}
"""

SYSTEMD_UNIT = f"""[Unit]
Description=Governance Cockpit REAL (data) FastAPI Backend
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}/backend
Environment=PATH={REMOTE_DIR}/backend/venv/bin
EnvironmentFile=-{REMOTE_DIR}/backend/.env
ExecStart={REMOTE_DIR}/backend/venv/bin/uvicorn main:app --host 127.0.0.1 --port {BACKEND_PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

SERVER_ENV = f"""POSTGRES_DSN=postgres://{DB_USER}:{DB_PASS}@127.0.0.1:5432/{DB_NAME}
APP_NAME=治理驾驶舱-真数版
APP_DEBUG=false
JWT_SECRET=change-me-real-instance-use-random-string
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440
"""

DB_SETUP = ""
if not SKIP_DB_CREATE:
    DB_SETUP = f"""
echo "[2/8] Setting up isolated PostgreSQL database (real only)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='{DB_USER}'" | grep -q 1 || \\
  sudo -u postgres psql -c "CREATE USER {DB_USER} WITH PASSWORD '{DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='{DB_NAME}'" | grep -q 1 || \\
  sudo -u postgres psql -c "CREATE DATABASE {DB_NAME} OWNER {DB_USER};"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE {DB_NAME} TO {DB_USER};"
# PG15+ schema privileges
sudo -u postgres psql -d {DB_NAME} -c "GRANT ALL ON SCHEMA public TO {DB_USER};" || true
"""
else:
    DB_SETUP = """
echo "[2/8] Skipping DB create (REAL_SKIP_DB_CREATE=1)..."
"""

SETUP_SCRIPT = f"""#!/bin/bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

echo "[1/8] Ensuring packages (idempotent; will not reconfigure Mock)..."
apt-get update -qq
apt-get install -y -qq nginx python3-venv python3-pip postgresql postgresql-contrib

{DB_SETUP}

echo "[3/8] Setting up Python venv (real tree only)..."
cd {REMOTE_DIR}/backend
python3 -m venv venv
./venv/bin/pip install -q --upgrade pip
./venv/bin/pip install -q -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

echo "[4/8] Writing backend .env (real DSN only)..."
cat > {REMOTE_DIR}/backend/.env << 'ENVEOF'
{SERVER_ENV.strip()}
ENVEOF

echo "[5/8] Running database migrations on {DB_NAME}..."
cd {REMOTE_DIR}/backend
./venv/bin/aerich upgrade

echo "[6/8] Configuring systemd unit {APP_NAME}.service (Mock unit untouched)..."
cat > /etc/systemd/system/{APP_NAME}.service << 'UNITEOF'
{SYSTEMD_UNIT.strip()}
UNITEOF
systemctl daemon-reload
systemctl enable {APP_NAME}
systemctl restart {APP_NAME}

echo "[7/8] Configuring nginx site for port {HTTP_PORT} only..."
cat > /etc/nginx/sites-available/{APP_NAME} << 'NGXEOF'
{NGINX_CONF.strip()}
NGXEOF
ln -sf /etc/nginx/sites-available/{APP_NAME} /etc/nginx/sites-enabled/{APP_NAME}
# Do NOT remove default or Mock site
nginx -t
systemctl reload nginx || systemctl restart nginx

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q active; then
  ufw allow {HTTP_PORT}/tcp || true
fi

echo "[8/8] Health check (real ports only)..."
sleep 2
curl -sf http://127.0.0.1:{BACKEND_PORT}/api/health && echo ""
curl -sf -o /dev/null -w "Frontend HTTP %{{http_code}}\\n" http://127.0.0.1:{HTTP_PORT}/
curl -sf http://127.0.0.1:{HTTP_PORT}/api/health && echo ""

echo "DEPLOY_REAL_SUCCESS"
"""


def run(ssh: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    _, stdout, stderr = ssh.exec_command(cmd, timeout=timeout)
    code = stdout.channel.recv_exit_status()
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    return code, out, err


def create_tarball(tar_path: Path) -> None:
    dist = LOCAL_ROOT / "frontend" / "dist"
    backend = LOCAL_ROOT / "backend"
    if not dist.exists():
        raise SystemExit("frontend/dist not found; build with deploy/real/frontend.env.production first")

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
            "scripts",
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

    print("=== REAL deploy (isolated from Mock) ===")
    print(f"  Host:         {HOST}")
    print(f"  Remote dir:   {REMOTE_DIR}")
    print(f"  HTTP:         :{HTTP_PORT}  server_name={SERVER_NAME}")
    print(f"  Backend:      127.0.0.1:{BACKEND_PORT}")
    print(f"  Database:     {DB_NAME} (user {DB_USER})")
    print(f"  systemd:      {APP_NAME}.service")
    print("  Mock paths/ports/DB will NOT be modified.")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username=USER, password=PASSWORD, timeout=30)

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = Path(tmp.name)

    try:
        print("Creating package...")
        create_tarball(tar_path)
        print(f"Package size: {tar_path.stat().st_size / 1024 / 1024:.1f} MB")

        print("Uploading...")
        sftp = ssh.open_sftp()
        run(ssh, f"mkdir -p {REMOTE_DIR}")
        sftp.put(str(tar_path), f"{REMOTE_DIR}/release.tar.gz")
        sftp.close()

        print("Extracting into REAL tree only...")
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

        print("Running REAL setup...")
        code, out, err = run(ssh, f"bash {setup_path}", timeout=900)
        print(out)
        if err:
            print(err, file=sys.stderr)
        if code != 0 or "DEPLOY_REAL_SUCCESS" not in out:
            sys.exit(code or 1)

        print("\nREAL deployed successfully (Mock untouched).")
        print(f"  Frontend: http://{HOST}:{HTTP_PORT}/")
        print(f"  API:      http://{HOST}:{HTTP_PORT}/api/health")
        if SERVER_NAME != "_":
            print(f"  Domain:   http://{SERVER_NAME}:{HTTP_PORT}/  (or bind DNS + reverse proxy as needed)")
    finally:
        tar_path.unlink(missing_ok=True)
        ssh.close()


if __name__ == "__main__":
    main()
