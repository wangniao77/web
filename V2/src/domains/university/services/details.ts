import { createService } from '@/core/service/createService'
import {
  adaptEmploymentDetail,
  adaptKeyTasksDetail,
  adaptNewsDetail,
} from '@/domains/university/adapters'
import { universityDetailApi } from '@/domains/university/api'
import {
  mockEmploymentDetail,
  mockKeyTasksDetail,
  mockNewsDetail,
} from '@/domains/university/mock/details'
import type {
  EmploymentDetailVM,
  KeyTasksDetailVM,
  NewsDetailVM,
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
}
