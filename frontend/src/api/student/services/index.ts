import { createService } from '@/api/createService'
import { adaptStudentDashboard } from '@/api/student/adapters'
import { studentApi } from '@/api/student'
import { mockStudentDashboard } from '@/mock/student/data'
import type { StudentDashboardVM } from '@/types/student/view'

const fetchDashboard = createService<string | undefined, StudentDashboardVM>({
  mock: () => adaptStudentDashboard(mockStudentDashboard),
  fetch: async (studentId) => {
    const id = studentId || import.meta.env.VITE_MOCK_STUDENT_ID || '2240664101'
    const res = await studentApi.getDashboard(id)
    return adaptStudentDashboard(res.data.data)
  },
})

export const studentService = {
  fetchDashboard,
}
