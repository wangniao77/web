<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { CHART_FONT, AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { ResearchOverviewVM } from '@/types/college/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: ResearchOverviewVM }>()

const GRID_LEFT = 104

const barOption = computed<EChartsOption>(() => {
  const maxValue = props.data.platforms.reduce((acc, d) => Math.max(acc, d.count), 0)
  const axisMax = maxValue > 0 ? Math.ceil((maxValue * 1.18) / 5) * 5 : undefined
  return {
    grid: { left: GRID_LEFT, right: 24, top: 8, bottom: 8, outerBoundsMode: 'none' },
    xAxis: { type: 'value', show: false, max: axisMax },
    yAxis: {
      type: 'category',
      inverse: true,
      data: props.data.platforms.map((d) => d.name),
      axisLabel: { ...AXIS_LABEL_ALT, color: '#e8f7ff', fontSize: 20, fontWeight: 500, align: 'left', margin: GRID_LEFT - 6 },
      axisLine: { show: true, lineStyle: { color: 'rgba(57,230,255,0.45)', width: 1 } },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: props.data.platforms.map((d) => d.count),
      barWidth: 8,
      label: { show: true, position: 'right', distance: 4, color: '#f4fbff', fontSize: CHART_FONT.label, fontWeight: 700, formatter: '{c}个' },
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
  openCollegeDetail({ kind: 'research' })
}
</script>

<template>
  <div class="research-grid">
    <div class="research-kpis research-kpis--auto">
      <button
        v-for="metric in data.metrics.slice(0, 4)"
        :key="metric.label"
        type="button"
        class="research-kpi research-kpi--clickable"
        @click="openDetail"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <em
          v-if="metric.trend"
          class="research-kpi__trend"
          :class="`research-kpi__trend--${metric.trend.direction}`"
        >
          {{ metric.trend.direction === 'up' ? '↑' : metric.trend.direction === 'down' ? '↓' : '' }}{{ metric.trend.value }}{{ metric.trend.unit || '' }}
        </em>
      </button>
    </div>
    <div class="research-chart-full">
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <span class="chart-frame__title">团队平台</span>
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
.research-kpi--clickable {
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

.research-kpi__trend {
  font-size: 24px;
  font-style: normal;

  &--up { color: #34d399; }
  &--down { color: #f87171; }
  &--flat { color: #889ec2; }
}
</style>
