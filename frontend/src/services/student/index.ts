import type { StudentDashboardDTO } from '@/types/student/api'
import type { StudentAcademicRow } from './academicRow'
import { deriveDashboardFromCorpus, deriveStudentDashboard, parseCompetitionDetail } from './deriveDashboard'
import { listClassPeers, listDormPeers, type StudentPeerItem } from './peers'

export type { StudentAcademicRow, StudentPeerItem }
export { deriveDashboardFromCorpus, deriveStudentDashboard, parseCompetitionDetail, listClassPeers, listDormPeers }

let cachedCorpus: StudentAcademicRow[] | null = null

export async function loadAcademicCorpus(): Promise<StudentAcademicRow[]> {
  if (cachedCorpus) return cachedCorpus
  const mod = await import('@/mock/student/academicRecords.json')
  cachedCorpus = (mod.default ?? mod) as StudentAcademicRow[]
  return cachedCorpus
}

export async function fetchDerivedMockDashboard(studentId: string): Promise<StudentDashboardDTO> {
  const corpus = await loadAcademicCorpus()
  return deriveDashboardFromCorpus(studentId, corpus)
}
