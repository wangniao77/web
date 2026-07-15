<script setup lang="ts">
/**
 * GPA 详情页 · 课程成绩散点气泡图
 *
 * 横轴：学期（按时间顺序）
 * 纵轴：分数（0-100）
 * 气泡大小：学分（越大表示学分越多）
 * 颜色：课程类别
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../../_shared/gpa-data'
import type { CourseCategory, CourseRecordVM } from '../../_shared/gpa-data'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  courses: CourseRecordVM[]
  semesters: string[]
}>()

interface SeriesItem {
  name: string
  color: string
  data: Array<[number, number, number, CourseRecordVM]>
}

const series = computed<SeriesItem[]>(() => {
  const map = new Map<CourseCategory, SeriesItem>()
  for (const c of props.courses) {
    if (!c.counted) continue
    if (!map.has(c.category)) {
      map.set(c.category, {
        name: CATEGORY_LABEL[c.category],
        color: CATEGORY_COLOR[c.category],
        data: [],
      })
    }
    const x = props.semesters.indexOf(c.semester)
    map.get(c.category)!.data.push([x, c.score, c.credit, c])
  }
  return Array.from(map.values())
})

const option = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.lineLegend, top: 30, bottom: 8, left: 8, right: 16 },
  tooltip: {
    trigger: 'item',
    formatter: (p: unknown) => {
      const it = p as { data: [number, number, number, CourseRecordVM] }
      const course = it.data[3]
      return `<div style="line-height:1.55">
        <b style="color:#8ef6ff">${course.name}</b><br/>
        学期：${course.semester}<br/>
        成绩：<b style="color:#f0c040">${course.score}</b> · 绩点 <b>${course.gpaPoint.toFixed(2)}</b><br/>
        学分：${course.credit} · 类别：${course.categoryLabel}
      </div>`
    },
  },
  legend: {
    top: 0,
    right: 0,
    itemWidth: 10,
    itemHeight: 8,
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 1 },
    data: series.value.map((s) => s.name),
  },
  xAxis: {
    type: 'category',
    data: props.semesters,
    axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 6 },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
  },
  yAxis: {
    type: 'value',
    min: 50,
    max: 100,
    interval: 10,
    axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 6 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: 'rgba(248, 113, 113, 0.5)', type: 'dashed' },
      label: { color: '#f87171', fontSize: 12, formatter: '预警线 75' },
      data: [{ yAxis: 75 }],
    },
  },
  series: series.value.map((s) => ({
    name: s.name,
    type: 'scatter',
    data: s.data.map((d) => [d[0], d[1], d[2]]),
    symbolSize: (val: number[]) => 12 + val[2] * 6,
    itemStyle: {
      color: s.color,
      opacity: 0.78,
      borderColor: s.color,
      borderWidth: 1,
      shadowBlur: 8,
      shadowColor: s.color,
    },
    emphasis: {
      itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 2 },
    },
  })),
}))

const totalCount = computed(() => props.courses.filter((c) => c.counted).length)
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">课程成绩散点（气泡=学分）</h3>
      <span class="chart-card__sub">共 {{ totalCount }} 门 · 颜色=类别</span>
    </header>
    <div class="chart-card__body">
      <ChartContainer :option="option" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
}
</style>
