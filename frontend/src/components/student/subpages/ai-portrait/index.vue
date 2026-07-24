<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

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

const clamp = (v: number, min = 0, max = 100) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return min
  return Math.max(min, Math.min(max, Math.round(n)))
}
const stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n)

/* ════════════ 1. 学生发展驾驶舱 ════════════ */
const profile = computed(() => {
  const p = dashboard.value?.profile
  if (!p) return { name: '—', major: '—', grade: '—' }
  return { name: p.name, major: p.major || '软件工程', grade: p.grade || '2022级' }
})

const academicScore = computed(() => clamp((dashboard.value?.academic.gpa ?? 3) / 4 * 100))
const employmentScore = computed(() => clamp(dashboard.value?.employment.jobReadiness ?? 70))
const qualityScore = computed(() => clamp(dashboard.value?.quality.score ?? 80))
const competitionScore = computed(() => clamp((dashboard.value?.competition.awardCount ?? 0) * 20 + 30))

const abilities = computed(() => {
  const d = dashboard.value
  if (!d) return []
  return [
    { key: 'academic', label: '学业能力', value: academicScore.value, color: '#43e7af',
      detail: `GPA ${d.academic.gpa ?? '—'} · 专业排名 ${d.academic.majorRank}/${d.academic.majorTotal}` },
    { key: 'major', label: '专业能力', value: clamp(academicScore.value + 5), color: '#38bdf8',
      detail: d.academic.majorTotal ? `专业前 ${Math.round(d.academic.majorRank / d.academic.majorTotal * 100)}%` : '专业能力突出' },
    { key: 'practice', label: '实践能力', value: clamp(employmentScore.value * 0.9 + 10), color: '#facc15',
      detail: `项目 ${d.internship.projectCount} 项 · 实习 ${d.internship.internshipCount} 次` },
    { key: 'career', label: '求职能力', value: employmentScore.value, color: '#c084fc',
      detail: `就业准备度 ${d.employment.jobReadiness ?? '—'}` },
    { key: 'quality', label: '综合素养', value: qualityScore.value, color: '#f472b6',
      detail: `干部 ${d.quality.cadreRoles.length} · 志愿 ${d.quality.volunteerHours}h` },
  ]
})

const compositeScore = computed(() => {
  const arr = abilities.value
  if (!arr.length) return { score: 0, level: '—' }
  const avg = Math.round(arr.reduce((s, a) => s + a.value, 0) / arr.length)
  return { score: avg, level: avg >= 90 ? '优秀' : avg >= 75 ? '良好' : '待提升' }
})

const selectedAbility = ref<string | null>(null)
const selectedAbilityInfo = computed(() => abilities.value.find(a => a.key === selectedAbility.value) || null)

/* 环形仪表颜色 */
const ringScoreColor = computed(() => {
  const s = compositeScore.value.score
  return s >= 88 ? '#43e7af' : s >= 70 ? '#38bdf8' : '#fbbf24'
})

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
    ...(d.careerDev.careerDirections || []),
    d.aiAssistant.recommendedDirection,
  ].filter(Boolean) as string[]
  return { stage: st.label, stageStars: st.stars, strengths, weaknesses, directions }
})

/* AI判断依据 */
const aiJudgment = computed(() => {
  const d = dashboard.value
  if (!d) return { status: '—', confidence: 0, basis: [], sources: [] }
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
  const confidence = clamp(86 + (gpa - 3) * 12)
  const sources: string[] = []
  if (gpa) sources.push('GPA')
  if (d.competition.awardCount) sources.push('竞赛')
  if (d.internship.projectCount) sources.push('项目')
  if (d.internship.certificateCount) sources.push('证书')
  if (jobReady) sources.push('就业记录')
  return { status, confidence, basis, sources }
})

/* ── 驾驶舱增强数据（发展阶段 / 排名 / 学生类型 / AI决策摘要）── */
const rankPercent = computed(() => {
  const tot = dashboard.value?.academic.majorTotal
  const rk = dashboard.value?.academic.majorRank
  if (!tot || !rk) return 0
  return clamp((rk / tot) * 100)
})
const exceedPercent = computed(() => 100 - rankPercent.value)

const studentType = computed(() => {
  const arr = abilities.value
  if (!arr.length) return { icon: '🎓', label: '综合发展型' }
  const top = [...arr].sort((a, b) => b.value - a.value)[0]
  const map: Record<string, { icon: string; label: string }> = {
    major: { icon: '🚀', label: '技术成长型' },
    academic: { icon: '📚', label: '学术潜力型' },
    quality: { icon: '🌟', label: '综合素养型' },
    practice: { icon: '🛠️', label: '实践进取型' },
    career: { icon: '💼', label: '就业导向型' },
  }
  return map[top.key] || { icon: '🎓', label: '综合发展型' }
})

/* 雷达图用的专业平均线 */
const abilitiesAvg = computed(() =>
  abilities.value.map(a => ({ ...a, value: clamp(a.value * 0.8) })),
)

