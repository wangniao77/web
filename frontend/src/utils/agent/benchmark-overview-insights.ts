import type { AgentAnalysisVM } from '@/types/agent/view'
import type { BenchmarkGaugeItemVM, BenchmarkHeroKpiVM } from '@/types/college/view/benchmark-achievements'

export interface BenchmarkOverviewGauge {
  key: string
  label: string
  metricLabel: string
  value: number
  target: number
  unit: string
  status: string
  gap: number
  ratio: number
  fact: string
}

export interface BenchmarkOverviewSnapshot {
  headline: string
  heroes: BenchmarkHeroKpiVM[]
  gauges: BenchmarkOverviewGauge[]
  summary: {
    met: number
    near: number
    gap: number
    empty: number
    totalGap: number
  }
  byLevel: Array<{ level: string; count: number }>
  evidenceCounts: Array<{ key: string; label: string; count: number }>
}

export function isBenchmarkOverviewSnapshot(snapshot: unknown): snapshot is BenchmarkOverviewSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false
  const s = snapshot as BenchmarkOverviewSnapshot
  return Array.isArray(s.gauges) && Array.isArray(s.heroes) && Boolean(s.summary)
}

export function toOverviewGauges(items: BenchmarkGaugeItemVM[]): BenchmarkOverviewGauge[] {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    metricLabel: item.metricLabel,
    value: item.value,
    target: item.target,
    unit: item.unit,
    status: item.status,
    gap: item.gap,
    ratio: item.ratio,
    fact: item.fact,
  }))
}

/** 规则降级：二级总览用完整洞察，不是卡片短句 */
export function buildBenchmarkOverviewRuleAnalysis(
  snapshot: BenchmarkOverviewSnapshot,
  sessionId = `rule-ov-${Date.now()}`,
): AgentAnalysisVM {
  const met = snapshot.gauges.filter((item) => item.status === 'met')
  const weak = snapshot.gauges.filter(
    (item) => item.status === 'gap' || item.status === 'near' || item.status === 'empty',
  )
  const worst = [...weak].sort((a, b) => b.gap - a.gap)[0]
  const empty = weak.filter((item) => item.status === 'empty')

  const insights: AgentAnalysisVM['insights'] = []
  if (met.length) {
    insights.push({
      title: '高光已形成支点',
      detail: `${met.map((item) => `${item.metricLabel}${item.value}${item.unit}`).join('、')}已过门槛，可固化为可复制机制。`,
      tone: 'good',
    })
  }
  if (worst) {
    insights.push({
      title: worst.status === 'empty' ? `${worst.label}台账待补` : `${worst.label}是最紧缺口`,
      detail:
        worst.status === 'empty'
          ? `${worst.metricLabel}可展示条目为0，先补口径再谈对标。`
          : `${worst.metricLabel}${worst.value}/${worst.target}${worst.unit}，申报与培育要提速。`,
      tone: 'warn',
    })
  }
  if (empty.length && empty[0]?.key !== worst?.key) {
    insights.push({
      title: '部分板块缺证据',
      detail: `${empty.map((item) => item.label).join('、')}缺少可展示条目，不宜用空台账对外对标。`,
      tone: 'warn',
    })
  }
  insights.push({
    title: '对标结构不均衡',
    detail: `达标${snapshot.summary.met}项、接近${snapshot.summary.near}项、缺口${snapshot.summary.gap}项、数据不足${snapshot.summary.empty}项。`,
    tone: 'info',
  })

  return {
    insights: insights.slice(0, 5),
    actions: weak.slice(0, 3).map((item) =>
      item.status === 'empty'
        ? `补齐${item.label}「${item.metricLabel}」口径与台账`
        : `把${item.label}「${item.metricLabel}」从 ${item.value} 补到 ${item.target}${item.unit}`,
    ),
    sessionId,
    traceId: `rule-${sessionId}`,
    source: 'rule',
    headline: snapshot.headline,
  }
}
