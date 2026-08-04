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

/** 页面分区导航（点击跳转到对应模块） */
const sectionNav = [
  { id: 'sec-overview', label: '心理状态总览' },
  { id: 'sec-indicators', label: '测评与趋势' },
  { id: 'sec-radar', label: '风险维度' },
  { id: 'sec-factors', label: '风险因素' },
  { id: 'sec-intervention', label: '干预跟踪' },
  { id: 'sec-ledger', label: '心理预警台账' },
  { id: 'sec-advice', label: '干预建议' },
]

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

const mentalStatusText = computed(() => {
  const lv = mentalLevel.value
  if (lv === 'high') return '心理状态多项异常，已触发高危预警，须立即介入心理干预。'
  if (lv === 'medium') return '存在心理波动与风险因素，需持续关注并安排心理疏导。'
  if (hasBehaviorLift.value) {
    return '量表总体正常，但闸机晚归提示睡眠与生活适应风险升高，需专项关注作息。'
  }
  return '整体心理状态平稳，保持常规关注即可。'
})

/* 状态总览下方的 AI 学业分析结论（从学业侧面关联心理状态） */
const aiAnalysis = computed(() => {
  const d = dashboard.value
  if (!d) return ''
  const gpa = d.academic.gpa
  return `该生心理状态等级为「${riskText(mentalLevel.value)}」，${mentalStatusText.value} 从学业侧面看，当前 GPA ${gpa.toFixed(2)}，整体学业表现${gpa >= 3 ? '平稳' : '有待提升'}。建议将学业压力疏导与心理疏导结合，关注睡眠与人际适应，避免学业波动加剧心理风险。`
})

/* ---------- 2. 心理风险维度分析（雷达图） ---------- */
/** 客观行为信号：量表正常时仍可抬高对应维度突起 */
const objectiveBehavior = computed(() => ({
  lateReturnDays: 7,
  note: '闸机数据：近 7 天连续晚归 ≥23:30',
}))

const hasBehaviorLift = computed(
  () => mentalLevel.value === 'low' && objectiveBehavior.value.lateReturnDays >= 5,
)

const DIM_NAMES = ['情绪状态', '学业压力', '人际关系', '睡眠状态', '生活适应'] as const
const riskLevelOf = (v: number) => (v >= 70 ? 'high' : v >= 40 ? 'medium' : 'low')

/* ---------- 心理测评指标（与维度风险对齐） ---------- */
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
  // 量表正常但晚归抬高睡眠风险 → 睡眠指标同步下调，避免与维度卡矛盾
  if (hasBehaviorLift.value) {
    return [
      { name: 'SCL-90 总均分', value: 1.2, max: 5, level: 'low', desc: '各因子均在正常范围' },
      { name: 'UCLA 孤独量表', value: 24, max: 80, level: 'low', desc: '人际状态良好' },
      { name: '睡眠质量指数', value: 46, max: 100, level: 'medium', desc: '自评尚可，闸机晚归提示睡眠风险升高' },
    ]
  }
  return [
    { name: 'SCL-90 总均分', value: 1.2, max: 5, level: 'low', desc: '各因子均在正常范围' },
    { name: 'UCLA 孤独量表', value: 24, max: 80, level: 'low', desc: '人际状态良好' },
    { name: '睡眠质量指数', value: 78, max: 100, level: 'low', desc: '睡眠状况良好' },
  ]
})

const psyScaleValues = computed<number[]>(() => {
  const code = mentalLevel.value
  if (code === 'high') return [82, 75, 70, 58, 65]
  if (code === 'medium') return [52, 55, 40, 42, 45]
  return [30, 38, 25, 22, 30]
})

const psyRadarValues = computed<number[]>(() => {
  const base = [...psyScaleValues.value]
  // 量表正常但客观行为异常 → 睡眠 / 生活适应突起
  if (hasBehaviorLift.value) {
    base[3] = Math.max(base[3], 72) // 睡眠状态
    base[4] = Math.max(base[4], 68) // 生活适应
  }
  return base
})

const dimensionCards = computed(() =>
  psyRadarValues.value.map((value, i) => {
    const level = riskLevelOf(value)
    const scale = psyScaleValues.value[i]
    const lifted = value > scale
    return {
      name: DIM_NAMES[i],
      value,
      scale,
      level,
      lifted,
      hint: lifted ? `量表 ${scale} · 行为叠加后 ${value}` : `风险指数 ${value}/100`,
    }
  }),
)

const psyRadarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 850,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'item' },
  legend: {
    bottom: 0,
    textStyle: { color: '#9ec7e0', fontSize: 18 },
    data: ['量表评估', '客观行为叠加'],
  },
  radar: {
    center: ['50%', '50%'],
    radius: '58%',
    indicator: [
      { name: '情绪状态', max: 100 },
      { name: '学业压力', max: 100 },
      { name: '人际关系', max: 100 },
      { name: '睡眠状态', max: 100 },
      { name: '生活适应', max: 100 },
    ],
    axisName: { color: '#b8ecff', fontSize: 19 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'rgba(0, 184, 255, 0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    data: [
      {
        value: psyScaleValues.value,
        name: '量表评估',
        symbolSize: 4,
        areaStyle: { color: 'rgba(85, 233, 149, 0.12)' },
        lineStyle: { color: '#55e995', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#55e995' },
      },
      {
        value: psyRadarValues.value,
        name: '客观行为叠加',
        symbolSize: 5,
        areaStyle: { color: 'rgba(248, 113, 113, 0.26)' },
        lineStyle: { color: '#ff7474', width: 2 },
        itemStyle: { color: '#ff7474' },
      },
    ],
  }],
}))
void psyRadarOption

/* ---------- 3. 心理状态趋势分析（折线图） ---------- */
const trend = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') return [58, 62, 68, 72]
  if (code === 'medium') return [48, 52, 50, 54]
  return [35, 32, 30, 28]
})

/** 心理健康指数（0-100，越高越健康）：由最新风险指数反推 */
const mentalIndex = computed(() => {
  const arr = trend.value
  if (!arr.length) return 70
  return Math.max(0, Math.min(100, 100 - arr[arr.length - 1]))
})

/**
 * JS 驱动动效（不受系统「减少动画」影响）：
 * - reveal: 0→1 控制所有进度条宽度
 * - gaugeAnim / displayMentalIndex: 环与数字滚动
 * - trendAnim: 折线从 0 生长到真实值
 */
const reveal = ref(0)
const gaugeAnim = ref(0)
const displayMentalIndex = ref(0)
const trendAnim = ref<number[]>([0, 0, 0, 0])
let revealRaf = 0
let gaugeRaf = 0
let trendRaf = 0

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function playPageMotion() {
  cancelAnimationFrame(revealRaf)
  cancelAnimationFrame(gaugeRaf)
  cancelAnimationFrame(trendRaf)

  reveal.value = 0
  gaugeAnim.value = 0
  displayMentalIndex.value = 0
  trendAnim.value = trend.value.map(() => 0)

  const targetGauge = mentalIndex.value
  const targetTrend = [...trend.value]

  const startReveal = performance.now()
  const tickReveal = (now: number) => {
    const t = Math.min(1, (now - startReveal) / 1300)
    reveal.value = easeOutCubic(t)
    if (t < 1) revealRaf = requestAnimationFrame(tickReveal)
  }
  revealRaf = requestAnimationFrame(tickReveal)

  const startGauge = performance.now()
  let lastGaugePaint = 0
  const tickGauge = (now: number) => {
    const t = Math.min(1, (now - startGauge) / 1400)
    const v = targetGauge * easeOutCubic(t)
    if (now - lastGaugePaint > 32 || t >= 1) {
      gaugeAnim.value = Math.round(v * 10) / 10
      displayMentalIndex.value = Math.round(v)
      lastGaugePaint = now
    }
    if (t < 1) gaugeRaf = requestAnimationFrame(tickGauge)
  }
  gaugeRaf = requestAnimationFrame(tickGauge)

  const startTrend = performance.now()
  let lastTrendPaint = 0
  const tickTrend = (now: number) => {
    const t = Math.min(1, (now - startTrend) / 1500)
    const e = easeOutCubic(t)
    if (now - lastTrendPaint > 32 || t >= 1) {
      trendAnim.value = targetTrend.map((v) => Math.round(v * e * 10) / 10)
      lastTrendPaint = now
    }
    if (t < 1) trendRaf = requestAnimationFrame(tickTrend)
  }
  trendRaf = requestAnimationFrame(tickTrend)
}

watch(
  () => [loading.value, !!dashboard.value] as const,
  async ([isLoading, hasDash]) => {
    if (!isLoading && hasDash) {
      await nextTick()
      requestAnimationFrame(() => playPageMotion())
    }
  },
)

