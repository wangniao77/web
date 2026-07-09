<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { mockEntranceScores } from '@/mock/college/school-kpi'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { StudentOverviewVM } from '@/types/college/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  student: StudentOverviewVM
}>()

const pieColors = ['#39e6ff', '#0d71ff', '#ffb82e', '#30d7a4', '#7a8cff']

const entranceOption = computed<EChartsOption>(() => {
  const scores = mockEntranceScores
  const maxScore = Math.max(...scores.map((s) => s.avgScore))
  const minScore = Math.min(...scores.map((s) => s.avgScore))
  const axisMin = Math.floor(minScore - 8)
  const axisMax = Math.ceil(maxScore + 4)
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 12 },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const idx = (row as { dataIndex: number }).dataIndex
        const item = scores[idx]
        return `${item.major}<br/>录取均分：${item.avgScore}<br/>一志愿率：${item.firstChoiceRate}%`
      },
      confine: true,
    },
    grid: { left: 8, right: 12, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: 'category',
      data: scores.map((s) => s.major.replace('科学与技术', '…').replace('管理与应用', '…')),
      axisLabel: { color: '#c6e6ff', fontSize: 10, interval: 0, rotate: 18 },
      axisLine: { lineStyle: { color: 'rgba(80,180,255,0.3)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: axisMin,
      max: axisMax,
      axisLabel: { color: '#c6e6ff', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [{
      type: 'bar',
      data: scores.map((s) => s.avgScore),
      barWidth: 12,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#65f7ff' },
            { offset: 1, color: '#126dff' },
          ],
        },
      },
      label: {
        show: true,
        position: 'top',
        color: '#eaf7ff',
        fontSize: 10,
        fontWeight: 700,
      },
    }],
  }
})

const outcomeOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: 12 },
    formatter: '{b}<br />{c}%',
    confine: true,
  },
  legend: {
    orient: 'horizontal',
    bottom: 0,
    left: 'center',
    itemWidth: 8,
    itemHeight: 8,
    textStyle: { color: '#d8efff', fontSize: 10 },
  },
  series: [{
    type: 'pie',
    radius: ['38%', '58%'],
    center: ['50%', '44%'],
    label: { show: false },
    labelLine: { show: false },
    data: props.student.employmentDirection.map((d, i) => ({
      name: d.name,
      value: d.value,
      itemStyle: { color: pieColors[i % pieColors.length] },
    })),
  }],
}))

function openEmployment() {
  openCollegeDetail({ kind: 'employment' })
}
</script>

<template>
  <div class="student-io-slide">
    <div class="student-io-slide__block student-io-slide__block--entrance">
      <div class="student-io-slide__head">
        <span class="student-io-slide__tag student-io-slide__tag--in">入口</span>
        <span class="student-io-slide__title">入学成绩（录取均分）</span>
      </div>
      <div class="student-io-slide__chart">
        <ChartContainer :option="entranceOption" />
      </div>
    </div>

    <div class="student-io-slide__block student-io-slide__block--outcome">
      <div class="student-io-slide__head">
        <span class="student-io-slide__tag student-io-slide__tag--out">出口</span>
        <button type="button" class="student-io-slide__title student-io-slide__title--link" @click="openEmployment">
          毕业去向 ›
        </button>
      </div>
      <div class="student-io-slide__chart student-io-slide__chart--tall">
        <ChartContainer :option="outcomeOption" @chart-click="openEmployment" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.student-io-slide__title--link {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font: inherit;
  color: inherit;
  transition: color 0.2s;

  &:hover {
    color: #7fe9ff;
  }
}
</style>
