<script setup lang="ts">
/**
 * 出口发展详情（二级页面）
 * 路由：/student/career-development?studentId=xxx
 *
 * 四个标签页：
 *   综合画像 · 升学考研 · 就业 · 考公考编
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartCard from '../academic-detail/components/ChartCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { CHART_FONT } from '@/styles/echarts-theme'
import { SCORE_FORMULAS } from '@/utils/scoreFormulas'

const route = useRoute()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

/* ────── 返回目标：智能育航详情（二级页）────── */
const studentIdQuery = computed(() => route.query.studentId as string | undefined)
const backText = computed(() => '← 返回智能育航')
const backTo = computed(() =>
  studentIdQuery.value
    ? { name: 'student-ai-portrait', query: { studentId: studentIdQuery.value } }
    : { name: 'student-ai-portrait' },
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

/* ────── 顶部标签 ────── */
type TabKey = 'graduate' | 'employment' | 'civil'
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'graduate', label: '升学考研' },
  { key: 'employment', label: '就业' },
  { key: 'civil', label: '考公考编' },
]
function resolveInitialTab(): TabKey {
  const t = route.query.tab as TabKey | undefined
  if (t === 'graduate' || t === 'employment' || t === 'civil') return t
  return 'graduate'
}
const activeTab = ref<TabKey>(resolveInitialTab())
watch(
  () => route.fullPath,
  () => {
    activeTab.value = resolveInitialTab()
  },
)

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

/* ═══════════ 就业竞争力画像 ═══════════ */
const gpa = computed(() => dashboard.value?.academic?.gpa ?? 3.42)
const majorRank = computed(() => dashboard.value?.academic?.majorRank ?? 12)
const majorTotal = computed(() => dashboard.value?.academic?.majorTotal ?? 86)

const competitivenessIndex = computed(() => {
  const base = gpa.value * 20
  const rankBonus = Math.max(0, 100 - (majorRank.value / majorTotal.value) * 100)
  const extra = 15
  const raw = base + rankBonus * 0.15 + extra
  return Math.round(Math.min(98, Math.max(40, raw)) * 10) / 10
})

const collegeAvg = computed(() => 76.5)
const majorAvg = computed(() => 81.2)
const collegePercentile = computed(() => {
  const pct = Math.round(100 - (majorRank.value / majorTotal.value) * 100)
  return Math.min(99, Math.max(1, pct))
})

const starLevel = computed(() => {
  const v = competitivenessIndex.value
  if (v >= 90) return '★★★★★'
  if (v >= 80) return '★★★★☆'
  if (v >= 70) return '★★★☆☆'
  if (v >= 60) return '★★☆☆☆'
  return '★☆☆☆☆'
})

function makeGauge(value: number, progressColor: string | { type: 'linear'; x: number; y: number; x2: number; y2: number; colorStops: Array<{ offset: number; color: string }> }, solidColor: string): EChartsOption {
  const glow = `${solidColor}aa`
  /** 单层同心半环：不再叠外圈装饰，避免「背影」和主弧对不齐 */
  const center: [string, string] = ['50%', '60%']
  const radius = '58%'
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
        splitNumber: 5,
        pointer: { show: false },
        anchor: { show: false },
        axisTick: {
          show: true,
          distance: -11,
          length: 7,
          splitNumber: 4,
          lineStyle: { color: 'rgba(140, 210, 255, 0.4)', width: 1 },
        },
        splitLine: {
          show: true,
          distance: -11,
          length: 12,
          lineStyle: { color: 'rgba(170, 230, 255, 0.6)', width: 2 },
        },
        axisLabel: {
          show: true,
          distance: -22,
          color: '#b8dff2',
          fontSize: 14,
          fontWeight: 700,
        },
        title: { show: false },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '10%'],
          formatter: (v: number) => `{num|${Number(v).toFixed(v % 1 === 0 ? 0 : 1)}}`,
          rich: {
            num: {
              fontSize: CHART_FONT.gaugeCompact + 34,
              fontFamily: 'DIN Alternate, Segoe UI, sans-serif',
              fontWeight: 900,
              color: '#ffffff',
              textShadowColor: solidColor,
              textShadowBlur: 28,
              lineHeight: 62,
            },
          },
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 18,
            color: [[1, 'rgba(20, 60, 110, 0.45)']],
            shadowBlur: 0,
          },
        },
        progress: {
          show: true,
          roundCap: true,
          width: 18,
          itemStyle: {
            color: progressColor,
            shadowBlur: 18,
            shadowColor: glow,
          },
        },
        data: [{ value }],
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
          length: '4%',
          width: 12,
          offsetCenter: [0, '-92%'],
          itemStyle: {
            color: '#ffffff',
            borderColor: solidColor,
            borderWidth: 3,
            shadowBlur: 14,
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
        data: [{ value }],
        z: 3,
      },
    ],
  }
}

/** 根据竞争力等级生成进度弧渐变（沿弧线方向：左下 → 右上） */
type GaugeProgressColor =
  | string
  | { type: 'linear'; x: number; y: number; x2: number; y2: number; colorStops: Array<{ offset: number; color: string }> }

function gaugeGradient(v: number): { progressColor: GaugeProgressColor; solidColor: string } {
  if (v >= 80) {
    return {
      progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
        { offset: 0, color: '#5ee7ff' },
        { offset: 0.45, color: '#34d399' },
        { offset: 1, color: '#a7f3d0' },
      ] },
      solidColor: '#5eead4',
    }
  }
  if (v >= 65) {
    return {
      progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
        { offset: 0, color: '#fde68a' },
        { offset: 1, color: '#fb923c' },
      ] },
      solidColor: '#fbbf24',
    }
  }
  return {
    progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
      { offset: 0, color: '#fda4af' },
      { offset: 1, color: '#ef4444' },
    ] },
    solidColor: '#fb7185',
  }
}

const gaugeOption = computed<EChartsOption>(() => {
  const v = competitivenessIndex.value
  const { progressColor, solidColor } = gaugeGradient(v)
  return makeGauge(v, progressColor, solidColor)
})

const rankBarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 900,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 48, right: 16, top: 36, bottom: 8, containLabel: true },
  xAxis: {
    type: 'category',
    data: [dashboard.value?.profile?.name?.slice(0, 4) || '本人', '学院平均', '专业平均'],
    axisLabel: {
      color: '#b8dceb',
      fontSize: 16,
      fontWeight: 700,
      margin: 12,
      interval: 0,
      hideOverlap: true,
    },
    axisTick: { show: false },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.22)' } },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 100,
    splitNumber: 4,
    axisLabel: { color: '#7ea8c4', fontSize: 14 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.1)', type: 'dashed' } },
  },
  series: [{
    type: 'bar',
    barWidth: 36,
    data: [
      {
        value: competitivenessIndex.value,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: competitivenessIndex.value >= 80
              ? [{ offset: 0, color: '#6effc8' }, { offset: 1, color: '#1aa87a' }]
              : [{ offset: 0, color: '#5ee7ff' }, { offset: 1, color: '#0088cc' }],
          },
          shadowBlur: 14,
          shadowColor: 'rgba(80, 220, 255, 0.35)',
        },
      },
      {
        value: collegeAvg.value,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(140, 220, 255, 0.75)' },
              { offset: 1, color: 'rgba(40, 120, 180, 0.55)' },
            ],
          },
        },
      },
      {
        value: majorAvg.value,
        itemStyle: {
          borderRadius: [6, 6, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(160, 140, 255, 0.7)' },
              { offset: 1, color: 'rgba(70, 60, 160, 0.5)' },
            ],
          },
        },
      },
    ],
    label: {
      show: true,
      position: 'top',
      color: '#f6fbff',
      fontSize: 18,
      fontWeight: 800,
      distance: 6,
      textShadowColor: 'rgba(0, 40, 80, 0.65)',
      textShadowBlur: 6,
    },
  }],
}))

/* ═══════════ 目标岗位匹配分析 ═══════════ */
/** 匹配度着色：≥80绿 / ≥60黄 / ≥40橙 / <40红 */
function matchToneColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#facc15'
  if (score >= 40) return '#fb923c'
  return '#f87171'
}

interface JobDirection {
  name: string
  match: number
  color: string
  advantages: string[]
  gaps: string[]
}

const selectedJobIdx = ref(0)

const jobDirections = computed<JobDirection[]>(() => [
  { name: '软件开发工程师', match: 92,
    advantages: ['Java课程成绩优秀', 'Spring Boot项目2项', '数据结构基础良好', 'GitHub项目活跃'],
    gaps: ['企业实习不足', '算法训练不足'] },
  { name: 'Java后端工程师', match: 90,
    advantages: ['Java核心技术扎实', '电商订单项目经验', 'MySQL数据库熟练', '具备微服务基础认知'],
    gaps: ['缺少Redis/Kafka实战', '缺乏分布式系统经验'] },
  { name: '前端开发工程师', match: 85,
    advantages: ['Vue3项目经验丰富', '组件化开发思维好', '有个人作品集网站', 'TypeScript基础扎实'],
    gaps: ['React框架经验空白', '移动端适配经验不足'] },
  { name: '数据分析师', match: 78,
    advantages: ['Python/Pandas熟练', '统计学基础扎实', '数据可视化项目经历', 'SQL查询能力强'],
    gaps: ['缺少业务分析经验', '机器学习算法薄弱'] },
  { name: '算法工程师', match: 72,
    advantages: ['数学基础扎实', '数据结构与算法课程高分', '参加过蓝桥杯竞赛', 'Python编程熟练'],
    gaps: ['缺乏深度学习项目', '论文阅读与实践不足'] },
].map((j) => ({ ...j, color: matchToneColor(j.match) })))

const selectedJob = computed(() => jobDirections.value[selectedJobIdx.value])

const radarOption = computed<EChartsOption>(() => {
  const indicators = jobDirections.value.map((j) => ({ name: j.name, max: 100 }))
  const data = jobDirections.value.map((j) => j.match)
  return {
    tooltip: {},
    legend: { show: false },
    radar: {
      center: ['50%', '50%'],
      radius: '58%',
      indicator: indicators,
      axisName: { color: '#889ec2', fontSize: 16.5, padding: [2, 4] },
      splitArea: { areaStyle: { color: ['rgba(0,184,255,0.02)', 'rgba(0,184,255,0.04)', 'rgba(0,184,255,0.02)', 'rgba(0,184,255,0.04)', 'rgba(0,184,255,0.02)'] } },
      splitLine: { lineStyle: { color: 'rgba(102,217,255,0.15)' } },
      axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
    },
    series: [{
      type: 'radar',
      data: [{
        value: data,
        name: '匹配度',
        areaStyle: { color: 'rgba(0,212,255,0.12)' },
        lineStyle: { color: '#00d4ff', width: 2 },
        itemStyle: { color: '#00d4ff' },
        symbol: 'circle',
        symbolSize: 6,
      }],
    }],
  }
})

