import type { TrendInfo } from '@/types/api/common'

export function formatTrend(trend?: TrendInfo): string | undefined {
  if (!trend) return undefined
  const arrow = trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '→'
  const unit = trend.unit ?? ''
  return `${arrow}${trend.value}${unit}`
}
