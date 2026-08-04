<script setup lang="ts">
/**
 * GPA 详情页 · 课程成绩散点概览
 *
 * 横轴：学期 · 纵轴：分数 · 气泡大小：学分 · 颜色：课程类别
 * 逐课明细已移至 /student/gpa-semester
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../../_shared/gpa-data'
import type { CourseCategory, CourseRecordVM } from '../../_shared/gpa-data'
import type { EChartsOption } from 'echarts'
import { ROUTES } from '@/constants/routes'

const props = defineProps<{
  courses: CourseRecordVM[]
  semesters: string[]
}>()

const router = useRouter()

interface SeriesItem {
  name: string
  color: string
  data: Array<[number, number, number, CourseRecordVM]>
}

function lightenHex(hex: string, amt = 0.4): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

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

function jitterSeed(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 1000) / 1000 - 0.5
}

/** 同学期内按成绩排序后横向均匀铺开，避免挤成一竖条 */
const series = computed<SeriesItem[]>(() => {
  const counted = props.courses.filter((c) => c.counted)
  const bySem = new Map<string, CourseRecordVM[]>()
  for (const c of counted) {
    if (!bySem.has(c.semester)) bySem.set(c.semester, [])
    bySem.get(c.semester)!.push(c)
  }
  for (const list of bySem.values()) {
    list.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'zh'))
  }

  const map = new Map<CourseCategory, SeriesItem>()
  for (const [semester, list] of bySem) {
    const xBase = props.semesters.indexOf(semester)
    if (xBase < 0) continue
    const n = list.length
    list.forEach((c, i) => {
      if (!map.has(c.category)) {
        map.set(c.category, {
          name: CATEGORY_LABEL[c.category],
          color: CATEGORY_COLOR[c.category],
          data: [],
        })
      }
      // 学期带内横向均匀分布（约 ±0.38），再加轻微抖动避免完全对齐
      const slot = n <= 1 ? 0 : (i / (n - 1)) * 2 - 1
      const jx = slot * 0.38 + jitterSeed(c.id ?? c.name) * 0.06
      const jy = jitterSeed((c.id ?? c.name) + 'y') * 1.2
      map.get(c.category)!.data.push([xBase + jx, c.score + jy, c.credit, c])
    })
  }
  return Array.from(map.values())
})

const WARNING_SCORE = 75
const totalCount = computed(() => props.courses.filter((c) => c.counted).length)

const option = computed<EChartsOption>(() => ({
  grid: { top: 44, bottom: 36, left: 48, right: 22, containLabel: false },
  tooltip: {
    trigger: 'item',
    confine: true,
    backgroundColor: 'rgba(6, 20, 44, 0.94)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
    borderWidth: 1,
    textStyle: { color: '#dcefff', fontSize: 18 },
    formatter: (p: unknown) => {
      const it = p as { data: [number, number, number, CourseRecordVM] }
      const course = it.data[3]
      if (!course) return ''
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
    top: 2,
    right: 8,
    itemWidth: 12,
    itemHeight: 12,
    itemGap: 14,
    icon: 'circle',
    textStyle: { color: '#9eefff', fontSize: Math.max(14, CHART_FONT.legend) },
    data: series.value.map((s) => s.name),
  },
  xAxis: {
    type: 'value',
    min: -0.55,
    max: Math.max(0, props.semesters.length - 1) + 0.55,
    interval: 1,
    axisTick: { show: false },
    axisLabel: {
      ...AXIS_LABEL,
      fontSize: 18,
      margin: 12,
      color: '#b8dff2',
      fontWeight: 700,
      formatter: (v: number) => {
        const i = Math.round(v)
        if (Math.abs(v - i) > 0.2) return ''
        return props.semesters[i] ?? ''
      },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
    splitLine: {
      show: true,
      lineStyle: { color: 'rgba(0, 212, 255, 0.06)', type: 'dashed' },
    },
  },
  yAxis: {
    type: 'value',
    name: '分数',
    nameTextStyle: { color: '#9ec7e0', fontSize: 17, padding: [0, 0, 0, -24], fontWeight: 700 },
    min: 55,
    max: 100,
    interval: 5,
    axisLabel: { ...AXIS_LABEL, fontSize: 17, margin: 10, color: '#9ec7e0' },
    axisLine: { show: false },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.07)' } },
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: 'rgba(248, 113, 113, 0.55)', type: 'dashed', width: 1.5 },
      label: { color: '#f87171', fontSize: 16, formatter: `预警线 ${WARNING_SCORE}`, position: 'insideEndTop' },
      data: [{ yAxis: WARNING_SCORE }],
    },
  },
  series: series.value.map((s, idx) => ({
    name: s.name,
    type: 'scatter',
    data: s.data,
    symbolSize: (val: number[]) => Math.min(22, 9 + val[2] * 3.2),
    itemStyle: {
      color: bubbleColor(s.color),
      opacity: 0.78,
      borderColor: lightenHex(s.color, 0.35),
      borderWidth: 1,
    },
    emphasis: {
      scale: 1.35,
      focus: 'series',
      itemStyle: { opacity: 1, borderColor: '#ffffff', borderWidth: 2, shadowBlur: 14, shadowColor: s.color },
    },
    ...(idx === 0
      ? {
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(248, 113, 113, 0.07)' },
            label: {
              show: true,
              position: 'insideTopLeft',
              color: 'rgba(248, 113, 113, 0.7)',
              fontSize: 15,
              formatter: '预警区',
            },
            data: [[{ yAxis: 55 }, { yAxis: WARNING_SCORE }]],
          },
        }
      : {}),
  })),
}))

function gotoSemester() {
  router.push(ROUTES.student.gpaSemester)
}
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">课程成绩分布</h3>
      <span class="chart-card__sub">共 {{ totalCount }} 门 · 气泡=学分 · 颜色=类别</span>
      <button type="button" class="chart-card__link" @click="gotoSemester">
        逐课明细 →
      </button>
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
  font-size: 24px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 16px;
  color: rgba(184, 236, 255, 0.55);
}

.chart-card__link {
  flex-shrink: 0;
  padding: 2px 10px;
  border: 1px solid rgba(0, 212, 255, 0.35);
  border-radius: 4px;
  background: rgba(0, 184, 255, 0.1);
  color: #66d9ff;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(0, 184, 255, 0.22);
    border-color: rgba(0, 212, 255, 0.6);
  }
}

.chart-card__body {
  flex: 1;
  min-height: 0;
}
</style>
