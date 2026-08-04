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
import StudentSectionNav from '../_shared/StudentSectionNav.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import AiAnalysisCard from '@/components/student/template/AiAnalysisCard.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, JobMatchVM, AttentionItemVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'

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
const levelOfAbility = (v: number): Level => (v >= 70 ? 'low' : v >= 40 ? 'medium' : 'high')

/** 准备度仪表：越高越好，绿/黄/红 */
function readinessGradient(v: number) {
  if (v >= 75) {
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
  if (v >= 50) {
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
        { offset: 0, color: '#fda4af' },
        { offset: 1, color: '#ef4444' },
      ],
    },
    solidColor: '#fb7185',
  }
}

/** 页面分区导航（点击跳转到对应模块） */
const sectionNav = [
  { id: 'sec-overview', label: '就业状态总览' },
  { id: 'sec-ability', label: '能力画像' },
  { id: 'sec-progress', label: '进展与意向' },
  { id: 'sec-risk', label: '风险原因' },
  { id: 'sec-jobradar', label: '岗位适配' },
  { id: 'sec-ledger', label: '就业预警台账' },
  { id: 'sec-action', label: '求职计划' },
]

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

/* 状态总览下方的 AI 学业分析结论（从学业基础关联就业竞争力） */
const aiAnalysis = computed(() => {
  const d = dashboard.value
  if (!d) return ''
  const gpa = d.academic.gpa
  const intern = d.internship?.internshipCount ?? 0
  const proj = d.internship?.projectCount ?? 0
  return `该生就业风险等级为「${employmentLevelText.value}」，就业准备度 ${jobReadiness.value}。当前 GPA ${gpa.toFixed(2)}，实习 ${intern} 段、项目 ${proj} 项；学业基础${gpa >= 3 ? '扎实' : '需夯实'}。建议同步提升专业成绩与企业实践，增强岗位竞争力。`
})

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

const readinessGaugeOption = computed<EChartsOption>(() => {
  const v = Number(jobReadiness.value) || 0
  const { progressColor, solidColor } = readinessGradient(v)
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
          formatter: (n: number) => `{num|${Number(n).toFixed(n % 1 === 0 ? 0 : 1)}}`,
          rich: {
            num: {
              fontSize: CHART_FONT.gaugeCompact + 16,
              fontFamily: 'DIN Alternate, Segoe UI, sans-serif',
              fontWeight: 900,
              color: '#ffffff',
              textShadowColor: solidColor,
              textShadowBlur: 22,
              lineHeight: 46,
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
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(4, 16, 40, 0.94)',
    borderColor: 'rgba(0, 212, 255, 0.4)',
    textStyle: { color: '#e8f7ff', fontSize: 18 },
  },
  radar: {
    center: ['50%', '50%'],
    radius: '72%',
    indicator: [
      { name: '专业能力', max: 100 },
      { name: '项目经历', max: 100 },
      { name: '实习经历', max: 100 },
      { name: '技能证书', max: 100 },
      { name: '面试能力', max: 100 },
    ],
    axisName: {
      color: '#e8f7ff',
      fontSize: 18,
      fontWeight: 800,
      padding: [8, 10],
      textShadowColor: 'rgba(0, 40, 80, 0.9)',
      textShadowBlur: 6,
    },
    splitNumber: 4,
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)', width: 1.2 } },
    splitArea: {
      areaStyle: {
        color: ['rgba(0,184,255,0.03)', 'rgba(0,184,255,0.09)', 'rgba(0,184,255,0.03)', 'rgba(0,184,255,0.14)'],
      },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.28)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: abilityRadarValues.value,
      name: '就业能力',
      symbol: 'circle',
      symbolSize: 10,
      areaStyle: {
        color: {
          type: 'radial', x: 0.5, y: 0.5, r: 0.75,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.52)' },
            { offset: 1, color: 'rgba(0, 160, 255, 0.05)' },
          ],
        },
      },
      lineStyle: { color: '#5ee7ff', width: 3.2, shadowBlur: 18, shadowColor: 'rgba(0,220,255,0.75)' },
      itemStyle: {
        color: '#fff',
        borderColor: '#00e5ff',
        borderWidth: 2.5,
        shadowBlur: 14,
        shadowColor: 'rgba(0,220,255,0.8)',
      },
    }],
  }],
}))

