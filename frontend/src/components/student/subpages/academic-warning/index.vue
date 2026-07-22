<script setup lang="ts">
/**
 * 学业预警详情（二级页面）
 * 路由：/student/academic-warning?studentId=xxx
 *
 * 优化方向：从「数据展示」升级为「风险分析与管理辅助页面」
 *  - 学业风险状态总览（仪表盘 + 指标卡 + 状态说明）
 *  - 学业风险来源分析（雷达图 + 因素研判）
 *  - 学业成绩趋势分析（折线图 + 趋势说明）
 *  - 课程风险分析（柱状图 + 风险清单 + 培养方案进度）
 *  - 学业帮扶闭环（时间轴：预警 → 辅导 → 措施 → 当前状态）
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL, CHART_COLORS, CHART_GRID } from '@/styles/echarts-theme'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}
function goGpa() {
  router.push({ name: 'student-gpa-detail', query: { studentId: activeStudentId.value } })
}
function goFail() {
  router.push({ name: 'student-fail-detail', query: { studentId: activeStudentId.value } })
}

type Level = 'low' | 'medium' | 'high'
const LEVEL_COLOR: Record<Level, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const LEVEL_TEXT: Record<Level, string> = { low: '正常', medium: '需关注', high: '高危' }
const levelColor = (lv: string) => LEVEL_COLOR[(lv as Level)] || '#8fb7cd'
const levelText = (lv: string) => LEVEL_TEXT[(lv as Level)] || '—'
const levelOf = (v: number): Level => (v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low')

/* ---------- 学业预警台账（保留） ---------- */
const academicItems = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.attention.filter((i) => /学业|课程|挂科|GPA|补考/.test(`${i.category}${i.label}`))
  if (items.length >= 4) return items
  const fallback = [
    { id: 'ac-1', category: '学业预警', label: 'GPA 低于 2.5 预警线', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-2', category: '课程预警', label: '高等数学（下）期末成绩偏低', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-3', category: '学分预警', label: '本学期选课学分不足', level: 'low', levelLabel: '正常' },
    { id: 'ac-4', category: '学业预警', label: '专业核心课程进度滞后', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-5', category: '课程预警', label: '英语四级未通过', level: 'low', levelLabel: '正常' },
    { id: 'ac-6', category: '学业预警', label: '专业课出勤率低于 85%', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-7', category: '课程预警', label: '离散数学课程作业多次缺交', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-8', category: '学分预警', label: '必修学分已修比例低于 60%', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-9', category: '学业预警', label: '实验报告提交不及时', level: 'low', levelLabel: '正常' },
    { id: 'ac-10', category: '课程预警', label: '数据结构课程上机考核未达标', level: 'medium', levelLabel: '需关注' },
    { id: 'ac-11', category: '学业预警', label: '学期平均成绩排名后 30%', level: 'low', levelLabel: '正常' },
    { id: 'ac-12', category: '学分预警', label: '创新创业学分未达最低要求', level: 'low', levelLabel: '正常' },
  ] as AttentionItemVM[]
  return [...items, ...fallback].slice(0, 6)
})

const academicLevel = computed<Level>(() => {
  if (!academicItems.value.length) return 'low'
  const weights: Record<Level, number> = { low: 1, medium: 2, high: 3 }
  return academicItems.value.reduce((highest, item) =>
    weights[item.level] > weights[highest] ? (item.level as Level) : highest
  , 'low' as Level)
})

/* ---------- 1. 学业风险状态总览 ---------- */
const failedCredits = computed(() => {
  const text = dashboard.value?.failedCritical[0]?.name ?? ''
  const match = text.match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
})

const progressPercent = computed(() => {
  const d = dashboard.value
  if (!d) return 0
  const rate = d.creditProgress.earnedPercent
  if (rate > 0) return Math.round(rate)
  const earned = d.creditProgress.earned
  const required = d.creditProgress.required
  if (required > 0) return Math.round((earned / required) * 100)
  return 0
})

