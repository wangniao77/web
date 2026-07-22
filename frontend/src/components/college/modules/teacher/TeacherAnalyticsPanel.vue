<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { TeacherAnalyticsVM } from '@/types/college/view/teacher-analytics'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: TeacherAnalyticsVM
}>()

const titleBarOption = computed<EChartsOption>(() => {
  const items = props.data.titleStructure
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 2, right: 16, top: 4, bottom: 2, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value' as const,
      max: Math.ceil(maxVal * 1.12),
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => i.title),
      axisLabel: { color: '#d8efff', fontSize: CHART_FONT.axis, fontWeight: 600 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map((i) => i.count),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        fontWeight: 700,
        formatter: '{c}人',
      },
      itemStyle: {
        borderRadius: [0, 5, 5, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1a8cff' },
            { offset: 1, color: '#5cecff' },
          ],
        },
      },
    }],
  }
})

const profileOption = computed<EChartsOption>(() => ({
  radar: {
    center: ['50%', '54%'],
    radius: '68%',
    indicator: [
      { name: '教学', max: 100 },
      { name: '科研', max: 100 },
      { name: '社会服务', max: 100 },
    ],
    axisName: { color: '#c6e6ff', fontSize: CHART_FONT.axis, fontWeight: 700 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.12)' } },
    splitArea: { show: false },
    axisLine: { lineStyle: { color: 'rgba(57,230,255,0.2)' } },
  },
  series: [{
    type: 'radar' as const,
    data: [{
      value: [
        props.data.profile.teaching,
        props.data.profile.research,
        props.data.profile.socialService,
      ],
      areaStyle: { color: 'rgba(57,230,255,0.18)' },
      lineStyle: { width: 2, color: '#39e6ff' },
      itemStyle: { color: '#7ff6ff' },
    }],
  }],
}))

function formatChange(value: number) {
  if (value > 0) return `↑${value}`
  if (value < 0) return `↓${Math.abs(value)}`
  return '—'
}

function openDetail() {
  openCollegeDetail({ kind: 'teacher-detail' })
}
</script>

<template>
  <div class="teacher-analytics-slide">
    <button type="button" class="teacher-analytics-slide__detail" @click="openDetail">
      查看教师专题分析 →
    </button>

    <div class="teacher-analytics-slide__kpis">
      <div class="teacher-analytics-slide__kpi">
        <span>教师总数</span>
        <strong>{{ data.summary.totalTeachers }}<small>人</small></strong>
      </div>
      <div class="teacher-analytics-slide__kpi">
        <span>博士占比</span>
        <strong>{{ data.summary.phdRatio }}<small>%</small></strong>
      </div>
      <div class="teacher-analytics-slide__kpi teacher-analytics-slide__kpi--excellent">
        <span>优秀教师</span>
        <strong>{{ data.summary.excellentCount }}<small>人</small></strong>
      </div>
      <div class="teacher-analytics-slide__kpi teacher-analytics-slide__kpi--warn">
        <span>考核预警</span>
        <strong>{{ data.summary.warningCount }}<small>人</small></strong>
      </div>
    </div>

    <div class="teacher-analytics-slide__middle">
      <div class="teacher-analytics-slide__chart">
        <div class="teacher-analytics-slide__chart-title">师资梯队概览</div>
        <ChartContainer :option="titleBarOption" />
      </div>
      <div class="teacher-analytics-slide__chart">
        <div class="teacher-analytics-slide__chart-title">教师综合画像</div>
        <ChartContainer :option="profileOption" />
      </div>
    </div>

    <div class="teacher-analytics-slide__bottom">
      <div class="teacher-analytics-slide__groups">
        <button type="button" class="teacher-analytics-slide__group teacher-analytics-slide__group--excellent" @click="openDetail">
          <span>优秀教师</span>
          <strong>{{ data.groups.excellent.count }}<small>人</small></strong>
          <em>{{ data.groups.excellent.ratio }}% · {{ formatChange(data.groups.excellent.momChange) }}</em>
        </button>
        <button type="button" class="teacher-analytics-slide__group teacher-analytics-slide__group--warn" @click="openDetail">
          <span>考核预警</span>
          <strong>{{ data.groups.warning.count }}<small>人</small></strong>
          <em>{{ data.groups.warning.ratio }}% · {{ formatChange(data.groups.warning.momChange) }}</em>
        </button>
      </div>
      <div class="teacher-analytics-slide__highlights">
        <div
          v-for="item in data.highlights"
          :key="item.label"
          class="teacher-analytics-slide__highlight"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>
