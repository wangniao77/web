/** 分数档位：低红 / 中黄 / 高蓝，便于一眼识别风险 */
export type ScoreTone = 'risk' | 'warn' | 'good' | 'neutral'

/**
 * 百分制分数配色：
 * - &lt; 60：红色（需重点关注）
 * - 60–79：黄色（仍有提升空间）
 * - ≥ 80：蓝色（表现较好）
 */
export function scoreToneFromValue(value: number | string | null | undefined): ScoreTone {
  const n = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').trim())
  if (!Number.isFinite(n)) return 'neutral'
  if (n < 60) return 'risk'
  if (n < 80) return 'warn'
  return 'good'
}

/** 身心关注等级等非分数文案的配色 */
export function levelToneFromText(text: string | null | undefined): ScoreTone {
  const t = String(text ?? '').trim()
  if (!t || t === '未评估' || t === '—') return 'neutral'
  if (/高|严重|红色|高风险/.test(t)) return 'risk'
  if (/中|关注|黄色|预警|一般/.test(t)) return 'warn'
  if (/低|正常|绿色|良好/.test(t)) return 'good'
  return 'neutral'
}
