import type { KpiKey } from '@/types/college/api'
import type { IconKind } from '@/components/college/DashIcon.vue'

export type OrbitPosition = 'tl' | 'uml' | 'lml' | 'bl' | 'tr' | 'umr' | 'lmr' | 'br'

export const kpiLayout: Record<KpiKey, { icon: IconKind; position: OrbitPosition }> = {
  teachers: { icon: 'faculty', position: 'tl' },
  studentRatio: { icon: 'students', position: 'uml' },
  courses: { icon: 'course', position: 'lml' },
  topPapers: { icon: 'research', position: 'bl' },
  projects: { icon: 'briefcase', position: 'tr' },
  patents: { icon: 'award', position: 'umr' },
  platforms: { icon: 'database', position: 'lmr' },
  teams: { icon: 'community', position: 'br' },
}
