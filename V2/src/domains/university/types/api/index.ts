import type { TrendInfo } from '@/core/types/common'

export type UniversityKpiKey =
  | 'studentDev'
  | 'furtherStudy'
  | 'research'
  | 'employment'
  | 'safety'
  | 'governance'

export type KeyTaskStatus = 'ongoing' | 'completed' | 'attention'

export type NewsTag = 'important' | 'headline' | 'notice'

export interface OrbitKpiDTO {
  key: UniversityKpiKey
  label: string
  value: number | string
  unit?: string
  trend?: TrendInfo
}

export interface UniversityHubDTO {
  developmentIndex: number
  maxScore: number
  levelLabel: string
  yearDelta: number
  kpis: OrbitKpiDTO[]
}

export interface CollegeRankingItemDTO {
  rank: number
  collegeName: string
  score: number
  trend: number
}

export interface KpiMetricDTO {
  label: string
  value: number | string
  unit?: string
  trend?: TrendInfo
}

export interface EmploymentQualityDTO {
  metrics: KpiMetricDTO[]
  trend: Array<{ term: string; rate: number }>
  distribution: Array<{ name: string; value: number }>
}

export interface NewsItemDTO {
  id: string
  tag: NewsTag
  title: string
  summary: string
  date: string
}

export interface KeyTaskDTO {
  id: string
  name: string
  progress: number
  status: KeyTaskStatus
}

export interface UniversityOverviewDTO {
  hub: UniversityHubDTO
  collegeRanking: CollegeRankingItemDTO[]
  rankingFormula: string
  employmentQuality: EmploymentQualityDTO
  news: NewsItemDTO[]
  keyTasks: KeyTaskDTO[]
}
