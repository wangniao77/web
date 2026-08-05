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
import StudentSectionNav from '../_shared/StudentSectionNav.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import AiAnalysisCard from '@/components/student/template/AiAnalysisCard.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import { useScope } from '@/composables/useScope'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { dashboardToAcademicWarningSheets } from '@/utils/studentDashboardExport'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL, CHART_COLORS, CHART_FONT } from '@/styles/echarts-theme'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
useStudentDashboardExport('学业预警详情', dashboard, dashboardToAcademicWarningSheets)

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
function goGpa() {
  router.push({ name: 'student-gpa-detail', query: { studentId: activeStudentId.value } })
}

type Level = 'low' | 'medium' | 'high'
const LEVEL_TEXT: Record<Level, string> = { low: '正常', medium: '需关注', high: '高危' }
const LEVEL_TONE: Record<Level, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const levelText = (lv: string) => LEVEL_TEXT[(lv as Level)] || '—'
const levelTone = (lv: string) => LEVEL_TONE[(lv as Level)] || '#65dfff'
const levelOf = (v: number): Level => (v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low')

/** 页面分区导航（点击跳转到对应模块） */
const sectionNav = [
  { id: 'sec-overview', label: '学业风险总览' },
  { id: 'sec-develop', label: '学业发展分析' },
  { id: 'sec-source', label: '风险来源' },
  { id: 'sec-course', label: '课程风险' },
  { id: 'sec-ledger', label: '学业预警台账' },
  { id: 'sec-task', label: '帮扶任务' },
]

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

/* 学业风险等级由综合风险指数映射：≥70 高危 / ≥40 需关注 / 其余正常 */
const academicLevel = computed<Level>(() => {
  const idx = riskIndex.value
  return idx >= 70 ? 'high' : idx >= 40 ? 'medium' : 'low'
})

/** 台账闭环计数：高危=未处理，中危=处理中，低危=已处理 */
const closureCounts = computed(() => {
  const counts = { done: 0, doing: 0, todo: 0 }
  academicItems.value.forEach((it) => {
    if (it.level === 'high') counts.todo++
    else if (it.level === 'medium') counts.doing++
    else counts.done++
  })
  return counts
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

/* 状态总览下方的 AI 学业分析结论 */
const aiAnalysis = computed(() => {
  const d = dashboard.value
  if (!d) return ''
  const gpa = d.academic.gpa
  const failN = d.failedCritical.length + d.academic.failedElective.length
  return `该生当前学业风险等级为「${levelText(academicLevel.value)}」，${riskStatusText.value} 综合风险指数 ${riskIndex.value} 分，当前 GPA ${gpa.toFixed(2)}，不及格课程 ${failN} 门。建议优先补齐薄弱课程与学分缺口，结合学业帮扶闭环持续跟踪，防止风险进一步累积。`
})

/* 延毕风险预测：以学分进度为主，结合不及格学分升级 */
const delayGradRisk = computed<'low' | 'medium' | 'high'>(() => {
  const p = progressPercent.value
  let lv: 'low' | 'medium' | 'high' = p < 50 ? 'high' : p < 75 ? 'medium' : 'low'
  if (failedCredits.value > 0) {
    if (lv === 'low') lv = 'medium'
    else if (lv === 'medium') lv = 'high'
  }
  return lv
})
const delayGradLabel = computed(
  () => ({ low: '低风险', medium: '中风险', high: '高风险' }[delayGradRisk.value]),
)

/** 风险仪表：单层同心半环 + 端点光晕（对齐就业竞争力表盘） */
function riskGaugeGradient(v: number) {
  if (v >= 70) {
    return {
      progressColor: {
        type: 'linear' as const, x: 0, y: 1, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: '#fda4af' },
          { offset: 1, color: '#ef4444' },
        ],
      },
      solidColor: '#fb7185',
    }
  }
  if (v >= 40) {
    return {
      progressColor: {
        type: 'linear' as const, x: 0, y: 1, x2: 1, y2: 0,
        colorStops: [
          { offset: 0, color: '#fde68a' },
          { offset: 1, color: '#fb923c' },
        ],
      },
      solidColor: '#fbbf24',
    }
  }
  return {
    progressColor: {
      type: 'linear' as const, x: 0, y: 1, x2: 1, y2: 0,
      colorStops: [
        { offset: 0, color: '#6ee7b7' },
        { offset: 1, color: '#34d399' },
      ],
    },
    solidColor: '#34d399',
  }
}

const gaugeOption = computed<EChartsOption>(() => {
  const v = riskIndex.value
  const { progressColor, solidColor } = riskGaugeGradient(v)
  const glow = `${solidColor}aa`
  const center: [string, string] = ['50%', '58%']
  const radius = '78%'
  const startAngle = 210
  const endAngle = -30
  return {
    animation: true,
    animationDuration: 1100,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'gauge',
        center,
        radius,
        startAngle,
        endAngle,
        min: 0,
        max: 100,
        splitNumber: 4,
        pointer: { show: false },
        anchor: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '8%'],
          formatter: (n: number) => `{num|${Math.round(n)}}`,
          rich: {
            num: {
              fontSize: CHART_FONT.gaugeCompact + 18,
              fontFamily: 'DIN Alternate, Segoe UI, sans-serif',
              fontWeight: 900,
              color: '#ffffff',
              textShadowColor: solidColor,
              textShadowBlur: 22,
              lineHeight: 48,
            },
          },
        },
        axisLine: {
          roundCap: true,
          lineStyle: { width: 16, color: [[1, 'rgba(20, 60, 110, 0.45)']] },
        },
        progress: {
          show: true,
          roundCap: true,
          width: 16,
          itemStyle: { color: progressColor, shadowBlur: 16, shadowColor: glow },
        },
        data: [{ value: v }],
        z: 2,
      },
      {
        type: 'gauge',
        center,
        radius,
        startAngle,
        endAngle,
        min: 0,
        max: 100,
        pointer: {
          show: true,
          icon: 'circle',
          length: '5%',
          width: 11,
          offsetCenter: [0, '-90%'],
          itemStyle: {
            color: '#ffffff',
            borderColor: solidColor,
            borderWidth: 3,
            shadowBlur: 12,
            shadowColor: glow,
          },
        },
        anchor: { show: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: { show: false },
        title: { show: false },
        axisLine: { lineStyle: { width: 0, color: [[1, 'transparent']] } },
        progress: { show: false },
        data: [{ value: v }],
        z: 3,
      },
    ],
  }
})

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
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(4, 16, 40, 0.94)',
    borderColor: 'rgba(255, 120, 120, 0.4)',
    textStyle: { color: '#e8f7ff', fontSize: 14 },
  },
  radar: {
    center: ['50%', '52%'],
    radius: '72%',
    indicator: [
      { name: '成绩稳定性', max: 100 },
      { name: '课程压力', max: 100 },
      { name: '培养进度', max: 100 },
      { name: '毕业风险', max: 100 },
    ],
    axisName: {
      color: '#d4f2ff',
      fontSize: 14,
      fontWeight: 700,
      padding: [3, 4],
    },
    splitNumber: 4,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.16)', width: 1 } },
    splitArea: {
      areaStyle: {
        color: ['rgba(0,184,255,0.02)', 'rgba(0,184,255,0.07)', 'rgba(0,184,255,0.02)', 'rgba(0,184,255,0.1)'],
      },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: riskRadarValues.value,
      name: '学业风险',
      symbol: 'circle',
      symbolSize: 8,
      areaStyle: {
        color: {
          type: 'radial', x: 0.5, y: 0.5, r: 0.75,
          colorStops: [
            { offset: 0, color: 'rgba(255, 130, 130, 0.5)' },
            { offset: 1, color: 'rgba(255, 80, 80, 0.06)' },
          ],
        },
      },
      lineStyle: { color: '#ff9a9a', width: 2.8, shadowBlur: 14, shadowColor: 'rgba(255,100,100,0.7)' },
      itemStyle: {
        color: '#fff',
        borderColor: '#ff7474',
        borderWidth: 2,
        shadowBlur: 12,
        shadowColor: 'rgba(255,100,100,0.75)',
      },
    }],
  }],
}))

