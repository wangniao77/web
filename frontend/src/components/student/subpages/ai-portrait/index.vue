<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import StudentSectionNav from '../_shared/StudentSectionNav.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { dashboardToAiPortraitSheets } from '@/utils/studentDashboardExport'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import StuHint from '@/components/student/template/StuHint.vue'
import { SCORE_FORMULAS } from '@/utils/scoreFormulas'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

/** 页面分区导览（点击跳转到对应模块） */
const sectionNav = [
  { id: 'sec-cockpit', label: '发展驾驶舱' },
  { id: 'sec-action', label: '行动建议' },
  { id: 'sec-capability', label: '能力画像' },
  { id: 'sec-trend', label: '成长趋势' },
  { id: 'sec-opportunity', label: '机会雷达' },
  { id: 'sec-risk', label: '风险雷达' },
  { id: 'sec-peer', label: '同专业比较' },
]

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
useStudentDashboardExport('智能育航·深度分析', dashboard, dashboardToAiPortraitSheets)
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

const clamp = (v: number, min = 0, max = 100) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

/** 分数段着色：≥80绿 / ≥60黄 / ≥40橙 / <40红（能力越高越好） */
function scoreToneColor(score: number): string {
  if (score >= 80) return '#34d399'
  if (score >= 60) return '#facc15'
  if (score >= 40) return '#fb923c'
  return '#f87171'
}

/** 风险着色：越高越危（与能力色阶相反） */
function riskToneColor(risk: number): string {
  if (risk >= 80) return '#f87171'
  if (risk >= 60) return '#fb923c'
  if (risk >= 40) return '#facc15'
  return '#34d399'
}

/* ════════════ 1. 学生发展驾驶舱 ════════════ */
const academicScore = computed(() => clamp((dashboard.value?.academic.gpa ?? 3) / 4 * 100))
const employmentScore = computed(() => clamp(dashboard.value?.employment.jobReadiness ?? 70))
const qualityScore = computed(() =>
  clamp(dashboard.value?.growthOverview.qualityScore ?? 80),
)
const competitionScore = computed(() => clamp((dashboard.value?.competition.awardCount ?? 0) * 20 + 30))

const abilities = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const items = [
    { key: 'academic', label: '学业能力', value: academicScore.value,
      detail: `GPA ${d.academic.gpa ?? '—'} · 专业排名 ${d.academic.majorRank}/${d.academic.majorTotal}` },
    { key: 'major', label: '专业能力', value: clamp(academicScore.value + 5),
      detail: d.academic.majorTotal ? `专业前 ${Math.round(d.academic.majorRank / d.academic.majorTotal * 100)}%` : '专业能力突出' },
    { key: 'practice', label: '实践能力', value: clamp(employmentScore.value * 0.9 + 10),
      detail: `项目 ${d.internship.projectCount} 项 · 实习 ${d.internship.internshipCount} 次` },
    { key: 'career', label: '求职能力', value: employmentScore.value,
      detail: `就业准备度 ${d.employment.jobReadiness ?? '—'}` },
    { key: 'quality', label: '综合素养', value: qualityScore.value,
      detail: `干部 ${d.quality.cadreRoles.length} · 志愿 ${d.quality.volunteerHours}h` },
  ]
  return items.map((a) => ({ ...a, color: scoreToneColor(a.value) }))
})

const compositeScore = computed(() => {
  const arr = abilities.value
  if (!arr.length) return { score: 0, level: '—' }
  const avg = Math.round(arr.reduce((s, a) => s + a.value, 0) / arr.length)
  return { score: avg, level: avg >= 90 ? '优秀' : avg >= 75 ? '良好' : '待提升' }
})

const selectedAbility = ref<string | null>(null)
const selectedAbilityInfo = computed(() => abilities.value.find(a => a.key === selectedAbility.value) || null)
void selectedAbilityInfo

/* 环形仪表颜色 */
const ringScoreColor = computed(() => scoreToneColor(compositeScore.value.score))

/* AI学生画像 */
const studentPortrait = computed(() => {
  const d = dashboard.value
  if (!d) return { stage: '—', stageStars: 3, strengths: [], weaknesses: [], directions: [] }
  const p = d.profile
  const gpa = d.academic.gpa ?? 0
  const strengths: string[] = []
  if (gpa >= 3.5) strengths.push('GPA优秀')
  if (d.academic.majorTotal && d.academic.majorRank <= d.academic.majorTotal * 0.3) strengths.push('专业能力突出')
  if (p.cet6Score) strengths.push('英语六级通过')
  if (d.competition.awardCount > 0) strengths.push('竞赛经历丰富')
  const weaknesses: string[] = []
  if (d.internship.projectCount < 4) weaknesses.push('项目经历不足')
  if (d.internship.internshipCount < 1) weaknesses.push('企业实践不足')
  const stageMap: Record<string, { label: string; stars: number }> = {
    positive: { label: '成长期', stars: 4 },
    stable: { label: '稳定期', stars: 3 },
    negative: { label: '观察期', stars: 2 },
  }
  const st = stageMap[p.growthTrend || ''] || { label: '成长期', stars: 4 }
  const directions = [
    ...(d.employment.careerDirections || []),
    d.aiAssistant.recommendedDirection,
  ].filter(Boolean) as string[]
  return { stage: st.label, stageStars: st.stars, strengths, weaknesses, directions }
})

/* AI判断依据 */
const aiJudgment = computed(() => {
  const d = dashboard.value
  if (!d) return { status: '—', basis: [], sources: [] }
  const gpa = d.academic.gpa ?? 3
  const jobReady = d.employment.jobReadiness ?? 70
  const starOf = (v: number) => Math.max(1, Math.min(5, Math.round(v / 20)))
  const basis = [
    { label: '学业表现', stars: starOf(gpa / 4 * 100) },
    { label: '专业技能', stars: starOf(d.academic.majorTotal ? 100 - d.academic.majorRank / d.academic.majorTotal * 100 : 70) },
    { label: '实践经历', stars: starOf(d.internship.projectCount * 20 + 20) },
    { label: '就业准备', stars: starOf(jobReady) },
  ]
  const status = compositeScore.value.score >= 75 ? '良好' : '需关注'
  const sources: string[] = []
  if (gpa) sources.push('GPA')
  if (d.competition.awardCount) sources.push('竞赛')
  if (d.internship.projectCount) sources.push('项目')
  if (d.internship.certificateCount) sources.push('证书')
  if (jobReady) sources.push('就业记录')
  return { status, basis, sources }
})

/* ── 驾驶舱增强数据（发展阶段 / 排名 / 学生类型 / AI决策摘要）── */
const rankPercent = computed(() => {
  const tot = dashboard.value?.academic.majorTotal
  const rk = dashboard.value?.academic.majorRank
  if (!tot || !rk) return 0
  return clamp((rk / tot) * 100)
})
const exceedPercent = computed(() => 100 - rankPercent.value)

/* 雷达图用的专业平均线 */
const abilitiesAvg = computed(() =>
  abilities.value.map(a => ({ ...a, value: clamp(a.value * 0.8) })),
)

/* 右侧 AI 决策摘要（不展示能力评分，改为结论式） */
const aiDecision = computed(() => {
  const d = dashboard.value
  if (!d) return { status: '—', advantage: '—', risk: '—', action: '—', sources: [] as string[] }
  const top = [...abilities.value].sort((a, b) => b.value - a.value)[0]
  const advantage = `${top.label} > 同专业 ${exceedPercent.value}% 学生`
  const sortedRisk = [...riskDims.value].sort((a, b) => b.value - a.value)
  const mainRisk = sortedRisk[0]?.reason ?? '暂无显著风险'
  const action =
    d.aiAssistant.shortTermSuggestions?.[0] ||
    (studentPortrait.value.weaknesses[0] ? `未来3个月补强：${studentPortrait.value.weaknesses[0]}` : '保持当前发展节奏')
  return {
    status: aiJudgment.value.status,
    advantage,
    risk: mainRisk,
    action,
    sources: aiJudgment.value.sources,
  }
})

/* 能力诊断（右侧） */
const capabilityDiagnostics = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const gpa = d.academic.gpa ?? 0
  const rk = d.academic.majorRank
  const tot = d.academic.majorTotal
  const award = d.competition.awardCount
  const proj = d.internship.projectCount
  const peerAvgProj = 5.3
  const intern = d.internship.internshipCount
  const cert = d.internship.certificateCount
  return [
    { idx: '①', title: '学业优势', items: [
      { k: 'GPA', v: gpa.toFixed(2) },
      { k: '专业排名', v: `${rk}/${tot}` },
    ], suggest: '保持核心课程成绩稳定，争取进入专业前 20%' },
    { idx: '②', title: '技术优势', items: [
      { k: '竞赛', v: `${award} 项` },
      { k: '专业前', v: `${Math.round((rk / tot) * 100)}%` },
    ], suggest: '将竞赛成果沉淀为项目作品，丰富技术作品集' },
    { idx: '③', title: '能力短板', items: [
      { k: '项目经验', v: `当前 ${proj} 项` },
      { k: '优秀学生平均', v: `${peerAvgProj} 项` },
    ], suggest: '补齐企业项目至 5 项以上，提升实战与协作能力' },
    { idx: '④', title: '实践与认证', items: [
      { k: '实习', v: `${intern} 次` },
      { k: '证书', v: `${cert} 项` },
    ], suggest: '补充 1 段企业实习与 1 项行业认证，强化就业竞争力' },
  ]
})