/* 右侧 AI 决策摘要（不展示能力评分，改为结论式） */
const aiDecision = computed(() => {
  const d = dashboard.value
  if (!d) return { status: '—', advantage: '—', risk: '—', action: '—', confidence: 0, sources: [] as string[] }
  const top = [...abilities.value].sort((a, b) => b.value - a.value)[0]
  const advantage = `${top.label} > 同专业 ${exceedPercent.value}% 学生`
  const sortedRisk = [...riskDims.value].sort((a, b) => b.value - a.value)
  const mainRisk = sortedRisk[0]?.reason ?? '暂无显著风险'
  const action =
    d.aiAssistant.shortTermSuggestions?.[0] ||
    (studentPortrait.value.weaknesses[0] ? `未来3个月补强：${studentPortrait.value.weaknesses[0]}` : '保持当前发展节奏')
  const recommendations = [
    action,
    `围绕最强项「${top.label}」制定纵深发展计划，形成个人优势标签`,
    d.internship.projectCount < 5
      ? '3 个月内新增 1–2 个企业级项目，丰富作品集与简历亮点'
      : '持续提升项目质量，争取行业竞赛或科研成果产出',
    '结合目标岗位 JD，补强缺失能力并完善求职材料',
    '保持 GPA 与核心课程稳定，按节奏推进升学 / 就业目标',
  ]
  return {
    status: aiJudgment.value.status,
    advantage,
    risk: mainRisk,
    action,
    recommendations,
    confidence: aiJudgment.value.confidence,
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

/* 能力成长趋势（新增模块） */
const trendCats = ['大一', '大二', '大三', '当前']
function trendLine(end: number, startRatio: number): number[] {
  const e = clamp(end)
  const s = e * startRatio
  return [Math.round(s), Math.round(s + (e - s) * 0.5), Math.round(s + (e - s) * 0.85), e]
}
const growthTrend = computed(() => {
  const d = dashboard.value
  if (!d) return { gpa: [] as number[], cert: [] as number[], proj: [] as number[] }
  return {
    gpa: trendLine(academicScore.value, 0.8),
    cert: trendLine(clamp(d.internship.certificateCount * 25 + 30), 0.4),
    proj: trendLine(clamp(d.internship.projectCount * 20 + 30), 0.35),
  }
})
const growthTrendOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  legend: { data: ['GPA', '技能证书', '项目经历'], textStyle: { color: '#cfe6f8' }, top: 0 },
  grid: { left: '10%', right: '6%', top: 36, bottom: 30 },
  xAxis: {
    type: 'category',
    data: trendCats,
    axisLabel: { color: '#8eb8d8', fontSize: 12 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,.2)' } },
  },
  yAxis: {
    type: 'value', min: 0, max: 100,
    axisLabel: { color: '#889ec2', fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,.2)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,.06)' } },
  },
  series: [
    { name: 'GPA', type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, data: growthTrend.value.gpa, lineStyle: { color: '#38bdf8', width: 2.5 }, itemStyle: { color: '#38bdf8' }, areaStyle: { color: 'rgba(56,189,248,.15)' } },
    { name: '技能证书', type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, data: growthTrend.value.cert, lineStyle: { color: '#43e7af', width: 2.5 }, itemStyle: { color: '#43e7af' } },
    { name: '项目经历', type: 'line', smooth: true, symbol: 'circle', symbolSize: 7, data: growthTrend.value.proj, lineStyle: { color: '#facc15', width: 2.5 }, itemStyle: { color: '#facc15' } },
  ],
}))

/* ════════════ 2. 能力画像分析 ════════════ */
const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  legend: { data: ['本人', '专业平均'], textStyle: { color: '#cfe6f8' }, top: 0, right: 0 },
  radar: {
    center: ['50%', '54%'],
    radius: '64%',
    indicator: abilities.value.map(a => ({ name: a.label, max: 100 })),
    axisName: { color: '#8eb8d8', fontSize: 12 },
    shape: 'polygon',
    splitNumber: 4,
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.15)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.1)' } },
    splitArea: { areaStyle: { color: ['rgba(0,100,180,0.05)', 'rgba(0,60,120,0.08)'] } },
  },
  series: [{
    type: 'radar',
    data: [
      {
        value: abilitiesAvg.value.map(a => a.value),
        name: '专业平均',
        areaStyle: { color: 'rgba(250,204,21,0.12)' },
        lineStyle: { color: '#facc15', width: 2, type: 'dashed' },
        itemStyle: { color: '#facc15' },
      },
      {
        value: abilities.value.map(a => a.value),
        name: '本人',
        areaStyle: { color: 'rgba(0,229,255,0.2)' },
        lineStyle: { color: '#00e5ff', width: 2 },
        itemStyle: { color: '#00e5ff' },
      },
    ],
    symbol: 'circle',
    symbolSize: 6,
  }],
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
const opportunities = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const pc = d.internship.projectCount
  return [
    { id: 'project', name: '项目补强', icon: '🔴', color: '#ff7474', match: clamp(88 - pc * 3), value: 82, urgency: 30, recommend: 92, starN: 5,
      current: `项目经历 ${pc} 项`, avg: '同专业优秀学生平均 5.3 项', gap: `+${Math.max(1, 5 - pc)} 项`,
      resources: ['校级创新项目', '开源项目贡献', '企业实训'],
      improve: [{ label: '实践能力', from: 90, to: 95 }, { label: '就业竞争力', from: 89, to: 94 }] },
    { id: 'intern', name: '企业实习', icon: '🟡', color: '#facc15', match: 76, value: 88, urgency: 26, recommend: 85, starN: 4,
      current: `实习经历 ${d.internship.internshipCount} 次`, avg: '目标 1 段企业实习', gap: '+1 段',
      resources: ['校企合作基地', '暑期实训', '名企开放日'],
      improve: [{ label: '就业准备', from: 70, to: 85 }, { label: '专业技能', from: 89, to: 93 }] },
    { id: 'cert', name: '技能认证', icon: '🔵', color: '#38bdf8', match: 70, value: 72, urgency: 20, recommend: 78, starN: 4,
      current: `证书 ${d.internship.certificateCount} 项`, avg: '行业主流认证 2 项', gap: '+1 项',
      resources: ['软考中级', '云架构认证', '英语证书'],
      improve: [{ label: '专业能力', from: 89, to: 92 }, { label: '就业竞争力', from: 89, to: 91 }] },
    { id: 'postgrad', name: '考研冲刺', icon: '🟢', color: '#43e7af', match: 82, value: 78, urgency: 24, recommend: 88, starN: 5,
      current: `目标院校 ${d.careerDev.targetUniversities?.[0] || '待定'}`, avg: '专业前 20%', gap: '冲刺 985/211',
      resources: ['数学强化', '专业课复习', '导师联络'],
      improve: [{ label: '学业能力', from: 84, to: 90 }, { label: '研究能力', from: 70, to: 85 }] },
  ]
})

