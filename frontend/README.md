# 发展与治理驾驶舱 V2

广东财经大学 · 大数据与人工智能学院统一可视化大屏前端。

## 快速开始

```bash
nvm use          # Node 20.19+（见 .nvmrc）
npm install
npm run dev
```

默认 Mock 数据，访问 http://localhost:5173

## 项目结构

```
src/
├── main.ts              # 入口
├── App.vue              # 根组件
├── api/                 # HTTP 客户端、Mock 切换、业务接口
├── assets/              # 静态资源
├── components/          # 组件（按 college / university / student 分组）
├── composables/         # 组合式函数
├── constants/           # 常量与路由路径
├── layouts/             # 布局壳
├── mock/                # 开发 Mock 数据
├── router/              # 路由
├── stores/              # Pinia 状态
├── styles/              # 全局与主题样式
├── types/               # TypeScript 类型
├── utils/               # 工具函数
└── views/               # 页面视图
```

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

## 数据流

```
views → api/{domain}/services → adapters → api/{domain} → mock 或后端
```

## Mock / 后端联调

- 开发：`VITE_USE_MOCK=true`（默认）
- 联调：设置 `VITE_USE_MOCK=false`，确保后端在 `localhost:8080` 提供 API
- Vite 代理：`/api` → `http://localhost:8080`

## API 契约

- [学院 API](docs/api/college.md)
- [学生 API](docs/api/student.md)
- [学校 API](docs/api/university.md)

## 技术栈

Vue 3 · TypeScript · Vite · Pinia · Vue Router · ECharts · GSAP · Three.js · SCSS
