<script setup lang="ts">
/**
 * 课程难度适应分析
 * 成绩-难度散点图：X = 课程难度（0-100），Y = 成绩（0-100）
 * 颜色区分课程类型；高难+高分区高亮为"优势区"
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_FONT, AXIS_LABEL } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CourseCategory } from '../../_shared/gpa-data'
import { CATEGORY_LABEL, CATEGORY_COLOR } from '../../_shared/gpa-data'
import ChartCard from './ChartCard.vue'

export interface CoursePoint {
  id: string
  name: string
  score: number
  credit: number
  category: CourseCategory
  categoryLabel: string
  difficulty: number
}

const props = defineProps<{ points: CoursePoint[] }>()

const CAT_ORDER: CourseCategory[] = [
  'major-core', 'major-base', 'elective', 'general', 'humanity', 'art', 'practice',
]

const series = computed(() =>
  CAT_ORDER
    .filter((c) => props.points.some((p) => p.category === c))
    .map((c) => ({
      name: CATEGORY_LABEL[c],
      type: 'scatter' as const,
      symbolSize: 13,
      itemStyle: {
        color: CATEGORY_COLOR[c],
        opacity: 0.85,
        borderColor: 'rgba(255,255,255,0.5)',
        borderWidth: 0.5,
      },
      emphasis: { scale: 1.4, itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 1.5 } },
      data: props.points
        .filter((p) => p.category === c)
        .map((p) => ({ value: [p.difficulty, p.score], name: p.name, p })),
    })),
)

function diffLabel(d: number): string {
  if (d >= 65) return '困难'
  if (d >= 50) return '中等'
  return '简单'
}

const option = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 18, top: 38, bottom: 28, containLabel: true },
  tooltip: {
    trigger: 'item',
    confine: true,
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    textStyle: { color: '#e2edff', fontSize: 13 },
    formatter: (p: unknown) => {
      const it = p as { data: { name: string; p: CoursePoint } }
      const c = it.data.p
      return `<div style="line-height:1.6">
        <b style="color:#8ef6ff">${c.name}</b><br/>
        成绩：<b style="color:${c.score < 75 ? '#f87171' : '#f0c040'}">${c.score}</b> 分<br/>
        难度：${diffLabel(c.difficulty)}（${c.difficulty}）<br/>
        学分：${c.credit} · ${c.categoryLabel}
      </div>`
    },
  },
  legend: {
    top: 2, left: 0, itemWidth: 10, itemHeight: 10, itemGap: 10, icon: 'circle',
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 3 },
    data: series.value.map((s) => s.name),
  },
  xAxis: {
    type: 'value',
    name: '课程难度 →',
    nameLocation: 'middle',
    nameGap: 24,
    nameTextStyle: { color: '#7fb4d4', fontSize: 12 },
    min: 30, max: 95,
    axisLabel: { ...AXIS_LABEL, fontSize: 12, color: '#9ec7e0', formatter: diffLabel },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  yAxis: {
    type: 'value',
    name: '成绩',
    min: 50, max: 100,
    nameTextStyle: { color: '#7fb4d4', fontSize: 12 },
    axisLabel: { ...AXIS_LABEL, fontSize: 12, color: '#9ec7e0' },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  series: [
    {
      type: 'scatter',
      silent: true,
      data: [],
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(52, 211, 153, 0.08)' },
        label: { show: true, position: 'insideTopLeft', color: 'rgba(52,211,153,0.7)', fontSize: 11, formatter: '优势区（高难·高分）' },
        data: [[{ xAxis: 65, yAxis: 80 }, { xAxis: 95, yAxis: 100 }]],
      },
    },
    ...series.value,
  ],
}))

const insight = computed(() => {
  const high = props.points.filter((p) => p.difficulty >= 65)
  const low = props.points.filter((p) => p.difficulty < 65)
  const highAvg = high.length ? Math.round(high.reduce((s, p) => s + p.score, 0) / high.length) : 0
  const lowAvg = low.length ? Math.round(low.reduce((s, p) => s + p.score, 0) / low.length) : 0
  if (!high.length) return '当前高难度课程样本较少，暂无法评估难度适应性。'
  if (highAvg >= lowAvg) {
    return `高难度课程均分 ${highAvg}，高于普通课程 ${lowAvg} 分，学生在高难度专业课程中保持优秀表现，啃硬骨头能力强。`
  }
  return `高难度课程均分 ${highAvg}，低于普通课程 ${lowAvg} 分，高难度课程存在提升空间，建议加强专业核心课投入。`
})
</script>

<template>
  <ChartCard title="课程难度适应分析" sub="成绩 vs 课程难度">
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
