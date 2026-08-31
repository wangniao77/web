import type { AgentAnalysisVM } from '@/types/agent/view'
import type { DisciplineNum, SoftDimensionDTO } from '@/types/college/api/discipline-overview'

export interface DisciplineOverviewMajorSnap {
  name: string
  grade: string
  nationalRank: DisciplineNum
  yoyChange: DisciplineNum
  provincialRank: DisciplineNum
  financePeerRank: DisciplineNum
  studentCount: DisciplineNum
  employmentRate: DisciplineNum
  avgScore: DisciplineNum
  softDimensions: SoftDimensionDTO[]
}

export interface DisciplineOverviewSnapshot {
  ranking: {
    current: DisciplineNum
    yoyChange: DisciplineNum
    provincial: DisciplineNum
    peer: DisciplineNum
  }
  dimensions: Array<{
    key: string
    label: string
    score: DisciplineNum
    peerAverage: DisciplineNum
  }>
  majors: DisciplineOverviewMajorSnap[]
  radarConclusion?: string
}

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v)
}

function fmt(v: DisciplineNum | undefined, suffix = ''): string {
  if (!isNum(v)) return '**'
  return `${v}${suffix}`
}

export function isDisciplineOverviewSnapshot(snapshot: unknown): snapshot is DisciplineOverviewSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false
  const s = snapshot as DisciplineOverviewSnapshot
  return Array.isArray(s.majors) && Array.isArray(s.dimensions)
}

export function buildDisciplineOverviewSnapshot(input: {
  ranking: DisciplineOverviewSnapshot['ranking']
  dimensions: DisciplineOverviewSnapshot['dimensions']
  majors: Array<{
    name: string
    grade?: string
    nationalRank?: DisciplineNum
    yoyChange?: DisciplineNum
    provincialRank?: DisciplineNum
    financePeerRank?: DisciplineNum
    studentCount?: DisciplineNum
    employmentRate?: DisciplineNum
    avgScore?: DisciplineNum
    softDimensions?: SoftDimensionDTO[]
  }>
  radarConclusion?: string
}): DisciplineOverviewSnapshot {
  return {
    ranking: input.ranking,
    dimensions: input.dimensions,
    radarConclusion: input.radarConclusion,
    majors: input.majors.map((m) => ({
      name: m.name,
      grade: m.grade || '**',
      nationalRank: m.nationalRank ?? '**',
      yoyChange: m.yoyChange ?? '**',
      provincialRank: m.provincialRank ?? '**',
      financePeerRank: m.financePeerRank ?? '**',
      studentCount: m.studentCount ?? '**',
      employmentRate: m.employmentRate ?? '**',
      avgScore: m.avgScore ?? '**',
      softDimensions: m.softDimensions ?? [],
    })),
  }
}

/** 规则降级：用专业排名 + 五维细分产出可核对洞察 */
/** 把快照关键数补到洞察依据上，避免只有空话 */
export function attachDisciplineEvidence(
  analysis: AgentAnalysisVM,
  snapshot: DisciplineOverviewSnapshot,
): AgentAnalysisVM {
  const ranked = snapshot.majors.filter((m) => isNum(m.nationalRank))
  const best = [...ranked].sort((a, b) => Number(a.nationalRank) - Number(b.nationalRank))[0]
  const worst = [...ranked].sort((a, b) => Number(b.nationalRank) - Number(a.nationalRank))[0]
  const pool = [
    isNum(snapshot.ranking.current)
      ? { source: 'db' as const, label: '学院中位排名', value: `第${snapshot.ranking.current}` }
      : null,
    best
      ? { source: 'db' as const, label: `${best.name}全国排名`, value: `第${best.nationalRank}` }
      : null,
    worst && best && worst.name !== best.name
      ? { source: 'db' as const, label: `${worst.name}全国排名`, value: `第${worst.nationalRank}` }
      : null,
    ...snapshot.majors
      .filter((m) => isNum(m.employmentRate))
      .map((m) => ({
        source: 'db' as const,
        label: `${m.name}落实率`,
        value: `${m.employmentRate}%`,
      })),
  ].filter((x): x is NonNullable<typeof x> => Boolean(x))

  return {
    ...analysis,
    insights: analysis.insights.map((item) => {
      if (item.evidence?.length) return item
      const text = `${item.title}${item.detail}`
      const matched = pool.filter((e) => {
        if (text.includes(e.value)) return true
        return snapshot.majors.some((m) => e.label.includes(m.name) && text.includes(m.name))
          || (e.label.includes('中位') && (text.includes('中位') || text.includes('整体')))
      })
      return { ...item, evidence: (matched.length ? matched : pool).slice(0, 3) }
    }),
  }
}

