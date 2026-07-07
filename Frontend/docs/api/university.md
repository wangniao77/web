# University API 契约

Base URL: `{VITE_API_BASE}`（默认 `/api/v1`）

## Overview

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/university/overview` | 学校综合大屏数据 |
| GET | `/university/key-tasks/detail` | 年度重点任务详情 |
| GET | `/university/employment/detail` | 就业与升学质量详情 |
| GET | `/university/news/detail` | 学校新闻详情 |

响应：`ApiResponse<T>`

### UniversityOverviewDTO

```typescript
interface UniversityOverviewDTO {
  hub: {
    developmentIndex: number
    maxScore: number
    levelLabel: string
    yearDelta: number
    kpis: Array<{ key: string; label: string; value: number; trend?: TrendInfo }>
  }
  collegeRanking: Array<{ rank: number; collegeName: string; score: number; trend: number }>
  rankingFormula: string
  employmentQuality: {
    metrics: Array<{ label: string; value: number; unit?: string; trend?: TrendInfo }>
    trend: Array<{ term: string; rate: number }>
    distribution: Array<{ name: string; value: number }>
  }
  news: Array<{ id: string; tag: string; title: string; summary: string; date: string }>
  keyTasks: Array<{ id: string; name: string; progress: number; status: string }>
}
```

类型定义见 `src/domains/university/types/api/`。

前端 Mock 见 `src/domains/university/mock/`；切换 `VITE_USE_MOCK=false` 后将请求上述 endpoint（后端待实现）。