onUnmounted(() => {
  cancelAnimationFrame(revealRaf)
  cancelAnimationFrame(gaugeRaf)
  cancelAnimationFrame(trendRaf)
})

const mentalGaugeOption = computed<EChartsOption>(() => {
  const score = gaugeAnim.value
  const tone = mentalIndex.value <= 40 ? 'high' : mentalIndex.value <= 70 ? 'medium' : 'low'
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
          lineStyle: {
            width: 18,
            color: [[1, 'rgba(20, 55, 100, 0.55)']],
          },
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 1,
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

const trendSummary = computed(() => {
  const v = trend.value
  if (v.length < 2) return '—'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '风险上升'
  if (d < -4) return '持续改善'
  return '总体平稳'
})

const mentalTrendOption = computed<EChartsOption>(() => {
  const semesters = ['大一上', '大一下', '大二上', '大二下']
  const values = trendAnim.value.length ? trendAnim.value : trend.value
  const lo = Math.min(...trend.value)
  const hi = Math.max(...trend.value)
  const yMin = Math.max(0, Math.floor((lo - 4) / 5) * 5)
  const yMax = Math.min(100, Math.ceil((hi + 4) / 5) * 5)
  return {
    animation: false,
    grid: { top: 18, bottom: 22, left: 8, right: 14 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      textStyle: { color: '#e8f7ff', fontSize: 15 },
      extraCssText: 'border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.45);',
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'rgba(0, 212, 255, 0.4)', type: 'dashed' },
      },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}心理风险指数：<b style="color:#7ff6ff">${p.value}</b>`
      },
    },
    xAxis: {
      type: 'category',
      data: semesters,
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
      name: '心理风险指数',
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
    if (hasBehaviorLift.value) {
      base[3] = {
        name: '作息情况',
        level: 'high',
        value: 72,
        desc: '近 7 天连续晚归，作息紊乱，与睡眠维度高危一致',
      }
    } else {
      base[3] = { name: '作息情况', level: 'low', value: 34, desc: '作息规律，睡眠充足' }
    }
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
    animation: true,
    animationDuration: 850,
    animationEasing: 'cubicOut',
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
      axisLabel: { ...AXIS_LABEL, fontSize: 19 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: riskFactors.value.map((f) => f.name),
      axisLabel: { ...AXIS_LABEL, fontSize: 19 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    },
    series: [{
      type: 'scatter',
      data,
      label: {
        show: true,
        position: 'right',
        color: '#d0e8f8',
        fontSize: 18,
        formatter: (params: unknown) => {
          const p = params as { value: number[] }
          return `${p.value[0]}`
        },
      },
    }],
  }
})
void riskBubbleOption

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
      '建议两周内完成一次心理访谈，评估情绪波动原因',
      '引导合理安排作息，保证每日睡眠不少于 7 小时',
      '鼓励参与同伴互助或班级活动，增强社会支持',
      '学业压力较大时，可对接学业帮扶与心理疏导双通道',
    ]
  }
  if (hasBehaviorLift.value) {
    return [
      '闸机晚归已抬高睡眠与生活适应风险，建议本周谈话核实作息',
      '引导固定入睡时间，目标 23:30 前归寝',
      '量表总体正常，保持常规关注，重点盯睡眠行为闭环',
      '可结合宿舍长反馈，观察连续晚归是否与学业/情绪相关',
    ]
  }
  return [
    '心理状态整体平稳，保持学期常规关注即可',
    '鼓励继续参与体育锻炼与集体活动，巩固积极心态',
    '关注考试周等压力节点，提前做好减压准备',
    '如出现睡眠或情绪明显波动，及时预约心理咨询',
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
      <StudentSectionNav :items="sectionNav" />

      <!-- 1. 心理状态总览 -->
      <section id="sec-overview" class="warn-section sec-full overview">
        <div class="warn-section__glow" aria-hidden="true" />
        <h3 class="warn-section__title">心理状态总览</h3>
        <div class="overview__body">
          <div class="overview__gauge">
            <div class="overview__gauge-ring">
              <div class="overview__gauge-pulse" aria-hidden="true" />
              <ChartContainer :option="mentalGaugeOption" />
              <div class="overview__gauge-value" aria-label="心理健康指数">
                <strong>{{ displayMentalIndex }}</strong>
              </div>
            </div>
            <div class="overview__gauge-cap">
              <em>{{ riskText(mentalIndex >= 70 ? 'low' : mentalIndex >= 40 ? 'medium' : 'high') }}</em>
              <span>心理健康指数</span>
            </div>
          </div>
          <div class="overview__main">
            <div class="kpi-strip">
              <div class="kpi-strip__item" :class="`is-${mentalLevel}`">
                <span class="kpi-strip__label">心理风险等级</span>
                <strong class="kpi-strip__value">{{ riskText(mentalLevel) }}</strong>
              </div>
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">综合心理状态</span>
                <strong class="kpi-strip__value">{{ dashboard.profile.mentalLevel }}</strong>
              </div>
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">最近评估时间</span>
                <strong class="kpi-strip__value is-sm">{{ lastAssessTime }}</strong>
              </div>
              <div class="kpi-strip__item">
                <span class="kpi-strip__label">状态变化趋势</span>
                <strong class="kpi-strip__value is-sm">{{ trendSummary }}</strong>
              </div>
            </div>
            <div class="risk-note" :class="`risk-note--${mentalLevel}`">
              <span class="risk-note__tag">{{ riskText(mentalLevel) }}</span>
              <span class="risk-note__text">{{ mentalStatusText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 状态总览下方：AI 学业分析 -->
      <AiAnalysisCard title="AI 心理分析" :text="aiAnalysis" class="sec-full" />

      <!-- 心理测评指标 + 心理状态趋势分析（合并） -->
      <section id="sec-indicators" class="warn-section">
        <div class="warn-section__glow warn-section__glow--cyan" aria-hidden="true" />
        <h3 class="warn-section__title">心理测评指标与状态趋势</h3>
        <h4 class="combine__sub">心理测评指标</h4>
        <div class="indicator-grid">
          <div
            v-for="(item, i) in indicators"
            :key="item.name"
            class="indicator-card"
            :class="`indicator-card--${item.level}`"
            :style="{ '--c': levelColor(item.level), '--i': i }"
          >
            <div class="indicator-card__top">
              <span class="indicator-card__name">{{ item.name }}</span>
              <span class="indicator-card__score">{{ item.value }}<small>/{{ item.max }}</small></span>
            </div>
            <div class="indicator-card__bar">
              <div
                class="indicator-card__bar-inner"
                :style="{ width: `${(item.value / item.max) * 100 * reveal}%` }"
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
      <section id="sec-radar" class="warn-section sec-full">
        <div class="warn-section__glow" aria-hidden="true" />
        <h3 class="warn-section__title">心理风险维度分析</h3>
        <p v-if="hasBehaviorLift" class="radar-obj-note">
          {{ objectiveBehavior.note }} · 量表总体正常，行为数据抬高睡眠与生活适应风险。
        </p>
        <div class="dimension-bars">
          <div
            v-for="(card, i) in dimensionCards"
            :key="card.name"
            class="dimension-bar"
            :class="[`dimension-bar--${card.level}`, { 'is-lifted': card.lifted }]"
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
            <p class="dimension-bar__hint">{{ card.hint }}</p>
          </div>
        </div>
      </section>

      <!-- 4. 心理风险因素分析（模拟数据兜底） -->
      <section id="sec-factors" class="warn-section sec-full">
        <div class="warn-section__glow warn-section__glow--cyan" aria-hidden="true" />
        <h3 class="warn-section__title">心理风险因素分析</h3>
        <div class="risk-sub">当前可能影响因素与建议关注度</div>
        <div class="factor-plot">
          <div
            v-for="f in riskFactors"
            :key="f.name"
            class="factor-plot__row"
            :class="`factor-plot__row--${f.level}`"
          >
            <div class="factor-plot__head">
              <span>{{ f.name }}</span><b>{{ f.value }}</b>
            </div>
            <div class="factor-plot__track"><i :style="{ width: `${f.value * reveal}%`, background: levelColor(f.level) }" /></div>
            <p>{{ f.desc }}</p>
          </div>
        </div>
      </section>

      <!-- 5. 心理干预跟踪 -->
      <section id="sec-intervention" class="warn-section sec-full">
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
      <section id="sec-ledger" class="warn-section">
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
      <section id="sec-advice" class="warn-section">
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

/* 雷达 + 因素 */
.radar-wrap {
  height: 240px;
  :deep(.chart-container) { height: 240px; }
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


.radar-wrap,
.risk-bubble { display: none; }

.dimension-bars {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
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
