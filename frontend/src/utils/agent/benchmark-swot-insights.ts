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

const PILLAR_KEYS = new Set(['research', 'teaching', 'talent', 'discipline', 'party'])
const TITLE_ALIASES: Record<string, string> = {
  research: 'research',
  teaching: 'teaching',
  talent: 'talent',
  discipline: 'discipline',
  party: 'party',
  科研: 'research',
  教学: 'teaching',
  人才培养: 'talent',
  人才: 'talent',
  学科建设: 'discipline',
  学科: 'discipline',
  党建: 'party',
}

/** 把 Agent/规则 insight.title 对回板块 key */
export function notesFromAnalysis(
  insights: Array<{ title: string; detail: string }>,
): Record<string, string> {
  const notes: Record<string, string> = {}
  for (const item of insights) {
    const key = TITLE_ALIASES[item.title.trim()] || item.title.trim()
    const detail = item.detail.trim()
    if (!PILLAR_KEYS.has(key) || !detail) continue
    notes[key] = detail.slice(0, 40)
  }
  return notes
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 卡片上已有指标名和 x/y，分析句里再写一遍就重复了 */
export function stripRepeatedMetric(
  note: string,
  item: { label: string; metricLabel: string; value: number; target: number; unit: string; gap: number },
): string {
  let text = note.trim()
  const names = [item.metricLabel, item.label].filter(Boolean).map(escapeRegExp)
  const name = names.length ? `(?:${names.join('|')})\\s*` : ''
  const frac = `${item.value}\\s*/\\s*${item.target}`
  const unit = escapeRegExp(item.unit || '')
  text = text.replace(new RegExp(`^${name}${frac}\\s*${unit}?[，,、：:\\s]*`), '')
  text = text.replace(new RegExp(`^(?:缺口|还差)\\s*${item.gap}\\s*${unit}?[，,、：:\\s]*`), '')
  return text.trim() || note.trim()
}

/** 规则降级：只写研判，不重复卡片上的指标名 / 分数 */
export function buildWeaknessNote(item: {
  label: string
  metricLabel: string
  value: number
  target: number
  unit: string
  status: string
  gap: number
}): string {
  if (item.status === 'empty') return '台账或口径缺失，需先补齐'
  if (item.status === 'near') return `再补${item.gap}${item.unit}即可达标`
  const ratio = item.target > 0 ? item.value / item.target : 0
  if (ratio <= 0.25) return '培育与申报明显滞后'
  if (ratio < 0.7) return '尚未达到对标门槛，申报与培育要加力'
  return '补齐缺口要进计划'
}

function ruleNote(item: BenchmarkSwotSnapshot['items'][number]): string {
  return buildWeaknessNote(item)
}

/** 规则降级：一条 insight.title = 板块 key，detail = 短说明，供一级卡片对位 */
export function buildBenchmarkSwotRuleAnalysis(
  snapshot: BenchmarkSwotSnapshot,
  sessionId = `rule-swot-${Date.now()}`,
): AgentAnalysisVM {
  const met = snapshot.items.filter((item) => item.status === 'met')
  const weak = snapshot.items.filter(
    (item) => item.status === 'gap' || item.status === 'near' || item.status === 'empty',
  )
  const focus = snapshot.side === 'strengths' ? met : weak
  const tone = snapshot.side === 'strengths' ? 'good' : 'warn'

  return {
    insights: focus.map((item) => ({
      title: item.key,
      detail: ruleNote(item),
      tone,
      evidence: [{ source: 'db' as const, label: `${item.label}·${item.metricLabel}`, value: item.fact }],
    })),
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