/* 能力成长趋势（按学期） */
const trendCats = [
  '大一上学期',
  '大一下学期',
  '大二上学期',
  '大二下学期',
  '大三上学期',
  '大三下学期',
  '当前',
]
function trendLine(end: number, startRatio: number): number[] {
  const e = clamp(end)
  const s = e * startRatio
  const n = trendCats.length
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    // 前期缓慢、后期略加速，更接近学期成长节奏
    const eased = t * t * (3 - 2 * t)
    return Math.round(s + (e - s) * eased)
  })
}
// 真实绩点（0–4）趋势，保留两位小数
function trendLineGpa(end: number, startRatio: number): number[] {
  const e = end
  const s = e * startRatio
  const n = trendCats.length
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    const eased = t * t * (3 - 2 * t)
    return Math.round((s + (e - s) * eased) * 100) / 100
  })
}
const growthTrend = computed(() => {
  const d = dashboard.value
  if (!d) return { gpa: [] as number[], cert: [] as number[], proj: [] as number[] }
  return {
    gpa: trendLineGpa(d.academic.gpa ?? 3, 0.7),
    cert: trendLine(clamp(d.internship.certificateCount * 2.2 + 2), 0.3),
    proj: trendLine(clamp(d.internship.projectCount * 2.6 + 2), 0.28),
  }
})
const growthTrendOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'axis',
    textStyle: { fontSize: 19 },
    backgroundColor: 'rgba(6, 24, 52, 0.92)',
    borderColor: 'rgba(0, 184, 255, 0.35)',
  },
  legend: {
    data: ['GPA', '技能证书', '项目经历'],
    textStyle: { color: '#d8eeff', fontSize: 20, fontWeight: 600 },
    top: 4,
    itemWidth: 18,
    itemHeight: 10,
    itemGap: 22,
  },
  grid: { left: 52, right: 56, top: 52, bottom: 56 },
  xAxis: {
    type: 'category',
    data: trendCats,
    boundaryGap: true,
    axisLabel: {
      color: '#b8d8f0',
      fontSize: 17,
      fontWeight: 600,
      margin: 14,
      interval: 0,
      rotate: 22,
      formatter: (v: string) => (v === '当前' ? '当前' : v.replace('学期', '')),
    },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,.28)', width: 1.5 } },
    axisTick: { show: false },
  },
  yAxis: [
    {
      type: 'value', min: 0, max: 10, splitNumber: 5, position: 'left',
      name: '次数', nameTextStyle: { color: '#9ec0dc', fontSize: 16 },
      axisLabel: { color: '#9ec0dc', fontSize: 18, margin: 10 },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(102,217,255,.10)', type: 'dashed' } },
    },
    {
      type: 'value', min: 0, max: 4, splitNumber: 4, position: 'right',
      name: 'GPA', nameTextStyle: { color: '#7fd4ff', fontSize: 16 },
      axisLabel: { color: '#7fd4ff', fontSize: 18, margin: 10 },
      axisLine: { show: false },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: 'GPA', type: 'line', yAxisIndex: 1, smooth: 0.35, symbol: 'circle', symbolSize: 9,
      data: growthTrend.value.gpa,
      label: {
        show: true, position: 'top', color: '#7fd4ff', fontSize: 16, fontWeight: 600,
        formatter: (p: any) => `${p.value}`,
      },
      lineStyle: { color: '#38bdf8', width: 3 },
      itemStyle: { color: '#38bdf8', borderColor: '#061834', borderWidth: 2 },
    },
    {
      name: '技能证书', type: 'bar', yAxisIndex: 0, barMaxWidth: 18,
      data: growthTrend.value.cert,
      label: {
        show: true, position: 'top', color: '#b8d8f0', fontSize: 16, fontWeight: 600,
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#43e7af' },
            { offset: 1, color: 'rgba(67,231,175,.25)' },
          ],
        },
      },
    },
    {
      name: '项目经历', type: 'bar', yAxisIndex: 0, barMaxWidth: 18,
      data: growthTrend.value.proj,
      label: {
        show: true, position: 'top', color: '#b8d8f0', fontSize: 16, fontWeight: 600,
        formatter: (p: any) => `${p.value}`,
      },
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#facc15' },
            { offset: 1, color: 'rgba(250,204,21,.25)' },
          ],
        },
      },
    },
  ],
}))

/* ════════════ 2. 能力画像分析 ════════════ */
const radarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1400,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.35)',
    textStyle: { color: '#e2edff', fontSize: 16 },
  },
  legend: {
    data: ['本人', '专业平均'],
    textStyle: { color: '#cfe6f8', fontSize: 17, fontWeight: 700 },
    top: 0,
    right: 0,
    itemWidth: 14,
    itemHeight: 10,
  },
  radar: {
    center: ['50%', '54%'],
    radius: '66%',
    indicator: abilities.value.map((a) => ({ name: a.label, max: 100 })),
    axisName: {
      color: '#d7ecff',
      fontSize: 16,
      fontWeight: 700,
    },
    shape: 'polygon',
    splitNumber: 4,
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.25)', width: 1.2 } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.16)', width: 1.2 } },
    splitArea: {
      areaStyle: {
        color: [
          'rgba(0,100,180,0.03)',
          'rgba(0,140,220,0.09)',
          'rgba(0,100,180,0.03)',
          'rgba(0,140,220,0.12)',
        ],
      },
    },
  },
  series: [
    {
      type: 'radar',
      symbol: 'circle',
      symbolSize: 8,
      data: [
        {
          value: abilitiesAvg.value.map((a) => a.value),
          name: '专业平均',
          areaStyle: { color: 'rgba(250,204,21,0.1)' },
          lineStyle: { color: '#facc15', width: 2, type: 'dashed' },
          itemStyle: { color: '#facc15', borderWidth: 0 },
        },
        {
          value: abilities.value.map((a) => a.value),
          name: '本人',
          areaStyle: {
            color: {
              type: 'radial',
              x: 0.5,
              y: 0.5,
              r: 0.7,
              colorStops: [
                { offset: 0, color: 'rgba(0,229,255,0.32)' },
                { offset: 1, color: 'rgba(0,120,200,0.08)' },
              ],
            },
          },
          lineStyle: {
            color: '#00e5ff',
            width: 3,
            shadowColor: 'rgba(0,229,255,0.55)',
            shadowBlur: 10,
          },
          itemStyle: {
            color: '#04101f',
            borderColor: '#7ff6ff',
            borderWidth: 2,
          },
        },
      ],
    },
  ],
}))

void radarOption

const capabilityCompareOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1100,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: 'rgba(3, 20, 48, .96)',
    borderColor: 'rgba(0, 229, 255, .35)',
    textStyle: { color: '#e6f6ff', fontSize: 17 },
  },
  legend: {
    data: ['本人', '专业平均'],
    top: 4,
    right: 8,
    itemWidth: 16,
    itemHeight: 8,
    itemGap: 18,
    textStyle: { color: '#b9d9f0', fontSize: 17, fontWeight: 700 },
  },
  grid: { left: 110, right: 28, top: 48, bottom: 16, containLabel: false },
  xAxis: {
    type: 'value', max: 100, splitNumber: 4,
    axisLabel: { color: '#628bad', fontSize: 14, formatter: '{value}' },
    axisLine: { show: false }, axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(105, 211, 255, .1)', type: 'dashed' } },
  },
  yAxis: {
    type: 'category', inverse: true,
    data: abilities.value.map((item) => item.label),
    axisLabel: { color: '#d4ecff', fontSize: 18, fontWeight: 700 },
    axisLine: { show: false }, axisTick: { show: false },
  },
  series: [
    {
      name: '本人', type: 'bar', barWidth: 12, barGap: '30%',
      data: abilities.value.map((item) => item.value),
      itemStyle: {
        borderRadius: 8,
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [{ offset: 0, color: '#087fc2' }, { offset: 1, color: '#58e8ff' }],
        },
        shadowColor: 'rgba(0, 218, 255, .34)', shadowBlur: 10,
      },
      label: { show: true, position: 'right', color: '#81f7ff', fontSize: 17, fontWeight: 800, formatter: '{c}' },
    },
    {
      name: '专业平均', type: 'bar', barWidth: 9,
      data: abilitiesAvg.value.map((item) => item.value),
      itemStyle: { borderRadius: 8, color: 'rgba(250, 204, 21, .72)' },
      label: { show: false },
    },
  ],
}))

const capabilityBars = computed(() => abilities.value)
const aiSummary = computed(() => {
  const d = dashboard.value
  if (!d) return '—'
  const sorted = [...abilities.value].sort((a, b) => b.value - a.value)
  const top = sorted[0]
  const low = sorted[sorted.length - 1]
  const sortedRisk = [...riskDims.value].sort((a, b) => b.value - a.value)
  const mainRisk = sortedRisk[0]?.reason ?? '暂无显著风险'
  return `该生综合发展指数 ${compositeScore.value.score}（${compositeScore.value.level}）。最强项为「${top.label}」（${top.value} 分），建议向该方向纵深发展、打造个人优势标签；最需补强的是「${low.label}」（${low.value} 分），是当前成长的主要约束，应优先投入。结合雷达对比，实践能力与项目积累是拉开差距的关键，建议尽快补齐企业项目与实习经历以巩固就业竞争力。主要风险：${mainRisk}。`
})

/* ════════════ 3. AI机会雷达 ════════════ */
void growthTrendOption

const growthMomentumOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1200,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(3, 20, 48, .96)',
    borderColor: 'rgba(0, 229, 255, .35)',
    textStyle: { color: '#e6f6ff', fontSize: 17 },
  },
  legend: {
    data: ['GPA成长', '证书积累', '项目经验'],
    top: 8, left: 'center', itemWidth: 18, itemHeight: 8, itemGap: 26,
    textStyle: { color: '#c6e6fa', fontSize: 17, fontWeight: 700 },
  },
  grid: { left: 54, right: 36, top: 58, bottom: 42 },
  xAxis: {
    type: 'category', boundaryGap: false, data: trendCats,
    axisLabel: { color: '#9fc5df', fontSize: 16, fontWeight: 700, margin: 14 },
    axisLine: { lineStyle: { color: 'rgba(97, 214, 255, .22)' } }, axisTick: { show: false },
  },
  yAxis: {
    type: 'value', min: 0, max: 100, splitNumber: 4,
    axisLabel: { color: '#759dba', fontSize: 14, formatter: '{value}' },
    axisLine: { show: false }, axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(97, 214, 255, .1)', type: 'dashed' } },
  },
  series: [
    { name: 'GPA成长', type: 'line', smooth: true, symbol: 'circle', symbolSize: 8,
      data: growthTrend.value.gpa.map((v) => Math.round(v / 4 * 100)),
      lineStyle: { color: '#38cfff', width: 4, shadowColor: 'rgba(56,207,255,.45)', shadowBlur: 12 },
      itemStyle: { color: '#071c3c', borderColor: '#76edff', borderWidth: 3 },
      areaStyle: { color: 'rgba(20, 178, 255, .14)' },
    },
    { name: '证书积累', type: 'line', smooth: true, symbol: 'diamond', symbolSize: 8,
      data: growthTrend.value.cert.map((v) => Math.min(100, v * 18)),
      lineStyle: { color: '#46e5a8', width: 3 }, itemStyle: { color: '#46e5a8' },
    },
    { name: '项目经验', type: 'line', smooth: true, symbol: 'roundRect', symbolSize: 8,
      data: growthTrend.value.proj.map((v) => Math.min(100, v * 14)),
      lineStyle: { color: '#f6c945', width: 3 }, itemStyle: { color: '#f6c945' },
    },
  ],
}))

