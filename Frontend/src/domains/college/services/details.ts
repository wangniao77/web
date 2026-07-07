import { createService } from '@/core/service/createService'
import {
  adaptEmploymentDetail,
  adaptHighPotentialOverview,
  adaptKeyTasksDetail,
  adaptResearchPlatformsDetail,
  adaptTeachingCoursesDetail,
  adaptWarningDetail,
} from '@/domains/college/adapters/details'
import { collegeDetailApi } from '@/domains/college/api/details'
import {
  mockEmploymentDetail,
  mockKeyTasksDetail,
  mockResearchPlatformsDetail,
  mockTeachingCoursesDetail,
  mockWarningDetails,
} from '@/domains/college/mock/details'
import { mockHighPotentialOverview } from '@/domains/college/mock/high-potential'
import type { WarningCategoryType } from '@/domains/college/types/api/high-potential'
import type { CollegeScope } from '@/core/types/common'

const fetchHighPotentialOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptHighPotentialOverview>
>({
  mock: () => adaptHighPotentialOverview(mockHighPotentialOverview),
  fetch: async (params) => {
    const res = await collegeDetailApi.getHighPotentialOverview(params)
    return adaptHighPotentialOverview(res.data.data)
  },
})

const fetchKeyTasksDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptKeyTasksDetail>
>({
  mock: () => adaptKeyTasksDetail(mockKeyTasksDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getKeyTasksDetail(params)
    return adaptKeyTasksDetail(res.data.data)
  },
})

const fetchTeachingCoursesDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeachingCoursesDetail>
>({
  mock: () => adaptTeachingCoursesDetail(mockTeachingCoursesDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getTeachingCoursesDetail(params)
    return adaptTeachingCoursesDetail(res.data.data)
  },
})

const fetchResearchPlatformsDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptResearchPlatformsDetail>
>({
  mock: () => adaptResearchPlatformsDetail(mockResearchPlatformsDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getResearchPlatformsDetail(params)
    return adaptResearchPlatformsDetail(res.data.data)
  },
})

const fetchEmploymentDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptEmploymentDetail>
>({
  mock: () => adaptEmploymentDetail(mockEmploymentDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getEmploymentDetail(params)
    return adaptEmploymentDetail(res.data.data)
  },
})

export const collegeDetailService = {
  fetchHighPotentialOverview,
  fetchKeyTasksDetail,
  fetchWarningDetail: async (type: WarningCategoryType, params?: CollegeScope) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      await new Promise((r) => setTimeout(r, 200))
      return adaptWarningDetail(mockWarningDetails[type])
    }
    const res = await collegeDetailApi.getWarningDetail(type, params)
    return adaptWarningDetail(res.data.data)
  },
  fetchTeachingCoursesDetail,
  fetchResearchPlatformsDetail,
  fetchEmploymentDetail,
}
