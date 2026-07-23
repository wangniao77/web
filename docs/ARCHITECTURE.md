# 发展与治理驾驶舱 — 项目架构文档

> **项目**: gdut-governance-cockpit-v2  
> **机构**: 广东财经大学 · 大数据与人工智能学院  
> **版本**: master @ `fe1de53`  
> **文档日期**: 2026-07-06

---

## 目录

1. [项目概述](#1-项目概述)
2. [系统总体架构](#2-系统总体架构)
3. [目录结构](#3-目录结构)
4. [技术栈](#4-技术栈)
5. [前端架构](#5-前端架构)
6. [后端架构](#6-后端架构)
7. [数据层架构](#7-数据层架构)
8. [API 契约与前后端对接](#8-api-契约与前后端对接)
9. [业务功能地图](#9-业务功能地图)
10. [部署与运行](#10-部署与运行)
11. [架构评估与改进建议](#11-架构评估与改进建议)

---

## 1. 项目概述

本项目是一套 **高校发展与治理可视化驾驶舱**，面向三个层级提供数据大屏展示：

| 层级 | 路由前缀 | 目标用户 | 核心能力 |
|------|----------|----------|----------|
| 统一门户 | `/` | 所有用户 | 导航入口，切换三大驾驶舱 |
| 学院驾驶舱 | `/college/*` | 学院管理者 | KPI、重点任务、高潜学生、教学/科研/预警/就业 |
| 学校驾驶舱 | `/university/*` | 校级管理者 | 战略达成、核心指标、外部对标、风险预警、重点任务轨道图 |
| 学生驾驶舱 | `/student` | 学生个人 | 成长雷达、学业发展、竞赛实习、AI 助手 |

**当前成熟度**:

- **前端**: 功能完整，Mock 数据完备，UI/交互已可独立演示
- **后端**: 脚手架阶段，仅实现健康检查接口
- **数据层**: PostgreSQL 模型 + Excel 导入脚本已就绪，尚未与 API 打通

---

## 2. 系统总体架构

### 2.1 逻辑架构图

```mermaid
graph TB
    subgraph Client["浏览器 / 大屏终端"]
        Portal["统一门户 PortalView"]
        College["学院驾驶舱 /college"]
        University["学校驾驶舱 /university"]
        Student["学生驾驶舱 /student"]
    end

    subgraph Frontend["前端 Vue 3 SPA"]
        Router["Vue Router"]
        Pinia["Pinia Stores"]
        Views["Views 页面层"]
        Services["API Services"]
        Adapters["DTO → ViewModel Adapters"]
        Mock["Mock 数据层"]
        Axios["Axios HTTP Client"]
    end

    subgraph Backend["后端 FastAPI"]
        Routers["Routers 路由层"]
        Svc["Services 业务层"]
        Utils["Utils 工具层"]
        Auth["JWT 鉴权（未接入）"]
    end

    subgraph Data["数据层"]
        PG[("PostgreSQL")]
        Excel["Excel 学籍成绩"]
        ETL["app/importers ETL"]
    end

    Portal --> Router
    College --> Router
    University --> Router
    Student --> Router

    Router --> Views
    Views --> Pinia
    Views --> Services
    Services --> Adapters
    Services -->|VITE_USE_MOCK=true| Mock
    Services -->|VITE_USE_MOCK=false| Axios
    Axios -->|"/api/*"| Routers
    Routers --> Svc
    Svc --> Utils
    Utils --> PG
    Excel --> ETL
    ETL --> PG
```

### 2.2 物理部署架构（目标态）

```mermaid
graph LR
    User["用户浏览器"] -->|HTTPS| Nginx["Nginx 反向代理"]
    Nginx -->|"/"| Static["前端静态资源 dist/"]
    Nginx -->|"/api/*"| API["FastAPI :8080"]
    API --> PG[("PostgreSQL :5432")]
    Admin["数据管理员"] -->|Excel 上传| ETL["ETL 脚本 app/"]
    ETL --> PG
```

> **现状**: 无 Docker / Nginx / CI 配置，开发环境通过 Vite Dev Server 代理 API。

### 2.3 开发环境数据流

```mermaid
sequenceDiagram
    participant V as Vue 页面
    participant S as createService
    participant M as Mock 层
    participant A as Axios
    participant P as Vite Proxy :5173
    participant B as FastAPI :8080
    participant D as PostgreSQL

    alt VITE_USE_MOCK=true（默认）
        V->>S: 调用 service()
        S->>M: mock(args) + 200ms 延迟
        M-->>V: Mock 数据
    else VITE_USE_MOCK=false
        V->>S: 调用 service()
        S->>A: fetch(args)
        A->>P: GET /api/v1/college/...
        P->>B: 转发 localhost:8080
        B->>D: Tortoise ORM 查询
        D-->>B: 原始数据
        B-->>A: ApiResponse JSON
        A-->>V: DTO → Adapter → ViewModel
    end
```

---

## 3. 目录结构

```
v3/
├── frontend/                   # Vue 3 前端大屏（主体工程）
│   ├── src/
│   │   ├── main.ts             # 应用入口
│   │   ├── App.vue             # 根组件
│   │   ├── api/                # HTTP 客户端 + 业务 Service + Adapter
│   │   ├── components/         # UI 组件（college / university / student）
│   │   ├── composables/        # 组合式函数（缩放、刷新、Scope 等）
│   │   ├── constants/          # 路由常量、主题配置
│   │   ├── layouts/            # 大屏布局壳
│   │   ├── mock/               # Mock 数据
│   │   ├── router/             # 路由定义
│   │   ├── stores/             # Pinia 状态
│   │   ├── styles/             # SCSS 主题与全局样式
│   │   ├── types/              # TypeScript 类型（api DTO + view VM）
│   │   ├── utils/              # 工具函数
│   │   └── views/              # 页面视图
│   ├── docs/api/               # API 契约文档
│   ├── vite.config.ts          # Vite 构建 + 开发代理
│   └── package.json
│
├── backend/                    # FastAPI 后端 API
│   ├── main.py                 # 应用入口
│   ├── core/                   # 配置、数据库、日志
│   ├── Routers/                # 路由层 + Pydantic Schema + JWT
│   ├── Services/               # 业务层
│   ├── Utils/                  # 工具层（DB read/write、Agent 预留）
│   ├── requirements.txt
│   └── .env                    # 环境变量
│
├── app/                        # 数据导入 ETL 模块
│   ├── db.py                   # Tortoise ORM 配置
│   ├── models/                 # 数据模型（与 backend 重复）
│   ├── importers/              # Excel → PostgreSQL 导入器
│   └── example_import.py       # CLI 导入入口
│
├── migrations/                 # Aerich 数据库迁移（绑定 app/db.py）
├── clone/                      # 克隆相关资源
├── Datas/                      # Excel 数据文件（按需放置）
├── pyproject.toml              # 根级 Aerich 配置
├── requirements.txt            # 根级 Python 依赖
└── rules.skill                 # 后端分层架构规范
```

---

## 4. 技术栈

### 4.1 前端

| 类别 | 技术 | 版本 |
|------|------|------|
| 语言 | TypeScript | ~6.0 |
| 框架 | Vue 3 + Vue Router + Pinia | 3.5 / 5.1 / 3.0 |
| 构建 | Vite + vue-tsc | 8.1 |
| HTTP | Axios | 1.18 |
| 图表 | ECharts | 6.1 |
| 大屏组件 | @kjgl77/datav-vue3 | 1.7 |
| UI 组件 | Naive UI | 2.44 |
| 动画 | GSAP | 3.15 |
| 3D | Three.js | 0.185 |
| 样式 | SCSS | 1.101 |
| 运行时 | Node.js | 20.19+ |

### 4.2 后端

| 类别 | 技术 |
|------|------|
| 语言 | Python ≥ 3.11 |
| Web 框架 | FastAPI + Uvicorn |
| ORM | Tortoise ORM + asyncpg |
| 配置 | pydantic-settings |
| 认证 | PyJWT（已实现，未挂载） |
| 迁移 | Aerich |
| 数据处理 | openpyxl |
| AI 预留 | langgraph / langchain-core（注释） |

### 4.3 数据库

- **引擎**: PostgreSQL
- **默认 DSN**: `postgres://root:123456@192.168.8.110:5432/studentmodelingdata`
- **核心表**: `student_academic_records`（学籍成绩，90+ 字段）

---

## 5. 前端架构

### 5.1 分层架构

```mermaid
graph TD
    subgraph Presentation["表现层"]
        Views["views/ 页面"]
        Components["components/ 组件"]
        Layouts["layouts/ 布局壳"]
    end

    subgraph State["状态层"]
        AppStore["stores/app — 视图模式/ID"]
        FilterStore["stores/filter — 学年学期"]
        ScreenStore["stores/screen — 缩放/刷新"]
        Composables["composables/ — useScope 等"]
    end

    subgraph DataAccess["数据访问层"]
        Services["api/{domain}/services/"]
        Adapters["api/{domain}/adapters/"]
        HttpApi["api/{domain}/index.ts"]
        CreateSvc["api/createService.ts"]
        MockData["mock/{domain}/"]
        Client["api/client.ts — Axios"]
    end

    subgraph Types["类型层"]
        ApiTypes["types/{domain}/api/ — DTO"]
        ViewTypes["types/{domain}/view/ — VM"]
    end

    Views --> Components
    Views --> Composables
    Composables --> AppStore
    Composables --> FilterStore
    Views --> Services
    Services --> Adapters
    Services --> CreateSvc
    CreateSvc --> MockData
    CreateSvc --> HttpApi
    HttpApi --> Client
    Adapters --> ViewTypes
    HttpApi --> ApiTypes
```

### 5.2 核心设计模式

#### Mock / 真实 API 一键切换

`createService` 根据环境变量 `VITE_USE_MOCK` 决定数据来源，业务代码无需修改：

```typescript
// frontend/src/api/createService.ts
export function createService<TArgs, TResult>(opts: {
  mock: (args: TArgs) => TResult | Promise<TResult>
  fetch: (args: TArgs) => Promise<TResult>
}) {
  return async (args?: TArgs) => {
    if (useMock) {
      await delay(200)
      return opts.mock(resolvedArgs)
    }
    return opts.fetch(resolvedArgs)
  }
}
```

#### DTO → ViewModel 适配

后端返回的原始 DTO 经 Adapter 转换为 UI 友好的 ViewModel（格式化数值、映射状态标签、计算衍生字段）。

#### Scope 参数统一注入

`useScope()` 组合式函数从 Pinia Store 聚合 `collegeId`、`studentId`、`academicYear`、`semester`，作为所有 API 请求的通用 Query 参数。

#### 大屏自适应

- 设计基准: 1920 × 1080
- `useScreenScale()` 按窗口比例缩放
- `useAutoRefresh()` 默认 5 分钟自动刷新，页面隐藏时暂停

### 5.3 路由结构

```mermaid
graph TD
    Root["/ PortalView"]
    Root --> College["/college CollegeShellView"]
    Root --> University["/university UniversityShellView"]
    Root --> Student["/student StudentOverviewView"]

    College --> CO["/ 总览"]
    College --> C1["/key-tasks 重点任务"]
    College --> C2["/high-potential/:moduleId 高潜维度"]
    College --> C3["/warning/:type 预警名单"]
    College --> C4["/teaching/courses 课程建设"]
    College --> C5["/research/platforms 科研平台"]
    College --> C6["/student/employment 就业去向"]

    University --> UO["/ 总览"]
    University --> U1["/research 科研详情"]
    University --> U2["/tasks 重点任务"]
    University --> U3["/disciplines 学科竞争力"]
    University --> U4["/employment 就业质量"]
    University --> U5["/events 事件风险"]
    University --> U6["/academic-risk 学业风险"]
    University --> U7["/metrics 指标详情"]
```

### 5.4 三域平行结构

前端按业务域（college / university / student）组织，每个域拥有独立的：

| 子目录 | 职责 |
|--------|------|
| `api/{domain}/` | HTTP 调用定义 |
| `api/{domain}/services/` | 业务 Service（Mock/真实切换入口） |
| `api/{domain}/adapters/` | DTO → ViewModel 转换 |
| `types/{domain}/api/` | API 响应类型（DTO） |
| `types/{domain}/view/` | 视图展示类型（VM） |
| `mock/{domain}/` | Mock 数据 |
| `components/{domain}/` | 域专属 UI 组件 |
| `views/{domain}/` | 页面视图 |
| `styles/{domain}/` | 域主题样式 |

### 5.5 关键 Composables

| 函数 | 文件 | 用途 |
|------|------|------|
| `useScope()` | `composables/useScope.ts` | 聚合 Scope 查询参数 |
| `useAutoRefresh()` | `composables/useAutoRefresh.ts` | 定时刷新 + 页面可见性控制 |
| `useScreenScale()` | `composables/useScreenScale.ts` | 1920×1080 自适应缩放 |
| `useUniversityEntrance()` | `composables/useUniversityEntrance.ts` | 学校大屏 GSAP 入场动画 |
| `useStudentEntrance()` | `composables/useStudentEntrance.ts` | 学生大屏入场动画 |
| `useClock()` | `composables/useClock.ts` | 实时时钟 |

---

## 6. 后端架构

### 6.1 分层架构（遵循 rules.skill 规范）

```mermaid
graph TD
    subgraph RouterLayer["路由层 Routers/"]
        HealthRouter["health_router.py"]
        FutureRouters["college_router.py（待建）"]
        ReqModels["Models/req/ — 请求 Schema"]
        RespModels["Models/resp/ — 响应 Schema"]
        AuthLayer["Auth/auth.py — JWT"]
    end

    subgraph ServiceLayer["业务层 Services/"]
        HealthSvc["health_service.py"]
        FutureSvcs["college_service.py（待建）"]
    end

    subgraph UtilsLayer["工具层 Utils/"]
        DBRead["DB/read/ — 查询"]
        DBWrite["DB/write/ — 写入"]
        DBModels["DB/Models/ — Tortoise 模型"]
        Agent["Agent/ — LLM 工作流（预留）"]
    end

    subgraph CoreLayer["核心层 core/"]
        Config["config.py — pydantic-settings"]
        Database["database.py — Tortoise 初始化"]
        Logger["logger.py — 日志"]
    end

    HealthRouter --> HealthSvc
    FutureRouters --> FutureSvcs
    FutureSvcs --> DBRead
    FutureSvcs --> DBWrite
    DBRead --> DBModels
    DBWrite --> DBModels
    Database --> DBModels
    Config --> Database
```

### 6.2 调用链规则

```
Router → Service → Utils
```

| 规则 | 说明 |
|------|------|
| Router 只调 Service | 负责参数校验、调用业务、返回响应 |
| Service 只调 Utils | 编排业务逻辑，不直接操作 DB |
| Utils 只被 Service 调 | 封装 DB 读写、Excel 解析、Agent 调用 |
| 禁止 Router → Utils | 跳过业务层 |
| 禁止 Utils → Service | 反向依赖 |
| 禁止 Service → Router | 反向依赖 |

### 6.3 统一响应格式

```python
# backend/Routers/Models/resp/common_model.py
class ApiResponse(BaseModel, Generic[T]):
    code: int = 0
    message: str = "success"
    data: T
    timestamp: int  # Unix 毫秒时间戳

class PageData(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int
```

### 6.4 已实现 vs 待实现

| 模块 | 状态 | 说明 |
|------|------|------|
| `GET /api/health` | ✅ 已实现 | 健康检查 |
| JWT 鉴权工具 | ⚠️ 已实现未接入 | `Routers/Auth/auth.py` |
| 学籍记录 DB 读写 | ⚠️ 已实现未暴露 | `Utils/DB/read|write/` |
| `/api/v1/college/*` | ❌ 待实现 | 12 个端点 |
| `/api/v1/university/*` | ❌ 待实现 | 9 个端点 |
| `/api/v1/student/*` | ❌ 待实现 | 1 个端点 |
| CORS 中间件 | ❌ 未配置 | 生产环境需添加 |
| Agent 工作流 | ⚠️ 试点 | `/api/v1/agent/analyze|chat` + OpenViking 上下文（规则/LLM） |

---

## 7. 数据层架构

### 7.1 数据模型

核心表 **`student_academic_records`** — 学生学籍与成绩宽表：

```mermaid
erDiagram
    student_academic_records {
        int id PK
        string grade "年级"
        string student_id "学号"
        string name "姓名"
        string gender "性别"
        string major "专业"
        string class_name "班级"
        float gpa "GPA"
        int total_credits "总学分"
        int required_credits "必修学分"
        int elective_credits "选修学分"
        string cet4_score "四级成绩"
        string cet6_score "六级成绩"
        string competition_awards "竞赛获奖"
        string dormitory "宿舍"
        string source_file "来源 Excel"
        datetime created_at
        datetime updated_at
    }
```

> 实际模型包含 90+ 字段，涵盖各类课程统计、成绩分布、来源元数据等。  
> 唯一约束: `(grade, student_id)`

### 7.2 双模型体系（架构风险）

项目中存在 **两份几乎相同的模型定义**：

| 位置 | 用途 | Aerich 绑定 |
|------|------|-------------|
| `app/models/student_academic_record.py` | ETL 导入 | ✅ 根级 `migrations/` |
| `backend/Utils/DB/Models/student_academic_record_models.py` | API 服务 | ❌ 无 migrations |

**建议**: 合并为单一模型源，backend 引用 app 模块或抽取共享 `shared/models/`。

### 7.3 数据导入流程

```mermaid
graph LR
    Excel["Excel 学籍成绩文件"] --> Importer["app/importers/student_academic_importer.py"]
    Importer -->|"openpyxl 解析 + 中文列名映射"| Model["app/models/student_academic_record.py"]
    Model -->|"Tortoise ORM upsert"| PG[("PostgreSQL")]
    CLI["app/example_import.py"] --> Importer
```

**使用方式**:

```bash
# 在项目根目录
python -m app.example_import
# 默认读取 Datas/25级学籍成绩合并_每人一行.xlsx
```

### 7.4 数据库迁移

- **工具**: Aerich
- **迁移文件**: `migrations/models/0_20260624145818_init.py`
- **配置**: 根级 `pyproject.toml` → `app.db.TORTOISE_ORM`

---

## 8. API 契约与前后端对接

### 8.1 路径前缀差异

| 端 | 前缀 | 示例 |
|----|------|------|
| 前端 Axios | `/api/v1` | `/api/v1/college/overview/hub` |
| 后端已实现 | `/api` | `/api/health` |

**联调前需统一**: 后端路由应挂载 `/api/v1` 前缀，或前端调整 `VITE_API_BASE`。

### 8.2 完整 API 端点清单

#### 学院 API（12 个）

| 方法 | 路径 | 状态 |
|------|------|------|
| GET | `/college/overview/hub` | Mock ✅ / 后端 ❌ |
| GET | `/college/tasks/annual-progress` | Mock ✅ / 后端 ❌ |
| GET | `/college/students/overview` | Mock ✅ / 后端 ❌ |
| GET | `/college/teaching/overview` | Mock ✅ / 后端 ❌ |
| GET | `/college/research/overview` | Mock ✅ / 后端 ❌ |
| GET | `/college/warnings/overview` | Mock ✅ / 后端 ❌ |
| GET | `/college/high-potential/overview` | Mock ✅ / 后端 ❌ |
| GET | `/college/tasks/detail` | Mock ✅ / 后端 ❌ |
| GET | `/college/warnings/:type` | Mock ✅ / 后端 ❌ |
| GET | `/college/teaching/courses` | Mock ✅ / 后端 ❌ |
| GET | `/college/research/platforms` | Mock ✅ / 后端 ❌ |
| GET | `/college/students/employment-detail` | Mock ✅ / 后端 ❌ |

#### 学校 API（11 个）

| 方法 | 路径 | 状态 |
|------|------|------|
| GET | `/university/overview` | Mock ✅ / 后端 ❌ |
| GET | `/university/benchmark/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/risk/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/phd-support/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/social-service/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/international/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/talent/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/tasks/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/research/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/disciplines/detail` | Mock ✅ / 后端 ❌ |
| GET | `/university/metrics/detail` | Mock ✅ / 后端 ❌ |

#### 学生 API（1 个）

| 方法 | 路径 | 状态 |
|------|------|------|
| GET | `/student/:studentId/dashboard` | Mock ✅ / 后端 ❌ |

#### 系统 API（1 个）

| 方法 | 路径 | 状态 |
|------|------|------|
| GET | `/health` | 后端 ✅ |

### 8.3 联调配置

**前端** (`frontend/.env.development`):

```env
VITE_USE_MOCK=false
VITE_API_BASE=/api/v1
```

**Vite 代理** (`frontend/vite.config.ts`):

```typescript
proxy: {
  '/api': { target: 'http://localhost:8080', changeOrigin: true }
}
```

**后端启动**:

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

---

## 9. 业务功能地图

### 9.1 学院驾驶舱模块

```mermaid
mindmap
  root((学院驾驶舱))
    中心 KPI
      发展指数仪表盘
      核心指标卡片
    年度重点任务
      任务列表
      进度追踪
      详情钻取
    高潜学生画像
      6 维度雷达
      维度详情页
      学生名单
    教学质量
      课程概览
      课程建设详情
    科研创新
      科研概览
      平台详情
    预警风险
      多类预警概览
      预警名单详情
    学生就业
      就业概览
      去向详情
```

### 9.2 学校驾驶舱模块

| 模块 | 组件 | 详情页 |
|------|------|--------|
| 目标总览 | GoalOverviewPanel | — |
| 科研创新 | ResearchInnovationPanel | ResearchDetailView |
| 重点任务 | UniversityKeyTasksPanel | KeyTasksDetailView |
| 学科竞争力 | DisciplineCompetitivenessPanel | DisciplineDetailView |
| 就业质量 | EmploymentQualityPanel | EmploymentDetailView |
| 事件与风险 | EventsRiskPanel | EventsDetailView |
| 学业风险 | — | AcademicRiskDetailView |
| 指标详情 | — | MetricsDetailView |

### 9.3 学生驾驶舱模块

| 模块 | 技术亮点 |
|------|----------|
| 个人信息 | 基础学籍展示 |
| 成长雷达 | ECharts 雷达图 |
| AI 助手 | 预留交互区域 |
| 学业发展 | 成绩/GPA 趋势 |
| 竞赛/实习 | 列表与统计 |
| 3D 吉祥物 | Three.js Caibao3D |
| 入场动画 | GSAP 过渡效果 |

---

## 10. 部署与运行

### 10.1 本地开发

```bash
# 前端
cd frontend
nvm use          # Node 20.19+
npm install
npm run dev      # http://localhost:5173

# 后端
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# 数据导入（可选）
cd ..  # 项目根目录
python -m app.example_import
```

### 10.2 生产构建

```bash
# 前端
cd frontend
npm run build    # 输出到 frontend/dist/

# 后端
cd backend
uvicorn main:app --host 0.0.0.0 --port 8080
```

### 10.3 环境变量

**前端**:

| 变量 | 开发默认值 | 生产默认值 | 说明 |
|------|-----------|-----------|------|
| `VITE_USE_MOCK` | `true` | `false` | Mock 开关 |
| `VITE_API_BASE` | `/api/v1` | `/api/v1` | API 前缀 |
| `VITE_DEFAULT_VIEW` | `college` | `college` | 默认视图 |
| `VITE_MOCK_COLLEGE_ID` | `big-data-ai` | — | Mock 学院 ID |
| `VITE_MOCK_STUDENT_ID` | `2021001001` | — | Mock 学号 |

**后端** (`backend/.env`):

| 变量 | 说明 |
|------|------|
| `POSTGRES_DSN` | PostgreSQL 连接串 |
| `APP_NAME` | 应用名称 |
| `APP_DEBUG` | 调试模式 |
| `JWT_SECRET` | JWT 密钥 |
| `JWT_ALGORITHM` | JWT 算法 |
| `JWT_EXPIRE_MINUTES` | Token 过期时间 |

### 10.4 部署缺口

| 项目 | 状态 |
|------|------|
| Dockerfile | ❌ 未配置 |
| docker-compose | ❌ 未配置 |
| Nginx 配置 | ❌ 未配置 |
| CI/CD | ❌ 未配置 |
| HTTPS 证书 | ❌ 未配置 |

---

## 11. 架构评估与改进建议

### 11.1 优势

1. **前端架构清晰**: 三域平行、DTO/VM 分离、Mock 一键切换，适合前后端并行开发
2. **大屏体验完备**: 自适应缩放、自动刷新、GSAP/Three.js 动效，演示效果良好
3. **后端规范明确**: `rules.skill` 定义了严格的分层调用规则，便于团队协作
4. **API 契约先行**: 前端 docs/api/ 已定义完整接口契约，后端可按契约实现
5. **数据导入就绪**: Excel → PostgreSQL ETL 链路已通

### 11.2 风险与缺口

| # | 风险 | 严重度 | 建议 |
|---|------|--------|------|
| 1 | 前后端严重不同步（22 API vs 1 已实现） | 🔴 高 | 按契约优先实现 college 域 API |
| 2 | API 路径前缀不一致（`/api` vs `/api/v1`） | 🟡 中 | 后端统一挂载 `/api/v1` 前缀 |
| 3 | 双模型重复维护 | 🟡 中 | 抽取共享 models 模块 |
| 4 | 迁移配置分裂 | 🟡 中 | 统一 Aerich 配置到一处 |
| 5 | 无 CORS 配置 | 🟡 中 | 生产部署前添加 CORSMiddleware |
| 6 | JWT 已实现未使用 | 🟢 低 | 按需在路由层挂载 Depends |
| 7 | 无部署方案 | 🟡 中 | 补充 Dockerfile + docker-compose |
| 8 | API 文档路径过时 | 🟢 低 | 更新 docs 中 `src/domains/` → `src/types/` |

### 11.3 推荐实施路线

```mermaid
gantt
    title 后端 API 实现路线图
    dateFormat YYYY-MM-DD
    section 基础设施
    统一 API 前缀 /api/v1     :a1, 2026-07-07, 1d
    合并数据模型              :a2, after a1, 2d
    添加 CORS 中间件          :a3, after a1, 1d
    section 学院 API
    Overview 6 端点           :b1, after a2, 5d
    Details 6 端点            :b2, after b1, 5d
    section 学校 API
    Overview + Details 9 端点 :c1, after b2, 7d
    section 学生 API
    Dashboard 1 端点          :d1, after c1, 3d
    section 部署
    Docker + Nginx            :e1, after d1, 3d
```

### 11.4 关键文件速查

| 类别 | 路径 |
|------|------|
| 前端入口 | `frontend/src/main.ts` |
| 路由定义 | `frontend/src/router/index.ts` |
| Mock 切换 | `frontend/src/api/createService.ts` |
| HTTP 客户端 | `frontend/src/api/client.ts` |
| Vite 代理 | `frontend/vite.config.ts` |
| 后端入口 | `backend/main.py` |
| 后端配置 | `backend/core/config.py` |
| ORM 配置 | `backend/core/database.py` |
| 架构规范 | `rules.skill` |
| DB 迁移 | `migrations/models/0_20260624145818_init.py` |
| Excel 导入 | `app/importers/student_academic_importer.py` |
| 学院 API 契约 | `frontend/docs/api/college.md` |
| 学校 API 契约 | `frontend/docs/api/university.md` |
| 学生 API 契约 | `frontend/docs/api/student.md` |

---

*本文档基于 master 分支代码审查生成，如有架构变更请同步更新。*
