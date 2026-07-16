<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { TeachingOverviewVM } from '@/types/college/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: TeachingOverviewVM }>()

const kpiIcon: Record<string, IconKind> = {
  开课门数: 'course',
  优质课程: 'award',
  实践教学: 'practice',
}

const GRID_LEFT = 104

const barOption = computed<EChartsOption>(() => {
  const maxValue = props.data.courseConstruction.reduce((acc, d) => Math.max(acc, d.value), 0)
  const axisMax = maxValue > 0 ? Math.ceil((maxValue * 1.18) / 5) * 5 : undefined
  return {
    grid: { left: GRID_LEFT, right: 36, top: 8, bottom: 8, containLabel: false },
    xAxis: { type: 'value', show: false, max: axisMax },
    yAxis: {
      type: 'category',
      inverse: true,
      data: props.data.courseConstruction.map((d) => d.name),
      axisLabel: { ...AXIS_LABEL_ALT, color: '#e8f7ff', fontSize: 12, fontWeight: 500, align: 'left', margin: GRID_LEFT - 6 },
      axisLine: { show: true, lineStyle: { color: 'rgba(57,230,255,0.45)', width: 1 } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: props.data.courseConstruction.map((d) => d.value),
      barWidth: 8,
      label: { show: true, position: 'right', distance: 6, color: '#f4fbff', fontSize: 12, fontWeight: 700, formatter: '{c}门' },
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
  openCollegeDetail({ kind: 'teaching' })
}
</script>

<template>
  <div class="teaching-grid">
    <div class="kpi-row kpi-row--auto">
      <button
        v-for="metric in data.metrics"
        :key="metric.label"
        type="button"
        class="metric-card metric-card--sm metric-card--balance metric-card--clickable"
        @click="openDetail"
      >
        <span class="metric-card__icon">
          <DashIcon :kind="kpiIcon[metric.label] || 'course'" :size="16" />
        </span>
        <span class="metric-card__label">{{ metric.label }}</span>
        <strong class="metric-card__value">{{ metric.value }}</strong>
      </button>
    </div>
    <div class="teaching-chart-full">
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <span class="chart-frame__title">课程建设</span>
          <button type="button" class="chart-frame__link" @click="openDetail">查看详情 ›</button>
        </div>
        <div class="chart-frame__body chart-frame__body--tall">
          <ChartContainer :option="barOption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.metric-card--clickable {
  cursor: pointer;
  border: 1px solid transparent;
  font: inherit;
  text-align: left;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 120, 255, 0.18);
  }
}
</style>