const selectedOpportunityId = ref<string | null>(null)
const selectedOpportunity = computed(() => {
  const list = opportunities.value
  if (!list.length) return null
  return list.find(o => o.id === selectedOpportunityId.value) || list[0]
})
function onOpportunityClick(params: unknown) {
  const name = (params as { name?: string })?.name
  const opp = opportunities.value.find(o => o.name === name)
  if (opp) selectedOpportunityId.value = opp.id
}

const opportunityMapOption = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (p: any) => `${p.data.name}<br/>匹配度 ${p.data.value[0]}<br/>收益价值 ${p.data.value[1]}`,
  },
  grid: { left: '11%', right: '6%', top: 22, bottom: 40 },
  xAxis: {
    name: '匹配度', min: 0, max: 100, nameLocation: 'center', nameGap: 26,
    nameTextStyle: { color: '#8eb8d8', fontSize: 12 },
    axisLabel: { color: '#889ec2', fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.06)' } },
  },
  yAxis: {
    name: '收益价值', min: 0, max: 100, nameLocation: 'center', nameGap: 30,
    nameTextStyle: { color: '#8eb8d8', fontSize: 12 },
    axisLabel: { color: '#889ec2', fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.06)' } },
  },
  series: [{
    type: 'scatter',
    data: opportunities.value.map(o => ({
      name: o.name,
      value: [o.match, o.value],
      symbolSize: o.urgency,
      itemStyle: { color: o.color, opacity: 0.85, borderColor: '#fff', borderWidth: 1 },
      label: { show: true, formatter: '{b}', color: '#dff6ff', fontSize: 11, position: 'top' },
    })),
    markArea: {
      silent: true,
      data: [
        [{ xAxis: 50, yAxis: 50, itemStyle: { color: 'rgba(67,231,175,0.05)' } }, { xAxis: 100, yAxis: 100 }],
        [{ xAxis: 0, yAxis: 50, itemStyle: { color: 'rgba(250,204,21,0.04)' } }, { xAxis: 50, yAxis: 100 }],
        [{ xAxis: 50, yAxis: 0, itemStyle: { color: 'rgba(56,189,248,0.04)' } }, { xAxis: 100, yAxis: 50 }],
        [{ xAxis: 0, yAxis: 0, itemStyle: { color: 'rgba(255,116,116,0.04)' } }, { xAxis: 50, yAxis: 50 }],
      ],
    },
  }, {
    type: 'scatter',
    symbol: 'pin',
    symbolSize: 18,
    data: [{ value: [50, 50], name: '当前学生', itemStyle: { color: '#ffffff' } }],
    label: { show: true, formatter: '当前', position: 'bottom', color: '#ffffff', fontSize: 10 },
  }],
}))

/* ════════════ 4. 学生成长风险雷达 ════════════ */
const riskDims = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const gpa = d.academic.gpa ?? 3
  const jobReady = d.employment.jobReadiness ?? 70
  const mental = d.health.mentalHealth ?? 70
  return [
    { key: 'academic', label: '学业风险', value: clamp((4 - gpa) * 22), color: '#ff7474',
      reason: gpa < 2.5 ? '存在不及格课程风险' : '成绩波动需保持稳定', suggest: '保持 GPA 稳定，关注核心课程' },
    { key: 'career', label: '就业风险', value: clamp(100 - jobReady), color: '#facc15',
      reason: '项目数量低于专业平均约 35%', suggest: '3 个月内完成 1 项企业项目' },
    { key: 'mental', label: '心理风险', value: clamp(100 - mental), color: '#38bdf8',
      reason: '近期压力指数相对偏高', suggest: '定期开展谈心谈话' },
    { key: 'skill', label: '技能风险', value: clamp(100 - competitionScore.value), color: '#c084fc',
      reason: '竞赛科研积累仍显不足', suggest: '参与 1 项学科竞赛或科研' },
    { key: 'plan', label: '规划风险', value: clamp(65 - (d.careerDev.targetUniversities?.length ? 25 : 0)), color: '#f472b6',
      reason: d.careerDev.targetUniversities?.length ? '发展方向已初步明确' : '发展方向尚不清晰', suggest: '尽快明确升学 / 就业目标' },
  ]
})

const riskRadarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '52%'],
    radius: '66%',
    indicator: riskDims.value.map(r => ({ name: r.label, max: 100 })),
    axisName: { color: '#8eb8d8', fontSize: 12 },
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

/* ════════════ 5. AI成长预测 + 路径模拟 ════════════ */
const growthForecast = computed(() => {
  const base = compositeScore.value.score
  return [
    { label: '当前', value: base },
    { label: '半年', value: clamp(base + 3) },
    { label: '一年', value: clamp(base + 6) },
    { label: '毕业', value: clamp(base + 7) },
  ]
})
const forecastFactors = ['+项目经历', '+企业实习', '+竞赛科研']
const growthForecastOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: '12%', right: '8%', top: 30, bottom: 36 },
  xAxis: {
    type: 'category',
    data: growthForecast.value.map(p => p.label),
    axisLabel: { color: '#8eb8d8', fontSize: 12 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
  },
  yAxis: {
    type: 'value', min: 60, max: 100,
    axisLabel: { color: '#889ec2', fontSize: 11 },
    axisLine: { lineStyle: { color: 'rgba(102,217,255,0.2)' } },
    splitLine: { lineStyle: { color: 'rgba(102,217,255,0.06)' } },
  },
  series: [{
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 9,
    data: growthForecast.value.map(p => p.value),
    lineStyle: { color: '#00e5ff', width: 3 },
    itemStyle: { color: '#00e5ff' },
    label: { show: true, color: '#7ff6ff', fontSize: 12, formatter: '{c}' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(0,229,255,0.32)' },
          { offset: 1, color: 'rgba(0,229,255,0.02)' },
        ],
      },
    },
  }],
}))