/** 岗位适配雷达：居中铺满，轴名加大 */
const jobFitRadarOption = computed<EChartsOption>(() => {
  const base = abilityRadarOption.value
  const radar = (base.radar ?? {}) as Record<string, unknown>
  return {
    ...base,
    radar: {
      ...radar,
      center: ['50%', '50%'],
      radius: '68%',
      axisName: {
        color: '#e8f7ff',
        fontSize: 20,
        fontWeight: 800,
        padding: [10, 12],
        textShadowColor: 'rgba(0, 40, 80, 0.9)',
        textShadowBlur: 6,
      },
    },
  }
})

const abilityFactorList = computed(() => {
  const names = ['专业能力', '项目经历', '实习经历', '技能证书', '面试能力']
  const tips = [
    (s: number) => (s >= 70 ? '专业基础扎实' : s >= 40 ? '专业尚可' : '专业偏弱'),
    (s: number) => (s >= 70 ? '项目积累充足' : s >= 40 ? '项目偏少' : '项目严重不足'),
    (s: number) => (s >= 70 ? '实习经验充分' : s >= 40 ? '实习偏少' : '缺少实习'),
    (s: number) => (s >= 70 ? '证书储备良好' : s >= 40 ? '证书一般' : '证书不足'),
    (s: number) => (s >= 70 ? '面试准备充分' : s >= 40 ? '面试待加强' : '面试经验少'),
  ]
  return abilityRadarValues.value.map((v, i) => {
    const score = Math.round(v)
    const level = levelOfAbility(score)
    return {
      name: names[i],
      score,
      level,
      tip: tips[i](score),
      desc: `评分 ${score}/100`,
      tone: LEVEL_COLOR[level],
    }
  })
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
    mk('项目经验不足', Math.max(20, 88 - proj * 24) + 8, 66),
    mk('简历准备不足', resumeBad ? 72 : 32, resumeBad ? 60 : 28),
    mk('技能匹配不足', Math.max(20, 92 - certR) - 4, 58),
  ]
})

