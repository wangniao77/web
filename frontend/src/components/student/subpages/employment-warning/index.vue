<script setup lang="ts">
/**
 * 就业预警详情（二级页面）
 * 路由：/student/employment-warning?studentId=xxx
 *
 * 优化方向（对齐学业预警排版：两两并排、字体放大）：
 *  - 就业状态总览（仪表盘 + 指标卡 + 状态说明）
 *  - 人岗匹配推荐（保留）
 *  - 就业能力画像（雷达图：专业/项目/实习/证书/面试）
 *  - 就业风险原因分析（风险矩阵：实践/项目/简历/技能）
 *  - 求职进展跟踪（流程图：简历投递/面试/企业沟通/Offer）
 *  - 就业能力短板分析（保留）
 *  - 求职行动计划（保留）
 *  - 就业预警台账（保留）
 *  - 就业意向与准备状态（保留）
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, JobMatchVM, AttentionItemVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL } from '@/styles/echarts-theme'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedJob = ref(0)

async function load() {
  loading.value = true
  error.value = null
  try {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('请求超时，请检查网络或刷新页面')), 10000),
    )
    dashboard.value = await Promise.race([
      studentService.fetchDashboard(activeStudentId.value),
      timeout,
    ])
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}

type Level = 'low' | 'medium' | 'high'
const LEVEL_COLOR: Record<Level, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const LEVEL_TEXT: Record<Level, string> = { low: '正常', medium: '需关注', high: '高危' }
const levelColor = (lv: string) => LEVEL_COLOR[(lv as Level)] || '#8fb7cd'
const levelText = (lv: string) => LEVEL_TEXT[(lv as Level)] || '—'

/* ---------- 就业预警台账（保留） ---------- */
const employmentItems = computed(() => {
  if (!dashboard.value) return []
  const items = (dashboard.value.attention ?? []).filter((i) => /就业|实习|职业/.test(`${i.category}${i.label}`))
  if (items.length >= 4) return items
  const fallback = [
    { id: 'emp-1', category: '实践提醒', label: '暂无企业实习经历', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-2', category: '就业预警', label: '简历状态未完善', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-3', category: '就业预警', label: '目标岗位技能匹配度不足', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-4', category: '职业提醒', label: '就业意向城市尚未填报', level: 'low', levelLabel: '正常' },
    { id: 'emp-5', category: '就业预警', label: '项目经历较少', level: 'low', levelLabel: '正常' },
    { id: 'emp-6', category: '职业提醒', label: '未参加本学期校园招聘会', level: 'low', levelLabel: '正常' },
    { id: 'emp-7', category: '实践提醒', label: '暑期实习投递进度滞后', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-8', category: '就业预警', label: '缺少行业相关证书', level: 'low', levelLabel: '正常' },
    { id: 'emp-9', category: '职业提醒', label: '未加入专业相关社群或协会', level: 'low', levelLabel: '正常' },
    { id: 'emp-10', category: '就业预警', label: '面试邀约次数为零', level: 'medium', levelLabel: '需关注' },
    { id: 'emp-11', category: '实践提醒', label: '缺少校内科研项目经历', level: 'low', levelLabel: '正常' },
    { id: 'emp-12', category: '职业提醒', label: '职业规划书未提交', level: 'low', levelLabel: '正常' },
  ] as AttentionItemVM[]
  return [...items, ...fallback].slice(0, 4)
})

const employmentLevel = computed<Level>(() => {
  if (!employmentItems.value.length) return 'low'
  const weights: Record<Level, number> = { low: 1, medium: 2, high: 3 }
  return employmentItems.value.reduce((highest, item) =>
    weights[item.level as Level] > weights[highest] ? (item.level as Level) : highest
  , 'low' as Level)
})

const employmentLevelText = computed(() =>
  employmentLevel.value === 'high' ? '高危' : employmentLevel.value === 'medium' ? '需关注' : '正常')

/* ---------- 1. 就业状态总览 ---------- */
const jobReadiness = computed(() => {
  const v = dashboard.value?.employment?.jobReadiness
  if (typeof v === 'number' && v > 0) return v
  return employmentLevel.value === 'high' ? 32 : employmentLevel.value === 'medium' ? 58 : 82
})

const recommendedDirection = computed(() =>
  dashboard.value?.aiAssistant?.recommendedDirection
  || dashboard.value?.employment?.careerDirections?.[0]
  || '暂无推荐')

const currentStage = computed(() => dashboard.value?.careerDev?.employmentDestination ?? '待明确')

const readinessGaugeOption = computed<EChartsOption>(() => ({
  series: [{
    type: 'gauge',
    startAngle: 210,
    endAngle: -30,
    min: 0,
    max: 100,
    radius: '94%',
    center: ['50%', '58%'],
    progress: { show: true, width: 12, itemStyle: { color: levelColor(employmentLevel.value) } },
    axisLine: { lineStyle: { width: 12, color: [[0.4, '#ff7474'], [0.7, '#facc15'], [1, '#55e995']] } },
    pointer: { width: 4, length: '58%', itemStyle: { color: '#f6fbff' } },
    axisTick: { show: false },
    splitLine: { length: 10, lineStyle: { color: 'rgba(255,255,255,0.25)', width: 1 } },
    axisLabel: { distance: 14, color: '#7eb4d8', fontSize: 12 },
    anchor: { show: true, size: 8, itemStyle: { color: '#f6fbff' } },
    title: { show: false },
    detail: {
      valueAnimation: true,
      formatter: '{value}',
      color: '#f6fbff',
      fontSize: 30,
      fontWeight: 'bolder',
      offsetCenter: [0, '36%'],
    },
    data: [{ value: jobReadiness.value }],
  }],
}))

const employmentStatusText = computed(() => {
  if (employmentLevel.value === 'high') return '就业准备度偏低、风险项集中，已触发高危预警，须立即介入帮扶。'
  if (employmentLevel.value === 'medium') return '存在就业能力短板，需持续关注并补充实习与项目经历。'
  return '整体就业准备度良好，保持常规关注与资源对接即可。'
})

/* ---------- 人岗匹配推荐（保留） ---------- */
const jobMatches = computed(() => {
  const list = dashboard.value?.aiPortrait?.jobMatches ?? []
  const fallback = [
    { role: 'Java后端开发工程师', match: 92, city: '杭州', salary: '15-25K', requirements: '熟悉 Java 基础、Spring Boot、MySQL，了解 Redis 和消息队列', reason: '专业课程匹配度高，Java 核心课程成绩优秀，项目经验丰富' },
    { role: '前端开发工程师', match: 85, city: '上海', salary: '14-22K', requirements: '熟练掌握 HTML/CSS/JavaScript，熟悉 Vue 或 React 框架', reason: '前端技术栈掌握扎实，有个人项目作品展示' },
    { role: '数据分析师', match: 78, city: '北京', salary: '16-28K', requirements: '掌握 Python/R，熟悉 SQL 和数据分析工具，具备统计学基础', reason: '数学与统计学基础良好，有数据分析相关课程与项目经历' },
    { role: '测试工程师', match: 72, city: '深圳', salary: '12-20K', requirements: '了解软件测试理论，熟悉自动化测试工具，有编程基础', reason: '代码能力达标，学习意愿强，适合从测试切入技术岗位' },
    { role: '产品经理（技术方向）', match: 68, city: '杭州', salary: '15-24K', requirements: '具备良好的逻辑思维与沟通能力，熟悉产品开发流程', reason: '综合素养较高，学生干部经历锻炼沟通与协调能力' },
    { role: '运维工程师', match: 65, city: '成都', salary: '10-18K', requirements: '熟悉 Linux 系统，了解网络协议与服务器配置', reason: '系统管理课程基础良好，动手能力强' },
    { role: 'AI算法工程师', match: 60, city: '北京', salary: '20-35K', requirements: '熟悉机器学习算法，掌握 Python 与深度学习框架，数学功底扎实', reason: '数学与编程基础良好，但算法相关项目经历不足' },
    { role: '全栈开发工程师', match: 55, city: '上海', salary: '18-30K', requirements: '前后端技术均有一定掌握，能独立完成小型项目开发', reason: '技术栈覆盖面广但深度不足，需加强专项能力' },
    { role: '嵌入式开发工程师', match: 82, city: '苏州', salary: '13-22K', requirements: '熟悉 C/C++，了解 STM32、RTOS 与串口通信', reason: '嵌入式课程成绩优秀，有单片机竞赛与硬件项目经历' },
    { role: '游戏客户端开发', match: 76, city: '广州', salary: '16-26K', requirements: '掌握 C++/C# 与 Unity/Unreal 引擎，了解图形渲染基础', reason: '计算机图形学基础扎实，课余参与独立游戏开发' },
    { role: '网络安全工程师', match: 70, city: '南京', salary: '14-24K', requirements: '了解网络协议、渗透测试与安全防护，掌握至少一门脚本语言', reason: '信息安全课程兴趣浓厚，参与过 CTF 竞赛' },
    { role: '数据库管理员（DBA）', match: 66, city: '武汉', salary: '12-20K', requirements: '熟悉 MySQL/PostgreSQL，了解备份、调优与高可用架构', reason: '数据库课程表现突出，有运维与调优实践' },
    { role: '云计算工程师', match: 63, city: '深圳', salary: '18-30K', requirements: '熟悉 Docker/K8s，了解 AWS/阿里云等云平台与 CI/CD', reason: '云原生课程基础良好，动手部署过个人服务' },
    { role: '技术文档工程师', match: 58, city: '成都', salary: '10-16K', requirements: '文字表达清晰，具备技术理解力，熟悉 Markdown 与文档工具', reason: '写作能力强，适合走技术传播方向作为起步' },
    { role: '区块链开发工程师', match: 52, city: '杭州', salary: '20-32K', requirements: '了解 Solidity 与智能合约，熟悉密码学与分布式系统', reason: '对 Web3 方向有兴趣，但工程实践经验尚少' },
    { role: '产品经理（C 端方向）', match: 50, city: '北京', salary: '14-26K', requirements: '具备用户洞察与数据分析能力，熟悉需求管理与原型工具', reason: '沟通与策划能力突出，可作为非技术岗备选方向' },
  ] as JobMatchVM[]
  if (list.length >= 4) return list
  return [...list, ...fallback].slice(0, 4)
})

/* ---------- 3. 就业能力画像（雷达图） ---------- */
const abilityRadarValues = computed<number[]>(() => {
  const d = dashboard.value
  const lv = employmentLevel.value
  const gpa = d?.academic.gpa ?? 2.8
  const professional = Math.round(Math.min(100, (gpa / 4) * 100))
  const project = Math.round(Math.min(100, (d?.internship.projectCount ?? 2) * 24))
  const intern = Math.round(Math.min(100, (d?.internship.internshipCount ?? 1) * 32))
  const cert = Math.round(Math.min(100, (d?.internship.certificateCount ?? 2) * 20))
  const interview = lv === 'high' ? 38 : lv === 'medium' ? 56 : 80
  return [professional, project, intern, cert, interview]
})

const abilityRadarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '54%'],
    radius: '66%',
    indicator: [
      { name: '专业能力', max: 100 },
      { name: '项目经历', max: 100 },
      { name: '实习经历', max: 100 },
      { name: '技能证书', max: 100 },
      { name: '面试能力', max: 100 },
    ],
    axisName: { color: '#b8ecff', fontSize: 15 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0,184,255,0.04)', 'rgba(0,184,255,0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: abilityRadarValues.value,
      name: '就业能力',
      symbolSize: 5,
      areaStyle: { color: 'rgba(0, 229, 255, 0.22)' },
      lineStyle: { color: '#00e5ff', width: 2 },
      itemStyle: { color: '#00e5ff' },
    }],
  }],
}))

