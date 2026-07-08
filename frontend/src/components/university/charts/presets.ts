import type { EChartsOption } from 'echarts'

export const UNI_CHART = {
  cyan: '#33d9ff',
  blue: '#4b8dff',
  violet: '#7c8bff',
  green: '#37e0a4',
  orange: '#ffb057',
  red: '#ff6b78',
  muted: '#5f7694',
  text: '#9cb6d6',
  grid: 'rgba(90, 170, 255, 0.06)',
  tooltipBg: 'rgba(8, 22, 42, 0.92)',
  tooltipBorder: 'rgba(51, 217, 255, 0.28)',
} as const

export const UNI_TOOLTIP = {
  backgroundColor: UNI_CHART.tooltipBg,
  borderColor: UNI_CHART.tooltipBorder,
  borderWidth: 1,
  padding: [10, 14] as [number, number],
  textStyle: { color: '#eaf4ff', fontSize: 16 },
  extraCssText:
    'backdrop-filter: blur(12px); border-radius: 6px; box-shadow: 0 8px 28px rgba(0,0,0,0.45), 0 0 0 1px rgba(51,217,255,0.06);',
}

export const UNI_AXIS = {
  axisLine: { show: false },
  axisTick: { show: false },
  axisLabel: { color: UNI_CHART.text, fontSize: 14 },
  splitLine: { lineStyle: { color: UNI_CHART.grid, type: 'dashed' as const } },
}

export const UNI_GRID = {
  tight: { left: 4, right: 8, top: 8, bottom: 4, containLabel: true },
  line: { left: 6, right: 14, top: 14, bottom: 8, containLabel: true },
  barH: { left: 4, right: 36, top: 4, bottom: 4, containLabel: true },
  barV: { left: 6, right: 8, top: 18, bottom: 6, containLabel: true },
}

function areaFill(color: string) {
  return {
    type: 'linear' as const,
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: `${color}44` },
      { offset: 1, color: `${color}05` },
    ],
  }
}

/** Glowing area line — thin rounded line, gradient fill, sparse glowing nodes. */
export function uniAreaLine(
  categories: string[],
  values: number[],
  opts?: { min?: number; max?: number; suffix?: string; color?: string },
): EChartsOption {
  const color = opts?.color ?? UNI_CHART.cyan
  return {
    grid: UNI_GRID.line,
    tooltip: {
      ...UNI_TOOLTIP,
      trigger: 'axis',
      formatter: (p: unknown) => {
        const item = (p as Array<{ name: string; value: number }>)[0]
        return `${item.name}<br/><span style="color:${color}">${item.value}${opts?.suffix ?? ''}</span>`
      },
    },
    xAxis: { type: 'category', data: categories, boundaryGap: false, ...UNI_AXIS },
    yAxis: {
      type: 'value',
      min: opts?.min,
      max: opts?.max,
      ...UNI_AXIS,
      axisLabel: { ...UNI_AXIS.axisLabel, formatter: opts?.suffix ? `{value}${opts.suffix}` : '{value}' },
    },
    series: [
      {
        type: 'line',
        smooth: 0.4,
        data: values,
        symbol: 'circle',
        symbolSize: 6,
        showSymbol: true,
        lineStyle: { color, width: 2.2, cap: 'round', shadowBlur: 10, shadowColor: `${color}99` },
        itemStyle: { color, borderColor: '#081428', borderWidth: 2 },
        areaStyle: { color: areaFill(color) },
      },
    ],
  }
}

/** Vertical rounded glow bars. */
export function uniGlowBars(
  categories: string[],
  values: number[],
  opts?: { color?: string; suffix?: string },
): EChartsOption {
  const color = opts?.color ?? UNI_CHART.cyan
  return {
    grid: UNI_GRID.barV,
    tooltip: { ...UNI_TOOLTIP, trigger: 'axis', axisPointer: { type: 'shadow' } },
    xAxis: { type: 'category', data: categories, ...UNI_AXIS },
    yAxis: { type: 'value', ...UNI_AXIS, splitLine: { show: false } },
    series: [
      {
        type: 'bar',
        data: values,
        barWidth: '46%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          shadowBlur: 12,
          shadowColor: `${color}66`,
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color },
              { offset: 1, color: `${color}22` },
            ],
          },
        },
        label: {
          show: true,
          position: 'top',
          color: '#eaf4ff',
          fontSize: 14,
          formatter: opts?.suffix ? `{c}${opts.suffix}` : '{c}',
        },
      },
    ],
  }
}

/** Multi-layer glowing terrain waves. */
export function uniTerrain(
  categories: string[],
  layers: Array<{ name: string; data: number[]; color: string }>,
): EChartsOption {
  return {
    grid: { left: 6, right: 10, top: 10, bottom: 6, containLabel: true },
    tooltip: { ...UNI_TOOLTIP, trigger: 'axis' },
    xAxis: { type: 'category', data: categories, boundaryGap: false, ...UNI_AXIS, axisLabel: { ...UNI_AXIS.axisLabel, fontSize: 13 } },
    yAxis: { type: 'value', ...UNI_AXIS, splitLine: { lineStyle: { color: UNI_CHART.grid, type: 'dashed' } } },
    series: layers.map((l, i) => ({
      name: l.name,
      type: 'line',
      smooth: 0.55,
      data: l.data,
      showSymbol: false,
      z: layers.length - i,
      lineStyle: { color: l.color, width: 1.8, shadowBlur: 10, shadowColor: `${l.color}aa` },
      areaStyle: { color: areaFill(l.color), opacity: 0.9 },
    })),
  }
}

