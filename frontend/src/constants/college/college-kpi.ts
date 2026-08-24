import type { HubHighlightKey, KpiKey } from '@/types/college/api'
import type { IconKind } from '@/components/college/DashIcon.vue'

export type OrbitPosition = 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'

export const kpiLayout: Record<KpiKey, { icon: IconKind; position: OrbitPosition }> = {
  faculty: { icon: 'faculty', position: 'tl' },
  students: { icon: 'students', position: 'ml' },
  courses: { icon: 'course', position: 'bl' },
  majors: { icon: 'academic', position: 'tr' },
  platforms: { icon: 'database', position: 'mr' },
  teams: { icon: 'community', position: 'br' },
}

export const highlightLayout: Record<HubHighlightKey, { icon: IconKind }> = {
  masterDegrees: { icon: 'academic' },
  scienceAwards: { icon: 'medal' },
  conferences: { icon: 'event' },
}