const opportunityTimeline = computed(() => {
  const d = dashboard.value
  const certGap = Math.max(1, 2 - (d?.internship.certificateCount ?? 0))
  const projGap = Math.max(1, 5 - (d?.internship.projectCount ?? 0))
  const internGap = Math.max(1, 1 - (d?.internship.internshipCount ?? 0))

  // 仅展示“本学期”这六个月：按当前日期推算所属学期（9–2 月为秋学期，3–8 月为春学期）
  const now = new Date()
  const m = now.getMonth() + 1
  const isAutumn = m >= 9 || m <= 2

  // 本学期六个月，每个月对应的比赛 / 活动 / 考证等机会
  const monthPlan: Record<string, { type: string; title: string; desc: string }[]> = isAutumn
    ? {
        '9月': [
          { type: '活动', title: '社团招新 / 迎新项目', desc: '参与迎新工程实践，初步接触项目协作' },
          { type: '证书', title: '计算机二级备考', desc: '巩固办公与编程基础能力' },
        ],
        '10月': [
          { type: '比赛', title: '校级编程新生赛', desc: '以赛促学，积累首个竞赛经历' },
          { type: '证书', title: '英语四级 CET-4', desc: '夯实语言基础，为六级铺路' },
        ],
        '11月': [
          { type: '比赛', title: '蓝桥杯 / 数学建模报名', desc: '冲击省级奖项，丰富简历亮点' },
          { type: '活动', title: 'GitHub 开源贡献', desc: '参与 1 个开源项目，积累工程经验' },
        ],
        '12月': [
          { type: '证书', title: '英语六级 CET-6', desc: '提升语言竞争力，对应聘 / 考研加分' },
          { type: '比赛', title: '期末综合项目', desc: '以课程项目打磨作品集' },
        ],
        '1月': [
          { type: '项目', title: '寒假实训', desc: '参与短期实训，补齐项目经验' },
          { type: '活动', title: '社会实践', desc: '参加社会实践，拓展综合素养' },
        ],
        '2月': [
          { type: '实习', title: `寒假企业实习 ×${internGap}`, desc: '进入真实工程环境，补足实习经历' },
          { type: '证书', title: `行业认证 ×${certGap}`, desc: '考取与方向匹配的 1–2 项认证' },
        ],
      }
    : {
        '3月': [
          { type: '活动', title: '新学期规划', desc: '制定本学期成长目标与节奏' },
          { type: '证书', title: '软考 / 云认证备考', desc: '提升专业深度与背书' },
        ],
        '4月': [
          { type: '比赛', title: '蓝桥杯省赛', desc: '冲击更高奖项，丰富简历' },
          { type: '证书', title: '计算机等级考试', desc: '巩固基础能力认证' },
        ],
        '5月': [
          { type: '比赛', title: '互联网+ / 挑战杯', desc: '组队参与双创大赛，锻炼综合能力' },
          { type: '项目', title: `企业级项目 ×${projGap}`, desc: '打磨作品集，对齐优秀生均 5 项' },
        ],
        '6月': [
          { type: '实习', title: '暑期实习启动', desc: '定向投递，争取真实工程岗位' },
          { type: '证书', title: '云架构认证', desc: '提升专业深度' },
        ],
        '7月': [
          { type: '实习', title: `企业实习 ×${internGap}`, desc: '进入真实工程环境，补足项目经验' },
          { type: '活动', title: '社会实践', desc: '参加社会实践，拓展综合素养' },
        ],
        '8月': [
          { type: '项目', title: '作品集打磨', desc: '整合成果，完善个人作品集' },
          { type: '升学', title: '考研 / 申请筹备', desc: '整理成果，联络目标导师' },
        ],
      }

  return Object.entries(monthPlan).map(([month, items], i) => ({
    time: month,
    side: (i % 2 === 0 ? 'up' : 'down') as 'up' | 'down',
    items,
  }))
})

/* ════════════ 4. 学生成长风险雷达 ════════════ */
const riskDims = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const gpa = d.academic.gpa ?? 3
  const jobReady = d.employment.jobReadiness ?? 70
  const mental = d.health.mentalHealth ?? 70
  return [
    { key: 'academic', label: '学业风险', value: clamp((4 - gpa) * 22),
      reason: gpa < 2.5 ? '存在不及格课程风险' : '成绩波动需保持稳定', suggest: '保持 GPA 稳定，关注核心课程' },
    { key: 'career', label: '就业风险', value: clamp(100 - jobReady),
      reason: '项目数量低于专业平均约 35%', suggest: '3 个月内完成 1 项企业项目' },
    { key: 'mental', label: '心理风险', value: clamp(100 - mental),
      reason: '近期压力指数相对偏高', suggest: '定期开展谈心谈话' },
    { key: 'skill', label: '技能风险', value: clamp(100 - competitionScore.value),
      reason: '竞赛科研积累仍显不足', suggest: '参与 1 项学科竞赛或科研' },
    { key: 'plan', label: '规划风险', value: clamp(65 - (d.careerDev.targetUniversities?.length ? 25 : 0)),
      reason: d.careerDev.targetUniversities?.length ? '发展方向已初步明确' : '发展方向尚不清晰', suggest: '尽快明确升学 / 就业目标' },
  ].map((r) => ({ ...r, color: riskToneColor(r.value) }))
})

const riskRadarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '52%'],
    radius: '66%',
    indicator: riskDims.value.map(r => ({ name: r.label, max: 100 })),
    axisName: { color: '#8eb8d8', fontSize: 18 },
    shape: 'polygon',
    splitNumber: 4,
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.15)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.1)' } },
    splitArea: { areaStyle: { color: ['rgba(0,100,180,0.05)', 'rgba(0,60,120,0.08)'] } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: riskDims.value.map(r => r.value),
      name: '风险指数',
      areaStyle: { color: 'rgba(255,116,116,0.2)' },
      lineStyle: { color: '#ff7474', width: 2 },
      itemStyle: { color: '#ff7474' },
    }],
    symbol: 'circle',
    symbolSize: 6,
  }],
}))

/* ════════════ 学生发展路径规划（驾驶舱内） ════════════ */
void riskRadarOption

const riskBarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1000,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: 110, right: 38, top: 16, bottom: 16 },
  xAxis: {
    type: 'value', max: 100, splitNumber: 4,
    axisLabel: { color: '#789fbb', fontSize: 14 }, axisLine: { show: false }, axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(108, 215, 255, .1)', type: 'dashed' } },
  },
  yAxis: {
    type: 'category', inverse: true, data: riskDims.value.map((item) => item.label),
    axisLabel: { color: '#d4edff', fontSize: 18, fontWeight: 700 }, axisLine: { show: false }, axisTick: { show: false },
  },
  series: [{
    type: 'bar', barWidth: 18, data: riskDims.value.map((item) => ({
      value: item.value,
      itemStyle: {
        color: item.color,
        borderRadius: 12,
        shadowColor: `${item.color}55`,
        shadowBlur: 8,
      },
    })),
    showBackground: true, backgroundStyle: { color: 'rgba(86, 125, 165, .16)', borderRadius: 12 },
    label: { show: true, position: 'right', color: '#e9f7ff', fontSize: 18, fontWeight: 800, formatter: '{c}' },
  }],
}))

const pathOptions: Array<{ key: 'postgrad' | 'job' | 'civil'; label: string }> = [
  { key: 'postgrad', label: '继续考研' },
  { key: 'job', label: '直接就业' },
  { key: 'civil', label: '考公' },
]
/* 各方向匹配度，用于排序与默认优先展示匹配度最高的方向 */
const pathScore = (key: 'postgrad' | 'job' | 'civil'): number => {
  const gpa = dashboard.value?.academic.gpa ?? 3
  const jobReady = dashboard.value?.employment.jobReadiness ?? 70
  if (key === 'postgrad') return clamp(60 + (gpa - 3) * 30)
  if (key === 'job') return clamp(jobReady + 5)
  return 68
}
/* 三个方向按匹配度从高到低排序，手风琴展示 */
const pathOptionsSorted = computed(() =>
  [...pathOptions].sort((a, b) => pathScore(b.key) - pathScore(a.key)),
)
/* 占比最高的方向优先默认展开（数据抵达时自动更新） */
const priorityPath = computed<'postgrad' | 'job' | 'civil'>(() => pathOptionsSorted.value[0].key)
const simPath = ref<'postgrad' | 'job' | 'civil'>(priorityPath.value)
watch(
  () => dashboard.value,
  (val) => {
    if (val) simPath.value = priorityPath.value
  },
  { immediate: true },
)
const pathResult = computed(() => {
  if (simPath.value === 'postgrad') {
    return {
      type: 'postgrad',
      headline: '升学竞争力较强',
      strengths: ['GPA 较高', '专业基础扎实'],
      weakness: '数学模块需补强',
      suggest: '补强数学课程 · 准备目标院校',
    }
  }
  if (simPath.value === 'job') {
    return {
      type: 'job',
      headline: '岗位适配度较高',
      roles: ['Java开发', '后端工程师'],
      salary: '12–18K',
      strengths: ['专业技能突出'],
      weakness: '企业实践不足',
    }
  }
  return {
    type: 'civil',
    headline: '综合匹配较好',
    strengths: ['综合成绩较好'],
    weakness: '行政能力模块不足',
    suggest: '加强申论与行测训练',
  }
})
const currentPathLabel = computed(
  () => pathOptions.find(o => o.key === simPath.value)?.label ?? '',
)