const riskMatrixOption = computed<EChartsOption>(() => {
  const labelPos = ['top', 'bottom', 'left', 'right'] as const
  return {
    grid: { top: 40, bottom: 48, left: 58, right: 48, containLabel: false },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(0, 212, 255, 0.45)',
      textStyle: { color: '#e8f7ff', fontSize: 18 },
      extraCssText: 'border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.45);',
      formatter: (params: unknown) => {
        const p = params as { data: { name: string; value: number[] } }
        return `<b style="color:#8ef6ff;font-size:18px">${p.data.name}</b><br/>发生可能性：<b style="color:#7ff6ff">${p.data.value[0]}</b><br/>影响程度：<b style="color:#7ff6ff">${p.data.value[1]}</b>`
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '可能性 →',
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { color: '#c8f0ff', fontSize: 18, fontWeight: 800 },
      axisLabel: { ...AXIS_LABEL, fontSize: 17, color: '#9ec7e0', fontWeight: 700 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)', type: 'dashed' } },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.3)' } },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      name: '影响程度',
      nameLocation: 'middle',
      nameGap: 38,
      nameTextStyle: { color: '#c8f0ff', fontSize: 18, fontWeight: 800 },
      axisLabel: { ...AXIS_LABEL, fontSize: 17, color: '#9ec7e0', fontWeight: 700 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.1)', type: 'dashed' } },
    },
    series: [{
      type: 'scatter',
      data: riskMatrix.value.map((r, idx) => ({
        name: r.name,
        value: [r.x, r.y],
        symbolSize: 26 + (r.x + r.y) / 12,
        itemStyle: {
          color: {
            type: 'radial', x: 0.35, y: 0.3, r: 0.85,
            colorStops: [
              { offset: 0, color: '#ffffff' },
              { offset: 0.28, color: LEVEL_COLOR[r.level] },
              { offset: 1, color: LEVEL_COLOR[r.level] },
            ],
          },
          opacity: 0.95,
          shadowBlur: 16,
          shadowColor: `${LEVEL_COLOR[r.level]}aa`,
        },
        label: {
          show: true,
          formatter: r.name,
          position: labelPos[idx % labelPos.length],
          color: '#e8f7ff',
          fontSize: 16,
          fontWeight: 800,
          distance: 12,
          textShadowColor: 'rgba(0,0,0,0.75)',
          textShadowBlur: 8,
        },
      })),
      markArea: {
        silent: true,
        data: [[
          {
            xAxis: 50,
            yAxis: 50,
            itemStyle: { color: 'rgba(255, 116, 116, 0.08)' },
            label: {
              show: true,
              position: 'insideTopRight',
              formatter: '高风险区',
              color: 'rgba(255, 160, 160, 0.8)',
              fontSize: 16,
              fontWeight: 800,
            },
          },
          { xAxis: 100, yAxis: 100 },
        ]],
      },
    }],
  }
})

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
      <StudentSectionNav :items="sectionNav" />

      <!-- 1. 就业状态总览 -->
      <section id="sec-overview" class="warn-section sec-full overview">
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

      <!-- 状态总览下方：AI 学业分析 -->
      <AiAnalysisCard title="AI 就业分析" :text="aiAnalysis" class="sec-full" />

      <!-- 3. 就业能力画像 + 求职进展/意向（并排） -->
      <section id="sec-ability" class="warn-section ability-panel">
        <h3 class="warn-section__title">就业能力画像</h3>
        <div class="ability-panel__body">
          <div class="ability-panel__radar">
            <ChartContainer :option="abilityRadarOption" />
          </div>
          <div class="meter-list">
            <div
              v-for="f in abilityFactorList"
              :key="f.name"
              class="meter"
              :style="{ '--tone': f.tone }"
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

      <section id="sec-progress" class="warn-section">
        <h3 class="warn-section__title">求职进展与就业意向</h3>
        <h4 class="combine__sub">求职进展跟踪</h4>
        <div class="progress-flow">
          <template v-for="(s, i) in jobProgress" :key="s.name">
            <div class="progress-step" :class="`progress-step--${s.status}`">
              <span class="progress-step__dot" />
              <span class="progress-step__name">{{ s.name }}</span>
              <span class="progress-step__value">{{ s.value }}<span class="progress-step__unit">{{ s.unit }}</span></span>
            </div>
            <span v-if="i < jobProgress.length - 1" class="progress-connector" aria-hidden="true" />
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

      <!-- 4. 就业风险原因分析 -->
      <section id="sec-risk" class="warn-section sec-full risk-panel">
        <h3 class="warn-section__title">就业风险原因分析</h3>
        <p class="risk-sub">风险矩阵 · 横轴=发生可能性 · 纵轴=影响程度 · 越靠右上风险越高</p>
        <div class="risk-layout">
          <div class="matrix-wrap">
            <ChartContainer :option="riskMatrixOption" />
          </div>
          <div class="risk-tag-list">
            <div
              v-for="r in riskMatrix"
              :key="r.name"
              class="risk-tag"
              :class="`risk-tag--${r.level}`"
              :style="{ '--tone': levelColor(r.level) }"
            >
              <div class="risk-tag__head">
                <span class="risk-tag__name">{{ r.name }}</span>
                <span class="risk-tag__val">{{ levelText(r.level) }}</span>
              </div>
              <div class="risk-tag__bars">
                <div class="risk-tag__bar">
                  <span>可能性</span>
                  <i><em :style="{ width: `${r.x}%` }" /></i>
                  <b>{{ r.x }}</b>
                </div>
                <div class="risk-tag__bar">
                  <span>影响度</span>
                  <i><em :style="{ width: `${r.y}%` }" /></i>
                  <b>{{ r.y }}</b>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 岗位适配雷达图 + 推荐目标岗位 / 优势 / 缺失能力 -->
      <section id="sec-jobradar" class="warn-section sec-full job-fit-panel">
        <h3 class="warn-section__title">岗位适配雷达图 <i class="mock-tag">模拟数据</i></h3>
        <div class="job-radar-layout">
          <div class="job-radar-left">
            <div class="radar-chart-wrap">
              <ChartContainer :option="jobFitRadarOption" />
            </div>
          </div>
          <div class="job-radar-right">
            <div v-if="jobMatches.length" class="job-tags-top">
              <label class="job-tags-label">推荐目标岗位</label>
              <div class="job-tags-row">
                <button
                  v-for="(job, idx) in jobMatches.slice(0, 4)"
                  :key="idx"
                  type="button"
                  class="job-tag-chip"
                  :class="{ 'is-active': selectedJob === idx }"
                  @click="selectedJob = idx"
                >
                  <span class="job-tag-chip__rank">TOP{{ idx + 1 }}</span>
                  <span class="job-tag-chip__role">{{ job.role }}</span>
                  <strong
                    class="job-tag-chip__match"
                    :style="{ color: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }"
                  >{{ job.match }}%</strong>
                </button>
              </div>
            </div>
            <div class="job-ability-section">
              <label class="job-section-label job-section-label--good">优势能力</label>
              <div class="job-ability-grid">
                <div
                  v-for="f in abilityFactorList.filter((a) => a.level === 'low')"
                  :key="f.name"
                  class="job-ability-chip job-ability-chip--good"
                >
                  <span class="job-ability-chip__name">{{ f.name }}</span>
                  <span class="job-ability-chip__val">{{ f.score }}/100</span>
                </div>
                <div v-if="!abilityFactorList.filter((a) => a.level === 'low').length" class="job-ability-empty">
                  暂无突出优势
                </div>
              </div>
            </div>
            <div class="job-ability-section">
              <label class="job-section-label job-section-label--warn">缺失能力</label>
              <div class="job-weakness-list">
                <div
                  v-for="(w, idx) in weaknesses"
                  :key="idx"
                  class="job-weakness-chip"
                  :class="`job-weakness-chip--${w.level}`"
                  :style="{ '--tone': levelColor(w.level) }"
                >
                  <span class="job-weakness-chip__label">{{ w.label }}</span>
                  <span class="job-weakness-chip__level">
                    {{ { low: '良好', medium: '需关注', high: '短板' }[w.level] }}
                  </span>
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
      <section id="sec-ledger" class="warn-section">
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
      <section id="sec-action" class="warn-section">
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

