import type { UniversityScope } from '@/types/common'
import { adaptUniversityOverview } from '@/api/university/adapters'
import { universityApi } from '@/api/university'
import { mockUniversityOverview } from '@/mock/university/data'
import type { UniversityDashboardVM } from '@/types/university/view'

const MOCK_DELAY_MS = 200
const API_TIMEOUT_MS = 4_000

function adaptOverviewMock(): UniversityDashboardVM {
  return adaptUniversityOverview(mockUniversityOverview)
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('request timeout')), ms)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

/** 学校大屏默认走 Mock；设置 VITE_UNIVERSITY_LIVE_API=true 才请求后端 */
const useLiveApi = import.meta.env.VITE_UNIVERSITY_LIVE_API === 'true'

export const universityService = {
  async fetchOverview(scope?: UniversityScope): Promise<UniversityDashboardVM> {
    if (!useLiveApi) {
      await delay(MOCK_DELAY_MS)
      return adaptOverviewMock()
    }

    try {
      const res = await withTimeout(
        universityApi.getOverview(scope ?? undefined),
        API_TIMEOUT_MS,
      )
      return adaptUniversityOverview(res.data.data)
    } catch {
      console.warn('[university] overview API unavailable, using mock data')
      return adaptOverviewMock()
    }
  },
}