/* ── 发展路径规划：三个方向各自的二级详情页 ── */
const pathRouteMap: Record<string, string> = {
  postgrad: ROUTES.student.careerPathPostgrad,
  job: ROUTES.student.careerPathJob,
  civil: ROUTES.student.careerPathCivil,
}
const pathTabMap: Record<string, string> = {
  postgrad: 'graduate',
  job: 'employment',
  civil: 'civil',
}
function goCareerPath(key: 'postgrad' | 'job' | 'civil') {
  const studentId = route.query.studentId as string | undefined
  router.push({
    path: pathRouteMap[key],
    query: studentId ? { studentId, tab: pathTabMap[key] } : { tab: pathTabMap[key] },
  })
}

/* ════════════ 6. 同专业成长比较 ════════════ */
const peerDims = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const gpa = d.academic.gpa ?? 3
  const pc = d.internship.projectCount
  const aw = d.competition.awardCount
  const cert = d.internship.certificateCount
  const intern = d.internship.internshipCount
  return [
    { name: 'GPA', self: clamp(gpa / 4 * 100), top: 90 },
    { name: '项目数量', self: clamp(pc * 20), top: 100 },
    { name: '竞赛', self: clamp(aw * 20 + 30), top: 80 },
    { name: '证书', self: clamp(cert * 25 + 30), top: 90 },
    { name: '实践', self: clamp(intern * 30 + 30), top: 95 },
  ]
})
const peerCompareOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { data: ['本人', '专业TOP20%'], textStyle: { color: '#cfe6f8', fontSize: 18 }, top: 0, right: 0 },
  radar: {
    center: ['50%', '56%'],
    radius: '66%',
    indicator: peerDims.value.map(d => ({ name: d.name, max: 100 })),
    axisName: { color: '#8eb8d8', fontSize: 18 },
    shape: 'polygon',
    splitNumber: 4,
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.15)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.1)' } },
    splitArea: { areaStyle: { color: ['rgba(0,100,180,0.05)', 'rgba(0,60,120,0.08)'] } },
  },
  series: [{
    type: 'radar',
    data: [
      { value: peerDims.value.map(d => d.self), name: '本人',
        areaStyle: { color: 'rgba(0,229,255,0.25)' }, lineStyle: { color: '#00e5ff', width: 2 }, itemStyle: { color: '#00e5ff' } },
      { value: peerDims.value.map(d => d.top), name: '专业TOP20%',
        areaStyle: { color: 'rgba(250,204,21,0.15)' }, lineStyle: { color: '#facc15', width: 2 }, itemStyle: { color: '#facc15' } },
    ],
    symbol: 'circle',
    symbolSize: 5,
  }],
}))

/* ════════════ 7. AI行动建议 ════════════ */
void peerCompareOption

const peerCompareBarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1100,
  animationEasing: 'cubicOut',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: {
    data: ['本人', '专业TOP20%'], top: 2, left: 'center', itemWidth: 18, itemHeight: 8, itemGap: 22,
    textStyle: { color: '#c8e5f7', fontSize: 17, fontWeight: 700 },
  },
  grid: { left: 105, right: 30, top: 48, bottom: 18 },
  xAxis: {
    type: 'value', max: 100, splitNumber: 4,
    axisLabel: { color: '#769eb9', fontSize: 14 }, axisLine: { show: false }, axisTick: { show: false },
    splitLine: { lineStyle: { color: 'rgba(102, 217, 255, .1)', type: 'dashed' } },
  },
  yAxis: {
    type: 'category', inverse: true, data: peerDims.value.map((item) => item.name),
    axisLabel: { color: '#d4ecff', fontSize: 18, fontWeight: 700 }, axisLine: { show: false }, axisTick: { show: false },
  },
  series: [
    { name: '本人', type: 'bar', barWidth: 12, data: peerDims.value.map((item) => item.self),
      itemStyle: { borderRadius: 9, color: '#28d6e8', shadowColor: 'rgba(40, 214, 232, .32)', shadowBlur: 10 },
      label: { show: true, position: 'right', color: '#8cf7ff', fontSize: 17, fontWeight: 800, formatter: '{c}' },
    },
    { name: '专业TOP20%', type: 'bar', barWidth: 12, data: peerDims.value.map((item) => item.top),
      itemStyle: { borderRadius: 9, color: 'rgba(250, 204, 21, .82)' },
    },
  ],
}))

