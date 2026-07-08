import type { TrendInfo } from '@/types/common'
import type { UniversityModulesVM } from '@/types/university/view/modules'

export type { UniversityModulesVM } from '@/types/university/view/modules'
import type { RiskLevel } from '@/constants/university/risk'
import type { EventCategory, EventStatus } from '@/types/university/api'

export interface DashboardMetaVM {
  dataUpdatedAt: string
  dataScope: string
  academicYear: string
  semester: string
  statsPeriod?: string
  schoolScope?: string
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
  department?: string
  currentIssue?: string
  nextAction?: string
  rectifyDeadline?: string
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
  keyDisciplines?: number
  phdPoints?: number
  masterPoints?: number
  firstClassMajors?: number
  structureOptimization?: string
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
  progressNote?: string
  nextStep?: string
  isAchievement?: boolean
}

export interface SchoolPostureVM {
  enrolledStudents: number
  enrolledStudentsLabel: string
  collegeCount: number
  majorCount: number
  disciplineCount: number
  facultyCount: number
  researchPlatforms: number
  enrollment: number
  graduation: number
  developmentIndex: number
  developmentIndexLabel: string
  metrics: Array<{ label: string; value: string; unit?: string }>
}

export interface BenchmarkSummaryVM {
  nationalRank: number
  provincialRank: number
  financeRank: number
  gapVsPeers: Array<{ name: string; gap: number; gapLabel: string }>
  attribution: Array<{ factor: string; impact: string }>
}

export interface TeachingSummaryVM {
  metrics: Array<{ label: string; value: string; unit?: string }>
  admissionQuality: number
  courseCount: number
  teachingEval: number
  academicDev: number
  gradRate: number
  degreeRate: number
}

export interface FacultySummaryVM {
  metrics: Array<{ label: string; value: string; unit?: string }>
  total: number
  fullTime: number
  highLevelTalent: number
  phdRatio: number
  professorRatio: number
  youngFaculty: number
}

export interface RiskWarningSummaryVM {
  academic: number
  employment: number
  taskOverdue: number
  indicatorMiss: number
  fundingSlow: number
  crossDept: Array<{ title: string; dept: string }>
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
  modules: UniversityModulesVM
  // legacy fields kept for detail services compatibility
  schoolPosture: SchoolPostureVM
  goalOverview: GoalOverviewVM
  benchmark: BenchmarkSummaryVM
  research: ResearchSummaryVM
  keyTasks: KeyTaskVM[]
  disciplines: DisciplineSummaryVM
  teaching: TeachingSummaryVM
  employment: EmploymentSummaryVM
  faculty: FacultySummaryVM
  riskWarning: RiskWarningSummaryVM
  events: SchoolEventVM[]
  academicRisk: AcademicRiskSummaryVM
}
