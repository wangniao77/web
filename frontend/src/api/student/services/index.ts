import { createService } from '@/api/createService'
import { authApi } from '@/api/auth'
import { adaptStudentDashboard } from '@/api/student/adapters'
import { studentApi } from '@/api/student'
import { DEMO_STUDENT_ID } from '@/constants/student'
import { mockStudentDashboard } from '@/mock/student/data'
import type { StudentDashboardVM } from '@/types/student/view'

export interface StudentDashboardLoadResult {
  dashboard: StudentDashboardVM
  studentId: string
  /** 是否为样例展示（非登录用户本人） */
  isSample: boolean
}

function uniqueIds(ids: Array<string | undefined | null>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const id of ids) {
    const value = id?.trim()
    if (!value || seen.has(value)) continue
    seen.add(value)
    result.push(value)
  }
  return result
}

async function resolveAuthStudentId(): Promise<string | undefined> {
  if (!localStorage.getItem('auth_token')) return undefined
  try {
    const res = await authApi.me()
    const studentId = res.data?.data?.student_id
    return typeof studentId === 'string' && studentId.trim() ? studentId.trim() : undefined
  } catch {
    return undefined
  }
}

function isNotFoundError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.includes('不存在') || message.includes('404') || message.includes('Not Found')
}

const fetchDashboard = createService<string | undefined, StudentDashboardLoadResult>({
  mock: () => ({
    dashboard: adaptStudentDashboard(mockStudentDashboard),
    studentId: mockStudentDashboard.profile.studentId,
    isSample: true,
  }),
  fetch: async (requestedId) => {
    const authStudentId = await resolveAuthStudentId()
    const candidateIds = uniqueIds([
      requestedId,
      authStudentId,
      DEMO_STUDENT_ID,
    ])

    let lastError: unknown = null
    for (const id of candidateIds) {
      try {
        const res = await studentApi.getDashboard(id)
        const isSample = !authStudentId || id !== authStudentId
        return {
          dashboard: adaptStudentDashboard(res.data.data),
          studentId: id,
          isSample,
        }
      } catch (error) {
        lastError = error
        if (isNotFoundError(error)) continue
        throw error
      }
    }

    // 全部学号均未命中时，使用内置 Mock 作为最终样例兜底
    if (lastError && !isNotFoundError(lastError)) throw lastError
    return {
      dashboard: adaptStudentDashboard(mockStudentDashboard),
      studentId: DEMO_STUDENT_ID,
      isSample: true,
    }
  },
})

export const studentService = {
  fetchDashboard,
}
