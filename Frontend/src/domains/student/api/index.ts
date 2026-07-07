import type { StudentDashboardDTO } from '@/domains/student/types/api'
import client from '@/core/api/client'

export const studentApi = {
  getDashboard: (studentId: string) =>
    client.get<{ data: StudentDashboardDTO }>(`/student/${studentId}/dashboard`),
}
