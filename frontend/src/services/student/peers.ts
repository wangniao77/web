import type { StudentAcademicRow } from './academicRow'

export interface StudentPeerItem {
  studentId: string
  name: string
  gender?: string
  className?: string
  major?: string
  grade?: number | null
  dormitory?: string
  gpa?: number
  avatarUrl?: string
  isCurrent?: boolean
}

let cachedCorpus: StudentAcademicRow[] | null = null

async function loadCorpus(): Promise<StudentAcademicRow[]> {
  if (cachedCorpus) return cachedCorpus
  const mod = await import('@/mock/student/academicRecords.json')
  cachedCorpus = (mod.default ?? mod) as StudentAcademicRow[]
  return cachedCorpus
}

function dormKey(row: StudentAcademicRow): string {
  const building = String(row.building || '').trim()
  const dorm = String(row.dormitory_name || '').trim()
  if (building && dorm) return `${building} ${dorm}`
  return building || dorm || ''
}

function toPeer(row: StudentAcademicRow, currentId?: string): StudentPeerItem {
  const filename = String(row.photo_filename || '').trim()
  const sid = String(row.student_id || '')
  return {
    studentId: sid,
    name: row.name || '',
    gender: row.gender || undefined,
    className: row.class_name || undefined,
    major: row.major_name || undefined,
    grade: row.grade ?? null,
    dormitory: dormKey(row) || undefined,
    gpa: row.average_credit_gpa != null ? Number(row.average_credit_gpa) : undefined,
    avatarUrl: filename
      ? `/student-photos/${encodeURIComponent(filename)}`
      : sid
        ? `/student-photos/${encodeURIComponent(sid)}`
        : undefined,
    isCurrent: currentId ? sid === String(currentId) : false,
  }
}

function sortPeers(peers: StudentPeerItem[]) {
  return [...peers].sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1
    if (!a.isCurrent && b.isCurrent) return 1
    const g = (b.gpa ?? -1) - (a.gpa ?? -1)
    if (g !== 0) return g
    return a.studentId.localeCompare(b.studentId)
  })
}

export async function listClassPeers(className: string, currentStudentId?: string): Promise<StudentPeerItem[]> {
  const name = className.trim()
  if (!name || name === '—') return []
  const corpus = await loadCorpus()
  const peers = corpus
    .filter((r) => String(r.class_name || '').trim() === name)
    .map((r) => toPeer(r, currentStudentId))
  return sortPeers(peers)
}

export async function listDormPeers(dormitory: string, currentStudentId?: string): Promise<StudentPeerItem[]> {
  const key = dormitory.trim()
  if (!key || key === '—') return []
  const corpus = await loadCorpus()
  const peers = corpus
    .filter((r) => dormKey(r) === key)
    .map((r) => toPeer(r, currentStudentId))
  return sortPeers(peers)
}
