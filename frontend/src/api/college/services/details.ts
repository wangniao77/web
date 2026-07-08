import { createService } from '@/api/createService'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptEmploymentDetail,
  adaptHighPotentialOverview,
  adaptKeyTasksDetail,
  adaptResearchPlatformsDetail,
  adaptTeachingCoursesDetail,
  adaptWarningDetail,
} from '@/api/college/adapters/details'
import {
  collegeDetailApi,
  type EmploymentRosterDTO,
  type RosterStudentDTO,
} from '@/api/college/details'
import {
  mockEmploymentDetail,
  mockKeyTasksDetail,
  mockResearchPlatformsDetail,
  mockTeachingCoursesDetail,
  mockWarningDetails,
} from '@/mock/college/details'
import { mockHighPotentialOverview } from '@/mock/college/high-potential'
import type { WarningCategoryType } from '@/types/college/api/high-potential'
import type { CollegeScope } from '@/types/common'

const fetchHighPotentialOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptHighPotentialOverview>
>({
  mock: () => adaptHighPotentialOverview(mockHighPotentialOverview),
  fetch: async (params) => {
    const res = await collegeDetailApi.getHighPotentialOverview(params)
    return adaptHighPotentialOverview(unwrapApiData(res))
  },
})

const fetchKeyTasksDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptKeyTasksDetail>
>({
  mock: () => adaptKeyTasksDetail(mockKeyTasksDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getKeyTasksDetail(params)
    return adaptKeyTasksDetail(unwrapApiData(res))
  },
})

const fetchTeachingCoursesDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeachingCoursesDetail>
>({
  mock: () => adaptTeachingCoursesDetail(mockTeachingCoursesDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getTeachingCoursesDetail(params)
    return adaptTeachingCoursesDetail(unwrapApiData(res))
  },
})

const fetchResearchPlatformsDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptResearchPlatformsDetail>
>({
  mock: () => adaptResearchPlatformsDetail(mockResearchPlatformsDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getResearchPlatformsDetail(params)
    return adaptResearchPlatformsDetail(unwrapApiData(res))
  },
})

const fetchEmploymentDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptEmploymentDetail>
>({
  mock: () => adaptEmploymentDetail(mockEmploymentDetail),
  fetch: async (params) => {
    const res = await collegeDetailApi.getEmploymentDetail(params)
    return adaptEmploymentDetail(unwrapApiData(res))
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
    try {
      const res = await collegeDetailApi.getWarningDetail(type, params)
      return adaptWarningDetail(unwrapApiData(res))
    } catch (error) {
      console.warn('[college] warning detail fetch failed, using mock', error)
      return adaptWarningDetail(mockWarningDetails[type])
    }
  },
  fetchTeachingCoursesDetail,
  fetchResearchPlatformsDetail,
  fetchEmploymentDetail,
  fetchHighPotentialRoster: async (
    params?: CollegeScope & { moduleId?: string },
  ): Promise<RosterStudentDTO[]> => {
    const res = await collegeDetailApi.getHighPotentialRoster(params)
    return unwrapApiData(res).students
  },
  fetchWarningRoster: async (
    type: WarningCategoryType,
    params?: CollegeScope,
  ): Promise<RosterStudentDTO[]> => {
    const res = await collegeDetailApi.getWarningRoster(type, params)
    return unwrapApiData(res).students
  },
  fetchEmploymentRoster: async (params?: CollegeScope): Promise<EmploymentRosterDTO[]> => {
    const res = await collegeDetailApi.getEmploymentRoster(params)
    return unwrapApiData(res).students
  },
}
