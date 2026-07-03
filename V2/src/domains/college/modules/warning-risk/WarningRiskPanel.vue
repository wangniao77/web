<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL } from '@/styles/echarts-theme'
import type { WarningOverviewVM } from '@/domains/college/types/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: WarningOverviewVM }>()

const router = useRouter()

const typeMeta: Record<string, { icon: string; tone: string }> = {
  academic: { icon: 'icon-warning-academic', tone: 'red' },
  psychological: { icon: 'icon-warning-psych', tone: 'amber' },
  employment: { icon: 'icon-warning-job', tone: 'orange' },
  funding: { icon: 'icon-warning-funding', tone: 'yellow' },
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

function deltaText(change: number) {
  if (change > 0) return `较上月 ↑${change}人`
  if (change < 0) return `较上月 ↓${Math.abs(change)}人`
  return '较上月 持平'
}

function deltaTrend(change: number) {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'flat'
}

function openWarning(type: string) {
  router.push(ROUTES.college.warning(type))
}
</script>

<template>
  <div class="warning-panel">
    <div class="warning-panel__left">
      <div class="warning-panel__section-title">预警指标（近三个月）</div>
      <ul class="warning-panel__list">
        <li v-for="cat in data.categories" :key="cat.type">
          <button
            type="button"
            class="warning-panel__item"
            :class="`warning-panel__item--${typeMeta[cat.type]?.tone || 'amber'}`"
            @click="openWarning(cat.type)"
          >
            <div class="warning-panel__badge">
              <svg aria-hidden="true">
                <use :href="`/icons.svg#${typeMeta[cat.type]?.icon || 'icon-warning'}`" />
              </svg>
            </div>
            <div class="warning-panel__info">
              <span>{{ cat.label }}</span>
              <strong>{{ cat.count }}<small>人</small></strong>
            </div>
            <div class="warning-panel__side">
              <em class="warning-panel__delta" :class="`warning-panel__delta--${deltaTrend(cat.momChange)}`">
                {{ deltaText(cat.momChange) }}
              </em>
              <span class="warning-panel__link">查看名单 ›</span>
            </div>
          </button>
        </li>
      </ul>
    </div>
    <div class="warning-panel__charts">
      <div class="warning-panel__chart warning-panel__chart--trend">
        <div class="warning-panel__chart-title">预警趋势（近六个月）</div>
        <div class="warning-panel__chart-body">
          <ChartContainer :option="lineOption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.warning-panel__badge svg {
  width: 24px;
  height: 24px;
  color: inherit;
}
</style>
