<script setup lang="ts">
/**
 * 课程能力雷达图（替代原"课程能力分布散点图"）
 * 六维能力画像：专业知识 / 工程实践 / 数学基础 / 创新能力 / 通识素养 / 学习稳定性
 * 维度分值由课程成绩按类别聚合得出（0-100）。
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CourseCategory } from '../../_shared/gpa-data'
import type { CoursePoint } from './DifficultyScatter.vue'
import ChartCard from './ChartCard.vue'

const props = defineProps<{ points: CoursePoint[]; stabilityIndex: number }>()

function avgOf(cats: CourseCategory[]): number {
  const list = props.points.filter((p) => cats.includes(p.category))
  if (!list.length) return 60
  return Math.round(list.reduce((s, p) => s + p.score, 0) / list.length)
}

const dims = computed(() => [
  avgOf(['major-core']),
  avgOf(['practice']),
  avgOf(['major-base']),
  avgOf(['elective', 'humanity']),
  avgOf(['general', 'humanity', 'art']),
  Math.max(0, Math.min(100, Math.round(props.stabilityIndex))),
])

const indicators = [
  { name: '专业知识', max: 100 },
  { name: '工程实践', max: 100 },
  { name: '数学基础', max: 100 },
  { name: '创新能力', max: 100 },
  { name: '通识素养', max: 100 },
  { name: '学习稳定性', max: 100 },
]

const option = computed<EChartsOption>(() => ({
  tooltip: {
    confine: true,
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    textStyle: { color: '#e2edff', fontSize: 13 },
  },
  radar: {
    indicator: indicators,
    center: ['50%', '54%'],
    radius: '66%',
    axisName: { color: '#bfe2f5', fontSize: 13, fontWeight: 600 },
    splitNumber: 4,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: {
      areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'rgba(0, 184, 255, 0.08)'] },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
  },
  series: [
    {
      type: 'radar',
      symbolSize: 5,
      data: [
        {
          value: dims.value,
          name: '能力画像',
          lineStyle: { color: '#00e5ff', width: 2 },
          itemStyle: { color: '#00e5ff' },
          areaStyle: { color: 'rgba(0, 229, 255, 0.22)' },
        },
      ],
    },
  ],
}))
</script>

<template>
  <ChartCard title="课程能力雷达图" sub="六维能力画像">
    <ChartContainer :option="option" />
  </ChartCard>
</template>

<style scoped lang="scss">
:deep(.chart-card__body) {
  font-size: 13px;
}
</style>