const abilityFactorList = computed(() => {
  const names = ['专业能力', '项目经历', '实习经历', '技能证书', '面试能力']
  return abilityRadarValues.value.map((v, i) => ({
    name: names[i],
    level: (v >= 70 ? 'low' : v >= 40 ? 'medium' : 'high') as Level,
    desc: `评分 ${v}/100`,
  }))
})

/* ---------- 4. 就业风险原因分析（风险矩阵） ---------- */
interface RiskMatrixItem { name: string; x: number; y: number; level: Level }
const riskMatrix = computed<RiskMatrixItem[]>(() => {
  const d = dashboard.value
  const intern = d?.internship.internshipCount ?? 1
  const proj = d?.internship.projectCount ?? 2
  const certR = d?.employment?.certificateReadiness ?? 50
  const resumeBad = (d?.careerDev?.resumeStatus ?? '').includes('未完善')
  const mk = (name: string, x: number, y: number): RiskMatrixItem => {
    const level: Level = (x >= 70 || y >= 70) ? 'high' : (x >= 50 || y >= 50) ? 'medium' : 'low'
    return { name, x: Math.round(x), y: Math.round(y), level }
  }
  return [
    mk('实践经历不足', Math.max(20, 90 - intern * 30), 82),
    mk('项目经验不足', Math.max(20, 88 - proj * 24), 70),
    mk('简历准备不足', resumeBad ? 72 : 38, resumeBad ? 60 : 35),
    mk('技能匹配不足', Math.max(20, 92 - certR), 62),
  ]
})

