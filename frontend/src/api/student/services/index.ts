import { createService } from '@/api/createService'
import { adaptStudentDashboard } from '@/api/student/adapters'
import { studentApi } from '@/api/student'
import { fetchDerivedMockDashboard, loadAcademicCorpus } from '@/services/student'
import type { StudentDashboardVM } from '@/types/student/view'

const DEFAULT_REAL_STUDENT_ID = '22251102220'

async function mockDashboard(studentId?: string): Promise<StudentDashboardVM> {
  const corpus = await loadAcademicCorpus()
  const preferred = studentId || import.meta.env.VITE_MOCK_STUDENT_ID || DEFAULT_REAL_STUDENT_ID
  const exists = corpus.some((r) => String(r.student_id) === String(preferred))
  const id = exists ? preferred : String(corpus[0]?.student_id || DEFAULT_REAL_STUDENT_ID)
  const dto = await fetchDerivedMockDashboard(id)
  return adaptStudentDashboard(dto)
}

const fetchDashboard = createService<string | undefined, StudentDashboardVM>({
  mock: (studentId) => mockDashboard(studentId),
  fetch: async (studentId) => {
    const id = studentId || import.meta.env.VITE_MOCK_STUDENT_ID || DEFAULT_REAL_STUDENT_ID
    const res = await studentApi.getDashboard(id)
    return adaptStudentDashboard(res.data.data)
  },
})

export const studentService = {
  fetchDashboard,
}
