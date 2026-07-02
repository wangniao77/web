export const COCKPIT_THEME = {
  color: ['#00b8ff', '#f0c040', '#34d399', '#f87171', '#8b5cf6', '#66d9ff'],
  backgroundColor: 'transparent',
  textStyle: {
    color: '#889ec2',
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    fontSize: 16,
  },
  title: {
    textStyle: { color: '#e2edff', fontSize: 18, fontWeight: 600 },
  },
  legend: {
    textStyle: { color: '#889ec2', fontSize: 14 },
    icon: 'roundRect',
    itemWidth: 14,
    itemHeight: 8,
  },
  tooltip: {
    backgroundColor: 'rgba(6, 17, 52, 0.95)',
    borderColor: 'rgba(0, 212, 255, 0.2)',
    textStyle: { color: '#e2edff', fontSize: 16 },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    axisLabel: { color: '#889ec2', fontSize: 15 },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    axisLabel: { color: '#889ec2', fontSize: 15 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
}

/** 学院大屏图表字号（与 SCSS $college-fs-chart 保持一致） */
export const CHART_FONT = {
  axis: 15,
  legend: 14,
  label: 15,
  tooltip: 16,
  /** 中央 Hub 大仪表盘 */
  gauge: 30,
  /** 窄列小仪表盘（综合评价左侧） */
  gaugeCompact: 22,
} as const

/**
 * 图表 grid 留白（配合 containLabel 自动适配轴标签）
 * 字号调大后必须用 containLabel，避免标签被裁切
 */
export const CHART_GRID = {
  line: { left: 6, right: 10, top: 10, bottom: 6, containLabel: true },
  lineLegend: { left: 6, right: 10, top: 38, bottom: 6, containLabel: true },
  barH: { left: 6, right: 44, top: 6, bottom: 6, containLabel: true },
} as const

/** 轴标签通用样式 */
export const AXIS_LABEL = {
  color: '#889ec2',
  fontSize: CHART_FONT.axis,
  margin: 10,
} as const

export const AXIS_LABEL_ALT = {
  ...AXIS_LABEL,
  color: '#8899aa',
} as const

export const CHART_COLORS = {
  blue:   '#00b8ff',
  cyan:   '#00e5ff',
  gold:   '#f0c040',
  green:  '#34d399',
  red:    '#f87171',
  purple: '#8b5cf6',
  lightBlue: '#66d9ff',
  orange: '#fb923c',
}
