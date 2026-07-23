# OpenViking 本地对接（本项目）

默认约定：本机 `http://127.0.0.1:1933`。Agent 通过后端 `Utils/Agent/OpenViking` 访问，前端不直连。

## 1. 启动本地服务

若尚未初始化：

```bash
openviking-server init
openviking-server doctor
```

启动：

```bash
openviking-server
# 或指定端口
# openviking-server --host 127.0.0.1 --port 1933
```

看到类似：

```text
Uvicorn running on http://127.0.0.1:1933
```

验证：

```bash
curl http://127.0.0.1:1933/health
# 期望 {"status":"ok"}
```

Web Studio：http://127.0.0.1:1933/studio

配置文件一般在：`%USERPROFILE%\.openviking\ov.conf`

## 2. 本项目 backend/.env

```env
OPENVIKING_URL=http://127.0.0.1:1933
OPENVIKING_API_KEY=
```

- 本地未开鉴权：`OPENVIKING_API_KEY` 可留空
- 若 `ov.conf` 里配置了 `server.root_api_key` / user key：把**数据访问用的 user/admin key**填到 `OPENVIKING_API_KEY`（不要用仅限管理的 root key 调租户数据 API）

改完后重启后端（或重新加载配置）。

## 3. ov.conf 模型（首次必配）

OpenViking 自身需要 embedding（以及可选 VLM）。可用交互向导 `openviking-server init`。

若走 OpenAI 兼容（含百炼）示例结构：

```json
{
  "server": {
    "host": "127.0.0.1",
    "port": 1933
  },
  "embedding": {
    "dense": {
      "provider": "openai",
      "api_base": "https://dashscope.aliyuncs.com/compatible-mode/v1",
      "api_key": "<百炼Key>",
      "model": "text-embedding-v3",
      "dimension": 1024
    }
  }
}
```

具体 model/dimension 以你百炼控制台可用嵌入模型为准；也可用火山方舟等，按官方 Configuration 文档填写。

## 4. 与本项目 Agent 的关系

| 路径约定 | 用途 |
|----------|------|
| `viking://resources/college/{id}/key-tasks/...` | 重点任务快照 |
| `viking://resources/college/{id}/academic-risk/...` | 学业风险聚合快照 |
| `viking://skills/college/...` | 分析技能说明 |
| `viking://memory/sessions/{sessionId}/...` | 追问会话记忆 |

服务不可达时，后端会**自动降级内存存储**（重启丢失）；服务可用后会优先写入 OpenViking。

本项目客户端已对齐官方接口：

- `POST /api/v1/content/write` / `GET /api/v1/content/read`
- `POST /api/v1/fs/mkdir`
- `POST /api/v1/search/find`
- `POST /api/v1/sessions` + messages/context

技能路径使用 `viking://agent/skills/...`，资源使用 `viking://resources/...`。

## 5. 自检脚本

```bash
cd backend
python scripts/test_openviking.py
```
