import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { collegeDetailApi } from '@/api/college/details'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptStudentDevDetail,
  adaptStudentDevQuality,
  adaptStudentEvaluationDetail,
  adaptStudentFlowSankey,
} from '@/api/college/adapters/student-dev-quality'
import {
  mockStudentDevDetail,
  mockStudentDevQuality,
  mockStudentEvaluationDetail,
  mockStudentFlowSankey,
} from '@/mock/college/student-dev-quality'
import type { DevQualityDimension, EvaluationIndicatorKey } from '@/types/college/api/student-dev-quality'
import type { CollegeScope } from '@/types/common'

export interface StudentDevQualityParams extends CollegeScope {
  dimension?: DevQualityDimension
}

const fetchStudentDevQuality = createService<
  StudentDevQualityParams | undefined,
  ReturnType<typeof adaptStudentDevQuality>
>({
  mock: (params) => adaptStudentDevQuality(mockStudentDevQuality(params?.dimension ?? 'major')),
  fetch: async (params) => {
    const res = await collegeApi.getStudentDevQuality(params)
    return adaptStudentDevQuality(unwrapApiData(res))
  },
})

const fetchStudentDevDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptStudentDevDetail>
>({
  mock: () => adaptStudentDevDetail(mockStudentDevDetail()),
  fetch: async (params) => {
    const res = await collegeApi.getStudentDevDetail(params)
    return adaptStudentDevDetail(unwrapApiData(res))
  },
})

const fetchStudentFlowSankey = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptStudentFlowSankey>
>({
  mock: () => adaptStudentFlowSankey(mockStudentFlowSankey),
  fetch: async (params) => {
    const res = await collegeApi.getStudentFlowSankey(params)
    return adaptStudentFlowSankey(unwrapApiData(res))
  },
})

export const studentDevService = {
  fetchStudentDevQuality,
  fetchStudentDevDetail,
  fetchStudentFlowSankey,
  fetchStudentEvaluationDetail: async (key: EvaluationIndicatorKey, params?: CollegeScope) => {
    if (import.meta.env.VITE_USE_MOCK === 'true') {
      await new Promise((r) => setTimeout(r, 150))
      return adaptStudentEvaluationDetail(mockStudentEvaluationDetail(key))
    }
    const res = await collegeDetailApi.getStudentEvaluationDetail(key, params)
    return adaptStudentEvaluationDetail(unwrapApiData(res))
  },
}
