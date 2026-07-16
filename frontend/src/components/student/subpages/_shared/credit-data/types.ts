/**
 * 学生端"学分完成率 / 培养方案"系列页面 · 业务类型
 *
 * 4 大类：
 * - 公共基础课 / 学科基础课 / 专业核心课 / 专业选修课
 *
 * 状态：
 * - completed（已通过）/ in-progress（在修）/ not-started（未修）/ failed（不及格）
 *
 * 共享给：
 * - credit-progress/ 概览页（KPI / 图表 / 提醒）
 * - training-plan/ 个人培养方案进度表（独立整页）
 */

export type PlanCategory =
  | 'general'      // 公共基础课
  | 'major-base'   // 学科基础课
  | 'major-core'   // 专业核心课
  | 'elective'     // 专业选修课

export type CourseStatus =
  | 'completed'    // 已通过
  | 'in-progress'  // 正在修（本学期）
  | 'not-started'  // 尚未修读
  | 'failed'       // 不及格待补考

/* ── 培养方案课程 ──────────────────────────────────────── */

export interface PlanCourseDTO {
  id: string
  name: string
  category: PlanCategory
  categoryLabel: string
  credit: number
  recommendedSemester: number       // 1-8 建议修读学期
  recommendedSemesterLabel: string  // '大一上' | '大一下' | '大二上' | ...
  required: boolean                 // 是否必修
  status: CourseStatus
  score?: number                    // 已修则带分数
  actualSemester?: string           // 已修的实际学期
}

/* ── 类别汇总 ──────────────────────────────────────────── */

export interface CategoryProgressDTO {
  id: PlanCategory
  name: string
  requiredCredits: number
  earnedCredits: number
  remainingCredits: number
  progress: number                  // 0-100
  status: 'complete' | 'in-progress' | 'incomplete'
  requiredCourseCount: number
  completedCourseCount: number
  remainingCourseCount: number
}

/* ── 缺口提醒（给老师） ────────────────────────────────── */

export interface GapItemDTO {
  categoryId: PlanCategory
  categoryName: string
  type: 'credits' | 'courses'
  severity: 'high' | 'medium' | 'low'
  remaining: number
  /** 缺口描述，例如 "还需修 12 学分" */
  description: string
  /** 给老师的关注建议，例如 "重点关注自然辩证法、计算机伦理学" */
  suggestion: string
  /** 缺口关联的具体课程名（如果是课程类缺口） */
  relatedCourses?: string[]
}

/* ── 总结 DTO ──────────────────────────────────────────── */

export interface CreditProgressSummaryDTO {
  studentId: string
  studentName: string
  major: string
  grade: string
  trainingPlanName: string         // '软件工程专业本科教学计划'
  totalRequiredCredits: number
  totalEarnedCredits: number       // 实际获得
  countedGpaCredits: number        // 计入 GPA 的学分
  overallProgress: number          // 0-100
  categories: CategoryProgressDTO[]
  gaps: GapItemDTO[]               // 自动派生：有缺口时生成
}

/* ── 完整 DTO（mock / 后端返回） ─────────────────────────── */

export interface CreditProgressDTO {
  summary: CreditProgressSummaryDTO
  courses: PlanCourseDTO[]
}

/* ── 页面 VM ──────────────────────────────────────────── */

export interface CreditProgressVM {
  summary: CreditProgressSummaryDTO & {
    categories: Array<CategoryProgressDTO & {
      earnedText: string
      remainingText: string
      progressText: string
      isComplete: boolean
    }>
  }
  courses: PlanCourseDTO[]
  /** 是否有缺口（决定是否显示提醒卡片） */
  hasGaps: boolean
}
