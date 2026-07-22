# 二级界面 Agent 分析复用指南

前端 AI 入口只调用后端 `/api/v1/agent/*`，不直连模型或 OpenViking。

## 已落地试点

- 页面：`/college/key-tasks` →「深度挖掘」Tab
- 组件：`AnalysisInsightPanel` + `AgentFollowUpChat`
- 钩子：`useAgentAnalysis(context, { enabled, auto })`

## 在其他二级页复用

1. 构造 `AgentAnalyzeContextDTO`（`scope` / `page` / id / `summarySnapshot`）
2. 调用 `useAgentAnalysis`，`enabled` 绑定当前 Tab 或路由激活态
3. 模板挂载：

```vue
<AnalysisInsightPanel
  :data="analysis"
  :loading="loading"
  :error="error"
  @refresh="refresh"
  @retry="() => run(false)"
/>
<AgentFollowUpChat
  v-if="context"
  :session-id="sessionId"
  :context="context"
/>
```

4. 后端若该 `page` 需要专用规则/技能：
   - 在 `Utils/Agent/WorkFlow/analyze.py` 增加分支
   - 在 `Utils/Agent/OpenViking/paths.py` 增加 skill/resource 路径
   - 将技能文档写入 OpenViking（启动或首次 analyze 时 upsert）

## 环境变量

| 变量 | 说明 |
|------|------|
| `VITE_USE_MOCK=true` | 前端本地规则洞察 + Mock 追问 |
| `VITE_ENABLE_AGENT=true` | 非 Mock 时调用后端 `/agent/*` |
| `OPENVIKING_URL` | 默认 `http://127.0.0.1:1933`；不可达时内存降级 |
| `LLM_API_KEY` | 未配置时后端走规则引擎，链路仍可用 |

## OpenViking 路径约定

- `viking://resources/college/{collegeId}/key-tasks/snapshot.json`
- `viking://skills/college/key-tasks-analysis/SKILL.md`
- `viking://memory/sessions/{sessionId}/transcript.jsonl`