/** 与雷达四轴对齐的风险指数条（替代大段文字卡） */
const riskFactors = computed(() => {
  const v = riskRadarValues.value
  const labels = [
    {
      name: '成绩稳定性',
      tip: (s: number) => (s >= 70 ? '波动明显' : s >= 40 ? '轻度波动' : '走势平稳'),
    },
    {
      name: '课程压力',
      tip: (s: number) => (s >= 70 ? '压力偏高' : s >= 40 ? '压力中等' : '压力可控'),
    },
    {
      name: '培养进度',
      tip: (s: number) => (s >= 70 ? '进度滞后' : s >= 40 ? '进度偏慢' : '进度正常'),
    },
    {
      name: '毕业风险',
      tip: (s: number) => (s >= 70 ? '须重点跟踪' : s >= 40 ? '需持续跟进' : '完成良好'),
    },
  ]
  return labels.map((item, i) => {
    const score = Math.round(v[i] ?? 0)
    return {
      name: item.name,
      score,
      level: levelOf(score),
      tip: item.tip(score),
    }
  })
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
    animation: true,
    animationDuration: 1200,
    grid: { top: 22, bottom: 8, left: 8, right: 14, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      textStyle: { color: '#e8f7ff', fontSize: 15 },
      extraCssText: 'border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.45);',
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}学期 GPA：<b style="color:#7ff6ff">${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: semesters,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, fontSize: 16, margin: 8, color: '#9ec7e0' },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      interval: 0.5,
      axisLabel: { ...AXIS_LABEL, fontSize: 16, color: '#9ec7e0' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)', type: 'dashed' } },
    },
    series: [{
      name: '学期 GPA',
      type: 'line',
      smooth: 0.35,
      data: values,
      lineStyle: {
        color: CHART_COLORS.cyan,
        width: 3,
        shadowBlur: 14,
        shadowColor: 'rgba(0, 229, 255, 0.55)',
      },
      itemStyle: {
        color: '#06122e',
        borderColor: '#7ff6ff',
        borderWidth: 2.5,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 229, 255, 0.7)',
      },
      symbol: 'circle',
      symbolSize: 10,
      emphasis: { scale: 1.25, itemStyle: { borderWidth: 3 } },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.38)' },
            { offset: 0.55, color: 'rgba(0, 160, 255, 0.12)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0)' },
          ],
        },
      },
      markLine: {
        silent: true,
        symbol: 'none',
        lineStyle: { color: 'rgba(250, 204, 21, 0.45)', type: 'dashed', width: 1.5 },
        label: { color: '#facc15', fontSize: 13, formatter: '关注线 2.5', position: 'insideEndTop' },
        data: [{ yAxis: 2.5 }],
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

/* 学业发展分析小标签：当前趋势 + 成绩变化（一行式结论，不做大文本） */
const developTrend = computed(() => {
  const v = gpaTrend.value.values
  if (v.length < 2) return '稳定'
  const delta = v[v.length - 1] - v[0]
  if (delta > 0.1) return '上升'
  if (delta < -0.1) return '下降'
  return '稳定'
})
const developChange = computed(() => {
  const v = gpaTrend.value.values
  if (v.length < 3) return '整体平稳，无大幅波动'
  const minIdx = v.indexOf(Math.min(...v))
  const maxDrop = Math.max(...v) - Math.min(...v)
  if (minIdx > 0 && minIdx < v.length - 1) return '阶段性下降后恢复'
  if (maxDrop >= 0.3) return `存在波动，最大落差 ${maxDrop.toFixed(2)}`
  return '整体平稳'
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

/* 课程风险画像（四维度雷达：挂科风险 / 学分影响 / 毕业影响 / 课程压力） */
const courseRadarValues = computed<number[]>(() => {
  const d = dashboard.value
  if (!d) return [0, 0, 0, 0]
  const grades = d.academic.courseGrades ?? []
  const scores = grades.map((c) => c.score).filter((s) => s > 0)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 75
  const failN = (d.failedCritical?.length ?? 0) + (d.academic.failedElective?.length ?? 0)
  const atRisk = grades.filter((c) => c.score > 0 && c.score < 75).length
  const total = Math.max(1, grades.length)
  const clamp = (n: number) => Math.round(Math.min(100, Math.max(0, n)))
  const failRisk = clamp((100 - avg) * 0.9 + failN * 12 + atRisk * 4)
  const creditImpact = clamp(((failN + atRisk * 0.5) / total) * 100 + failN * 8)
  const earnedPct = d.creditProgress.required > 0
    ? (d.creditProgress.earned / d.creditProgress.required) * 100 : 0
  const gradImpact = clamp(100 - earnedPct * 1.1 + failN * 6)
  const coursePressure = clamp(grades.length * 8 + atRisk * 6)
  return [failRisk, creditImpact, gradImpact, coursePressure]
})

const courseRadarOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(4, 16, 40, 0.94)',
    borderColor: 'rgba(255, 180, 84, 0.45)',
    textStyle: { color: '#e8f7ff', fontSize: 15 },
  },
  radar: {
    center: ['50%', '52%'],
    radius: '72%',
    indicator: [
      { name: '挂科风险', max: 100 },
      { name: '学分影响', max: 100 },
      { name: '毕业影响', max: 100 },
      { name: '课程压力', max: 100 },
    ],
    axisName: {
      color: '#d4f2ff',
      fontSize: 14,
      fontWeight: 700,
      padding: [3, 4],
    },
    splitNumber: 4,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.16)' } },
    splitArea: {
      areaStyle: {
        color: ['rgba(0,184,255,0.02)', 'rgba(255,180,84,0.05)', 'rgba(0,184,255,0.02)', 'rgba(255,180,84,0.09)'],
      },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: courseRadarValues.value,
      name: '课程风险画像',
      symbol: 'circle',
      symbolSize: 8,
      areaStyle: {
        color: {
          type: 'radial', x: 0.5, y: 0.5, r: 0.75,
          colorStops: [
            { offset: 0, color: 'rgba(255, 200, 100, 0.48)' },
            { offset: 1, color: 'rgba(255, 160, 60, 0.05)' },
          ],
        },
      },
      lineStyle: { color: '#ffc46a', width: 2.8, shadowBlur: 14, shadowColor: 'rgba(255,180,84,0.7)' },
      itemStyle: {
        color: '#fff',
        borderColor: '#ffb454',
        borderWidth: 2,
        shadowBlur: 12,
        shadowColor: 'rgba(255,180,84,0.75)',
      },
    }],
  }],
}))

