# Student API 契约

Base URL: `{VITE_API_BASE}`（默认 `/api/v1`）

## Dashboard

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/student/:studentId/dashboard` | 学生个人大屏全量数据 |

Path 参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `studentId` | string | 学号 |

可选 Query（`StudentScope`）：`academicYear`, `semester`

响应：`ApiResponse<StudentDashboardDTO>`

类型定义见 `src/domains/student/types/api/index.ts`。

## 已知前端缺口

- `health` 字段已在 DTO/VM 中定义，UI 暂未展示（TODO）
