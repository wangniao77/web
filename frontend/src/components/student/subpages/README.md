# 学生端二级页面 (subpages)

> 此文件夹用于存放**学生端的所有二级页面**，与一级页面（`modules/`、`views/`）物理隔离，方便后续整体提取。

## 📁 目录结构

```
subpages/
├── README.md                    # 本说明文件
├── _shared/                     # 【共享】多个二级页面共用的组件 / 数据
│   ├── StudentDetailLayout.vue  #   学生端二级页面通用布局（标题 + 返回按钮）
│   ├── gpa-data/                #   GPA 详情相关数据层（gpa-detail / gpa-semester 共用）
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   ├── mock.ts
│   │   ├── adapter.ts
│   │   └── service.ts
│   └── credit-data/             #   学分/培养方案数据层（credit-progress 单页面用）
│       ├── index.ts
│       ├── types.ts
│       ├── mock.ts
│       ├── adapter.ts
│       └── service.ts
│
├── gpa-detail/                  # ✅ GPA 详情（概览）
│   ├── index.vue
│   ├── router.ts
│   └── components/  (7 个)
│
├── gpa-semester/                # ✅ GPA 详情（学期课程明细 · 独立整页）
│   ├── index.vue
│   ├── router.ts
│   └── components/
│       └── SemesterCourseTable.vue
│
└── credit-progress/             # ✅ 学分进度与培养方案（整页 · 面向老师）
    ├── index.vue
    ├── router.ts
    └── components/
        ├── KpiSummary.vue             #   顶部 5 卡 KPI（总进度 + 4 类别，含进度条）
        ├── CategoryProgressChart.vue  #   各类别学分达成对比（横向条形图）
        ├── GapReminderCard.vue        #   未达成提醒（自动派生）
        └── TrainingPlanTable.vue      #   个人培养方案进度表（占满整行 + 撑满页面剩余空间）
```

## ✅ 强制规则

1. **物理隔离**：二级页面**不允许**引用 `../modules/*`、`../views/*`、`../components/*` 等一级页面内部文件。
2. **自包含**：每个二级页面的 `index.vue` 必须能在不依赖其他二级页面的情况下独立运行（开发态）。
3. **共享机制**：如需跨二级页面复用，代码必须放在 `_shared/` 下（如 `_shared/gpa-data/`、`_shared/credit-data/`），禁止跨页面互相 import。
4. **路由独立**：每个二级页面的路由声明在各自的 `router.ts` 内，统一在 `src/router/index.ts` 中以**顶级独立路由**方式挂载。
5. **命名约定**：
   - 文件夹名使用 kebab-case（如 `credit-progress`）
   - 组件名使用 PascalCase（如 `KpiSummary`）
   - 文件名与导出名保持一致

## 📐 布局模式

`StudentDetailLayout.vue` 的 `<main>` 默认内部滚动（适合概览/图表页），子内容自适应高度。

如需"占满整行"效果（如本页面底部的"个人培养方案进度表"）：
- 父容器 `flex: 1; min-height: 0;`（占满剩余空间）
- 子容器 `flex: 1; min-height: 0; overflow: hidden;` + 内部 `.tables-wrap { overflow-y: auto; }`

## 🚀 提取方式

后续需要单独拿出来时：

1. 复制整个 `subpages/` 文件夹
2. 在目标项目中：
   - 复制 `_shared/StudentDetailLayout.vue` 作为新的二级页面通用布局
   - 复制 `_shared/gpa-data/` 和 `_shared/credit-data/` 整个数据层
   - 在路由表中加入各子页面的路径
   - 把各页面 `components/` 下的所有组件复制过去
3. 后续对接后端时，修改对应 `_shared/.../service.ts` 里的 `fetch` 分支即可

## 📝 页面清单

| # | 页面名 | 文件夹 | 路由 | 入口触发 | 受众 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | GPA 详情（概览） | `gpa-detail/` | `/student/gpa-detail` | 一级页 `AcademicDevPanel` 点击 "绩点 GPA" KPI 卡 | 学生 / 老师 | ✅ |
| 2 | GPA 详情（学期明细）| `gpa-semester/` | `/student/gpa-semester` | gpa-detail 底部"查看完整明细"卡片 | 学生 / 老师 | ✅ |
| 3 | 学分进度与培养方案（含个人培养方案进度表）| `credit-progress/` | `/student/credit-progress` | 一级页 `AcademicDevPanel` 点击 "学分完成率" KPI 卡 | 老师为主 | ✅ |

> 每新增一个二级页面，请在「页面清单」中追加一行。