const courseRiskTone = (level: Level) =>
  ({ low: '#55e995', medium: '#facc15', high: '#ff7474' }[level])

/** 红绿灯课表：精简为成绩色条行，高风险可展开资源 */
const courseRiskCards = computed(() => {
  return courseRiskList.value.map((c) => {
    let risk = ''
    let handle = ''
    if (c.level === 'high') {
      if (c.score < 60) { risk = '挂科'; handle = '需重修' }
      else { risk = '补考/重修'; handle = '安排补考' }
    } else if (c.level === 'medium') {
      risk = '需关注'
      handle = '加强复习'
    } else {
      risk = '正常'
      handle = ''
    }
    return { ...c, risk, handle, tone: courseRiskTone(c.level) }
  })
})

const courseRiskSummary = computed(() => {
  const cards = courseRiskCards.value
  return {
    high: cards.filter((c) => c.level === 'high').length,
    medium: cards.filter((c) => c.level === 'medium').length,
    low: cards.filter((c) => c.level === 'low').length,
  }
})

/** 保留当前版增强：高风险课程可展开查看通过率与帮扶资源 */
const expandedCourse = ref<string | null>(null)
function toggleCourseExpand(name: string) {
  expandedCourse.value = expandedCourse.value === name ? null : name
}
function coursePassRate(name: string, score: number) {
  const seed = [...name].reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const base = score < 60 ? 62 + (seed % 12) : 78 + (seed % 10)
  return Math.min(95, base)
}
function courseResources(name: string) {
  return [
    { label: '课程辅导视频', href: `https://example.edu/tutor/${encodeURIComponent(name)}` },
    { label: '补考复习提纲', href: `https://example.edu/outline/${encodeURIComponent(name)}` },
    { label: '预约学业帮扶', href: `https://example.edu/help?course=${encodeURIComponent(name)}` },
  ]
}