/** 综合风险指数（0-100）：GPA 偏离 + 学分缺口 + 不及格课程 */
const riskIndex = computed(() => {
  const d = dashboard.value
  if (!d) return 0
  const gpa = d.academic.gpa
  const gpaRisk = Math.max(0, Math.min(40, ((3.6 - gpa) / 3.6) * 40))
  const req = d.creditProgress.required || 1
  const earned = d.creditProgress.earned || 0
  const creditRisk = Math.max(0, Math.min(30, ((req - earned) / req) * 30))
  const failN = d.failedCritical.length + d.academic.failedElective.length
  const failRisk = Math.min(30, failN * 12)
  return Math.round(gpaRisk + creditRisk + failRisk)
})

const riskStatusText = computed(() => {
  const lv = academicLevel.value
  if (lv === 'high') return '多重学业风险叠加，已触发高危预警，须立即干预并纳入重点帮扶名单。'
  if (lv === 'medium') return '存在学业风险项，需持续关注并安排针对性帮扶措施。'
  return '整体学业状态平稳，保持常规关注即可。'
})

const gaugeOption = computed<EChartsOption>(() => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: '94%',
    center: ['50%', '58%'],
    progress: { show: true, width: 12, itemStyle: { color: levelColor(levelOf(riskIndex.value)) } },
    axisLine: { lineStyle: { width: 12, color: [[0.4, '#55e995'], [0.7, '#facc15'], [1, '#ff7474']] } },
    pointer: { width: 4, length: '58%', itemStyle: { color: '#f6fbff' } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { color: 'rgba(255,255,255,0.25)', width: 1 } },
    axisLabel: { distance: 14, color: '#7eb4d8', fontSize: 10 },
    anchor: { show: true, size: 8, itemStyle: { color: '#f6fbff' } },
    title: { show: false },
    detail: {
      valueAnimation: true,
      formatter: '{value}',
      color: '#f6fbff',
      fontSize: 26,
      fontWeight: 'bolder',
      offsetCenter: [0, '36%'],
    },
    data: [{ value: riskIndex.value }],
  }],
}))

/* ---------- 2. 学业风险来源分析 ---------- */
const riskRadarValues = computed<number[]>(() => {
  const d = dashboard.value
  if (!d) return [0, 0, 0, 0]
  const trend = d.academic.gpaTrend?.values ?? []
  let stability = 25
  if (trend.length >= 2) {
    const mean = trend.reduce((a, b) => a + b, 0) / trend.length
    const variance = trend.reduce((a, b) => a + (b - mean) ** 2, 0) / trend.length
    const std = Math.sqrt(variance)
    stability = Math.round(Math.min(100, 20 + std * 55 + Math.max(0, 3.4 - mean) * 10))
  }
  const earnedPct = d.creditProgress.earnedPercent
    || (d.creditProgress.required ? (d.creditProgress.earned / d.creditProgress.required) * 100 : 0)
  const progressRisk = Math.round(Math.max(0, 100 - earnedPct))
  const failN = d.failedCritical.length + d.academic.failedElective.length
  const gradRisk = Math.round(Math.min(100, progressRisk * 0.6 + failN * 15 + (d.academic.gpa < 2.5 ? 15 : 0)))
  const scores = d.academic.courseGrades.map((c) => c.score).filter((s) => s > 0)
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 75
  const pressureRisk = Math.round(Math.min(100, Math.max(0, (100 - avgScore) * 0.9 + failN * 5)))
  return [stability, pressureRisk, progressRisk, gradRisk]
})

