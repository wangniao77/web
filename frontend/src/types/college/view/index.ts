import type { TrendInfo } from '@/types/common'
import type { KpiKey } from '@/types/college/api'
import type { IconKind } from '@/components/college/DashIcon.vue'

export type CoreOrbitPosition = 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'

export interface OverviewHubKpiVM {
  key?: KpiKey
  label: string
  value: string
  trend?: TrendInfo
  icon?: IconKind
  position?: CoreOrbitPosition
}

export interface OverviewHubVM {
  developmentIndex: number
  maxScore: number
  starLevel: number
  kpis: OverviewHubKpiVM[]
}

export interface KeyTaskVM {
  id: string
  name: string
  progress: number
  statusLabel: string
  statusClass: string
}

export interface StudentOverviewVM {
  metrics: Array<{ label: string; value: string; trend?: TrendInfo }>
  employmentDirection: Array<{ name: string; value: number }>
  employmentRegions: Array<{ name: string; value: number }>
  qualityDevelopment: Array<{ name: string; value: number }>
  warnings: { academic: number; fundingRate: string }
}

export interface TeachingOverviewVM {
  metrics: Array<{ label: string; value: string }>
  evaluationTrend: { years: string[]; values: number[] }
  courseConstruction: Array<{ name: string; value: number }>
}

export interface ResearchOverviewVM {
  metrics: Array<{ label: string; value: string; trend?: TrendInfo }>
  fundingTrend: {
    years: string[]
    series: Array<{ name: string; data: number[] }>
  }
  platforms: Array<{ name: string; count: number }>
}

export interface WarningOverviewVM {
  categories: Array<{
    label: string
    count: number
    momChange: number
    type: string
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
