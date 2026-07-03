<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import DashIcon, { type IconKind } from '@/domains/college/components/DashIcon.vue'
import { openCollegeDetail } from '@/domains/college/modules/detail-modal/useCollegeDetail'
import { AXIS_LABEL } from '@/styles/echarts-theme'
import type { HighPotentialOverviewVM } from '@/domains/college/types/view/details'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: HighPotentialOverviewVM
}>()

const moduleIcon: Record<string, IconKind> = {
  academic: 'academic',
  competition: 'trophy',
  leadership: 'community',
  rural: 'event',
  internship: 'briefcase',
  career: 'placement',
}

const trendOption = computed<EChartsOption>(() => {
  const counts = props.data.summary.trend.counts
  const minVal = Math.min(...counts)
  const maxVal = Math.max(...counts)
  const yMin = Math.max(0, Math.floor((minVal - (maxVal - minVal) * 0.6) / 50) * 50)
  const yMax = Math.ceil((maxVal + (maxVal - minVal) * 0.25) / 50) * 50
  return {
    grid: { left: 8, right: 18, top: 16, bottom: 6, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 13 },
      formatter: '{b}<br />高潜人数：{c}人',
      confine: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.summary.trend.months,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { lineStyle: { color: 'rgba(80,180,255,0.3)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [{
      type: 'line',
      data: counts,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: {
        width: 3,
        shadowBlur: 12,
        shadowColor: 'rgba(0,229,255,0.55)',
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#65f7ff' },
            { offset: 1, color: '#3aa0ff' },
          ],
        },
      },
      itemStyle: { color: '#7ff6ff', borderColor: '#fff', borderWidth: 1.5, shadowBlur: 8, shadowColor: 'rgba(0,229,255,0.6)' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0,229,255,0.35)' },
            { offset: 1, color: 'rgba(0,229,255,0)' },
          ],
        },
      },
    }],
  }
})

function openModule(moduleId: string) {
  openCollegeDetail({ kind: 'high-potential', id: moduleId })
}

function openOverview() {
  openCollegeDetail({ kind: 'high-potential-overview' })
}
</script>

<template>
  <div class="high-potential high-potential--overview">
    <div class="hp-overview-head">
      <div class="hp-overview-head__stats hp-overview-head__stats--clickable" @click="openOverview">
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

    <p class="hp-overview-tip">点击顶部统计或下列维度卡片，弹出详情窗口查看完整数据</p>

    <div class="hp-overview-grid">
      <button
        v-for="module in data.modules"
        :key="module.id"
        type="button"
        class="hp-overview-card"
        @click="openModule(module.id)"
      >
        <span class="hp-overview-card__icon">
          <DashIcon :kind="moduleIcon[module.id] || 'potential'" :size="20" />
        </span>
        <span class="hp-overview-card__title">{{ module.title }}</span>
        <span class="hp-overview-card__metric">
          {{ module.cardMetric.value }}
          <small v-if="module.cardMetric.unit">{{ module.cardMetric.unit }}</small>
        </span>
        <span class="hp-overview-card__label">{{ module.cardMetric.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hp-overview-head__stats--clickable {
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.18s, box-shadow 0.18s;

  &:hover {
    background: rgba(0, 130, 230, 0.1);
    box-shadow: 0 0 0 1px rgba(0, 200, 255, 0.25);
  }
}
</style>
