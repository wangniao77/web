<script setup lang="ts">
/**
 * 出口发展详情（二级页面）
 * 路由：/student/career-development?studentId=xxx
 *
 * 四个标签页：
 *   综合画像 · 升学考研 · 就业 · 考公考编
 */
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartCard from '../academic-detail/components/ChartCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { CHART_FONT } from '@/styles/echarts-theme'

const route = useRoute()
const router = useRouter()
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
type TabKey = 'overview' | 'graduate' | 'employment' | 'civil'
const tabs: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: '综合画像' },
  { key: 'graduate', label: '升学考研' },
  { key: 'employment', label: '就业' },
  { key: 'civil', label: '考公考编' },
]
function resolveInitialTab(): TabKey {
  const t = route.query.tab as TabKey | undefined
  if (t === 'overview' || t === 'graduate' || t === 'employment' || t === 'civil') return t
  return 'overview'
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
const gpa = computed(() => dashboard.value?.academic?.cumulativeGpa ?? 3.42)
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

function makeGauge(value: number, progressColor: unknown, solidColor: string): EChartsOption {
  return {
    series: [{
      type: 'gauge',
      center: ['50%', '46%'],
      radius: '68%',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      splitNumber: 5,
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: progressColor } },
      pointer: { width: 5, length: '40%', itemStyle: { color: solidColor } },
      anchor: { show: true, size: 10, itemStyle: { color: solidColor } },
      axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(0, 60, 120, 0.45)']] } },
      axisTick: { distance: -14, length: 5, lineStyle: { color: 'rgba(102,217,255,0.3)' } },
      splitLine: { distance: -14, length: 12, lineStyle: { color: 'rgba(102,217,255,0.45)', width: 2 } },
      axisLabel: { distance: -26, color: '#6f9bbd', fontSize: 11 },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '42%'],
        fontSize: CHART_FONT.gaugeCompact + 8,
        fontFamily: 'DIN Alternate, sans-serif',
        fontWeight: 'bolder',
        color: solidColor,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowBlur: 12,
        formatter: '{value}',
      },
      data: [{ value }],
    }],
  }
}

/** 根据竞争力等级生成进度弧渐变（沿弧线方向：左下 → 右上） */
function gaugeGradient(v: number): { progressColor: unknown; solidColor: string } {
  if (v >= 80) {
    return {
      progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
        { offset: 0, color: '#22d3ee' },
        { offset: 1, color: '#34d399' },
      ] },
      solidColor: '#34d399',
    }
  }
  if (v >= 65) {
    return {
      progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
        { offset: 0, color: '#fbbf24' },
        { offset: 1, color: '#fb923c' },
      ] },
      solidColor: '#f0c040',
    }
  }
  return {
    progressColor: { type: 'linear', x: 0, y: 1, x2: 1, y2: 0, colorStops: [
      { offset: 0, color: '#fb7185' },
      { offset: 1, color: '#ef4444' },
    ] },
    solidColor: '#f87171',
  }
}

const gaugeOption = computed<EChartsOption>(() => {
  const v = competitivenessIndex.value
  const { progressColor, solidColor } = gaugeGradient(v)
  return makeGauge(v, progressColor, solidColor)
})

const rankBarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '12%', right: '8%', top: 20, bottom: 30 },
  xAxis: {
    type: 'category',
    data: [dashboard.value?.profile?.name?.slice(0, 4) || '本人', '学院平均', '专业平均'],
    axisLabel: { color: '#889ec2', fontSize: 12 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
  },
  yAxis: {
    type: 'value',
    name: '竞争力指数',
    min: 0,
    max: 100,
    nameTextStyle: { color: '#889ec2', fontSize: 11 },
    axisLabel: { color: '#889ec2', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.08)' } },
  },
  series: [{
    type: 'bar',
    barWidth: 32,
    data: [
      { value: competitivenessIndex.value, itemStyle: { color: competitivenessIndex.value >= 80 ? '#34d399' : '#00b8ff', borderRadius: [4, 4, 0, 0] } },
      { value: collegeAvg.value, itemStyle: { color: 'rgba(102,217,255,0.55)', borderRadius: [4, 4, 0, 0] } },
      { value: majorAvg.value, itemStyle: { color: 'rgba(102,217,255,0.35)', borderRadius: [4, 4, 0, 0] } },
    ],
    label: { show: true, position: 'top', color: '#f6fbff', fontSize: 12, fontWeight: 'bold' },
  }],
}))

