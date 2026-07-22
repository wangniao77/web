<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { StudentOverviewVM } from '@/types/college/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: StudentOverviewVM }>()

const kpiIcon: Record<string, IconKind> = {
  学生就业满意度: 'satisfaction',
  就业率: 'placement',
}

const pieColors = ['#39e6ff', '#0d71ff', '#ffb82e', '#30d7a4', '#7a8cff']

const pieOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: 20 },
    formatter: '{b}<br />{c}%',
    confine: true,
  },
  legend: {
    orient: 'horizontal',
    bottom: 0,
    left: 'center',
    width: '96%',
    itemWidth: 11,
    itemHeight: 9,
    itemGap: 10,
    textStyle: { color: '#d8efff', fontSize: 20, fontWeight: 500 },
  },
  series: [{
    type: 'pie',
    radius: ['42%', '62%'],
    center: ['50%', '42%'],
    avoidLabelOverlap: true,
    labelLine: { show: false },
    data: props.data.employmentDirection.map((d, i) => ({
      name: d.name,
      value: d.value,
      label: { show: false },
      itemStyle: { color: pieColors[i % pieColors.length] },
    })),
  }],
}))

const GRID_LEFT = 96

const regionOption = computed<EChartsOption>(() => {
  const regions = props.data.employmentRegions
  const maxValue = Math.max(...regions.map((r) => r.value), 1)
  const axisMax = Math.ceil((maxValue * 1.18) / 5) * 5
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 20 },
      formatter: '{b}: {c}%',
      confine: true,
    },
    grid: { left: GRID_LEFT, right: 36, top: 8, bottom: 8, outerBoundsMode: 'none' },
    xAxis: { type: 'value', show: false, max: axisMax },
    yAxis: {
      type: 'category',
      inverse: true,
      data: regions.map((r) => r.name),
      axisLabel: { color: '#e8f7ff', fontSize: 20, fontWeight: 500, align: 'left', margin: GRID_LEFT - 6 },
      axisLine: { show: true, lineStyle: { color: 'rgba(57,230,255,0.45)', width: 1 } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: regions.map((r) => r.value),
      barWidth: 8,
      label: { show: true, position: 'right', distance: 6, formatter: '{c}%', color: '#f4fbff', fontSize: 20, fontWeight: 700 },
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#65f7ff' },
            { offset: 1, color: '#126dff' },
          ],
        },
        borderRadius: 6,
        shadowBlur: 6,
        shadowColor: 'rgba(57,230,255,0.45)',
      },
    }],
  }
})

function openDetail() {
  openCollegeDetail({ kind: 'employment' })
}
</script>

<template>
  <div class="student-work-grid">
    <div class="kpi-row kpi-row--auto">
      <div
        v-for="metric in data.metrics.slice(0, 2)"
        :key="metric.label"
        class="metric-card metric-card--sm metric-card--balance"
      >
        <span class="metric-card__icon">
          <DashIcon :kind="kpiIcon[metric.label] || 'satisfaction'" :size="16" />
        </span>
        <span class="metric-card__label">{{ metric.label }}</span>
        <strong class="metric-card__value">{{ metric.value }}</strong>
      </div>
    </div>
    <div class="split-charts">
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <button type="button" class="chart-frame__title chart-frame__title--link" @click="openDetail">就业情况 ›</button>
        </div>
        <div class="chart-frame__body chart-frame__body--tall">
          <ChartContainer :option="pieOption" />
        </div>
      </div>
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <button type="button" class="chart-frame__title chart-frame__title--link" @click="openDetail">就业分布（地区排行）›</button>
        </div>
        <div class="chart-frame__body chart-frame__body--tall">
          <ChartContainer :option="regionOption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-frame__title--link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: color 0.2s;

  &:hover {
    color: #7fe9ff;
  }
}
</style>
