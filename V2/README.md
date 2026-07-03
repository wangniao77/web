# 发展与治理驾驶舱 V2

广东财经大学 · 大数据与人工智能学院统一可视化大屏前端（架构重构版）。

## 快速开始

```bash
npm install
npm run dev
```

默认 Mock 数据，访问 http://localhost:5173

## 视图路由

| 路由 | 说明 |
|------|------|
| `/` | 统一门户入口 |
| `/college` | 学院大屏总览 |
| `/college/key-tasks` | 重点任务详情 |
| `/college/high-potential/:moduleId` | 高潜学生维度详情 |
| `/college/warning/:type` | 预警名单详情 |
| `/college/teaching/courses` | 课程建设详情 |
| `/college/research/platforms` | 科研平台详情 |
| `/college/student/employment` | 就业去向详情 |
| `/university` | 学校大屏 |
| `/student` | 学生个人大屏 |

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_USE_MOCK` | 是否使用 Mock | `true` |
| `VITE_API_BASE` | API 前缀 | `/api/v1` |
| `VITE_DEFAULT_VIEW` | 默认视图 | `college` |
| `VITE_MOCK_COLLEGE_ID` | Mock 学院 ID | `big-data-ai` |
| `VITE_MOCK_STUDENT_ID` | Mock 学生 ID | `2021001001` |

## 架构分层

```
views / modules        # 页面与业务模块（domains/*）
  ↓
services               # createService Mock/API 切换
  ↓
adapters               # DTO → ViewModel
  ↓
api + mock             # 接口与开发数据
  ↓
core/types + domains/types  # 双轨类型定义
```

共享层（`src/shared/`）：

- `ScreenShell` — 统一三屏布局（theme / scaleMode / HUD）
- `ScreenPanel` — 统一面板（simple / glass / cockpit）
- `useScope` — filter + app store → API 参数
- `useDataFetch` / `useAutoRefresh` / `useDetailPage`

## Mock / 后端联调

- 开发：`VITE_USE_MOCK=true`（默认）
- 联调：设置 `VITE_USE_MOCK=false`，确保后端在 `localhost:8080` 提供 API
- Vite 代理：`/api` → `http://localhost:8080`

## API 契约（后端待补充）

- [学院 API](docs/api/college.md) — 12 endpoints
- [学生 API](docs/api/student.md) — 1 endpoint
- [学校 API](docs/api/university.md) — 1 endpoint

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Vue Router · ECharts · GSAP · Three.js · SCSS