.warn-section__title {
  margin: 0 0 14px;
  font-size: 26px;
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);

  &::before {
    content: '';
    width: 4px;
    height: 16px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }

  .mock-tag {
    margin-left: 4px;
    font-style: normal;
    font-size: 14px;
    padding: 3px 10px;
    border-radius: 6px;
    background: rgba(0, 184, 255, 0.12);
    border: 1px solid rgba(0, 184, 255, 0.28);
    color: #8ef6ff;
    font-weight: 700;
  }
}

/* 合并卡片内的二级小标题 */
.combine__sub {
  margin: 14px 0 10px;
  font-size: 18px;
  font-weight: 800;
  color: #b8ecff;
  letter-spacing: 0.03em;

  &:first-of-type { margin-top: 0; }
}

/* 1. 总览 */
.overview__body {
  display: flex;
  gap: 18px;
  align-items: stretch;
}

.overview__gauge {
  width: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  :deep(.chart-container) { width: 200px; height: 168px; }

  &-cap {
    margin-top: -2px;
    font-size: 15px;
    color: #8fc4e4;
    font-weight: 650;
    letter-spacing: 0.06em;
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
    animation: ewKpiSweep 5.5s ease-in-out infinite;
    pointer-events: none;
  }

  &--low { border-left-color: #55e995; }
  &--medium { border-left-color: #facc15; }
  &--high { border-left-color: #ff7474; }

  &__label {
    font-size: 17px;
    color: #8fc4e4;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  &__value {
    font-size: 32px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', 'Segoe UI', sans-serif;
    line-height: 1.2;
    text-shadow: 0 0 12px rgba(80, 200, 255, 0.35);

    &--small {
      font-size: 20px;
      line-height: 1.35;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-family: inherit;
    }
  }
}

@keyframes ewKpiSweep {
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
    padding: 5px 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 800;
    color: #06122e;
    letter-spacing: 0.04em;
  }

  &__text {
    font-size: 17px;
    color: #d0e8f8;
    line-height: 1.55;
  }

  &--low .risk-note__tag { background: #55e995; box-shadow: 0 0 12px rgba(85, 233, 149, 0.35); }
  &--medium .risk-note__tag { background: #facc15; box-shadow: 0 0 12px rgba(250, 204, 21, 0.3); }
  &--high .risk-note__tag { background: #ff7474; color: #fff; box-shadow: 0 0 12px rgba(255, 116, 116, 0.35); }
}

/* 能力画像：大雷达 + 指数条 */
.ability-panel__body {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 14px;
  align-items: stretch;
  min-height: 360px;
}

.ability-panel__radar {
  min-width: 0;
  min-height: 360px;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse at 50% 50%, rgba(0, 200, 255, 0.12), transparent 65%);
  border: 1px solid rgba(102, 217, 255, 0.12);
  :deep(.chart-container) {
    width: 100%;
    height: 360px;
  }
}

.meter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  width: 100%;
  height: 100%;
}

.meter {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 12px 14px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 80, 140, 0.28), rgba(4, 18, 42, 0.55));
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-left: 4px solid var(--tone);
  box-shadow: inset 0 0 16px rgba(0, 140, 220, 0.08);

  &__head {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  &__name {
    font-size: 18px;
    font-weight: 800;
    color: #e8f7ff;
  }

  &__badge {
    font-size: 14px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent);
  }

  &__score {
    font-size: 24px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    color: var(--tone);
    min-width: 36px;
    text-align: right;
    text-shadow: 0 0 12px color-mix(in srgb, var(--tone) 50%, transparent);
  }

  &__track {
    height: 8px;
    border-radius: 999px;
    background: rgba(101, 146, 183, 0.22);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 55%, #06203a), var(--tone));
      box-shadow: 0 0 12px color-mix(in srgb, var(--tone) 55%, transparent);
    }
  }

  &__tip {
    margin: 8px 0 0;
    font-size: 15px;
    color: rgba(184, 220, 245, 0.82);
    font-weight: 650;
  }
}

