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
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import StudentSectionNav from '../_shared/StudentSectionNav.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import AiAnalysisCard from '@/components/student/template/AiAnalysisCard.vue'
import { useScope } from '@/composables/useScope'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { dashboardToPsyWarningSheets } from '@/utils/studentDashboardExport'
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
useStudentDashboardExport('心理预警详情', dashboard, dashboardToPsyWarningSheets)

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
  router.back()
}

const LEVEL_COLOR: Record<string, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const levelColor = (level: string) => LEVEL_COLOR[level] || '#8fb7cd'
const riskText = (level: string) =>
  ({ low: '正常', medium: '需关注', high: '高危' }[level] || '—')

/** 页面分区导航（点击跳转到对应模块） */
const sectionNav = [
  { id: 'sec-overview', label: '心理状态总览' },
  { id: 'sec-ai', label: 'AI心理分析' },
  { id: 'sec-radar', label: '状态风险分析' },
  { id: 'sec-trend', label: '状态变化趋势' },
  { id: 'sec-factors', label: '影响因素分析' },
  { id: 'sec-intervention', label: '干预跟踪' },
  { id: 'sec-ledger', label: '预警台账' },
]

const mentalLevel = computed(() => dashboard.value?.profile.mentalLevelCode ?? 'low')

/* 真实行为数据派生 */
const gpa = computed(() => dashboard.value?.academic.gpa ?? 0)
const failedCount = computed(() => dashboard.value?.failedCritical?.length ?? 0)
const attentionItems = computed<AttentionItemVM[]>(() => dashboard.value?.attention ?? [])
const mentalRecs = computed(() => dashboard.value?.mentalGrowth.records ?? [])
const supportStatus = computed(
  () => dashboard.value?.mentalGrowth.supportStatus || riskText(mentalLevel.value),
)
const resumeStatus = computed(() => dashboard.value?.careerDev.resumeStatus || '未完善')
const employmentDest = computed(() => dashboard.value?.careerDev.employmentDestination || '')

const levelFromIndex = (v: number) => (v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low')
const levelBase = (lv: string, lowV: number, medV: number, highV: number) =>
  lv === 'high' ? highV : lv === 'medium' ? medV : lowV

/* ---------- 1. 心理状态总览（简化） ---------- */
/** 心理风险指数（行为数据派生，越高风险越大） */
const riskIndex = computed(() => {
  const base = levelBase(mentalLevel.value, 28, 56, 82)
  let v = base
  if (failedCount.value > 0) v += 5
  if (gpa.value > 0 && gpa.value < 2.5) v += 5
  if (attentionItems.value.some((i) => /请假|晚归|宿舍异常/.test(`${i.category}${i.label}`))) v += 4
  return Math.min(100, v)
})
const riskIndexLevel = computed(() => levelFromIndex(riskIndex.value))

/* 仪表盘（心理风险指数）：带数字滚动动效 */
const gaugeAnim = ref(0)
let gaugeRaf = 0
function playGauge() {
  cancelAnimationFrame(gaugeRaf)
  gaugeAnim.value = 0
  const target = riskIndex.value
  const start = performance.now()
  let lastPaint = 0
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 1400)
    const v = target * easeOutCubic(t)
    if (now - lastPaint > 32 || t >= 1) {
      gaugeAnim.value = Math.round(v)
      lastPaint = now
    }
    if (t < 1) gaugeRaf = requestAnimationFrame(tick)
  }
  gaugeRaf = requestAnimationFrame(tick)
}
watch(
  () => [loading.value, !!dashboard.value] as const,
  async ([isLoading, hasDash]) => {
    if (!isLoading && hasDash) {
      await nextTick()
      requestAnimationFrame(() => playGauge())
    }
  },
)
onUnmounted(() => cancelAnimationFrame(gaugeRaf))

const gaugeOption = computed<EChartsOption>(() => {
  const score = gaugeAnim.value
  const tone = riskIndexLevel.value
  const color = levelColor(tone)
  const glow =
    tone === 'low'
      ? 'rgba(85, 233, 149, 0.6)'
      : tone === 'medium'
        ? 'rgba(250, 204, 21, 0.5)'
        : 'rgba(255, 116, 116, 0.5)'
  return {
    animation: false,
    series: [
      {
        type: 'gauge',
        center: ['50%', '50%'],
        radius: '90%',
        startAngle: 90,
        endAngle: -270,
        min: 0,
        max: 100,
        pointer: { show: false },
        anchor: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: { show: false },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 18, color: [[1, 'rgba(20, 55, 100, 0.55)']] },
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 1,
              colorStops: [
                { offset: 0, color },
                { offset: 1, color: '#9ef0ff' },
              ],
            },
            shadowBlur: 22,
            shadowColor: glow,
          },
        },
        data: [{ value: score }],
      },
    ],
  }
})
void gaugeOption

const lastAssessTime = computed(() => {
  const recs = mentalRecs.value
  if (recs.length) return recs[recs.length - 1].date
  return '2026-06-25'
})

const concernStatus = computed(() => {
  if (mentalLevel.value === 'high') return '重点跟踪'
  if (mentalLevel.value === 'medium') return '持续关注'
  return '常规关注'
})

const mentalStatusText = computed(() => {
  const lv = mentalLevel.value
  if (lv === 'high') return '多维行为数据异常，已触发高危关注，须立即介入干预。'
  if (lv === 'medium') return '存在学业或生活波动信号，需持续关注并安排谈心谈话。'
  return '综合行为数据分析显示，学生近期状态稳定，保持常规关注即可。'
})