const actionPlan = computed(() => {
  const d = dashboard.value
  if (!d) return { recent: [], mid: [], long: [] }

  const proj = d.internship.projectCount
  const intern = d.internship.internshipCount
  const cert = d.internship.certificateCount
  const award = d.competition.awardCount
  const topAbility = [...abilities.value].sort((a, b) => b.value - a.value)[0]
  const topRiskList = [...riskDims.value].sort((a, b) => b.value - a.value).slice(0, 3)
  const directions = studentPortrait.value.directions.length
    ? studentPortrait.value.directions
    : [d.aiAssistant.recommendedDirection].filter(Boolean)
  // 长期目标只取匹配度最高（结合意愿）的单条路径，不把考研/考公/就业同时罗列
  const topKey = pathOptionsSorted.value[0]?.key ?? 'job'
  const topLabel = pathOptionsSorted.value[0]?.label ?? '直接就业'
  let longDirection: string[]
  let longCareer: string[]
  let longTarget: string[]
  let longCore: string[]
  if (topKey === 'postgrad') {
    longDirection = ['继续考研（升学）', ...directions]
    longCareer = ['锁定目标院校，制定初试 / 复试备考计划', '提前联系导师，关注科研机会']
    longTarget = (d.careerDev.targetUniversities || []).map(u => `目标院校：${u}`)
    longCore = ['强化学科基础（数学 / 专业课）', '提升科研与学术表达能力', '形成学术型核心竞争力']
  } else if (topKey === 'civil') {
    longDirection = ['考公（公务员 / 事业单位）', ...directions]
    longCareer = ['系统备考申论与行测', '关注招考动态与岗位要求']
    longTarget = (d.employment.careerDirections || []).map(r => `意向岗位：${r}`)
    longCore = ['强化行政能力与综合分析能力', '提升政策理解与文字表达', '形成公共服务核心素养']
  } else {
    longDirection = ['直接就业', ...directions]
    longCareer = ['完善求职材料，定向投递目标岗位', '积累面试与实习转正经验']
    longTarget = (d.employment.careerDirections || []).map(r => `目标岗位：${r}`)
    longCore = ['深化工程实践与项目作品集', '提升岗位专业匹配度', '形成行业差异化竞争力']
  }
  if (!longTarget.length) longTarget = ['结合路径匹配度锁定目标院校 / 岗位']
  // 核心能力建设统一收尾：以最高匹配方向为主线
  longCore = [
    `以匹配度最高的「${topLabel}」方向为核心，系统建设能力`,
    ...longCore.slice(1),
    ...(d.aiAssistant.longTermSuggestions || []).slice(0, 1),
    '形成个人核心竞争力与差异化优势',
  ]

  const recent: Array<{ title: string; items: string[] }> = [
    {
      title: '当前风险处理',
      items: topRiskList.map(r => `${r.label}：${r.suggest}`),
    },
    {
      title: '短板提升',
      items: [
        ...studentPortrait.value.weaknesses.map(w => `补强「${w}」，制定专项提升计划`),
        proj < 5 ? `项目经验不足（${proj}/5），3 个月内新增 1–2 项企业项目` : '',
        intern < 1 ? '企业实践不足，尽快争取 1 段实习' : '',
        cert < 2 ? '证书偏少，考取 1–2 项行业认证' : '',
      ].filter(Boolean),
    },
    {
      title: '近期目标',
      items: [
        '保持核心课程 GPA 稳定',
        proj < 5 ? '本学期完成 1 项企业级项目' : '打磨现有项目作品集',
        award === 0 ? '报名 1 项学科竞赛 / 科研' : '冲击更高竞赛奖项',
        directions.length ? '锁定目标发展方向，明确阶段任务' : '初步明确升学 / 就业方向',
      ],
    },
    {
      title: '待完成事项',
      items: (d.aiPortrait.coachingTasks || []).slice(0, 4).map(t => t.title),
    },
  ]

  const mid: Array<{ title: string; items: string[] }> = [
    {
      title: '专业能力提升',
      items: [
        `围绕最强项「${topAbility?.label}」纵深发展，形成个人优势标签`,
        '跟进专业前沿，参与 1 门高阶 / 认证课程',
        d.academic.majorTotal
          ? `巩固专业排名（当前前 ${Math.round(d.academic.majorRank / d.academic.majorTotal * 100)}%）`
          : '巩固专业基础，拓展知识边界',
      ],
    },
    {
      title: '实践能力培养',
      items: [
        proj < 5 ? `补齐企业项目至 5 项以上（当前 ${proj}）` : '提升项目质量，争取科研成果',
        intern < 1 ? '补充 1 段企业实习，进入真实工程环境' : '深化实习内容，承担核心任务',
        '将项目沉淀为可展示的技术作品集',
      ],
    },
    {
      title: '荣誉成果积累',
      items: [
        award < 2 ? `增加竞赛 / 科研获奖（当前 ${award}）` : '冲击更高等级竞赛奖项',
        '积累可量化的成果与证书，丰富简历亮点',
        '参与开源 / 行业活动，扩大专业影响力',
      ],
    },
    {
      title: '综合能力发展',
      items: [
        `发挥干部 / 志愿经历优势（干部 ${d.quality.cadreRoles.length} · 志愿 ${d.quality.volunteerHours}h）`,
        '锻炼沟通协作与领导力等软实力',
        '拓展跨学科视野，提升综合素养',
      ],
    },
  ]

  const long: Array<{ title: string; items: string[] }> = [
    { title: '发展方向', items: longDirection },
    { title: '生涯规划', items: longCareer },
    { title: '目标岗位/院校', items: longTarget },
    { title: '核心能力建设', items: longCore },
  ]

  return { recent, mid, long }
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="智能育航 · 深度分析"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="ai-deep">
      <StudentSectionNav :items="sectionNav" />

      <!-- ═══════ 1. 学生发展驾驶舱 ═══════ -->
      <section id="sec-cockpit" class="deep-card">
        <div class="deep-card__glow" aria-hidden="true" />
        <h3 class="deep-card__title">学生发展驾驶舱</h3>
        <div class="cockpit-grid">
          <!-- 左：综合发展指数 -->
          <div class="cockpit-left">
            <h4 class="panel-label">综合发展指数</h4>
            <div class="cockpit-ring-score">
              <div class="ring-glow" aria-hidden="true" />
              <svg class="ring-svg" viewBox="0 0 120 120">
                <defs>
                  <linearGradient id="cockpitRingGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" :stop-color="ringScoreColor" />
                    <stop offset="100%" stop-color="#9ef0ff" />
                  </linearGradient>
                </defs>
                <circle class="ring-svg__bg" cx="60" cy="60" r="50" />
                <circle
                  class="ring-svg__fill"
                  cx="60" cy="60" r="50"
                  stroke="url(#cockpitRingGrad)"
                  :stroke-dashoffset="314 - 314 * compositeScore.score / 100"
                />
              </svg>
              <div class="ring-svg__center">
                <StuHint
                  tip="综合发展指数，由四维能力均值汇总"
                  :formula="SCORE_FORMULAS.growthIndex + '\n本页环形分 ≈ 学业/专业/实践/求职等能力均值'"
                  :delay="280"
                >
                  <div class="ring-svg__score" :style="{ color: ringScoreColor }">{{ compositeScore.score }}</div>
                  <div class="ring-svg__level" :style="{ color: ringScoreColor }">{{ compositeScore.level }}</div>
                </StuHint>
              </div>
            </div>
            <div class="stage-block">
              <div class="stage-block__label">发展阶段</div>
              <div class="stage-block__stage">
                <span class="stage-block__stars">{{ stars(studentPortrait.stageStars) }}</span>
                <span class="stage-block__text">{{ studentPortrait.stage }}学生</span>
              </div>
              <div class="stage-progress">
                <div class="stage-progress__head">
                  <span>成长阶段</span>
                  <em>{{ compositeScore.score }}%</em>
                </div>
                <div class="stage-progress__bar">
                  <div
                    class="stage-progress__fill"
                    :style="{ width: compositeScore.score + '%', background: ringScoreColor }"
                  />
                </div>
              </div>
              <div class="stage-stats">
                <div class="stage-stat">
                  <span class="stage-stat__label">超过专业学生</span>
                  <strong class="stage-stat__value">{{ exceedPercent }}%</strong>
                </div>
                <div class="stage-stat">
                  <span class="stage-stat__label">排名</span>
                  <strong class="stage-stat__value">TOP {{ rankPercent }}%</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- 中：学生发展路径规划（手风琴：匹配度最高默认展开） -->
          <div class="cockpit-portrait">
            <h4 class="panel-label">学生发展路径规划</h4>
            <div class="path-accordion">
              <div
                v-for="opt in pathOptionsSorted"
                :key="opt.key"
                class="path-item"
                :class="{ 'is-active': simPath === opt.key }"
              >
                <button
                  type="button"
                  class="path-item__head"
                  :class="{ 'is-active': simPath === opt.key }"
                  @click="simPath = opt.key"
                >
                  <span class="path-item__label">{{ opt.label }}</span>
                  <span class="path-item__match" aria-label="匹配度">
                    <span class="path-item__match-label">匹配</span>
                    <span class="path-item__bar">
                      <i :style="{ width: pathScore(opt.key) + '%' }" />
                    </span>
                    <em class="path-item__match-val">{{ pathScore(opt.key) }}%</em>
                  </span>
                  <i class="path-item__arrow" />
                </button>
                <div v-show="simPath === opt.key" class="path-item__body">
                  <div class="sim-result">
                    <div class="sim-result__headline">{{ pathResult.headline }}</div>
                    <template v-if="pathResult.type === 'job'">
                      <div class="sim-result__row"><span>推荐岗位</span><em>{{ pathResult.roles?.join(' / ') }}</em></div>
                      <div class="sim-result__row"><span>预计薪资</span><em class="hl">{{ pathResult.salary }}</em></div>
                    </template>
                    <div class="sim-result__row"><span>优势</span><em>{{ pathResult.strengths.join('、') }}</em></div>
                    <div class="sim-result__row"><span>短板</span><em>{{ pathResult.weakness }}</em></div>
                    <div v-if="pathResult.suggest" class="sim-result__suggest">建议：{{ pathResult.suggest }}</div>
                    <button type="button" class="sim-detail-btn" @click="goCareerPath(simPath)">查看{{ currentPathLabel }}详情 ›</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 右：AI综合判断（决策摘要） -->
          <div class="cockpit-judgment">
            <h4 class="panel-label">AI 综合判断</h4>
            <div class="ai-decision">
              <div class="ai-decision__status">
                <span class="ai-decision__dot" :class="aiDecision.status === '良好' ? 'is-good' : 'is-warn'" />
                <div>
                  <div class="ai-decision__row-label">当前状态</div>
                  <div class="ai-decision__status-text">{{ aiDecision.status }}</div>
                </div>
              </div>
              <div class="ai-decision__signals">
                <div class="ai-decision__block ai-decision__block--good">
                  <div class="ai-decision__label">核心优势</div>
                  <div class="ai-decision__text">{{ aiDecision.advantage }}</div>
                </div>
                <div class="ai-decision__block ai-decision__block--warn">
                  <div class="ai-decision__label">关注风险</div>
                  <div class="ai-decision__text">{{ aiDecision.risk }}</div>
                </div>
              </div>
              <div class="ai-decision__next">
                <span>优先动作</span>
                <p>{{ aiDecision.action }}</p>
              </div>
              <div class="judge-source">
                <span class="judge-source__label">数据来源</span>
                <div class="tag-row">
                  <span v-for="s in aiDecision.sources" :key="s" class="tag tag--src">{{ s }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 1.5 AI行动建议 ═══════ -->
      <section id="sec-action" class="deep-card">
        <h3 class="deep-card__title">AI 行动建议</h3>
        <div class="action-grid">
          <div class="action-col">
            <h4 class="action-col__title action-col__title--now">近期任务</h4>
            <div
              v-for="g in actionPlan.recent.slice(0, 3)"
              :key="g.title"
              class="action-sub"
            >
              <div class="action-sub__title">{{ g.title }}</div>
              <ul class="action-list">
                <li v-for="(t, i) in g.items.slice(0, 1)" :key="i"><i class="dot dot--red" />{{ t }}</li>
              </ul>
            </div>
          </div>
          <div class="action-col">
            <h4 class="action-col__title action-col__title--mid">中期任务</h4>
            <div
              v-for="g in actionPlan.mid.slice(0, 3)"
              :key="g.title"
              class="action-sub"
            >
              <div class="action-sub__title">{{ g.title }}</div>
              <ul class="action-list">
                <li v-for="(t, i) in g.items.slice(0, 1)" :key="i"><i class="dot dot--yellow" />{{ t }}</li>
              </ul>
            </div>
          </div>
          <div class="action-col">
            <h4 class="action-col__title action-col__title--long">长期目标</h4>
            <div
              v-for="g in actionPlan.long.slice(0, 3)"
              :key="g.title"
              class="action-sub"
            >
              <div class="action-sub__title">{{ g.title }}</div>
              <ul class="action-list">
                <li v-for="(t, i) in g.items.slice(0, 1)" :key="i"><i class="dot dot--green" />{{ t }}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 2. 能力画像分析 ═══════ -->
      <section id="sec-capability" class="deep-card">
        <h3 class="deep-card__title">能力画像分析</h3>
        <div class="capability-grid">
          <!-- 左：能力雷达（本人 vs 专业平均） -->
          <div class="cap-cell">
            <div class="cap-cell__title">能力雷达（本人 vs 专业平均）</div>
            <ChartContainer :option="capabilityCompareOption" class="cap-compare-chart" />
          </div>
          <!-- 右：能力指数排行 -->
          <div class="cap-cell">
            <div class="cap-cell__title">能力指数排行</div>
            <div class="cap-rank-grid">
              <div
                v-for="(b, index) in capabilityBars"
                :key="b.key"
                class="cap-rank-card"
                :style="{ '--cap-color': b.color, '--cap-delay': index * 80 + 'ms' }"
              >
                <div class="cap-rank-card__head">
                  <span class="cap-rank-card__index">0{{ index + 1 }}</span>
                  <span class="cap-rank-card__label">{{ b.label }}</span>
                </div>
                <strong>{{ b.value }}</strong>
                <span class="cap-rank-card__unit">能力分</span>
                <div class="cap-rank-card__track"><i :style="{ width: b.value + '%' }" /></div>
                <p>{{ b.detail }}</p>
              </div>
            </div>
          </div>
        </div>
        <!-- AI 能力诊断（横向） -->
        <div class="cap-diag-section">
          <div class="cap-cell__title">AI 能力诊断</div>
          <div class="diag-list">
            <div v-for="item in capabilityDiagnostics" :key="item.idx" class="diag-item">
              <div class="diag-item__title">{{ item.idx }} {{ item.title }}</div>
              <div class="diag-item__rows">
                <div v-for="it in item.items" :key="it.k" class="diag-row">
                  <span class="diag-row__k">{{ it.k }}</span>
                  <span class="diag-row__v">{{ it.v }}</span>
                </div>
              </div>
              <div v-if="item.suggest" class="diag-item__suggest">提升建议：{{ item.suggest }}</div>
            </div>
          </div>
        </div>
        <div class="cap-summary-box">
          <p class="cap-summary"><b class="cap-summary__tag">AI 综合研判</b>{{ aiSummary }}</p>
        </div>
      </section>

      <!-- ═══════ 2.5 能力成长趋势 ═══════ -->
      <section id="sec-trend" class="deep-card">
        <h3 class="deep-card__title">能力成长趋势</h3>
        <div class="trend-wrap">
          <ChartContainer :option="growthMomentumOption" style="height:330px" />
        </div>
      </section>

      <!-- ═══════ 3. AI机会雷达 · 成长时间轴 ═══════ -->
      <section id="sec-opportunity" class="deep-card">
        <h3 class="deep-card__title">AI 机会雷达</h3>
        <p class="opp-timeline__hint">按月份呈现本学期值得优先投入的比赛、证书与实践机会。</p>
        <div class="opp-timeline">
          <div class="opp-timeline__inner">
            <div
              v-for="(node, i) in opportunityTimeline"
              :key="i"
              class="tl-node"
              :class="node.side === 'up' ? 'tl-node--top' : 'tl-node--bottom'"
            >
              <div class="tl-card">
                <ul class="tl-card__list">
                  <li v-for="it in node.items" :key="it.title" class="tl-item">
                    <span class="tl-item__tag" :class="'is-' + it.type">{{ it.type }}</span>
                    <div class="tl-item__text">
                      <div class="tl-item__title">{{ it.title }}</div>
                      <div class="tl-item__desc">{{ it.desc }}</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div class="tl-time">{{ node.time }}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 4. 学生成长风险雷达 ═══════ -->
      <section id="sec-risk" class="deep-card">
        <h3 class="deep-card__title">学生成长风险雷达</h3>
        <div class="risk-grid">
          <div class="risk-chart">
            <ChartContainer :option="riskBarOption" style="height:300px" />
          </div>
          <div class="risk-explain">
            <div
              v-for="r in riskDims"
              :key="r.key"
              class="risk-item"
              :style="{ '--c': r.color }"
            >
              <div class="risk-item__head">
                <span class="risk-item__name">{{ r.label }}</span>
                <span class="risk-item__val">{{ r.value }}</span>
              </div>
              <p class="risk-item__reason">原因：{{ r.reason }}</p>
              <p class="risk-item__suggest">建议：{{ r.suggest }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 5. 同专业成长比较 ═══════ -->
      <section id="sec-peer" class="deep-card">
        <h3 class="deep-card__title">同专业成长比较</h3>
        <div class="peer-grid">
          <div class="peer-chart">
            <ChartContainer :option="peerCompareBarOption" style="height:300px" />
          </div>
          <div class="peer-table">
            <div class="peer-row peer-row--head">
              <span>维度</span><span>本人</span><span>专业TOP20%</span><span>差距</span>
            </div>
            <div v-for="d in peerDims" :key="d.name" class="peer-row">
              <span>{{ d.name }}</span>
              <span class="hl">{{ d.self }}</span>
              <span>{{ d.top }}</span>
              <span class="peer-delta" :class="d.self >= d.top ? 'is-positive' : 'is-negative'">
                {{ d.self >= d.top ? '+' : '' }}{{ d.self - d.top }}
              </span>
            </div>
            <div class="peer-concl">
              <span class="tag tag--good">竞赛领先</span>
              <span class="tag tag--warn">项目不足</span>
            </div>
          </div>
        </div>
      </section>

    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
/* 旧 deep-card 定义已合并到下方 ai-deep 区块 */

.ai-deep {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 40px;
  --ai-fs-title: 34px;
  --ai-fs-panel: 28px;
  --ai-fs-body: 24px;
  --ai-fs-meta: 21px;
  --ai-fs-num: 34px;
  color: #d8eeff;
  font-size: var(--ai-fs-body);
  line-height: 1.55;
}

.ai-deep :deep(.stu-sec-nav) {
  margin-bottom: 6px;
  padding: 10px;
  gap: 10px;
}

.ai-deep :deep(.stu-sec-nav__item) {
  min-width: 112px;
  padding: 13px 18px;
  font-size: 21px;
  letter-spacing: 0.05em;
}

.ai-deep > section[id^='sec-'] {
  scroll-margin-top: 72px;
}

.deep-card {
  position: relative;
  padding: 22px 24px 24px;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid rgba(102, 217, 255, 0.24);
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0, 180, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  animation: fadeUp 0.45s ease-out both;

  &__glow {
    position: absolute;
    inset: auto -15% -40% auto;
    width: 45%;
    height: 60%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.65), transparent);
  }

  &:nth-of-type(1) { animation-delay: .02s; }
  &:nth-of-type(2) { animation-delay: .06s; }
  &:nth-of-type(3) { animation-delay: .10s; }
  &:nth-of-type(4) { animation-delay: .14s; }
  &:nth-of-type(5) { animation-delay: .18s; }
  &:nth-of-type(6) { animation-delay: .22s; }
  &:nth-of-type(7) { animation-delay: .26s; }
  &:nth-of-type(8) { animation-delay: .30s; }
}

.deep-card__title {
  position: relative;
  z-index: 1;
  margin: 0 0 18px;
  font-size: var(--ai-fs-title);
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: .05em;
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.18);

  &::before {
    content: '';
    width: 4px;
    height: 22px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7ff6ff, #00b8ff);
    box-shadow: 0 0 10px rgba(0, 212, 255, .5);
  }
}

.panel-label {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
  font-size: var(--ai-fs-panel);
  font-weight: 800;
  color: #e8f7ff;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(102, 217, 255, .16);
}

.cap-cell__title {
  font-size: 23px;
  font-weight: 800;
  color: #a8d4ef;
  margin-bottom: 12px;
  letter-spacing: .03em;
}

/* ── 1. 驾驶舱 ── */
.cockpit-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.05fr) minmax(0, 1.15fr);
  grid-auto-rows: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

