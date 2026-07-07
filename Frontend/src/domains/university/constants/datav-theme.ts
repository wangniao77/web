/** DataV 组件与学校大屏主题色对齐 */
export const UNIVERSITY_DATAV_COLORS: [string, string] = ['#00d4ff', '#0066aa']
export const UNIVERSITY_DATAV_BG = 'rgba(4, 14, 38, 0.35)'

export const UNIVERSITY_SCROLL_BOARD = {
  oddRowBGC: 'rgba(6, 20, 48, 0.55)',
  evenRowBGC: 'rgba(10, 28, 62, 0.45)',
  waitTime: 3200,
} as const

export const UNIVERSITY_DIGITAL_FLOP_STYLE = {
  fontSize: 52,
  fill: '#ffffff',
  fontWeight: 'bold' as const,
  fontFamily: 'DIN Alternate, Bahnschrift, Roboto Condensed, sans-serif',
}

export const UNIVERSITY_KPI_LAYOUT: Record<
  string,
  { icon: string; position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br' }
> = {
  studentDev: { icon: 'icon-people', position: 'tl' },
  furtherStudy: { icon: 'icon-education', position: 'tr' },
  research: { icon: 'icon-research', position: 'ml' },
  employment: { icon: 'icon-star', position: 'mr' },
  safety: { icon: 'icon-warning', position: 'bl' },
  governance: { icon: 'icon-target', position: 'br' },
}

export const NEWS_TAG_LABELS: Record<string, string> = {
  important: '重要',
  headline: '要闻',
  notice: '通知',
}