/* AI 心理分析（基于行为数据生成结论） */
const aiAnalysis = computed(() => {
  const lv = mentalLevel.value
  const dims = fourDims.value
  const top = [...dims].sort((a, b) => b.value - a.value)[0]
  const gpaLow = gpa.value > 0 && gpa.value < 2.5
  const hasFailed = failedCount.value > 0
  const hasLifeRisk = attentionItems.value.some((i) =>
    /请假|晚归|宿舍异常/.test(`${i.category}${i.label}`),
  )

  const head =
    lv === 'high'
      ? `该生综合行为风险指数达 ${riskIndex.value}，心理风险等级为「高危」。`
      : lv === 'medium'
        ? `该生综合行为风险指数为 ${riskIndex.value}，心理风险等级为「需关注」。`
        : `该生综合行为风险指数为 ${riskIndex.value}，心理风险等级为「正常」。`

  const parts: string[] = []
  parts.push(head)

  if (top) {
    parts.push(`当前最突出的风险维度为「${top.name}」（评分 ${top.value}/100），主要来源：${top.source}。`)
  }
  if (gpaLow || hasFailed) {
    parts.push(`学业层面${hasFailed ? `存在 ${failedCount.value} 门挂科` : ''}${gpaLow ? `，GPA 仅 ${gpa.value.toFixed(2)}` : ''}，是状态波动的重要诱因，建议学业帮扶与心理疏导同步推进。`)
  }
  if (hasLifeRisk) {
    parts.push('生活规律出现明显异常（请假/晚归/宿舍异常），需关注作息与人际适应。')
  }

  const tail =
    lv === 'high'
      ? '建议立即启动家校协同干预，48 小时内安排面对面谈心谈话，并减少独处时间。'
      : lv === 'medium'
        ? '建议两周内完成一次谈心谈话，核实波动原因，引导规律作息并增强社会支持。'
        : '建议保持学期常规关注，鼓励体育锻炼与集体活动，压力节点前做好减压准备。'
  parts.push(tail)

  return parts.join('')
})

/* ---------- 2. 学生状态风险分析（四维雷达） ---------- */
const fourDims = computed(() => {
  const lv = mentalLevel.value
  const gpaLow = gpa.value > 0 && gpa.value < 2.5
  const hasFailed = failedCount.value > 0
  const hasLifeRisk = attentionItems.value.some((i) =>
    /请假|晚归|宿舍异常/.test(`${i.category}${i.label}`),
  )
  const hasTalk = mentalRecs.value.some((r) => /谈话|谈心|宿舍/.test(r.content))
  const preparingExam = /考研|考公/.test(employmentDest.value)
  const resumeWeak = /未完善|待投递|等待/.test(resumeStatus.value)

  const mk = (name: string, value: number, source: string) => {
    const v = Math.max(0, Math.min(100, Math.round(value)))
    return { name, value: v, level: levelFromIndex(v), source }
  }

  return [
    mk(
      '学业压力',
      levelBase(lv, 38, 55, 78) + (gpaLow ? 6 : 0) + (hasFailed ? 9 : 0),
      'GPA变化、挂科情况、学业预警',
    ),
    mk(
      '人际适应',
      levelBase(lv, 25, 48, 72) + (hasTalk ? 6 : 0),
      '宿舍矛盾记录、请假情况、辅导员谈话记录',
    ),
    mk(
      '生活规律',
      levelBase(lv, 34, 45, 66) + (hasLifeRisk ? 12 : 0),
      '晚归记录、宿舍异常、请假频率',
    ),
    mk(
      '发展压力',
      levelBase(lv, 30, 50, 68) + (preparingExam ? 8 : 0) + (resumeWeak ? 6 : 0),
      '毕业年级、就业状态、升学准备情况',
    ),
  ]
})

const radarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 850,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '54%'],
    radius: '62%',
    indicator: [
      { name: '学业压力', max: 100 },
      { name: '人际适应', max: 100 },
      { name: '生活规律', max: 100 },
      { name: '发展压力', max: 100 },
    ],
    axisName: { color: '#b8ecff', fontSize: 19 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'rgba(0, 184, 255, 0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    symbolSize: 5,
    areaStyle: { color: 'rgba(0, 229, 255, 0.22)' },
    lineStyle: { color: '#00e5ff', width: 2 },
    itemStyle: { color: '#7ff6ff' },
    data: [{
      value: fourDims.value.map((d) => d.value),
      name: '状态风险',
    }],
  }],
}))
void radarOption

const reveal = ref(0)
let revealRaf = 0
function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}
function playReveal() {
  cancelAnimationFrame(revealRaf)
  reveal.value = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 1200)
    reveal.value = easeOutCubic(t)
    if (t < 1) revealRaf = requestAnimationFrame(tick)
  }
  revealRaf = requestAnimationFrame(tick)
}
watch(
  () => [loading.value, !!dashboard.value] as const,
  async ([isLoading, hasDash]) => {
    if (!isLoading && hasDash) {
      await nextTick()
      requestAnimationFrame(() => playReveal())
    }
  },
)
onUnmounted(() => cancelAnimationFrame(revealRaf))

