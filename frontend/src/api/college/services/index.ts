import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptKeyTasks,
  adaptOverviewHub,
  adaptResearchOverview,
  adaptStudentOverview,
  adaptTeachingOverview,
  adaptWarningOverview,
} from '@/api/college/adapters'
import {
  mockKeyTasks,
  mockOverviewHub,
  mockResearchOverview,
  mockStudentOverview,
  mockTeachingOverview,
  mockWarningOverview,
} from '@/mock/college/data'
import type { CollegeScope } from '@/types/common'

const fetchOverviewHub = createService<CollegeScope | undefined, ReturnType<typeof adaptOverviewHub>>({
  mock: () => adaptOverviewHub(mockOverviewHub),
  fetch: async (params) => {
    const res = await collegeApi.getHub(params)
    return adaptOverviewHub(unwrapApiData(res))
  },
})

const fetchKeyTasks = createService<CollegeScope | undefined, ReturnType<typeof adaptKeyTasks>>({
  mock: () => adaptKeyTasks(mockKeyTasks),
  fetch: async (params) => {
    const res = await collegeApi.getKeyTasks(params)
    return adaptKeyTasks(unwrapApiData(res))
  },
})

const fetchStudentOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptStudentOverview>
>({
  mock: () => adaptStudentOverview(mockStudentOverview),
  fetch: async (params) => {
    const res = await collegeApi.getStudentOverview(params)
    return adaptStudentOverview(unwrapApiData(res))
  },
})

const fetchTeachingOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeachingOverview>
>({
  mock: () => adaptTeachingOverview(mockTeachingOverview),
  fetch: async (params) => {
    const res = await collegeApi.getTeachingOverview(params)
    return adaptTeachingOverview(unwrapApiData(res))
  },
})

const fetchResearchOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptResearchOverview>
>({
  mock: () => adaptResearchOverview(mockResearchOverview),
  fetch: async (params) => {
    const res = await collegeApi.getResearchOverview(params)
    return adaptResearchOverview(unwrapApiData(res))
  },
})

const fetchWarningOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptWarningOverview>
>({
  mock: () => adaptWarningOverview(mockWarningOverview),
  fetch: async (params) => {
    const res = await collegeApi.getWarningOverview(params)
    return adaptWarningOverview(unwrapApiData(res))
  },
})

export const collegeService = {
  fetchOverviewHub: fetchOverviewHub,
  fetchKeyTasks: fetchKeyTasks,
  fetchStudentOverview: fetchStudentOverview,
  fetchTeachingOverview: fetchTeachingOverview,
  fetchResearchOverview: fetchResearchOverview,
  fetchWarningOverview: fetchWarningOverview,
}
