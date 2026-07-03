import type { KpiKey } from '@/domains/college/types/api'

export const kpiLayout: Record<KpiKey, { icon: string; position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br' }> = {
  students: { icon: 'icon-people', position: 'tl' },
  faculty: { icon: 'icon-star', position: 'tr' },
  funding: { icon: 'icon-funding', position: 'ml' },
  ranking: { icon: 'icon-ranking', position: 'mr' },
  satisfaction: { icon: 'icon-satisfaction', position: 'bl' },
  influence: { icon: 'icon-influence', position: 'br' },
}
