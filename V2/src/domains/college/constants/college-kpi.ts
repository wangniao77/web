import type { KpiKey } from '@/domains/college/types/api'
import type { IconKind } from '@/domains/college/components/DashIcon.vue'

export const kpiLayout: Record<KpiKey, { icon: IconKind; position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br' }> = {
  students: { icon: 'students', position: 'tl' },
  faculty: { icon: 'faculty', position: 'ml' },
  funding: { icon: 'potential', position: 'bl' },
  ranking: { icon: 'ranking', position: 'tr' },
  satisfaction: { icon: 'satisfaction', position: 'mr' },
  influence: { icon: 'trophy', position: 'br' },
}
