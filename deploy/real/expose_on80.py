#!/usr/bin/env python3
"""Expose REAL instance on :80 path prefix (cloud SG often blocks :8088).

Adds only:
  /real-cockpit/     -> real frontend dist
  /real-cockpit-api/ -> real backend 127.0.0.1:8081/api/

Does not replace Mock root. Idempotent.
"""
from __future__ import annotations

import os
import sys

import paramiko

HOST = os.environ.get("REAL_HOST", "117.72.60.47")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/opt/governance-cockpit-real"
BACKEND_PORT = int(os.environ.get("REAL_BACKEND_PORT", "8081"))
PREFIX = os.environ.get("REAL_PATH_PREFIX", "/real-cockpit")
API_PREFIX = os.environ.get("REAL_API_PREFIX", "/real-cockpit-api")

SNIPPET = f"""# REAL cockpit path expose — keep Mock locations intact
location = {PREFIX} {{
    return 301 {PREFIX}/;
}}

location {PREFIX}/ {{
    alias {REMOTE_DIR}/frontend/dist/;
    index index.html;
    try_files $uri $uri/ {PREFIX}/index.html;
}}

location {API_PREFIX}/ {{
    proxy_pass http://127.0.0.1:{BACKEND_PORT}/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}}
"""

INJECT_PY = r"""
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text()
needle = "include /etc/nginx/snippets/governance-cockpit-real-path.conf;"
if needle in text:
    print("include already present")
else:
    lines = text.splitlines(keepends=True)
    for i in range(len(lines) - 1, -1, -1):
        if lines[i].strip() == "}":
            indent = lines[i][: len(lines[i]) - len(lines[i].lstrip())]
            lines.insert(i, f"{indent}{needle}\n")
            break
    else:
        raise SystemExit("no closing brace found")
    path.write_text("".join(lines))
    print("inserted include")
"""


def main() -> None:
    if not PASSWORD:
        sys.exit("Set DEPLOY_PASSWORD")

    script = f"""#!/bin/bash
set -euo pipefail
mkdir -p /etc/nginx/snippets
cat > /etc/nginx/snippets/governance-cockpit-real-path.conf << 'EOF'
{SNIPPET}
EOF

TARGET=""
for f in /etc/nginx/sites-enabled/governance-cockpit \\
         /etc/nginx/sites-enabled/default \\
         /etc/nginx/sites-enabled/*; do
  [ -e "$f" ] || continue
  if grep -qE 'listen[[:space:]]+80' "$f" 2>/dev/null; then
    TARGET="$f"
    break
  fi
done
if [ -z "$TARGET" ]; then
  echo "No :80 site" >&2
  exit 1
fi
echo "TARGET=$TARGET"

cat > /tmp/inject_real_include.py << 'PY'
{INJECT_PY}
PY
python3 /tmp/inject_real_include.py "$TARGET"

nginx -t
systemctl reload nginx

echo "--- health ---"
curl -sS --max-time 5 -o /dev/null -w "real_path:%{{http_code}}\\n" http://127.0.0.1{PREFIX}/ || true
curl -sS --max-time 5 http://127.0.0.1{API_PREFIX}/health || true
echo
curl -sS --max-time 5 http://127.0.0.1/api/health || true
echo
echo EXPOSE_ON80_SUCCESS
"""

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(HOST, username="root", password=PASSWORD, timeout=30)

    sftp = ssh.open_sftp()
    with sftp.file("/tmp/expose_real_on80.sh", "w") as f:
        f.write(script)
    sftp.chmod("/tmp/expose_real_on80.sh", 0o700)
    sftp.close()

    _, stdout, stderr = ssh.exec_command("bash /tmp/expose_real_on80.sh", timeout=60)
    out = stdout.read().decode(errors="replace")
    err = stderr.read().decode(errors="replace")
    print(out)
    if err.strip():
        print(err, file=sys.stderr)
    if "EXPOSE_ON80_SUCCESS" not in out:
        sys.exit(1)

    print(f"\nMock: http://{HOST}/")
    print(f"REAL: http://{HOST}{PREFIX}/")
    print(f"API:  http://{HOST}{API_PREFIX}/health")
    ssh.close()


if __name__ == "__main__":
    main()
