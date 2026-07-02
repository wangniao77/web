# 发展与治理驾驶舱

广东财经大学 · 大数据与人工智能学院可视化大屏前端项目。

## 三类视图

| 路由 | 说明 |
|------|------|
| `/` | Portal 入口，选择视图 |
| `/college` | 学院大屏（7 模块总览） |
| `/university` | 学校大屏 |
| `/student` | 学生个人大屏 |

## 开发

```bash
cd dashboard
npm install
npm run dev
```

默认 Mock 数据，无需后端。访问 http://localhost:5173

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_USE_MOCK` | 是否使用 Mock | `true` |
| `VITE_API_BASE` | API 前缀 | `/api/v1` |
| `VITE_DEFAULT_VIEW` | 默认视图 | `college` |

## 后端接口（预留）

学院域接口前缀：`/api/v1/college/*`

详见 `src/types/api/college/` 与 `src/api/college/`。

联调时将 `.env.development` 中 `VITE_USE_MOCK=false`，并配置 Vite proxy 指向后端。

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Vue Router · ECharts · SCSS
