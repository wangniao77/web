<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { ResearchOverviewVM } from '@/domains/college/types/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: ResearchOverviewVM }>()

const router = useRouter()

const barOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.barH, left: 96 },
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: props.data.platforms.map((d) => d.name).reverse(),
    axisLabel: { ...AXIS_LABEL_ALT, width: 88, overflow: 'truncate' },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    data: props.data.platforms.map((d) => d.count).reverse(),
    barWidth: 12,
    label: { show: true, position: 'right', distance: 4, color: CHART_COLORS.gold, fontSize: CHART_FONT.label, formatter: '{c}个' },
    itemStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: 'rgba(0,212,255,0.25)' },
          { offset: 1, color: CHART_COLORS.blue },
        ],
      },
      borderRadius: [0, 3, 3, 0],
    },
  }],
}))

function openDetail() {
  router.push(ROUTES.college.researchPlatforms)
}
</script>

<template>
  <div class="research-grid">
    <div class="research-kpis research-kpis--auto">
      <div v-for="metric in data.metrics.slice(0, 4)" :key="metric.label" class="research-kpi">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
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
