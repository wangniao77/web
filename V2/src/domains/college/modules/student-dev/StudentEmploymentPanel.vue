<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { StudentOverviewVM } from '@/domains/college/types/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: StudentOverviewVM }>()

const router = useRouter()

const pieOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  legend: { show: false },
  series: [{
    type: 'pie',
    radius: ['36%', '56%'],
    center: ['50%', '52%'],
    label: { show: false },
    data: props.data.employmentDirection.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: [CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green, CHART_COLORS.purple][i],
      },
    })),
  }],
}))

const regionOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.barH, left: 96 },
  xAxis: { type: 'value', show: false, max: 50 },
  yAxis: {
    type: 'category',
    data: ['境外', '省外其他', '北京/上海', '珠三角其他', '深圳', '广州'],
    axisLabel: AXIS_LABEL_ALT,
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    data: [4, 7, 9, 15, 23, 42],
    barWidth: 12,
    label: { show: true, position: 'right', formatter: '{c}%', color: CHART_COLORS.gold, fontSize: CHART_FONT.label },
    itemStyle: { color: CHART_COLORS.blue, borderRadius: [0, 3, 3, 0] },
  }],
}))

function openDetail() {
  router.push(ROUTES.college.studentEmployment)
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
        <span class="metric-card__label">{{ metric.label }}</span>
        <strong class="metric-card__value">{{ metric.value }}</strong>
      </div>
    </div>
    <div class="split-charts">
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <span class="chart-frame__title">就业情况</span>
          <button type="button" class="chart-frame__link" @click="openDetail">查看详情 ›</button>
        </div>
        <div class="chart-frame__body chart-frame__body--tall">
          <ChartContainer :option="pieOption" />
        </div>
      </div>
      <div class="chart-frame chart-frame--teaching">
        <div class="chart-frame__head">
          <span class="chart-frame__title">就业分布（地区排行）</span>
          <button type="button" class="chart-frame__link" @click="openDetail">查看详情 ›</button>
        </div>
        <div class="chart-frame__body chart-frame__body--tall">
          <ChartContainer :option="regionOption" />
        </div>
      </div>
    </div>
  </div>
</template>
