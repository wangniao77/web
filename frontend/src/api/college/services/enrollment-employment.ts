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
import { mockEmploymentAnalysisReportResponse } from '@/utils/agent/employment-insights'
import type { EmploymentAnalysisReportResponseVM } from '@/types/college/view/employment-analysis'
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

const fetchEmploymentAnalysisReport = createService<
  CollegeScope | undefined,
  EmploymentAnalysisReportResponseVM
>({
  mock: (params) => mockEmploymentAnalysisReportResponse(params?.year || '2026'),
  fetch: async (params) => {
    const res = await collegeApi.getEnrollmentEmploymentAnalysisReport(params)
    return unwrapApiData(res)
  },
})

export const enrollmentEmploymentService = {
  fetchEnrollmentEmploymentOverview,
  fetchEnrollmentEmploymentDetail,
  fetchEmploymentAnalysisReport,
}