/* legacy */
.radar-wrap {
  height: 280px;
  :deep(.chart-container) { height: 280px; }
}

.factor-list {
  display: none;
}

/* 风险矩阵 + 侧栏指标卡 */
.risk-sub {
  margin: -4px 0 14px;
  font-size: 17px;
  color: #9ecae8;
  font-weight: 650;
}

.risk-layout {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: stretch;
  min-height: 420px;
}

.matrix-wrap {
  min-width: 0;
  min-height: 420px;
  height: 100%;
  align-self: stretch;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(ellipse at 70% 30%, rgba(255, 100, 100, 0.1), transparent 55%),
    linear-gradient(145deg, rgba(0, 50, 100, 0.18), rgba(4, 14, 36, 0.35));
  border: 1px solid rgba(102, 217, 255, 0.12);
  overflow: hidden;

  :deep(.chart-container) {
    flex: 1;
    width: 100%;
    height: 100%;
    min-height: 420px;
  }
}

.risk-tag-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  height: 100%;
  align-self: stretch;
}

.risk-tag {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 80, 140, 0.26), rgba(4, 18, 42, 0.55));
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-left: 4px solid var(--tone);
  box-shadow: inset 0 0 18px rgba(0, 140, 220, 0.06);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &__name {
    font-size: 24px;
    color: #f0f9ff;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  &__val {
    flex-shrink: 0;
    font-size: 18px;
    font-weight: 800;
    padding: 5px 14px;
    border-radius: 6px;
    color: var(--tone);
    background: color-mix(in srgb, var(--tone) 16%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone) 35%, transparent);
  }

  &__bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__bar {
    display: grid;
    grid-template-columns: 78px 1fr 48px;
    align-items: center;
    gap: 12px;

    span {
      font-size: 20px;
      color: #b8ecff;
      font-weight: 750;
    }

    i {
      height: 12px;
      border-radius: 999px;
      background: rgba(101, 146, 183, 0.24);
      overflow: hidden;
    }

    em {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, color-mix(in srgb, var(--tone) 50%, #06203a), var(--tone));
      box-shadow: 0 0 10px color-mix(in srgb, var(--tone) 50%, transparent);
    }

    b {
      font-size: 24px;
      font-weight: 900;
      font-family: 'DIN Alternate', sans-serif;
      color: var(--tone);
      text-align: right;
      text-shadow: 0 0 10px color-mix(in srgb, var(--tone) 45%, transparent);
    }
  }
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
  gap: 8px;
  padding: 14px 10px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 90, 160, 0.22), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.14);
  box-shadow: inset 0 0 16px rgba(0, 140, 220, 0.06);

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.55);
  }
  &--done &__dot { background: #55e995; box-shadow: 0 0 10px rgba(85, 233, 149, 0.55); }
  &--active &__dot { background: #00d4ff; animation: pulse 1.4s infinite; }
  &--pending &__dot { background: #5a7d96; box-shadow: none; }

  &__name {
    font-size: 16px;
    color: #b8ecff;
    font-weight: 800;
  }

  &__value {
    font-size: 30px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 12px rgba(80, 200, 255, 0.3);
  }

  &__unit {
    font-size: 13px;
    color: #7eb4d8;
    margin-left: 2px;
    font-weight: 600;
    font-family: inherit;
  }
}

.progress-connector {
  flex: 0 0 20px;
  position: relative;
  align-self: center;

  &::before {
    content: '';
    position: absolute;
    left: 2px;
    right: 2px;
    top: 50%;
    height: 2px;
    background: linear-gradient(90deg, rgba(0, 212, 255, 0.15), rgba(0, 212, 255, 0.55), rgba(0, 212, 255, 0.15));
    transform: translateY(-50%);
  }

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    width: 0;
    height: 0;
    border-top: 4px solid transparent;
    border-bottom: 4px solid transparent;
    border-left: 6px solid rgba(0, 212, 255, 0.55);
    transform: translateY(-50%);
  }
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
    font-size: 20px;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__role {
    font-size: 23px;
    font-weight: 700;
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__match {
    font-size: 23px;
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
    font-size: 27px;
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
      font-size: 21px;
      color: #7eb4d8;
      font-weight: 600;
    }

    strong {
      font-size: 27px;
      font-weight: 900;
      color: #f6fbff;
    }

    span {
      font-size: 23px;
      font-weight: 700;
      color: #d0e8f8;
    }
  }

  &__section {
    label {
      display: block;
      font-size: 22px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 4px;
    }

    p {
      margin: 0;
      font-size: 22px;
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
  font-size: 22px;

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
    font-size: 21px;
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
  gap: 10px;
  height: 100%;
}

.action-item {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 80, 140, 0.26), rgba(4, 18, 42, 0.52));
  border: 1px solid rgba(102, 217, 255, 0.14);
  font-size: 17px;

  &__time {
    width: 64px;
    color: #9ecae8;
    font-weight: 800;
    flex-shrink: 0;
    font-size: 16px;
  }

  &__text {
    flex: 1;
    color: #e8f4ff;
    line-height: 1.45;
    font-weight: 650;
  }

  &__tag {
    font-size: 14px;
    padding: 4px 12px;
    border-radius: 6px;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.32);
    color: #8ef6ff;
    font-weight: 800;
    flex-shrink: 0;
    min-width: 52px;
    text-align: center;
  }
}