/** Thin multi-ring donut. */
export function uniDonut(
  data: Array<{ name: string; value: number }>,
  colors?: string[],
): EChartsOption {
  const palette = colors ?? [UNI_CHART.cyan, UNI_CHART.blue, UNI_CHART.green, UNI_CHART.orange, UNI_CHART.violet]
  return {
    tooltip: { ...UNI_TOOLTIP, trigger: 'item', formatter: '{b}<br/>{c}% ({d}%)' },
    legend: {
      orient: 'vertical',
      right: 0,
      top: 'middle',
      itemWidth: 8,
      itemHeight: 8,
      itemGap: 10,
      icon: 'roundRect',
      textStyle: { color: UNI_CHART.text, fontSize: 14 },
    },
    series: [
      {
        type: 'pie',
        radius: ['54%', '72%'],
        center: ['32%', '50%'],
        padAngle: 3,
        itemStyle: { borderRadius: 3, borderColor: 'rgba(6,16,32,0.9)', borderWidth: 2, shadowBlur: 8, shadowColor: 'rgba(51,217,255,0.15)' },
        label: { show: false },
        data: data.map((d, i) => ({ ...d, itemStyle: { color: palette[i % palette.length] } })),
      },
    ],
  }
}

/** Radar chart for benchmark comparison */
export function uniRadar(
  indicators: string[],
  series: Array<{ name: string; value: number[]; color?: string }>,
): EChartsOption {
  const colors = series.map((s, i) => s.color ?? [UNI_CHART.cyan, UNI_CHART.green, UNI_CHART.violet][i % 3])
  return {
    tooltip: { ...UNI_TOOLTIP },
    legend: {
      bottom: 0,
      textStyle: { color: UNI_CHART.text, fontSize: 14 },
      itemWidth: 10,
      itemHeight: 10,
    },
    radar: {
      indicator: indicators.map((name) => ({ name, max: 100 })),
      center: ['50%', '48%'],
      radius: '58%',
      axisName: { color: UNI_CHART.text, fontSize: 13 },
      splitArea: { areaStyle: { color: ['rgba(90,170,255,0.03)', 'rgba(90,170,255,0.06)'] } },
      splitLine: { lineStyle: { color: UNI_CHART.grid } },
      axisLine: { lineStyle: { color: UNI_CHART.grid } },
    },
    series: [{
      type: 'radar',
      data: series.map((s, i) => ({
        name: s.name,
        value: s.value,
        areaStyle: { color: `${colors[i]}33` },
        lineStyle: { color: colors[i], width: 2 },
        itemStyle: { color: colors[i] },
      })),
    }],
  }
}

/** Grouped vertical bars */
export function uniGroupedBars(
  categories: string[],
  series: Array<{ name: string; data: number[]; color?: string }>,
): EChartsOption {
  const palette = [UNI_CHART.cyan, UNI_CHART.orange, UNI_CHART.green]
  return {
    grid: UNI_GRID.barV,
    tooltip: { ...UNI_TOOLTIP, trigger: 'axis' },
    legend: { top: 0, textStyle: { color: UNI_CHART.text, fontSize: 14 }, itemWidth: 10, itemHeight: 10 },
    xAxis: { type: 'category', data: categories, ...UNI_AXIS },
    yAxis: { type: 'value', ...UNI_AXIS, splitLine: { show: false } },
    series: series.map((s, i) => ({
      name: s.name,
      type: 'bar',
      data: s.data,
      barWidth: '28%',
      itemStyle: { color: s.color ?? palette[i % palette.length], borderRadius: [3, 3, 0, 0] },
    })),
  }
}

/** Horizontal rounded bars with dim track. */
export function uniRoundedBars(
  labels: string[],
  values: number[],
  colors: string[],
): EChartsOption {
  return {
    grid: UNI_GRID.barH,
    xAxis: { type: 'value', show: false, max: Math.max(...values) * 1.25 },
    yAxis: { type: 'category', data: labels, ...UNI_AXIS, axisLabel: { color: UNI_CHART.text, fontSize: 15 } },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({ value: v, itemStyle: { color: colors[i], borderRadius: [0, 5, 5, 0], shadowBlur: 8, shadowColor: `${colors[i]}66` } })),
        barWidth: 12,
        showBackground: true,
        backgroundStyle: { color: 'rgba(90,170,255,0.08)', borderRadius: [0, 5, 5, 0] },
        label: { show: true, position: 'right', color: '#eaf4ff', fontSize: 15, formatter: '{c} 个' },
      },
    ],
  }
}