const coreStat = computed(() => {
  const d = dashboard.value
  if (!d) return { total: 0, passed: 0, percent: 0 }
  const core = d.academic.courseGrades.filter((c) => /核心|必修|专业/.test(c.name))
  const total = core.length || d.academic.courseGrades.length
  const passed = core.filter((c) => c.score >= 60).length
  return { total, passed, percent: total ? Math.round((passed / total) * 100) : 0 }
})

/* ---------- 5. 学业帮扶任务清单（替代闭环时间轴） ---------- */
interface TaskItem {
  priority: Level
  title: string
  lines: string[]
  statusText: string
}

const taskList = computed<TaskItem[]>(() => {
  const list: TaskItem[] = []
  courseRiskList.value.filter((c) => c.level === 'high').forEach((c) => {
    list.push({ priority: 'high', title: `补考 ${c.name}`, lines: ['负责人：辅导员', '截止：2026-09-10'], statusText: '优先' })
  })
  courseRiskList.value.filter((c) => c.level === 'medium').forEach((c) => {
    list.push({ priority: 'medium', title: `加强 ${c.name} 复习`, lines: ['进度：60%'], statusText: '进行中' })
  })
  const recs = dashboard.value?.academic.supportRecords ?? []
  recs.filter((r) => r.content && r.date && r.date !== '待归档').slice(0, 3).forEach((r) => {
    const lines = [`时间：${r.date}`]
    if (r.person) lines.push(`负责人：${r.person}`)
    list.push({ priority: 'low', title: (r.content || '学业谈话').slice(0, 18), lines, statusText: '已完成' })
  })
  if (!list.some((t) => t.priority === 'low')) {
    list.push({ priority: 'low', title: '完成学业谈话', lines: ['时间：2026-06-20'], statusText: '已完成' })
  }
  return list
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学业预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="academic-warning">
      <StudentSectionNav :items="sectionNav" />

      <!-- 1. 学业风险状态总览 -->
      <section id="sec-overview" class="warn-section sec-full overview">
        <h3 class="warn-section__title">学业风险状态总览</h3>
        <div class="overview__body">
          <!-- 左半区：综合风险指数 + 毕业核查 -->
          <div class="overview__left">
            <div class="overview__gauge">
              <ChartContainer :option="gaugeOption" />
              <div class="overview__gauge-cap">
                <StuHint
                  tip="综合学业风险指数（0–100），越高越危险"
                  formula="综合风险 = GPA偏离风险(≤40) + 学分缺口风险(≤30) + 挂科风险(≤30)
GPA偏离 = max(0, (3.6−GPA)/3.6×40)
学分缺口 = (要求学分−已修学分)/要求学分×30
挂科风险 = min(30, 不及格门数×12)"
                  :delay="280"
                >综合风险指数</StuHint>
              </div>
            </div>
            <div class="grad-check">
              <div class="grad-check__head">
                <span class="grad-check__title">毕业核查</span>
                <StuHint tip="延毕风险预测">
                  <span class="grad-check__tag" :class="`grad-check__tag--${delayGradRisk}`">{{ delayGradLabel }}</span>
                </StuHint>
              </div>
              <div class="grad-check__bar">
                <div class="grad-check__inner" :style="{ width: `${progressPercent}%` }" />
              </div>
              <div class="grad-check__foot">
                <span>已修 {{ Math.round(dashboard.creditProgress.earned) }} / 要求 {{ dashboard.creditProgress.required }}</span>
                <span class="grad-check__pct">{{ progressPercent }}%</span>
              </div>
            </div>
          </div>
          <!-- 右半区：四个基本情况 + 状态说明（对齐心理预警排版） -->
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
            <!-- 状态说明（与心理预警一致，置于指标卡下方） -->
            <div class="risk-note" :class="`risk-note--${academicLevel}`">
              <span class="risk-note__tag">{{ levelText(academicLevel) }}</span>
              <span class="risk-note__text">{{ riskStatusText }}</span>
            </div>
          </div>
        </div>
        </section>

      <!-- 状态总览下方：AI 学业分析 -->
      <AiAnalysisCard title="AI 学业分析" :text="aiAnalysis" class="sec-full" />

      <!-- 学业发展分析：学业成绩趋势 + 培养方案学分（合并为一张卡片） -->
      <section id="sec-develop" class="warn-section sec-full develop">
        <h3 class="warn-section__title">学业发展分析</h3>
        <div class="develop__tag">
          <span class="develop__tag-item">当前趋势：<b>{{ developTrend }}</b></span>
          <span class="develop__tag-item">成绩变化：<b>{{ developChange }}</b></span>
        </div>
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
                <div
                  class="core-progress__bar-inner"
                  :class="progressPercent < 60 ? 'is-risk' : progressPercent < 80 ? 'is-warn' : 'is-safe'"
                  :style="{ width: `${Math.min(100, progressPercent)}%` }"
                />
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

      <!-- 学业风险来源分析 -->
      <section id="sec-source" class="warn-section source-panel">
        <h3 class="warn-section__title">学业风险来源分析</h3>
        <div class="source-panel__body">
          <div class="source-panel__radar">
            <ChartContainer :option="radarOption" />
          </div>
          <div class="meter-list">
            <div
              v-for="f in riskFactors"
              :key="f.name"
              class="meter"
              :class="`meter--${f.level}`"
              :style="{ '--tone': levelTone(f.level) }"
            >
              <div class="meter__head">
                <span class="meter__name">{{ f.name }}</span>
                <span class="meter__badge">{{ levelText(f.level) }}</span>
                <strong class="meter__score">{{ f.score }}</strong>
              </div>
              <div class="meter__track"><i :style="{ width: `${f.score}%` }" /></div>
              <p class="meter__tip">{{ f.tip }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 课程风险分析 -->
      <section id="sec-course" class="warn-section course-panel">
        <h3 class="warn-section__title">
          课程风险分析
          <span class="warn-section__meta">
            高风险 {{ courseRiskSummary.high }} · 关注 {{ courseRiskSummary.medium }}
          </span>
        </h3>
        <div class="course-panel__body">
          <div class="course-panel__radar">
            <div class="panel-caption">风险画像</div>
            <ChartContainer :option="courseRadarOption" />
          </div>
          <div class="course-panel__list">
            <div class="panel-caption">风险课程</div>
            <div class="score-list">
              <div
                v-for="c in courseRiskCards"
                :key="c.name"
                class="score-row"
                :class="[`score-row--${c.level}`, { 'is-open': expandedCourse === c.name }]"
                :style="{ '--tone': c.tone }"
              >
                <button
                  type="button"
                  class="score-row__main"
                  :class="{ 'is-clickable': c.level === 'high' }"
                  @click="c.level === 'high' && toggleCourseExpand(c.name)"
                >
                  <div class="score-row__top">
                    <span class="score-row__badge">{{ c.level === 'high' ? '高风险' : c.level === 'medium' ? '关注' : '正常' }}</span>
                    <span class="score-row__name" :title="c.name">{{ c.name }}</span>
                    <strong class="score-row__score">{{ c.score }}</strong>
                  </div>
                  <div class="score-row__track"><i :style="{ width: `${c.score}%` }" /></div>
                  <div class="score-row__meta">
                    <span>{{ c.risk }}</span>
                    <span v-if="c.handle">{{ c.handle }}</span>
                    <span v-if="c.level === 'high'" class="score-row__more">
                      {{ expandedCourse === c.name ? '收起' : '资源' }}
                    </span>
                  </div>
                </button>
                <div v-if="c.level === 'high' && expandedCourse === c.name" class="score-row__expand">
                  <p class="score-row__hint">
                    学院通过率 {{ coursePassRate(c.name, c.score) }}% —
                    {{ coursePassRate(c.name, c.score) < 70 ? '课程难度偏高，建议优先辅导。' : '通过率正常，重点改善复习投入。' }}
                  </p>
                  <div class="score-row__links">
                    <a
                      v-for="r in courseResources(c.name)"
                      :key="r.label"
                      class="score-row__link"
                      :href="r.href"
                      target="_blank"
                      rel="noopener noreferrer"
                    >{{ r.label }}</a>
                  </div>
                </div>
              </div>
              <div v-if="!courseRiskCards.length" class="empty-cell">暂无课程风险</div>
            </div>
          </div>
        </div>
        <div class="section-actions">
          <button type="button" class="section-actions__btn" @click="goGpa">查看 GPA 详情</button>
        </div>
      </section>

      <!-- 学业预警台账 -->
      <section id="sec-ledger" class="warn-section">
        <h3 class="warn-section__title">学业预警台账</h3>
        <div class="ledger-grid">
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
          <div class="ledger-status">
            <h4 class="ledger-status__title">当前状态</h4>
            <div class="status-row status-row--done">
              <span class="status-row__label">已处理</span>
              <b class="status-row__value">{{ closureCounts.done }} 项</b>
            </div>
            <div class="status-row status-row--doing">
              <span class="status-row__label">处理中</span>
              <b class="status-row__value">{{ closureCounts.doing }} 项</b>
            </div>
            <div class="status-row status-row--todo">
              <span class="status-row__label">未处理</span>
              <b class="status-row__value">{{ closureCounts.todo }} 项</b>
            </div>
          </div>
        </div>
      </section>

      <!-- 学业帮扶任务清单（替代闭环时间轴） -->
      <section id="sec-task" class="warn-section">
        <h3 class="warn-section__title">学业帮扶任务清单</h3>
        <div class="task-list">
          <div
            v-for="(t, idx) in taskList"
            :key="idx"
            class="task-card"
            :class="`task-card--${t.priority}`"
          >
            <div class="task-card__head">
              <span class="task-card__light">{{ t.statusText }}</span>
              <span class="task-card__title">{{ t.title }}</span>
            </div>
            <div class="task-card__body">
              <span v-for="(ln, j) in t.lines" :key="j" class="task-card__line">{{ ln }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.academic-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}

.sec-full { grid-column: 1 / -1; }

/* 合并卡片：趋势 + 学分 */
.develop__grid {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 20px;
}

.develop__col { min-width: 0; }

.warn-section {
  position: relative;
  padding: 14px 18px 16px;
  border-radius: 10px;
  min-width: 0;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  border: 1px solid rgba(102, 217, 255, 0.18);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
    pointer-events: none;
  }
}

/* 学业风险状态总览 */
.overview {
  border-color: rgba(102, 217, 255, 0.22);
}

.warn-section__title {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);

  &::before {
    content: '';
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.warn-section__meta {
  margin-left: auto;
  font-size: 13px;
  font-weight: 650;
  color: rgba(184, 236, 255, 0.55);
  letter-spacing: 0.02em;
  text-shadow: none;
}

/* 1. 总览：左=综合风险指数+毕业核查，右=四个基本情况+状态说明 */
.overview__body {
  display: flex;
  gap: 18px;
  align-items: stretch;
}

.overview__left {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.overview__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.overview__gauge {
  width: 200px;
  align-self: center;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  :deep(.chart-container) { width: 200px; height: 168px; }

  &-cap {
    margin-top: -2px;
    font-size: 16px;
    color: #8fc4e4;
    font-weight: 650;
    letter-spacing: 0.06em;
  }
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 10px;
  background:
    linear-gradient(145deg, rgba(0, 90, 160, 0.28), rgba(4, 20, 48, 0.55));
  border: 1px solid rgba(90, 200, 255, 0.22);
  border-left: 3px solid rgba(0, 220, 255, 0.75);
  box-shadow:
    inset 0 0 18px rgba(0, 140, 220, 0.1),
    0 0 16px rgba(0, 160, 255, 0.06);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -40%;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(140, 230, 255, 0.12), transparent);
    animation: awKpiSweep 5.5s ease-in-out infinite;
    pointer-events: none;
  }

  &--low { border-left-color: #55e995; }
  &--medium { border-left-color: #facc15; }
  &--high { border-left-color: #ff7474; }
  &--safe { border-left-color: #55e995; }
  &--warn { border-left-color: #facc15; }

  &__label {
    font-size: 16px;
    color: #8fc4e4;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.2;
    font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
    text-shadow: 0 0 12px rgba(80, 200, 255, 0.35);
  }
}

@keyframes awKpiSweep {
  0% { left: -40%; opacity: 0; }
  20% { opacity: 1; }
  100% { left: 120%; opacity: 0; }
}

.risk-note {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(0, 38, 73, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.14);
  box-shadow: inset 0 0 18px rgba(0, 140, 220, 0.06);

  &__tag {
    flex-shrink: 0;
    padding: 4px 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 800;
    color: #06122e;
    letter-spacing: 0.04em;
  }

  &__text {
    font-size: 18px;
    color: #d0e8f8;
    line-height: 1.5;
  }

  &--low .risk-note__tag { background: #55e995; box-shadow: 0 0 12px rgba(85, 233, 149, 0.35); }
  &--medium .risk-note__tag { background: #facc15; box-shadow: 0 0 12px rgba(250, 204, 21, 0.3); }
  &--high .risk-note__tag { background: #ff7474; color: #fff; box-shadow: 0 0 12px rgba(255, 116, 116, 0.35); }
}

/* 毕业核查进度条 */
.grad-check {
  width: 100%;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.14);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 10px;
  }
  &__title {
    font-size: 16px;
    font-weight: 700;
    color: #b8ecff;
  }
  &__tag {
    padding: 2px 10px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 800;
    color: #06122e;
    &--low { background: #55e995; }
    &--medium { background: #facc15; }
    &--high { background: #ff7474; color: #fff; }
  }
  &__bar {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: rgba(102, 217, 255, 0.12);
    overflow: hidden;
  }
  &__inner {
    position: relative;
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0090d0, #00e5ff);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.45);
    transition: width 0.4s ease;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      animation: awBarShine 2.8s ease-in-out infinite;
    }
  }
  &__foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 14px;
    color: #9ecae8;
  }
  &__pct {
    font-size: 18px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }
}

@keyframes awBarShine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

/* 2. 风险来源：大雷达 + 指数条 */
.source-panel__body {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 14px;
  align-items: stretch;
  min-height: 280px;
}

.source-panel__radar {
  min-width: 0;
  min-height: 280px;
  border-radius: 10px;
  background: radial-gradient(ellipse at 50% 45%, rgba(255, 80, 80, 0.08), transparent 62%);
  :deep(.chart-container) { height: 280px; }
}

.meter-list {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  min-width: 0;
}

.meter {
  padding: 10px 12px;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(0, 70, 130, 0.22), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-left: 3px solid var(--tone);

  &__head {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 8px;
    margin-bottom: 7px;
  }

  &__name {
    font-size: 14px;
    font-weight: 750;
    color: #c8f0ff;
  }

  &__badge {
    font-size: 11px;
    font-weight: 750;
    padding: 2px 7px;
    border-radius: 5px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 30%, transparent);
  }

  &__score {
    font-size: 18px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    color: var(--tone);
    min-width: 28px;
    text-align: right;
    text-shadow: 0 0 10px color-mix(in srgb, var(--tone) 45%, transparent);
  }

  &__track {
    height: 6px;
    border-radius: 999px;
    background: rgba(101, 146, 183, 0.2);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 55%, #06203a), var(--tone));
      box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 55%, transparent);
    }
  }

  &__tip {
    margin: 6px 0 0;
    font-size: 12px;
    color: rgba(158, 202, 232, 0.75);
  }
}

/* 课程风险：大雷达 + 成绩色条 */
.course-panel__body {
  display: grid;
  grid-template-columns: 0.95fr 1.15fr;
  gap: 14px;
  align-items: stretch;
  min-height: 280px;
}

.course-panel__radar {
  min-width: 0;
  min-height: 260px;
  border-radius: 10px;
  background: radial-gradient(ellipse at 50% 45%, rgba(255, 180, 60, 0.08), transparent 62%);
  display: flex;
  flex-direction: column;

  :deep(.chart-container) { flex: 1; min-height: 240px; height: 240px; }
}

.course-panel__list {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-caption {
  margin: 0 0 8px;
  font-size: 13px;
  font-weight: 700;
  color: #8fc4e4;
  letter-spacing: 0.04em;
}

.score-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  max-height: 260px;
  overflow-y: auto;
  padding-right: 2px;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 184, 255, 0.35);
    border-radius: 4px;
  }
}

.score-row {
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: linear-gradient(145deg, rgba(0, 70, 130, 0.18), rgba(4, 18, 42, 0.48));
  border-left: 3px solid var(--tone);
  overflow: hidden;
  transition: border-color 0.15s, box-shadow 0.15s;

  &.is-open {
    border-color: color-mix(in srgb, var(--tone) 45%, rgba(102, 217, 255, 0.3));
    box-shadow: 0 0 16px color-mix(in srgb, var(--tone) 18%, transparent);
  }

  &__main {
    display: block;
    width: 100%;
    padding: 10px 12px;
    border: 0;
    background: transparent;
    text-align: left;
    color: inherit;
    cursor: default;

    &.is-clickable { cursor: pointer; }
  }

  &__top {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  &__badge {
    font-size: 11px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: 5px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 30%, transparent);
    white-space: nowrap;
  }

  &__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 15px;
    font-weight: 800;
    color: #f4fbff;
  }

  &__score {
    font-size: 20px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    color: var(--tone);
    text-shadow: 0 0 10px color-mix(in srgb, var(--tone) 45%, transparent);
  }

  &__track {
    margin-top: 7px;
    height: 5px;
    border-radius: 999px;
    background: rgba(101, 146, 183, 0.2);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 50%, #06203a), var(--tone));
      box-shadow: 0 0 8px color-mix(in srgb, var(--tone) 55%, transparent);
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 12px;
    margin-top: 6px;
    font-size: 12px;
    color: rgba(184, 216, 240, 0.78);
  }

  &__more {
    margin-left: auto;
    color: #8ef6ff;
    font-weight: 700;
  }

  &__expand {
    padding: 0 12px 12px;
    border-top: 1px solid rgba(102, 217, 255, 0.12);
  }

  &__hint {
    margin: 10px 0 8px;
    font-size: 13px;
    line-height: 1.5;
    color: #ffe7a8;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__link {
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(0, 206, 255, 0.35);
    background: rgba(0, 80, 140, 0.3);
    color: #8ee9ff;
    font-size: 12px;
    text-decoration: none;

    &:hover {
      border-color: rgba(120, 230, 255, 0.7);
      color: #fff;
    }
  }
}

/* legacy radar wrap kept for other sections */
.radar-wrap {
  height: 220px;
  :deep(.chart-container) { height: 220px; }
}

/* 3. 成绩趋势 */
.trend-wrap {
  height: 180px;
  :deep(.chart-container) { height: 180px; }
}

.trend-desc {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 10px 14px;
  border-radius: 8px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.12);
  font-size: 16px;
  color: #d0e8f8;

  &__icon { font-size: 18px; font-weight: 900; }
  &--low &__icon { color: #55e995; }
  &--medium &__icon { color: #facc15; }
  &--high &__icon { color: #ff7474; }
}

/* 4. 课程风险 */
.risk-sub {
  font-size: 19px;
  color: #7eb4d8;
  margin-bottom: 8px;
}

.course-risk__chart {
  min-width: 0;
  height: 200px;
  :deep(.chart-container) { height: 200px; }
}

.risk-list-head {
  font-size: 19px;
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
  font-size: 20px;

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
    font-size: 17px;
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
    font-size: 15px;
    color: #9ecae8;
    margin-bottom: 8px;
    font-weight: 650;
  }

  &__bar {
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.25);
  }

  &__bar-inner {
    position: relative;
    height: 100%;
    border-radius: 999px;
    transition: width 0.5s ease;
    overflow: hidden;

    &.is-safe {
      background: linear-gradient(90deg, #059669, #34d399, #6ee7b7);
      box-shadow: 0 0 12px rgba(52, 211, 153, 0.4);
    }
    &.is-warn {
      background: linear-gradient(90deg, #d97706, #facc15);
      box-shadow: 0 0 12px rgba(250, 204, 21, 0.35);
    }
    &.is-risk {
      background: linear-gradient(90deg, #dc2626, #ff7474);
      box-shadow: 0 0 12px rgba(255, 116, 116, 0.4);
    }

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
      animation: awBarShine 2.8s ease-in-out infinite;
    }
  }

  &__note {
    margin-top: 10px;
    font-size: 15px;
    color: #9ecae8;

    b { font-size: 17px; }
  }
}

.bucket-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.bucket-card {
  padding: 10px 12px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 70, 130, 0.22), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__label { font-size: 14px; color: #8fc4e4; font-weight: 650; }
  &__value {
    float: right;
    font-size: 16px;
    font-weight: 800;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
  }
  &__bar {
    clear: both;
    height: 5px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    margin-top: 8px;
    overflow: hidden;
  }
  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0090d0, #00e5ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
  }
}

.section-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;

  &__btn {
    flex: 1;
    padding: 9px 0;
    border-radius: 8px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background:
      linear-gradient(145deg, rgba(0, 113, 206, 0.22), rgba(0, 40, 80, 0.45));
    color: #8ef6ff;
    font-size: 15px;
    font-weight: 750;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 212, 255, 0.55);
      box-shadow: 0 0 16px rgba(0, 160, 255, 0.15);
    }
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
    font-size: 20px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__time {
    font-size: 18px;
    color: #7eb4d8;
    font-weight: 700;
  }

  &__title {
    font-size: 19px;
    color: #8ef6ff;
    font-weight: 700;
    margin: 2px 0;
  }

  &__content {
    font-size: 19px;
    color: #d0e8f8;
    line-height: 1.5;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  &__status {
    font-size: 18px;
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
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(0, 24, 52, 0.35);
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.88);

  th {
    text-align: left;
    padding: 12px 14px;
    font-size: 14px;
    font-weight: 750;
    color: #9ecae8;
    letter-spacing: 0.04em;
    background: rgba(0, 60, 110, 0.35);
    border-bottom: 1px solid rgba(102, 217, 255, 0.16);
    white-space: nowrap;
  }

  td {
    padding: 11px 14px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.06);
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.15s ease;
    &:hover { background: rgba(0, 184, 255, 0.07); }
    &:last-child td { border-bottom: none; }
  }

  .row--low td:first-child { box-shadow: inset 3px 0 0 #55e995; }
  .row--medium td:first-child { box-shadow: inset 3px 0 0 #facc15; }
  .row--high td:first-child { box-shadow: inset 3px 0 0 #ff7474; }

  .cell-label {
    font-weight: 650;
    color: #e2f4ff;
    line-height: 1.4;
  }
}

.cat-badge {
  font-size: 13px;
  padding: 3px 9px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.22);
  color: #8ef6ff;
  white-space: nowrap;
  font-weight: 650;
}

.level-badge {
  font-size: 13px;
  padding: 3px 10px;
  border-radius: 6px;
  font-weight: 750;

  &--low { background: rgba(74, 222, 128, 0.14); color: #55e995; border: 1px solid rgba(74, 222, 128, 0.28); }
  &--medium { background: rgba(250, 204, 21, 0.14); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.28); }
  &--high { background: rgba(248, 91, 91, 0.14); color: #ff7474; border: 1px solid rgba(248, 91, 91, 0.28); }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 20px;
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

.text-safe { color: #55e995; }
.text-warn { color: #facc15; }
.text-risk { color: #ff7474; }

/* 学业发展分析 · 一行式趋势标签 */
.develop__tag {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;

  &__item {
    padding: 5px 12px;
    border-radius: 6px;
    font-size: 14px;
    color: #9ecae8;
    background: rgba(0, 50, 95, 0.4);
    border: 1px solid rgba(102, 217, 255, 0.14);

    b {
      color: #7ff6ff;
      font-weight: 800;
      margin-left: 4px;
    }
  }
}

.develop__sub {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 750;
  color: #b8ecff;
  letter-spacing: 0.03em;
}

/* 学业预警台账 · 闭环状态面板 */
.ledger-grid {
  display: grid;
  grid-template-columns: 1fr 210px;
  gap: 14px;
  align-items: start;
}

.ledger-status {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-radius: 10px;
  background:
    linear-gradient(145deg, rgba(0, 90, 160, 0.22), rgba(4, 18, 42, 0.55));
  border: 1px solid rgba(102, 217, 255, 0.16);
  box-shadow: inset 0 0 18px rgba(0, 140, 220, 0.08);

  &__title {
    margin: 0 0 2px;
    font-size: 15px;
    font-weight: 750;
    color: #c8f0ff;
    letter-spacing: 0.04em;
  }
}

.status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 30, 60, 0.45);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__label { font-size: 14px; color: #9ecae8; font-weight: 650; }
  &__value {
    font-size: 22px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 10px currentColor;
  }

  &--done &__value { color: #55e995; }
  &--doing &__value { color: #facc15; }
  &--todo &__value { color: #ff7474; }
}

/* 学业帮扶任务清单 */
.task-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 10px;
  background:
    linear-gradient(145deg, rgba(0, 70, 130, 0.2), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-left: 3px solid rgba(102, 217, 255, 0.35);

  &--high {
    border-left-color: #ff7474;
    background: linear-gradient(145deg, rgba(120, 30, 40, 0.26), rgba(4, 18, 42, 0.5));
  }
  &--medium {
    border-left-color: #facc15;
    background: linear-gradient(145deg, rgba(90, 70, 10, 0.2), rgba(4, 18, 42, 0.5));
  }
  &--low {
    border-left-color: #55e995;
    background: linear-gradient(145deg, rgba(20, 80, 50, 0.2), rgba(4, 18, 42, 0.5));
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__light {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 800;
    white-space: nowrap;
    padding: 2px 8px;
    border-radius: 6px;
    letter-spacing: 0.04em;
  }
  &--high &__light {
    color: #ffb0b0;
    background: rgba(255, 116, 116, 0.16);
    border: 1px solid rgba(255, 116, 116, 0.3);
  }
  &--medium &__light {
    color: #fde68a;
    background: rgba(250, 204, 21, 0.14);
    border: 1px solid rgba(250, 204, 21, 0.28);
  }
  &--low &__light {
    color: #86efac;
    background: rgba(85, 233, 149, 0.14);
    border: 1px solid rgba(85, 233, 149, 0.28);
  }

  &__title {
    font-size: 16px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__body {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 14px;
    font-size: 14px;
    color: #b8d8f0;
  }

  &__line { white-space: nowrap; }
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
  .academic-warning { grid-template-columns: 1fr; }
  .overview__body { flex-direction: column; align-items: center; }
  .overview__main { width: 100%; }
  .develop__grid { grid-template-columns: 1fr; }
  .source-panel__body,
  .course-panel__body { grid-template-columns: 1fr; }
  .source-panel__radar,
  .course-panel__radar {
    min-height: 240px;
    :deep(.chart-container) { height: 240px; }
  }
  .ledger-grid { grid-template-columns: 1fr; }
  .task-list { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bucket-grid { grid-template-columns: 1fr; }
}
</style>
