<script setup lang="ts">
/**
 * 成绩结构分析
 * 按课程类别 × 分数段（≥90 / 80-89 / 70-79 / <70）堆叠柱状图
 * 自动生成洞察：优势来自哪类课程
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, AXIS_LABEL } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CourseRecordVM, CourseCategory } from '../../_shared/gpa-data'
import { CATEGORY_LABEL } from '../../_shared/gpa-data'
import ChartCard from './ChartCard.vue'

const props = defineProps<{ courses: CourseRecordVM[] }>()

interface Band { key: string; label: string; color: string; test: (s: number) => boolean }
const bands: Band[] = [
  { key: 'excellent', label: '≥90', color: CHART_COLORS.green, test: (s) => s >= 90 },
  { key: 'good', label: '80-89', color: CHART_COLORS.blue, test: (s) => s >= 80 && s < 90 },
  { key: 'medium', label: '70-79', color: CHART_COLORS.gold, test: (s) => s >= 70 && s < 80 },
  { key: 'low', label: '<70', color: CHART_COLORS.red, test: (s) => s < 70 },
]

const CAT_ORDER: CourseCategory[] = [
  'major-core', 'major-base', 'elective', 'general', 'humanity', 'art', 'practice',
]

const categories = computed(() => {
  const present = new Set(props.courses.filter((c) => c.counted).map((c) => c.category))
  return CAT_ORDER.filter((c) => present.has(c)).map((c) => CATEGORY_LABEL[c])
})

const series = computed(() =>
  bands.map((b) => ({
    name: b.label,
    type: 'bar' as const,
    stack: 'total',
    barWidth: '58%',
    itemStyle: { color: b.color, borderRadius: [0, 0, 0, 0] as number[] },
    emphasis: { focus: 'series' as const },
    data: categories.value.map((catLabel) => {
      const cat = (Object.keys(CATEGORY_LABEL) as CourseCategory[])
        .find((k) => CATEGORY_LABEL[k] === catLabel)!
      return props.courses.filter(
        (c) => c.counted && c.category === cat && b.test(c.score),
      ).length
    }),
  })),
)

const option = computed<EChartsOption>(() => ({
  grid: { left: 6, right: 36, top: 34, bottom: 6, containLabel: true },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    confine: true,
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    textStyle: { color: '#e2edff', fontSize: 13 },
  },
  legend: {
    top: 2,
    left: 0,
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12,
    icon: 'roundRect',
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 2 },
    data: bands.map((b) => b.label),
  },
  xAxis: {
    type: 'value',
    name: '课程数',
    nameTextStyle: { color: '#7fb4d4', fontSize: 11, padding: [0, 0, 0, -22] },
    axisLabel: { ...AXIS_LABEL, fontSize: 12, color: '#9ec7e0' },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  yAxis: {
    type: 'category',
    data: categories.value,
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, fontSize: 13, color: '#cfe8ff' },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
  },
  series: series.value,
}))

const insight = computed(() => {
  const counted = props.courses.filter((c) => c.counted)
  if (!counted.length) return '暂无课程成绩数据'
  const avgByCat = CAT_ORDER
    .filter((c) => counted.some((x) => x.category === c))
    .map((c) => {
      const list = counted.filter((x) => x.category === c)
      const avg = list.reduce((s, x) => s + x.score, 0) / list.length
      return { label: CATEGORY_LABEL[c], avg: Math.round(avg * 10) / 10, count: list.length }
    })
  if (avgByCat.length < 2) return `${avgByCat[0]?.label ?? ''}课程均分 ${avgByCat[0]?.avg ?? '—'}。`
  const best = [...avgByCat].sort((a, b) => b.avg - a.avg)[0]
  const worst = [...avgByCat].sort((a, b) => a.avg - b.avg)[0]
  const coreAvg = avgByCat.find((c) => c.label === '专业核心')?.avg
  const genAvg = avgByCat.find((c) => c.label === '通识必修')?.avg
  let tail = ''
  if (coreAvg != null && genAvg != null) {
    tail = coreAvg >= genAvg
      ? '专业核心课程表现优于通识课程，专业方向匹配度较高。'
      : '通识课程表现优于专业核心课程，建议加强专业核心课投入。'
  }
  return `「${best.label}」表现最佳（均分 ${best.avg}），「${worst.label}」相对薄弱（均分 ${worst.avg}）。${tail}`
})
</script>

<template>
  <ChartCard title="成绩结构分析" sub="按课程类别 × 分数段">
    <ChartContainer :option="option" />
    <template #footer>
      <p class="insight"><span class="insight__tag">分析</span>{{ insight }}</p>
    </template>
  </ChartCard>
</template>

<style scoped lang="scss">
.insight {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #bfe2f5;

  &__tag {
    display: inline-block;
    margin-right: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    vertical-align: middle;
  }
}
</style>
