import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
} from '@/domains/college/types/api'
import type { CollegeScope } from '@/core/types/common'
import client from '@/core/api/client'

export const collegeApi = {
  getHub: (params?: CollegeScope) =>
    client.get<{ data: OverviewHubDTO }>('/college/overview/hub', { params }),
  getKeyTasks: (params?: CollegeScope) =>
    client.get<{ data: KeyTaskDTO[] }>('/college/tasks/annual-progress', { params }),
  getStudentOverview: (params?: CollegeScope) =>
    client.get<{ data: StudentOverviewDTO }>('/college/students/overview', { params }),
  getTeachingOverview: (params?: CollegeScope) =>
    client.get<{ data: TeachingOverviewDTO }>('/college/teaching/overview', { params }),
  getResearchOverview: (params?: CollegeScope) =>
    client.get<{ data: ResearchOverviewDTO }>('/college/research/overview', { params }),
  getWarningOverview: (params?: CollegeScope) =>
    client.get<{ data: WarningOverviewDTO }>('/college/warnings/overview', { params }),
}
