import type { TrendInfo } from '@/types/common'

export interface TeacherAnalyticsDTO {
  summary: {
    /** 专任教师 */
    totalTeachers: number
    phdRatio: number
    /** 高级职称占比 */
    seniorTitleRatio: number
    /** 平均学年课时 */
    avgTeachingHours: number
    /** 教师标兵 */
    modelTeacherCount: number
    warningCount: number
    publicService: {
      count: number
      hours: number
    }
    /** 兼容旧字段 */
    excellentCount: number
  }
  titleStructure: Array<{ title: string; count: number }>
  profile: {
    teaching: number
    research: number
    socialService: number
  }
  groups: {
    excellent: { count: number; ratio: number; momChange: number }
    warning: { count: number; ratio: number; momChange: number }
  }
  highlights: Array<{ label: string; value: string }>
}

export interface TeacherAnalyticsDetailDTO extends TeacherAnalyticsDTO {
  structure: {
    age: Array<{ label: string; count: number; ratio: number }>
    education: Array<{ label: string; count: number; ratio: number }>
    title: Array<{ label: string; count: number; ratio: number }>
    academicOrigin: Array<{ label: string; count: number; ratio: number }>
  }
  teachingHoursDetail: Array<{
    name: string
    title: string
    major: string
    hours: number
  }>
  modelTeachers: Array<{
    name: string
    title: string
    major: string
    year: string
    highlight: string
  }>
  warningSamples: Array<{
    name: string
    title: string
    major: string
    reason: string
    type: string
    status: string
  }>
  publicServiceAnalysis: {
    byTeacher: Array<{ name: string; count: number; hours: number }>
    byType: Array<{ type: string; count: number; hours: number }>
    byMonth: Array<{ month: string; count: number; hours: number }>
  }
  assessmentIndicators: Array<{
    key: string
    label: string
    score: number
    unit?: string
    trend?: TrendInfo
  }>
  majorComparison: Array<{ major: string; phdRatio: number; excellentCount: number }>
  excellentSamples: Array<{ name: string; title: string; major: string }>
}