/* Table */
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
  font-size: 17px;
  color: rgba(184, 236, 255, 0.92);

  th {
    text-align: left;
    padding: 14px 16px;
    font-size: 16px;
    font-weight: 800;
    color: #b8ecff;
    letter-spacing: 0.04em;
    background: rgba(0, 60, 110, 0.4);
    border-bottom: 1px solid rgba(102, 217, 255, 0.18);
    white-space: nowrap;
  }

  td {
    padding: 14px 16px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.07);
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
  display: inline-block;
  font-weight: 750;
  font-size: 14px;
  padding: 4px 10px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.22);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 15px;
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 800;
  display: inline-block;
  min-width: 60px;
  text-align: center;

  &--low { background: rgba(74, 222, 128, 0.14); color: #55e995; border: 1px solid rgba(74, 222, 128, 0.28); }
  &--medium { background: rgba(250, 204, 21, 0.14); color: #facc15; border: 1px solid rgba(250, 204, 21, 0.28); }
  &--high { background: rgba(248, 91, 91, 0.14); color: #ff7474; border: 1px solid rgba(248, 91, 91, 0.28); }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 14px;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(0, 70, 130, 0.22), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__label {
    font-size: 15px;
    color: #8fc4e4;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  &__value {
    font-size: 20px;
    font-weight: 800;
    color: #f6fbff;
  }
}

/* ── 岗位适配雷达图 + 标签/优势/缺失能力布局 ── */
.job-radar-layout {
  display: flex;
  gap: 18px;
  align-items: stretch;
  min-height: 440px;
}

.job-radar-left {
  flex: 0 0 44%;
  min-width: 340px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background:
    radial-gradient(ellipse at 50% 45%, rgba(0, 200, 255, 0.12), transparent 60%),
    linear-gradient(145deg, rgba(0, 50, 100, 0.18), rgba(4, 14, 36, 0.35));
  border: 1px solid rgba(102, 217, 255, 0.14);
  overflow: hidden;
}

.radar-chart-wrap {
  flex: 1;
  min-height: 420px;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  :deep(.chart-container) {
    width: 100%;
    height: 420px;
  }
}

.job-radar-right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.job-tags-label {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #c8f0ff;
  margin-bottom: 12px;
  letter-spacing: 0.04em;
}

.job-tags-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.job-tag-chip {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 80, 150, 0.3), rgba(4, 18, 42, 0.55));
  border: 1px solid rgba(102, 217, 255, 0.18);
  cursor: pointer;
  font-size: 20px;
  font-weight: 800;
  color: #e8f7ff;
  text-align: left;
  transition: border-color 0.2s, background 0.2s, box-shadow 0.2s, transform 0.15s;

  &:hover {
    background: rgba(0, 56, 100, 0.55);
    border-color: rgba(0, 184, 255, 0.4);
    transform: translateY(-1px);
  }

  &.is-active {
    border-color: rgba(0, 229, 255, 0.6);
    background: linear-gradient(145deg, rgba(0, 100, 170, 0.4), rgba(0, 50, 100, 0.55));
    color: #f6fbff;
    box-shadow: 0 0 18px rgba(0, 184, 255, 0.22);
  }

  &__rank {
    font-size: 15px;
    padding: 4px 10px;
    border-radius: 6px;
    background: rgba(0, 184, 255, 0.16);
    border: 1px solid rgba(0, 184, 255, 0.3);
    color: #8ef6ff;
    font-weight: 800;
  }

  &__role {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__match {
    font-size: 26px;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 10px currentColor;
  }
}

