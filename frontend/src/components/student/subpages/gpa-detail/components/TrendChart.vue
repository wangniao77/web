<script setup lang="ts">
/**
 * GPA 详情页 · 学期 GPA / 平均分 趋势（双轴折线图）
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { SemesterSummaryVM } from '../../_shared/gpa-data'

const props = defineProps<{
  semesters: SemesterSummaryVM[]
}>()

const axisCompact = { ...AXIS_LABEL, fontSize: 13, margin: 6 }

const option = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.lineLegend, top: 30, bottom: 4, left: 8, right: 8 },
  tooltip: {
    trigger: 'axis',
    formatter: (params: unknown) => {
      const arr = params as Array<{ axisValue: string; seriesName: string; value: number; marker: string }>
      if (!Array.isArray(arr) || !arr.length) return ''
      const lines = arr.map((p) =>
        `${p.marker}${p.seriesName}：${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}`,
      )
      return `${arr[0].axisValue}<br/>${lines.join('<br/>')}`
    },
  },
  legend: {
    top: 0,
    right: 0,
    itemWidth: 10,
    itemHeight: 8,
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 1 },
    data: ['学期 GPA', '学期均分'],
  },
  xAxis: {
    type: 'category',
    data: props.semesters.map((s) => s.semester),
    axisLabel: axisCompact,
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
  },
  yAxis: [
    {
      type: 'value',
      name: 'GPA',
      min: 2.0,
      max: 4.0,
      interval: 0.5,
      axisLabel: { ...axisCompact, formatter: '{value}' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    {
      type: 'value',
      name: '均分',
      min: 60,
      max: 100,
      interval: 10,
      axisLabel: axisCompact,
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '学期 GPA',
      type: 'line',
      smooth: true,
      yAxisIndex: 0,
      data: props.semesters.map((s) => s.gpa),
      lineStyle: { color: CHART_COLORS.gold, width: 2.5 },
      itemStyle: { color: CHART_COLORS.gold },
      symbol: 'circle',
      symbolSize: 7,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(240, 192, 64, 0.28)' },
            { offset: 1, color: 'rgba(240, 192, 64, 0)' },
          ],
        },
      },
    },
    {
      name: '学期均分',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: props.semesters.map((s) => s.averageScore),
      lineStyle: { color: CHART_COLORS.cyan, width: 2.5 },
      itemStyle: { color: CHART_COLORS.cyan },
      symbol: 'circle',
      symbolSize: 7,
    },
  ],
}))
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">学期 GPA / 平均分 趋势</h3>
      <span class="chart-card__sub">双轴对比 · 反映整体学业走势</span>
    </header>
    <div class="chart-card__body">
      <ChartContainer :option="option" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
}
</style>
