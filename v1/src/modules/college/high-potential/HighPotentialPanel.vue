<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_GRID, AXIS_LABEL } from '@/styles/echarts-theme'
import type { HighPotentialOverviewVM } from '@/types/view/college/details'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: HighPotentialOverviewVM
}>()

const router = useRouter()

const trendOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.line,
  xAxis: {
    type: 'category',
    data: props.data.summary.trend.months,
    axisLabel: AXIS_LABEL,
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: AXIS_LABEL,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
  series: [{
    type: 'line',
    data: props.data.summary.trend.counts,
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    lineStyle: { color: CHART_COLORS.blue, width: 2 },
    itemStyle: { color: CHART_COLORS.blue },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0,212,255,0.22)' },
          { offset: 1, color: 'rgba(0,212,255,0)' },
        ],
      },
    },
  }],
}))

function openModule(moduleId: string) {
  router.push(ROUTES.college.highPotential(moduleId))
}
</script>

<template>
  <div class="high-potential high-potential--overview">
    <div class="hp-overview-head">
      <div class="hp-overview-head__stats">
        <div>
          <span>高潜学生总数</span>
          <strong>{{ data.summary.total }}<small>人</small></strong>
        </div>
        <div>
          <span>本学期变化</span>
          <strong class="up">{{ data.summary.change }}</strong>
        </div>
        <div>
          <span>高潜覆盖率</span>
          <strong>{{ data.summary.coverage }}</strong>
        </div>
      </div>
      <div class="hp-overview-head__chart">
        <div class="chart-frame__title">高潜人数增长趋势</div>
        <div class="hp-overview-head__chart-body">
          <ChartContainer :option="trendOption" />
        </div>
      </div>
    </div>

    <p class="hp-overview-tip">点击下列维度卡片，进入详情页查看完整数据</p>

    <div class="hp-overview-grid">
      <button
        v-for="module in data.modules"
        :key="module.id"
        type="button"
        class="hp-overview-card"
        @click="openModule(module.id)"
      >
        <span class="hp-overview-card__title">{{ module.title }}</span>
        <span class="hp-overview-card__metric">
          {{ module.cardMetric.value }}
          <small v-if="module.cardMetric.unit">{{ module.cardMetric.unit }}</small>
        </span>
        <span class="hp-overview-card__label">{{ module.cardMetric.label }}</span>
        <span class="hp-overview-card__hint">查看详情 →</span>
      </button>
    </div>
  </div>
</template>