/* ═══════════ 目标岗位匹配分析 ═══════════ */
interface JobDirection {
  name: string
  match: number
  color: string
  advantages: string[]
  gaps: string[]
}

const selectedJobIdx = ref(0)

const jobDirections = computed<JobDirection[]>(() => [
  { name: '软件开发工程师', match: 92, color: '#34d399',
    advantages: ['Java课程成绩优秀', 'Spring Boot项目2项', '数据结构基础良好', 'GitHub项目活跃'],
    gaps: ['企业实习不足', '算法训练不足'] },
  { name: 'Java后端工程师', match: 90, color: '#66d9ff',
    advantages: ['Java核心技术扎实', '电商订单项目经验', 'MySQL数据库熟练', '具备微服务基础认知'],
    gaps: ['缺少Redis/Kafka实战', '缺乏分布式系统经验'] },
  { name: '前端开发工程师', match: 85, color: '#a78bfa',
    advantages: ['Vue3项目经验丰富', '组件化开发思维好', '有个人作品集网站', 'TypeScript基础扎实'],
    gaps: ['React框架经验空白', '移动端适配经验不足'] },
  { name: '数据分析师', match: 78, color: '#f0c040',
    advantages: ['Python/Pandas熟练', '统计学基础扎实', '数据可视化项目经历', 'SQL查询能力强'],
    gaps: ['缺少业务分析经验', '机器学习算法薄弱'] },
  { name: '算法工程师', match: 72, color: '#f87171',
    advantages: ['数学基础扎实', '数据结构与算法课程高分', '参加过蓝桥杯竞赛', 'Python编程熟练'],
    gaps: ['缺乏深度学习项目', '论文阅读与实践不足'] },
])

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
      axisName: { color: '#889ec2', fontSize: 10.5, padding: [2, 4] },
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

const gradRadarOption = computed<EChartsOption>(() => ({
  tooltip: {},
  radar: {
    center: ['50%', '52%'],
    radius: '64%',
    indicator: [
      { name: 'GPA基础', max: 100 },
      { name: '专业排名', max: 100 },
      { name: '英语能力', max: 100 },
      { name: '数学能力', max: 100 },
      { name: '科研经历', max: 100 },
      { name: '项目经历', max: 100 },
    ],
    axisName: { color: '#889ec2', fontSize: 11, padding: [2, 4] },
    splitArea: { areaStyle: { color: ['rgba(167,139,250,0.02)', 'rgba(167,139,250,0.05)', 'rgba(167,139,250,0.02)', 'rgba(167,139,250,0.05)', 'rgba(167,139,250,0.02)'] } },
    splitLine: { lineStyle: { color: 'rgba(167,139,250,0.15)' } },
    axisLine: { lineStyle: { color: 'rgba(167,139,250,0.2)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: [95, 95, 80, 70, 65, 78],
      name: '考研竞争力',
      areaStyle: { color: 'rgba(167,139,250,0.16)' },
      lineStyle: { color: '#a78bfa', width: 2 },
      itemStyle: { color: '#a78bfa' },
      symbol: 'circle',
      symbolSize: 6,
    }],
  }],
}))

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
    axisName: { color: '#9fe9c9', fontSize: 11, padding: [2, 4] },
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

/* ═══════════ 综合画像（出口趋势分析）═══════════ */
interface ExitDirection {
  name: string
  match: number
  color: string
  note: string
}
const exitDirections = computed<ExitDirection[]>(() => [
  { name: '就业', match: competitivenessIndex.value, color: '#00d4ff', note: '专业对口岗位匹配度高，建议作为主线方向' },
  { name: '升学考研', match: gradIndex.value, color: '#a78bfa', note: '成绩与排名优异，具备冲刺名校潜力' },
  { name: '考公考编', match: civilIndex.value, color: '#34d399', note: '专业限制少岗位多，可作为稳妥备选' },
])

