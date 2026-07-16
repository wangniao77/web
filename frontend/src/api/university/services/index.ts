import { createService } from '@/api/createService'
import type { UniversityScope } from '@/types/common'
import {
  adaptUniversityOverview,
} from '@/api/university/adapters'
import { universityApi } from '@/api/university'
import { mockUniversityOverview } from '@/mock/university/data'
import type { UniversityDashboardVM } from '@/types/university/view'

const fetchOverview = createService<UniversityScope | void, UniversityDashboardVM>({
  mock: () => adaptUniversityOverview(mockUniversityOverview),
  fetch: async () => {
    const res = await universityApi.getOverview()
    return adaptUniversityOverview(res.data.data)
  },
})

export const universityService = {
  fetchOverview: (scope?: UniversityScope) => fetchOverview(scope),
}
