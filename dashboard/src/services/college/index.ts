import { collegeApi } from '@/api/college'
import {
  adaptEvaluationOverview,
  adaptKeyTasks,
  adaptOverviewHub,
  adaptResearchOverview,
  adaptStudentOverview,
  adaptTeachingOverview,
  adaptWarningOverview,
} from '@/adapters/college'
import {
  mockEvaluationOverview,
  mockKeyTasks,
  mockOverviewHub,
  mockResearchOverview,
  mockStudentOverview,
  mockTeachingOverview,
  mockWarningOverview,
} from '@/mock/college/data'
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

export const collegeService = {
  fetchOverviewHub: (params?: CollegeScope) =>
    withMock(adaptOverviewHub(mockOverviewHub), async () => {
      const res = await collegeApi.getHub(params)
      return adaptOverviewHub(res.data.data)
    }),

  fetchKeyTasks: (params?: CollegeScope) =>
    withMock(adaptKeyTasks(mockKeyTasks), async () => {
      const res = await collegeApi.getKeyTasks(params)
      return adaptKeyTasks(res.data.data)
    }),

  fetchStudentOverview: (params?: CollegeScope) =>
    withMock(adaptStudentOverview(mockStudentOverview), async () => {
      const res = await collegeApi.getStudentOverview(params)
      return adaptStudentOverview(res.data.data)
    }),

  fetchTeachingOverview: (params?: CollegeScope) =>
    withMock(adaptTeachingOverview(mockTeachingOverview), async () => {
      const res = await collegeApi.getTeachingOverview(params)
      return adaptTeachingOverview(res.data.data)
    }),

  fetchResearchOverview: (params?: CollegeScope) =>
    withMock(adaptResearchOverview(mockResearchOverview), async () => {
      const res = await collegeApi.getResearchOverview(params)
      return adaptResearchOverview(res.data.data)
    }),

  fetchWarningOverview: (params?: CollegeScope) =>
    withMock(adaptWarningOverview(mockWarningOverview), async () => {
      const res = await collegeApi.getWarningOverview(params)
      return adaptWarningOverview(res.data.data)
    }),

  fetchEvaluationOverview: (params?: CollegeScope) =>
    withMock(adaptEvaluationOverview(mockEvaluationOverview), async () => {
      const res = await collegeApi.getEvaluationOverview(params)
      return adaptEvaluationOverview(res.data.data)
    }),
}