/* ---------- 3. 学生状态变化趋势（行为数据派生折线） ---------- */
const trendSemesters = ['大一上', '大一下', '大二上', '大二下']
const trendValues = computed(() => {
  const lv = mentalLevel.value
  const base =
    lv === 'high' ? [58, 62, 68, riskIndex.value]
      : lv === 'medium' ? [48, 52, 50, riskIndex.value]
        : [30, 28, 32, riskIndex.value]
  return base
})
const trendSummary = computed(() => {
  const v = trendValues.value
  if (v.length < 2) return '—'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '风险上升'
  if (d < -4) return '风险下降'
  return '总体平稳'
})
const trendOption = computed<EChartsOption>(() => {
  const values = trendValues.value
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const yMin = Math.max(0, Math.floor((lo - 4) / 5) * 5)
  const yMax = Math.min(100, Math.ceil((hi + 4) / 5) * 5)
  return {
    animation: true,
    animationDuration: 900,
    grid: { top: 18, bottom: 22, left: 8, right: 14 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      textStyle: { color: '#e8f7ff', fontSize: 15 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}风险指数：<b style="color:#7ff6ff">${p.value}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: trendSemesters,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, fontSize: 16, margin: 8, color: '#8eb8d8', fontWeight: 650 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLabel: { ...AXIS_LABEL, fontSize: 15, color: '#8eb8d8' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)', type: 'dashed' } },
    },
    series: [{
      name: '状态风险指数',
      type: 'line',
      smooth: 0.35,
      data: values,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 9,
      lineStyle: {
        width: 3,
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#00b8ff' },
            { offset: 1, color: '#7ff6ff' },
          ],
        },
        shadowColor: 'rgba(0, 229, 255, 0.55)',
        shadowBlur: 12,
      },
      itemStyle: {
        color: '#04101f',
        borderColor: '#7ff6ff',
        borderWidth: 2.5,
        shadowColor: 'rgba(0, 229, 255, 0.7)',
        shadowBlur: 8,
      },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.32)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0)' },
          ],
        },
      },
    }],
  }
})
void trendOption
const trendDesc = computed(() => {
  const v = trendValues.value
  if (v.length < 2) return '暂无足够数据判断趋势'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '综合行为数据显示风险呈上升趋势，需重点关注'
  if (d < -4) return '综合行为数据显示风险逐步下降，状态改善'
  return '综合行为数据分析显示，学生近期状态稳定。'
})

/* ---------- 4. 可能影响因素分析（不写心理因素） ---------- */
const factorCards = computed(() => {
  const leaveCount = attentionItems.value.filter((i) =>
    /请假/.test(`${i.category}${i.label}`),
  ).length
  const lateCount = attentionItems.value.filter((i) =>
    /晚归/.test(`${i.category}${i.label}`),
  ).length
  const dormCount = attentionItems.value.filter((i) =>
    /宿舍/.test(`${i.category}${i.label}`),
  ).length
  const talkCount = mentalRecs.value.filter((r) => /谈话|谈心/.test(r.content)).length
  return [
    {
      name: '学业因素',
      level: levelFromIndex(riskIndex.value),
      items: [
        `GPA ${gpa.value ? gpa.value.toFixed(2) : '—'}`,
        `挂科 ${failedCount.value} 门`,
        `学业排名 ${dashboard.value?.academic.classRank ?? '—'}/${dashboard.value?.academic.classTotal ?? '—'}`,
      ],
    },
    {
      name: '生活因素',
      level: levelFromIndex(Math.min(100, 30 + lateCount * 15 + leaveCount * 10 + dormCount * 10)),
      items: [
        `请假 ${leaveCount} 次`,
        `晚归 ${lateCount} 次`,
        `宿舍异常 ${dormCount} 次`,
      ],
    },
    {
      name: '人际因素',
      level: levelFromIndex(Math.min(100, 25 + talkCount * 8 + dormCount * 12)),
      items: [
        `宿舍矛盾 ${dormCount} 起`,
        `谈话记录 ${talkCount} 次`,
        '同伴互动观察',
      ],
    },
    {
      name: '发展因素',
      level: levelFromIndex(Math.min(100, 30 + (/考研|考公/.test(employmentDest.value) ? 18 : 0) + (/未完善|待投递/.test(resumeStatus.value) ? 14 : 0))),
      items: [
        `就业状态：${resumeStatus.value}`,
        `升学准备：${employmentDest.value || '—'}`,
        '职业方向匹配',
      ],
    },
  ]
})

/* ---------- 5. 心理干预跟踪（时间轴） ---------- */
interface InterventionRow {
  date: string
  event: string
  method: string
  result: string
  person: string
}

const interventionRows = computed<InterventionRow[]>(() => {
  const recs = mentalRecs.value
  if (recs.length) {
    return recs.map((r) => ({
      date: r.date,
      event: r.content,
      method: r.level === 'high' ? '重点干预' : '谈心谈话',
      result: '已跟进',
      person: r.person || '辅导员',
    }))
  }
  // 兜底示例
  return [
    { date: '2026-05-20', event: '关注学习压力，安排一对一谈话', method: '谈心谈话', result: '已跟进', person: '辅导员：XXX' },
    { date: '2026-04-12', event: '学业预警触发，联合学业帮扶', method: '学业帮扶', result: '已跟进', person: '班主任：XXX' },
    { date: '2026-03-08', event: '宿舍人际观察，关注适应情况', method: '宿舍走访', result: '持续观察', person: '辅导员：XXX' },
  ]
})

/* ---------- 6. 心理预警台账（字段调整） ---------- */
const psyLedger = computed(() => {
  if (!dashboard.value) return []
  const matched = attentionItems.value.filter((i) =>
    /心理|健康|体测|睡眠|情绪|压力/.test(`${i.category}${i.label}`),
  )
  if (matched.length) {
    return matched.map((i) => ({
      id: i.id,
      category: i.category,
      label: i.label,
      level: i.level,
      levelLabel: i.levelLabel,
    }))
  }
  // 兜底示例（贴合用户期望字段：分类 / 预警项 / 等级）
  return [
    { id: 'pl-1', category: '学业心理', label: '连续成绩下降', level: 'medium', levelLabel: '关注' },
    { id: 'pl-2', category: '生活状态', label: '异常请假', level: 'low', levelLabel: '低' },
    { id: 'pl-3', category: '人际关系', label: '宿舍矛盾', level: 'medium', levelLabel: '中' },
    { id: 'pl-4', category: '发展压力', label: '就业焦虑', level: 'medium', levelLabel: '关注' },
  ]
})

