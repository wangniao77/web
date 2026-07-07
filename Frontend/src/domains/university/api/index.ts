import client from '@/core/api/client'
import type { UniversityOverviewDTO } from '@/domains/university/types/api'
import type {
  AcademicRiskDetailDTO,
  DisciplineDetailDTO,
  EmploymentDetailDTO,
  EventsDetailDTO,
  KeyTasksDetailDTO,
  MetricsDetailDTO,
  NewsDetailDTO,
  ResearchDetailDTO,
} from '@/domains/university/types/api/details'

export const universityApi = {
  getOverview: () => client.get<{ data: UniversityOverviewDTO }>('/university/overview'),
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
