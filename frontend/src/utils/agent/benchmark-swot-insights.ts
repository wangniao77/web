import type { AgentAnalysisVM } from '@/types/agent/view'
import type { BenchmarkSwotBoardVM } from '@/types/college/view/benchmark-achievements'

/** Agent 入参：只传对标事实，不传散文 */
export interface BenchmarkSwotSnapshot {
  side: BenchmarkSwotBoardVM['side']
  headline: string
  summary: BenchmarkSwotBoardVM['summary']
  items: Array<{
    key: string
    label: string
    metricLabel: string
    value: number
    target: number
    unit: string
    status: string
    gap: number
    fact: string
  }>
}

export function isBenchmarkSwotSnapshot(snapshot: unknown): snapshot is BenchmarkSwotSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false
  const s = snapshot as BenchmarkSwotSnapshot
  return (s.side === 'strengths' || s.side === 'weaknesses') && Array.isArray(s.items)
}

export function toBenchmarkSwotSnapshot(board: BenchmarkSwotBoardVM): BenchmarkSwotSnapshot {
  return {
    side: board.side,
    headline: board.headline,
    summary: { ...board.summary },
    items: board.items.map((item) => ({
      key: item.key,
      label: item.label,
      metricLabel: item.metricLabel,
      value: item.value,
      target: item.target,
      unit: item.unit,
      status: item.status,
      gap: item.gap,
      fact: item.fact,
    })),
  }
}

/** 规则降级：与一级对标条同一份事实，Agent 接通后只替换文案 */
export function buildBenchmarkSwotRuleAnalysis(
  snapshot: BenchmarkSwotSnapshot,
  sessionId = `rule-swot-${Date.now()}`,
): AgentAnalysisVM {
  const met = snapshot.items.filter((item) => item.status === 'met')
  const weak = snapshot.items.filter((item) => item.status === 'gap' || item.status === 'empty')
  const tone = snapshot.side === 'strengths' ? 'good' : 'warn'

  return {
    insights: [
      {
        title: snapshot.side === 'strengths' ? '存量优势' : '短板缺口',
        detail: snapshot.headline,
        tone,
        evidence: snapshot.items.map((item) => ({
          source: 'db',
          label: `${item.label}·${item.metricLabel}`,
          value: item.fact,
        })),
      },
      {
        title: '达标结构',
        detail: `达标 ${snapshot.summary.met}、接近 ${snapshot.summary.near}、缺口 ${snapshot.summary.gap}、数据不足 ${snapshot.summary.empty}。`,
        tone: snapshot.summary.gap + snapshot.summary.empty > 0 ? 'warn' : 'good',
      },
    ],
    actions: weak.length
      ? weak.slice(0, 3).map((item) =>
          item.status === 'empty'
            ? `补齐${item.label}「${item.metricLabel}」口径与台账`
            : `把${item.label}「${item.metricLabel}」从 ${item.value} 补到 ${item.target}${item.unit}`,
        )
      : met.map((item) => `把已达标的${item.metricLabel}固化为可复制机制`),
    sessionId,
    traceId: `rule-${sessionId}`,
    source: 'rule',
    headline: snapshot.headline,
  }
}