/* 三栏统一为面板卡片，视觉层级一致、顶端对齐 */
.cockpit-left,
.cockpit-portrait,
.cockpit-judgment {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  align-self: stretch;
  padding: 18px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(100% 80% at 0% 0%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(0, 56, 110, 0.42), rgba(3, 14, 38, 0.78));
  border: 1px solid rgba(102, 217, 255, 0.22);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 14px;
    right: 14px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.5), transparent);
    pointer-events: none;
  }
}

.cockpit-left {
  justify-content: flex-start;
  padding-top: 14px;
}

/* 环形仪表（主环，SVG 渲染，中心数字 + 等级） */
.cockpit-ring-score {
  position: relative;
  width: 210px;
  height: 210px;
  margin: 4px auto 12px;
}

.ring-glow {
  position: absolute;
  inset: 14%;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 229, 255, 0.22), transparent 70%);
  animation: ring-breathe 2.8s ease-in-out infinite;
  pointer-events: none;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
  filter: drop-shadow(0 0 14px rgba(0, 229, 255, 0.32));

  &__bg {
    fill: none;
    stroke: rgba(20, 55, 100, 0.7);
    stroke-width: 14;
    stroke-linecap: round;
  }
  &__fill {
    fill: none;
    stroke-width: 14;
    stroke-linecap: round;
    stroke-dasharray: 314;
    transition: stroke-dashoffset 1.2s cubic-bezier(.22, .8, .28, 1);
  }
  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  &__score {
    font-size: 58px;
    font-weight: 900;
    line-height: 1;
    font-family: 'DIN Alternate', sans-serif;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 22px rgba(0, 229, 255, 0.45);
  }
  &__level {
    margin-top: 8px;
    padding: 2px 12px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.1em;
    color: #04101f !important;
    background: linear-gradient(90deg, #7ef0d0, #66d9ff);
  }
}

.stage-block {
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-top: 12px;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 24, 52, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.14);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  &__label { color: #7eb4d8; font-size: 16px; font-weight: 650; margin-bottom: 8px; }
  &__stage { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  &__stars { color: #facc15; font-size: 22px; letter-spacing: 2px; }
  &__text { color: #7ff6ff; font-size: 20px; font-weight: 800; }
}

.stage-progress {
  margin-bottom: 14px;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 16px;
    color: #8eb8d8;
    font-weight: 650;
    margin-bottom: 8px;

    em { color: #7ff6ff; font-weight: 900; font-style: normal; font-size: 22px; font-family: 'DIN Alternate', sans-serif; }
  }
  &__bar {
    height: 10px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(0, 24, 52, 0.75);
    border: 1px solid rgba(102, 217, 255, 0.1);
  }
  &__fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #0d9488, #67e8f9);
    box-shadow: 0 0 12px rgba(103, 232, 249, 0.4);
  }
}

.stage-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stage-stat {
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(0, 28, 58, 0.5);
  border: 1px solid rgba(102, 217, 255, 0.14);

  &__label { display: block; color: #7eb4d8; font-size: 15px; font-weight: 650; margin-bottom: 6px; }
  &__value {
    color: #7ff6ff;
    font-size: 26px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1.1;
  }
}

.ability-break {
  margin-top: 8px;

  &__hint {
    font-size: 19px;
    color: #6a8db0;
    text-align: center;
    margin-bottom: 8px;
  }

  &__detail {
    margin: 10px 0 0;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 100, 180, .12);
    border: 1px solid rgba(0, 184, 255, .18);
    color: #b8ecff;
    font-size: 20px;
    text-align: center;
  }
}

.ability-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(102, 217, 255, .12);
  background: rgba(0, 30, 60, .28);
  color: #d8eeff;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  em {
    margin-left: auto;
    font-style: normal;
    color: var(--c);
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }

  &:hover { border-color: var(--c); }
  &.is-active {
    border-color: var(--c);
    box-shadow: 0 0 10px color-mix(in srgb, var(--c) 30%, transparent);
    background: rgba(0, 60, 110, .35);
  }
}

.cockpit-portrait {
  min-width: 0;
}

.portrait-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;

  &__head {
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
}

