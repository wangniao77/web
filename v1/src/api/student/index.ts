import type { StudentDashboardDTO } from '@/types/api/student'
import client from '../client'

export const studentApi = {
  getDashboard: (studentId: string) =>
    client.get<{ data: StudentDashboardDTO }>(`/student/${studentId}/dashboard`),
}
