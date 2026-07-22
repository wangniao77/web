<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const route = useRoute()
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

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)))
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

const ringOption = computed<EChartsOption>(() => ({
  series: [{
    type: 'gauge',
    center: ['50%', '56%'],
    radius: '88%',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    splitNumber: 10,
    axisLine: {
      lineStyle: {
        width: 16,
        color: [[0.3, '#ff7474'], [0.7, '#facc15'], [1, '#43e7af']],
      },
    },
    pointer: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    detail: {
      valueAnimation: true,
      fontSize: 44,
      fontWeight: 'bold',
      color: '#f6fbff',
      offsetCenter: [0, '8%'],
      formatter: '{value}',
    },
    data: [{ value: compositeScore.value.score }],
  }, {
    type: 'gauge',
    center: ['50%', '56%'],
    radius: '88%',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    detail: {
      fontSize: 13,
      fontWeight: 600,
      color: '#b8ecff',
      offsetCenter: [0, '32%'],
      formatter: () => '综合发展指数',
    },
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { show: false },
    pointer: { show: false },
    data: [{ value: compositeScore.value.score }],
  }],
}))

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

/* ════════════ 2. 能力画像分析 ════════════ */
const radarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '52%'],
    radius: '66%',
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
    data: [{
      value: abilities.value.map(a => a.value),
      name: '当前能力',
      areaStyle: { color: 'rgba(0,229,255,0.2)' },
      lineStyle: { color: '#00e5ff', width: 2 },
      itemStyle: { color: '#00e5ff' },
    }],
    symbol: 'circle',
    symbolSize: 6,
  }],
}))