const recommendedExit = computed(() => {
  const sorted = [...exitDirections.value].sort((a, b) => b.match - a.match)
  return sorted[0]
})

const exitTrendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    data: ['就业', '升学考研', '考公考编'],
    textStyle: { color: '#b8d6ec', fontSize: 12 },
    top: 0,
  },
  grid: { left: '8%', right: '5%', top: 40, bottom: 30 },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['大一', '大二', '大三', '大四上', '大四下'],
    axisLabel: { color: '#889ec2', fontSize: 12 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
  },
  yAxis: {
    type: 'value',
    name: '倾向度',
    min: 0,
    max: 100,
    nameTextStyle: { color: '#889ec2', fontSize: 11 },
    axisLabel: { color: '#889ec2', fontSize: 11 },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.08)' } },
  },
  series: [
    { name: '就业', type: 'line', smooth: true, data: [40, 50, 65, 78, 85], lineStyle: { color: '#00d4ff', width: 2 }, itemStyle: { color: '#00d4ff' }, areaStyle: { color: 'rgba(0,212,255,0.1)' } },
    { name: '升学考研', type: 'line', smooth: true, data: [30, 45, 60, 72, 70], lineStyle: { color: '#a78bfa', width: 2 }, itemStyle: { color: '#a78bfa' }, areaStyle: { color: 'rgba(167,139,250,0.08)' } },
    { name: '考公考编', type: 'line', smooth: true, data: [20, 30, 42, 55, 60], lineStyle: { color: '#34d399', width: 2 }, itemStyle: { color: '#34d399' }, areaStyle: { color: 'rgba(52,211,153,0.08)' } },
  ],
}))

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

      <!-- ═══════════ 综合画像 ═══════════ -->
      <div v-if="activeTab === 'overview'" class="detail-grid">
        <div class="section-title section-title--full">出口趋势分析</div>

        <ChartCard title="出口方向倾向趋势" sub="四年演变">
          <ChartContainer :option="exitTrendOption" style="height: 300px" />
        </ChartCard>

        <div class="exit-summary">
          <div class="exit-summary__head">
            <span class="exit-summary__bar" aria-hidden="true" />
            <h3 class="exit-summary__title">三大方向适配度</h3>
            <span class="exit-summary__reco">推荐主线：{{ recommendedExit.name }}</span>
          </div>
          <div class="exit-dir-list">
            <div v-for="d in exitDirections" :key="d.name" class="exit-dir">
              <span class="exit-dir__pct" :style="{ color: d.color }">{{ d.match }}%</span>
              <div class="exit-dir__bar">
                <div class="exit-dir__bar-inner" :style="{ height: `${d.match}%`, background: d.color }" />
              </div>
              <span class="exit-dir__name">{{ d.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══════════ 升学考研 ═══════════ -->
      <div v-else-if="activeTab === 'graduate'" class="detail-grid">
        <!-- ① 考研竞争力画像（雷达 + 能力拆解）并排 考研准备度进度 -->
        <div class="section-title section-title--full">考研竞争力画像 · 考研准备度进度</div>

        <!-- 左：考研竞争力画像（雷达在上，能力拆解在下） -->
        <section class="panel-card grad-profile">
          <div class="panel-card__head">
            <span class="panel-card__bar" aria-hidden="true" />
            <h3 class="panel-card__title">考研竞争力画像</h3>
            <span class="panel-card__sub">六维评估</span>
          </div>
          <ChartContainer :option="gradRadarOption" style="height: 280px" />
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
          <div class="grad-prep__head-title">
            <span class="panel-card__bar" aria-hidden="true" />
            <span class="grad-prep__title">考研准备度进度</span>
          </div>
          <div class="grad-prep__bars">
            <div v-for="p in prepItems" :key="p.name" class="grad-prep__item">
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
            <div class="grad-prep__overall-num">{{ prepOverall }}%</div>
            <div class="grad-prep__overall-meta">
              <span class="grad-prep__overall-label">整体准备度</span>
              <span class="grad-prep__gap">距离目标院校要求：还差 {{ prepGap }}%</span>
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

          <ChartCard title="就业竞争力指数" :sub="starLevel" compact>
            <ChartContainer :option="gaugeOption" style="height: 190px" />
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
                  <span class="comp-meta__value comp-meta__value--accent">{{ collegePercentile }}% 学生</span>
                </div>
              </div>
            </template>
          </ChartCard>

          <ChartCard title="同专业排名对比" sub="竞争力指数" compact>
            <ChartContainer :option="rankBarOption" style="height: 190px" />
            <template #footer>
              <div class="competition-meta">
                <div class="comp-meta-item">
                  <span class="comp-meta__label">专业排名</span>
                  <span class="comp-meta__value">{{ majorRank }} / {{ majorTotal }}</span>
                </div>
                <div class="comp-meta-item">
                  <span class="comp-meta__label">超越比例</span>
                  <span class="comp-meta__value comp-meta__value--accent">前 {{ collegePercentile }}%</span>
                </div>
                <div class="comp-meta-item">
                  <span class="comp-meta__label">数据来源</span>
                  <span class="comp-meta__hint">GPA · 排名 · 项目 · 竞赛 · 证书 · 实习 · 英语</span>
                </div>
              </div>
            </template>
          </ChartCard>

          <!-- 目标岗位匹配分析 + 就业能力差距分析 -->
          <div class="section-title section-title--full">目标岗位匹配分析</div>

          <section class="panel-card">
            <div class="panel-card__head">
              <span class="panel-card__bar" aria-hidden="true" />
              <h3 class="panel-card__title">岗位适配雷达图</h3>
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
            <ChartContainer :option="radarOption" style="height: 236px" />
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

          <div class="gap-section">
            <div class="gap-header">
              <h4 class="gap-header__title">目标岗位：{{ selectedJob.name }}</h4>
              <span class="gap-header__badge">岗位能力 Gap 分析</span>
            </div>
            <div class="gap-list">
              <div v-for="g in gapItems" :key="g.skill" class="gap-item">
                <div class="gap-item__head">
                  <span class="gap-item__skill">{{ g.skill }}</span>
                  <span class="gap-item__label" :class="`gap-item__label--${g.label === '严重不足' ? 'danger' : (g.label === '需加强' || g.label === '需提升') ? 'warn' : 'ok'}`">{{ g.label }}</span>
                  <span class="gap-item__pct">{{ g.current }}%</span>
                </div>
                <div class="gap-item__bar">
                  <div class="gap-item__bar-inner" :style="{ width: `${g.current}%`, background: gapBarColor(g.current) }" />
                  <div class="gap-item__bar-target" :style="{ left: `${g.target}%` }" :title="`目标: ${g.target}%`" />
                </div>
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
  padding: 6px;
  border-radius: 10px;
  background: rgba(6, 17, 52, 0.4);
  border: 1px solid rgba(0, 206, 255, 0.2);
}

.exit-tab {
  flex: 1;
  padding: 10px 16px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: #9ec7e0;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 38, 73, 0.4);
    color: #d0e8f8;
  }

  &--active {
    background: linear-gradient(180deg, rgba(0, 184, 255, 0.28), rgba(0, 113, 206, 0.18));
    border-color: rgba(0, 206, 255, 0.55);
    color: #f6fbff;
    box-shadow: 0 0 14px rgba(0, 184, 255, 0.25), inset 0 0 12px rgba(0, 184, 255, 0.1);
  }
}

