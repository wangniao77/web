import client from '@/api/client'
import type { UniversityScope } from '@/types/common'
import type { UniversityOverviewDTO } from '@/types/university/api'
import type {
  AcademicRiskDetailDTO,
  DisciplineDetailDTO,
  EmploymentDetailDTO,
  EventsDetailDTO,
  KeyTasksDetailDTO,
  MetricsDetailDTO,
  NewsDetailDTO,
  ResearchDetailDTO,
} from '@/types/university/api/details'

export const universityApi = {
  getOverview: (scope?: UniversityScope) =>
    client.get<{ data: UniversityOverviewDTO }>('/university/overview', { params: scope }),
}

export const universityDetailApi = {
  getKeyTasksDetail: () =>
    client.get<{ data: KeyTasksDetailDTO }>('/university/tasks/detail'),
  getEmploymentDetail: () =>
    client.get<{ data: EmploymentDetailDTO }>('/university/employment/detail'),
  getNewsDetail: () =>
    client.get<{ data: NewsDetailDTO }>('/university/events/detail'),
  getResearchDetail: () =>
    client.get<{ data: ResearchDetailDTO }>('/university/research/detail'),
  getDisciplineDetail: () =>
    client.get<{ data: DisciplineDetailDTO }>('/university/disciplines/detail'),
  getEventsDetail: () =>
    client.get<{ data: EventsDetailDTO }>('/university/events/detail'),
  getAcademicRiskDetail: () =>
    client.get<{ data: AcademicRiskDetailDTO }>('/university/academic-risk/detail'),
  getMetricsDetail: () =>
    client.get<{ data: MetricsDetailDTO }>('/university/metrics/detail'),
}