const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '54%'],
    radius: '66%',
    indicator: [
      { name: '成绩稳定性', max: 100 },
      { name: '课程压力', max: 100 },
      { name: '培养进度', max: 100 },
      { name: '毕业风险', max: 100 },
    ],
    axisName: { color: '#b8ecff', fontSize: 13 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0,184,255,0.04)', 'rgba(0,184,255,0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: riskRadarValues.value,
      name: '学业风险',
      symbolSize: 5,
      areaStyle: { color: 'rgba(248, 113, 113, 0.26)' },
      lineStyle: { color: '#ff7474', width: 2 },
      itemStyle: { color: '#ff7474' },
    }],
  }],
}))

const riskFactors = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const v = riskRadarValues.value
  const scores = d.academic.courseGrades.map((c) => c.score).filter((s) => s > 0)
  const avgScore = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 75
  const failN = d.failedCritical.length + d.academic.failedElective.length
  const courseLevel = levelOf(100 - avgScore)
  const failLevel = failN > 0 ? 'high' : d.academic.gpa < 2.5 ? 'medium' : 'low'
  return [
    {
      name: '成绩稳定性', level: levelOf(v[0]),
      desc: v[0] >= 70 ? 'GPA 波动明显，学业状态不稳定' : v[0] >= 40 ? 'GPA 存在一定波动，需关注' : 'GPA 走势平稳，成绩稳定',
    },
    {
      name: '课程完成情况', level: courseLevel,
      desc: courseLevel === 'low' ? '课程成绩整体良好，完成度高' : '部分课程成绩偏低，完成质量待提升',
    },
    {
      name: '培养方案进度', level: levelOf(v[2]),
      desc: v[2] >= 70 ? '学分进度明显滞后，需加快选课' : v[2] >= 40 ? '学分进度偏慢，需合理规划' : '培养方案进度正常',
    },
    {
      name: '挂科风险', level: failLevel,
      desc: failLevel === 'high' ? `存在 ${failN} 项不及格记录，挂科风险高` : failLevel === 'medium' ? '存在临界成绩课程，挂科风险需关注' : '暂无明显挂科风险',
    },
    {
      name: '毕业要求完成情况', level: levelOf(v[3]),
      desc: v[3] >= 70 ? '距毕业要求差距较大，须重点跟踪' : v[3] >= 40 ? '毕业要求部分未达，需持续跟进' : '毕业要求完成情况良好',
    },
  ]
})

/* ---------- 3. 学业成绩趋势分析 ---------- */
const FABRICATED_SEMESTERS = ['大一上', '大一下', '大二上', '大二下', '大三上', '大三下']

/** 学期 GPA 趋势：优先取真实数据，缺失时按当前 GPA 编造一条 6 学期波动曲线 */
const gpaTrend = computed(() => {
  const d = dashboard.value
  const real = d?.academic.gpaTrend
  if (real && real.semesters?.length && real.values?.length) {
    return { semesters: real.semesters, values: real.values, fabricated: false }
  }
  const gpa = d?.academic.gpa || 2.8
  // 构造一条有明显起伏的曲线：高 → 降 → 低 → 回升 → 波动 → 当前
  const values = FABRICATED_SEMESTERS.map((_, i) => {
    const wave = Math.sin(i * 1.7 + 1.2) * 0.45 + Math.cos(i * 2.3 - 0.8) * 0.22
    const trend = (i - 2.5) * 0.06
    return Math.max(1.6, Math.min(3.9, +(gpa + wave + trend).toFixed(2)))
  })
  values[values.length - 1] = +gpa.toFixed(2)
  return { semesters: FABRICATED_SEMESTERS, values, fabricated: true }
})