/* ---------- 干预建议（保留） ---------- */
const suggestions = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      '已纳入重点关注名单，建议辅导员与心理咨询中心联合跟进',
      '建议 48 小时内安排一次面对面谈心谈话评估',
      '同步联系家长，建立家校协同关注机制',
      '近期减少独处时间，鼓励参加 1-2 项团体活动',
    ]
  }
  if (code === 'medium') {
    return [
      '建议两周内完成一次谈心谈话，核实学业与生活波动原因',
      '引导合理安排作息，保证每日睡眠不少于 7 小时',
      '鼓励参与同伴互助或班级活动，增强社会支持',
      '学业压力较大时，可对接学业帮扶与心理疏导双通道',
    ]
  }
  return [
    '综合行为数据显示状态稳定，保持学期常规关注即可',
    '鼓励继续参与体育锻炼与集体活动，巩固积极心态',
    '关注考试周等压力节点，提前做好减压准备',
    '如出现睡眠或人际明显波动，及时安排谈心谈话',
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="心理预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="psy-warning">
      <StudentSectionNav :items="sectionNav" />

      <!-- 1. 心理状态总览（简化） -->
      <section id="sec-overview" class="warn-section sec-full overview">
        <div class="warn-section__glow" aria-hidden="true" />
        <h3 class="warn-section__title">心理状态总览</h3>
        <div class="overview__body">
          <!-- 左侧：心理风险等级 + 仪表盘 -->
          <div class="overview__gauge">
            <div class="overview__gauge-ring">
              <div class="overview__gauge-pulse" aria-hidden="true" />
              <ChartContainer :option="gaugeOption" />
              <div class="overview__gauge-value" aria-label="心理风险指数">
                <strong>{{ riskIndex }}</strong>
              </div>
            </div>
          </div>
          <!-- 右侧：四个指标卡 -->
          <div class="overview__main">
            <div class="kpi-strip">
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">最近评估时间</span>
                <strong class="kpi-strip__value is-sm">{{ lastAssessTime }}</strong>
              </div>
              <div class="kpi-strip__item" :class="`is-${mentalLevel}`">
                <span class="kpi-strip__label">风险等级</span>
                <strong class="kpi-strip__value">{{ riskText(mentalLevel) }}</strong>
              </div>
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">干预状态</span>
                <strong class="kpi-strip__value is-sm">{{ supportStatus }}</strong>
              </div>
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">关注状态</span>
                <strong class="kpi-strip__value is-sm">{{ concernStatus }}</strong>
              </div>
            </div>
            <div class="risk-note" :class="`risk-note--${mentalLevel}`">
              <span class="risk-note__tag">{{ riskText(mentalLevel) }}</span>
              <span class="risk-note__text">{{ mentalStatusText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- AI 心理分析（保留） -->
      <section id="sec-ai" class="warn-section sec-full">
        <AiAnalysisCard :text="aiAnalysis" title="AI 心理分析" />
      </section>

      <!-- 2. 学生状态风险分析（四维雷达） -->
      <section id="sec-radar" class="warn-section sec-full">
        <div class="warn-section__glow" aria-hidden="true" />
        <h3 class="warn-section__title">学生状态风险分析</h3>
        <div class="radar-layout">
          <div class="radar-wrap">
            <ChartContainer :option="radarOption" />
          </div>
          <div class="dimension-bars">
            <div
              v-for="(card, i) in fourDims"
              :key="card.name"
              class="dimension-bar"
              :class="`dimension-bar--${card.level}`"
              :style="{ '--i': i }"
            >
              <div class="dimension-bar__top">
                <span class="dimension-bar__name">{{ card.name }}</span>
                <span class="dimension-bar__tag">{{ riskText(card.level) }}</span>
              </div>
              <div class="dimension-bar__score">
                <strong>{{ card.value }}</strong>
                <small>/100</small>
              </div>
              <div class="dimension-bar__track">
                <i :style="{ width: `${card.value * reveal}%` }" />
              </div>
              <p class="dimension-bar__source">来源：{{ card.source }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 学生状态变化趋势 -->
      <section id="sec-trend" class="warn-section sec-full">
        <div class="warn-section__glow warn-section__glow--cyan" aria-hidden="true" />
        <h3 class="warn-section__title">学生状态变化趋势</h3>
        <div class="risk-sub">数据来源：学业预警变化 · 请假次数 · 宿舍异常次数 · 谈话记录（按学期）</div>
        <div class="trend-wrap">
          <ChartContainer :option="trendOption" />
        </div>
        <div class="trend-desc" :class="`trend-desc--${riskIndexLevel}`">
          <span class="trend-desc__icon">↗</span>
          <span>{{ trendDesc }}</span>
        </div>
      </section>

      <!-- 4. 可能影响因素分析（不写心理因素） -->
      <section id="sec-factors" class="warn-section sec-full">
        <div class="warn-section__glow warn-section__glow--cyan" aria-hidden="true" />
        <h3 class="warn-section__title">可能影响因素分析</h3>
        <div class="factor-cards">
          <div
            v-for="(f, i) in factorCards"
            :key="f.name"
            class="factor-card"
            :class="`factor-card--${f.level}`"
            :style="{ '--i': i }"
          >
            <div class="factor-card__head">
              <span class="factor-card__name">{{ f.name }}</span>
            </div>
            <ul class="factor-card__list">
              <li v-for="(it, k) in f.items" :key="k">
                <span class="factor-card__dot" />
                {{ it }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 5. 心理干预跟踪 -->
      <section id="sec-intervention" class="warn-section sec-full">
        <h3 class="warn-section__title">心理干预跟踪</h3>
        <div class="track-table-wrap">
          <table class="track-table">
            <thead>
              <tr>
                <th>时间</th>
                <th>事件</th>
                <th>干预方式</th>
                <th>处理结果</th>
                <th>负责人</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in interventionRows" :key="idx">
                <td class="cell-time">{{ row.date }}</td>
                <td class="cell-event">{{ row.event }}</td>
                <td>{{ row.method }}</td>
                <td><span class="track-status">{{ row.result }}</span></td>
                <td class="cell-person">{{ row.person }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 6. 心理预警台账 -->
      <section id="sec-ledger" class="warn-section">
        <h3 class="warn-section__title">心理预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in psyLedger" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!psyLedger.length"><td colspan="3" class="empty-cell">暂无心理预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 干预建议（保留） -->
      <section id="sec-advice" class="warn-section">
        <h3 class="warn-section__title">干预建议</h3>
        <ul class="suggestion-list">
          <li v-for="(s, idx) in suggestions" :key="idx">{{ s }}</li>
        </ul>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.psy-warning {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.sec-full { width: 100%; }

.warn-section {
  position: relative;
  padding: 16px 18px;
  border-radius: 12px;
  min-width: 0;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0, 180, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.7), rgba(3, 12, 34, 0.86));
  border: 1px solid rgba(102, 217, 255, 0.22);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  width: 100%;
  box-sizing: border-box;
  align-self: stretch;
  height: fit-content;
  overflow: hidden;

  &__glow {
    position: absolute;
    inset: auto -15% -35% auto;
    width: 50%;
    height: 65%;
    background: radial-gradient(circle, rgba(85, 233, 149, 0.1), transparent 70%);
    pointer-events: none;

    &--cyan {
      background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    }
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.65), transparent);
  }
}

.warn-section__title {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
  font-size: 26px;
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.18);

  &::before {
    content: '';
    width: 3px;
    height: 18px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7ff6ff, #00b8ff);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
}

/* 合并卡片内的二级小标题 */
.combine__sub {
  position: relative;
  z-index: 1;
  margin: 16px 0 10px;
  font-size: 21px;
  font-weight: 750;
  color: #9ecae8;

  &:first-of-type { margin-top: 0; }
}

/* 1. 总览 */
.overview__body {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 22px;
  align-items: stretch;
}

.overview__gauge {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: float-in 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) both;

  &-ring {
    position: relative;
    width: 196px;
    height: 196px;
    border-radius: 50%;
    background: radial-gradient(circle at 50% 45%, rgba(85, 233, 149, 0.08), transparent 62%);
  }

  &-pulse {
    position: absolute;
    inset: 16%;
    border-radius: 50%;
    pointer-events: none;
    background: radial-gradient(circle, rgba(85, 233, 149, 0.22), transparent 72%);
    animation: gauge-breathe 2.6s ease-in-out infinite;
  }

  :deep(.chart-container) {
    width: 196px;
    height: 196px;
  }

  &-value {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    strong {
      color: #f4fbff;
      font-family: 'DIN Alternate', sans-serif;
      font-size: 58px;
      font-weight: 900;
      line-height: 1;
      text-shadow: 0 0 22px rgba(85, 233, 149, 0.55);
    }
  }

  &-cap {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;

    em {
      font-style: normal;
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.14em;
      color: #04101f;
      padding: 2px 10px;
      border-radius: 999px;
      background: linear-gradient(90deg, #7ef0d0, #55e995);
    }

    span {
      font-size: 19px;
      color: #9ecae8;
      font-weight: 650;
      letter-spacing: 0.08em;
    }

    & ~ .overview__gauge-level {
      margin-top: 10px;
      font-size: 18px;
      color: #9ecae8;
      font-weight: 650;

      b {
        color: #f6fbff;
        font-weight: 800;
        margin-left: 4px;
      }
    }
  }
}

.overview__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: center;
}

.kpi-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background: rgba(0, 28, 58, 0.45);
  overflow: hidden;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px 14px;
    min-width: 0;
    position: relative;

    &:not(:last-child)::after {
      content: '';
      position: absolute;
      top: 18%;
      bottom: 18%;
      right: 0;
      width: 1px;
      background: linear-gradient(180deg, transparent, rgba(102, 217, 255, 0.28), transparent);
    }

    &.is-low .kpi-strip__value {
      color: #7ef0d0;
      text-shadow: 0 0 12px rgba(85, 233, 149, 0.35);
    }
    &.is-medium .kpi-strip__value { color: #facc15; }
    &.is-high .kpi-strip__value { color: #ff8a8a; }
  }

  &__label {
    font-size: 18px;
    color: #7eb4d8;
    font-weight: 650;
    white-space: nowrap;
  }

  &__value {
    font-size: 30px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.15;
    font-family: 'DIN Alternate', sans-serif;

    &.is-sm {
      font-size: 24px;
      font-family: inherit;
      font-weight: 800;
    }
  }
}

.risk-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 80, 60, 0.22), rgba(0, 38, 73, 0.4));
  border: 1px solid rgba(85, 233, 149, 0.22);

  &__tag {
    flex-shrink: 0;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 19px;
    font-weight: 800;
    color: #04101f;
  }

  &__text {
    font-size: 20px;
    color: #d7ecff;
    line-height: 1.55;
  }

  &--low {
    border-color: rgba(85, 233, 149, 0.28);
    .risk-note__tag { background: linear-gradient(90deg, #7ef0d0, #55e995); }
  }
  &--medium {
    border-color: rgba(250, 204, 21, 0.3);
    background: linear-gradient(90deg, rgba(90, 70, 10, 0.25), rgba(0, 38, 73, 0.4));
    .risk-note__tag { background: #facc15; }
  }
  &--high {
    border-color: rgba(255, 116, 116, 0.35);
    background: linear-gradient(90deg, rgba(90, 20, 30, 0.28), rgba(0, 38, 73, 0.4));
    .risk-note__tag { background: #ff7474; color: #fff; }
  }
}

/* 心理测评指标 */
.indicator-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.indicator-card {
  padding: 14px 15px;
  border-radius: 12px;
  background: rgba(0, 36, 72, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.14);
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: color-mix(in srgb, var(--c) 45%, transparent);
    transform: translateY(-1px);
  }

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 12px;
  }

  &__name {
    font-size: 20px;
    color: #cfe8ff;
    font-weight: 750;
  }

  &__score {
    font-size: 28px;
    font-weight: 900;
    color: var(--c);
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 12px color-mix(in srgb, var(--c) 40%, transparent);

    small {
      font-size: 16px;
      font-weight: 650;
      color: rgba(184, 236, 255, 0.55);
      margin-left: 1px;
    }
  }

  &__bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 30, 60, 0.7);
    overflow: hidden;
    margin-bottom: 10px;
    border: 1px solid rgba(102, 217, 255, 0.1);
  }

  &__bar-inner {
    height: 100%;
    width: 0;
    border-radius: inherit;
    background: linear-gradient(90deg, color-mix(in srgb, var(--c) 55%, #04101f), var(--c));
    box-shadow: 0 0 12px color-mix(in srgb, var(--c) 50%, transparent);
  }

  &__desc {
    font-size: 18px;
    color: #9ecae8;
    line-height: 1.45;
  }
}

:deep(.ai-analysis-card) {
  position: relative;
  padding: 18px 22px;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.28);
  background:
    radial-gradient(90% 80% at 0% 0%, rgba(0, 184, 255, 0.14), transparent 55%),
    linear-gradient(140deg, rgba(0, 80, 150, 0.28), rgba(4, 16, 40, 0.82));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}
