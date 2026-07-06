import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
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
    return adaptOverviewHub(res.data.data)
  },
})

const fetchKeyTasks = createService<CollegeScope | undefined, ReturnType<typeof adaptKeyTasks>>({
  mock: () => adaptKeyTasks(mockKeyTasks),
  fetch: async (params) => {
    const res = await collegeApi.getKeyTasks(params)
    return adaptKeyTasks(res.data.data)
  },
})

const fetchStudentOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptStudentOverview>
>({
  mock: () => adaptStudentOverview(mockStudentOverview),
  fetch: async (params) => {
    const res = await collegeApi.getStudentOverview(params)
    return adaptStudentOverview(res.data.data)
  },
})

const fetchTeachingOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptTeachingOverview>
>({
  mock: () => adaptTeachingOverview(mockTeachingOverview),
  fetch: async (params) => {
    const res = await collegeApi.getTeachingOverview(params)
    return adaptTeachingOverview(res.data.data)
  },
})

const fetchResearchOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptResearchOverview>
>({
  mock: () => adaptResearchOverview(mockResearchOverview),
  fetch: async (params) => {
    const res = await collegeApi.getResearchOverview(params)
    return adaptResearchOverview(res.data.data)
  },
})

const fetchWarningOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptWarningOverview>
>({
  mock: () => adaptWarningOverview(mockWarningOverview),
  fetch: async (params) => {
    const res = await collegeApi.getWarningOverview(params)
    return adaptWarningOverview(res.data.data)
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