.job-ability-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.job-section-label {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.04em;

  &--good { color: #55e995; }
  &--warn { color: #facc15; }
}

.job-ability-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.job-ability-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(20, 90, 70, 0.28), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(85, 233, 149, 0.28);
  border-left: 4px solid #55e995;

  &__name {
    font-size: 22px;
    color: #e8fff4;
    font-weight: 800;
  }

  &__val {
    font-size: 28px;
    color: #7ff6c4;
    font-weight: 900;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 12px rgba(85, 233, 149, 0.4);
  }
}

.job-ability-empty {
  font-size: 18px;
  color: #5a7d96;
  padding: 10px 0;
}

.job-weakness-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.job-weakness-chip {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 70, 130, 0.22), rgba(4, 18, 42, 0.5));
  border: 1px solid rgba(102, 217, 255, 0.14);
  border-left: 4px solid var(--tone, #facc15);

  &__label {
    font-size: 22px;
    color: #e8f4ff;
    font-weight: 800;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__level {
    font-size: 18px;
    font-weight: 800;
    flex-shrink: 0;
    color: var(--tone, #facc15);
    padding: 5px 14px;
    border-radius: 6px;
    background: color-mix(in srgb, var(--tone, #facc15) 14%, transparent);
    border: 1px solid color-mix(in srgb, var(--tone, #facc15) 30%, transparent);
  }
}

/* 岗位详情行 */
.job-detail-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.job-detail-kv {
  flex: 1;
  min-width: 160px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 16px 18px;
  min-height: 88px;
  border-radius: 10px;
  background: linear-gradient(145deg, rgba(0, 80, 140, 0.26), rgba(4, 18, 42, 0.52));
  border: 1px solid rgba(102, 217, 255, 0.14);

  label {
    font-size: 16px;
    color: #9ecae8;
    font-weight: 750;
    letter-spacing: 0.04em;
  }

  strong {
    font-size: 32px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
    text-shadow: 0 0 12px rgba(80, 200, 255, 0.3);
  }

  span {
    font-size: 18px;
    font-weight: 700;
    color: #e2f4ff;
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
    padding: 9px 20px;
    border-radius: 8px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: linear-gradient(145deg, rgba(0, 113, 206, 0.22), rgba(0, 40, 80, 0.45));
    color: #8ef6ff;
    font-size: 15px;
    font-weight: 750;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 212, 255, 0.55);
      box-shadow: 0 0 16px rgba(0, 160, 255, 0.15);
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
  font-size: 23px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 23px;

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
  .ability-panel__body { grid-template-columns: 1fr; }
  .ability-panel__radar {
    min-height: 320px;
    :deep(.chart-container) { height: 320px; }
  }
  .risk-layout { grid-template-columns: 1fr; }
  .matrix-wrap {
    min-height: 360px;
    :deep(.chart-container) { min-height: 360px; height: 100%; }
  }
  .job-match-layout { grid-template-columns: 1fr; }
  .job-radar-layout { flex-direction: column; }
  .job-radar-left { flex: none; min-width: 0; }
  .radar-chart-wrap { min-height: 340px; :deep(.chart-container) { height: 340px; } }
  .job-tags-row { grid-template-columns: 1fr; }
  .job-ability-grid { grid-template-columns: 1fr; }
  .job-weakness-list { grid-template-columns: 1fr; }
  .job-detail-row { flex-direction: column; }
  .info-grid { grid-template-columns: 1fr 1fr; }
  .weakness-item { grid-template-columns: 12px 80px 48px 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
