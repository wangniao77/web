import type { TrendInfo } from '@/core/types/common'
import type { RiskLevel } from '@/domains/university/constants/risk'
import type { EventCategory, EventStatus } from '@/domains/university/types/api'

export interface DashboardMetaVM {
  dataUpdatedAt: string
  dataScope: string
  academicYear: string
  semester: string
}

export interface GoalDimensionVM {
  key: string
  label: string
  completion: number
  completionLabel: string
  trend?: TrendInfo
  trendLabel?: string
  riskLevel: RiskLevel
  riskLabel: string
  riskClass: string
}

export interface GoalOverviewVM {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  riskTasks: number
  overdueTasks: number
  monthlyCompleted: number
  completionRate: number
  plannedProgress: number
  progressGap: number
  progressGapLabel: string
  formula: string
  dimensions: GoalDimensionVM[]
}

export interface ResearchMetricVM {
  label: string
  value: string
  unit?: string
}

export interface ResearchSummaryVM {
  metrics: ResearchMetricVM[]
  phdSupportRate: number
  phdSupportLabel: string
  phdHasGap: boolean
  phdGapHint?: string
  topContributors: Array<{ name: string; value: string }>
  fundingTrend: Array<{ year: string; value: number }>
}

export interface KeyTaskVM {
  id: string
  name: string
  progress: number
  plannedNode: string
  statusLabel: string
  statusClass: string
  riskLevel: RiskLevel
  riskLabel: string
  riskClass: string
}

export interface DisciplineChangeVM {
  name: string
  currentRank: number
  change: number
  changeLabel: string
}

export interface DisciplineSummaryVM {
  risingCount: number
  stableCount: number
  fallingCount: number
  focusCount: number
  topRisers: DisciplineChangeVM[]
  topFallers: DisciplineChangeVM[]
  yearlyTrend: Array<{ year: string; avgRank: number }>
  terrainCategories: string[]
  terrainLayers: Array<{ name: string; data: number[]; color: string }>
}

export interface EmploymentMetricVM {
  label: string
  value: string
  hint?: string
  unit?: string
  trend?: TrendInfo
  trendLabel?: string
}

export interface EmploymentSummaryVM {
  metrics: EmploymentMetricVM[]
  trend: Array<{ year: string; rate: number }>
  destinationStructure: Array<{ name: string; value: number }>
  industryShare: Array<{ name: string; value: number }>
}

export interface SchoolEventVM {
  id: string
  category: EventCategory
  categoryLabel: string
  title: string
  date: string
  status: EventStatus
  statusLabel: string
  needsAttention: boolean
}

export interface AcademicRiskSummaryVM {
  expectedDelayCount: number
  delayRateChange: number
  delayRateChangeLabel: string
  warningCount: number
  intervenedCount: number
  riskResolvedRate: number
  riskResolvedLabel: string
  highRiskCollegeCount: number
}

export interface UniversityDashboardVM {
  meta: DashboardMetaVM
  goalOverview: GoalOverviewVM
  research: ResearchSummaryVM
  keyTasks: KeyTaskVM[]
  disciplines: DisciplineSummaryVM
  employment: EmploymentSummaryVM
  events: SchoolEventVM[]
  academicRisk: AcademicRiskSummaryVM
}