/* ═══════════ 就业能力差距分析 ═══════════ */
void radarOption

const jobMatchBarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 900,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 12, right: 48, top: 10, bottom: 8, containLabel: true },
  xAxis: {
    type: 'value', max: 100, splitNumber: 4,
    axisLabel: { color: '#769fbd', fontSize: 13 },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,.1)', type: 'dashed' } },
  },
  yAxis: {
    type: 'category',
    inverse: true,
    data: jobDirections.value.map((job) => job.name),
    axisLabel: {
      color: '#d5edff',
      fontSize: 15,
      fontWeight: 700,
      width: 108,
      overflow: 'truncate',
      ellipsis: '…',
    },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [{
    type: 'bar',
    barWidth: 14,
    data: jobDirections.value.map((job) => ({
      value: job.match,
      itemStyle: {
        borderRadius: 10,
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: job.color },
            { offset: 1, color: `${job.color}cc` },
          ],
        },
        shadowBlur: 10,
        shadowColor: `${job.color}55`,
      },
    })),
    showBackground: true,
    backgroundStyle: { color: 'rgba(80, 125, 166, .18)', borderRadius: 10 },
    label: {
      show: true,
      position: 'right',
      color: '#e8f8ff',
      fontSize: 15,
      fontWeight: 800,
      formatter: '{c}%',
      distance: 6,
    },
  }],
}))

interface GapItem {
  skill: string
  current: number
  target: number
  label: string
}

const gapItems = computed<GapItem[]>(() => [
  { skill: 'Java基础', current: 95, target: 90, label: '熟练掌握' },
  { skill: '数据库', current: 80, target: 85, label: '基本达标' },
  { skill: '工程实践', current: 60, target: 85, label: '需加强' },
  { skill: '企业经验', current: 30, target: 80, label: '严重不足' },
  { skill: '面试能力', current: 50, target: 75, label: '需提升' },
])

const gapSummary = computed(() => {
  const weak = gapItems.value.filter((g) => g.current < g.target * 0.6)
  if (!weak.length) return '当前各维度能力与目标岗位要求基本匹配，建议持续积累项目经验。'
  const names = weak.map((g) => g.skill).join('、')
  return `${names}方面与目标岗位要求差距较大，是影响就业竞争力的主要因素。建议重点补齐短板，通过实习或项目实践提升实战能力。`
})

function gapBarColor(pct: number): string {
  if (pct >= 85) return 'linear-gradient(90deg, #20c997, #34d399)'
  if (pct >= 50) return 'linear-gradient(90deg, #f0c040, #facc15)'
  return 'linear-gradient(90deg, #f87171, #ef4444)'
}

/* ═══════════ 就业路径预测 ═══════════ */
interface TimelineNode {
  date: string
  event: string
  detail: string
  probability: number
  status: 'done' | 'current' | 'upcoming'
}

const timelineNodes = computed<TimelineNode[]>(() => [
  { date: '2026.09', event: '参加企业实习', detail: '进入中软国际Java后端开发实习岗位，参与电商订单模块开发', probability: 85, status: 'upcoming' },
  { date: '2026.10', event: '简历优化迭代', detail: '根据实习经历完善简历，提炼项目亮点与技术栈', probability: 90, status: 'upcoming' },
  { date: '2026.12', event: '完成企业项目', detail: '在实习期间完成至少1项独立模块开发并通过评审', probability: 80, status: 'upcoming' },
  { date: '2027.03', event: '秋招准备启动', detail: '投递目标企业，参加校园招聘宣讲与笔试面试', probability: 72, status: 'upcoming' },
  { date: '2027.06', event: '进入软件开发岗位', detail: '锁定目标企业offer，以Java后端/全栈方向入职', probability: 68, status: 'upcoming' },
])

function probColor(p: number): string {
  if (p >= 80) return '#34d399'
  if (p >= 65) return '#f0c040'
  return '#f87171'
}

/* ═══════════ 就业风险预警 ═══════════ */
interface RiskItem {
  name: string
  level: 'high' | 'medium' | 'low'
  probability: number
  impact: number
}

const riskItems = computed<RiskItem[]>(() => [
  { name: '无正式实习经历', level: 'high', probability: 80, impact: 85 },
  { name: '项目数量不足', level: 'medium', probability: 55, impact: 60 },
  { name: '简历完善度不足', level: 'medium', probability: 50, impact: 55 },
  { name: '目标岗位明确', level: 'low', probability: 15, impact: 10 },
  { name: '缺少行业认证', level: 'medium', probability: 60, impact: 50 },
  { name: '面试经验为零', level: 'high', probability: 75, impact: 70 },
])

const LX_LABEL: Record<string, string> = { high: '高', medium: '中', low: '低' }
const LX_COLOR: Record<string, string> = { high: '#f87171', medium: '#facc15', low: '#34d399' }
const LV_BG: Record<string, string> = { high: 'rgba(248,113,113,0.15)', medium: 'rgba(250,204,21,0.12)', low: 'rgba(52,211,153,0.12)' }

/* ═══════════ KPI / 基础信息 ═══════════ */
const employmentDestination = computed(() => {
  if (!dashboard.value) return '—'
  return dashboard.value.careerDev.employmentDestination || dashboard.value.careerDev.employmentIntention || '待实习'
})
const targetCity = computed(() => dashboard.value?.careerDev.targetCity || '深圳市南山区')
const expectedSalary = computed(() => dashboard.value?.careerDev.expectedSalary || '15-25K / 月')
const resumeStatus = computed(() => dashboard.value?.careerDev.resumeStatus || '已投递 12 家企业，等待面试通知')

/* ═══════════ 升学考研 ═══════════ */
const gradIndex = computed(() => 88)

const gradDimItems = computed(() => [
  { name: 'GPA基础', value: 95 },
  { name: '专业排名', value: 95 },
  { name: '英语能力', value: 80 },
  { name: '数学能力', value: 70 },
  { name: '科研经历', value: 65 },
  { name: '项目经历', value: 78 },
])

const gradRadarOption = computed<EChartsOption>(() => {
  const items = gradDimItems.value
  const scoreMap = Object.fromEntries(items.map((d) => [d.name, d.value]))
  return {
    animation: true,
    animationDuration: 1200,
    animationEasing: 'cubicOut',
    tooltip: {
      confine: true,
      backgroundColor: 'rgba(6, 17, 52, 0.96)',
      borderColor: 'rgba(140, 180, 255, 0.4)',
      textStyle: { color: '#e2edff', fontSize: 15 },
    },
    radar: {
      center: ['50%', '52%'],
      radius: '58%',
      axisNameGap: 12,
      indicator: items.map((d) => ({ name: d.name, max: 100 })),
      axisName: {
        color: '#e8f7ff',
        fontSize: 14,
        fontWeight: 700,
        formatter: (name: string) => {
          const score = scoreMap[name] ?? ''
          return `{n|${name}}\n{s|${score}}`
        },
        rich: {
          n: {
            color: '#d7ecff',
            fontSize: 14,
            fontWeight: 700,
            lineHeight: 20,
          },
          s: {
            color: '#b8a6ff',
            fontSize: 17,
            fontWeight: 800,
            fontFamily: 'DIN Alternate, sans-serif',
            lineHeight: 22,
            textShadowColor: 'rgba(167, 139, 250, 0.55)',
            textShadowBlur: 10,
          },
        },
      },
      splitNumber: 4,
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            'rgba(140, 120, 255, 0.02)',
            'rgba(80, 180, 255, 0.06)',
            'rgba(140, 120, 255, 0.03)',
            'rgba(80, 180, 255, 0.09)',
          ],
        },
      },
      splitLine: {
        lineStyle: { color: 'rgba(140, 190, 255, 0.28)', width: 1.2 },
      },
      axisLine: {
        lineStyle: { color: 'rgba(160, 150, 255, 0.35)', width: 1.2 },
      },
    },
    series: [{
      type: 'radar',
      symbol: 'circle',
      symbolSize: 9,
      lineStyle: {
        color: '#a78bfa',
        width: 3,
        shadowColor: 'rgba(167, 139, 250, 0.75)',
        shadowBlur: 14,
      },
      itemStyle: {
        color: '#0a1028',
        borderColor: '#d4c4ff',
        borderWidth: 2.5,
        shadowColor: 'rgba(180, 160, 255, 0.85)',
        shadowBlur: 10,
      },
      areaStyle: {
        color: {
          type: 'radial',
          x: 0.5,
          y: 0.5,
          r: 0.7,
          colorStops: [
            { offset: 0, color: 'rgba(180, 160, 255, 0.32)' },
            { offset: 0.5, color: 'rgba(100, 160, 255, 0.22)' },
            { offset: 1, color: 'rgba(40, 100, 220, 0.06)' },
          ],
        },
      },
      data: [{
        value: items.map((d) => d.value),
        name: '考研竞争力',
      }],
      z: 2,
    }],
  }
})

const gradStrengths = computed(() => ['GPA 专业前5%', '数据结构基础扎实', '有竞赛经历'])
const gradWeakness = computed(() => ['科研论文不足', '算法训练不足', '夏令营经历缺失'])

interface SchoolTarget {
  tier: string
  tierClass: 'rush' | 'target' | 'safe'
  name: string
  match: number
}
const schoolTargets = computed<SchoolTarget[]>(() => [
  { tier: '冲刺院校', tierClass: 'rush', name: '中山大学', match: 78 },
  { tier: '稳妥院校', tierClass: 'target', name: '华南理工大学', match: 91 },
  { tier: '保底院校', tierClass: 'safe', name: '暨南大学', match: 95 },
])

/* ── 考研准备度进度 ── */
interface PrepItem { name: string; value: number }
const prepItems = computed<PrepItem[]>(() => [
  { name: '数学基础', value: 80 },
  { name: '专业课', value: 90 },
  { name: '英语', value: 70 },
  { name: '政治', value: 30 },
  { name: '科研经历', value: 40 },
])
const prepOverall = computed(() => Math.round(prepItems.value.reduce((s, i) => s + i.value, 0) / prepItems.value.length))
const prepGap = computed(() => 100 - prepOverall.value)

