<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineOverviewVM } from '@/types/college/view/discipline-overview'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: DisciplineOverviewVM
}>()

const changeTrend = computed(() => {
  const change = props.data.ranking.yoyChange
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'flat'
})

const changeText = computed(() => {
  const change = props.data.ranking.yoyChange
  if (change > 0) return `上升 ${change} 名`
  if (change < 0) return `下降 ${Math.abs(change)} 名`
  return '持平'
})

const trendOption = computed<EChartsOption>(() => {
  const { years, ranks, peerAvgRanks } = props.data.trend
  const allRanks = [...ranks, ...peerAvgRanks]
  const minRank = Math.max(1, Math.min(...allRanks) - 1)
  const maxRank = Math.max(...allRanks) + 1
  const currentYearIndex = years.length - 1

  return {
    grid: { left: 8, right: 8, top: 20, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
      confine: true,
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        return items.map((p: { seriesName?: string; value?: number }) =>
          `${p.seriesName ?? ''}: 第${p.value}名`,
        ).join('<br/>')
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend, fontWeight: 600 },
      data: ['专业排名', '同类平均'],
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: years,
      axisLabel: { color: '#b8dff5', fontSize: CHART_FONT.axis, fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value' as const,
      inverse: true,
      min: minRank,
      max: maxRank,
      interval: 1,
      axisLabel: {
        color: '#9ecae8',
        fontSize: CHART_FONT.axis,
        formatter: (v: number) => `第${v}名`,
      },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        name: '专业排名',
        type: 'line' as const,
        data: ranks.map((value, index) => ({
          value,
          symbolSize: index === currentYearIndex ? 12 : 7,
          itemStyle: {
            color: index === currentYearIndex ? '#ffd56a' : '#39e6ff',
            borderColor: index === currentYearIndex ? '#fff' : '#39e6ff',
            borderWidth: index === currentYearIndex ? 2 : 1,
          },
        })),
        smooth: true,
        lineStyle: { width: 3, color: '#39e6ff' },
        label: {
          show: true,
          position: 'top',
          color: '#eaf7ff',
          fontSize: CHART_FONT.label,
          fontWeight: 700,
          formatter: '第{c}名',
        },
      },
      {
        name: '同类平均',
        type: 'line' as const,
        data: peerAvgRanks,
        smooth: true,
        symbol: 'circle',
        symbolSize: 5,
        lineStyle: { width: 2, type: 'dashed', color: 'rgba(150, 200, 230, 0.55)' },
        itemStyle: { color: 'rgba(150, 200, 230, 0.7)' },
      },
    ],
  }
})

const radarOption = computed<EChartsOption>(() => {
  const dims = props.data.dimensions
  return {
    radar: {
      center: ['50%', '52%'],
      radius: '72%',
      indicator: dims.map((d) => ({ name: d.label, max: 100 })),
      axisName: {
        color: '#c6e6ff',
        fontSize: CHART_FONT.axis,
        fontWeight: 700,
        formatter: (name?: string) => {
          const item = dims.find((d) => d.label === name)
          return item ? `${name}\n${item.score}` : (name ?? '')
        },
      },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.1)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(57,230,255,0.18)' } },
    },
    series: [{
      type: 'radar' as const,
      data: [
        {
          name: '当前专业',
          value: dims.map((d) => d.score),
          areaStyle: { color: 'rgba(57,230,255,0.22)' },
          lineStyle: { width: 2, color: '#39e6ff' },
          itemStyle: { color: '#7ff6ff' },
        },
        {
          name: '同类平均',
          value: dims.map((d) => d.peerAverage),
          areaStyle: { color: 'rgba(150,200,230,0.06)' },
          lineStyle: { width: 1.5, type: 'dashed', color: 'rgba(150,200,230,0.5)' },
          itemStyle: { color: 'rgba(150,200,230,0.6)' },
        },
      ],
    }],
  }
})

function openDetail() {
  openCollegeDetail({ kind: 'discipline-detail' })
}
</script>

<template>
  <div class="discipline-overview">
    <button type="button" class="discipline-overview__detail" @click="openDetail">
      查看专业排名专题 →
    </button>

    <div class="discipline-overview__ranking">
      <div class="discipline-overview__rank discipline-overview__rank--primary">
        <span>当前排名</span>
        <strong>第 {{ data.ranking.current }} 名</strong>
      </div>
      <div
        class="discipline-overview__rank discipline-overview__rank--change"
        :class="`discipline-overview__rank--${changeTrend}`"
      >
        <span>较上年</span>
        <strong>
          <em v-if="changeTrend === 'up'">↑</em>
          <em v-else-if="changeTrend === 'down'">↓</em>
          {{ changeText }}
        </strong>
      </div>
      <div class="discipline-overview__rank">
        <span>省内排名</span>
        <strong>第 {{ data.ranking.provincial }} 名</strong>
      </div>
      <div class="discipline-overview__rank">
        <span>同类院校排名</span>
        <strong>第 {{ data.ranking.peer }} 名</strong>
      </div>
    </div>

    <div class="discipline-overview__body">
      <div class="discipline-overview__trend">
        <div class="discipline-overview__chart-title">近五年专业排名变化趋势</div>
        <div class="discipline-overview__chart">
          <ChartContainer :option="trendOption" />
        </div>
        <p class="discipline-overview__conclusion">{{ data.trend.conclusion }}</p>
      </div>

      <div class="discipline-overview__radar">
        <div class="discipline-overview__chart-title">专业竞争力五维评价</div>
        <div class="discipline-overview__chart discipline-overview__chart--radar">
          <ChartContainer :option="radarOption" />
        </div>
        <p class="discipline-overview__conclusion">{{ data.radarConclusion }}</p>
      </div>
    </div>
  </div>
</template>
