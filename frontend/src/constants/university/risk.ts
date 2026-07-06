export type RiskLevel = 'normal' | 'ongoing' | 'attention' | 'warning'

export const RISK_LEVEL_MAP: Record<
  RiskLevel,
  { label: string; class: string; color: string }
> = {
  normal: { label: '正常', class: 'risk-normal', color: '#34d399' },
  ongoing: { label: '推进中', class: 'risk-ongoing', color: '#55a8ff' },
  attention: { label: '需关注', class: 'risk-attention', color: '#fb923c' },
  warning: { label: '预警', class: 'risk-warning', color: '#f87171' },
}

export const TASK_STATUS_TO_RISK: Record<string, RiskLevel> = {
  completed: 'normal',
  ongoing: 'ongoing',
  attention: 'attention',
  overdue: 'warning',
}
