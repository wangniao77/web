import client from '@/core/api/client'
import type { UniversityOverviewDTO } from '@/domains/university/types/api'
import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  NewsDetailDTO,
} from '@/domains/university/types/api/details'

export const universityApi = {
  getOverview: () => client.get<{ data: UniversityOverviewDTO }>('/university/overview'),
}

export const universityDetailApi = {
  getKeyTasksDetail: () =>
    client.get<{ data: KeyTasksDetailDTO }>('/university/key-tasks/detail'),
  getEmploymentDetail: () =>
    client.get<{ data: EmploymentDetailDTO }>('/university/employment/detail'),
  getNewsDetail: () => client.get<{ data: NewsDetailDTO }>('/university/news/detail'),
}