/* ── 通用板块外框 ── */
.warn-section {
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

/* ── KPI Grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid rgba(0, 206, 255, 0.6);

  &__label {
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 18px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.3;
  }
}

/* ── 两列网格 ── */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

/* ── 跨列标题 ── */
.section-title {
  font-size: 16px;
  font-weight: 800;
  color: #b8ecff;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;

  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, rgba(0, 206, 255, 0.35), transparent);
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
  border: 1px solid rgba(0, 206, 255, 0.42);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 0 22px rgba(0, 184, 255, 0.08);
  padding: 12px 14px;

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__bar {
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
    flex-shrink: 0;
  }

  &__title {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
    color: #f4fbff;
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
  }

  &__sub {
    margin-left: auto;
    font-size: 12px;
    color: rgba(184, 236, 255, 0.6);
  }
}

/* ── 竞争力 meta ── */
.competition-meta {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.comp-meta-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  border: 1px solid rgba(102, 217, 255, 0.08);
}

.comp-meta__label {
  font-size: 11px;
  color: #7eb4d8;
}

.comp-meta__value {
  font-size: 15px;
  font-weight: 800;
  color: #f6fbff;
  font-family: 'DIN Alternate', sans-serif;

  &--accent { color: #7ff6ff; }
}

.comp-meta__hint {
  font-size: 10px;
  color: #6f9bbd;
  text-align: center;
  line-height: 1.4;
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
  }
}

