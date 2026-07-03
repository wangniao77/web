# College API 契约

Base URL: `{VITE_API_BASE}`（默认 `/api/v1`）

通用 Query 参数（`CollegeScope`）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `collegeId` | string | 学院 ID |
| `academicYear` | string | 学年，如 `2024-2025` |
| `semester` | `1` \| `2` | 学期 |

响应包装：`ApiResponse<T>` — `{ code, message, data, timestamp }`

## Overview（6）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/college/overview/hub` | 中心 KPI 与发展指数 |
| GET | `/college/tasks/annual-progress` | 年度重点任务列表 |
| GET | `/college/students/overview` | 学生就业概览 |
| GET | `/college/teaching/overview` | 教学质量概览 |
| GET | `/college/research/overview` | 科研创新概览 |
| GET | `/college/warnings/overview` | 预警风险概览 |

## Details（6）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/college/high-potential/overview` | 高潜学生各维度概览 |
| GET | `/college/tasks/detail` | 重点任务详情 |
| GET | `/college/warnings/:type` | 预警名单（`:type` 见 `WarningCategoryType`） |
| GET | `/college/teaching/courses` | 课程建设详情 |
| GET | `/college/research/platforms` | 科研平台详情 |
| GET | `/college/students/employment-detail` | 就业去向详情 |

类型定义见 `src/domains/college/types/api/`。
