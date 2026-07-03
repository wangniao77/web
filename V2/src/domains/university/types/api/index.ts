import type { TrendInfo } from '@/core/types/common'
import type { RiskLevel } from '@/domains/university/constants/risk'

export type KeyTaskStatus = 'ongoing' | 'completed' | 'attention' | 'overdue'

export type EventCategory =
  | 'teaching'
  | 'research'
  | 'talent'
  | 'service'
  | 'international'
  | 'safety'

export type EventStatus = 'completed' | 'ongoing' | 'planned'

export interface DashboardMetaDTO {
  dataUpdatedAt: string
  dataScope: string
  academicYear: string
  semester: string
}

export interface GoalDimensionDTO {
  key: string
  label: string
  completion: number
  trend?: TrendInfo
  riskLevel: RiskLevel
}

export interface GoalOverviewDTO {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  riskTasks: number
  overdueTasks: number
  monthlyCompleted: number
  completionRate: number
  plannedProgress: number
  progressGap: number
  formula: string
  dimensions: GoalDimensionDTO[]
}

export interface ResearchSummaryDTO {
  nationalProjects: number
  provincialProjects: number
  highLevelPapers: number
  researchAwards: number
  researchFunding: number
  keyPlatforms: number
  phdSupportRate: number
  phdHasGap: boolean
  phdGapHint?: string
  topContributors: Array<{ name: string; value: number }>
  fundingTrend: Array<{ year: string; value: number }>
}

export interface KeyTaskDTO {
  id: string
  name: string
  progress: number
  status: KeyTaskStatus
  plannedNode: string
  riskLevel: RiskLevel
}

export interface DisciplineChangeDTO {
  name: string
  currentRank: number
  previousRank: number
  change: number
}

export interface DisciplineSummaryDTO {
  risingCount: number
  stableCount: number
  fallingCount: number
  focusCount: number
  topRisers: DisciplineChangeDTO[]
  topFallers: DisciplineChangeDTO[]
  yearlyTrend: Array<{ year: string; avgRank: number }>
  competitiveness: {
    categories: string[]
    rising: number[]
    stable: number[]
    falling: number[]
  }
}

export interface EmploymentSummaryDTO {
  placementRate: number
  provinceRank: number
  provinceRankChange: number
  furtherStudyRate: number
  highQualityRate: number
  keyEnterpriseCount: number
  publicSectorCount: number
  topUniversityCount: number
  highSalaryCount: number
  salaryCoverage: number
  trend: Array<{ year: string; rate: number }>
  destinationStructure: Array<{ name: string; value: number }>
  industryShare: Array<{ name: string; value: number }>
}

export interface SchoolEventDTO {
  id: string
  category: EventCategory
  title: string
  date: string
  status: EventStatus
  needsAttention: boolean
}

export interface AcademicRiskSummaryDTO {
  expectedDelayCount: number
  delayRateChange: number
  warningCount: number
  intervenedCount: number
  riskResolvedRate: number
  highRiskCollegeCount: number
}

export interface UniversityOverviewDTO {
  meta: DashboardMetaDTO
  goalOverview: GoalOverviewDTO
  research: ResearchSummaryDTO
  keyTasks: KeyTaskDTO[]
  disciplines: DisciplineSummaryDTO
  employment: EmploymentSummaryDTO
  events: SchoolEventDTO[]
  academicRisk: AcademicRiskSummaryDTO
}
