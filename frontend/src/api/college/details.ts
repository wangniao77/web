import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/types/college/api/details'
import type { HighPotentialOverviewDTO } from '@/types/college/api/high-potential'
import type { WarningCategoryType } from '@/types/college/api/high-potential'
import type { CollegeScope } from '@/types/common'
import client from '@/api/client'

export const collegeDetailApi = {
  getHighPotentialOverview: (params?: CollegeScope) =>
    client.get<{ data: HighPotentialOverviewDTO }>('/college/high-potential/overview', { params }),

  getKeyTasksDetail: (params?: CollegeScope) =>
    client.get<{ data: KeyTasksDetailDTO }>('/college/tasks/detail', { params }),

  getWarningDetail: (type: WarningCategoryType, params?: CollegeScope) =>
    client.get<{ data: WarningDetailDTO }>(`/college/warnings/${type}`, { params }),

  getTeachingCoursesDetail: (params?: CollegeScope) =>
    client.get<{ data: TeachingCoursesDetailDTO }>('/college/teaching/courses', { params }),

  getResearchPlatformsDetail: (params?: CollegeScope) =>
    client.get<{ data: ResearchPlatformsDetailDTO }>('/college/research/platforms', { params }),

  getEmploymentDetail: (params?: CollegeScope) =>
    client.get<{ data: EmploymentDetailDTO }>('/college/students/employment-detail', { params }),
}
