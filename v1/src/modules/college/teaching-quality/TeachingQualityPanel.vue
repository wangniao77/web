<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { TeachingOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: TeachingOverviewVM }>()

const router = useRouter()

const barOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.barH,
  xAxis: { type: 'value', show: false },
  yAxis: {
    type: 'category',
    data: props.data.courseConstruction.map((d) => d.name).reverse(),
    axisLabel: { ...AXIS_LABEL_ALT, width: 56, overflow: 'truncate' },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    data: props.data.courseConstruction.map((d) => d.value).reverse(),
    barWidth: 10,
    label: { show: true, position: 'right', distance: 4, color: CHART_COLORS.gold, fontSize: CHART_FONT.label },
    itemStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: 'rgba(255,193,7,0.3)' },
          { offset: 1, color: CHART_COLORS.gold },
        ],
      },
      borderRadius: [0, 3, 3, 0],
    },
  }],
}))

function openDetail() {
  router.push(ROUTES.college.teachingCourses)
}
</script>

<template>
  <div class="teaching-grid">
    <div class="kpi-row kpi-row--auto">
      <div v-for="metric in data.metrics" :key="metric.label" class="metric-card metric-card--sm metric-card--balance">
        <span class="metric-card__label">{{ metric.label }}</span>
        <strong class="metric-card__value">{{ metric.value }}</strong>
      </div>
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
