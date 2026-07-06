import type { StudentDashboardDTO } from '@/types/student/api'
import client from '@/api/client'

export const studentApi = {
  getDashboard: (studentId: string) =>
    client.get<{ data: StudentDashboardDTO }>(`/student/${studentId}/dashboard`),
}
