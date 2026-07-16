import type {
  FacultyHealthDTO,
  FacultyMetricDTO,
  TeacherAnalyticsDetailDTO,
  TeacherAnalyticsDTO,
} from '@/types/college/api/teacher-analytics'

export type FacultyHealthVM = FacultyHealthDTO
export type FacultyMetricVM = FacultyMetricDTO

export interface TeacherAnalyticsVM {
  health: FacultyHealthVM
  metrics: FacultyMetricVM[]
  insights: string[]
  summary: TeacherAnalyticsDTO['summary']
  titleStructure: TeacherAnalyticsDTO['titleStructure']
  profile: TeacherAnalyticsDTO['profile']
  groups: TeacherAnalyticsDTO['groups']
  highlights: TeacherAnalyticsDTO['highlights']
}

export interface TeacherAnalyticsDetailVM {
  health: FacultyHealthVM
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
  excellentSamples: TeacherAnalyticsDetailDTO['excellentSamples']
}
