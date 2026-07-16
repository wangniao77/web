import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptTeacherAnalytics,
  adaptTeacherAnalyticsDetail,
} from '@/api/college/adapters/teacher-analytics'
import {
  mockTeacherAnalytics,
  mockTeacherAnalyticsDetail,
} from '@/mock/college/teacher-analytics'
import type { CollegeScope } from '@/types/common'

const fetchTeacherAnalytics = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeacherAnalytics>
>({
  mock: () => adaptTeacherAnalytics(mockTeacherAnalytics),
  fetch: async (params) => {
    const res = await collegeApi.getTeacherAnalytics(params)
    return adaptTeacherAnalytics(unwrapApiData(res))
  },
})

const fetchTeacherDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeacherAnalyticsDetail>
>({
  mock: () => adaptTeacherAnalyticsDetail(mockTeacherAnalyticsDetail),
  fetch: async (params) => {
    const res = await collegeApi.getTeacherAnalyticsDetail(params)
    return adaptTeacherAnalyticsDetail(unwrapApiData(res))
  },
})

export const teacherService = {
  fetchTeacherAnalytics,
  fetchTeacherDetail,
}
