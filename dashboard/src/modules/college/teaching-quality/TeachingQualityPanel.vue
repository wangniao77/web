<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import MetricCard from '@/components/metrics/MetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL_ALT } from '@/styles/echarts-theme'
import type { TeachingOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: TeachingOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const lineOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.line,
  xAxis: {
    type: 'category',
    data: props.data.evaluationTrend.years,
    axisLabel: AXIS_LABEL_ALT,
    axisLine: { lineStyle: { color: 'rgba(0,136,255,0.25)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    min: 85,
    max: 100,
    axisLabel: AXIS_LABEL_ALT,
    splitLine: { lineStyle: { color: 'rgba(0,136,255,0.08)' } },
  },
  series: [
    {
      type: 'line',
      data: props.data.evaluationTrend.values,
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: CHART_COLORS.blue, width: 2 },
      itemStyle: { color: CHART_COLORS.blue, borderColor: '#000b2b', borderWidth: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,212,255,0.25)' },
            { offset: 1, color: 'rgba(0,212,255,0)' },
          ],
        },
      },
    },
  ],
}))

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
  series: [
    {
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
    },
  ],
}))
</script>

<template>
  <CollegePanelCard
    :index="4"
    title="教学质量与教学运行"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="teaching-panel">
      <div class="metrics-row">
        <MetricCard
          v-for="m in data.metrics"
          :key="m.label"
          variant="bordered"
          :label="m.label"
          :value="m.value"
        />
      </div>
      <div class="charts-row">
        <div class="chart-box">
          <span class="chart-label">评教趋势（2021-2025）</span>
          <ChartContainer :option="lineOption" />
        </div>
        <div class="chart-box">
          <span class="chart-label">课程建设</span>
          <ChartContainer :option="barOption" />
        </div>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.teaching-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.charts-row {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
}

.chart-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.chart-label {
  font-size: $college-fs-label;
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 2px solid #42d8ff;
}
</style>
