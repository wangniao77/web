import type {
  FacultyHealthDTO,
  FacultyMetricDTO,
  FacultySupportIndexDTO,
  FacultyWarningSummaryDTO,
  TeacherAnalyticsDetailDTO,
  TeacherAnalyticsDTO,
} from '@/types/college/api/teacher-analytics'

export type FacultyHealthVM = FacultyHealthDTO
export type FacultyMetricVM = FacultyMetricDTO
export type FacultySupportIndexVM = FacultySupportIndexDTO
export type FacultyWarningSummaryVM = FacultyWarningSummaryDTO

export interface TeacherAnalyticsVM {
  term: string
  requestedTerm?: string
  termFallback?: boolean
  availableTerms: string[]
  standardHours: number
  overloadHours: number
  health: FacultyHealthVM
  supportIndex: FacultySupportIndexVM
  warningSummary?: FacultyWarningSummaryVM
  metrics: FacultyMetricVM[]
  insights: string[]
  summary: TeacherAnalyticsDTO['summary']
  titleStructure: TeacherAnalyticsDTO['titleStructure']
  profile: TeacherAnalyticsDTO['profile']
  groups: TeacherAnalyticsDTO['groups']
  highlights: TeacherAnalyticsDTO['highlights']
}

export interface TeacherAnalyticsDetailVM {
  term: string
  requestedTerm?: string
  termFallback?: boolean
  availableTerms: string[]
  standardHours: number
  overloadHours: number
  health: FacultyHealthVM
  supportIndex: FacultySupportIndexVM
  warningSummary?: FacultyWarningSummaryVM
  metrics: FacultyMetricVM[]
  insights: string[]
  summary: TeacherAnalyticsDTO['summary']
  titleStructure: TeacherAnalyticsDTO['titleStructure']
  profile: TeacherAnalyticsDTO['profile']
  groups: TeacherAnalyticsDTO['groups']
  highlights: TeacherAnalyticsDTO['highlights']
  structure: TeacherAnalyticsDetailDTO['structure']
  teachingHoursDetail: TeacherAnalyticsDetailDTO['teachingHoursDetail']
  modelTeachers: TeacherAnalyticsDetailDTO['modelTeachers']
  warningSamples: TeacherAnalyticsDetailDTO['warningSamples']
  publicServiceAnalysis: TeacherAnalyticsDetailDTO['publicServiceAnalysis']
  assessmentIndicators: TeacherAnalyticsDetailDTO['assessmentIndicators']
  majorComparison: TeacherAnalyticsDetailDTO['majorComparison']
  filters?: TeacherAnalyticsDetailDTO['filters']
  excellentSamples: TeacherAnalyticsDetailDTO['excellentSamples']
  teachingInvestment: TeacherAnalyticsDetailDTO['teachingInvestment']
  capacityBuilding: TeacherAnalyticsDetailDTO['capacityBuilding']
  performanceAnalysis: TeacherAnalyticsDetailDTO['performanceAnalysis']
  warningCenter: TeacherAnalyticsDetailDTO['warningCenter']
}
