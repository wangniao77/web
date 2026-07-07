import { createService } from '@/core/service/createService'
import {
  adaptAcademicRiskDetail,
  adaptDisciplineDetail,
  adaptEmploymentDetail,
  adaptEventsDetail,
  adaptKeyTasksDetail,
  adaptMetricsDetail,
  adaptNewsDetail,
  adaptResearchDetail,
} from '@/domains/university/adapters'
import { universityDetailApi } from '@/domains/university/api'
import {
  mockAcademicRiskDetail,
  mockDisciplineDetail,
  mockEmploymentDetail,
  mockEventsDetail,
  mockKeyTasksDetail,
  mockMetricsDetail,
  mockNewsDetail,
  mockResearchDetail,
} from '@/domains/university/mock/details'
import type {
  AcademicRiskDetailVM,
  DisciplineDetailVM,
  EmploymentDetailVM,
  EventsDetailVM,
  KeyTasksDetailVM,
  MetricsDetailVM,
  NewsDetailVM,
  ResearchDetailVM,
} from '@/domains/university/types/view/details'

export const universityDetailService = {
  fetchKeyTasksDetail: createService<void, KeyTasksDetailVM>({
    mock: () => adaptKeyTasksDetail(mockKeyTasksDetail),
    fetch: async () => {
      const res = await universityDetailApi.getKeyTasksDetail()
      return adaptKeyTasksDetail(res.data.data)
    },
  }),

  fetchEmploymentDetail: createService<void, EmploymentDetailVM>({
    mock: () => adaptEmploymentDetail(mockEmploymentDetail),
    fetch: async () => {
      const res = await universityDetailApi.getEmploymentDetail()
      return adaptEmploymentDetail(res.data.data)
    },
  }),

  fetchNewsDetail: createService<void, NewsDetailVM>({
    mock: () => adaptNewsDetail(mockNewsDetail),
    fetch: async () => {
      const res = await universityDetailApi.getNewsDetail()
      return adaptNewsDetail(res.data.data)
    },
  }),

  fetchResearchDetail: createService<void, ResearchDetailVM>({
    mock: () => adaptResearchDetail(mockResearchDetail),
    fetch: async () => {
      const res = await universityDetailApi.getResearchDetail()
      return adaptResearchDetail(res.data.data)
    },
  }),

  fetchDisciplineDetail: createService<void, DisciplineDetailVM>({
    mock: () => adaptDisciplineDetail(mockDisciplineDetail),
    fetch: async () => {
      const res = await universityDetailApi.getDisciplineDetail()
      return adaptDisciplineDetail(res.data.data)
    },
  }),

  fetchEventsDetail: createService<void, EventsDetailVM>({
    mock: () => adaptEventsDetail(mockEventsDetail),
    fetch: async () => {
      const res = await universityDetailApi.getEventsDetail()
      return adaptEventsDetail(res.data.data)
    },
  }),

  fetchAcademicRiskDetail: createService<void, AcademicRiskDetailVM>({
    mock: () => adaptAcademicRiskDetail(mockAcademicRiskDetail),
    fetch: async () => {
      const res = await universityDetailApi.getAcademicRiskDetail()
      return adaptAcademicRiskDetail(res.data.data)
    },
  }),

  fetchMetricsDetail: createService<void, MetricsDetailVM>({
    mock: () => adaptMetricsDetail(mockMetricsDetail),
    fetch: async () => {
      const res = await universityDetailApi.getMetricsDetail()
      return adaptMetricsDetail(res.data.data)
    },
  }),
}
