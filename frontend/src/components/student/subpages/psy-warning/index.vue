<script setup lang="ts">
/**
 * 心理预警详情（二级页面）
 * 路由：/student/psy-warning?studentId=xxx
 *
 * 优化方向（对齐学业预警排版）：
 *  - 心理状态总览（仪表盘 + 指标卡 + 状态说明）
 *  - 心理测评指标（保留）
 *  - 心理风险维度分析（雷达图：情绪/学业压力/人际/睡眠/生活适应）
 *  - 心理状态趋势分析（折线图：历次测评 + 风险指数变化）
 *  - 心理风险因素分析（气泡图 + 风险标签）
 *  - 心理预警台账（保留）
 *  - 心理干预跟踪（时间轴：时间/方式/关注问题/措施/当前状态）
 *  - 干预建议（保留）
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL, CHART_COLORS } from '@/styles/echarts-theme'

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

const LEVEL_COLOR: Record<string, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const levelColor = (level: string) => LEVEL_COLOR[level] || '#8fb7cd'
const riskText = (level: string) =>
  ({ low: '正常', medium: '需关注', high: '高危' }[level] || '—')

const mentalLevel = computed(() => dashboard.value?.profile.mentalLevelCode ?? 'low')

/* ---------- 心理预警台账（保留） ---------- */
const psyItems = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.attention.filter((i) => /心理|健康|体测/.test(`${i.category}${i.label}`))
  if (items.length >= 4) return items
  const fallback = [
    { id: 'psy-1', category: '心理健康', label: 'SCL-90 测评总均分', level: 'low', levelLabel: '正常' },
    { id: 'psy-2', category: '心理健康', label: '焦虑因子（SCL-90）', level: 'low', levelLabel: '正常' },
    { id: 'psy-3', category: '心理健康', label: '抑郁因子（SCL-90）', level: 'low', levelLabel: '正常' },
    { id: 'psy-4', category: '身体健康', label: '体测成绩达标', level: 'low', levelLabel: '良好' },
    { id: 'psy-5', category: '睡眠健康', label: '睡眠质量自评', level: 'low', levelLabel: '正常' },
    { id: 'psy-6', category: '心理健康', label: '人际关系敏感度', level: 'low', levelLabel: '正常' },
    { id: 'psy-7', category: '身体健康', label: '视力筛查（近视度数）', level: 'low', levelLabel: '正常' },
    { id: 'psy-8', category: '心理健康', label: '压力应对能力评估', level: 'low', levelLabel: '正常' },
    { id: 'psy-9', category: '睡眠健康', label: '作息规律性评估', level: 'low', levelLabel: '正常' },
    { id: 'psy-10', category: '身体健康', label: 'BMI 体重指数', level: 'low', levelLabel: '正常' },
    { id: 'psy-11', category: '心理健康', label: '学业自我效能感', level: 'low', levelLabel: '良好' },
    { id: 'psy-12', category: '身体健康', label: '耐力跑测试成绩', level: 'low', levelLabel: '良好' },
  ] as AttentionItemVM[]
  return [...items, ...fallback].slice(0, 6)
})

/* ---------- 1. 心理状态总览 ---------- */
const mentalRecords = computed(() => {
  const recs = dashboard.value?.mentalGrowth.records ?? []
  if (recs.length) return recs
  // 模拟数据兜底
  return [
    { date: '2024-09-15', content: '新生入学心理测评完成，SCL-90 各因子均在正常范围，未触发预警' },
    { date: '2024-12-20', content: '学期末心理状态复评，整体平稳，睡眠质量略有下降，已建议规律作息' },
    { date: '2025-03-10', content: '春季学期心理普查，焦虑因子轻度波动，辅导员已进行一对一谈话' },
    { date: '2025-06-25', content: '夏季学期心理测评，各项指标回归正常区间，无需额外干预' },
  ]
})

const lastAssessTime = computed(() => {
  const recs = mentalRecords.value
  return recs.length ? recs[recs.length - 1].date : '—'
})

/** 心理健康指数（0-100，越高越健康）：由最新风险指数反推 */
const mentalIndex = computed(() => {
  const arr = trend.value
  if (!arr.length) return 70
  return Math.max(0, Math.min(100, 100 - arr[arr.length - 1]))
})

