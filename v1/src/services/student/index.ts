import { adaptStudentDashboard } from '@/adapters/student'
import { studentApi } from '@/api/student'
import { mockStudentDashboard } from '@/mock/student/data'
import type { StudentDashboardVM } from '@/types/view/student'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withMock<T>(mockData: T, fetcher: () => Promise<T>): Promise<T> {
  if (useMock) {
    await delay(200)
    return mockData
  }
  return fetcher()
}

export const studentService = {
  fetchDashboard: (studentId?: string): Promise<StudentDashboardVM> =>
    withMock(adaptStudentDashboard(mockStudentDashboard), async () => {
      const id = studentId || import.meta.env.VITE_MOCK_STUDENT_ID || '2022001234'
      const res = await studentApi.getDashboard(id)
      return adaptStudentDashboard(res.data.data)
    }),
}
