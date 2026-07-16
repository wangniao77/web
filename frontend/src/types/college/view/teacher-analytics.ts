import type { TeacherAnalyticsDetailDTO, TeacherAnalyticsDTO } from '@/types/college/api/teacher-analytics'

export interface TeacherAnalyticsVM {
  summary: TeacherAnalyticsDTO['summary']
  titleStructure: TeacherAnalyticsDTO['titleStructure']
  profile: TeacherAnalyticsDTO['profile']
  groups: TeacherAnalyticsDTO['groups']
  highlights: TeacherAnalyticsDTO['highlights']
}

export interface TeacherAnalyticsDetailVM {
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
  teachingInvestment: TeacherAnalyticsDetailDTO['teachingInvestment']
  capacityBuilding: TeacherAnalyticsDetailDTO['capacityBuilding']
  performanceAnalysis: TeacherAnalyticsDetailDTO['performanceAnalysis']
  warningCenter: TeacherAnalyticsDetailDTO['warningCenter']
}
