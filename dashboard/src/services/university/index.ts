import { mockUniversityOverview } from '@/mock/university/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const universityService = {
  fetchOverview: async () => {
    if (useMock) {
      await new Promise((r) => setTimeout(r, 200))
      return mockUniversityOverview
    }
    throw new Error('University API not connected')
  },
}
