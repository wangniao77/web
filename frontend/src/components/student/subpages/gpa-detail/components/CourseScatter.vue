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

/** 把 hex 颜色按比例向白色提亮，得到气泡高光色 */
function lightenHex(hex: string, amt = 0.4): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

/** 气泡填充：径向渐变（中心高光 → 类别色边缘），比纯色更有质感 */
function bubbleColor(base: string) {
  return {
    type: 'radial' as const,
    x: 0.35,
    y: 0.3,
    r: 0.85,
    colorStops: [
      { offset: 0, color: lightenHex(base, 0.5) },
      { offset: 1, color: base },
    ],
  }
}

/** 确定性抖动：同一学期、同分数的课程错开避免完全重叠 */
function jitterSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5
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
    const seed = c.id ?? c.name
    const jx = jitterSeed(seed) * 0.34
    const jy = jitterSeed(seed + 'y') * 2.2
    map.get(c.category)!.data.push([x + jx, c.score + jy, c.credit, c])
  }
  return Array.from(map.values())
})

const WARNING_SCORE = 75

const option = computed<EChartsOption>(() => ({
  grid: { top: 40, bottom: 28, left: 40, right: 18, containLabel: false },
  tooltip: {
    trigger: 'item',
    confine: true,
    backgroundColor: 'rgba(6, 20, 44, 0.94)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
    borderWidth: 1,
    textStyle: { color: '#dcefff', fontSize: 13 },
    formatter: (p: unknown) => {
      const it = p as { data: [number, number, number, CourseRecordVM] }
      const course = it.data[3]
      const danger = course.score < WARNING_SCORE
      return `<div style="line-height:1.6">
        <b style="color:#8ef6ff">${course.name}</b><br/>
        学期：${course.semester}<br/>
        成绩：<b style="color:${danger ? '#f87171' : '#f0c040'}">${course.score}</b> · 绩点 <b>${course.gpaPoint.toFixed(2)}</b><br/>
        学分：${course.credit} · 类别：${course.categoryLabel}
      </div>`
    },
  },
  legend: {
    top: 4,
    right: 4,
    itemWidth: 11,
    itemHeight: 11,
    itemGap: 12,
    icon: 'circle',
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 1 },
    data: series.value.map((s) => s.name),
  },
  xAxis: {
    type: 'category',
    data: props.semesters,
    boundaryGap: true,
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 10, color: '#9ec7e0' },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: '分数',
    nameTextStyle: { color: '#7fb4d4', fontSize: 12, padding: [0, 0, 0, -28] },
    min: 50,
    max: 100,
    interval: 10,
    axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 8, color: '#9ec7e0' },
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.07)' } },
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: 'rgba(248, 113, 113, 0.55)', type: 'dashed', width: 1.5 },
      label: { color: '#f87171', fontSize: 12, formatter: `预警线 ${WARNING_SCORE}`, position: 'insideEndTop' },
      data: [{ yAxis: WARNING_SCORE }],
    },
  },
  series: series.value.map((s, idx) => ({
    name: s.name,
    type: 'scatter',
    data: s.data.map((d) => [d[0], d[1], d[2]]),
    symbolSize: (val: number[]) => Math.min(42, 12 + val[2] * 6),
    itemStyle: {
      color: bubbleColor(s.color),
      opacity: 0.9,
      borderColor: lightenHex(s.color, 0.3),
      borderWidth: 1,
    },
    emphasis: {
      scale: 1.18,
      itemStyle: { opacity: 1, borderColor: '#ffffff', borderWidth: 2, shadowBlur: 14, shadowColor: s.color },
    },
    ...(idx === 0
      ? {
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(248, 113, 113, 0.07)' },
            label: { show: true, position: 'insideTopLeft', color: 'rgba(248, 113, 113, 0.7)', fontSize: 11, formatter: '预警区' },
            data: [[{ yAxis: 50 }, { yAxis: WARNING_SCORE }]],
          },
        }
      : {}),
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
  font-size: 18px;
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
