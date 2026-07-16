import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
} from '@/types/college/api'
import type { CollegeScope } from '@/types/common'
import type { ApiResponse } from '@/types/common'
import client from '@/api/client'

export const collegeApi = {
  getHub: (params?: CollegeScope) =>
    client.get<ApiResponse<OverviewHubDTO>>('/college/overview/hub', { params }),
  getKeyTasks: (params?: CollegeScope) =>
    client.get<ApiResponse<KeyTaskDTO[]>>('/college/tasks/annual-progress', { params }),
  getStudentOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<StudentOverviewDTO>>('/college/students/overview', { params }),
  getTeachingOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<TeachingOverviewDTO>>('/college/teaching/overview', { params }),
  getResearchOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<ResearchOverviewDTO>>('/college/research/overview', { params }),
  getWarningOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<WarningOverviewDTO>>('/college/warnings/overview', { params }),
}
