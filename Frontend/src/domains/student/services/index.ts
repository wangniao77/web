import { createService } from '@/core/service/createService'
import { adaptStudentDashboard } from '@/domains/student/adapters'
import { studentApi } from '@/domains/student/api'
import { mockStudentDashboard } from '@/domains/student/mock/data'
import type { StudentDashboardVM } from '@/domains/student/types/view'

const fetchDashboard = createService<string | undefined, StudentDashboardVM>({
  mock: () => adaptStudentDashboard(mockStudentDashboard),
  fetch: async (studentId) => {
    const id = studentId || import.meta.env.VITE_MOCK_STUDENT_ID || '2022001234'
    const res = await studentApi.getDashboard(id)
    return adaptStudentDashboard(res.data.data)
  },
})

export const studentService = {
  fetchDashboard,
}
