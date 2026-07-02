# 大数据与人工智能学院发展与治理驾驶舱

React + TypeScript + Vite + ECharts 学院数据大屏。

## 启动

```bash
cd college-cockpit
npm install
npm run dev
```

默认地址：`http://localhost:5173`

## 与统一门户联调

1. 在仓库根目录进入 `dashboard`，复制 `.env.example` 为 `.env.development`
2. 启动门户：`cd dashboard && npm run dev`（默认 `http://localhost:5174`）
3. 在门户首页点击「学院大屏」，将跳转到本驾驶舱
