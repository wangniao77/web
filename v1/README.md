# 发展与治理驾驶舱

广东财经大学 · 大数据与人工智能学院统一可视化大屏前端。

单一 Vue 3 项目，整合原 `dashboard` 门户/学校/学生大屏与原 `college-cockpit` 学院驾驶舱能力。

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

## 开发

```bash
npm install
npm run dev
```

默认 Mock 数据，访问 http://localhost:5173

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_USE_MOCK` | 是否使用 Mock | `true` |
| `VITE_API_BASE` | API 前缀 | `/api/v1` |
| `VITE_DEFAULT_VIEW` | 默认视图 | `college` |

## 架构分层

```
views / modules        # 页面与业务模块
  ↓
services               # 业务服务（Mock / API 切换）
  ↓
adapters               # DTO → ViewModel
  ↓
api + mock             # 接口与开发数据
  ↓
types/api + types/view # 双轨类型定义
```

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Vue Router · ECharts · GSAP · Three.js · SCSS
