<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { GrowthPortraitVM, TimelineTermVM, AcademicDevVM, CreditProgressVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  growth: GrowthPortraitVM
  timeline: TimelineTermVM[]
  academic: AcademicDevVM
  credit: CreditProgressVM
}>()

const wuyuLabels = ['德', '智', '体', '美', '劳'] as const

const latestWuyu = computed(() => {
  const last = props.timeline[props.timeline.length - 1]
  if (!last) return [85, 90, 82, 86, 88]
  return [last.wuyu.de, last.wuyu.zhi, last.wuyu.ti, last.wuyu.mei, last.wuyu.lao]
})

const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', confine: true },
  radar: {
    center: ['50%', '52%'],
    radius: '62%',
    indicator: wuyuLabels.map((n) => ({ name: n, max: 100 })),
    axisName: { color: '#c8e8ff', fontSize: 14, fontWeight: 700 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0,80,160,0.08)', 'rgba(0,40,90,0.04)'] } },
    axisLine: { lineStyle: { color: 'rgba(57,230,255,0.2)' } },
  },
  series: [{
    type: 'radar',
    data: [
      {
        value: latestWuyu.value,
        name: '当前',
        areaStyle: { color: 'rgba(0,229,255,0.22)' },
        lineStyle: { color: '#39e6ff', width: 2 },
        itemStyle: { color: '#7ff6ff' },
      },
      {
        value: props.growth.gradeAvg.slice(0, 5).length === 5
          ? props.growth.gradeAvg.slice(0, 5)
          : [82, 85, 80, 83, 81],
        name: '年级均值',
        lineStyle: { color: 'rgba(255,200,80,0.7)', type: 'dashed' },
        itemStyle: { color: '#ffd166' },
        areaStyle: { opacity: 0 },
      },
    ],
  }],
}))

const gpaOption = computed<EChartsOption>(() => ({
  grid: { left: 36, right: 12, top: 16, bottom: 22 },
  tooltip: { trigger: 'axis', confine: true },
  xAxis: {
    type: 'category',
    data: props.academic.semesters,
    axisLabel: { color: '#9ecae8', fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.25)' } },
  },
  yAxis: {
    type: 'value',
    min: 2.5,
    max: 4,
    axisLabel: { color: '#9ecae8', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: [{
    type: 'line',
    data: props.academic.gpaValues,
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { color: '#39e6ff', width: 2.5 },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(57,230,255,0.35)' },
          { offset: 1, color: 'rgba(57,230,255,0)' },
        ],
      },
    },
  }],
}))
</script>

<template>
  <div class="stu-growth-hub">
    <div class="stu-growth-hub__top">
      <div class="stu-growth-hub__radar">
        <div class="stu-growth-hub__head">德智体美劳 · 五育雷达</div>
        <ChartContainer :option="radarOption" />
      </div>
      <div class="stu-growth-hub__timeline">
        <div class="stu-growth-hub__head">四年成长轴线</div>
        <ul class="stu-timeline">
          <li v-for="node in timeline" :key="node.term" class="stu-timeline__node">
            <span class="stu-timeline__term">{{ node.term }}</span>
            <span class="stu-timeline__label">{{ node.label }}</span>
            <div class="stu-timeline__bars">
              <i v-for="(v, i) in [node.wuyu.de, node.wuyu.zhi, node.wuyu.ti, node.wuyu.mei, node.wuyu.lao]" :key="i" :style="{ height: `${v}%` }" />
            </div>
            <em v-if="node.milestone">{{ node.milestone }}</em>
          </li>
        </ul>
      </div>
    </div>

    <div class="stu-growth-hub__bottom">
      <div class="stu-growth-hub__gpa">
        <div class="stu-growth-hub__head">GPA 趋势 · 班级第 {{ academic.classRank }}/{{ academic.classTotal }}</div>
        <ChartContainer :option="gpaOption" />
      </div>
      <div class="stu-growth-hub__credits">
        <div class="stu-growth-hub__head">学业进度</div>
        <div class="stu-credit-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="48" class="stu-credit-ring__track" />
            <circle
              cx="60" cy="60" r="48"
              class="stu-credit-ring__progress"
              :style="{ strokeDashoffset: 301 - (301 * credit.earnedPercent) / 100 }"
            />
          </svg>
          <div class="stu-credit-ring__text">
            <strong>{{ credit.earnedPercent }}%</strong>
            <span>必修学分</span>
            <em>{{ credit.earned }}/{{ credit.required }}</em>
          </div>
        </div>
        <div class="stu-credit-sub">
          <span>第二课堂</span>
          <div class="stu-credit-sub__bar"><i :style="{ width: `${credit.secondPercent}%` }" /></div>
          <strong>{{ credit.secondClassroomEarned }}/{{ credit.secondClassroomRequired }}</strong>
        </div>
      </div>
    </div>
  </div>
</template>