/* ── 目标院校竞争分析：本人 vs 录取平均 ── */
interface CompeteItem { skill: string; self: number; avg: number }
const competeItems = computed<CompeteItem[]>(() => [
  { skill: '数学能力', self: 75, avg: 85 },
  { skill: '专业课', self: 90, avg: 88 },
  { skill: '科研经历', self: 40, avg: 70 },
])

/* ── 考研风险预测 ── */
const gradRiskItems = computed<RiskItem[]>(() => [
  { name: '目标院校竞争激烈', level: 'high', probability: 82, impact: 88 },
  { name: '数学基础不足', level: 'medium', probability: 58, impact: 65 },
  { name: '科研经历不足', level: 'medium', probability: 60, impact: 55 },
  { name: '英语成绩波动', level: 'medium', probability: 50, impact: 50 },
  { name: '复试经验不足', level: 'low', probability: 35, impact: 45 },
  { name: '夏令营经历缺失', level: 'low', probability: 30, impact: 40 },
])

/* ── AI 考研任务清单 ── */
interface TaskItem { text: string }
interface TaskGroup { period: string; cls: 'recent' | 'mid' | 'long'; tasks: TaskItem[] }
const gradTaskGroups = computed<TaskGroup[]>(() => [
  { period: '近期任务（1个月）', cls: 'recent', tasks: [
    { text: '完成数据结构二轮复习' },
    { text: '数学刷题 300 题' },
    { text: '联系目标导师' },
  ] },
  { period: '中期任务（3个月）', cls: 'mid', tasks: [
    { text: '完成专业课真题' },
    { text: '补充科研经历' },
    { text: '完成英语作文模板' },
  ] },
  { period: '长期目标', cls: 'long', tasks: [
    { text: '冲刺目标院校' },
    { text: '准备复试材料' },
    { text: '完成导师沟通' },
  ] },
])

function gradBarColor(pct: number): string {
  if (pct >= 90) return 'linear-gradient(90deg, #20c997, #34d399)'
  if (pct >= 80) return 'linear-gradient(90deg, #00b8ff, #66d9ff)'
  if (pct >= 50) return 'linear-gradient(90deg, #f0c040, #facc15)'
  return 'linear-gradient(90deg, #f87171, #ef4444)'
}

/* 考研准备度进度条统一蓝绿配色 */
const PREP_BAR_BG = 'linear-gradient(90deg, #00b8ff, #34d399)'

/* ═══════════ 考公考编 ═══════════ */
const civilIndex = computed(() => 82)
const civilStarLevel = computed(() => {
  const v = civilIndex.value
  if (v >= 90) return '★★★★★'
  if (v >= 80) return '★★★★☆'
  if (v >= 70) return '★★★☆☆'
  if (v >= 60) return '★★☆☆☆'
  return '★☆☆☆☆'
})

/* 模块一：考公发展画像 KPI */
const civilKpis = computed(() => [
  { label: '目标类型', value: '省考公务员' },
  { label: '意向地区', value: '广东省' },
  { label: '报考方向', value: '计算机类岗位' },
  { label: '当前状态', value: '备考中' },
])