const riskMatrixOption = computed<EChartsOption>(() => ({
  grid: { top: 18, bottom: 28, left: 38, right: 16 },
  tooltip: {
    trigger: 'item',
    formatter: (params: unknown) => {
      const p = params as { data: { name: string; value: number[] } }
      return `${p.data.name}<br/>发生可能性：${p.data.value[0]}<br/>影响程度：${p.data.value[1]}`
    },
  },
  xAxis: {
    type: 'value', min: 0, max: 100, name: '可能性',
    nameTextStyle: { color: '#7eb4d8', fontSize: 14 },
    axisLabel: { ...AXIS_LABEL, fontSize: 14 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  yAxis: {
    type: 'value', min: 0, max: 100, name: '影响程度',
    nameTextStyle: { color: '#7eb4d8', fontSize: 14 },
    axisLabel: { ...AXIS_LABEL, fontSize: 14 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  series: [{
    type: 'scatter',
    data: riskMatrix.value.map((r) => ({
      name: r.name,
      value: [r.x, r.y],
      symbolSize: 20 + (r.x + r.y) / 8,
      itemStyle: { color: LEVEL_COLOR[r.level], opacity: 0.85 },
      label: { show: true, formatter: r.name, position: 'top', color: '#d0e8f8', fontSize: 14 },
    })),
  }],
}))

/* ---------- 5. 求职进展跟踪（流程图） ---------- */
interface ProgressStep { name: string; value: number; unit: string; status: 'done' | 'active' | 'pending' }
const jobProgress = computed<ProgressStep[]>(() => {
  const lv = employmentLevel.value
  const delivered = lv === 'high' ? 4 : lv === 'medium' ? 9 : 14
  const interviews = lv === 'high' ? 0 : lv === 'medium' ? 2 : 5
  const companies = lv === 'high' ? 1 : lv === 'medium' ? 4 : 8
  const offers = lv === 'high' ? 0 : lv === 'medium' ? 1 : 3
  return [
    { name: '简历投递', value: delivered, unit: '份', status: delivered > 0 ? 'done' : 'pending' },
    { name: '面试情况', value: interviews, unit: '场', status: interviews > 0 ? 'active' : 'pending' },
    { name: '企业沟通', value: companies, unit: '家', status: companies > 0 ? 'done' : 'pending' },
    { name: 'Offer 状态', value: offers, unit: '个', status: offers > 0 ? 'done' : 'pending' },
  ]
})

/* ---------- 就业能力短板分析（保留） ---------- */
const weaknesses = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const list: { label: string; level: Level; desc: string }[] = []
  if (d.internship?.internshipCount === 0) {
    list.push({ label: '实习经历', level: 'high', desc: '暂无企业实习记录，建议利用假期补充' })
  }
  if (d.careerDev?.resumeStatus?.includes('未完善')) {
    list.push({ label: '简历完善度', level: 'medium', desc: '简历状态未完善，缺少项目与技能亮点' })
  }
  if (!d.profile?.cet4Score) {
    list.push({ label: '英语四级', level: 'high', desc: 'CET-4 未通过，多数企业设有门槛' })
  } else if (!d.profile?.cet6Score) {
    list.push({ label: '英语六级', level: 'medium', desc: 'CET-6 未通过，优质岗位竞争力受限' })
  }
  if (d.academic?.gpa > 0 && d.academic?.gpa < 2.5) {
    list.push({ label: '学业成绩', level: 'medium', desc: 'GPA 偏低，可能影响部分企业简历筛选' })
  }
  if (list.length === 0) {
    list.push({ label: '综合条件', level: 'low', desc: '整体就业准备度尚可，持续积累即可' })
  }
  list.push({ label: '项目经历', level: 'medium', desc: '技术项目较少，建议补充开源项目或课程设计' })
  list.push({ label: '面试准备', level: 'medium', desc: '缺乏面试经验，建议参加模拟面试训练' })
  return list
})

/* ---------- 求职行动计划（保留） ---------- */
const actionPlan = computed(() => {
  const d = dashboard.value
  if (!d) return []
  return [
    { time: '本周', action: '完善个人简历，补充项目经历与技能关键词', tag: '高优' },
    { time: '本月', action: `锁定目标方向「${d.employment?.careerDirections?.[0] || '待定'}」，梳理岗位 JD 技能要求`, tag: '重点' },
    { time: '本学期', action: '参加至少 1 场专业对口双选会或企业宣讲', tag: '建议' },
    { time: '本学期', action: '联系校友或导师获取目标岗位内推机会', tag: '建议' },
    { time: '假期', action: '争取 1 段企业实习或项目实践经历', tag: '长期' },
    { time: '长期', action: '持续提升英语水平，争取通过 CET-6 考试', tag: '长期' },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="就业预警详情"
    :subtitle="dashboard ? `${dashboard.profile?.name ?? '未知'} · ${dashboard.profile?.studentId ?? ''}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="employment-warning">
      <!-- 1. 就业状态总览 -->
      <section class="warn-section sec-full overview">
        <h3 class="warn-section__title">就业状态总览</h3>
        <div class="overview__body">
          <div class="overview__gauge">
            <ChartContainer :option="readinessGaugeOption" />
            <div class="overview__gauge-cap">就业准备度</div>
          </div>
          <div class="overview__main">
            <div class="kpi-grid">
              <div class="kpi-card" :class="`kpi-card--${employmentLevel}`">
                <span class="kpi-card__label">就业风险等级</span>
                <strong class="kpi-card__value">{{ employmentLevelText }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">就业准备度</span>
                <strong class="kpi-card__value">{{ jobReadiness }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">推荐方向</span>
                <strong class="kpi-card__value kpi-card__value--small">{{ recommendedDirection }}</strong>
              </div>
              <div class="kpi-card">
                <span class="kpi-card__label">当前就业阶段</span>
                <strong class="kpi-card__value kpi-card__value--small">{{ currentStage }}</strong>
              </div>
            </div>
            <div class="risk-note" :class="`risk-note--${employmentLevel}`">
              <span class="risk-note__tag">{{ employmentLevelText }}</span>
              <span class="risk-note__text">{{ employmentStatusText }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 就业能力画像 + 求职进展/意向（并排） -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业能力画像</h3>
        <div class="radar-wrap">
          <ChartContainer :option="abilityRadarOption" />
        </div>
        <div class="factor-list">
          <div
            v-for="f in abilityFactorList"
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

      <section class="warn-section">
        <h3 class="warn-section__title">求职进展与就业意向</h3>
        <h4 class="combine__sub">求职进展跟踪</h4>
        <div class="progress-flow">
          <template v-for="(s, i) in jobProgress" :key="s.name">
            <div class="progress-step" :class="`progress-step--${s.status}`">
              <span class="progress-step__dot" />
              <span class="progress-step__name">{{ s.name }}</span>
              <span class="progress-step__value">{{ s.value }}<span class="progress-step__unit">{{ s.unit }}</span></span>
            </div>
            <span v-if="i < jobProgress.length - 1" class="progress-connector">→</span>
          </template>
        </div>
        <h4 class="combine__sub">就业意向与准备状态</h4>
        <div class="info-grid">
          <div class="info-item"><span class="info-item__label">意向城市</span><span class="info-item__value">{{ dashboard.careerDev?.targetCity ?? '未填报' }}</span></div>
          <div class="info-item"><span class="info-item__label">期望薪资</span><span class="info-item__value">{{ dashboard.careerDev?.expectedSalary ?? '未填报' }}</span></div>
          <div class="info-item"><span class="info-item__label">简历状态</span><span class="info-item__value">{{ dashboard.careerDev?.resumeStatus ?? '未完善' }}</span></div>
          <div class="info-item"><span class="info-item__label">项目经历</span><span class="info-item__value">{{ dashboard.careerDev?.projectExperiences?.length ?? 0 }} 项</span></div>
        </div>
      </section>

      <!-- 4. 就业风险原因分析（风险分析放上面） -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业风险原因分析</h3>
        <div class="risk-sub">风险矩阵（横轴=发生可能性，纵轴=影响程度，越靠右上风险越高）</div>
        <div class="matrix-wrap">
          <ChartContainer :option="riskMatrixOption" />
        </div>
        <div class="risk-tag-list">
          <div
            v-for="r in riskMatrix"
            :key="r.name"
            class="risk-tag"
            :class="`risk-tag--${r.level}`"
          >
            <span class="risk-tag__dot" :style="{ background: levelColor(r.level) }" />
            <span class="risk-tag__name">{{ r.name }}</span>
            <span class="risk-tag__val">{{ levelText(r.level) }}</span>
          </div>
        </div>
      </section>

      <!-- 岗位适配雷达图 + 推荐目标岗位 / 优势 / 缺失能力 -->
      <section class="warn-section sec-full">
        <h3 class="warn-section__title">岗位适配雷达图 <i class="mock-tag">模拟数据</i></h3>
        <div class="job-radar-layout">
          <!-- 左侧：岗位适配雷达图 -->
          <div class="job-radar-left">
            <div class="radar-chart-wrap">
              <ChartContainer :option="abilityRadarOption" />
            </div>
          </div>
          <!-- 右侧：岗位标签 / 优势 / 缺失能力 -->
          <div class="job-radar-right">
            <!-- 推荐目标岗位标签（顶部） -->
            <div v-if="jobMatches.length" class="job-tags-top">
              <label class="job-tags-label">推荐目标岗位</label>
              <div class="job-tags-row">
                <span
                  v-for="(job, idx) in jobMatches.slice(0, 4)"
                  :key="idx"
                  class="job-tag-chip"
                  :class="{ 'is-active': selectedJob === idx }"
                  @click="selectedJob = idx"
                >
                  <span class="job-tag-chip__rank">TOP{{ idx + 1 }}</span>
                  {{ job.role }}
                  <strong class="job-tag-chip__match" :style="{ color: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }">{{ job.match }}%</strong>
                </span>
              </div>
            </div>
            <!-- 优势（能力画像因子） -->
            <div class="job-ability-section">
              <label class="job-section-label job-section-label--good">优势能力</label>
              <div class="job-ability-grid">
                <div
                  v-for="f in abilityFactorList.filter(a => a.level === 'low')"
                  :key="f.name"
                  class="job-ability-chip job-ability-chip--good"
                >
                  <span class="job-ability-chip__name">{{ f.name }}</span>
                  <span class="job-ability-chip__val">{{ f.desc.split(' ')[1] }}</span>
                </div>
                <div v-if="!abilityFactorList.filter(a => a.level === 'low').length" class="job-ability-empty">暂无突出优势</div>
              </div>
            </div>
            <!-- 缺失能力 -->
            <div class="job-ability-section">
              <label class="job-section-label job-section-label--warn">缺失能力</label>
              <div class="job-weakness-list">
                <div v-for="(w, idx) in weaknesses" :key="idx" class="job-weakness-chip" :class="`job-weakness-chip--${w.level}`">
                  <span class="job-weakness-chip__dot" :style="{ background: levelColor(w.level) }" />
                  <span class="job-weakness-chip__label">{{ w.label }}</span>
                  <span class="job-weakness-chip__level" :style="{ color: levelColor(w.level) }">{{ { low: '良好', medium: '需关注', high: '短板' }[w.level] }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 选中岗位详情 -->
      <section v-if="jobMatches.length" class="warn-section sec-full">
        <h3 class="warn-section__title">岗位详情 · {{ jobMatches[selectedJob]?.role }}</h3>
        <div class="job-detail-row">
          <div class="job-detail-kv"><label>匹配度</label><strong :style="{ color: jobMatches[selectedJob].match >= 80 ? '#55e995' : jobMatches[selectedJob].match >= 60 ? '#facc15' : '#ff7474' }">{{ jobMatches[selectedJob].match }}%</strong></div>
          <div class="job-detail-kv"><label>城市</label><span>{{ jobMatches[selectedJob].city }}</span></div>
          <div class="job-detail-kv"><label>薪资</label><span>{{ jobMatches[selectedJob].salary }}</span></div>
          <div class="job-detail-kv"><label>推荐理由</label><span>{{ jobMatches[selectedJob].reason }}</span></div>
          <div class="job-detail-kv"><label>岗位要求</label><span>{{ jobMatches[selectedJob].requirements }}</span></div>
        </div>
      </section>

      <!-- 就业预警台账 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in employmentItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!employmentItems.length"><td colspan="3" class="empty-cell">暂无就业预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 求职行动计划（保留） -->
      <section class="warn-section">
        <h3 class="warn-section__title">求职行动计划</h3>
        <div class="action-list">
          <div v-for="(a, idx) in actionPlan" :key="idx" class="action-item">
            <span class="action-item__time">{{ a.time }}</span>
            <span class="action-item__text">{{ a.action }}</span>
            <span class="action-item__tag">{{ a.tag }}</span>
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
.employment-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 12px;
}

.sec-full { grid-column: 1 / -1; }

.warn-section {
  padding: 14px 18px;
  border-radius: 6px;
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
  margin: 0 0 12px;
  font-size: 20px;
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

  .mock-tag {
    margin-left: 4px;
    font-style: normal;
    font-size: 13px;
    padding: 1px 7px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
  }
}

/* 合并卡片内的二级小标题 */
.combine__sub {
  margin: 14px 0 8px;
  font-size: 17px;
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
    font-size: 16px;
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
  padding: 12px 14px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid #65dfff;

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }

  &__label {
    font-size: 17px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #f6fbff;

    &--small {
      font-size: 18px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.risk-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__tag {
    flex-shrink: 0;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 17px;
    font-weight: 800;
    color: #06122e;
  }

  &__text {
    font-size: 17px;
    color: #d0e8f8;
    line-height: 1.6;
  }

  &--low .risk-note__tag { background: #55e995; }
  &--medium .risk-note__tag { background: #facc15; }
  &--high .risk-note__tag { background: #ff7474; color: #fff; }
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
  padding: 8px 12px;
  border-radius: 4px;
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
  &__name { font-size: 17px; color: #b8ecff; font-weight: 700; white-space: nowrap; }
  &__badge {
    flex-shrink: 0;
    font-size: 15px;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
    white-space: nowrap;
  }
  &--low &__badge { background: rgba(85, 233, 149, 0.14); color: #55e995; }
  &--medium &__badge { background: rgba(250, 204, 21, 0.14); color: #facc15; }
  &--high &__badge { background: rgba(255, 116, 116, 0.14); color: #ff7474; }

  &__desc {
    font-size: 16px;
    color: #9ecae8;
    line-height: 1.4;
  }
}

/* 风险矩阵 + 标签 */
.risk-sub {
  font-size: 16px;
  color: #7eb4d8;
  margin-bottom: 8px;
}

.matrix-wrap {
  min-width: 0;
  height: 220px;
  :deep(.chart-container) { height: 220px; }
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
  font-size: 16px;

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

/* 求职进展流程 */
.progress-flow {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.progress-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.3);

  &__dot {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }
  &--done &__dot { background: #55e995; }
  &--active &__dot { background: #00d4ff; animation: pulse 1.4s infinite; }
  &--pending &__dot { background: #5a7d96; }

  &__name {
    font-size: 16px;
    color: #b8ecff;
    font-weight: 700;
  }

  &__value {
    font-size: 25px;
    font-weight: 900;
    color: #f6fbff;
    font-variant-numeric: tabular-nums;
  }

  &__unit {
    font-size: 14px;
    color: #7eb4d8;
    margin-left: 2px;
    font-weight: 600;
  }
}

.progress-connector {
  flex: 0 0 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b6e92;
  font-size: 21px;
  font-weight: 900;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.25); opacity: 0.7; }
}

/* Job match layout */
.job-match-layout {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
  min-height: 200px;
}

.job-match-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.job-match-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  border: 1px solid rgba(102, 217, 255, 0.06);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover { background: rgba(0, 56, 100, 0.45); }
  &.is-active {
    border-color: rgba(0, 184, 255, 0.45);
    background: rgba(0, 74, 130, 0.4);
    box-shadow: 0 0 10px rgba(0, 184, 255, 0.12);
  }

  &__rank {
    font-size: 14px;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__role {
    font-size: 17px;
    font-weight: 700;
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__match {
    font-size: 17px;
    font-weight: 900;
    white-space: nowrap;
  }
}

.job-match-detail {
  padding: 12px 14px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__role {
    font-size: 21px;
    font-weight: 800;
    color: #f6fbff;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.1);
  }

  &__meta {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  &__kv {
    padding: 6px 8px;
    border-radius: 3px;
    background: rgba(0, 56, 100, 0.35);
    display: flex;
    flex-direction: column;
    gap: 2px;

    label {
      font-size: 15px;
      color: #7eb4d8;
      font-weight: 600;
    }

    strong {
      font-size: 21px;
      font-weight: 900;
      color: #f6fbff;
    }

    span {
      font-size: 17px;
      font-weight: 700;
      color: #d0e8f8;
    }
  }

  &__section {
    label {
      display: block;
      font-size: 16px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 4px;
    }

    p {
      margin: 0;
      font-size: 16px;
      color: #c8dff0;
      line-height: 1.5;
    }
  }
}

/* Weakness */
.weakness-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.weakness-item {
  display: grid;
  grid-template-columns: 12px 100px 56px 1fr;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 16px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
  }

  &__label {
    color: #d0e8f8;
    font-weight: 700;
  }

  &__level {
    font-size: 15px;
    font-weight: 800;
  }

  &__desc {
    color: #9ecae8;
    text-align: right;
  }
}

/* Action plan */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 16px;

  &__time {
    width: 56px;
    color: #7eb4d8;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__text {
    flex: 1;
    color: #d0e8f8;
    line-height: 1.4;
  }

  &__tag {
    font-size: 17px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    flex-shrink: 0;
    min-width: 56px;
    text-align: center;
  }
}

/* Table */
.warn-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 8px 10px;
    font-size: 15px;
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
  display: inline-block;
  font-weight: 700;
  font-size: 14px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 16px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;
  display: inline-block;
  min-width: 56px;
  text-align: center;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 16px;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 15px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 17px;
    font-weight: 800;
    color: #f6fbff;
  }
}

/* ── 岗位适配雷达图 + 标签/优势/缺失能力布局 ── */
.job-radar-layout {
  display: flex;
  gap: 14px;
  align-items: stretch;
  min-height: 380px;
}

.job-radar-left {
  flex: 0 0 42%;
  min-width: 320px;
  display: flex;
  flex-direction: column;
}

.radar-chart-wrap {
  flex: 1;
  min-height: 340px;
  :deep(.chart-container) { height: 340px; }
}

.job-radar-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 推荐目标岗位标签（顶部） */
.job-tags-label {
  display: block;
  font-size: 17px;
  font-weight: 700;
  color: #b8ecff;
  margin-bottom: 8px;
}

.job-tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.job-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.15);
  cursor: pointer;
  font-size: 17px;
  font-weight: 700;
  color: #d0e8f8;
  transition: border-color 0.2s, background 0.2s;
  white-space: nowrap;

  &:hover {
    background: rgba(0, 56, 100, 0.5);
    border-color: rgba(0, 184, 255, 0.35);
  }

  &.is-active {
    border-color: rgba(0, 229, 255, 0.55);
    background: rgba(0, 74, 130, 0.45);
    color: #f6fbff;
    box-shadow: 0 0 12px rgba(0, 184, 255, 0.15);
  }

  &__rank {
    font-size: 14px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.14);
    color: #8ef6ff;
    font-weight: 700;
  }

  &__match {
    font-size: 17px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
  }
}

/* 优势 / 缺失能力区域 */
.job-ability-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.job-section-label {
  font-size: 17px;
  font-weight: 700;

  &--good { color: #55e995; }
  &--warn { color: #facc15; }
}

.job-ability-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.job-ability-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  font-size: 17px;

  &--good {
    border-left: 3px solid #55e995;
    background: rgba(52, 211, 153, 0.06);
  }

  &__name {
    color: #d0e8f8;
    font-weight: 700;
  }

  &__val {
    color: #7ff6c4;
    font-weight: 800;
    font-family: 'DIN Alternate', sans-serif;
  }
}

.job-ability-empty {
  font-size: 16px;
  color: #5a7d96;
  padding: 6px 0;
}

.job-weakness-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 5px;
}

.job-weakness-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  font-size: 17px;

  &--high { border-left: 3px solid #ff7474; }
  &--medium { border-left: 3px solid #facc15; }
  &--low { border-left: 3px solid #55e995; }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__label {
    color: #d0e8f8;
    font-weight: 700;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__level {
    font-size: 16px;
    font-weight: 800;
    flex-shrink: 0;
  }
}

/* 岗位详情行 */
.job-detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.job-detail-kv {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);

  label {
    font-size: 16px;
    color: #7eb4d8;
    font-weight: 600;
  }

  strong {
    font-size: 23px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
  }

  span {
    font-size: 17px;
    font-weight: 700;
    color: #d0e8f8;
    line-height: 1.5;
  }
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
    font-size: 16px;
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
  font-size: 17px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 17px;

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
  .employment-warning { grid-template-columns: 1fr; }
  .overview__body { flex-direction: column; align-items: center; }
  .overview__main { width: 100%; }
  .job-match-layout { grid-template-columns: 1fr; }
  .job-radar-layout { flex-direction: column; }
  .job-radar-left { flex: none; min-width: 0; }
  .radar-chart-wrap { min-height: 280px; :deep(.chart-container) { height: 280px; } }
  .job-tags-row { flex-direction: column; }
  .job-tag-chip { width: 100%; }
  .job-ability-grid { grid-template-columns: 1fr; }
  .job-weakness-list { grid-template-columns: 1fr; }
  .job-detail-row { flex-direction: column; }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .risk-tag-list { grid-template-columns: 1fr; }
  .weakness-item { grid-template-columns: 12px 80px 48px 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