const capabilityBars = computed(() => abilities.value)
const aiSummary = computed(() => {
  const d = dashboard.value
  if (!d) return '—'
  const top = [...abilities.value].sort((a, b) => b.value - a.value)[0]
  const low = [...abilities.value].sort((a, b) => a.value - b.value)[0]
  return `该生综合发展指数 ${compositeScore.value.score}（${compositeScore.value.level}）。最强项为「${top.label}」（${top.value}），最需补强的是「${low.label}」（${low.value}）。建议优先提升实践能力与项目积累，巩固就业竞争力。`
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
const pathResult = computed(() => {
  const d = dashboard.value
  const gpa = d?.academic.gpa ?? 3
  const jobReady = d?.employment.jobReadiness ?? 70
  if (simPath.value === 'postgrad') {
    return {
      type: 'postgrad',
      headline: `成功概率 ${clamp(60 + (gpa - 3) * 30)}%`,
      strengths: ['GPA 较高', '专业基础扎实'],
      weakness: '数学模块需补强',
      suggest: '补强数学课程 · 准备目标院校',
    }
  }
  if (simPath.value === 'job') {
    return {
      type: 'job',
      headline: `岗位匹配 ${clamp(jobReady + 5)}%`,
      roles: ['Java开发', '后端工程师'],
      salary: '12–18K',
      strengths: ['专业技能突出'],
      weakness: '企业实践不足',
    }
  }
  return {
    type: 'civil',
    headline: '匹配度 68%',
    strengths: ['综合成绩较好'],
    weakness: '行政能力模块不足',
    suggest: '加强申论与行测训练',
  }
})

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
            <div class="cockpit-ring">
              <ChartContainer :option="ringOption" style="height:200px" />
            </div>
          </div>

          <!-- 中：AI学生画像 -->
          <div class="cockpit-portrait">
            <h4 class="panel-label">AI 学生画像</h4>
            <div class="portrait-head">
              <div class="portrait-name">{{ profile.name }}</div>
              <div class="portrait-meta">{{ profile.major }} · {{ profile.grade }}</div>
            </div>
            <div class="portrait-stage">
              <span class="portrait-stage__label">发展阶段</span>
              <span class="portrait-stage__stars">{{ stars(studentPortrait.stageStars) }}</span>
              <span class="portrait-stage__text">{{ studentPortrait.stage }}</span>
            </div>
            <div class="portrait-block">
              <div class="portrait-block__title portrait-block__title--good">优势标签</div>
              <div class="tag-row">
                <span v-for="s in studentPortrait.strengths" :key="s" class="tag tag--good">✓ {{ s }}</span>
              </div>
            </div>
            <div class="portrait-block">
              <div class="portrait-block__title portrait-block__title--warn">短板</div>
              <div class="tag-row">
                <span v-for="w in studentPortrait.weaknesses" :key="w" class="tag tag--warn">⚠ {{ w }}</span>
              </div>
            </div>
            <div class="portrait-block">
              <div class="portrait-block__title">适合方向</div>
              <div class="tag-row">
                <span v-for="dir in studentPortrait.directions" :key="dir" class="tag tag--dir">→ {{ dir }}</span>
              </div>
            </div>
          </div>

          <!-- 右：AI综合判断（含能力拆解） -->
          <div class="cockpit-judgment">
            <h4 class="panel-label">AI 综合判断</h4>
            <div class="ability-break">
              <div class="ability-break__hint">点击能力查看详情</div>
              <button
                v-for="a in abilities"
                :key="a.key"
                type="button"
                class="ability-chip"
                :class="{ 'is-active': selectedAbility === a.key }"
                :style="{ '--c': a.color }"
                @click="selectedAbility = selectedAbility === a.key ? null : a.key"
              >
                <span class="ability-chip__dot" :style="{ background: a.color }" />
                {{ a.label }}
                <em>{{ a.value }}</em>
              </button>
              <transition name="fade">
                <p v-if="selectedAbilityInfo" class="ability-break__detail">
                  {{ selectedAbilityInfo.label }}：{{ selectedAbilityInfo.detail }}
                </p>
              </transition>
            </div>
            <div class="judge-status">
              <div class="judge-status__item">
                <span class="judge-status__label">发展状态</span>
                <strong class="judge-status__value">{{ aiJudgment.status }}</strong>
              </div>
              <div class="judge-status__item">
                <span class="judge-status__label">可信度</span>
                <strong class="judge-status__value">{{ aiJudgment.confidence }}%</strong>
              </div>
            </div>
            <div class="judge-source">
              <span class="judge-source__label">数据来源</span>
              <div class="tag-row">
                <span v-for="s in aiJudgment.sources" :key="s" class="tag tag--src">{{ s }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ═══════ 2. 能力画像分析 ═══════ -->
      <section class="deep-card">
        <h3 class="deep-card__title">能力画像分析</h3>
        <div class="capability-grid">
          <div class="cap-cell">
            <div class="cap-cell__title">能力雷达</div>
            <ChartContainer :option="radarOption" style="height:300px" />
          </div>
          <div class="cap-cell">
            <div class="cap-summary-box">
              <div class="cap-cell__title">AI 总结</div>
              <p class="cap-summary">{{ aiSummary }}</p>
            </div>
          </div>
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
            <div class="cap-cell__title">学生发展路径模拟</div>
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
              <span class="tag tag--good">✓ 竞赛领先</span>
              <span class="tag tag--warn">⚠ 项目不足</span>
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
  font-size: 16px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: .04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, .45);
  }
}

.panel-label {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #6cdfff;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 200, 255, .12);
}

.cap-cell__title {
  font-size: 13px;
  font-weight: 700;
  color: #8eb8d8;
  margin-bottom: 10px;
  letter-spacing: .03em;
}

/* ── 1. 驾驶舱 ── */
.cockpit-grid {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr) minmax(0, 1.15fr);
  gap: 24px;
  align-items: stretch;
}

.cockpit-ring {
  max-width: 220px;
  margin: 0 auto;
}

