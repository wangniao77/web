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
  kpis: Array<{
    key: KpiKey
    label: string
    value: number | string
    unit?: string
    trend?: TrendInfo
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
