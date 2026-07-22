import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/types/college/api/details'
import type {
  HighPotentialModuleId,
  HighPotentialOverviewDTO,
  WarningCategoryType,
} from '@/types/college/api/high-potential'
import type { CollegeScope } from '@/types/common'
import type { ApiResponse } from '@/types/common'
import client from '@/api/client'

export interface RosterStudentDTO {
  id: string
  name: string
  gender: string
  studentId: string
  className: string
  major: string
  grade: string
  counselor: string
  dorm: string
  gpa: number
  political: string
  phone: string
  hp: HighPotentialModuleId[]
  warnings: WarningCategoryType[]
  highlight: string
  warnReason?: string
  warnLevel?: string
}

export interface EmploymentRosterDTO {
  id: string
  name: string
  gender: string
  studentId: string
  className: string
  major: string
  counselor: string
  direction: string
  region: string
  unit: string
  position: string
  salary: string
}

export const collegeDetailApi = {
  getHighPotentialOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<HighPotentialOverviewDTO>>('/college/high-potential/overview', { params }),

  getKeyTasksDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<KeyTasksDetailDTO>>('/college/tasks/detail', { params }),

  getWarningDetail: (type: WarningCategoryType, params?: CollegeScope) =>
    client.get<ApiResponse<WarningDetailDTO>>(`/college/warnings/${type}`, { params }),

  getTeachingCoursesDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<TeachingCoursesDetailDTO>>('/college/teaching/courses', { params }),

  getResearchPlatformsDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<ResearchPlatformsDetailDTO>>('/college/research/platforms', { params }),

  getEmploymentDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<EmploymentDetailDTO>>('/college/students/employment-detail', { params }),

  getHighPotentialRoster: (params?: CollegeScope & { moduleId?: string }) =>
    client.get<ApiResponse<{ total: number; students: RosterStudentDTO[] }>>(
      '/college/high-potential/roster',
      { params },
    ),

  getWarningRoster: (type: WarningCategoryType, params?: CollegeScope) =>
    client.get<ApiResponse<{ total: number; students: RosterStudentDTO[] }>>(
      `/college/warnings/${type}/roster`,
      { params },
    ),

  getEmploymentRoster: (params?: CollegeScope) =>
    client.get<ApiResponse<{ total: number; students: EmploymentRosterDTO[] }>>(
      '/college/students/employment-roster',
      { params },
    ),

  getStudentEvaluationDetail: (
    key: string,
    params?: CollegeScope,
  ) =>
    client.get<ApiResponse<import('@/types/college/api/student-dev-quality').StudentEvaluationDetailDTO>>(
      `/college/students/evaluation/${key}`,
      { params },
    ),
}