.portrait-type {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  align-self: flex-start;
  padding: 6px 16px;
  border-radius: 999px;
  background: rgba(0, 184, 255, .14);
  border: 1px solid rgba(0, 184, 255, .32);

  &__icon { font-size: 26px; }
  &__label { color: #8ef6ff; font-size: 22px; font-weight: 800; }
}

.portrait-section {
  &__title {
    font-size: 20px;
    font-weight: 700;
    color: #7aa4c0;
    margin-bottom: 8px;

    &--good { color: #43e7af; }
    &--warn { color: #facc15; }
  }
}

.route-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.route-item {
  padding: 5px 14px;
  border-radius: 6px;
  background: rgba(0, 180, 255, .12);
  border: 1px solid rgba(0, 200, 255, .3);
  color: #8ef6ff;
  font-size: 19px;
  font-weight: 700;
}
.route-arrow { color: #6cdfff; font-size: 22px; font-weight: 800; }

.portrait-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.portrait-name {
  font-size: 34px;
  font-weight: 900;
  color: #f6fbff;
  letter-spacing: 0.04em;
  text-shadow: 0 0 14px rgba(0, 242, 255, .28);
}
.portrait-meta { color: #9ecae8; font-size: 22px; margin-top: 2px; }

.portrait-stage {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  &__label { color: #7aa4c0; font-size: 19px; }
  &__stars { color: #facc15; font-size: 22px; letter-spacing: 2px; }
  &__text { color: #7ff6ff; font-size: 21px; font-weight: 800; }
}

.portrait-block {
  margin-bottom: 14px;

  &__title {
    font-size: 20px;
    font-weight: 800;
    color: #7aa4c0;
    margin-bottom: 8px;

    &--good { color: #43e7af; }
    &--warn { color: #facc15; }
  }
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 6px 14px;
  border-radius: 14px;
  font-size: 21px;
  font-weight: 700;
  border: 1px solid transparent;

  &--good { background: rgba(67, 231, 175, .14); color: #5ff0bd; border-color: rgba(67, 231, 175, .3); }
  &--warn { background: rgba(250, 204, 21, .14); color: #f7d774; border-color: rgba(250, 204, 21, .3); }
  &--dir { background: rgba(0, 180, 255, .14); color: #6cdfff; border-color: rgba(0, 200, 255, .3); }
  &--src {
    background: rgba(0, 60, 110, 0.4);
    color: #cfe8ff;
    border-color: rgba(102, 217, 255, 0.22);
    font-size: 15px;
    padding: 4px 12px;
  }
}

.cockpit-judgment {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.judge-status {
  display: flex;
  gap: 12px;

  &__item {
    flex: 1;
    padding: 12px;
    border-radius: 10px;
    background: rgba(0, 30, 60, .3);
    border: 1px solid rgba(102, 217, 255, .1);
    text-align: center;
  }
  &__label { display: block; color: #7aa4c0; font-size: 19px; margin-bottom: 6px; }
  &__value { color: #7ff6ff; font-size: 24px; font-weight: 800; }
}

.judge-basis {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__label { color: #cfe6f8; font-size: 20px; }
  &__stars { color: #facc15; font-size: 20px; letter-spacing: 1px; }
}

.judge-source {
  &__label { display: block; color: #7aa4c0; font-size: 20px; font-weight: 700; margin-bottom: 8px; }
}

.ai-decision {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__status {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(0, 28, 58, 0.48);
    border: 1px solid rgba(102, 217, 255, 0.16);
  }
  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;

    &.is-good { background: #43e7af; box-shadow: 0 0 12px rgba(67, 231, 175, .65); }
    &.is-warn { background: #facc15; box-shadow: 0 0 12px rgba(250, 204, 21, .65); }
  }
  &__row-label { color: #7eb4d8; font-size: 15px; font-weight: 650; }
  &__status-text { color: #7ff6ff; font-size: 24px; font-weight: 900; }

  &__signals {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  &__block {
    min-width: 0;
    padding: 12px 14px;
    border-radius: 12px;
    background: rgba(0, 24, 52, 0.45);
    border: 1px solid rgba(102, 217, 255, 0.12);

    &--good { border-color: rgba(67, 231, 175, 0.28); }
    &--warn { border-color: rgba(250, 204, 21, 0.28); }
  }
  &__label { color: #6cdfff; font-size: 15px; font-weight: 800; margin-bottom: 6px; }
  &__text { color: #d8eeff; font-size: 17px; line-height: 1.55; }

  &__signals {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  &__block--good { border-color: rgba(67, 231, 175, .24); }
  &__block--good .ai-decision__label { color: #5ff0bd; }
  &__block--warn { border-color: rgba(250, 204, 21, .24); }
  &__block--warn .ai-decision__label { color: #f7d774; }

  &__next {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    border-left: 3px solid #38bdf8;
    background: linear-gradient(90deg, rgba(0, 145, 220, .18), rgba(0, 38, 73, .35));
    border: 1px solid rgba(102, 217, 255, 0.14);
    border-left-width: 3px;

    span { color: #7fdfff; font-size: 15px; font-weight: 800; white-space: nowrap; padding-top: 2px; }
    p { margin: 0; color: #d8eeff; font-size: 17px; line-height: 1.55; }
  }
}

/* ── 2. 能力画像分析 ── */
.capability-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
  align-items: stretch;
}

/* AI 能力诊断（横向，放下面） */
.cap-diag-section {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid rgba(102, 217, 255, .08);
}

.cap-summary-box {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(102, 217, 255, .08);
}

/* AI 能力诊断 */
.diag-list {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 14px;
}
.diag-item {
  flex: 1 1 220px;
  min-width: 200px;
  padding: 14px 16px;
  border-radius: 8px;
  background: rgba(0, 30, 60, .24);
  border: 1px solid rgba(102, 217, 255, .1);

  &__title {
    color: #8ef6ff;
    font-size: 21px;
    font-weight: 800;
    margin-bottom: 10px;
  }
  &__rows {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__suggest {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px dashed rgba(102, 217, 255, .12);
    color: #f7d774;
    font-size: 19px;
    font-weight: 600;
  }
}
.diag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;

  &__k { color: #8eb8d8; }
  &__v { color: #eaf6ff; font-weight: 700; }
}

/* 能力成长趋势 */
.trend-wrap {
  border-radius: 12px;
  border: 1px solid rgba(0, 184, 255, .14);
  background: linear-gradient(180deg, rgba(0, 40, 78, .28), rgba(0, 20, 48, .2));
  padding: 14px 12px 8px;
}

/* ── 3. 机会雷达 · 成长时间轴 ── */
.opp-timeline__hint {
  margin: 0 0 12px;
  color: #7aa4c0;
  font-size: 18px;
  line-height: 1.4;
}
.opp-timeline {
  overflow: visible;
  padding: 0;
}
.opp-timeline__inner {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  width: 100%;
}
.tl-node {
  position: relative;
  min-width: 0;
}
.tl-card {
  position: relative;
  width: auto;
  min-height: 118px;
  padding: 47px 14px 13px;
  border-radius: 8px;
  background: linear-gradient(165deg, rgba(0, 48, 96, .42), rgba(0, 22, 50, .55));
  border: 1px solid rgba(0, 200, 255, .18);
  box-shadow: inset 0 1px 0 rgba(160, 220, 255, .08);
}
.tl-time {
  position: absolute;
  z-index: 1;
  top: 11px;
  left: 13px;
  display: inline-flex;
  align-items: center;
  margin: 0;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: .03em;
  color: #dbeeff;
  background: rgba(150, 180, 210, .22);
  border: 1px solid rgba(170, 200, 225, .4);
  box-shadow: none;
}

.tl-card__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.tl-item {
  display: flex;
  gap: 9px;
  align-items: flex-start;
}
.tl-item__tag {
  flex-shrink: 0;
  margin-top: 2px;
  padding: 3px 8px;
  border-radius: 7px;
  font-size: 16px;
  font-weight: 800;
  color: #061834;
  background: #7fd4ff;
}
/* 标签仅用蓝/绿两色：上排节点蓝色，下排节点绿色 */
.tl-node--top .tl-item__tag { background: #38bdf8; }
.tl-node--bottom .tl-item__tag { background: #43e7af; }
.tl-item__text { min-width: 0; }
.tl-item__title {
  color: #f2fbff;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
  word-break: break-word;
}
.tl-item__desc {
  margin-top: 2px;
  color: #9ec0dc;
  font-size: 16px;
  line-height: 1.4;
  word-break: break-word;
}
.tl-card__list::-webkit-scrollbar { width: 6px; }
.tl-card__list::-webkit-scrollbar-thumb {
  background: rgba(120, 200, 255, .35);
  border-radius: 6px;
}
.tl-card__list::-webkit-scrollbar-track { background: transparent; }

.opp-timeline::-webkit-scrollbar { width: 8px; height: 8px; }
.opp-timeline::-webkit-scrollbar-thumb {
  background: rgba(120, 200, 255, .4);
  border-radius: 8px;
}
.opp-timeline::-webkit-scrollbar-track { background: transparent; }

.cap-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.cap-compare-chart {
  height: 330px;
  display: block;
  border-radius: 12px;
  border: 1px solid rgba(0, 210, 255, .12);
  background:
    linear-gradient(120deg, rgba(0, 119, 180, .08), transparent 46%),
    rgba(1, 20, 50, .24);
}

.cap-rank-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.cap-rank-card {
  position: relative;
  min-height: 104px;
  overflow: hidden;
  padding: 12px 13px 10px;
  border: 1px solid color-mix(in srgb, var(--cap-color) 30%, transparent);
  border-radius: 10px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--cap-color) 13%, transparent), rgba(2, 25, 58, .52) 62%);
  box-shadow: inset 0 0 20px rgba(0, 160, 230, .04);
  animation: cap-card-in .5s ease both;
  animation-delay: var(--cap-delay);

  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 12px;
    width: 36px;
    height: 2px;
    background: var(--cap-color);
    box-shadow: 0 0 10px var(--cap-color);
  }

  &__head { display: flex; align-items: center; gap: 8px; min-width: 0; }
  &__index {
    color: var(--cap-color);
    font-family: 'DIN Alternate', sans-serif;
    font-size: 14px;
    font-weight: 900;
    opacity: .82;
  }
  &__label { color: #d8eeff; font-size: 17px; font-weight: 800; white-space: nowrap; }
  strong {
    display: inline-block;
    margin: 5px 3px 2px 0;
    color: var(--cap-color);
    font-family: 'DIN Alternate', sans-serif;
    font-size: 30px;
    line-height: 1;
    text-shadow: 0 0 12px color-mix(in srgb, var(--cap-color) 45%, transparent);
  }
  &__unit { color: #739bbd; font-size: 13px; font-weight: 700; }
  &__track { height: 5px; overflow: hidden; border-radius: 999px; background: rgba(90, 134, 177, .22); }
  &__track i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--cap-color);
    box-shadow: 0 0 9px color-mix(in srgb, var(--cap-color) 55%, transparent);
    animation: cap-track-fill .85s ease both;
    animation-delay: var(--cap-delay);
    transform-origin: left center;
  }
  p {
    margin: 6px 0 0;
    overflow: hidden;
    color: #8cb4d3;
    font-size: 13px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@keyframes cap-card-in {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes cap-track-fill {
  from { opacity: .25; transform: scaleX(.08); }
  to { opacity: 1; transform: scaleX(1); }
}
.cap-bar {
  display: grid;
  grid-template-columns: 96px 48px minmax(0, 1fr);
  gap: 10px;
  align-items: center;

  &__label { color: #8eb8d8; font-size: 20px; font-weight: 700; text-align: right; }
  &__value { color: #7ff6ff; font-size: 21px; font-weight: 800; font-variant-numeric: tabular-nums; }
  &__track { height: 12px; border-radius: 99px; overflow: hidden; background: rgba(80, 120, 160, .25); }
  &__fill { height: 100%; border-radius: inherit; transition: width 1.2s ease; }
}

.cap-summary {
  margin: 0 0 14px;
  color: #d8eeff;
  font-size: 20px;
  line-height: 1.65;

  &__tag { color: #7ff6ff; font-weight: 800; margin-right: 4px; }
}
.cap-ability-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.cap-ability {
  padding: 10px 12px 10px 14px;
  border-left: 3px solid;
  border-radius: 0 8px 8px 0;
  background: rgba(0, 30, 60, .28);

  strong { color: #eaf6ff; font-size: 20px; }
  small { float: right; color: #7ff6ff; font-weight: 800; font-size: 20px; }
  p { margin: 4px 0 0; color: #8eb8d8; font-size: 19px; line-height: 1.5; }
  &__dot {
    display: inline-block;
    width: 8px; height: 8px; border-radius: 50%;
    margin-right: 6px; vertical-align: middle;
  }
}

/* ── 4. 风险分析 ── */
.risk-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
}
.risk-explain {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}
.risk-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(0, 30, 60, .28);
  border: 1px solid rgba(120, 224, 255, .55);
  box-shadow: 0 0 0 1px rgba(120, 224, 255, .25) inset,
              0 0 12px rgba(120, 224, 255, .35);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }
  &__name { color: #eaf6ff; font-size: 21px; font-weight: 800; }
  &__val { color: #7fe3ff; font-size: 26px; font-weight: 900; font-variant-numeric: tabular-nums; }
  &__reason { margin: 0 0 4px; color: #cfe6f8; font-size: 20px; line-height: 1.5; }
  &__suggest { margin: 0; color: #8eb8d8; font-size: 20px; line-height: 1.5; }
}

/* ── 5. 成长预测 + 路径模拟 ── */
.forecast-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
  gap: 22px;
}
.forecast-factors {
  margin-top: 12px;
  .tag-row { margin-top: 8px; }
}
.forecast-sim {
  padding: 14px;
  border-radius: 10px;
  background: rgba(0, 26, 54, .35);
  border: 1px solid rgba(0, 200, 255, .14);
}
.sim-btns {
  display: flex;
  gap: 8px;
  margin: 10px 0 16px;
}
.sim-btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, .25);
  background: rgba(0, 30, 60, .3);
  color: #d8eeff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;

  &:hover { border-color: #00e5ff; }
  &.is-active {
    background: rgba(0, 150, 230, .3);
    color: #fff;
    box-shadow: 0 0 12px rgba(0, 200, 255, .35);
    border-color: #00e5ff;
  }
}

/* 发展规划手风琴 */
.path-accordion {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
}
.path-item {
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.18);
  background: rgba(0, 28, 58, 0.45);
  overflow: hidden;
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;

  &.is-active {
    border-color: rgba(0, 200, 255, .48);
    box-shadow:
      0 0 18px rgba(0, 200, 255, .16),
      inset 0 1px 0 rgba(255, 255, 255, 0.05);
  }
}
.path-item__head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 16px 18px;
  border: none;
  background: transparent;
  color: #e8f7ff;
  font-size: 20px;
  font-weight: 750;
  cursor: pointer;
  text-align: left;
  transition: background .2s ease;

  &:hover { background: rgba(0, 60, 110, .32); }
  &.is-active { background: rgba(0, 100, 180, .22); }
}
.path-item__label {
  flex: 0 1 auto;
  min-width: 4.5em;
}
.path-item__match {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 280px;
  margin-left: auto;
}
.path-item__match-label {
  flex: none;
  color: #9ecae8;
  font-size: 15px;
  font-weight: 700;
}
.path-item__bar {
  flex: 1 1 auto;
  min-width: 72px;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(0, 24, 52, 0.75);
  border: 1px solid rgba(102, 217, 255, 0.16);

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #7ef0d0, #55e0ff);
    box-shadow: 0 0 10px rgba(85, 224, 255, 0.35);
  }
}
.path-item__match-val {
  flex: none;
  min-width: 3.2em;
  text-align: right;
  font-size: 17px;
  font-weight: 900;
  font-style: normal;
  color: #7ff6ff;
  font-family: 'DIN Alternate', sans-serif;
}
.path-item__arrow {
  width: 9px;
  height: 9px;
  border-right: 2px solid #8ee9ff;
  border-bottom: 2px solid #8ee9ff;
  transform: rotate(45deg);
  transition: transform .25s ease;
  margin-left: 2px;
  .path-item.is-active & { transform: rotate(-135deg); }
}
.path-item__body {
  padding: 4px 18px 18px;
}
.sim-result {
  &__headline {
    font-size: 26px;
    font-weight: 900;
    color: #7ff6ff;
    margin-bottom: 14px;
    text-align: center;
    text-shadow: 0 0 14px rgba(0, 229, 255, 0.3);
  }
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    background: rgba(0, 24, 52, 0.48);
    border: 1px solid rgba(102, 217, 255, 0.12);
    margin-bottom: 10px;
    span {
      color: #8fbdd8;
      font-size: 16px;
      font-weight: 650;
      flex-shrink: 0;
      min-width: 72px;
    }
    em {
      color: #e8f7ff;
      font-style: normal;
      font-size: 18px;
      font-weight: 700;
      text-align: right;
      line-height: 1.45;
    }
    .hl { color: #55e995; }
  }
  &__suggest {
    margin-top: 4px;
    padding: 12px 14px;
    border-radius: 10px;
    background: linear-gradient(90deg, rgba(0, 80, 140, 0.22), rgba(0, 38, 73, 0.4));
    border: 1px solid rgba(102, 217, 255, 0.18);
    color: #d7ecff;
    font-size: 17px;
    line-height: 1.6;
  }
}
.sim-detail-btn {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 12px 0;
  border-radius: 10px;
  border: 1px solid rgba(102, 217, 255, 0.35);
  background: linear-gradient(90deg, rgba(0, 80, 140, 0.35), rgba(0, 120, 190, 0.28));
  color: #8ee9ff;
  font-size: 18px;
  font-weight: 750;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: rgba(0, 229, 255, 0.6);
    background: rgba(0, 120, 190, .45);
    box-shadow: 0 0 14px rgba(0, 200, 255, .3);
  }
}

/* ── 6. 同专业对标 ── */
.peer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
  align-items: center;
}
.peer-table {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 8px;
  border: 1px solid rgba(0, 205, 255, .13);
  border-radius: 12px;
  background: linear-gradient(145deg, rgba(0, 74, 131, .1), rgba(2, 19, 46, .22));
}
.peer-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 76px 108px 66px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid rgba(102, 217, 255, .08);
  border-radius: 8px;
  background: rgba(0, 34, 70, .24);
  border-bottom: 1px solid rgba(102, 217, 255, .06);
  font-size: 21px;

  span:first-child { color: #cfe6f8; }
  span:nth-child(2) { color: #7ff6ff; font-weight: 800; text-align: center; }
  span:nth-child(3) { color: #facc15; font-weight: 700; text-align: center; }

  &--head {
    border-bottom: 1px solid rgba(102, 217, 255, .15);
    span { color: #7aa4c0; font-size: 19px; font-weight: 700; }
  }
}
.peer-delta {
  justify-self: end;
  min-width: 48px;
  padding: 3px 6px;
  border-radius: 999px;
  text-align: center;
  font-family: 'DIN Alternate', sans-serif;
  font-size: 17px;
  font-weight: 900;
  &.is-positive { color: #52efb2; background: rgba(67, 231, 175, .12); }
  &.is-negative { color: #ffc758; background: rgba(250, 204, 21, .12); }
}
.peer-concl {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* ── 7. AI行动建议 ── */
.action-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.action-col {
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 26, 54, .3);
  border: 1px solid rgba(102, 217, 255, .1);

  &__title {
    margin: 0 0 14px;
    font-size: 22px;
    font-weight: 800;
    padding-left: 10px;
    border-left: 3px solid;

    &--now { color: #ff9a9a; border-color: #ff7474; }
    &--mid { color: #f7d774; border-color: #facc15; }
    &--long { color: #5ff0bd; border-color: #43e7af; }
  }
}
.action-sub {
  padding: 12px 12px 4px;
  margin-bottom: 12px;
  border-radius: 10px;
  background: rgba(0, 40, 80, .28);
  border: 1px solid rgba(102, 217, 255, .08);

  &__title {
    margin: 0 0 4px;
    font-size: 17px;
    font-weight: 800;
    color: #b9e0ff;
    letter-spacing: .02em;
  }
}
.action-list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    color: #d8eeff;
    font-size: 21px;
    line-height: 1.55;
    padding: 10px 0;
    border-bottom: 1px solid rgba(102, 217, 255, .05);

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-top: 6px;
      flex-shrink: 0;
      &--red { background: #ff7474; }
      &--yellow { background: #facc15; }
      &--green { background: #43e7af; }
    }
  }
}

/* ── Loading / Error ── */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 19px;
  color: rgba(184, 236, 255, .7);

  &.error {
    color: #f87171;
    flex-direction: column;
  }

  button {
    padding: 8px 18px;
    border-radius: 6px;
    border: 1px solid rgba(0, 184, 255, .3);
    background: rgba(0, 184, 255, .1);
    color: #55dfff;
    cursor: pointer;
    font-size: 20px;

    &:hover { background: rgba(0, 184, 255, .2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, .1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.fade-enter-active, .fade-leave-active { transition: opacity .25s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* ── Responsive ── */
@media (max-width: 1280px) {
  .cockpit-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .capability-grid { grid-template-columns: 1fr; }
}

@media (max-width: 1080px) {
  .cockpit-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cockpit-judgment { grid-column: 1 / -1; }
  .action-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .action-col:last-child { grid-column: 1 / -1; }
  .opp-timeline__inner { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 760px) {
  .cockpit-grid,
  .action-grid,
  .opp-timeline__inner { grid-template-columns: 1fr; }
  .cockpit-judgment,
  .action-col:last-child { grid-column: auto; }
  .ai-decision__signals { grid-template-columns: 1fr; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes ring-breathe {
  0%, 100% { opacity: 0.55; transform: scale(1); }
  50% { opacity: 0.95; transform: scale(1.04); }
}
@keyframes dim-rise {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes bar-grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
</style>
