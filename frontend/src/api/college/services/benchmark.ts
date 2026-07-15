import { createService } from '@/api/createService'
import { collegeApi } from '@/api/college'
import { unwrapApiData } from '@/api/unwrap'
import {
  adaptBenchmarkAchievements,
  adaptBenchmarkAchievementsDetail,
} from '@/api/college/adapters/benchmark-achievements'
import {
  mockBenchmarkAchievements,
  mockBenchmarkAchievementsDetail,
} from '@/mock/college/benchmark-achievements'
import type { CollegeScope } from '@/types/common'

const fetchBenchmarkAchievements = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptBenchmarkAchievements>
>({
  mock: () => adaptBenchmarkAchievements(mockBenchmarkAchievements),
  fetch: async (params) => {
    const res = await collegeApi.getBenchmarkAchievements(params)
    return adaptBenchmarkAchievements(unwrapApiData(res))
  },
})

const fetchBenchmarkDetail = createService<
  CollegeScope | undefined,
  ReturnType<typeof adaptBenchmarkAchievementsDetail>
>({
  mock: () => adaptBenchmarkAchievementsDetail(mockBenchmarkAchievementsDetail),
  fetch: async (params) => {
    const res = await collegeApi.getBenchmarkAchievementsDetail(params)
    return adaptBenchmarkAchievementsDetail(unwrapApiData(res))
  },
})

export const benchmarkService = {
  fetchBenchmarkAchievements,
  fetchBenchmarkDetail,
}
