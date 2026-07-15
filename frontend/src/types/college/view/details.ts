import type { HighPotentialModuleId, WarningCategoryType } from '@/types/college/api/high-potential'

export interface KeyTaskDetailVM {
  id: string
  name: string
  progress: number
  statusLabel: string
  statusClass: string
  leadDept: string
  deadline: string
  description: string
  milestones: Array<{ label: string; done: boolean }>
}

export interface KeyTasksDetailVM {
  summary: {
    total: number
    completed: number
    ongoing: number
    delayed: number
  }
  tasks: KeyTaskDetailVM[]
}

export interface WarningRecordVM {
  name: string
  studentId: string
  major: string
  grade: string
  reason: string
  level: string
}

export interface WarningDetailVM {
  type: WarningCategoryType
  label: string
  records: WarningRecordVM[]
}

export interface TeachingCourseDetailVM {
  name: string
  level: string
  leader: string
  hours: number
  students: number
  status: string
}

export interface TeachingCoursesDetailVM {
  courses: TeachingCourseDetailVM[]
}

export interface ResearchPlatformItemVM {
  name: string
  level: string
  leader: string
  members: number
  foundedAt: string
}

export interface ResearchPlatformsDetailVM {
  categories: Array<{
    category: string
    items: ResearchPlatformItemVM[]
  }>
}

export interface EmploymentDetailVM {
  overview: Array<{ label: string; value: string; unit?: string }>
  byDirection: Array<{ name: string; count: number; percent: number; note: string }>
  topEmployers: Array<{ name: string; industry: string; count: number; avgSalary: string }>
  byMajor: Array<{ major: string; rate: string; headcount: number; topDirection: string }>
}

export interface HighPotentialModuleVM {
  id: HighPotentialModuleId
  title: string
  desc: string
  cardMetric: { label: string; value: string; unit?: string }
  tags?: string[]
  stats?: Array<{ label: string; value: string; unit?: string }>
  highlights?: Array<{ label: string; value: string; unit?: string }>
  timeline?: Array<{ date: string; title: string; level: string }>
  aiRecommend?: string[]
  events?: string[]
}

export interface HighPotentialOverviewVM {
  summary: {
    total: number
    change: string
    coverage: string
    activeRate: string
    trend: { months: string[]; counts: number[] }
    kpis: Array<{ label: string; value: string; unit?: string }>
  }
  modules: HighPotentialModuleVM[]
}

export type { HighPotentialModuleId, WarningCategoryType }
