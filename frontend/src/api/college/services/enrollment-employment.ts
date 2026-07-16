import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptEnrollmentEmploymentDetail,
  adaptEnrollmentEmploymentOverview,
} from '@/api/college/adapters/enrollment-employment'
import {
  mockEnrollmentEmploymentDetail,
  mockEnrollmentEmploymentOverview,
} from '@/mock/college/enrollment-employment'
import type { CollegeScope } from '@/types/common'

const fetchEnrollmentEmploymentOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptEnrollmentEmploymentOverview>
>({
  mock: () => adaptEnrollmentEmploymentOverview(mockEnrollmentEmploymentOverview),
  fetch: async (params) => {
    const res = await collegeApi.getEnrollmentEmploymentOverview(params)
    return adaptEnrollmentEmploymentOverview(unwrapApiData(res))
  },
})

const fetchEnrollmentEmploymentDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptEnrollmentEmploymentDetail>
>({
  mock: () => adaptEnrollmentEmploymentDetail(mockEnrollmentEmploymentDetail),
  fetch: async (params) => {
    const res = await collegeApi.getEnrollmentEmploymentDetail(params)
    return adaptEnrollmentEmploymentDetail(unwrapApiData(res))
  },
})

export const enrollmentEmploymentService = {
  fetchEnrollmentEmploymentOverview,
  fetchEnrollmentEmploymentDetail,
}