export function buildDisciplineOverviewRuleAnalysis(
  snapshot: DisciplineOverviewSnapshot,
  sessionId = `rule-disc-${Date.now()}`,
): AgentAnalysisVM {
  const ranked = snapshot.majors.filter((m) => isNum(m.nationalRank))
  const best = [...ranked].sort((a, b) => Number(a.nationalRank) - Number(b.nationalRank))[0]
  const worst = [...ranked].sort((a, b) => Number(b.nationalRank) - Number(a.nationalRank))[0]
  const rising = snapshot.majors.filter((m) => isNum(m.yoyChange) && m.yoyChange > 0)
  const falling = snapshot.majors.filter((m) => isNum(m.yoyChange) && m.yoyChange < 0)

  const dimGaps = snapshot.dimensions
    .filter((d) => isNum(d.score) && isNum(d.peerAverage))
    .map((d) => ({
      label: d.label,
      score: Number(d.score),
      peer: Number(d.peerAverage),
      gap: Number(d.score) - Number(d.peerAverage),
    }))
    .sort((a, b) => a.gap - b.gap)
  const weakestDim = dimGaps[0]
  const strongestDim = [...dimGaps].sort((a, b) => b.gap - a.gap)[0]

  // 找出某维最弱的专业，便于把学院缺口落到专业
  let weakMajorOnDim: { major: string; label: string; score: number; peer: number } | null = null
  if (weakestDim) {
    const rows = snapshot.majors
      .map((m) => {
        const dim = m.softDimensions.find((d) => d.label === weakestDim.label)
        if (!dim || !isNum(dim.score)) return null
        return {
          major: m.name,
          label: weakestDim.label,
          score: Number(dim.score),
          peer: isNum(dim.peerAverage) ? Number(dim.peerAverage) : weakestDim.peer,
        }
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .sort((a, b) => a.score - b.score)
    weakMajorOnDim = rows[0] ?? null
  }

  const insights: AgentAnalysisVM['insights'] = []

  if (best) {
    insights.push({
      title: '头部专业稳住矩阵',
      detail: `${best.name} 全国第 ${fmt(best.nationalRank)}、${best.grade === '**' ? '等级缺源' : `${best.grade} 级`}，较上年 ${
        isNum(best.yoyChange) ? (best.yoyChange > 0 ? `↑${best.yoyChange}` : best.yoyChange < 0 ? `↓${Math.abs(best.yoyChange)}` : '持平') : '**'
      }；在校 ${fmt(best.studentCount, ' 人')}、落实率 ${fmt(best.employmentRate, '%')}，是学院专业矩阵的压舱石。`,
      tone: 'good',
      evidence: [
        { source: 'db', label: `${best.name}全国排名`, value: `第${fmt(best.nationalRank)}` },
        { source: 'db', label: '等级', value: best.grade },
      ],
    })
  }

  if (rising.length || falling.length) {
    const riseTxt = rising.length
      ? `${rising.map((m) => `${m.name}↑${m.yoyChange}`).join('、')} 上行`
      : '暂无上行专业'
    const fallTxt = falling.length
      ? `；${falling.map((m) => `${m.name}↓${Math.abs(Number(m.yoyChange))}`).join('、')} 回落`
      : ''
    insights.push({
      title: rising.length ? '位次通道仍在打开' : '排名波动需盯紧',
      detail: `${riseTxt}${fallTxt}。建议把增量资源投向可冲击更高等级的赛道，对回落专业拆解五维缺口。`,
      tone: falling.length ? 'warn' : 'info',
      evidence: [
        { source: 'db', label: '上行专业数', value: `${rising.length}` },
        { source: 'db', label: '回落专业数', value: `${falling.length}` },
      ],
    })
  }

  if (strongestDim && weakestDim) {
    insights.push({
      title: `${weakestDim.label}是最紧五维`,
      detail: `学院${strongestDim.label} ${strongestDim.score} 分（对标 ${strongestDim.peer}，+${strongestDim.gap.toFixed(1)}），${weakestDim.label} ${weakestDim.score} 分（对标 ${weakestDim.peer}，${weakestDim.gap >= 0 ? '+' : ''}${weakestDim.gap.toFixed(1)}）${
        weakMajorOnDim
          ? `；短板主要落在「${weakMajorOnDim.major}」（${weakMajorOnDim.score} / 对标 ${weakMajorOnDim.peer}）`
          : ''
      }。`,
      tone: weakestDim.gap < 0 ? 'warn' : 'info',
      evidence: [
        { source: 'db', label: strongestDim.label, value: `${strongestDim.score}` },
        { source: 'db', label: weakestDim.label, value: `${weakestDim.score}` },
      ],
    })
  }

  if (worst && best && worst.name !== best.name) {
    insights.push({
      title: '梯队差距可拆到专业',
      detail: `${best.name} 与 ${worst.name} 全国位次相差 ${
        isNum(best.nationalRank) && isNum(worst.nationalRank)
          ? Number(worst.nationalRank) - Number(best.nationalRank)
          : '**'
      } 位；${worst.name} 省内第 ${fmt(worst.provincialRank)}、财经类第 ${fmt(worst.financePeerRank)}。建议以头部专业为标杆，把建设重点落到弱维。`,
      tone: 'info',
      evidence: [
        { source: 'db', label: `${worst.name}全国排名`, value: `第${fmt(worst.nationalRank)}` },
      ],
    })
  }

  const actions: string[] = []
  if (weakMajorOnDim) {
    actions.push(`优先补齐「${weakMajorOnDim.major}」的${weakMajorOnDim.label}（当前 ${weakMajorOnDim.score}，对标 ${weakMajorOnDim.peer}）`)
  }
  if (falling[0]) {
    actions.push(`对「${falling[0].name}」建立排名回落复盘，对照上年五维与对标校位次`)
  }
  if (rising[0]) {
    actions.push(`把「${rising[0].name}」的增量资源锁定在可冲击更高等级的赛道`)
  }
  if (!actions.length) {
    actions.push('继续更新软科快照与五维明细，补齐缺源专业后再做横向对标')
  }

  const headline = best
    ? `${best.name} 领跑（全国第 ${fmt(best.nationalRank)}）${weakestDim ? ` · ${weakestDim.label}待补` : ''}`
    : snapshot.radarConclusion || '专业排名与五维待补源后研判'

  return {
    insights: insights.slice(0, 4),
    actions: actions.slice(0, 3),
    sessionId,
    traceId: `disc-${Date.now()}`,
    source: 'rule',
    headline,
  }
}