const simPath = ref<'postgrad' | 'job' | 'civil'>('postgrad')
const pathOptions = [
  { key: 'postgrad' as const, label: '继续考研' },
  { key: 'job' as const, label: '直接就业' },
  { key: 'civil' as const, label: '考公' },
]
/* 各方向匹配度（占比代理），用于默认优先展示占比最高的方向 */
const pathScore = (key: 'postgrad' | 'job' | 'civil'): number => {
  const gpa = dashboard.value?.academic.gpa ?? 3
  const jobReady = dashboard.value?.employment.jobReadiness ?? 70
  if (key === 'postgrad') return clamp(60 + (gpa - 3) * 30)
  if (key === 'job') return clamp(jobReady + 5)
  return 68
}
/* 占比最高的方向优先默认展示（数据加载后仅应用一次） */
const priorityPath = computed<'postgrad' | 'job' | 'civil'>(() => {
  const ranked = [...pathOptions].sort((a, b) => pathScore(b.key) - pathScore(a.key))
  return ranked[0].key
})
let priorityApplied = false
watch(
  () => dashboard.value,
  (val) => {
    if (!priorityApplied && val) {
      simPath.value = priorityPath.value
      priorityApplied = true
    }
  },
)
const pathResult = computed(() => {
  if (simPath.value === 'postgrad') {
    return {
      type: 'postgrad',
      headline: `成功概率 ${pathScore('postgrad')}%`,
      strengths: ['GPA 较高', '专业基础扎实'],
      weakness: '数学模块需补强',
      suggest: '补强数学课程 · 准备目标院校',
    }
  }
  if (simPath.value === 'job') {
    return {
      type: 'job',
      headline: `岗位匹配 ${pathScore('job')}%`,
      roles: ['Java开发', '后端工程师'],
      salary: '12–18K',
      strengths: ['专业技能突出'],
      weakness: '企业实践不足',
    }
  }
  return {
    type: 'civil',
    headline: `匹配度 ${pathScore('civil')}%`,
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
  legend: { data: ['本人', '专业TOP20%'], textStyle: { color: '#cfe6f8' }, top: 0, right: 0 },
  radar: {
    center: ['50%', '56%'],
    radius: '66%',
    indicator: peerDims.value.map(d => ({ name: d.name, max: 100 })),
    axisName: { color: '#8eb8d8', fontSize: 12 },
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
const actionPlan = computed(() => {
  const d = dashboard.value
  if (!d) return { recent: [], mid: [], long: [] }
  return {
    recent: (d.aiPortrait.coachingTasks || []).slice(0, 3).map(t => t.title),
    mid: d.aiAssistant.shortTermSuggestions || [],
    long: d.aiAssistant.longTermSuggestions || [],
  }
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="智能育航 · 深度分析"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回学生发展概览"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="ai-deep">
      <!-- ═══════ 1. 学生发展驾驶舱 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">学生发展驾驶舱</h3>
        <div class="cockpit-grid">
          <!-- 左：综合发展指数 -->
          <div class="cockpit-left">
            <h4 class="panel-label">综合发展指数</h4>
            <div class="cockpit-ring-score">
              <svg class="ring-svg" viewBox="0 0 120 120">
                <circle class="ring-svg__bg" cx="60" cy="60" r="50" />
                <circle
                  class="ring-svg__fill"
                  cx="60" cy="60" r="50"
                  :stroke="ringScoreColor"
                  :stroke-dashoffset="314 - 314 * compositeScore.score / 100"
                />
              </svg>
              <div class="ring-svg__center">
                <div class="ring-svg__score">{{ compositeScore.score }}</div>
                <div class="ring-svg__level" :style="{ color: ringScoreColor }">{{ compositeScore.level }}</div>
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
                  <div class="stage-progress__fill" :style="{ width: compositeScore.score + '%' }" />
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

          <!-- 中：AI学生画像 -->
          <div class="cockpit-portrait">
            <h4 class="panel-label">AI 学生画像</h4>
            <div class="portrait-card">
              <div class="portrait-card__head">
                <div class="portrait-name">{{ profile.name }}</div>
                <div class="portrait-meta">{{ profile.major }} · {{ profile.grade }}</div>
              </div>
              <div class="portrait-type">
                <span class="portrait-type__icon">{{ studentType.icon }}</span>
                <span class="portrait-type__label">{{ studentType.label }}</span>
              </div>
              <div class="portrait-section">
                <div class="portrait-section__title portrait-section__title--good">优势</div>
                <div class="tag-row">
                  <span v-for="s in studentPortrait.strengths" :key="s" class="tag tag--good">{{ s }}</span>
                </div>
              </div>
              <div class="portrait-section">
                <div class="portrait-section__title portrait-section__title--warn">待提升</div>
                <div class="tag-row">
                  <span v-for="w in studentPortrait.weaknesses" :key="w" class="tag tag--warn">{{ w }}</span>
                </div>
              </div>
              <div class="portrait-section">
                <div class="portrait-section__title">发展路线</div>
                <div class="route-row">
                  <template v-for="(dir, i) in studentPortrait.directions" :key="dir">
                    <span class="route-item">{{ dir }}</span>
                    <span v-if="i < studentPortrait.directions.length - 1" class="route-arrow">↓</span>
                  </template>
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
              <div class="ai-decision__block">
                <div class="ai-decision__label">核心优势</div>
                <div class="ai-decision__text">{{ aiDecision.advantage }}</div>
              </div>
              <div class="ai-decision__block">
                <div class="ai-decision__label">主要风险</div>
                <div class="ai-decision__text">{{ aiDecision.risk }}</div>
              </div>
              <div class="ai-decision__block">
                <div class="ai-decision__label">推荐动作</div>
                <ul class="ai-decision__list">
                  <li v-for="(r, i) in aiDecision.recommendations" :key="i">{{ r }}</li>
                </ul>
              </div>
              <div class="ai-decision__confidence">
                <span>AI 可信度</span>
                <strong>{{ aiDecision.confidence }}%</strong>
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

      <!-- ═══════ 2. 能力画像分析 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">能力画像分析</h3>
        <div class="capability-grid">
          <!-- 左：能力雷达（本人 vs 专业平均） -->
          <div class="cap-cell">
            <div class="cap-cell__title">能力雷达（本人 vs 专业平均）</div>
            <ChartContainer :option="radarOption" style="height:300px" />
          </div>
          <!-- 右：能力指数排行 -->
          <div class="cap-cell">
            <div class="cap-cell__title">能力指数排行</div>
            <div class="cap-bars">
              <div v-for="b in capabilityBars" :key="b.key" class="cap-bar">
                <span class="cap-bar__label">{{ b.label }}</span>
                <span class="cap-bar__value">{{ b.value }}</span>
                <div class="cap-bar__track">
                  <div class="cap-bar__fill" :style="{ width: b.value + '%', background: 'linear-gradient(90deg, #1d6fb8, #38bdf8)' }" />
                </div>
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
      <section class="deep-card">
        <h3 class="deep-card__title">能力成长趋势</h3>
        <div class="trend-wrap">
          <ChartContainer :option="growthTrendOption" style="height:280px" />
        </div>
      </section>

      <!-- ═══════ 3. AI机会雷达 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">AI 机会雷达</h3>
        <div class="oppo-grid">
          <div class="oppo-map">
            <div class="oppo-map__head">
              <div class="cap-cell__title">机会分布图</div>
              <div class="oppo-chips">
                <button
                  v-for="o in opportunities"
                  :key="o.id"
                  type="button"
                  class="oppo-chip"
                  :class="{ 'is-active': selectedOpportunity?.id === o.id }"
                  :style="{ '--c': o.color }"
                  @click="selectedOpportunityId = o.id"
                >
                  {{ o.icon }} {{ o.name }}
                </button>
              </div>
            </div>
            <ChartContainer
              :option="opportunityMapOption"
              style="height:300px"
              @chart-click="onOpportunityClick"
            />
          </div>
          <div v-if="selectedOpportunity" class="oppo-detail">
            <div class="oppo-detail__head">
              <span class="oppo-detail__icon" :style="{ color: selectedOpportunity.color }">
                {{ selectedOpportunity.icon }}
              </span>
              <div>
                <h4 class="oppo-detail__name">{{ selectedOpportunity.name }}机会</h4>
                <div class="oppo-detail__reco">
                  推荐指数 {{ stars(selectedOpportunity.starN) }}
                  <strong>{{ selectedOpportunity.recommend }}%</strong>
                </div>
              </div>
            </div>
            <div class="oppo-compare">
              <div class="oppo-compare__row"><span>当前</span><em>{{ selectedOpportunity.current }}</em></div>
              <div class="oppo-compare__row"><span>同专业优秀学生</span><em>{{ selectedOpportunity.avg }}</em></div>
              <div class="oppo-compare__row"><span>提升空间</span><em class="hl">{{ selectedOpportunity.gap }}</em></div>
            </div>
            <div class="oppo-block">
              <div class="oppo-block__title">推荐资源</div>
              <ul class="oppo-res">
                <li v-for="(r, i) in selectedOpportunity.resources" :key="r">{{ i + 1 }}. {{ r }}</li>
              </ul>
            </div>
            <div class="oppo-block">
              <div class="oppo-block__title">预计提升</div>
              <div class="oppo-improve">
                <span v-for="im in selectedOpportunity.improve" :key="im.label" class="oppo-improve__item">
                  {{ im.label }} <b>{{ im.from }}</b> → <b class="hl">{{ im.to }}</b>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 4. 学生成长风险雷达 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">学生成长风险雷达</h3>
        <div class="risk-grid">
          <div class="risk-chart">
            <ChartContainer :option="riskRadarOption" style="height:300px" />
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

      <!-- ═══════ 5. AI成长预测 + 路径模拟 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">AI 成长预测</h3>
        <div class="forecast-grid">
          <div class="forecast-chart">
            <div class="cap-cell__title">未来趋势曲线</div>
            <ChartContainer :option="growthForecastOption" style="height:260px" />
            <div class="forecast-factors">
              <span class="cap-cell__title">关键影响因素</span>
              <div class="tag-row">
                <span v-for="f in forecastFactors" :key="f" class="tag tag--dir">{{ f }}</span>
              </div>
            </div>
          </div>
          <div class="forecast-sim">
            <div class="cap-cell__title">学生发展路径规划</div>
            <div class="sim-btns">
              <button
                v-for="opt in pathOptions"
                :key="opt.key"
                type="button"
                class="sim-btn"
                :class="{ 'is-active': simPath === opt.key }"
                @click="simPath = opt.key"
              >
                {{ opt.label }}
              </button>
            </div>
            <div class="sim-result">
              <div class="sim-result__headline">{{ pathResult.headline }}</div>
              <template v-if="pathResult.type === 'job'">
                <div class="sim-result__row"><span>推荐岗位</span><em>{{ pathResult.roles.join(' / ') }}</em></div>
                <div class="sim-result__row"><span>预计薪资</span><em class="hl">{{ pathResult.salary }}</em></div>
              </template>
              <div class="sim-result__row"><span>优势</span><em>{{ pathResult.strengths.join('、') }}</em></div>
              <div class="sim-result__row"><span>短板</span><em>{{ pathResult.weakness }}</em></div>
              <div v-if="pathResult.suggest" class="sim-result__suggest">建议：{{ pathResult.suggest }}</div>
              <button type="button" class="sim-detail-btn" @click="goCareerPath(simPath)">查看{{ currentPathLabel }}详情 ›</button>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 6. 同专业成长比较 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">同专业成长比较</h3>
        <div class="peer-grid">
          <div class="peer-chart">
            <ChartContainer :option="peerCompareOption" style="height:300px" />
          </div>
          <div class="peer-table">
            <div class="peer-row peer-row--head">
              <span>维度</span><span>本人</span><span>专业TOP20%</span>
            </div>
            <div v-for="d in peerDims" :key="d.name" class="peer-row">
              <span>{{ d.name }}</span>
              <span class="hl">{{ d.self }}</span>
              <span>{{ d.top }}</span>
            </div>
            <div class="peer-concl">
              <span class="tag tag--good">竞赛领先</span>
              <span class="tag tag--warn">项目不足</span>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 7. AI行动建议 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">AI 行动建议</h3>
        <div class="action-grid">
          <div class="action-col">
            <h4 class="action-col__title action-col__title--now">近期任务</h4>
            <ul class="action-list">
              <li v-for="t in actionPlan.recent" :key="t"><i class="dot dot--red" />{{ t }}</li>
            </ul>
          </div>
          <div class="action-col">
            <h4 class="action-col__title action-col__title--mid">中期任务</h4>
            <ul class="action-list">
              <li v-for="t in actionPlan.mid" :key="t"><i class="dot dot--yellow" />{{ t }}</li>
            </ul>
          </div>
          <div class="action-col">
            <h4 class="action-col__title action-col__title--long">长期目标</h4>
            <ul class="action-list">
              <li v-for="t in actionPlan.long" :key="t"><i class="dot dot--green" />{{ t }}</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
/* ── 通用卡片 ── */
.deep-card {
  padding: 18px 20px;
  border-radius: 6px;
  background: linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)), rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
  animation: fadeUp 0.45s ease-out both;

  &:nth-child(1) { animation-delay: .02s; }
  &:nth-child(2) { animation-delay: .06s; }
  &:nth-child(3) { animation-delay: .10s; }
  &:nth-child(4) { animation-delay: .14s; }
  &:nth-child(5) { animation-delay: .18s; }
  &:nth-child(6) { animation-delay: .22s; }
  &:nth-child(7) { animation-delay: .26s; }
}

.ai-deep {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 28px;
}

.deep-card__title {
  margin: 0 0 16px;
  font-size: 22px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: .04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 4px;
    height: 17px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, .45);
  }
}

.panel-label {
  margin: 0 0 12px;
  font-size: 19px;
  font-weight: 700;
  color: #6cdfff;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 200, 255, .12);
}

.cap-cell__title {
  font-size: 18px;
  font-weight: 700;
  color: #8eb8d8;
  margin-bottom: 10px;
  letter-spacing: .03em;
}

/* ── 1. 驾驶舱 ── */
.cockpit-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr) minmax(0, 1.1fr);
  gap: 18px;
  align-items: start;
}

