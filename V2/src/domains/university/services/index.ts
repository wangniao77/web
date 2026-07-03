import { createService } from '@/core/service/createService'
import type { UniversityScope } from '@/core/types/common'
import {
  adaptUniversityOverview,
} from '@/domains/university/adapters'
import { universityApi } from '@/domains/university/api'
import { mockUniversityOverview } from '@/domains/university/mock/data'
import type { UniversityDashboardVM } from '@/domains/university/types/view'

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
