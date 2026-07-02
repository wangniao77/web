import { mockStudentProfile } from '@/mock/student/data'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export const studentService = {
  fetchProfile: async () => {
    if (useMock) {
      await new Promise((r) => setTimeout(r, 200))
      return mockStudentProfile
    }
    throw new Error('Student API not connected')
  },
}
