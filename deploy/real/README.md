# 真数版独立部署（与 Mock 版解耦）

本目录脚本**不会替换** Mock 的目录、`:8080` 后端、库 `governance_cockpit` 或 Mock systemd。  
若云安全组未放行 `:8088`，可用 `expose_on80.py` 在 **`:80` 下挂独立路径**（只多一行 `include`，不改 Mock 根路径）。

## 资源对照

| 项 | Mock 版（保持不动） | 真数版（本目录） |
|----|---------------------|------------------|
| 目录 | `/opt/governance-cockpit` | `/opt/governance-cockpit-real` |
| systemd | `governance-cockpit` | `governance-cockpit-real` |
| 后端 | `127.0.0.1:8080` | `127.0.0.1:8081` |
| HTTP 入口 | `:80/` | **`:80/real-cockpit/`**（推荐）或 `:8088`（需安全组放行） |
| 数据库 | `governance_cockpit` | **`governance_cockpit_real`** |
| DB 用户 | `cockpit` | **`cockpit_real`** |

推荐访问：`http://<服务器IP>/real-cockpit/`  
API 健康检查：`http://<服务器IP>/real-cockpit-api/health`  
Mock 仍为：`http://<服务器IP>/`

## 前置

```bash
# 本机
cd frontend
# 使用真数构建环境（勿用 Mock）
cp ../deploy/real/frontend.env.production .env.production.local
npm run build

# 部署密码（与现有脚本相同变量名，仅 SSH 用）
set DEPLOY_PASSWORD=你的服务器密码   # Windows PowerShell: $env:DEPLOY_PASSWORD="..."
```

## 首次部署（确认后再执行）

```bash
# 在仓库根目录
python deploy/real/deploy.py
```

可选环境变量：

| 变量 | 默认 | 说明 |
|------|------|------|
| `DEPLOY_PASSWORD` | （必填） | SSH 密码 |
| `REAL_HOST` | `117.72.60.47` | 服务器 |
| `REAL_HTTP_PORT` | `8088` | 对外 HTTP 端口 |
| `REAL_BACKEND_PORT` | `8081` | uvicorn 端口 |
| `REAL_SERVER_NAME` | `_` | nginx `server_name`；有域名则填域名 |
| `REAL_SKIP_DB_CREATE` | 空 | 设为 `1` 则跳过建库（库已存在时） |

## 后续更新代码

```bash
python deploy/real/update.py
# 或跳过本地 build：
python deploy/real/update.py --skip-build
```

## 数据导入（与 Mock 库隔离）

部署脚本只建空库并跑迁移，**不会**从 Mock 库拷数据，也**不会**调用根目录 `deploy/migrate_db.py`（那份仍指向 Mock）。

把内网源库灌进真数库：

```bash
python deploy/real/migrate_db.py
```

该脚本只操作 `governance_cockpit_real` 与 `governance-cockpit-real` 服务。

## 确认清单（执行前请勾选）

- [ ] Mock 入口 `http://服务器/` 仍要保留
- [ ] 真数入口使用 `/real-cockpit/`（或已放行的 `:8088`）
- [ ] 已本地按 `frontend.env.production` 构建（可用 `python deploy/real/update.py`）
- [ ] 若只用 `:8088`：云安全组需放行该端口；路径方案无需额外端口
- [ ] 你已明确说「执行部署」——否则请勿运行 `deploy.py` / `migrate_db.py`

## 在 :80 挂路径（安全组未放行 8088 时）

```bash
python deploy/real/update.py          # 带 VITE_BASE=/real-cockpit/ 构建并更新
python deploy/real/expose_on80.py     # 写入 nginx snippet 并 include 到 :80
```

## 开启 Agent（就业深度分析 / 追问）

真数前端需 `VITE_ENABLE_AGENT=true`（见 `frontend.env.production`）。后端密钥从本机 `backend/.env` 同步到服务器（不入库）：

```bash
python deploy/real/update.py
python deploy/real/enable_agent.py
```

`enable_agent.py` 会写入 `LLM_API_*`（及可选 OpenViking），并重启 `governance-cockpit-real`。未部署 OpenViking 时仍可用规则/LLM。
