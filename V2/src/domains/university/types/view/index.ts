import type { TrendInfo } from '@/core/types/common'
import type { NewsTag, UniversityKpiKey } from '@/domains/university/types/api'

export interface OrbitKpiVM {
  key: UniversityKpiKey
  label: string
  value: string
  trend?: TrendInfo
  icon: string
  position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'
}

export interface SchoolHubVM {
  developmentIndex: number
  maxScore: number
  levelLabel: string
  yearDelta: number
  kpis: OrbitKpiVM[]
}

export interface CollegeRankingItemVM {
  rank: number
  collegeName: string
  score: number
  trend: number
  trendLabel: string
}

export interface KpiMetricVM {
  label: string
  value: string
  trend?: TrendInfo
}

export interface EmploymentQualityVM {
  metrics: KpiMetricVM[]
  trend: Array<{ term: string; rate: number }>
  distribution: Array<{ name: string; value: number }>
}

export type { NewsTag }

export interface NewsItemVM {
  id: string
  tag: NewsTag
  tagLabel: string
  title: string
  summary: string
  date: string
}

export interface KeyTaskVM {
  id: string
  name: string
  progress: number
  statusLabel: string
  statusClass: string
}

export interface UniversityDashboardVM {
  hub: SchoolHubVM
  collegeRanking: CollegeRankingItemVM[]
  rankingFormula: string
  employmentQuality: EmploymentQualityVM
  news: NewsItemVM[]
  keyTasks: KeyTaskVM[]
}
