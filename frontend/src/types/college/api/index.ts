import type { TrendInfo } from '@/types/common'

export type KpiKey =
  | 'teachers'
  | 'studentRatio'
  | 'courses'
  | 'topPapers'
  | 'projects'
  | 'patents'
  | 'platforms'
  | 'teams'

export interface OverviewHubDTO {
  developmentIndex: number
  maxScore: number
  starLevel: number
  /** 系部拆解（教师数 / 成果数），不改指数公式 */
  byDepartment?: Array<{
    department: string
    teachers: number
    achievements: number
  }>
  /** 指导办学诊断：短板与红线提示 */
  diagnosis?: {
    status: 'healthy' | 'watch' | 'alert' | 'neutral'
    summary: string
    details?: string[]
    indexBand?: string
  }
  pillars?: Array<{
    key: string
    label: string
    score: number
    weight: number
  }>
  kpis: Array<{
    key: KpiKey
    label: string
    value: number | string
    unit?: string
    /** 有真实同比时才返回；否则用 status/hint 指导办学 */
    trend?: TrendInfo
    status?: 'healthy' | 'watch' | 'alert' | 'neutral'
    hint?: string
  }>
}

export interface KeyTaskDTO {
  id: string
  name: string
  progress: number
  status: 'ongoing' | 'completed' | 'delayed' | 'attention' | 'overdue'
  deadline?: string
}

export interface StudentOverviewDTO {
  metrics: Array<{
    key: string
    label: string
    value: number | string
    unit?: string
    trend?: TrendInfo
  }>
  employmentDirection: Array<{ name: string; value: number }>
  employmentRegions: Array<{ name: string; value: number }>
  qualityDevelopment: Array<{ name: string; value: number }>
  warnings: { academic: number; fundingRate: number }
}

export interface TeachingOverviewDTO {
  metrics: Array<{ label: string; value: number | string; unit?: string }>
  evaluationTrend: {
    years: string[]
    values: number[]
  }
  courseConstruction: Array<{ name: string; value: number }>
}

export interface ResearchOverviewDTO {
  metrics: Array<{
    label: string
    value: number | string
    unit?: string
    trend?: TrendInfo
  }>
  fundingTrend: {
    years: string[]
    series: Array<{ name: string; data: number[] }>
  }
  platforms: Array<{ name: string; count: number }>
}

export type {
  DevQualityDimension,
  EvaluationIndicatorKey,
  SankeyLinkDTO,
  SankeyNodeDTO,
  StudentDevQualityDTO,
  StudentDevDetailDTO,
  StudentEvaluationDetailDTO,
  StudentFlowSankeyDTO,
} from './student-dev-quality'

export type {
  AchievementCategory,
  BenchmarkAchievementItemDTO,
  BenchmarkAchievementsDTO,
  BenchmarkAchievementsDetailDTO,
  BenchmarkCompetitionsDTO,
  BenchmarkFacultyLeaderDTO,
  BenchmarkKeyProjectsDTO,
  BenchmarkMilestoneDTO,
  BenchmarkSummaryDTO,
  BenchmarkTopPapersDTO,
  MilestoneBadge,
} from './benchmark-achievements'

export type {
  TeacherAnalyticsDTO,
  TeacherAnalyticsDetailDTO,
} from './teacher-analytics'

export type {
  DisciplineDimensionScoreDTO,
  DisciplineOverviewDTO,
  DisciplineOverviewDetailDTO,
} from './discipline-overview'

export type {
  EnrollmentEmploymentOverviewDTO,
  EnrollmentEmploymentDetailDTO,
  EnrollmentEmploymentFocus,
} from './enrollment-employment'

export interface WarningOverviewDTO {
  categories: Array<{
    type: 'academic' | 'psychological' | 'employment' | 'credit'
    label: string
    count: number
    momChange: number
  }>
  trend: {
    months: string[]
    series: Array<{ name: string; data: number[] }>
  }
  creditCompletion: {
    threshold: number
    categories: string[]
    junior: number[]
    senior: number[]
  }
}