const mentalGaugeOption = computed<EChartsOption>(() => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: '94%',
    center: ['50%', '58%'],
    progress: { show: true, width: 12, itemStyle: { color: levelColor(mentalIndex.value <= 40 ? 'high' : mentalIndex.value <= 70 ? 'medium' : 'low') } },
    axisLine: { lineStyle: { width: 12, color: [[0.4, '#ff7474'], [0.7, '#facc15'], [1, '#55e995']] } },
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
    data: [{ value: mentalIndex.value }],
  }],
}))

const trendSummary = computed(() => {
  const v = trend.value
  if (v.length < 2) return '—'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '风险上升'
  if (d < -4) return '持续改善'
  return '总体平稳'
})

const mentalStatusText = computed(() => {
  const lv = mentalLevel.value
  if (lv === 'high') return '心理状态多项异常，已触发高危预警，须立即介入心理干预。'
  if (lv === 'medium') return '存在心理波动与风险因素，需持续关注并安排心理疏导。'
  return '整体心理状态平稳，保持常规关注即可。'
})

/* ---------- 心理测评指标（保留） ---------- */
const indicators = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      { name: 'SCL-90 总均分', value: 2.8, max: 5, level: 'high', desc: '显著高于常模，多项因子异常' },
      { name: 'UCLA 孤独量表', value: 56, max: 80, level: 'high', desc: '孤独感偏高，社交回避明显' },
      { name: '睡眠质量指数', value: 42, max: 100, level: 'medium', desc: '入睡困难，日均睡眠约 5.5 小时' },
    ]
  }
  if (code === 'medium') {
    return [
      { name: 'SCL-90 总均分', value: 1.9, max: 5, level: 'medium', desc: '略高于常模，焦虑与躯体化因子轻度升高' },
      { name: 'UCLA 孤独量表', value: 38, max: 80, level: 'low', desc: '处于正常偏高区间' },
      { name: '睡眠质量指数', value: 58, max: 100, level: 'medium', desc: '自评下降，睡眠时长不足' },
    ]
  }
  return [
    { name: 'SCL-90 总均分', value: 1.2, max: 5, level: 'low', desc: '各因子均在正常范围' },
    { name: 'UCLA 孤独量表', value: 24, max: 80, level: 'low', desc: '人际状态良好' },
    { name: '睡眠质量指数', value: 78, max: 100, level: 'low', desc: '睡眠状况良好' },
  ]
})

/* ---------- 2. 心理风险维度分析（雷达图） ---------- */
const psyRadarValues = computed<number[]>(() => {
  const code = mentalLevel.value
  if (code === 'high') return [82, 75, 70, 58, 65]
  if (code === 'medium') return [52, 55, 40, 42, 45]
  return [30, 38, 25, 22, 30]
})

const psyRadarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '54%'],
    radius: '66%',
    indicator: [
      { name: '情绪状态', max: 100 },
      { name: '学业压力', max: 100 },
      { name: '人际关系', max: 100 },
      { name: '睡眠状态', max: 100 },
      { name: '生活适应', max: 100 },
    ],
    axisName: { color: '#b8ecff', fontSize: 13 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'rgba(0, 184, 255, 0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: psyRadarValues.value,
      name: '心理风险',
      symbolSize: 5,
      areaStyle: { color: 'rgba(248, 113, 113, 0.26)' },
      lineStyle: { color: '#ff7474', width: 2 },
      itemStyle: { color: '#ff7474' },
    }],
  }],
}))

/* ---------- 3. 心理状态趋势分析（折线图） ---------- */
const trend = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') return [58, 62, 68, 72]
  if (code === 'medium') return [48, 52, 50, 54]
  return [35, 32, 30, 28]
})

