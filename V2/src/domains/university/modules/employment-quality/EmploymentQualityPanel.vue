<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import UniversityPanelBorder from '@/domains/university/components/UniversityPanelBorder.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EmploymentQualityVM } from '@/domains/university/types/view'
import { formatTrend } from '@/shared/utils/trend'

const props = defineProps<{
  data: EmploymentQualityVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const trendOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, top: 24, bottom: 24, left: 36, right: 12 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.28)',
    textStyle: { color: '#e2edff', fontSize: CHART_FONT.tooltip },
  },
  xAxis: {
    type: 'category',
    data: props.data.trend.map((t) => t.term),
    axisLabel: { color: '#8eb4d8', fontSize: CHART_FONT.axis },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.15)' } },
  },
  yAxis: {
    type: 'value',
    min: 88,
    max: 100,
    axisLabel: { color: '#8eb4d8', fontSize: CHART_FONT.axis, formatter: '{value}%' },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  series: [{
    type: 'line',
    smooth: true,
    data: props.data.trend.map((t) => t.rate),
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { color: CHART_COLORS.cyan, width: 2 },
    itemStyle: { color: CHART_COLORS.cyan },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0, 229, 255, 0.25)' },
          { offset: 1, color: 'rgba(0, 229, 255, 0.02)' },
        ],
      },
    },
  }],
}))

const pieOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  legend: {
    orient: 'vertical',
    right: 0,
    top: 'center',
    textStyle: { color: '#8eb4d8', fontSize: CHART_FONT.label },
  },
  series: [{
    type: 'pie',
    radius: ['42%', '62%'],
    center: ['38%', '50%'],
    label: { show: false },
    data: props.data.distribution.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: {
        color: [CHART_COLORS.cyan, CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green][i],
      },
    })),
  }],
}))
</script>

<template>
  <UniversityPanelBorder variant="8">
    <CollegePanelCard
      :index="3"
      title="就业与升学质量"
      :loading="loading"
      :error="error"
      show-more
      :more-to="ROUTES.university.employment"
      @retry="$emit('retry')"
    >
      <div class="employment-panel">
        <div class="kpi-row">
          <div v-for="metric in data.metrics" :key="metric.label" class="kpi-card">
            <span class="kpi-label">{{ metric.label }}</span>
            <strong class="kpi-value">{{ metric.value }}</strong>
            <em v-if="formatTrend(metric.trend)" class="kpi-trend">{{ formatTrend(metric.trend) }}</em>
          </div>
        </div>
        <div class="charts-row">
          <div class="chart-box">
            <span class="chart-title">近6学期就业率趋势</span>
            <ChartContainer :option="trendOption" />
          </div>
          <div class="chart-box">
            <span class="chart-title">就业地域分布</span>
            <ChartContainer :option="pieOption" />
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </UniversityPanelBorder>
</template>

<style scoped lang="scss">
.employment-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  gap: 8px;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  flex-shrink: 0;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 60, 120, 0.18);
  border: 1px solid rgba(0, 212, 255, 0.12);
}

.kpi-label {
  font-size: 10px;
  color: rgba(174, 198, 230, 0.72);
}

.kpi-value {
  font-size: 18px;
  font-weight: 800;
  color: #00e5ff;
  font-family: var(--university-font-number);
  line-height: 1.1;
}

.kpi-trend {
  font-size: 10px;
  font-style: normal;
  color: #37ffb1;
  font-weight: 700;
}

.charts-row {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.chart-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
  min-width: 0;
  padding: 4px;
  border-radius: 6px;
  background: rgba(0, 40, 80, 0.12);
  border: 1px solid rgba(0, 212, 255, 0.08);
}

.chart-title {
  flex-shrink: 0;
  font-size: 10px;
  color: rgba(174, 198, 230, 0.68);
  margin-bottom: 2px;
}

.chart-box :deep(.chart-container) {
  flex: 1;
  min-height: 0;
}
</style>