.ability-break {
  margin-top: 8px;

  &__hint {
    font-size: 11px;
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
    font-size: 12px;
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
  font-size: 13px;
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
  padding: 0 20px;
  border-left: 1px solid rgba(102, 217, 255, .1);
  border-right: 1px solid rgba(102, 217, 255, .1);
}

.portrait-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 10px;
}
.portrait-name {
  font-size: 22px;
  font-weight: 900;
  color: #f6fbff;
  text-shadow: 0 0 14px rgba(0, 242, 255, .28);
}
.portrait-meta { color: #8eb8d8; font-size: 13px; }

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
    font-size: 12px;
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
  padding: 3px 9px;
  border-radius: 12px;
  font-size: 12px;
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
  &__label { display: block; color: #7aa4c0; font-size: 12px; font-weight: 700; margin-bottom: 7px; }
}

/* ── 2. 能力画像分析 ── */
.capability-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 22px;
}

.cap-summary-box {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid rgba(102, 217, 255, .08);
}

.cap-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}
.cap-bar {
  display: grid;
  grid-template-columns: 64px 30px minmax(0, 1fr);
  gap: 8px;
  align-items: center;

  &__label { color: #8eb8d8; font-size: 12px; font-weight: 600; text-align: right; }
  &__value { color: #7ff6ff; font-size: 13px; font-weight: 800; font-variant-numeric: tabular-nums; }
  &__track { height: 9px; border-radius: 99px; overflow: hidden; background: rgba(80, 120, 160, .25); }
  &__fill { height: 100%; border-radius: inherit; transition: width 1.2s ease; }
}

.cap-summary {
  margin: 0 0 12px;
  color: #d8eeff;
  font-size: 13px;
  line-height: 1.6;
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
  padding: 5px 12px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--c) 40%, transparent);
  background: rgba(0, 30, 60, .28);
  color: #d8eeff;
  font-size: 12px;
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
  &__name { margin: 0; color: #eaf6ff; font-size: 16px; font-weight: 800; }
  &__reco { color: #facc15; font-size: 13px; }
  &__reco strong { color: #7ff6ff; font-size: 15px; margin-left: 4px; }
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
    span { color: #8eb8d8; font-size: 12px; }
    em { color: #d8eeff; font-style: normal; font-size: 13px; font-weight: 600; }
    .hl { color: #7ff6ff; }
  }
}

.oppo-block {
  margin-bottom: 12px;
  &__title { font-size: 12px; font-weight: 700; color: #7aa4c0; margin-bottom: 7px; }
}
.oppo-res {
  margin: 0; padding-left: 18px;
  li { color: #d8eeff; font-size: 13px; margin-bottom: 4px; }
}
.oppo-improve {
  display: flex;
  flex-direction: column;
  gap: 6px;
  &__item {
    color: #cfe6f8; font-size: 13px;
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
  border: 1px solid var(--c);
  box-shadow: 0 0 0 1px color-mix(in srgb, var(--c) 35%, transparent) inset,
              0 0 10px color-mix(in srgb, var(--c) 22%, transparent);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  &__name { color: #eaf6ff; font-size: 14px; font-weight: 700; }
  &__val { color: var(--c); font-size: 18px; font-weight: 900; font-variant-numeric: tabular-nums; }
  &__reason { margin: 0 0 2px; color: #cfe6f8; font-size: 12px; }
  &__suggest { margin: 0; color: #8eb8d8; font-size: 12px; }
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
  font-size: 13px;
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
    span { color: #8eb8d8; font-size: 12px; }
    em { color: #d8eeff; font-style: normal; font-size: 13px; font-weight: 600; }
    .hl { color: #43e7af; }
  }
  &__suggest {
    margin-top: 6px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 100, 180, .12);
    border: 1px solid rgba(0, 184, 255, .18);
    color: #b8ecff;
    font-size: 12px;
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
  font-size: 13px;

  span:first-child { color: #cfe6f8; }
  span:nth-child(2) { color: #7ff6ff; font-weight: 800; text-align: center; }
  span:nth-child(3) { color: #facc15; font-weight: 700; text-align: center; }

  &--head {
    border-bottom: 1px solid rgba(102, 217, 255, .15);
    span { color: #7aa4c0; font-size: 12px; font-weight: 700; }
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
    font-size: 14px;
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
    font-size: 13px;
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