const mentalTrendOption = computed<EChartsOption>(() => {
  const semesters = ['大一上', '大一下', '大二上', '大二下']
  const values = trend.value
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const yMin = Math.max(0, Math.floor((lo - 4) / 5) * 5)
  const yMax = Math.min(100, Math.ceil((hi + 4) / 5) * 5)
  return {
    grid: { top: 16, bottom: 18, left: 4, right: 12 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}心理风险指数：${p.value}`
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
      axisLabel: { ...AXIS_LABEL, fontSize: 13 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    series: [{
      name: '心理风险指数',
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

const trendDesc = computed(() => {
  const v = trend.value
  if (v.length < 2) return '暂无足够测评数据判断趋势'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '风险指数呈上升趋势，心理状况需重点关注'
  if (d < -4) return '风险指数持续下降，心理状况逐步改善'
  return '风险指数总体平稳，波动较小'
})

/* ---------- 4. 心理风险因素分析（气泡图 + 风险标签） ---------- */
const riskFactors = computed(() => {
  const code = mentalLevel.value
  const base = [
    { name: '学业压力', level: 'medium' as const, value: 55, desc: '课程与考试压力持续存在，需合理疏导' },
    { name: '就业压力', level: 'low' as const, value: 42, desc: '对未来就业存在一定焦虑，整体可控' },
    { name: '人际关系', level: 'medium' as const, value: 48, desc: '社交回避倾向，人际支持偏弱' },
    { name: '作息情况', level: 'high' as const, value: 66, desc: '睡眠不足、作息不规律，影响情绪稳定' },
  ]
  if (code === 'high') {
    base[0] = { name: '学业压力', level: 'high', value: 78, desc: '学业负荷过重，压力显著升高' }
    base[1] = { name: '就业压力', level: 'medium', value: 60, desc: '就业前景不明，焦虑加重' }
    base[2] = { name: '人际关系', level: 'high', value: 72, desc: '人际关系敏感，存在明显社交回避' }
    base[3] = { name: '作息情况', level: 'high', value: 80, desc: '长期睡眠不足，作息严重紊乱' }
  } else if (code === 'low') {
    base[0] = { name: '学业压力', level: 'low', value: 38, desc: '学业节奏平稳，压力适中' }
    base[1] = { name: '就业压力', level: 'low', value: 30, desc: '就业预期清晰，焦虑较低' }
    base[2] = { name: '人际关系', level: 'low', value: 25, desc: '人际互动良好，支持系统稳定' }
    base[3] = { name: '作息情况', level: 'low', value: 34, desc: '作息规律，睡眠充足' }
  }
  return base
})

const riskBubbleOption = computed<EChartsOption>(() => {
  const data = riskFactors.value.map((f) => ({
    name: f.name,
    value: [f.value, f.name],
    symbolSize: 20 + f.value * 0.55,
    itemStyle: { color: LEVEL_COLOR[f.level], opacity: 0.85 },
  }))
  return {
    grid: { top: 14, bottom: 18, left: 8, right: 16 },
    tooltip: {
      trigger: 'item',
      formatter: (params: unknown) => {
        const p = params as { name: string; value: number[] }
        return `${p.name}<br/>风险值：${p.value[0]}`
      },
    },
    xAxis: {
      type: 'value', min: 0, max: 100,
      axisLabel: { ...AXIS_LABEL, fontSize: 13 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: riskFactors.value.map((f) => f.name),
      axisLabel: { ...AXIS_LABEL, fontSize: 13 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    },
    series: [{
      type: 'scatter',
      data,
      label: {
        show: true,
        position: 'right',
        color: '#d0e8f8',
        fontSize: 12,
        formatter: (params: unknown) => {
          const p = params as { value: number[] }
          return `${p.value[0]}`
        },
      },
    }],
  }
})

/* ---------- 5. 心理干预跟踪（时间轴） ---------- */
interface InterventionNode {
  kind: 'record' | 'status'
  date: string
  method: string
  focus: string
  content: string
}

const interventionStages = computed<InterventionNode[]>(() => {
  const recs = mentalRecords.value
  const code = mentalLevel.value
  const methods = ['SCL-90 量表测评', '一对一谈心谈话', '个体心理咨询', '季度心理复评']
  const focuses = ['入学基线筛查', '情绪波动关注', '人际与睡眠问题', '干预效果评估']
  const nodes: InterventionNode[] = recs.map((r, i) => ({
    kind: 'record',
    date: r.date,
    method: methods[i] || '心理访谈',
    focus: focuses[i] || '综合心理状况',
    content: r.content,
  }))
  nodes.push({
    kind: 'status',
    date: lastAssessTime.value,
    method: '当前状态',
    focus: '干预状态',
    content: `当前干预状态：${dashboard.value?.mentalGrowth.supportStatus || riskText(code)}`,
  })
  return nodes
})

/* ---------- 干预建议（保留） ---------- */
const suggestions = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      '已纳入重点关注名单，建议辅导员与心理咨询师联合跟进',
      '建议 48 小时内安排一次面对面心理咨询评估',
      '同步联系家长，建立家校协同关注机制',
      '近期减少独处时间，鼓励参加 1-2 项团体心理活动',
    ]
  }
  if (code === 'medium') {
    return [
      '建议每月进行 1 次心理状态复评',
      '可预约学校心理咨询中心个体咨询或团体辅导',
      '关注睡眠与作息，必要时建议就医评估',
      '鼓励与班主任、辅导员保持定期沟通',
    ]
  }
  return [
    '继续保持良好的心理保健意识，关注自身情绪变化',
    '建议每学期参加 1 次心理健康讲座或团体辅导活动',
    '保持规律作息与适度运动，每天保证 7-8 小时睡眠',
    '如有情绪波动或压力困扰，可随时预约学校心理咨询中心',
    '培养 1-2 项兴趣爱好，有助于缓解学业压力',
    '鼓励与辅导员、室友保持良好沟通，建立积极社会支持系统',
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="心理预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="psy-warning">
      <!-- 1. 心理状态总览 -->
      <section class="warn-section sec-full overview">
        <h3 class="warn-section__title">心理状态总览</h3>
        <div class="overview__body">
          <div class="overview__gauge">
            <ChartContainer :option="mentalGaugeOption" />
            <div class="overview__gauge-cap">心理健康指数</div>
          </div>
          <div class="overview__main">
            <div class="kpi-grid">
              <div class="kpi-card" :class="`kpi-card--${mentalLevel}`">
                <span class="kpi-card__label">心理风险等级</span>
                <strong class="kpi-card__value">{{ riskText(mentalLevel) }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">综合心理状态</span>
                <strong class="kpi-card__value">{{ dashboard.profile.mentalLevel }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">最近评估时间</span>
                <strong class="kpi-card__value kpi-card__value--sm">{{ lastAssessTime }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">状态变化趋势</span>
                <strong class="kpi-card__value kpi-card__value--sm">{{ trendSummary }}</strong>
              </div>
            </div>
            <div class="risk-note" :class="`risk-note--${mentalLevel}`">
              <span class="risk-note__tag">{{ riskText(mentalLevel) }}</span>
              <span class="risk-note__text">{{ mentalStatusText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 心理测评指标 + 心理状态趋势分析（合并） -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理测评指标与状态趋势</h3>
        <h4 class="combine__sub">心理测评指标</h4>
        <div class="indicator-grid">
          <div
            v-for="item in indicators"
            :key="item.name"
            class="indicator-card"
            :class="`indicator-card--${item.level}`"
          >
            <div class="indicator-card__top">
              <span class="indicator-card__name">{{ item.name }}</span>
              <span class="indicator-card__score" :style="{ color: levelColor(item.level) }">
                {{ item.value }}/{{ item.max }}
              </span>
            </div>
            <div class="indicator-card__bar">
              <div
                class="indicator-card__bar-inner"
                :style="{ width: `${(item.value / item.max) * 100}%`, background: levelColor(item.level) }"
              />
            </div>
            <div class="indicator-card__desc">{{ item.desc }}</div>
          </div>
        </div>
        <h4 class="combine__sub">心理状态趋势分析</h4>
        <div class="trend-wrap">
          <ChartContainer :option="mentalTrendOption" />
        </div>
        <div class="trend-desc" :class="`trend-desc--${mentalLevel}`">
          <span class="trend-desc__icon">↗</span>
          <span>{{ trendDesc }}</span>
        </div>
      </section>

      <!-- 2. 心理风险维度分析 -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理风险维度分析</h3>
        <div class="radar-wrap">
          <ChartContainer :option="psyRadarOption" />
        </div>
        <div class="factor-list">
          <div
            v-for="(v, i) in psyRadarValues"
            :key="i"
            class="factor-item"
            :class="`factor-item--${v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low'}`"
          >
            <div class="factor-item__head">
              <span class="factor-item__name">{{ ['情绪状态', '学业压力', '人际关系', '睡眠状态', '生活适应'][i] }}</span>
              <span class="factor-item__badge">{{ riskText(v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low') }}</span>
            </div>
            <span class="factor-item__desc">风险值 {{ v }}/100</span>
          </div>
        </div>
      </section>

      <!-- 4. 心理风险因素分析（模拟数据兜底） -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理风险因素分析</h3>
        <div class="risk-sub">当前可能影响因素（气泡越大风险越高）</div>
        <div class="risk-bubble">
          <ChartContainer :option="riskBubbleOption" />
        </div>
        <div class="risk-tag-list">
          <div
            v-for="f in riskFactors"
            :key="f.name"
            class="risk-tag"
            :class="`risk-tag--${f.level}`"
          >
            <span class="risk-tag__dot" :style="{ background: levelColor(f.level) }" />
            <span class="risk-tag__name">{{ f.name }}</span>
            <span class="risk-tag__val">{{ f.value }}</span>
          </div>
        </div>
      </section>

      <!-- 5. 心理干预跟踪 -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理干预跟踪</h3>
        <div class="closure">
          <div
            v-for="(node, idx) in interventionStages"
            :key="idx"
            class="closure__item"
            :class="`closure__item--${node.kind}`"
          >
            <div class="closure__dot" />
            <div class="closure__head">
              <span class="closure__label">{{ node.method }}</span>
              <span class="closure__time">{{ node.date }}</span>
            </div>
            <div class="closure__focus">关注问题：{{ node.focus }}</div>
            <div class="closure__content">{{ node.content }}</div>
          </div>
          <div v-if="!interventionStages.length" class="empty-cell">暂无干预记录</div>
        </div>
      </section>

      <!-- 心理预警台账（保留） -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in psyItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!psyItems.length"><td colspan="3" class="empty-cell">暂无心理预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 干预建议（保留） -->
      <section class="warn-section">
        <h3 class="warn-section__title">干预建议</h3>
        <ul class="suggestion-list">
          <li v-for="(s, idx) in suggestions" :key="idx">{{ s }}</li>
        </ul>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.psy-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
}

.sec-full { grid-column: 1 / -1; }

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

/* 合并卡片内的二级小标题 */
.combine__sub {
  margin: 14px 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #9ecae8;

  &:first-of-type { margin-top: 0; }
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

  &__label {
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 23px;
    font-weight: 900;
    color: #f6fbff;

    &--sm { font-size: 16px; }
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

/* 心理测评指标 */
.indicator-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.indicator-card {
  padding: 12px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.08);

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  &__name {
    font-size: 13px;
    color: #8fb7cd;
    font-weight: 600;
  }

  &__score {
    font-size: 15px;
    font-weight: 800;
  }

  &__bar {
    height: 7px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
    margin-bottom: 8px;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  &__desc {
    font-size: 13px;
    color: #9ecae8;
    line-height: 1.4;
  }
}

/* 雷达 + 因素 */
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

/* 趋势 */
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

/* 风险因素气泡 */
.risk-sub {
  font-size: 13px;
  color: #7eb4d8;
  margin-bottom: 8px;
}

.risk-bubble {
  min-width: 0;
  height: 200px;
  :deep(.chart-container) { height: 200px; }
}

.risk-tag-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  margin-top: 10px;
}

.risk-tag {
  display: flex;
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
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    color: #d0e8f8;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__val {
    color: #f6fbff;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  &--low &__val { color: #55e995; }
  &--medium &__val { color: #facc15; }
  &--high &__val { color: #ff7474; }
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

/* 干预跟踪时间轴 */
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
  &__item--record &__dot { background: #00d4ff; }
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

  &__focus {
    font-size: 13px;
    color: #8ef6ff;
    font-weight: 700;
    margin: 2px 0;
  }

  &__content {
    font-size: 14px;
    color: #d0e8f8;
    line-height: 1.5;
  }
}

/* 干预建议 */
.suggestion-list {
  margin: 0;
  padding-left: 20px;
  color: #d0e8f8;
  font-size: 14px;
  line-height: 1.9;

  li::marker { color: #00d4ff; }
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
  .psy-warning { grid-template-columns: 1fr; }
  .overview__body { flex-direction: column; align-items: center; }
  .overview__main { width: 100%; }
  .indicator-grid { grid-template-columns: 1fr; }
  .risk-tag-list { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
