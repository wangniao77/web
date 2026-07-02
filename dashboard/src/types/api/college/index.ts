import type { TrendInfo } from '../common'

export type KpiKey =
  | 'students'
  | 'faculty'
  | 'funding'
  | 'ranking'
  | 'satisfaction'
  | 'influence'

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
  status: 'ongoing' | 'completed' | 'delayed'
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

export interface WarningOverviewDTO {
  categories: Array<{
    type: 'academic' | 'psychological' | 'employment' | 'funding'
    label: string
    count: number
    momChange: number
  }>
  trend: {
    months: string[]
    series: Array<{ name: string; data: number[] }>
  }
}

export interface EvaluationOverviewDTO {
  developmentIndex: number
  dimensions: Array<{ name: string; score: number }>
  suggestions: string[]
}