/* 模块二：五维能力雷达（数据来源学校已有数据） */
const civilRadarOption = computed<EChartsOption>(() => ({
  tooltip: {},
  radar: {
    center: ['50%', '52%'],
    radius: '64%',
    indicator: [
      { name: '学历背景', max: 100 },
      { name: '专业匹配', max: 100 },
      { name: '成绩基础', max: 100 },
      { name: '综合素质', max: 100 },
      { name: '实践经历', max: 100 },
    ],
    axisName: { color: '#9fe9c9', fontSize: 17, padding: [2, 4] },
    splitArea: { areaStyle: { color: ['rgba(52,211,153,0.02)', 'rgba(52,211,153,0.05)', 'rgba(52,211,153,0.02)', 'rgba(52,211,153,0.05)', 'rgba(52,211,153,0.02)'] } },
    splitLine: { lineStyle: { color: 'rgba(52,211,153,0.15)' } },
    axisLine: { lineStyle: { color: 'rgba(52,211,153,0.2)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: [95, 80, 92, 78, 65],
      name: '公考能力',
      areaStyle: { color: 'rgba(52,211,153,0.16)' },
      lineStyle: { color: '#34d399', width: 2 },
      itemStyle: { color: '#34d399' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  }],
}))

const civilRadarSource = computed(() => [
  { dim: '学历背景', source: '专业、学历' },
  { dim: '专业匹配', source: '岗位专业要求匹配' },
  { dim: '成绩基础', source: 'GPA、排名' },
  { dim: '综合素质', source: '奖项、学生干部、竞赛' },
  { dim: '实践经历', source: '项目、实习、志愿' },
])

/* 模块三：岗位匹配分析 */
interface CivilMatchPost {
  name: string
  match: number
  advantages: string[]
  limits: string[]
}
const civilMatchPosts = computed<CivilMatchPost[]>(() => [
  { name: '广东省考 信息技术类', match: 92, advantages: ['专业符合', 'GPA优秀'], limits: ['缺少基层经历'] },
  { name: '深圳市直 综合管理类', match: 85, advantages: ['综合素质强', '学生干部经历'], limits: ['申论需提升'] },
  { name: '广州基层公务员', match: 78, advantages: ['专业对口', '实践经历足'], limits: ['竞争偏激烈'] },
  { name: '选调生', match: 70, advantages: ['成绩基础好'], limits: ['基层经历不足', '名额有限'] },
])

function civilMatchColor(pct: number): string {
  if (pct >= 85) return 'linear-gradient(90deg, #20c997, #34d399)'
  if (pct >= 70) return 'linear-gradient(90deg, #00b8ff, #34d399)'
  return 'linear-gradient(90deg, #f0c040, #facc15)'
}

/* 模块四：报考风险分析（X：岗位竞争程度 Y：个人匹配程度） */
const civilRiskItems = computed<RiskItem[]>(() => [
  { name: '岗位竞争压力高', level: 'high', probability: 85, impact: 35 },
  { name: '备考时间不足', level: 'medium', probability: 55, impact: 50 },
  { name: '岗位选择范围窄', level: 'medium', probability: 40, impact: 55 },
  { name: '材料准备不足', level: 'low', probability: 30, impact: 45 },
])

/* 模块五：考公准备度分析（六项，数据可获取） */
interface CivilPrepItem { name: string; value: number }
const civilPrepItems = computed<CivilPrepItem[]>(() => [
  { name: '报名准备', value: 90 },
  { name: '政策了解', value: 75 },
  { name: '岗位筛选', value: 85 },
  { name: '材料准备', value: 70 },
  { name: '考试规划', value: 60 },
  { name: '实践经历', value: 80 },
])
const civilPrepOverall = computed(() => Math.round(civilPrepItems.value.reduce((s, i) => s + i.value, 0) / civilPrepItems.value.length))

/* 模块六：考公备考时间轴 */
interface CivilTimelineNode { date: string; event: string; detail: string; status: 'done' | 'doing' | 'todo'; probability: number }
const civilTimeline = computed<CivilTimelineNode[]>(() => [
  { date: '2026-06', event: '完成岗位筛选', detail: '明确目标岗位与报考方向', status: 'done', probability: 100 },
  { date: '2026-08', event: '关注广东省考公告', detail: '留意报名时间与报考条件', status: 'doing', probability: 90 },
  { date: '2026-09', event: '完成报名材料准备', detail: '整理学历、证明等材料', status: 'todo', probability: 80 },
  { date: '2026-11', event: '参加笔试', detail: '行测与申论', status: 'todo', probability: 70 },
  { date: '2027-01', event: '准备面试', detail: '结构化面试训练', status: 'todo', probability: 60 },
])

/* 模块七：备考任务（底部闭环） */
interface CivilTask { text: string; meta: string; state: string }
interface CivilTaskGroup { period: string; cls: 'recent' | 'mid' | 'long'; tasks: CivilTask[] }
const civilTaskGroups = computed<CivilTaskGroup[]>(() => [
  { period: '近期任务', cls: 'recent', tasks: [
    { text: '完成岗位筛选', meta: '截止：2026-08', state: '未完成' },
  ] },
  { period: '中期任务', cls: 'mid', tasks: [
    { text: '参加公务员考试培训', meta: '目标：提升考试准备度', state: '进行中' },
  ] },
  { period: '长期任务', cls: 'long', tasks: [
    { text: '积累基层实践经历', meta: '提升岗位竞争力', state: '计划中' },
  ] },
])

/* ═══════════ 综合画像（已移除）═══════════ */

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="出口发展详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    :back-text="backText"
    :back-to="backTo"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="career-development">
      <!-- 顶部标签 -->
      <div class="exit-tabs">
        <button
          v-for="t in tabs"
          :key="t.key"
          class="exit-tab"
          :class="{ 'exit-tab--active': activeTab === t.key }"
          @click="activeTab = t.key"
        >
          {{ t.label }}
        </button>
      </div>

      <!-- ═══════════ 升学考研 ═══════════ -->
      <div v-if="activeTab === 'graduate'" class="detail-grid">
        <!-- ① 考研竞争力画像（雷达 + 能力拆解）并排 考研准备度进度 -->
        <div class="section-title section-title--full">考研竞争力画像 · 考研准备度进度</div>

        <!-- 左：考研竞争力画像（雷达在上，能力拆解在下） -->
        <section class="panel-card grad-profile">
          <div class="panel-card__glow" aria-hidden="true" />
          <div class="panel-card__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <h3 class="panel-card__title">考研竞争力画像</h3>
            <span class="panel-card__sub">六维评估 · {{ gradIndex }}</span>
          </div>
          <div class="grad-radar-wrap">
            <span class="grad-radar-wrap__halo" aria-hidden="true" />
            <span class="grad-radar-wrap__ring" aria-hidden="true" />
            <ChartContainer :option="gradRadarOption" class="grad-radar-chart" />
          </div>
          <div class="grad-profile__split">
            <div class="ability-split">
              <div class="ability-split__col">
                <h4 class="ability-split__title ability-split__title--good">优势能力</h4>
                <ul class="ability-split__list">
                  <li v-for="s in gradStrengths" :key="s" class="ability-split__item ability-split__item--good">{{ s }}</li>
                </ul>
              </div>
              <div class="ability-split__col">
                <h4 class="ability-split__title ability-split__title--gap">短板能力</h4>
                <ul class="ability-split__list">
                  <li v-for="w in gradWeakness" :key="w" class="ability-split__item ability-split__item--gap">{{ w }}</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- 右：考研准备度进度 -->
        <div class="grad-prep">
          <div class="grad-prep__glow" aria-hidden="true" />
          <div class="grad-prep__head-title">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="grad-prep__title">考研准备度进度</span>
          </div>
          <div class="grad-prep__bars">
            <div v-for="p in prepItems" :key="p.name" class="grad-prep__item">
              <div class="grad-prep__head">
                <span class="grad-prep__name">{{ p.name }}</span>
                <span class="grad-prep__val">{{ p.value }}<small>%</small></span>
              </div>
              <div class="grad-prep__bar">
                <div class="grad-prep__bar-inner" :style="{ width: `${p.value}%`, background: PREP_BAR_BG }" />
              </div>
            </div>
          </div>
          <div class="grad-prep__overall">
            <div class="grad-prep__overall-num">{{ prepOverall }}<small>%</small></div>
            <div class="grad-prep__overall-meta">
              <span class="grad-prep__overall-label">整体准备度</span>
              <span class="grad-prep__gap">距目标院校还差 {{ prepGap }}%</span>
            </div>
          </div>
        </div>

        <!-- ② 院校梯度分析 并排 目标院校竞争分析 -->
        <div class="section-title section-title--full">院校梯度分析 · 目标院校竞争分析</div>

        <!-- 左：院校梯度分析（冲稳保） -->
        <div class="grad-school-section">
          <div class="grad-school-section__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="grad-school-section__title">院校梯度分析</span>
          </div>
          <div class="grad-school-list">
            <div v-for="s in schoolTargets" :key="s.name" class="school-item" :class="`school-item--${s.tierClass}`">
              <div class="school-item__head">
                <span class="school-tier" :class="`school-tier--${s.tierClass}`">{{ s.tier }}</span>
                <span class="school-item__name">{{ s.name }}</span>
                <span class="school-item__pct">匹配 {{ s.match }}%</span>
              </div>
              <div class="school-item__bar">
                <div class="school-item__bar-inner" :style="{ width: `${s.match}%`, background: gradBarColor(s.match) }" />
              </div>
            </div>
          </div>
        </div>

        <!-- 右：目标院校竞争分析 -->
        <div class="grad-compete">
          <div class="grad-compete__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="grad-compete__title">目标院校竞争分析</span>
          </div>
          <div class="grad-compete__legend">
            <span class="grad-compete__legend-item"><i class="grad-compete__dot grad-compete__dot--self" />本人</span>
            <span class="grad-compete__legend-item"><i class="grad-compete__dot grad-compete__dot--avg" />录取学生平均</span>
          </div>
          <div class="grad-compete__list">
            <div v-for="c in competeItems" :key="c.skill" class="grad-compete__item">
              <span class="grad-compete__skill">{{ c.skill }}</span>
              <div class="grad-compete__bars">
                <div class="grad-compete__row">
                  <div class="grad-compete__track">
                    <div class="grad-compete__bar grad-compete__bar--self" :style="{ width: `${c.self}%` }" />
                  </div>
                  <span class="grad-compete__num">{{ c.self }}</span>
                </div>
                <div class="grad-compete__row">
                  <div class="grad-compete__track">
                    <div class="grad-compete__bar grad-compete__bar--avg" :style="{ width: `${c.avg}%` }" />
                  </div>
                  <span class="grad-compete__num">{{ c.avg }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ⑤ 考研风险预测 -->
        <div class="section-title section-title--full">考研风险预测</div>
        <div class="risk-section">
          <div class="risk-matrix risk-matrix--grad">
            <div class="risk-matrix__axes">
              <span class="risk-matrix__ylabel">影响程度 ↑</span>
              <span class="risk-matrix__xlabel">发生概率 →</span>
            </div>
            <div class="risk-matrix__grid">
              <div
                v-for="item in gradRiskItems"
                :key="item.name"
                class="risk-bubble"
                :style="{
                  left: `${(item.probability / 100) * 88}%`,
                  bottom: `${(item.impact / 100) * 88}%`,
                  background: LX_COLOR[item.level],
                  boxShadow: `0 0 10px ${LX_COLOR[item.level]}44`,
                }"
                :title="`${item.name} | 概率${item.probability}% | 影响${item.impact}%`"
              >
                <span class="risk-bubble__label">{{ item.name }}</span>
              </div>
            </div>
          </div>
          <div class="risk-table">
            <div class="risk-table__head">
              <span class="risk-table__th risk-table__th--name">风险项</span>
              <span class="risk-table__th risk-table__th--lv">等级</span>
              <span class="risk-table__th risk-table__th--prob">发生概率</span>
              <span class="risk-table__th risk-table__th--impact">影响程度</span>
            </div>
            <div v-for="item in gradRiskItems" :key="item.name" class="risk-table__row">
              <span class="risk-table__cell risk-table__cell--name">{{ item.name }}</span>
              <span class="risk-table__cell risk-table__cell--lv" :style="{ color: LX_COLOR[item.level], background: LV_BG[item.level] }">{{ LX_LABEL[item.level] }}</span>
              <span class="risk-table__cell risk-table__cell--prob">{{ item.probability }}%</span>
              <span class="risk-table__cell risk-table__cell--impact">{{ item.impact }}%</span>
            </div>
          </div>
        </div>

        <!-- ⑥ AI 考研任务清单 -->
        <div class="section-title section-title--full">AI 考研任务清单</div>
        <div class="grad-tasks">
          <div v-for="g in gradTaskGroups" :key="g.period" class="grad-task" :class="`grad-task--${g.cls}`">
            <div class="grad-task__head">
              <span class="grad-task__period">{{ g.period }}</span>
            </div>
            <ul class="grad-task__list">
              <li v-for="t in g.tasks" :key="t.text" class="grad-task__item">
                <span class="grad-task__text">{{ t.text }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- ═══════════ 就业 ═══════════ -->
      <div v-else-if="activeTab === 'employment'" class="career-development">
        <!-- KPI 概览 -->
        <section class="warn-section">
          <div class="kpi-grid">
            <div class="kpi-card">
              <span class="kpi-card__label">就业去向</span>
              <strong class="kpi-card__value">{{ employmentDestination }}</strong>
            </div>
            <div class="kpi-card">
              <span class="kpi-card__label">求职意向城市</span>
              <strong class="kpi-card__value">{{ targetCity }}</strong>
            </div>
            <div class="kpi-card">
              <span class="kpi-card__label">期望薪资</span>
              <strong class="kpi-card__value">{{ expectedSalary }}</strong>
            </div>
            <div class="kpi-card">
              <span class="kpi-card__label">简历状态</span>
              <strong class="kpi-card__value">{{ resumeStatus }}</strong>
            </div>
          </div>
        </section>

        <div class="detail-grid">
          <!-- 就业竞争力画像 -->
          <div class="section-title section-title--full">就业竞争力画像</div>

          <ChartCard title="就业竞争力指数" :sub="starLevel" compact class="emp-chart-card emp-gauge-card">
            <div class="emp-gauge-wrap">
              <ChartContainer :option="gaugeOption" class="emp-chart emp-gauge-chart" />
            </div>
            <template #footer>
              <div class="competition-meta">
                <div class="comp-meta-item">
                  <span class="comp-meta__label">学院平均</span>
                  <span class="comp-meta__value">{{ collegeAvg }}</span>
                </div>
                <div class="comp-meta-item">
                  <span class="comp-meta__label">专业平均</span>
                  <span class="comp-meta__value">{{ majorAvg }}</span>
                </div>
                <div class="comp-meta-item">
                  <span class="comp-meta__label">超过学院</span>
                  <span class="comp-meta__value comp-meta__value--accent">{{ collegePercentile }}%</span>
                </div>
              </div>
            </template>
          </ChartCard>

          <ChartCard title="同专业排名对比" sub="竞争力指数" compact class="emp-chart-card">
            <ChartContainer :option="rankBarOption" class="emp-chart" />
            <template #footer>
              <div class="competition-meta competition-meta--rank">
                <div class="comp-meta-item">
                  <span class="comp-meta__label">专业排名</span>
                  <span class="comp-meta__value">{{ majorRank }}/{{ majorTotal }}</span>
                </div>
                <div class="comp-meta-item">
                  <span class="comp-meta__label">超越比例</span>
                  <span class="comp-meta__value comp-meta__value--accent">前 {{ collegePercentile }}%</span>
                </div>
              </div>
              <p class="comp-meta-source">数据来源：GPA · 排名 · 项目 · 竞赛 · 证书 · 实习</p>
            </template>
          </ChartCard>

          <!-- 目标岗位匹配分析 + 就业能力差距分析 -->
          <div class="section-title section-title--full">目标岗位匹配分析</div>

          <section class="panel-card panel-card--glow emp-match-panel">
            <div class="panel-card__glow" aria-hidden="true" />
            <div class="panel-card__head">
              <span class="panel-card__bar" aria-hidden="true" />
              <h3 class="panel-card__title">
                <StuHint
                  tip="悬停柱条对应岗位匹配度；颜色按匹配分档着色"
                  :formula="SCORE_FORMULAS.matchTone + '\n' + SCORE_FORMULAS.scoreTone"
                  :delay="280"
                >岗位契合度分析</StuHint>
              </h3>
              <div class="job-tabs job-tabs--head">
                <button
                  v-for="(j, idx) in jobDirections"
                  :key="j.name"
                  class="job-tab"
                  :class="{ 'job-tab--active': idx === selectedJobIdx }"
                  :style="{ '--tab-color': j.color }"
                  @click="selectedJobIdx = idx"
                >
                  {{ j.name.slice(0, 4) }}
                </button>
              </div>
            </div>
            <ChartContainer :option="jobMatchBarOption" class="emp-match-chart" />
            <div class="match-detail">
              <div class="match-col">
                <h4 class="match-col__title match-col__title--good">匹配优势</h4>
                <ul class="match-list">
                  <li v-for="a in selectedJob.advantages" :key="a" class="match-item match-item--good">
                    {{ a }}
                  </li>
                </ul>
              </div>
              <div class="match-col">
                <h4 class="match-col__title match-col__title--gap">缺失能力</h4>
                <ul class="match-list">
                  <li v-for="g in selectedJob.gaps" :key="g" class="match-item match-item--gap">
                    {{ g }}
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <div class="gap-section panel-card--glow">
            <div class="panel-card__glow" aria-hidden="true" />
            <div class="gap-header">
              <h4 class="gap-header__title">目标岗位：{{ selectedJob.name }}</h4>
              <span class="gap-header__badge">能力 Gap</span>
            </div>
            <div class="gap-list">
              <div v-for="g in gapItems" :key="g.skill" class="gap-item">
                <div class="gap-item__head">
                  <span class="gap-item__skill">{{ g.skill }}</span>
                  <span
                    class="gap-item__label"
                    :class="`gap-item__label--${g.label === '严重不足' ? 'danger' : (g.label === '需加强' || g.label === '需提升') ? 'warn' : 'ok'}`"
                  >{{ g.label }}</span>
                  <span class="gap-item__pct">{{ g.current }}<small>%</small></span>
                </div>
                <div class="gap-item__bar">
                  <div
                    class="gap-item__bar-inner"
                    :style="{ width: `${g.current}%`, background: gapBarColor(g.current) }"
                  />
                  <div
                    class="gap-item__bar-target"
                    :style="{ left: `${g.target}%` }"
                    :title="`目标 ${g.target}%`"
                  />
                </div>
                <div class="gap-item__target-hint">目标 {{ g.target }}%</div>
              </div>
            </div>
            <div class="gap-conclusion">
              <span class="gap-conclusion__icon">⚡</span>
              <span class="gap-conclusion__text">{{ gapSummary }}</span>
            </div>
          </div>

          <!-- 未来发展路径预测 -->
          <div class="section-title section-title--full">未来发展路径预测</div>

          <div class="timeline-section">
            <div class="timeline">
              <div
                v-for="(node, idx) in timelineNodes"
                :key="node.date"
                class="timeline-node"
                :class="{ 'timeline-node--last': idx === timelineNodes.length - 1 }"
              >
                <div class="timeline-node__marker" :class="`timeline-node__marker--${node.status}`">
                  <span class="timeline-node__dot" />
                </div>
                <div class="timeline-node__content">
                  <span class="timeline-node__date">{{ node.date }}</span>
                  <strong class="timeline-node__event">{{ node.event }}</strong>
                  <p class="timeline-node__detail">{{ node.detail }}</p>
                  <div class="timeline-node__prob">
                    <span class="timeline-node__prob-label">成功概率</span>
                    <span class="timeline-node__prob-value" :style="{ color: probColor(node.probability) }">{{ node.probability }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 就业风险预警 -->
          <div class="section-title section-title--full">就业风险预警</div>

          <div class="risk-section">
            <div class="risk-matrix">
              <div class="risk-matrix__axes">
                <span class="risk-matrix__ylabel">影响程度 ↑</span>
                <span class="risk-matrix__xlabel">发生概率 →</span>
              </div>
              <div class="risk-matrix__grid">
                <div
                  v-for="item in riskItems"
                  :key="item.name"
                  class="risk-bubble"
                  :style="{
                    left: `${(item.probability / 100) * 88}%`,
                    bottom: `${(item.impact / 100) * 88}%`,
                    background: LX_COLOR[item.level],
                    boxShadow: `0 0 10px ${LX_COLOR[item.level]}44`,
                  }"
                  :title="`${item.name} | 概率${item.probability}% | 影响${item.impact}%`"
                >
                  <span class="risk-bubble__label">{{ item.name.slice(0, 4) }}</span>
                </div>
              </div>
            </div>
            <div class="risk-table">
              <div class="risk-table__head">
                <span class="risk-table__th risk-table__th--name">风险项</span>
                <span class="risk-table__th risk-table__th--lv">等级</span>
                <span class="risk-table__th risk-table__th--prob">发生概率</span>
                <span class="risk-table__th risk-table__th--impact">影响程度</span>
              </div>
              <div v-for="item in riskItems" :key="item.name" class="risk-table__row">
                <span class="risk-table__cell risk-table__cell--name">{{ item.name }}</span>
                <span class="risk-table__cell risk-table__cell--lv" :style="{ color: LX_COLOR[item.level], background: LV_BG[item.level] }">{{ LX_LABEL[item.level] }}</span>
                <span class="risk-table__cell risk-table__cell--prob">{{ item.probability }}%</span>
                <span class="risk-table__cell risk-table__cell--impact">{{ item.impact }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 考公考编 ═══════════ -->
      <div v-else-if="activeTab === 'civil'" class="detail-grid">
        <!-- 模块一：考公发展画像 -->
        <div class="section-title section-title--full">考公发展画像</div>
        <section class="warn-section">
          <div class="kpi-grid">
            <div v-for="k in civilKpis" :key="k.label" class="kpi-card">
              <span class="kpi-card__label">{{ k.label }}</span>
              <strong class="kpi-card__value">{{ k.value }}</strong>
            </div>
          </div>
        </section>

        <!-- 模块二：考公竞争力画像（仪表盘 + 五维雷达） -->
        <div class="section-title section-title--full">考公竞争力画像</div>

        <ChartCard title="考公竞争力指数" :sub="civilStarLevel" compact>
          <ChartContainer :option="makeGauge(civilIndex, '#34d399', '#34d399')" style="height: 190px" />
          <template #footer>
            <div class="civil-gauge-foot">
              <span class="civil-gauge-foot__num">{{ civilIndex }}</span>
              <span class="civil-gauge-foot__tag">具备竞争优势</span>
            </div>
          </template>
        </ChartCard>

        <section class="panel-card">
          <div class="panel-card__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <h3 class="panel-card__title">五维能力雷达</h3>
            <span class="panel-card__sub">学校数据</span>
          </div>
          <ChartContainer :option="civilRadarOption" style="height: 300px" />
        </section>

        <!-- 能力维度数据来源 -->
        <div class="civil-source">
          <div class="civil-source__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="civil-source__title">能力维度数据来源</span>
          </div>
          <div class="civil-source__table">
            <div class="civil-source__row civil-source__row--head">
              <span class="civil-source__th">维度</span>
              <span class="civil-source__th">数据来源</span>
            </div>
            <div v-for="s in civilRadarSource" :key="s.dim" class="civil-source__row">
              <span class="civil-source__dim">{{ s.dim }}</span>
              <span class="civil-source__val">{{ s.source }}</span>
            </div>
          </div>
        </div>

        <!-- 模块三：岗位匹配分析 -->
        <div class="section-title section-title--full">岗位匹配分析</div>
        <div class="civil-match">
          <div v-for="p in civilMatchPosts" :key="p.name" class="civil-match__item">
            <div class="civil-match__head">
              <span class="civil-match__name">{{ p.name }}</span>
              <span class="civil-match__pct">匹配 {{ p.match }}%</span>
            </div>
            <div class="civil-match__bar">
              <div class="civil-match__bar-inner" :style="{ width: `${p.match}%`, background: civilMatchColor(p.match) }" />
            </div>
            <div class="civil-match__tags">
              <span v-for="a in p.advantages" :key="a" class="civil-match__tag civil-match__tag--good">✓ {{ a }}</span>
              <span v-for="l in p.limits" :key="l" class="civil-match__tag civil-match__tag--gap">△ {{ l }}</span>
            </div>
          </div>
        </div>

        <!-- 模块四：报考风险分析 -->
        <div class="section-title section-title--full">报考风险分析</div>
        <div class="risk-section">
          <div class="risk-matrix risk-matrix--civil">
            <div class="risk-matrix__axes">
              <span class="risk-matrix__ylabel">个人匹配程度 ↑</span>
              <span class="risk-matrix__xlabel">岗位竞争程度 →</span>
            </div>
            <div class="risk-matrix__grid">
              <div
                v-for="item in civilRiskItems"
                :key="item.name"
                class="risk-bubble"
                :style="{
                  left: `${(item.probability / 100) * 88}%`,
                  bottom: `${(item.impact / 100) * 88}%`,
                  background: LX_COLOR[item.level],
                  boxShadow: `0 0 10px ${LX_COLOR[item.level]}44`,
                }"
                :title="`${item.name} | 竞争${item.probability}% | 匹配${item.impact}%`"
              >
                <span class="risk-bubble__label">{{ item.name }}</span>
              </div>
            </div>
          </div>
          <div class="risk-table">
            <div class="risk-table__head">
              <span class="risk-table__th risk-table__th--name">风险项</span>
              <span class="risk-table__th risk-table__th--lv">等级</span>
              <span class="risk-table__th risk-table__th--prob">竞争程度</span>
              <span class="risk-table__th risk-table__th--impact">匹配程度</span>
            </div>
            <div v-for="item in civilRiskItems" :key="item.name" class="risk-table__row">
              <span class="risk-table__cell risk-table__cell--name">{{ item.name }}</span>
              <span class="risk-table__cell risk-table__cell--lv" :style="{ color: LX_COLOR[item.level], background: LV_BG[item.level] }">{{ LX_LABEL[item.level] }}</span>
              <span class="risk-table__cell risk-table__cell--prob">{{ item.probability }}%</span>
              <span class="risk-table__cell risk-table__cell--impact">{{ item.impact }}%</span>
            </div>
          </div>
        </div>

        <!-- 模块五：考公准备度分析 -->
        <div class="section-title section-title--full">考公准备度分析</div>
        <div class="grad-prep">
          <div class="grad-prep__head-title">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="grad-prep__title">考公准备度分析</span>
          </div>
          <div class="grad-prep__bars">
            <div v-for="p in civilPrepItems" :key="p.name" class="grad-prep__item">
              <div class="grad-prep__head">
                <span class="grad-prep__name">{{ p.name }}</span>
                <span class="grad-prep__val">{{ p.value }}%</span>
              </div>
              <div class="grad-prep__bar">
                <div class="grad-prep__bar-inner" :style="{ width: `${p.value}%`, background: PREP_BAR_BG }" />
              </div>
            </div>
          </div>
          <div class="grad-prep__overall">
            <div class="grad-prep__overall-num">{{ civilPrepOverall }}%</div>
            <div class="grad-prep__overall-meta">
              <span class="grad-prep__overall-label">整体准备度</span>
            </div>
          </div>
        </div>

        <!-- 模块六：考公备考时间轴 -->
        <div class="section-title section-title--full">考公备考时间轴</div>
        <div class="timeline-section">
          <div class="timeline">
            <div
              v-for="(node, idx) in civilTimeline"
              :key="node.date"
              class="timeline-node"
              :class="{ 'timeline-node--last': idx === civilTimeline.length - 1 }"
            >
              <div class="timeline-node__marker" :class="`timeline-node__marker--${node.status}`">
                <span class="timeline-node__dot" />
              </div>
              <div class="timeline-node__content">
                <span class="timeline-node__date">{{ node.date }}</span>
                <strong class="timeline-node__event">{{ node.event }}</strong>
                <p class="timeline-node__detail">{{ node.detail }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 模块七：备考任务（底部闭环） -->
        <div class="section-title section-title--full">备考任务</div>
        <div class="grad-tasks">
          <div v-for="g in civilTaskGroups" :key="g.period" class="grad-task" :class="`grad-task--${g.cls}`">
            <div class="grad-task__head">
              <span class="grad-task__period">{{ g.period }}</span>
            </div>
            <ul class="grad-task__list">
              <li v-for="t in g.tasks" :key="t.text" class="grad-task__item">
                <span class="grad-task__text">{{ t.text }}</span>
                <span class="grad-task__meta">{{ t.meta }}</span>
                <span class="grad-task__state" :class="`grad-task__state--${g.cls}`">{{ t.state }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.career-development {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
}

/* ── 顶部标签 ── */
.exit-tabs {
  display: flex;
  gap: 8px;
  padding: 7px;
  border-radius: 12px;
  background:
    radial-gradient(80% 120% at 50% 0%, rgba(0, 160, 255, 0.12), transparent 60%),
    rgba(6, 17, 52, 0.55);
  border: 1px solid rgba(0, 206, 255, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(180, 230, 255, 0.1),
    0 0 20px rgba(0, 140, 220, 0.1);
}

.exit-tab {
  flex: 1;
  padding: 11px 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: transparent;
  color: #9ec7e0;
  font-size: 20px;
  font-weight: 750;
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: all 0.22s;

  &:hover {
    background: rgba(0, 50, 95, 0.45);
    color: #d0e8f8;
  }

  &--active {
    background: linear-gradient(180deg, rgba(0, 184, 255, 0.32), rgba(0, 100, 190, 0.2));
    border-color: rgba(0, 220, 255, 0.6);
    color: #f6fbff;
    text-shadow: 0 0 12px rgba(80, 220, 255, 0.45);
    box-shadow:
      0 0 18px rgba(0, 184, 255, 0.3),
      inset 0 0 16px rgba(0, 184, 255, 0.12);
  }
}

/* ── 通用板块外框 ── */
.warn-section {
  position: relative;
  padding: 14px 16px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(90% 70% at 100% 0%, rgba(0, 180, 255, 0.12), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  border: 1px solid rgba(102, 217, 255, 0.28);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 28px rgba(0, 140, 220, 0.12);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
    pointer-events: none;
  }
}

/* ── KPI Grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.kpi-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 10px;
  background:
    linear-gradient(145deg, rgba(0, 90, 160, 0.28), rgba(4, 20, 48, 0.55));
  border: 1px solid rgba(90, 200, 255, 0.28);
  border-left: 3px solid rgba(0, 220, 255, 0.75);
  box-shadow:
    inset 0 0 18px rgba(0, 140, 220, 0.1),
    0 0 16px rgba(0, 160, 255, 0.08);
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: -40%;
    width: 40%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(140, 230, 255, 0.12), transparent);
    animation: empKpiSweep 5.5s ease-in-out infinite;
    pointer-events: none;
  }

  &__label {
    font-size: 16px;
    color: #8fc4e4;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  &__value {
    font-size: 22px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.25;
    text-shadow: 0 0 12px rgba(80, 200, 255, 0.35);
  }
}

@keyframes empKpiSweep {
  0% { left: -40%; opacity: 0; }
  20% { opacity: 1; }
  100% { left: 120%; opacity: 0; }
}

/* ── 两列网格 ── */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

/* ── 跨列标题 ── */
.section-title {
  font-size: 22px;
  font-weight: 800;
  color: #c8f0ff;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  text-shadow: 0 0 12px rgba(0, 200, 255, 0.28);

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(0, 220, 255, 0.45), transparent);
    box-shadow: 0 0 8px rgba(0, 200, 255, 0.25);
  }

  &--full {
    grid-column: 1 / -1;
  }
}

/* ── 通用面板卡片（与 ChartCard 同风格）── */
.panel-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.28);
  border-radius: 12px;
  background:
    radial-gradient(90% 70% at 100% 100%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 24px rgba(0, 140, 220, 0.1);
  padding: 14px 16px;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
    pointer-events: none;
    z-index: 2;
  }

  &__glow {
    position: absolute;
    inset: auto -15% -35% auto;
    width: 50%;
    height: 65%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  &__head {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__bar {
    width: 3px;
    height: 18px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7ff6ff, #00b8ff);
    box-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    color: #f4fbff;
    text-shadow: 0 0 12px rgba(0, 242, 255, 0.22);
  }

  &__sub {
    margin-left: auto;
    font-size: 15px;
    color: rgba(184, 236, 255, 0.65);
  }
}

.emp-match-panel {
  min-height: 0;
}

.emp-match-chart {
  height: 220px;
  flex-shrink: 0;
}

:deep(.emp-chart-card.chart-card--compact) {
  height: 380px;
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 28px rgba(0, 160, 255, 0.14);
}

:deep(.emp-gauge-card.chart-card--compact) {
  height: 460px;
}

:deep(.emp-gauge-card .chart-card__head) {
  margin-bottom: 4px;
}

:deep(.emp-gauge-card .chart-card__body) {
  overflow: hidden;
  flex: 1 1 auto;
  min-height: 280px;
}

:deep(.emp-gauge-card .chart-card__foot) {
  flex: 0 0 auto;
  margin-top: 4px;
  padding-top: 8px;
}

:deep(.emp-gauge-card .chart-card__hint) {
  color: #f5d76e;
  letter-spacing: 0.12em;
  text-shadow: 0 0 10px rgba(245, 215, 110, 0.45);
}

.emp-chart {
  height: 100%;
  min-height: 0;
}

.emp-gauge-wrap {
  position: relative;
  height: 100%;
  min-height: 280px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  box-sizing: border-box;
  padding: 4px 8px 0;
  background:
    radial-gradient(ellipse at 50% 52%, rgba(40, 180, 255, 0.16), transparent 58%),
    linear-gradient(180deg, rgba(6, 28, 58, 0.22), rgba(2, 10, 28, 0.08));
}

.emp-gauge-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  min-height: 280px;
}

.emp-gauge-card .competition-meta {
  gap: 6px;
}

.emp-gauge-card .comp-meta-item {
  padding: 8px 6px;
}

@keyframes empGaugeHalo {
  0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(0.92); }
  50% { opacity: 0.95; transform: translate(-50%, -50%) scale(1.06); }
}

@keyframes empGaugeRing {
  0%, 100% { opacity: 0.45; box-shadow: 0 0 18px rgba(60, 200, 255, 0.15), inset 0 0 20px rgba(40, 160, 255, 0.08); }
  50% { opacity: 0.85; box-shadow: 0 0 32px rgba(60, 200, 255, 0.32), inset 0 0 30px rgba(40, 160, 255, 0.16); }
}

/* ── 竞争力 meta ── */
.competition-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;

  &--rank {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.comp-meta-item {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px 8px;
  border-radius: 10px;
  background:
    linear-gradient(160deg, rgba(20, 70, 120, 0.42), rgba(4, 20, 48, 0.55));
  border: 1px solid rgba(120, 210, 255, 0.28);
  box-shadow:
    inset 0 1px 0 rgba(180, 230, 255, 0.16),
    inset 0 0 16px rgba(0, 140, 220, 0.1),
    0 0 14px rgba(0, 160, 255, 0.1);
  min-width: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12%;
    right: 12%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(140, 235, 255, 0.75), transparent);
    pointer-events: none;
  }
}

.comp-meta__label {
  font-size: 13px;
  color: #9ecae6;
  letter-spacing: 0.06em;
  white-space: nowrap;
  font-weight: 650;
}

.comp-meta__value {
  font-size: 24px;
  font-weight: 900;
  color: #f6fbff;
  font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
  line-height: 1.05;
  text-shadow:
    0 0 12px rgba(100, 220, 255, 0.45),
    0 0 22px rgba(40, 160, 255, 0.25);
  white-space: nowrap;

  &--accent {
    color: #7ff6ff;
    text-shadow:
      0 0 14px rgba(80, 240, 255, 0.55),
      0 0 26px rgba(40, 180, 255, 0.3);
  }
}

.comp-meta-source {
  margin: 8px 0 0;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  color: #7ea8c4;
  text-align: center;
  letter-spacing: 0.02em;
  background: rgba(0, 40, 80, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── 岗位标签 ── */
.job-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: center;
  margin-top: 8px;

  &--head {
    margin-top: 0;
    margin-left: auto;
    justify-content: flex-end;
    flex-wrap: nowrap;
    gap: 4px;
  }
}

.job-tab {
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(102, 217, 255, 0.2);
  background: rgba(0, 38, 73, 0.4);
  color: #9ec7e0;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: rgba(102, 217, 255, 0.45);
    background: rgba(0, 38, 73, 0.6);
  }

  &--active {
    border-color: var(--tab-color);
    background: color-mix(in srgb, var(--tab-color) 18%, rgba(0, 30, 60, 0.7));
    color: #f4fbff;
    box-shadow: 0 0 12px color-mix(in srgb, var(--tab-color) 40%, transparent);
  }
}

/* ── 岗位匹配详情（并排）── */
.match-detail {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.match-col {
  &__title {
    margin: 0 0 8px;
    font-size: 16px;
    font-weight: 750;
    letter-spacing: 0.04em;

    &--good { color: #34d399; text-shadow: 0 0 8px rgba(52, 211, 153, 0.35); }
    &--gap { color: #f0c040; text-shadow: 0 0 8px rgba(240, 192, 64, 0.3); }
  }
}

.match-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  line-height: 1.35;
  padding: 6px 10px;
  border-radius: 6px;

  &--good {
    color: #c8e8d8;
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.16);
  }

  &--gap {
    color: #e8d9a0;
    background: rgba(240, 192, 64, 0.08);
    border: 1px solid rgba(240, 192, 64, 0.16);
  }
}

/* ── 能力差距分析 ── */
.gap-section {
  position: relative;
  padding: 14px 16px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(90% 70% at 0% 100%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  border: 1px solid rgba(102, 217, 255, 0.28);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 24px rgba(0, 140, 220, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
    pointer-events: none;
  }
}

.gap-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
  flex-wrap: wrap;

  &__title {
    font-size: 18px;
    font-weight: 750;
    color: #f4fbff;
    margin: 0;
    letter-spacing: 0.02em;
    text-shadow: 0 0 10px rgba(80, 200, 255, 0.25);
  }

  &__badge {
    font-size: 13px;
    font-weight: 700;
    color: #7ff6ff;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.35);
    box-shadow: 0 0 10px rgba(0, 184, 255, 0.18);
  }
}

.gap-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.gap-item {
  &__head {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 10px;
    margin-bottom: 6px;
  }

  &__skill {
    font-size: 15px;
    font-weight: 750;
    color: #d8eefc;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  &__label {
    justify-self: start;
    font-size: 13px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 700;
    white-space: nowrap;

    &--ok { color: #34d399; background: rgba(52, 211, 153, 0.14); border: 1px solid rgba(52, 211, 153, 0.28); }
    &--warn { color: #f0c040; background: rgba(240, 192, 64, 0.14); border: 1px solid rgba(240, 192, 64, 0.28); }
    &--danger { color: #f87171; background: rgba(248, 113, 113, 0.14); border: 1px solid rgba(248, 113, 113, 0.28); }
  }

  &__pct {
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
    text-shadow: 0 0 10px rgba(80, 220, 255, 0.45);
    white-space: nowrap;

    small {
      margin-left: 1px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.75;
    }
  }

  &__bar {
    position: relative;
    height: 10px;
    border-radius: 999px;
    background: rgba(0, 50, 100, 0.55);
    overflow: visible;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.35);
  }

  &__bar-inner {
    position: relative;
    height: 100%;
    border-radius: 999px;
    overflow: hidden;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 0 12px rgba(80, 220, 255, 0.35);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      animation: empBarShine 2.8s ease-in-out infinite;
    }
  }

  &__bar-target {
    position: absolute;
    top: -3px;
    width: 2px;
    height: 16px;
    border-radius: 2px;
    background: #f6fbff;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.55);
    transform: translateX(-50%);
    z-index: 2;
  }

  &__target-hint {
    margin-top: 4px;
    font-size: 12px;
    color: #6f9bbd;
    text-align: right;
    letter-spacing: 0.02em;
  }
}

@keyframes empBarShine {
  0% { transform: translateX(-120%); opacity: 0; }
  30% { opacity: 1; }
  100% { transform: translateX(120%); opacity: 0; }
}

.gap-conclusion {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  background:
    linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(40, 20, 40, 0.35));
  border: 1px solid rgba(248, 113, 113, 0.28);
  box-shadow: inset 0 0 18px rgba(248, 113, 113, 0.06);

  &__icon { flex-shrink: 0; font-size: 20px; filter: drop-shadow(0 0 6px rgba(248, 113, 113, 0.5)); }

  &__text {
    font-size: 15px;
    color: #f0d0d0;
    line-height: 1.55;
  }
}

/* ── 时间轴 ── */
.timeline-section {
  grid-column: 1 / -1;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.2),
    inset 0 0 24px rgba(0, 184, 255, 0.12);
}

.timeline {
  display: flex;
  gap: 0;
  padding: 8px 0;
  overflow-x: auto;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 120px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 14px;
    left: calc(50% + 10px);
    width: calc(100% - 20px);
    height: 2px;
    background: linear-gradient(90deg, rgba(0, 206, 255, 0.5), rgba(0, 206, 255, 0.15));
  }

  &--last::after { display: none; }

  &__marker {
    position: relative;
    z-index: 1;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-bottom: 10px;

    &--done { background: rgba(52, 211, 153, 0.25); border: 2px solid #34d399; }
    &--current { background: rgba(0, 206, 255, 0.25); border: 2px solid #00ceff; }
    &--upcoming { background: rgba(102, 217, 255, 0.12); border: 2px solid rgba(102, 217, 255, 0.4); }
  }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;

    .timeline-node__marker--done & { background: #34d399; }
    .timeline-node__marker--current & { background: #00ceff; }
    .timeline-node__marker--upcoming & { background: rgba(102, 217, 255, 0.5); }
  }

  &__content {
    text-align: center;
    padding: 0 4px;
  }

  &__date {
    display: block;
    font-size: 18px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__event {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: #f6fbff;
    margin: 4px 0 2px;
  }

  &__detail {
    margin: 0;
    font-size: 17px;
    color: #889ec2;
    line-height: 1.5;
  }

  &__prob {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
  }

  &__prob-label {
    font-size: 16px;
    color: #6f9bbd;
  }

  &__prob-value {
    font-size: 22px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* ── 风险预警 ── */
.risk-section {
  grid-column: 1 / -1;
  display: block;
}

.risk-matrix {
  display: none;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);

  &__axes {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 19px;
    color: #6f9bbd;
    padding: 0 6px;
  }

  &__ylabel { writing-mode: vertical-lr; }

  &__grid {
    position: relative;
    height: 240px;
    background:
      linear-gradient(rgba(102, 217, 255, 0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(102, 217, 255, 0.06) 1px, transparent 1px);
    background-size: 25% 25%;
    border-left: 1px solid rgba(102, 217, 255, 0.18);
    border-bottom: 1px solid rgba(102, 217, 255, 0.18);
    margin: 0 6px 6px 6px;
    border-radius: 4px;
  }
}

.risk-bubble {
  position: absolute;
  transform: translate(-50%, 50%);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: transform 0.2s;

  &:hover {
    transform: translate(-50%, 50%) scale(1.15);
    z-index: 2;
  }

  &__label {
    font-size: 18px;
    font-weight: 700;
    color: #030c22;
    text-align: center;
    line-height: 1.2;
    word-break: break-all;
  }

  /* 考研 / 考公风险：完整文字，改为胶囊气泡 */
  .risk-matrix--grad &,
  .risk-matrix--civil & {
    width: auto;
    height: auto;
    min-width: 56px;
    min-height: 40px;
    padding: 6px 10px;
    border-radius: 999px;
    transform: translate(-50%, 50%);

    &:hover {
      transform: translate(-50%, 50%) scale(1.08);
      z-index: 2;
    }
  }

  .risk-matrix--grad &__label,
  .risk-matrix--civil &__label {
    font-size: 18px;
    white-space: nowrap;
    word-break: normal;
  }
}

.risk-table {
  width: 100%;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-table__head {
  display: grid;
  grid-template-columns: 1fr 56px 72px 72px;
  gap: 4px;
  margin-bottom: 2px;
}

.risk-table__th {
  font-size: 19px;
  color: #6f9bbd;
  font-weight: 600;
  padding: 0 4px;

  &--name { text-align: left; }
  &--lv { text-align: center; }
  &--prob { text-align: center; }
  &--impact { text-align: center; }
}

.risk-table__row {
  display: grid;
  grid-template-columns: 1fr 56px 72px 72px;
  gap: 4px;
  align-items: center;
  padding: 8px 4px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);

  &:hover { background: rgba(0, 38, 73, 0.4); }
}

.risk-table__cell {
  font-size: 21px;

  &--name {
    color: #d0e8f8;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--lv {
    text-align: center;
    font-size: 19px;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 3px;
  }

  &--prob {
    text-align: center;
    color: #f6fbff;
    font-weight: 700;
    font-family: 'DIN Alternate', sans-serif;
  }

  &--impact {
    text-align: center;
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* ── 能力拆解条（升学）── */
.ability-bars {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.ability-bar {
  display: grid;
  grid-template-columns: 64px 1fr 34px;
  align-items: center;
  gap: 8px;

  &__name {
    font-size: 19px;
    color: #b8d6ec;
    font-weight: 600;
  }

  &__track {
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  &__val {
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
    text-align: right;
  }
}

/* ── 院校梯度（升学）── */
.school-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.school-item {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 5px;
  }

  &__name {
    font-size: 20px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__pct {
    margin-left: auto;
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__bar {
    height: 9px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }
}

.school-tier {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;

  &--rush { color: #f87171; background: rgba(248, 113, 113, 0.14); border: 1px solid rgba(248, 113, 113, 0.3); }
  &--target { color: #66d9ff; background: rgba(102, 217, 255, 0.14); border: 1px solid rgba(102, 217, 255, 0.3); }
  &--safe { color: #34d399; background: rgba(52, 211, 153, 0.14); border: 1px solid rgba(52, 211, 153, 0.3); }
}

/* ── 考研竞争力画像（雷达 + 能力拆解合并）── */
.grad-profile {
  position: relative;
  min-width: 0;
  overflow: hidden;

  &__split {
    position: relative;
    z-index: 1;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid rgba(140, 180, 255, 0.16);
  }
}

.grad-radar-wrap {
  position: relative;
  z-index: 1;
  height: 268px;
  border-radius: 10px;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 50% 48%, rgba(120, 100, 255, 0.16), transparent 58%),
    radial-gradient(circle at 80% 20%, rgba(0, 180, 255, 0.1), transparent 40%),
    linear-gradient(180deg, rgba(10, 28, 64, 0.4), rgba(4, 12, 32, 0.2));

  &__halo {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 200px;
    height: 200px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(160, 140, 255, 0.28), transparent 68%);
    filter: blur(10px);
    animation: empGaugeHalo 4.5s ease-in-out infinite;
    pointer-events: none;
  }

  &__ring {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 132px;
    height: 132px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    border: 1px solid rgba(170, 150, 255, 0.22);
    box-shadow:
      0 0 22px rgba(140, 120, 255, 0.2),
      inset 0 0 24px rgba(100, 140, 255, 0.1);
    pointer-events: none;
    animation: empGaugeRing 5.2s ease-in-out infinite;
  }
}

.grad-radar-chart {
  position: relative;
  z-index: 1;
  height: 100%;
}

/* ── 能力拆解（升学竞争力画像右侧）── */
.ability-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  &__col {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 15px;
    font-weight: 750;
    letter-spacing: 0.04em;

    &--good { color: #34d399; text-shadow: 0 0 8px rgba(52, 211, 153, 0.35); }
    &--gap { color: #f0c040; text-shadow: 0 0 8px rgba(240, 192, 64, 0.3); }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 7px;
    font-size: 14px;
    color: #d0e8f8;
    line-height: 1.4;
    padding: 7px 10px;
    border-radius: 8px;
    min-width: 0;

    &--good {
      background: rgba(52, 211, 153, 0.08);
      border: 1px solid rgba(52, 211, 153, 0.2);
    }

    &--gap {
      background: rgba(240, 192, 64, 0.08);
      border: 1px solid rgba(240, 192, 64, 0.2);
    }
  }

  &__icon {
    flex-shrink: 0;
    font-weight: 800;

    .ability-split__item--good & { color: #34d399; }
    .ability-split__item--gap & { color: #f0c040; }
  }
}

/* ── 院校梯度分析 ── */
.grad-school-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 21px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}

.school-item {
  &--rush { background: rgba(248, 113, 113, 0.04); border-radius: 6px; padding: 8px 10px; border: 1px solid rgba(248, 113, 113, 0.15); }
  &--target { background: rgba(102, 217, 255, 0.04); border-radius: 6px; padding: 8px 10px; border: 1px solid rgba(102, 217, 255, 0.15); }
  &--safe { background: rgba(52, 211, 153, 0.04); border-radius: 6px; padding: 8px 10px; border: 1px solid rgba(52, 211, 153, 0.15); }
}

/* ── 考研准备度进度 ── */
.grad-prep {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 14px 16px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(90% 70% at 100% 0%, rgba(0, 180, 255, 0.12), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  border: 1px solid rgba(102, 217, 255, 0.28);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.06),
    0 0 24px rgba(0, 140, 220, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
    pointer-events: none;
  }

  &__glow {
    position: absolute;
    inset: auto -15% -35% auto;
    width: 50%;
    height: 65%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  &__head-title {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 20px;
    font-weight: 800;
    color: #f4fbff;
    text-shadow: 0 0 10px rgba(80, 200, 255, 0.25);
  }

  &__bars {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 5px;
    min-width: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  &__name {
    flex: 1;
    min-width: 0;
    font-size: 15px;
    font-weight: 700;
    color: #d8eefc;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__val {
    flex-shrink: 0;
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
    text-shadow: 0 0 10px rgba(80, 220, 255, 0.4);

    small {
      margin-left: 1px;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.75;
    }
  }

  &__bar {
    height: 10px;
    border-radius: 999px;
    background: rgba(0, 50, 100, 0.55);
    overflow: hidden;
    box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.35);
  }

  &__bar-inner {
    position: relative;
    height: 100%;
    border-radius: 999px;
    transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.35);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.35), transparent);
      animation: empBarShine 2.8s ease-in-out infinite;
    }
  }

  &__overall {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 10px;
    background:
      linear-gradient(145deg, rgba(0, 90, 160, 0.28), rgba(4, 20, 48, 0.55));
    border: 1px solid rgba(90, 200, 255, 0.28);
    box-shadow:
      inset 0 1px 0 rgba(180, 230, 255, 0.14),
      0 0 16px rgba(0, 160, 255, 0.1);
  }

  &__overall-num {
    font-size: 36px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
    text-shadow:
      0 0 14px rgba(0, 212, 255, 0.5),
      0 0 28px rgba(40, 160, 255, 0.3);
    line-height: 1;

    small {
      margin-left: 2px;
      font-size: 16px;
      font-weight: 700;
      opacity: 0.75;
    }
  }

  &__overall-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    text-align: right;
    min-width: 0;
  }

  &__overall-label {
    font-size: 14px;
    color: #8fc4e4;
    letter-spacing: 0.04em;
  }

  &__gap {
    font-size: 13px;
    font-weight: 700;
    color: #f0c040;
    text-shadow: 0 0 8px rgba(240, 192, 64, 0.3);
  }
}

/* ── 目标院校竞争分析 ── */
.grad-compete {
  padding: 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 21px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__legend {
    display: flex;
    gap: 18px;
    margin: 10px 0 12px;
  }

  &__legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 19px;
    color: #b8d6ec;
  }

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 3px;

    &--self { background: #00b8ff; }
    &--avg { background: #facc15; }
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__skill {
    flex-shrink: 0;
    width: 80px;
    font-size: 13.5px;
    font-weight: 700;
    color: #d0e8f8;
  }

  &__bars {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__track {
    flex: 1;
    min-width: 0;
  }

  &__bar {
    height: 14px;
    border-radius: 4px;
    transition: width 0.6s ease;

    &--self { background: linear-gradient(90deg, #0090e0, #00b8ff); }
    &--avg { background: linear-gradient(90deg, #e0b020, #facc15); }
  }

  &__num {
    flex-shrink: 0;
    width: 34px;
    text-align: right;
    font-size: 20px;
    font-weight: 800;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* ── AI 考研任务清单 ── */
.grad-tasks {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.grad-task {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.14);
  overflow: hidden;

  &--recent { border-color: rgba(248, 113, 113, 0.35); }
  &--mid { border-color: rgba(240, 192, 64, 0.35); }
  &--long { border-color: rgba(52, 211, 153, 0.35); }

  &__head {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
  }

  &--recent .grad-task__head { background: rgba(248, 113, 113, 0.1); }
  &--mid .grad-task__head { background: rgba(240, 192, 64, 0.1); }
  &--long .grad-task__head { background: rgba(52, 211, 153, 0.1); }

  &__period {
    font-size: 20px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 9px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
    font-size: 19px;
    color: #d0e8f8;
    line-height: 1.5;
  }

  &__text {
    font-size: 13.5px;
    font-weight: 700;
    color: #f0fbff;
  }

  &__meta {
    font-size: 18px;
    color: #9fc4e0;
  }

  &__state {
    align-self: flex-end;
    font-size: 17px;
    font-weight: 700;
    padding: 1px 8px;
    border-radius: 999px;

    &--recent { color: #f87171; background: rgba(248, 113, 113, 0.14); }
    &--mid { color: #f0c040; background: rgba(240, 192, 64, 0.14); }
    &--long { color: #34d399; background: rgba(52, 211, 153, 0.14); }
  }
}

/* ── 考公：竞争力仪表 footer ── */
.civil-gauge-foot {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;

  &__num {
    font-size: 34px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__tag {
    font-size: 19px;
    font-weight: 700;
    color: #34d399;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(52, 211, 153, 0.12);
  }
}

/* ── 考公：能力维度数据来源 ── */
.civil-source {
  grid-column: 1 / -1;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(52, 211, 153, 0.3);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(52, 211, 153, 0.08);

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }

  &__title {
    font-size: 21px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__table {
    display: flex;
    flex-direction: column;
  }

  &__row {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 12px;
    padding: 7px 6px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);

    &:last-child { border-bottom: none; }

    &--head {
      border-bottom: 1px solid rgba(102, 217, 255, 0.18);
    }
  }

  &__th {
    font-size: 18px;
    font-weight: 700;
    color: #7eb4d8;
  }

  &__dim {
    font-size: 13.5px;
    font-weight: 700;
    color: #d0e8f8;
  }

  &__val {
    font-size: 19px;
    color: #b8d6ec;
  }
}

/* ── 考公：岗位匹配分析 ── */
.civil-match {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);

  &__item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 20px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__pct {
    margin-left: auto;
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__bar {
    height: 9px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  &__tag {
    font-size: 18px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 999px;

    &--good { color: #34d399; background: rgba(52, 211, 153, 0.1); border: 1px solid rgba(52, 211, 153, 0.25); }
    &--gap { color: #f0c040; background: rgba(240, 192, 64, 0.1); border: 1px solid rgba(240, 192, 64, 0.25); }
  }
}

/* ── 风险卡片（优势/不足/建议）── */
.risk-cards {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;

  &--two {
    grid-column: auto;
    grid-template-columns: repeat(2, 1fr);
  }
}

.risk-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.14);

  &--good { border-color: rgba(52, 211, 153, 0.35); background: rgba(52, 211, 153, 0.05); }
  &--warn { border-color: rgba(240, 192, 64, 0.35); background: rgba(240, 192, 64, 0.05); }
  &--tip { border-color: rgba(0, 184, 255, 0.35); background: rgba(0, 184, 255, 0.05); }

  &__title {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 700;
    color: #f4fbff;

    .risk-card--good & { color: #34d399; }
    .risk-card--warn & { color: #f0c040; }
    .risk-card--tip & { color: #66d9ff; }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;

    li {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 19px;
      color: #d0e8f8;
      line-height: 1.5;
    }

    &--ol li { counter-increment: none; }
  }

  &__icon {
    flex-shrink: 0;
    font-weight: 800;

    .risk-card--good & { color: #34d399; }
    .risk-card--warn & { color: #f0c040; }
  }

  &__num {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(0, 184, 255, 0.18);
    color: #66d9ff;
    font-size: 17px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

/* ── 岗位树（考公）── */
.post-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__root {
    align-self: center;
    padding: 4px 14px;
    border-radius: 6px;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.3);
    color: #7ff6ff;
    font-size: 19px;
    font-weight: 700;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.post-node {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__name {
    font-size: 19px;
    font-weight: 600;
    color: #d0e8f8;
  }

  &__pct {
    margin-left: auto;
    font-size: 20px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }
}

/* ── 当前状态（考公）── */
.civil-status {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 24px rgba(0, 184, 255, 0.12);

  &__stage {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.4);
  }

  &__stage-label {
    font-size: 19px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__stage-value {
    font-size: 22px;
    font-weight: 800;
    color: #f0c040;
  }
}

/* ── 占位 / 加载 ── */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 21px;
  color: rgba(184, 236, 255, 0.7);

  &.error {
    color: #f87171;
    flex-direction: column;

    button {
      padding: 4px 14px;
      border-radius: 4px;
      border: 1px solid rgba(0, 184, 255, 0.3);
      background: rgba(0, 184, 255, 0.1);
      color: #55dfff;
      cursor: pointer;
      font-size: 19px;

      &:hover { background: rgba(0, 184, 255, 0.2); }
    }
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

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 响应式 ── */
@media (max-width: 1280px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }

  .detail-grid { grid-template-columns: 1fr; }

  .section-title--full { grid-column: 1; }

  .timeline-section { grid-column: 1; }

  .risk-section {
    grid-column: 1;
    grid-template-columns: 1fr;
  }

  .risk-cards { grid-column: 1; grid-template-columns: 1fr; }

  .civil-status { grid-column: 1; }

  .exit-summary { grid-column: 1; }

  .exit-dir-list { grid-template-columns: 1fr; }

  .grad-prep { grid-column: 1; grid-template-columns: 1fr; }

  .grad-tasks { grid-column: 1; grid-template-columns: 1fr; }

  .ability-split { grid-column: 1; }
}
</style>
