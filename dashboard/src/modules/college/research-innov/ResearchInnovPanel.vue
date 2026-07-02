<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import MetricCard from '@/components/metrics/MetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL } from '@/styles/echarts-theme'
import type { ResearchOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: ResearchOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const lineOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.lineLegend,
  legend: {
    top: 4,
    right: 0,
    itemGap: 10,
    textStyle: { color: '#889ec2', fontSize: CHART_FONT.legend },
    itemWidth: 12,
    itemHeight: 8,
  },
  xAxis: {
    type: 'category',
    data: props.data.fundingTrend.years,
    axisLabel: AXIS_LABEL,
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: AXIS_LABEL,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
  series: props.data.fundingTrend.series.map((s, i) => ({
    name: s.name,
    type: 'line',
    data: s.data,
    smooth: true,
    symbol: 'circle',
    symbolSize: 4,
    lineStyle: { width: 2 },
    itemStyle: { color: [CHART_COLORS.blue, CHART_COLORS.gold][i] },
  })),
}))
</script>

<template>
  <CollegePanelCard
    :index="5"
    icon="icon-research"
    title="科研创新与团队平台"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="research-panel">
      <div class="metrics-row">
        <MetricCard
          v-for="m in data.metrics"
          :key="m.label"
          variant="bordered"
          :label="m.label"
          :value="m.value"
          :trend="m.trend"
        />
      </div>
      <div class="bottom-row">
        <div class="chart-box">
          <span class="chart-label">科研经费趋势</span>
          <ChartContainer :option="lineOption" />
        </div>
        <ul class="platform-list">
          <li v-for="p in data.platforms" :key="p.name" class="platform-item">
            <svg class="plat-icon" aria-hidden="true">
              <use href="/icons.svg#icon-platform" />
            </svg>
            <span class="plat-name">{{ p.name }}</span>
            <em>{{ p.count }}</em>
          </li>
        </ul>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.research-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.bottom-row {
  flex: 1;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
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

.platform-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.platform-item {
  display: grid;
  grid-template-columns: 18px 1fr auto;
  align-items: center;
  gap: 8px;
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.72);
  padding: 8px 10px;
  background:
    linear-gradient(90deg, rgba(0, 184, 255, 0.08), rgba(255, 255, 255, 0.015));
  border-left: 2px solid #42d8ff;
  border-radius: 0 7px 7px 0;
  transition: background $transition-fast, border-color $transition-fast;

  &:hover {
    background: rgba(0, 184, 255, 0.09);
    border-left-color: #f4c84f;
  }

  em {
    font-style: normal;
    font-family: var(--college-font-number);
    font-size: $college-fs-body;
    color: #f4c84f;
    font-weight: 700;
  }
}

.plat-icon {
  width: 14px;
  height: 14px;
  color: $color-accent-purple;
  opacity: 0.7;
}
</style>
