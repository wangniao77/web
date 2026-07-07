import type { WarningCategoryType } from './high-potential'

export interface KeyTaskDetailDTO {
  id: string
  name: string
  progress: number
  status: 'ongoing' | 'completed' | 'delayed'
  leadDept: string
  deadline: string
  description: string
  milestones: Array<{ label: string; done: boolean }>
}

export interface KeyTasksDetailDTO {
  summary: {
    total: number
    completed: number
    ongoing: number
    delayed: number
  }
  tasks: KeyTaskDetailDTO[]
}

export interface WarningRecordDTO {
  name: string
  studentId: string
  major: string
  grade: string
  reason: string
  level: string
}

export interface WarningDetailDTO {
  type: WarningCategoryType
  label: string
  records: WarningRecordDTO[]
}

export interface TeachingCourseDetailDTO {
  name: string
  level: string
  leader: string
  hours: number
  students: number
  status: string
}

export interface TeachingCoursesDetailDTO {
  courses: TeachingCourseDetailDTO[]
}

export interface ResearchPlatformItemDTO {
  name: string
  level: string
  leader: string
  members: number
  foundedAt: string
}

export interface ResearchPlatformsDetailDTO {
  categories: Array<{
    category: string
    items: ResearchPlatformItemDTO[]
  }>
}

export interface EmploymentDetailDTO {
  overview: Array<{ label: string; value: string; unit?: string }>
  byDirection: Array<{ name: string; count: number; percent: number; note: string }>
  topEmployers: Array<{ name: string; industry: string; count: number; avgSalary: string }>
  byMajor: Array<{ major: string; rate: string; headcount: number; topDirection: string }>
}
