import type { TrendInfo } from '@/types/common'
import type { UniversityModulesDTO } from '@/types/university/api/modules'
import type { RiskLevel } from '@/constants/university/risk'

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
  statsPeriod?: string
  schoolScope?: string
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
  booksPatents?: number
  thinkTankOutputs?: number
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
  department?: string
  currentIssue?: string
  nextAction?: string
  rectifyDeadline?: string
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
  keyDisciplines?: number
  phdPoints?: number
  masterPoints?: number
  firstClassMajors?: number
  structureOptimization?: string
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
  majorMatchRate?: number
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
  progressNote?: string
  nextStep?: string
  isAchievement?: boolean
}

export interface SchoolPostureDTO {
  enrolledStudents: number
  collegeCount: number
  majorCount: number
  disciplineCount: number
  facultyCount: number
  researchPlatforms: number
  enrollment: number
  graduation: number
  developmentIndex: number
}

export interface BenchmarkSummaryDTO {
  nationalRank: number
  provincialRank: number
  financeRank: number
  gapVsPeers: Array<{ name: string; gap: number }>
  attribution: Array<{ factor: string; impact: string }>
}

export interface TeachingSummaryDTO {
  admissionQuality: number
  courseCount: number
  teachingEval: number
  academicDev: number
  gradRate: number
  degreeRate: number
}

export interface FacultySummaryDTO {
  total: number
  fullTime: number
  highLevelTalent: number
  phdRatio: number
  professorRatio: number
  youngFaculty: number
}

export interface RiskWarningSummaryDTO {
  academic: number
  employment: number
  taskOverdue: number
  indicatorMiss: number
  fundingSlow: number
  crossDept: Array<{ title: string; dept: string }>
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
  modules?: UniversityModulesDTO
  schoolPosture?: SchoolPostureDTO
  goalOverview: GoalOverviewDTO
  benchmark?: BenchmarkSummaryDTO
  research: ResearchSummaryDTO
  keyTasks: KeyTaskDTO[]
  disciplines: DisciplineSummaryDTO
  teaching?: TeachingSummaryDTO
  employment: EmploymentSummaryDTO
  faculty?: FacultySummaryDTO
  riskWarning?: RiskWarningSummaryDTO
  events: SchoolEventDTO[]
  academicRisk: AcademicRiskSummaryDTO
}
