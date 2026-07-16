import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptDisciplineOverview,
  adaptDisciplineOverviewDetail,
} from '@/api/college/adapters/discipline-overview'
import {
  mockDisciplineOverview,
  mockDisciplineOverviewDetail,
} from '@/mock/college/discipline-overview'
import type { CollegeScope } from '@/types/common'

const fetchDisciplineOverview = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptDisciplineOverview>
>({
  mock: () => adaptDisciplineOverview(mockDisciplineOverview),
  fetch: async (params) => {
    const res = await collegeApi.getDisciplineOverview(params)
    return adaptDisciplineOverview(unwrapApiData(res))
  },
})

const fetchDisciplineDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptDisciplineOverviewDetail>
>({
  mock: () => adaptDisciplineOverviewDetail(mockDisciplineOverviewDetail),
  fetch: async (params) => {
    const res = await collegeApi.getDisciplineOverviewDetail(params)
    return adaptDisciplineOverviewDetail(unwrapApiData(res))
  },
})

export const disciplineService = {
  fetchDisciplineOverview,
  fetchDisciplineDetail,
}
