import {
  adaptEmploymentDetail,
  adaptHighPotentialOverview,
  adaptKeyTasksDetail,
  adaptResearchPlatformsDetail,
  adaptTeachingCoursesDetail,
  adaptWarningDetail,
} from '@/adapters/college/details'
import { collegeDetailApi } from '@/api/college/details'
import {
  mockEmploymentDetail,
  mockKeyTasksDetail,
  mockResearchPlatformsDetail,
  mockTeachingCoursesDetail,
  mockWarningDetails,
} from '@/mock/college/details'
import { mockHighPotentialOverview } from '@/mock/college/high-potential'
import type { WarningCategoryType } from '@/types/api/college/high-potential'
import type { CollegeScope } from '@/types/api/common'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

async function withMock<T>(mockData: T, fetcher: () => Promise<T>): Promise<T> {
  if (useMock) {
    await delay(200)
    return mockData
  }
  return fetcher()
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const collegeDetailService = {
  fetchHighPotentialOverview: (params?: CollegeScope) =>
    withMock(adaptHighPotentialOverview(mockHighPotentialOverview), async () => {
      const res = await collegeDetailApi.getHighPotentialOverview(params)
      return adaptHighPotentialOverview(res.data.data)
    }),

  fetchKeyTasksDetail: (params?: CollegeScope) =>
    withMock(adaptKeyTasksDetail(mockKeyTasksDetail), async () => {
      const res = await collegeDetailApi.getKeyTasksDetail(params)
      return adaptKeyTasksDetail(res.data.data)
    }),

  fetchWarningDetail: (type: WarningCategoryType, params?: CollegeScope) =>
    withMock(adaptWarningDetail(mockWarningDetails[type]), async () => {
      const res = await collegeDetailApi.getWarningDetail(type, params)
      return adaptWarningDetail(res.data.data)
    }),

  fetchTeachingCoursesDetail: (params?: CollegeScope) =>
    withMock(adaptTeachingCoursesDetail(mockTeachingCoursesDetail), async () => {
      const res = await collegeDetailApi.getTeachingCoursesDetail(params)
      return adaptTeachingCoursesDetail(res.data.data)
    }),

  fetchResearchPlatformsDetail: (params?: CollegeScope) =>
    withMock(adaptResearchPlatformsDetail(mockResearchPlatformsDetail), async () => {
      const res = await collegeDetailApi.getResearchPlatformsDetail(params)
      return adaptResearchPlatformsDetail(res.data.data)
    }),

  fetchEmploymentDetail: (params?: CollegeScope) =>
    withMock(adaptEmploymentDetail(mockEmploymentDetail), async () => {
      const res = await collegeDetailApi.getEmploymentDetail(params)
      return adaptEmploymentDetail(res.data.data)
    }),
}
