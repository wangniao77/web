<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL } from '@/styles/echarts-theme'
import type { WarningOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: WarningOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const typeMeta: Record<string, { icon: string; color: string }> = {
  academic:       { icon: 'icon-warning-academic', color: '#f87171' },
  psychological:  { icon: 'icon-warning-psych',    color: '#f0a030' },
  employment:     { icon: 'icon-warning-job',       color: '#fb923c' },
  funding:        { icon: 'icon-warning-funding',   color: '#f59e0b' },
}

const lineOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.lineLegend,
  legend: {
    top: 4,
    itemGap: 12,
    textStyle: { color: '#889ec2', fontSize: CHART_FONT.legend },
    itemWidth: 10,
    itemHeight: 6,
  },
  xAxis: {
    type: 'category',
    data: props.data.trend.months,
    axisLabel: AXIS_LABEL,
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: AXIS_LABEL,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
  series: props.data.trend.series.map((s, i) => ({
    name: s.name,
    type: 'line',
    data: s.data,
    smooth: true,
    symbol: 'none',
    lineStyle: { width: 2 },
    itemStyle: {
      color: [CHART_COLORS.blue, CHART_COLORS.green, CHART_COLORS.gold, CHART_COLORS.red][i],
    },
  })),
}))
</script>

<template>
  <CollegePanelCard
    :index="6"
    icon="icon-warning"
    title="预警与风险监测"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="warning-panel">
      <div class="category-grid">
        <div
          v-for="cat in data.categories"
          :key="cat.type"
          class="category-item"
        >
          <div class="cat-header">
            <svg class="cat-icon" aria-hidden="true">
              <use :href="`/icons.svg#${typeMeta[cat.type]?.icon || 'icon-warning'}`" />
            </svg>
            <span class="cat-label">{{ cat.label }}</span>
          </div>
          <div class="cat-bottom">
            <span class="cat-count">{{ cat.count }}<small>人</small></span>
            <span
              class="cat-change"
              :class="cat.momChange > 0 ? 'trend-up' : cat.momChange < 0 ? 'trend-down' : 'trend-flat'"
            >
              较上月{{ cat.momChange > 0 ? '+' : '' }}{{ cat.momChange }}
            </span>
          </div>
        </div>
      </div>
      <div class="chart-box">
        <span class="chart-label">近6月预警趋势</span>
        <ChartContainer :option="lineOption" />
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.warning-panel {
  height: 100%;
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: 14px;
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
  align-content: center;
}

.category-item {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 11px 11px 9px;
  background:
    linear-gradient(145deg, rgba(248, 113, 113, 0.075), rgba(240, 160, 48, 0.035)),
    rgba(8, 18, 45, 0.5);
  border: 1px solid rgba(248, 179, 84, 0.16);
  border-radius: 7px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.035);
  transition: border-color $transition-fast, background $transition-fast, box-shadow $transition-fast;

  &:hover {
    border-color: rgba(248, 179, 84, 0.32);
    background:
      linear-gradient(145deg, rgba(248, 113, 113, 0.1), rgba(240, 160, 48, 0.05)),
      rgba(8, 18, 45, 0.58);
    box-shadow: 0 0 15px rgba(240, 160, 48, 0.07);
  }
}

.cat-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.cat-icon {
  width: 16px;
  height: 16px;
  color: $color-warning;
  flex-shrink: 0;
}

.cat-label {
  font-size: $college-fs-body;
  color: rgba(220, 232, 248, 0.74);
}

.cat-bottom {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.cat-count {
  font-family: var(--college-font-number);
  font-size: $college-fs-hero;
  font-weight: 700;
  color: #f4c84f;
  line-height: 1;

  small {
    font-size: $college-fs-meta;
    font-weight: 400;
    color: $color-text-muted;
    margin-left: 2px;
  }
}

.cat-change {
  font-size: $college-fs-meta;
  white-space: nowrap;
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
  border-left: 2px solid #f4c84f;
}
</style>