/* 三栏统一为面板卡片，视觉层级一致、顶端对齐 */
.cockpit-left,
.cockpit-portrait,
.cockpit-judgment {
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-radius: 12px;
  background: linear-gradient(160deg, rgba(0, 96, 186, .14), rgba(4, 16, 44, .5));
  border: 1px solid rgba(0, 206, 255, .2);
  box-shadow: inset 0 0 20px rgba(0, 184, 255, .05);
}

.cockpit-left {
  justify-content: flex-start;
  padding-top: 10px;
}

/* 环形仪表（主环，SVG 渲染，中心数字 + 等级） */
.cockpit-ring-score {
  position: relative;
  width: 160px;
  height: 160px;
  margin: -2px auto 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);

  &__bg {
    fill: none;
    stroke: rgba(120, 160, 200, .15);
    stroke-width: 10;
    stroke-linecap: round;
  }
  &__fill {
    fill: none;
    stroke-width: 10;
    stroke-linecap: round;
    stroke-dasharray: 314;
    transition: stroke-dashoffset .8s ease;
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
    font-size: 36px;
    font-weight: 800;
    color: #fff;
    line-height: 1;
  }
  &__level {
    font-size: 15px;
    font-weight: 700;
    margin-top: 4px;
  }
}

.stage-block {
  margin-top: 12px;
  padding: 14px;
  border-radius: 10px;
  background: rgba(0, 30, 60, .28);
  border: 1px solid rgba(0, 184, 255, .12);

  &__label { color: #7aa4c0; font-size: 16px; margin-bottom: 6px; }
  &__stage { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
  &__stars { color: #facc15; font-size: 20px; letter-spacing: 2px; }
  &__text { color: #7ff6ff; font-size: 19px; font-weight: 700; }
}

.stage-progress {
  margin-bottom: 12px;

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-size: 16px;
    color: #8eb8d8;
    margin-bottom: 6px;

    em { color: #7ff6ff; font-weight: 800; font-style: normal; font-size: 19px; }
  }
  &__bar {
    height: 11px;
    border-radius: 999px;
    overflow: hidden;
    background: rgba(80, 120, 160, .25);
  }
  &__fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #43e7af, #38bdf8);
  }
}

.stage-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.stage-stat {
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 30, 60, .3);
  border: 1px solid rgba(102, 217, 255, .1);

  &__label { display: block; color: #7aa4c0; font-size: 15px; margin-bottom: 4px; }
  &__value { color: #7ff6ff; font-size: 22px; font-weight: 800; }
}

.ability-break {
  margin-top: 8px;

  &__hint {
    font-size: 15px;
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
    font-size: 16px;
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
  font-size: 16px;
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

  &__icon { font-size: 22px; }
  &__label { color: #8ef6ff; font-size: 18px; font-weight: 800; }
}

.portrait-section {
  &__title {
    font-size: 16px;
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
  font-size: 15px;
  font-weight: 700;
}
.route-arrow { color: #6cdfff; font-size: 18px; font-weight: 800; }

.portrait-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.portrait-name {
  font-size: 26px;
  font-weight: 900;
  color: #f6fbff;
  text-shadow: 0 0 14px rgba(0, 242, 255, .28);
}
.portrait-meta { color: #8eb8d8; font-size: 17px; }

.portrait-stage {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;

  &__label { color: #7aa4c0; font-size: 12px; }
  &__stars { color: #facc15; font-size: 15px; letter-spacing: 2px; }
  &__text { color: #7ff6ff; font-size: 14px; font-weight: 700; }
}

.portrait-block {
  margin-bottom: 12px;

  &__title {
    font-size: 14px;
    font-weight: 700;
    color: #7aa4c0;
    margin-bottom: 7px;

    &--good { color: #43e7af; }
    &--warn { color: #facc15; }
  }
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 4px 11px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  border: 1px solid transparent;

  &--good { background: rgba(67, 231, 175, .14); color: #5ff0bd; border-color: rgba(67, 231, 175, .3); }
  &--warn { background: rgba(250, 204, 21, .14); color: #f7d774; border-color: rgba(250, 204, 21, .3); }
  &--dir { background: rgba(0, 180, 255, .14); color: #6cdfff; border-color: rgba(0, 200, 255, .3); }
  &--src { background: rgba(120, 132, 255, .14); color: #a8b4ff; border-color: rgba(120, 132, 255, .3); }
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
    padding: 10px;
    border-radius: 8px;
    background: rgba(0, 30, 60, .3);
    border: 1px solid rgba(102, 217, 255, .1);
    text-align: center;
  }
  &__label { display: block; color: #7aa4c0; font-size: 11px; margin-bottom: 4px; }
  &__value { color: #7ff6ff; font-size: 18px; font-weight: 800; }
}

.judge-basis {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__label { color: #cfe6f8; font-size: 13px; }
  &__stars { color: #facc15; font-size: 13px; letter-spacing: 1px; }
}

.judge-source {
  &__label { display: block; color: #7aa4c0; font-size: 14px; font-weight: 700; margin-bottom: 8px; }
}

.ai-decision {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 30, 60, .3);
    border: 1px solid rgba(102, 217, 255, .1);
  }
  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    flex-shrink: 0;

    &.is-good { background: #43e7af; box-shadow: 0 0 10px rgba(67, 231, 175, .6); }
    &.is-warn { background: #facc15; box-shadow: 0 0 10px rgba(250, 204, 21, .6); }
  }
  &__row-label { color: #7aa4c0; font-size: 13px; }
  &__status-text { color: #7ff6ff; font-size: 18px; font-weight: 800; }

  &__block {
    padding: 11px 13px;
    border-radius: 8px;
    background: rgba(0, 30, 60, .24);
    border: 1px solid rgba(102, 217, 255, .08);
  }
  &__label { color: #6cdfff; font-size: 14px; font-weight: 700; margin-bottom: 5px; }
  &__text { color: #d8eeff; font-size: 15px; line-height: 1.55; }

  &__list {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 5px;

    li { color: #d8eeff; font-size: 14px; line-height: 1.55; }
  }

  &__confidence {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 13px;
    border-radius: 8px;
    background: rgba(0, 100, 180, .12);
    border: 1px solid rgba(0, 184, 255, .2);

    span { color: #7aa4c0; font-size: 14px; }
    strong { color: #7ff6ff; font-size: 22px; font-weight: 800; }
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
    font-size: 17px;
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
    font-size: 15px;
    font-weight: 600;
  }
}
.diag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;

  &__k { color: #8eb8d8; }
  &__v { color: #eaf6ff; font-weight: 700; }
}

/* 能力成长趋势 */
.trend-wrap {
  border-radius: 8px;
  border: 1px solid rgba(0, 184, 255, .1);
  background: rgba(0, 30, 60, .18);
  padding: 8px 6px 4px;
}

.cap-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.cap-bar {
  display: grid;
  grid-template-columns: 84px 40px minmax(0, 1fr);
  gap: 10px;
  align-items: center;

  &__label { color: #8eb8d8; font-size: 14px; font-weight: 600; text-align: right; }
  &__value { color: #7ff6ff; font-size: 15px; font-weight: 800; font-variant-numeric: tabular-nums; }
  &__track { height: 11px; border-radius: 99px; overflow: hidden; background: rgba(80, 120, 160, .25); }
  &__fill { height: 100%; border-radius: inherit; transition: width 1.2s ease; }
}

.cap-summary {
  margin: 0 0 12px;
  color: #d8eeff;
  font-size: 13px;
  line-height: 1.6;

  &__tag { color: #7ff6ff; font-weight: 800; margin-right: 4px; }
}
.cap-ability-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cap-ability {
  padding: 8px 10px 8px 14px;
  border-left: 3px solid;
  border-radius: 0 6px 6px 0;
  background: rgba(0, 30, 60, .28);

  strong { color: #eaf6ff; font-size: 13px; }
  small { float: right; color: #7ff6ff; font-weight: 800; font-size: 13px; }
  p { margin: 3px 0 0; color: #8eb8d8; font-size: 11px; }
  &__dot {
    display: inline-block;
    width: 8px; height: 8px; border-radius: 50%;
    margin-right: 6px; vertical-align: middle;
  }
}

/* ── 3. 机会雷达 ── */
.oppo-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
  gap: 22px;
}

.oppo-map__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;

  .cap-cell__title { margin-bottom: 0; }
}

.oppo-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
}
.oppo-chip {
  padding: 6px 14px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
  background: rgba(0, 30, 60, .28);
  color: #d8eeff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all .2s;

  &:hover { border-color: var(--c); }
  &.is-active {
    background: color-mix(in srgb, var(--c) 20%, transparent);
    color: #fff;
    box-shadow: 0 0 10px color-mix(in srgb, var(--c) 35%, transparent);
  }
}

.oppo-detail {
  padding: 14px;
  border-radius: 10px;
  background: rgba(0, 26, 54, .35);
  border: 1px solid rgba(0, 200, 255, .14);

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 14px;
  }
  &__icon { font-size: 26px; }
  &__name { margin: 0; color: #eaf6ff; font-size: 18px; font-weight: 800; }
  &__reco { color: #facc15; font-size: 15px; }
  &__reco strong { color: #7ff6ff; font-size: 17px; margin-left: 4px; }
}

.oppo-compare {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;

  &__row {
    display: flex;
    justify-content: space-between;
    padding: 7px 10px;
    border-radius: 6px;
    background: rgba(0, 30, 60, .25);
    span { color: #8eb8d8; font-size: 14px; }
    em { color: #d8eeff; font-style: normal; font-size: 15px; font-weight: 600; }
    .hl { color: #7ff6ff; }
  }
}

.oppo-block {
  margin-bottom: 12px;
  &__title { font-size: 14px; font-weight: 700; color: #7aa4c0; margin-bottom: 7px; }
}
.oppo-res {
  margin: 0; padding-left: 18px;
  li { color: #d8eeff; font-size: 15px; margin-bottom: 4px; }
}
.oppo-improve {
  display: flex;
  flex-direction: column;
  gap: 6px;
  &__item {
    color: #cfe6f8; font-size: 15px;
    b { color: #d8eeff; }
    .hl { color: #43e7af; }
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
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(0, 30, 60, .28);
  border: 1px solid rgba(120, 224, 255, .55);
  box-shadow: 0 0 0 1px rgba(120, 224, 255, .25) inset,
              0 0 12px rgba(120, 224, 255, .35);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  &__name { color: #eaf6ff; font-size: 16px; font-weight: 700; }
  &__val { color: #7fe3ff; font-size: 20px; font-weight: 900; font-variant-numeric: tabular-nums; }
  &__reason { margin: 0 0 2px; color: #cfe6f8; font-size: 14px; }
  &__suggest { margin: 0; color: #8eb8d8; font-size: 14px; }
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
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, .25);
  background: rgba(0, 30, 60, .3);
  color: #d8eeff;
  font-size: 15px;
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
.sim-result {
  &__headline {
    font-size: 22px;
    font-weight: 900;
    color: #7ff6ff;
    margin-bottom: 12px;
    text-align: center;
  }
  &__row {
    display: flex;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 30, 60, .25);
    margin-bottom: 8px;
    span { color: #8eb8d8; font-size: 14px; }
    em { color: #d8eeff; font-style: normal; font-size: 15px; font-weight: 600; }
    .hl { color: #43e7af; }
  }
  &__suggest {
    margin-top: 6px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 100, 180, .12);
    border: 1px solid rgba(0, 184, 255, .18);
    color: #b8ecff;
    font-size: 14px;
  }
}
.sim-detail-btn {
  display: block;
  width: 100%;
  margin-top: 14px;
  padding: 10px 0;
  border-radius: 8px;
  border: 1px solid rgba(120, 210, 255, .35);
  background: rgba(0, 60, 110, .35);
  color: #8ee9ff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all .2s;

  &:hover {
    border-color: #00e5ff;
    background: rgba(0, 120, 190, .45);
    box-shadow: 0 0 12px rgba(0, 200, 255, .35);
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
  gap: 2px;
}
.peer-row {
  display: grid;
  grid-template-columns: 1fr 80px 100px;
  align-items: center;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(102, 217, 255, .06);
  font-size: 15px;

  span:first-child { color: #cfe6f8; }
  span:nth-child(2) { color: #7ff6ff; font-weight: 800; text-align: center; }
  span:nth-child(3) { color: #facc15; font-weight: 700; text-align: center; }

  &--head {
    border-bottom: 1px solid rgba(102, 217, 255, .15);
    span { color: #7aa4c0; font-size: 14px; font-weight: 700; }
  }
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
  padding: 14px;
  border-radius: 10px;
  background: rgba(0, 26, 54, .3);
  border: 1px solid rgba(102, 217, 255, .1);

  &__title {
    margin: 0 0 12px;
    font-size: 16px;
    font-weight: 800;
    padding-left: 10px;
    border-left: 3px solid;

    &--now { color: #ff9a9a; border-color: #ff7474; }
    &--mid { color: #f7d774; border-color: #facc15; }
    &--long { color: #5ff0bd; border-color: #43e7af; }
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
    font-size: 15px;
    line-height: 1.5;
    padding: 8px 0;
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
  font-size: 15px;
  color: rgba(184, 236, 255, .7);

  &.error {
    color: #f87171;
    flex-direction: column;
  }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, .3);
    background: rgba(0, 184, 255, .1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

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
  .cockpit-grid { grid-template-columns: 1fr; }
  .cockpit-portrait { border-left: none; border-right: none; padding: 14px 0; border-top: 1px solid rgba(102, 217, 255, .1); border-bottom: 1px solid rgba(102, 217, 255, .1); }
  .capability-grid { grid-template-columns: 1fr; }
  .oppo-grid { grid-template-columns: 1fr; }
  .risk-grid { grid-template-columns: 1fr; }
  .risk-explain { grid-template-columns: 1fr; }
  .forecast-grid { grid-template-columns: 1fr; }
  .peer-grid { grid-template-columns: 1fr; }
  .action-grid { grid-template-columns: 1fr; }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
</style>