.job-tab {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  background: rgba(0, 38, 73, 0.35);
  color: #9ec7e0;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(102, 217, 255, 0.4);
    background: rgba(0, 38, 73, 0.55);
  }

  &--active {
    border-color: var(--tab-color);
    background: rgba(0, 38, 73, 0.55);
    color: var(--tab-color);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  }
}

/* ── 岗位匹配详情（并排）── */
.match-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
}

.match-col {
  &__title {
    margin: 0 0 6px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;

    &--good { color: #34d399; }
    &--gap { color: #f0c040; }
  }
}

.match-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.match-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  padding: 4px 8px;
  border-radius: 4px;

  &__icon { flex-shrink: 0; }

  &--good { color: #b8d6ec; background: rgba(52, 211, 153, 0.06); }
  &--gap { color: #d0c888; background: rgba(240, 192, 64, 0.06); }
}

/* ── 能力差距分析 ── */
.gap-section {
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

.gap-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: #f4fbff;
    margin: 0;
  }

  &__badge {
    font-size: 11px;
    font-weight: 600;
    color: #7ff6ff;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    border: 1px solid rgba(0, 184, 255, 0.2);
  }
}

.gap-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gap-item {
  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  &__skill {
    font-size: 13.5px;
    font-weight: 700;
    color: #d0e8f8;
    min-width: 70px;
  }

  &__label {
    font-size: 11px;
    padding: 1px 6px;
    border-radius: 3px;
    font-weight: 600;

    &--ok { color: #34d399; background: rgba(52, 211, 153, 0.1); }
    &--warn { color: #f0c040; background: rgba(240, 192, 64, 0.1); }
    &--danger { color: #f87171; background: rgba(248, 113, 113, 0.1); }
  }

  &__pct {
    margin-left: auto;
    font-size: 15px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__bar {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: visible;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    transition: width 0.6s ease;
  }

  &__bar-target {
    position: absolute;
    top: -2px;
    width: 3px;
    height: 12px;
    border-radius: 2px;
    background: #f6fbff;
    transform: translateX(-50%);
  }
}

.gap-conclusion {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(248, 113, 113, 0.06);
  border: 1px solid rgba(248, 113, 113, 0.16);

  &__icon { flex-shrink: 0; font-size: 16px; }

  &__text {
    font-size: 13px;
    color: #f6c8c8;
    line-height: 1.6;
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
    font-size: 12px;
    font-weight: 800;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__event {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #f6fbff;
    margin: 4px 0 2px;
  }

  &__detail {
    margin: 0;
    font-size: 11px;
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
    font-size: 10px;
    color: #6f9bbd;
  }

  &__prob-value {
    font-size: 16px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* ── 风险预警 ── */
.risk-section {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.risk-matrix {
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
    font-size: 13px;
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
    font-size: 12px;
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
    font-size: 12px;
    white-space: nowrap;
    word-break: normal;
  }
}

.risk-table {
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
  font-size: 13px;
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
  font-size: 15px;

  &--name {
    color: #d0e8f8;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &--lv {
    text-align: center;
    font-size: 13px;
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
    font-size: 13px;
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
    font-size: 14px;
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
    font-size: 14px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__pct {
    margin-left: auto;
    font-size: 14px;
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
  font-size: 12px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;

  &--rush { color: #f87171; background: rgba(248, 113, 113, 0.14); border: 1px solid rgba(248, 113, 113, 0.3); }
  &--target { color: #66d9ff; background: rgba(102, 217, 255, 0.14); border: 1px solid rgba(102, 217, 255, 0.3); }
  &--safe { color: #34d399; background: rgba(52, 211, 153, 0.14); border: 1px solid rgba(52, 211, 153, 0.3); }
}

/* ── 考研竞争力画像（雷达 + 能力拆解合并）── */
.grad-profile {
  &__split {
    margin-top: 6px;
    padding-top: 10px;
    border-top: 1px dashed rgba(102, 217, 255, 0.14);
  }
}

/* ── 能力拆解（升学竞争力画像右侧）── */
.ability-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  &__col {
    display: flex;
    flex-direction: column;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;

    &--good { color: #34d399; }
    &--gap { color: #f0c040; }
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
    font-size: 13px;
    color: #d0e8f8;
    line-height: 1.5;
    padding: 5px 9px;
    border-radius: 5px;

    &--good { background: rgba(52, 211, 153, 0.06); }
    &--gap { background: rgba(240, 192, 64, 0.06); }
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
    font-size: 15px;
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

  &__head-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__bars {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__name {
    font-size: 13.5px;
    font-weight: 700;
    color: #d0e8f8;
  }

  &__val {
    margin-left: auto;
    font-size: 15px;
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

  &__overall {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(0, 38, 73, 0.4);
    border: 1px solid rgba(102, 217, 255, 0.18);
  }

  &__overall-num {
    font-size: 32px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 12px rgba(0, 212, 255, 0.35);
    line-height: 1;
  }

  &__overall-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 3px;
    text-align: right;
  }

  &__overall-label {
    font-size: 12px;
    color: #7eb4d8;
  }

  &__gap {
    font-size: 12px;
    font-weight: 700;
    color: #f0c040;
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
    font-size: 15px;
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
    font-size: 13px;
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
    font-size: 14px;
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
    font-size: 14px;
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
    font-size: 13px;
    color: #d0e8f8;
    line-height: 1.5;
  }

  &__text {
    font-size: 13.5px;
    font-weight: 700;
    color: #f0fbff;
  }

  &__meta {
    font-size: 12px;
    color: #9fc4e0;
  }

  &__state {
    align-self: flex-end;
    font-size: 11px;
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
    font-size: 28px;
    font-weight: 900;
    color: #7ff6ff;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__tag {
    font-size: 13px;
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
    font-size: 15px;
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
    font-size: 12px;
    font-weight: 700;
    color: #7eb4d8;
  }

  &__dim {
    font-size: 13.5px;
    font-weight: 700;
    color: #d0e8f8;
  }

  &__val {
    font-size: 13px;
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
    font-size: 14px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__pct {
    margin-left: auto;
    font-size: 14px;
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
    font-size: 12px;
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
    font-size: 14px;
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
      font-size: 13px;
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
    font-size: 11px;
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
    font-size: 13px;
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
    font-size: 13px;
    font-weight: 600;
    color: #d0e8f8;
  }

  &__pct {
    margin-left: auto;
    font-size: 14px;
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
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__stage-value {
    font-size: 16px;
    font-weight: 800;
    color: #f0c040;
  }
}

/* ── 综合画像：出口趋势 ── */
.exit-summary {
  display: flex;
  flex-direction: column;
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
    margin-bottom: 12px;
  }

  &__bar {
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  }

  &__title {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #f4fbff;
  }

  &__reco {
    margin-left: auto;
    font-size: 12px;
    font-weight: 700;
    color: #7ff6ff;
    padding: 2px 10px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    border: 1px solid rgba(0, 184, 255, 0.25);
  }
}

.exit-dir-list {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  gap: 12px;
  min-height: 248px;
  padding-top: 6px;
}

.exit-dir {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;

  &__name {
    font-size: 14px;
    font-weight: 700;
    color: #f6fbff;
  }

  &__pct {
    font-size: 20px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__bar {
    width: 34px;
    height: 200px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
    display: flex;
    align-items: flex-end;
  }

  &__bar-inner {
    width: 100%;
    border-radius: 999px;
    transition: height 0.6s ease;
  }
}

/* ── 占位 / 加载 ── */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
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
      font-size: 13px;

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
