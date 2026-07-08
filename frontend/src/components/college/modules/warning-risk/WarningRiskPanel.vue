<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { isCollegeSimulatedWarning } from '@/constants/college/simulated-modules'
import type { WarningOverviewVM } from '@/types/college/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: WarningOverviewVM }>()

const typeMeta: Record<string, { icon: IconKind; tone: string }> = {
  academic: { icon: 'failRate', tone: 'red' },
  psychological: { icon: 'mental', tone: 'amber' },
  employment: { icon: 'jobSupport', tone: 'orange' },
  credit: { icon: 'credit', tone: 'yellow' },
}

const AXIS_BRIGHT = { color: '#e8f7ff', fontSize: 14, fontWeight: 500 as const }
const LEGEND_STYLE = { color: '#d8efff', fontSize: 14, fontWeight: 500 as const }

const lineColors: Record<string, string> = {
  心理: '#ffd166',
  就业: '#39e6ff',
}

const lineOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: 13 },
    confine: true,
  },
  legend: {
    top: 2,
    right: 4,
    itemWidth: 10,
    itemHeight: 6,
    textStyle: LEGEND_STYLE,
    data: ['心理', '就业'],
  },
  grid: { left: 40, right: 14, top: 28, bottom: 22 },
  xAxis: {
    type: 'category',
    data: props.data.trend.months,
    boundaryGap: false,
    axisLabel: AXIS_BRIGHT,
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.32)' } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    axisLabel: AXIS_BRIGHT,
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.32)' } },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: props.data.trend.series.map((s) => {
    const color = lineColors[s.name] ?? '#39e6ff'
    return {
      name: s.name,
      type: 'line' as const,
      data: s.data,
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 2.5, color, shadowBlur: 10, shadowColor: color },
      itemStyle: { color, borderColor: '#fff', borderWidth: 1, shadowBlur: 8, shadowColor: color },
      emphasis: { focus: 'series' as const },
    }
  }),
}))

function barGradient(top: string, bottom: string) {
  return {
    type: 'linear' as const,
    x: 0, y: 0, x2: 0, y2: 1,
    colorStops: [{ offset: 0, color: top }, { offset: 1, color: bottom }],
  }
}

const creditOption = computed<EChartsOption>(() => {
  const cc = props.data.creditCompletion
  const mkSeries = (name: string, data: number[], normalTop: string, normalBottom: string) => ({
    name,
    type: 'bar' as const,
    barMaxWidth: 18,
    barGap: '35%',
    barCategoryGap: '32%',
    data: data.map((v) => ({
      value: v,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: v < cc.threshold
          ? barGradient('#ff8a4a', '#ff3b3b')
          : barGradient(normalTop, normalBottom),
      },
    })),
    label: {
      show: true,
      position: 'top' as const,
      formatter: '{c}%',
      color: '#eaf7ff',
      fontSize: 11,
      fontWeight: 700,
    },
  })
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (v) => `${v}%` },
    legend: { top: 2, right: 4, itemWidth: 10, itemHeight: 6, textStyle: LEGEND_STYLE, data: ['大三', '大四'] },
    grid: { left: 42, right: 14, top: 30, bottom: 26, containLabel: false },
    xAxis: {
      type: 'category',
      data: cc.categories,
      axisLabel: { color: '#e8f7ff', fontSize: 13, lineHeight: 16, fontWeight: 500 },
      axisLine: { lineStyle: { color: 'rgba(80,180,255,0.32)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_BRIGHT, formatter: '{value}%' },
      axisLine: { lineStyle: { color: 'rgba(80,180,255,0.32)' } },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [
      mkSeries('大三', cc.junior, '#5fd0ff', '#0d71ff'),
      mkSeries('大四', cc.senior, '#6effc2', '#12a86e'),
    ],
  }
})

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
  openCollegeDetail({ kind: 'warning', id: type })
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
              <DashIcon :kind="typeMeta[cat.type]?.icon || 'warning'" :size="22" />
            </div>
            <div class="warning-panel__info">
              <span class="warning-panel__label-row">
                {{ cat.label }}
                <em
                  v-if="isCollegeSimulatedWarning(cat.type)"
                  class="sim-data-badge sim-data-badge--sm"
                  title="接口尚未对接，当前为模拟演示数据"
                >
                  模拟数据
                </em>
              </span>
              <strong>{{ cat.count }}<small>人</small></strong>
            </div>
            <div class="warning-panel__side">
              <em class="warning-panel__delta" :class="`warning-panel__delta--${deltaTrend(cat.momChange)}`">
                {{ deltaText(cat.momChange) }}
              </em>
            </div>
          </button>
        </li>
      </ul>
    </div>
    <div class="warning-panel__charts">
      <div class="warning-panel__chart warning-panel__chart--trend">
        <div class="warning-panel__chart-title">
          预警趋势（近六个月）
          <em
            v-if="isCollegeSimulatedWarning('psychological')"
            class="sim-data-badge sim-data-badge--sm"
            title="心理预警趋势为模拟数据"
          >
            心理·模拟
          </em>
        </div>
        <div class="warning-panel__chart-body">
          <ChartContainer :option="lineOption" />
        </div>
      </div>
      <div class="warning-panel__chart warning-panel__chart--credit">
        <button type="button" class="warning-panel__chart-title warning-panel__chart-title--link" @click="openWarning('credit')">
          第二课堂学分完成率（大三 / 大四）›
        </button>
        <div class="warning-panel__chart-body">
          <ChartContainer :option="creditOption" @chart-click="openWarning('credit')" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.warning-panel__badge svg {
  width: 26px;
  height: 26px;
  color: inherit;
}

.warning-panel__chart-title--link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  transition: color 0.2s;

  &:hover {
    color: #7fe9ff;
  }
}

.warning-panel__chart--credit .warning-panel__chart-body {
  cursor: pointer;
}
</style>
