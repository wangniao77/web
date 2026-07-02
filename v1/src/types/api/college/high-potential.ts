export type HighPotentialModuleId =
  | 'academic'
  | 'competition'
  | 'leadership'
  | 'rural'
  | 'internship'
  | 'career'

export type WarningCategoryType = 'academic' | 'psychological' | 'employment' | 'funding'

export interface HighPotentialModuleDTO {
  id: HighPotentialModuleId
  title: string
  desc: string
  cardMetric: { label: string; value: string; unit?: string }
  tags?: string[]
  stats?: Array<{ label: string; value: string; unit?: string }>
  highlights?: Array<{ label: string; value: string; unit?: string }>
  timeline?: Array<{ date: string; title: string; level: string }>
  aiRecommend?: string[]
  events?: string[]
}

export interface HighPotentialOverviewDTO {
  summary: {
    total: number
    change: string
    coverage: string
    activeRate: string
    trend: { months: string[]; counts: number[] }
    kpis: Array<{ label: string; value: string; unit?: string }>
  }
  modules: HighPotentialModuleDTO[]
}