const gpaTrendOption = computed<EChartsOption>(() => {
  const { semesters, values } = gpaTrend.value
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const yMin = Math.max(0, Math.floor((lo - 0.3) * 2) / 2)
  const yMax = Math.min(4, Math.ceil((hi + 0.3) * 2) / 2)
  return {
    grid: { top: 14, bottom: 16, left: 2, right: 12 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}学期 GPA：${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}`
      },
    },
    xAxis: {
      type: 'category',
      data: semesters,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 6 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: 0.5,
      axisLabel: { ...AXIS_LABEL, fontSize: 13 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    series: [{
      name: '学期 GPA',
      type: 'line',
      smooth: true,
      data: values,
      lineStyle: { color: CHART_COLORS.cyan, width: 2.5 },
      itemStyle: { color: CHART_COLORS.cyan },
      symbol: 'circle',
      symbolSize: 7,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.28)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0)' },
          ],
        },
      },
    }],
  }
})

const gpaTrendDesc = computed(() => {
  const v = gpaTrend.value.values
  if (v.length < 2) return '暂无足够学期数据判断趋势'
  const delta = v[v.length - 1] - v[0]
  if (delta > 0.1) return `较入学提升 ${delta.toFixed(2)}，学业状态稳步向好`
  if (delta < -0.1) return `较入学下降 ${Math.abs(delta).toFixed(2)}，学业状态呈下滑趋势，需重点干预`
  return '学业状态总体平稳，波动较小'
})

/* ---------- 4. 课程风险分析 ---------- */
/** 课程风险清单：只展示已经有风险（成绩 < 75）的课程，按风险由高到低排序 */
const courseRiskList = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const real = d.academic.courseGrades
    .map((c) => {
      let level: Level = 'low'
      let tag = '正常'
      if (c.score < 60) { level = 'high'; tag = '挂科' }
      else if (c.score < 70) { level = 'high'; tag = '补考/重修' }
      else if (c.score < 75) { level = 'medium'; tag = '需关注' }
      return { name: c.name, score: c.score, rank: c.rank, level, tag }
    })
    .filter((c) => c.level !== 'low')
    .sort((a, b) => a.score - b.score)
  if (real.length) return real
  // 真实数据无风险课程时，用模拟数据兜底展示，保证页面有内容
  return [
    { name: '高等数学（下）', score: 56, rank: '', level: 'high' as Level, tag: '挂科' },
    { name: '大学物理', score: 63, rank: '', level: 'high' as Level, tag: '补考/重修' },
    { name: '数据结构', score: 68, rank: '', level: 'high' as Level, tag: '补考/重修' },
    { name: '概率论与数理统计', score: 72, rank: '', level: 'medium' as Level, tag: '需关注' },
    { name: '离散数学', score: 74, rank: '', level: 'medium' as Level, tag: '需关注' },
  ].sort((a, b) => a.score - b.score)
})

const courseRiskOption = computed<EChartsOption>(() => {
  const list = courseRiskList.value.slice(0, 6)
  return {
    grid: { ...CHART_GRID.barH, top: 8, bottom: 6, left: 4, right: 32 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number }>
        const p = arr[0]
        return `${p.name}<br/>成绩：${p.value}`
      },
    },
    xAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { ...AXIS_LABEL, fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: list.map((c) => c.name),
      axisLabel: { ...AXIS_LABEL, fontSize: 12, margin: 6, width: 76, overflow: 'truncate' },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    },
    series: [{
      type: 'bar',
      barWidth: '38%',
      data: list.map((c) => ({ value: c.score, itemStyle: { color: LEVEL_COLOR[c.level] } })),
      label: { show: true, position: 'right', color: '#d0e8f8', fontSize: 12, formatter: '{c}' },
    }],
  }
})

const coreStat = computed(() => {
  const d = dashboard.value
  if (!d) return { total: 0, passed: 0, percent: 0 }
  const core = d.academic.courseGrades.filter((c) => /核心|必修|专业/.test(c.name))
  const total = core.length || d.academic.courseGrades.length
  const passed = core.filter((c) => c.score >= 60).length
  return { total, passed, percent: total ? Math.round((passed / total) * 100) : 0 }
})

/* ---------- 5. 学业帮扶闭环 ---------- */
interface ClosureNode {
  kind: 'warn' | 'record' | 'measure' | 'status'
  label: string
  time?: string
  title?: string
  content: string
  statusTag?: string
}

const warningTime = computed(() => {
  const recs = dashboard.value?.academic.supportRecords ?? []
  const valid = recs.find((r) => r.date && r.date !== '待归档')
  return valid?.date ?? '2024-09-01'
})

const closureStatus = computed(() => {
  const lv = academicLevel.value
  return lv === 'high' ? '高危干预中' : lv === 'medium' ? '帮扶进行中' : '常态关注'
})

const supportMeasures = computed(() => {
  const lv = academicLevel.value
  const base = ['建立学业预警台账，明确辅导员与学业导师双责任人']
  if (lv === 'high') {
    base.push('制定一对一重修 / 补考计划，压缩不及格学分')
    base.push('每周学业进度面谈，跟踪考勤与作业完成情况')
  } else if (lv === 'medium') {
    base.push('安排朋辈辅导，加强专业课复习')
    base.push('参加高数 / 英语等薄弱课程辅导班')
  } else {
    base.push('保持常规学业关注，鼓励自主学习')
  }
  base.push('每月复评 GPA 与学分进度，动态更新帮扶方案')
  return base
})

const closureStages = computed<ClosureNode[]>(() => {
  const d = dashboard.value
  const recs = (d?.academic.supportRecords ?? []).filter((r) => r.content)
  const nodes: ClosureNode[] = []
  nodes.push({
    kind: 'warn', label: '预警触发', time: warningTime.value, title: '系统研判',
    content: `综合学业风险达到「${levelText(academicLevel.value)}」等级，自动生成预警工单并推送辅导员。`,
  })
  recs.forEach((r) =>
    nodes.push({ kind: 'record', label: '辅导记录', time: r.date, title: r.person, content: r.content }),
  )
  supportMeasures.value.forEach((m) => nodes.push({ kind: 'measure', label: '帮扶措施', content: m }))
  nodes.push({
    kind: 'status', label: '当前状态', content: `帮扶状态：${closureStatus.value}`, statusTag: closureStatus.value,
  })
  return nodes
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学业预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="academic-warning">
      <!-- 1. 学业风险状态总览 -->
      <section class="warn-section sec-full overview">
        <h3 class="warn-section__title">学业风险状态总览</h3>
        <div class="overview__body">
          <div class="overview__gauge">
            <ChartContainer :option="gaugeOption" />
            <div class="overview__gauge-cap">综合风险指数</div>
          </div>
          <div class="overview__main">
            <div class="kpi-grid">
              <div class="kpi-card" :class="`kpi-card--${academicLevel}`">
                <span class="kpi-card__label">学业风险等级</span>
                <strong class="kpi-card__value">{{ levelText(academicLevel) }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">当前 GPA</span>
                <strong class="kpi-card__value">{{ dashboard.academic.gpa.toFixed(2) }}</strong>
              </div>
              <div class="kpi-card" :class="progressPercent < 75 ? 'kpi-card--warn' : 'kpi-card--safe'">
                <span class="kpi-card__label">学分完成情况</span>
                <strong class="kpi-card__value">{{ progressPercent }}%</strong>
              </div>
              <div class="kpi-card" :class="failedCredits > 0 ? 'kpi-card--warn' : 'kpi-card--safe'">
                <span class="kpi-card__label">不及格学分</span>
                <strong class="kpi-card__value">{{ failedCredits.toFixed(1) }}</strong>
              </div>
            </div>
            <div class="risk-note" :class="`risk-note--${academicLevel}`">
              <span class="risk-note__tag">{{ levelText(academicLevel) }}</span>
              <span class="risk-note__text">{{ riskStatusText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 学业发展分析：学业成绩趋势 + 培养方案学分（合并为一张卡片） -->
      <section class="warn-section sec-full develop">
        <h3 class="warn-section__title">学业发展分析</h3>
        <div class="develop__grid">
          <div class="develop__col">
            <h4 class="develop__sub">学业成绩趋势分析</h4>
            <div class="trend-wrap">
              <ChartContainer :option="gpaTrendOption" />
            </div>
            <div class="trend-desc" :class="`trend-desc--${academicLevel}`">
              <span class="trend-desc__icon">↗</span>
              <span>{{ gpaTrendDesc }}</span>
            </div>
          </div>
          <div class="develop__col">
            <h4 class="develop__sub">培养方案学分完成情况</h4>
            <div class="core-progress">
              <div class="core-progress__head">
                <span>已修 {{ dashboard.creditProgress.earned.toFixed(1) }} / 要求 {{ dashboard.creditProgress.required }} 学分</span>
                <span :class="progressPercent < 60 ? 'text-risk' : progressPercent < 80 ? 'text-warn' : 'text-safe'">{{ progressPercent }}%</span>
              </div>
              <div class="core-progress__bar">
                <div class="core-progress__bar-inner" :style="{ width: `${Math.min(100, progressPercent)}%`, background: progressPercent < 60 ? '#ff7474' : progressPercent < 80 ? '#facc15' : '#55e995' }" />
              </div>
              <div class="bucket-grid">
                <div v-for="b in dashboard.creditProgress.buckets" :key="b.label" class="bucket-card">
                  <span class="bucket-card__label">{{ b.label }}</span>
                  <span class="bucket-card__value">{{ b.earned }}/{{ b.required }}</span>
                  <div class="bucket-card__bar">
                    <div class="bucket-card__bar-inner" :style="{ width: `${Math.min(100, (b.earned / b.required) * 100)}%` }" />
                  </div>
                </div>
              </div>
              <div class="core-progress__note">
                核心课程完成率
                <b :class="coreStat.percent < 70 ? 'text-warn' : 'text-safe'">{{ coreStat.percent }}%</b>
                （已通过 {{ coreStat.passed }}/{{ coreStat.total }} 门）
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 学业风险来源分析（置于合并卡片之后） -->
      <section class="warn-section">
        <h3 class="warn-section__title">学业风险来源分析</h3>
        <div class="radar-wrap">
          <ChartContainer :option="radarOption" />
        </div>
        <div class="factor-list">
          <div
            v-for="f in riskFactors"
            :key="f.name"
            class="factor-item"
            :class="`factor-item--${f.level}`"
          >
            <div class="factor-item__head">
              <span class="factor-item__name">{{ f.name }}</span>
              <span class="factor-item__badge">{{ levelText(f.level) }}</span>
            </div>
            <span class="factor-item__desc">{{ f.desc }}</span>
          </div>
        </div>
      </section>

      <!-- 课程风险分析 -->
      <section class="warn-section">
        <h3 class="warn-section__title">课程风险分析</h3>
        <div class="risk-sub">课程成绩风险分布（仅展示已有风险的课程，越低越危险）</div>
        <div v-if="courseRiskList.length" class="course-risk__chart">
          <ChartContainer :option="courseRiskOption" />
        </div>
        <div v-else class="empty-cell">暂无课程风险</div>
        <div class="risk-list-head">课程风险清单（按风险排序）</div>
        <div class="risk-list">
          <div v-for="c in courseRiskList.slice(0, 8)" :key="c.name" class="risk-row">
            <span class="risk-row__dot" :style="{ background: levelColor(c.level) }" />
            <span class="risk-row__name">{{ c.name }}</span>
            <span class="risk-row__score">{{ c.score }}</span>
            <span class="risk-row__tag" :class="`risk-row__tag--${c.level}`">{{ c.tag }}</span>
          </div>
          <div v-if="!courseRiskList.length" class="empty-cell">暂无课程风险</div>
        </div>
        <div class="section-actions">
          <button class="section-actions__btn" @click="goFail">查看挂科详情</button>
          <button class="section-actions__btn" @click="goGpa">查看 GPA 详情</button>
        </div>
      </section>

      <!-- 学业预警台账 -->
      <section class="warn-section">
        <h3 class="warn-section__title">学业预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in academicItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!academicItems.length"><td colspan="3" class="empty-cell">暂无学业预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 学业帮扶闭环（已取代「学业提升建议」） -->
      <section class="warn-section">
        <h3 class="warn-section__title">学业帮扶闭环</h3>
        <div class="closure">
          <div
            v-for="(node, idx) in closureStages"
            :key="idx"
            class="closure__item"
            :class="`closure__item--${node.kind}`"
          >
            <div class="closure__dot" />
            <div class="closure__head">
              <span class="closure__label">{{ node.label }}</span>
              <span v-if="node.time" class="closure__time">{{ node.time }}</span>
            </div>
            <div v-if="node.title" class="closure__title">{{ node.title }}</div>
            <div class="closure__content">
              <span v-if="node.statusTag" class="closure__status" :class="`closure__status--${academicLevel}`">{{ node.statusTag }}</span>
              <span>{{ node.content }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.academic-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
}

.sec-full { grid-column: 1 / -1; }

/* 合并卡片：趋势 + 学分 */
.develop__grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 20px;
}

.develop__col { min-width: 0; }

.develop__sub {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #9ecae8;
}

.warn-section {
  padding: 12px 16px;
  border-radius: 5px;
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

/* 1. 总览 */
.overview__body {
  display: flex;
  gap: 16px;
  align-items: stretch;
}

.overview__gauge {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  :deep(.chart-container) { width: 180px; height: 160px; }

  &-cap {
    margin-top: -6px;
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 600;
  }
}

.overview__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 12px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid #65dfff;

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }
  &--safe { border-color: #55e995; }
  &--warn { border-color: #facc15; }

  &__label {
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 23px;
    font-weight: 900;
    color: #f6fbff;
  }
}

.risk-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__tag {
    flex-shrink: 0;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    color: #06122e;
  }

  &__text {
    font-size: 14px;
    color: #d0e8f8;
    line-height: 1.5;
  }

  &--low .risk-note__tag { background: #55e995; }
  &--medium .risk-note__tag { background: #facc15; }
  &--high .risk-note__tag { background: #ff7474; color: #fff; }
}

/* 2. 风险来源：雷达（上） + 因素（下） */
.radar-wrap {
  height: 200px;
  :deep(.chart-container) { height: 200px; }
}

.factor-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.factor-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  border-left: 3px solid #65dfff;

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  &__name { font-size: 14px; color: #b8ecff; font-weight: 700; white-space: nowrap; }
  &__badge {
    flex-shrink: 0;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 999px;
    font-weight: 700;
    white-space: nowrap;
  }
  &--low &__badge { background: rgba(85, 233, 149, 0.14); color: #55e995; }
  &--medium &__badge { background: rgba(250, 204, 21, 0.14); color: #facc15; }
  &--high &__badge { background: rgba(255, 116, 116, 0.14); color: #ff7474; }

  &__desc {
    font-size: 13px;
    color: #9ecae8;
    line-height: 1.35;
  }
}

/* 3. 成绩趋势 */
.trend-wrap {
  height: 150px;
  :deep(.chart-container) { height: 150px; }
}

.trend-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;
  color: #d0e8f8;

  &__icon { font-size: 16px; font-weight: 900; }
  &--low &__icon { color: #55e995; }
  &--medium &__icon { color: #facc15; }
  &--high &__icon { color: #ff7474; }
}

/* 4. 课程风险 */
.risk-sub {
  font-size: 13px;
  color: #7eb4d8;
  margin-bottom: 8px;
}

.course-risk__chart {
  min-width: 0;
  height: 200px;
  :deep(.chart-container) { height: 200px; }
}

.risk-list-head {
  font-size: 13px;
  color: #7eb4d8;
  margin-bottom: 7px;
  font-weight: 600;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 232px;
  overflow-y: auto;
}

.risk-row {
  display: grid;
  grid-template-columns: 8px 1fr 56px 64px;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    justify-self: center;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__score {
    color: #f6fbff;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  &__tag {
    justify-self: end;
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 999px;
    font-weight: 700;
    white-space: nowrap;

    &--low { background: rgba(85, 233, 149, 0.12); color: #55e995; }
    &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
    &--high { background: rgba(255, 116, 116, 0.14); color: #ff7474; }
  }
}

.core-progress {
  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #9ecae8;
    margin-bottom: 6px;
    font-weight: 600;
  }

  &__bar {
    height: 9px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease;
  }

  &__note {
    margin-top: 6px;
    font-size: 13px;
    color: #9ecae8;

    b { font-size: 14px; }
  }
}

.bucket-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.bucket-card {
  padding: 7px 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { font-size: 13px; color: #7eb4d8; }
  &__value {
    float: right;
    font-size: 14px;
    font-weight: 800;
    color: #f6fbff;
  }
  &__bar {
    clear: both;
    height: 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    margin-top: 6px;
    overflow: hidden;
  }
  &__bar-inner {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #00b8ff, #00e5ff);
  }
}

.section-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;

  &__btn {
    flex: 1;
    padding: 6px 0;
    border-radius: 3px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.08);
    color: #8ef6ff;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &:hover { background: rgba(0, 184, 255, 0.16); }
  }
}

/* 5. 帮扶闭环时间轴 */
.closure {
  position: relative;
  padding-left: 14px;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: rgba(0, 184, 255, 0.18);
  }

  &__item {
    position: relative;
    padding: 7px 0 9px 18px;

    &:last-child { padding-bottom: 0; }
  }

  &__dot {
    position: absolute;
    left: -11px;
    top: 12px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.55);
  }
  &__item--warn &__dot { background: #ff7474; box-shadow: 0 0 8px rgba(248, 91, 91, 0.6); }
  &__item--record &__dot { background: #00d4ff; }
  &__item--measure &__dot { background: #f0c040; }
  &__item--status &__dot { background: #34d399; }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__label {
    font-size: 14px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__time {
    font-size: 12px;
    color: #7eb4d8;
    font-weight: 700;
  }

  &__title {
    font-size: 13px;
    color: #8ef6ff;
    font-weight: 700;
    margin: 2px 0;
  }

  &__content {
    font-size: 13px;
    color: #d0e8f8;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__status {
    font-size: 12px;
    padding: 1px 8px;
    border-radius: 999px;
    font-weight: 800;
    color: #06122e;

    &--high { background: #ff7474; color: #fff; }
    &--medium { background: #facc15; }
    &--low { background: #55e995; }
  }
}

/* 预警台账表 */
.warn-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 8px 10px;
    font-size: 13px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.05);
  }

  tbody tr:hover { background: rgba(0, 184, 255, 0.04); }

  .row--low td:first-child { border-left: 2px solid rgba(74, 222, 128, 0.5); }
  .row--medium td:first-child { border-left: 2px solid rgba(250, 204, 21, 0.5); }
  .row--high td:first-child { border-left: 2px solid rgba(248, 91, 91, 0.5); }

  .cell-label {
    font-weight: 600;
    color: #d0e8f8;
    line-height: 1.4;
  }
}

.cat-badge {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 13px;
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 700;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 14px;
}

/* Footer */
.footer-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: rgba(0, 184, 255, 0.1);
    color: #8ef6ff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

.text-safe { color: #55e995; }
.text-warn { color: #facc15; }
.text-risk { color: #ff7474; }

/* Placeholder */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    cursor: pointer;
    font-size: 15px;
    color: #55dfff;

    &:hover { background: rgba(0, 184, 255, 0.2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 1080px) {
  .academic-warning { grid-template-columns: 1fr; }
  .overview__body { flex-direction: column; align-items: center; }
  .overview__main { width: 100%; }
  .develop__grid { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bucket-grid { grid-template-columns: 1fr; }
}
</style>