:deep(.ai-analysis-card__tag) {
  font-size: 16px;
  padding: 4px 12px;
  color: #04101f;
  font-weight: 800;
  background: linear-gradient(90deg, #7ef0d0, #55e0ff);
  border: none;
  box-shadow: 0 0 12px rgba(85, 224, 255, 0.3);
}
:deep(.ai-analysis-card__text) {
  font-size: 20px;
  line-height: 1.7;
  color: #d7ecff;
}

/* 雷达 + 维度卡 */
.radar-layout {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(320px, 38%) 1fr;
  gap: 18px;
  align-items: center;
}

.radar-wrap {
  height: 300px;
  :deep(.chart-container) { height: 300px; }
}

.dimension-bar__source {
  margin: 6px 0 0;
  font-size: 15px;
  color: #7ba6c4;
  line-height: 1.4;
  white-space: normal;
}

.radar-obj-note {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(250, 204, 21, 0.35);
  background: linear-gradient(90deg, rgba(90, 60, 10, 0.35), rgba(0, 38, 73, 0.4));
  color: #ffe7a8;
  font-size: 19px;
  line-height: 1.55;
  font-weight: 650;
}

/* 可能影响因素分析：四卡 */
.factor-cards {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.factor-card {
  --accent: #55e995;
  --accent-soft: rgba(85, 233, 149, 0.35);
  position: relative;
  min-width: 0;
  padding: 14px 15px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  border-radius: 14px;
  background:
    radial-gradient(100% 80% at 100% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 55%),
    linear-gradient(160deg, rgba(0, 56, 110, 0.42), rgba(3, 14, 38, 0.78));
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  animation: item-in 0.52s ease both;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &--low { --accent: #55e995; --accent-soft: rgba(85, 233, 149, 0.4); }
  &--medium { --accent: #facc15; --accent-soft: rgba(250, 204, 21, 0.4); }
  &--high { --accent: #ff7474; --accent-soft: rgba(255, 116, 116, 0.45); }

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.28), 0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__name {
    font-size: 21px;
    font-weight: 800;
    color: #e8f7ff;
    letter-spacing: 0.02em;
  }

  &__list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  &__list li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 18px;
    color: #cfe8ff;
    line-height: 1.4;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-soft);
  }
}

/* 干预跟踪表格 */
.track-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.track-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 19px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 9px 12px;
    font-size: 19px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.18);
    white-space: nowrap;
  }

  td {
    padding: 9px 12px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.06);
    vertical-align: top;
  }

  tbody tr:hover { background: rgba(0, 184, 255, 0.04); }

  .cell-time { color: #7eb4d8; font-weight: 700; white-space: nowrap; }
  .cell-event { color: #d0e8f8; line-height: 1.4; }
  .cell-person { color: #8ef6ff; white-space: nowrap; }

  .track-status {
    display: inline-block;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 17px;
    font-weight: 700;
    color: #55e995;
    background: rgba(85, 233, 149, 0.12);
  }
}


.factor-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 8px;
}

.factor-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 7px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  border: 1px solid rgba(0, 184, 255, 0.12);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  &__name { font-size: 20px; color: #b8ecff; font-weight: 700; white-space: nowrap; }
  &__badge {
    flex-shrink: 0;
    font-size: 18px;
    padding: 2px 6px;
    border-radius: 999px;
    font-weight: 700;
    white-space: nowrap;
  }
  &--low &__badge { background: rgba(85, 233, 149, 0.14); color: #55e995; }
  &--medium &__badge { background: rgba(250, 204, 21, 0.14); color: #facc15; }
  &--high &__badge { background: rgba(255, 116, 116, 0.14); color: #ff7474; }

  &__desc {
    font-size: 19px;
    color: #9ecae8;
    line-height: 1.35;
  }
}

/* 趋势 */
.trend-wrap {
  position: relative;
  z-index: 1;
  height: 200px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  background:
    radial-gradient(80% 70% at 50% 0%, rgba(0, 184, 255, 0.08), transparent 60%),
    linear-gradient(180deg, rgba(0, 40, 78, 0.4), rgba(0, 16, 40, 0.55));
  padding: 10px 8px 6px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: float-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both 0.15s;
  :deep(.chart-container) { height: 184px; }
}

.trend-desc {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  background: linear-gradient(90deg, rgba(0, 60, 100, 0.28), rgba(0, 38, 73, 0.4));
  border: 1px solid rgba(102, 217, 255, 0.14);
  font-size: 20px;
  color: #d7ecff;

  &__icon { font-size: 22px; font-weight: 900; }
  &--low &__icon { color: #55e995; }
  &--medium &__icon { color: #facc15; }
  &--high &__icon { color: #ff7474; }
}

/* 风险因素气泡 */
.risk-sub {
  position: relative;
  z-index: 1;
  font-size: 19px;
  color: #7eb4d8;
  margin-bottom: 12px;
  font-weight: 650;
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
  font-size: 20px;

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


.dimension-bars {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.dimension-bar {
  --accent: #55e995;
  --accent-soft: rgba(85, 233, 149, 0.35);
  position: relative;
  min-width: 0;
  padding: 16px 14px 14px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  border-radius: 14px;
  background:
    radial-gradient(100% 80% at 100% 0%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 55%),
    linear-gradient(160deg, rgba(0, 56, 110, 0.42), rgba(3, 14, 38, 0.78));
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  animation: item-in 0.52s ease both;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, var(--accent) 70%, transparent), transparent);
  }

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 45%, transparent);
    transform: translateY(-2px);
    box-shadow:
      0 16px 32px rgba(0, 0, 0, 0.28),
      0 0 24px color-mix(in srgb, var(--accent) 12%, transparent);
  }

  &--low { --accent: #55e995; --accent-soft: rgba(85, 233, 149, 0.4); }
  &--medium { --accent: #facc15; --accent-soft: rgba(250, 204, 21, 0.4); }
  &--high { --accent: #ff7474; --accent-soft: rgba(255, 116, 116, 0.45); }

  &.is-lifted {
    border-color: color-mix(in srgb, var(--accent) 40%, transparent);
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__name {
    font-size: 20px;
    font-weight: 750;
    color: #e8f7ff;
    letter-spacing: 0.02em;
  }

  &__tag {
    flex-shrink: 0;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 75%, #fff), var(--accent));
    box-shadow: 0 0 10px var(--accent-soft);
  }

  &__score {
    display: flex;
    align-items: baseline;
    gap: 2px;
    margin-bottom: 12px;

    strong {
      font-family: 'DIN Alternate', sans-serif;
      font-size: 48px;
      font-weight: 900;
      line-height: 1;
      color: var(--accent);
      text-shadow: 0 0 18px var(--accent-soft);
      background: none !important;
    }

    small {
      font-size: 17px;
      font-weight: 700;
      color: rgba(184, 236, 255, 0.45);
    }
  }

  &__track {
    height: 9px;
    overflow: hidden;
    margin-bottom: 10px;
    border-radius: 99px;
    background: rgba(0, 24, 52, 0.75);
    border: 1px solid rgba(102, 217, 255, 0.12);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);

    i {
      display: block;
      height: 100%;
      width: 0;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--accent) 45%, #04101f), var(--accent));
      box-shadow: 0 0 14px var(--accent-soft);
    }
  }

  &__hint {
    margin: 0;
    font-size: 17px;
    color: #8fbdd8;
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.factor-plot {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.factor-plot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: #d8f3ff;
  font-size: 20px;
  font-weight: 750;

  b {
    font-family: 'DIN Alternate', sans-serif;
    font-size: 32px;
    line-height: 1;
    font-weight: 900;
    text-shadow: 0 0 12px rgba(85, 224, 255, 0.25);
    background: none !important;
  }
}

.factor-plot__track {
  height: 8px;
  overflow: hidden;
  margin: 12px 0 8px;
  border-radius: 99px;
  background: rgba(0, 30, 60, 0.7);
  border: 1px solid rgba(102, 217, 255, 0.1);

  i {
    display: block;
    height: 100%;
    width: 0;
    border-radius: inherit;
    box-shadow: 0 0 12px rgba(85, 233, 149, 0.4);
  }
}

.factor-plot__row {
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background:
    radial-gradient(80% 60% at 100% 0%, rgba(0, 184, 255, 0.07), transparent 55%),
    rgba(0, 32, 68, 0.48);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: item-in 0.56s ease both;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(102, 217, 255, 0.3);
    transform: translateY(-1px);
  }
}

.factor-plot__row p {
  margin: 0;
  min-height: 42px;
  color: #91bed9;
  font-size: 18px;
  line-height: 1.5;
}

.factor-plot__row--low .factor-plot__head b { color: #55e995; }
.factor-plot__row--medium .factor-plot__head b { color: #facc15; }
.factor-plot__row--high .factor-plot__head b { color: #ff7474; }

.psy-warning > .warn-section,
.footer-actions { animation: section-in .55s cubic-bezier(.2,.8,.2,1) both; }
.psy-warning > .warn-section:nth-of-type(2) { animation-delay: .04s; }
.psy-warning > .warn-section:nth-of-type(3) { animation-delay: .08s; }
.psy-warning > .warn-section:nth-of-type(4) { animation-delay: .12s; }

.indicator-card,
.dimension-bar,
.factor-plot__row,
.closure__item,
.warn-table tbody tr,
.suggestion-list li {
  animation: item-in .5s ease both;
}
.indicator-card:nth-child(2), .dimension-bar:nth-child(2), .factor-plot__row:nth-child(2), .closure__item:nth-child(2), .warn-table tbody tr:nth-child(2), .suggestion-list li:nth-child(2) { animation-delay: .07s; }
.indicator-card:nth-child(3), .dimension-bar:nth-child(3), .factor-plot__row:nth-child(3), .closure__item:nth-child(3), .warn-table tbody tr:nth-child(3), .suggestion-list li:nth-child(3) { animation-delay: .14s; }
.dimension-bar:nth-child(4), .factor-plot__row:nth-child(4), .closure__item:nth-child(4), .warn-table tbody tr:nth-child(4), .suggestion-list li:nth-child(4) { animation-delay: .21s; }
.dimension-bar:nth-child(5), .factor-plot__row:nth-child(5), .closure__item:nth-child(5), .warn-table tbody tr:nth-child(5), .suggestion-list li:nth-child(5) { animation-delay: .28s; }
.warn-table tbody tr:nth-child(6) { animation-delay: .35s; }
.warn-table tbody tr:nth-child(7) { animation-delay: .42s; }
.warn-table tbody tr:nth-child(8) { animation-delay: .49s; }
.warn-table tbody tr:nth-child(n+9) { animation-delay: .56s; }

.closure::before { background: linear-gradient(180deg, rgba(0, 212, 255, .72), rgba(0, 184, 255, .12)); animation: line-glow 2.4s ease-in-out infinite; }
.closure__dot { animation: node-pulse 2.2s ease-in-out infinite; }

@keyframes section-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes item-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes float-in {
  from { opacity: 0; transform: scale(.97); }
  to { opacity: 1; transform: scale(1); }
}
@keyframes node-pulse {
  0%, 100% { box-shadow: 0 0 7px rgba(0, 212, 255, .45); }
  50% { box-shadow: 0 0 16px rgba(0, 229, 255, .95); }
}
@keyframes line-glow {
  0%, 100% { opacity: .55; }
  50% { opacity: 1; }
}
@keyframes gauge-breathe {
  0%, 100% { opacity: 0.45; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.06); }
}

/* 大屏展示保留动效；系统「减少动画」仅弱化装饰性动画，不关掉进度条 */
@media (prefers-reduced-motion: reduce) {
  .overview__gauge-pulse,
  .closure::before,
  .closure__dot {
    animation: none !important;
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
  font-size: 20px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 8px 10px;
    font-size: 19px;
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
  font-size: 18px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 19px;
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
  font-size: 20px;
}

/* 干预跟踪时间轴 */
.closure {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  padding: 0;

  &__item {
    position: relative;
    min-width: 0;
    min-height: 112px;
    padding: 14px 16px 14px 22px;
    border: 1px solid rgba(102, 217, 255, 0.16);
    border-radius: 12px;
    background:
      radial-gradient(80% 60% at 0% 0%, rgba(0, 184, 255, 0.1), transparent 55%),
      linear-gradient(135deg, rgba(0, 74, 138, 0.22), rgba(2, 20, 53, 0.55));
    border-left: 3px solid rgba(0, 212, 255, 0.75);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  }

  &__dot {
    position: absolute;
    left: 10px;
    top: 17px;
    width: 7px;
    height: 7px;
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
    font-size: 21px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__time {
    font-size: 17px;
    color: #7eb4d8;
    font-weight: 700;
  }

  &__focus {
    font-size: 18px;
    color: #8ef6ff;
    font-weight: 700;
    margin: 2px 0;
  }

  &__content {
    font-size: 18px;
    color: #bad8ea;
    line-height: 1.45;
  }
}

/* 干预建议 */
.suggestion-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: #d0e8f8;
  font-size: 19px;
  line-height: 1.5;

  li {
    position: relative;
    min-height: 56px;
    display: flex;
    align-items: center;
    padding: 12px 14px 12px 32px;
    border: 1px solid rgba(102, 217, 255, 0.16);
    border-radius: 12px;
    background:
      radial-gradient(70% 80% at 0% 50%, rgba(0, 184, 255, 0.08), transparent 55%),
      rgba(0, 42, 84, 0.32);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  }

  li::before { content: ''; position: absolute; left: 14px; width: 7px; height: 7px; border-radius: 50%; background: #00d4ff; box-shadow: 0 0 10px rgba(0, 229, 255, .65); }
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
    font-size: 20px;
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
  font-size: 21px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    cursor: pointer;
    font-size: 21px;
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
  .kpi-strip { grid-template-columns: repeat(2, 1fr); }
  .dimension-bars { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
