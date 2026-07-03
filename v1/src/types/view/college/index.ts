import type { TrendInfo } from '../../api/common'
import type { KpiKey } from '../../api/college'

export interface OverviewHubVM {
  developmentIndex: number
  maxScore: number
  starLevel: number
  kpis: Array<{
    key: KpiKey
    label: string
    value: string
    trend?: TrendInfo
  }>
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
