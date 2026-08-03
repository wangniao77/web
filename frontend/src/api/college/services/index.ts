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
import { mockKeyPlanProgress } from '@/mock/college/key-plan-progress'
import type { CollegeScope } from '@/types/common'
import type { KeyPlanProgressData } from '@/mock/college/key-plan-progress'

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

const fetchKeyPlanProgress = createService<CollegeScope | undefined, KeyPlanProgressData>({
  mock: () => cloneKeyPlan(mockKeyPlanProgress),
  fetch: async (params) => {
    try {
      const res = await collegeApi.getKeyPlanProgress(params)
      return unwrapApiData(res)
    } catch (err) {
      // 后端热更新未就绪时，回退到已从 Excel 导入的真实结构化数据
      console.warn('[college] key-plan-progress API 不可用，使用 Excel 导入快照', err)
      return cloneKeyPlan(mockKeyPlanProgress)
    }
  },
})

function cloneKeyPlan(data: KeyPlanProgressData): KeyPlanProgressData {
  return {
    ...data,
    overview: { ...data.overview },
    groups: data.groups.map((g) => ({
      ...g,
      metrics: g.metrics.map((m) => ({ ...m, materials: [...(m.materials ?? [])] })),
    })),
    metrics: data.metrics.map((m) => ({
      ...m,
      materials: [...(m.materials ?? [])],
    })),
  }
}

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
  fetchKeyPlanProgress,
  fetchStudentOverview: fetchStudentOverview,
  fetchTeachingOverview: fetchTeachingOverview,
  fetchResearchOverview: fetchResearchOverview,
  fetchWarningOverview: fetchWarningOverview,
}
