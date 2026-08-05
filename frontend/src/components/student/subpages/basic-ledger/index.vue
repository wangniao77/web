<script setup lang="ts">
/**
 * 学生基础信息台账详情页（二级页面）
 *
 * 路由：/student/basic-ledger
 * 入口：一级页面左侧「学生基础信息台账」卡片中点击「基础信息台账 ›」按钮
 *
 * 内容：学籍档案全量 + 管理与帮扶状态 + 家庭信息 + 预警信息详细展示
 * 不放学期课表
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import { useScope } from '@/composables/useScope'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { dashboardToBasicSheets } from '@/utils/studentDashboardExport'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

/** 家长信息拆分：父亲、母亲、其他联系人 */
interface GuardianItem { name: string; phone: string }
const fatherInfo = computed<GuardianItem>(() => {
  const d = dashboard.value
  // 优先使用守约人（保守假设为父亲）；familySituation 或 familyMembers 里若明确标注再调整
  const isSingle = /单亲|离异|丧父|亡父/.test(d?.profile.familySituation ?? '')
  return { name: isSingle ? '—' : (d?.profile.guardianName || '—'), phone: isSingle ? '—' : (d?.profile.guardianPhone || '—') }
})
const motherInfo = computed<GuardianItem>(() => {
  const d = dashboard.value
  const isSingle = /单亲|离异|丧母|亡母/.test(d?.profile.familySituation ?? '')
  if (isSingle) return { name: '—', phone: '—' }
  // 母亲信息暂从家庭成员中提取，否则留空
  const momMember = (d?.profile.familyMembers ?? []).find((m) => /母|妈妈/.test(m))
  return { name: momMember || '—', phone: '—' }
})
const otherGuardianInfo = computed<GuardianItem>(() => {
  const d = dashboard.value
  // 其他联系人用于补充监护人信息，留空让用户按需填写
  return { name: '', phone: '' }
})
const isOrphanOrSingleParent = computed(() => {
  const s = dashboard.value?.profile.familySituation ?? ''
  return /孤儿|单亲|离异|丧父|丧母|亡父|亡母/.test(s)
})

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
useStudentDashboardExport('基础信息台账', dashboard, dashboardToBasicSheets)
const error = ref<string | null>(null)
const showTodayTodo = ref(true)
const expandSafeWarnings = ref(true)

const todayTodos = computed(() => {
  const d = dashboard.value
  if (!d) return [] as TodoItem[]
  const list: TodoItem[] = []
  const high = d.attention.filter((a) => a.level === 'high').slice(0, 2)
  high.forEach((a) => list.push({
    text: `跟进预警：${a.label}`,
    tone: 'high',
    actionLabel: '查看详情',
    to: warningRouteOf(a),
  }))
  if (d.failedCritical.length) {
    list.push({
      text: `核对挂科补考：${d.failedCritical[0]?.name || '不及格科目'}`,
      tone: 'high',
      actionLabel: '去学业预警',
      to: { name: 'student-academic-warning', query: { studentId: activeStudentId.value } },
    })
  }
  if (list.length < 2) {
    list.push({
      text: '约谈一次并回填帮扶记录',
      tone: 'medium',
      actionLabel: '去帮扶台账',
      to: { name: 'student-academic-detail', query: { studentId: activeStudentId.value } },
    })
  }
  if (list.length < 3) {
    list.push({
      text: '核对本周课表与出勤异常',
      tone: 'medium',
      actionLabel: '去出勤跟进',
      to: { name: 'student-academic-detail', query: { studentId: activeStudentId.value } },
    })
  }
  return list.slice(0, 3)
})

interface TodoItem {
  text: string
  tone: 'high' | 'medium'
  actionLabel: string
  to: { name: string; query: { studentId: string | undefined } }
}

function warningRouteOf(a: AttentionItemVM): TodoItem['to'] {
  const label = `${a.category}${a.label}`
  if (/心理|健康|体测/.test(label)) return { name: 'student-psy-warning', query: { studentId: activeStudentId.value } }
  if (/就业|实习|职业/.test(label)) return { name: 'student-employment-warning', query: { studentId: activeStudentId.value } }
  return { name: 'student-academic-warning', query: { studentId: activeStudentId.value } }
}

function handleTodo(t: TodoItem) {
  router.push(t.to as never)
}

const allDynamics = computed(() => {
  return dashboard.value?.profile.recentDynamics ?? []
})

const growthTrendTip = computed(() => {
  const t = dashboard.value?.profile.growthTrend
  if (t === 'stable') return 'GPA稳步提升、无挂科'
  if (t === 'positive') return '成绩稳步上升，表现良好'
  return '成绩出现波动，请关注最近成绩变化'
})

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

type RiskLevel = 'low' | 'medium' | 'high'
const riskWeight: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
const riskText: Record<RiskLevel, string> = { low: '正常', medium: '需关注', high: '高危' }

function highestLevel(pattern: RegExp, items: AttentionItemVM[]): RiskLevel {
  return items
    .filter((item) => pattern.test(`${item.category}${item.label}`))
    .reduce<RiskLevel>((highest, item) => (
      riskWeight[item.level] > riskWeight[highest] ? item.level : highest
    ), 'low')
}

function detailFor(pattern: RegExp, items: AttentionItemVM[], fallback: string) {
  const hit = items.find((item) => pattern.test(`${item.category}${item.label}`))
  return hit?.label || fallback
}

const warningCards = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.attention
  const psychological = dashboard.value.profile.mentalLevelCode ?? highestLevel(/心理|健康|体测/, items)
  const academic = highestLevel(/学业|课程|挂科|GPA|补考/, items)
  const employment = highestLevel(/就业|实习|职业/, items)

  return [
    {
      label: '心理预警',
      icon: 'mental' as IconKind,
      level: psychological,
      conclusion: dashboard.value.profile.mentalLevel || riskText[psychological],
      tip: `反映心理关注侧风险（绿=正常，黄=需关注，红=高危）。${detailFor(/心理|健康|体测/, items, '当前结论见下方文字')}`,
      items: items.filter((i) => /心理|健康|体测/.test(`${i.category}${i.label}`)),
    },
    {
      label: '学业预警',
      icon: 'academic' as IconKind,
      level: academic,
      conclusion: riskText[academic],
      tip: `反映挂科、GPA 等学业风险（绿=正常，黄=需关注，红=高危）。${detailFor(/学业|课程|挂科|GPA|补考/, items, academic === 'low' ? '无挂科，仅需完成常规期末考核' : '请查看预警台账与补考安排')}`,
      items: items.filter((i) => /学业|课程|挂科|GPA|补考/.test(`${i.category}${i.label}`)),
    },
    {
      label: '就业预警',
      icon: 'employment' as IconKind,
      level: employment,
      conclusion: riskText[employment],
      tip: `反映实习就业准备不足风险（绿=正常，黄=需关注，红=高危）。${detailFor(/就业|实习|职业/, items, employment === 'low' ? '就业填报待完善，暂无高危信号' : '关注实习与岗位匹配短板')}`,
      items: items.filter((i) => /就业|实习|职业/.test(`${i.category}${i.label}`)),
    },
  ]
})

const allAttention = computed(() => {
  if (!dashboard.value) return []
  return dashboard.value.attention
})

function goWarningDetail(label: string) {
  const map: Record<string, string> = {
    '心理预警': 'student-psy-warning',
    '学业预警': 'student-academic-warning',
    '就业预警': 'student-employment-warning',
  }
  const name = map[label]
  if (name) {
    router.push({ name, query: { studentId: activeStudentId.value } })
  }
}

/** 明细表格中每条预警，按语义命中「最贴近」的问题台账并跳转 */
function goAttentionDetail(item: AttentionItemVM) {
  const text = `${item.category}${item.label}`
  let name = 'student-academic-warning'
  if (/心理|健康|体测|心理分级/.test(text)) name = 'student-psy-warning'
  else if (/挂科|不及格|补考|重修/.test(text)) name = 'student-fail-detail'
  else if (/学分/.test(text)) name = 'student-credit-progress'
  else if (/就业|实习|职业|实践/.test(text)) name = 'student-employment-warning'
  else if (/学业|GPA|成绩|课程/.test(text)) name = 'student-academic-warning'
  router.push({ name, query: { studentId: activeStudentId.value } })
}

/**
 * 根据标签云文字命中「最贴近」的二级页面。
 * 匹配顺序按语义优先级由强到弱，确保荣誉/竞赛/心理/就业/学业等各自落到对应专题页，
 * 而非全部收口到综合台账。
 */
type TagTarget = { name: string; query?: Record<string, string> }
function holoTagTarget(text: string): TagTarget | null {
  const t = text || ''
  const sid = { studentId: activeStudentId.value }

  // 1. 处分 / 违纪 / 纪律 / 诚信 → 综合素养台账（纪律标签页）
  if (/处分|违纪|纪律|通报|诚信|警示/.test(t)) {
    return { name: 'student-comprehensive-ledger', query: { ...sid, focus: 'discipline' } }
  }
  // 2. 竞赛 → 综合素养台账（荣誉标签页）
  if (/竞赛/.test(t)) {
    return { name: 'student-comprehensive-ledger', query: { ...sid, focus: 'reward' } }
  }
  // 3. 获奖 / 成果 / 荣誉 / 论文 / 专利 / 科研 / 奖学金 → 奖励荣誉画像（最贴近）
  if (/获奖|成果|荣誉|论文|专利|科研|奖学金|奖学金情况|奖励/.test(t)) {
    return { name: 'student-reward-aid-ledger', query: sid }
  }
  // 4. 心理 / 健康 / 体测 / 情绪 / 压力 / 焦虑 / 抑郁 → 心理预警
  if (/心理|健康|体测|情绪|压力|焦虑|抑郁/.test(t)) {
    return { name: 'student-psy-warning', query: sid }
  }
  // 4. 学业 / 课程 / 挂科 / 补考 / 不及格 / 成绩 → 学业预警（通用学业风险）
  if (/挂科|补考|不及格|课程|学业预警|成绩波动|学业风险/.test(t)) {
    return { name: 'student-academic-warning', query: sid }
  }
  // 5. 学分进度 → 学分进度页
  if (/学分/.test(t)) {
    return { name: 'student-credit-progress', query: sid }
  }
  // 6. GPA / 绩点 / 专业排名 → 学情成绩详情（最贴近成绩数据）
  if (/GPA|绩点|专业排名|成绩|均分|加权/.test(t)) {
    return { name: 'student-gpa-detail', query: sid }
  }
  // 7. 就业去向 / 职业方向 / 目标城市 / 公司 / 院校 / 考研 / 留学 / 简历 / 实习 → 生涯发展（最贴近发展规划）
  if (/就业|去向|职业|方向|目标城市|公司|院校|考研|留学|简历|实习|企业实践|职业材料|岗位|深造/.test(t)) {
    return { name: 'student-career-development', query: sid }
  }
  // 8. 高潜 / 软技能 / 能力维度 / 成长 → 成长路径
  if (/高潜|潜能|潜力|软技能|沟通|领导力|组织|协作|执行力|创新|成长|素养|能力|强$/.test(t)) {
    return { name: 'student-growth-path', query: sid }
  }
  return null
}

function onHoloTagClick(text: string) {
  const target = holoTagTarget(text)
  if (target) router.push(target as never)
}

const levelColor = (level: RiskLevel) => ({
  low: '#55e995',
  medium: '#facc15',
  high: '#ff7474',
}[level])

type StatusTone = 'safe' | 'warn' | 'risk' | 'info'

const statusItems = computed(() => {
  const d = dashboard.value
  if (!d) return [] as Array<{ label: string; value: string; tone: StatusTone; icon: IconKind }>
  const mentalCode = d.profile.mentalLevelCode
  const mentalTone: StatusTone =
    mentalCode === 'high' ? 'risk' : mentalCode === 'medium' ? 'warn' : 'safe'
  return [
    {
      label: '学籍状态',
      value: d.profile.onCampusStatus || '在校',
      tone: 'safe' as StatusTone,
      icon: 'students' as IconKind,
    },
    {
      label: '困难认定',
      value: d.profile.economicHardship ? '已认定' : '未认定',
      tone: (d.profile.economicHardship ? 'warn' : 'safe') as StatusTone,
      icon: 'economic' as IconKind,
    },
    {
      label: '心理分级',
      value: d.profile.mentalLevel || '正常',
      tone: mentalTone,
      icon: 'mental' as IconKind,
    },
    {
      label: '征兵状态',
      value: d.careerDev.militaryNote || '无',
      tone: 'info' as StatusTone,
      icon: 'status' as IconKind,
    },
  ]
})

type HoloLevel = 'red' | 'yellow' | 'green' | 'white' | 'blue'

/** 一、全息标签云：分为 核心 / 能力 / 发展 / 关注 四组标签 */
interface HoloGroup { title: string; star: boolean; color: 'green' | 'white' | 'blue' | 'yellow'; tags: string[] }
const holoGroups = computed<HoloGroup[]>(() => {
  const d = dashboard.value
  if (!d) return []
  const p = d.profile
  const gp = d.growthPortrait as any
  const dims: Array<{ name: string; personal: number }> =
    gp?.dimensions ??
    (gp?.indicators ?? []).map((it: any, i: number) => ({ name: it.name, personal: gp?.personal?.[i] ?? 0 })) ??
    []
  const uniq = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)))
  const core: string[] = []
  const ability: string[] = []
  const develop: string[] = []
  const focus: string[] = []

  /* 核心标签（亮点 / 优势，带 ⭐） */
  const go = d.growthOverview
  if (go?.overallPercent) core.push(`专业排名前${String(go.overallPercent).replace('%', '')}%`)
  if (d.academic?.gpa && d.academic.gpa >= 3.5) core.push('GPA优秀')
  dims
    .slice()
    .sort((a: any, b: any) => b.personal - a.personal)
    .slice(0, 2)
    .forEach((t: any) => core.push(`${t.name}强`))
  if (d.competition?.awardCount) core.push('竞赛成果突出')
  ;(d.aiPortrait?.strengthTags ?? []).forEach((t) => core.push(t))

  /* 能力标签 */
  dims.forEach((t) => ability.push(t.name))
  const coreHasAcademic = core.some((t) => /专业排名|GPA|绩点|学业/.test(t))
  ;(p.highPotentialTags ?? []).forEach((t) => {
    if (coreHasAcademic && t === '学业高潜') return
    ability.push(t)
  })
  ;(d.quality?.softSkills ?? []).forEach((s: any) => ability.push(s.name))

  /* 发展标签 */
  if (d.careerDev?.employmentDestination) develop.push(d.careerDev.employmentDestination)
  if (d.aiAssistant?.recommendedDirection) develop.push(d.aiAssistant.recommendedDirection)
  if (d.careerDev?.targetCity) develop.push(d.careerDev.targetCity)
  if (d.careerDev?.targetCompanies?.[0]) develop.push(d.careerDev.targetCompanies[0])
  else if (d.careerDev?.targetUniversities?.[0]) develop.push(d.careerDev.targetUniversities[0])
  ;(d.employment?.careerDirections ?? []).forEach((c) => develop.push(c))

  /* 关注标签（待提升） */
  ;(d.aiPortrait?.focusTags ?? []).forEach((t) => focus.push(t))
  if (d.careerDev?.resumeStatus && !/已|签约|完善/.test(d.careerDev.resumeStatus)) focus.push('职业材料完善')
  if (d.internship && d.internship.projectCount === 0) focus.push('企业实践提升')

  return [
    { title: '核心标签', star: true, color: 'green', tags: uniq(core) },
    { title: '能力标签', star: false, color: 'white', tags: uniq(ability) },
    { title: '发展标签', star: false, color: 'blue', tags: uniq(develop) },
    { title: '关注标签', star: false, color: 'yellow', tags: uniq(focus) },
  ]
})

/** 扁平化为标签云使用的一维列表（核心 → 能力 → 发展 → 关注 顺序，跨分组去重 + 同义近重去重，取前 40 个） */
const holoLevelOf = (c: HoloGroup['color']): HoloLevel =>
  (c === 'green' ? 'green' : c === 'yellow' ? 'yellow' : c === 'blue' ? 'blue' : 'white')
const normalizeTag = (s: string) => s.replace(/[\s%·、，。,.]/g, '').toLowerCase()
/** 是否为同义/近义重复：完全相同，或一个完整包含另一个且较短者不少于较长者的一半 */
function isHoloDup(n: string, kept: string[]): boolean {
  return kept.some((s) => {
    if (n === s) return true
    const minL = Math.min(n.length, s.length)
    const maxL = Math.max(n.length, s.length)
    if (minL < 2) return false
    if (minL / maxL < 0.5) return false
    return n.includes(s) || s.includes(n)
  })
}
const holoTags = computed<Array<{ text: string; level: HoloLevel }>>(() => {
  const kept: string[] = []
  const tags: Array<{ text: string; level: HoloLevel }> = []
  for (const g of holoGroups.value) {
    const lvl = holoLevelOf(g.color)
    for (const raw of g.tags) {
      const t = (raw ?? '').trim()
      if (!t) continue
      const n = normalizeTag(t)
      if (isHoloDup(n, kept)) continue
      kept.push(n)
      tags.push({ text: t, level: lvl })
    }
  }
  return tags.slice(0, 28)
})

/** 全息云布局：大字号 + 上下压缩收拢 + AABB 碰撞避让 */
interface HoloSlot {
  top: number
  left: number
  size: number
  weight: number
}
interface HoloBox {
  x: number
  y: number
  w: number
  h: number
  size: number
  weight: number
}

function holoCharCount(text: string) {
  return Array.from(text).length
}

function holoTextSize(i: number) {
  if (i === 0) return 34
  if (i <= 4) return 24
  if (i <= 10) return 20
  if (i <= 18) return 18
  return 16
}

function holoTextWeight(i: number) {
  if (i === 0) return 800
  if (i <= 4) return 750
  if (i <= 10) return 700
  return 650
}

function holoBoxesOverlap(a: HoloBox, b: HoloBox, padX = 10, padY = 6) {
  return Math.abs(a.x - b.x) < (a.w + b.w) / 2 + padX
    && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + padY
}

const holoPlaced = computed<HoloSlot[]>(() => {
  const tags = holoTags.value
  if (!tags.length) return []

  // 画布偏扁：上下压缩，标签往中间带收拢
  const VW = 1280
  const VH = 300
  const placed: HoloBox[] = []

  const clampBox = (x: number, y: number, w: number, h: number) => ({
    x: Math.min(Math.max(x, w / 2 + 8), VW - w / 2 - 8),
    y: Math.min(Math.max(y, h / 2 + 6), VH - h / 2 - 6),
  })

  for (let i = 0; i < tags.length; i++) {
    let size = holoTextSize(i)
    const weight = holoTextWeight(i)
    let w = Math.max(holoCharCount(tags[i].text) * size * 0.95, size * 2.2)
    let h = size * 1.38

    const candidates: Array<[number, number]> = []
    if (i === 0) {
      candidates.push([VW * 0.5, VH * 0.5])
    } else {
      // 紧凑螺旋：横向可铺开，纵向半径收紧
      for (let k = 0; k < 110; k++) {
        const t = 0.6 + k * 0.42
        const rx = Math.min(55 + t * 13, VW * 0.42)
        const ry = Math.min(28 + t * 6.5, VH * 0.36)
        const ang = t * 2.05 + i * 0.62
        candidates.push([VW * 0.5 + Math.cos(ang) * rx, VH * 0.5 + Math.sin(ang) * ry])
      }
      // 3 行网格，集中在中间带，避免顶底大空白
      const rows = 3
      const cols = 8
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = VW * (0.07 + (col + 0.5) / cols * 0.86) + ((i * 5 + row) % 4) * 5 - 8
          const y = VH * (0.22 + (row + 0.5) / rows * 0.56) + ((i + col) % 3) * 4 - 4
          candidates.push([x, y])
        }
      }
    }

    let chosen: HoloBox | null = null
    let bestScore = Infinity

    const tryPlace = (trySize: number) => {
      const tw = Math.max(holoCharCount(tags[i].text) * trySize * 0.95, trySize * 2.2)
      const th = trySize * 1.38
      for (const [rawX, rawY] of candidates) {
        const { x, y } = clampBox(rawX, rawY, tw, th)
        const box: HoloBox = { x, y, w: tw, h: th, size: trySize, weight }
        if (placed.some((p) => holoBoxesOverlap(box, p))) continue
        // 优先靠近中心（从内往外填），纵向惩罚更大，避免顶底空
        const dx = Math.abs(x - VW * 0.5) / VW
        const dy = Math.abs(y - VH * 0.5) / VH
        const score = dx * 1.0 + dy * 1.8
        if (score < bestScore) {
          bestScore = score
          chosen = box
        }
      }
    }

    tryPlace(size)
    if (!chosen && size > 15) {
      size = Math.max(15, size - 2)
      w = Math.max(holoCharCount(tags[i].text) * size * 0.95, size * 2.2)
      h = size * 1.38
      bestScore = Infinity
      tryPlace(size)
    }
    if (!chosen && size > 14) {
      size = 14
      w = Math.max(holoCharCount(tags[i].text) * size * 0.95, size * 2.2)
      h = size * 1.38
      bestScore = Infinity
      tryPlace(size)
    }

    if (!chosen) {
      let least: { box: HoloBox; hit: number } | null = null
      for (const [rawX, rawY] of candidates) {
        const { x, y } = clampBox(rawX, rawY, w, h)
        const box: HoloBox = { x, y, w, h, size, weight }
        const hit = placed.reduce((n, p) => n + (holoBoxesOverlap(box, p, 3, 2) ? 1 : 0), 0)
        if (!least || hit < least.hit) least = { box, hit }
      }
      chosen = least?.box ?? { x: VW * 0.5, y: VH * 0.5, w, h, size, weight }
    }

    placed.push(chosen)
  }

  return placed.map((p) => ({
    top: Math.round((p.y / VH) * 1000) / 10,
    left: Math.round((p.x / VW) * 1000) / 10,
    size: p.size,
    weight: p.weight,
  }))
})

const holoStyle = (idx: number) => {
  const s = holoPlaced.value[idx] ?? { top: 50, left: 50, size: 18, weight: 600 }
  return {
    top: `${s.top}%`,
    left: `${s.left}%`,
    fontSize: `${s.size}px`,
    fontWeight: s.weight,
    transform: 'translate(-50%, -50%)',
    zIndex: Math.max(1, 40 - idx),
  }
}

/** 上下压缩后的高度 */
const holoMinHeight = computed(() => {
  const n = holoTags.value.length
  if (n === 0) return 100
  if (n <= 6) return 200
  if (n <= 12) return 240
  if (n <= 20) return 270
  return 290
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学生基础信息台账"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId} · ${dashboard.profile.className}` : ''"
    back-text="← 返回"
    mock-badge="模拟数据"
    :show-brief-export="true"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载学生档案...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="basic-ledger">
      <div class="today-todo" :class="{ 'is-open': showTodayTodo }">
        <button type="button" class="today-todo__head" @click="showTodayTodo = !showTodayTodo">
          <strong>今日待办</strong>
          <em>{{ todayTodos.length }}</em>
          <span>{{ showTodayTodo ? '收起' : '展开' }}</span>
        </button>
        <ul v-if="showTodayTodo" class="today-todo__list">
          <li v-for="(t, i) in todayTodos" :key="i" :class="`is-${t.tone}`">
            <span class="today-todo__text">{{ t.text }}</span>
            <button type="button" class="today-todo__action" @click="handleTodo(t)">{{ t.actionLabel }}</button>
          </li>
        </ul>
      </div>

      <!-- ═══ 〇、全息标签云（置顶，姓名下方） ═══ -->
      <section class="ledger-section section--holo">
        <h3 class="section-title">全息标签云<span class="section-mock-tag">动态生成</span></h3>
        <div class="holo-cloud" :style="{ minHeight: holoMinHeight + 'px' }">
          <span
            v-for="(t, idx) in holoTags"
            :key="t.text"
            class="holo-tag"
            :class="[`holo--${t.level}`, { 'holo-tag--clickable': holoTagTarget(t.text) }]"
            :style="holoStyle(idx)"
            @click="onHoloTagClick(t.text)"
          >{{ t.text }}</span>
        </div>
      </section>

      <!-- ═══ 一、学籍与家庭信息 ═══ -->
      <section class="ledger-section section--basic">
        <h3 class="section-title">学籍与家庭信息<span class="section-mock-tag">部分模拟</span></h3>
        <div class="info-cols">
          <!-- 第一列：学籍信息 -->
          <div class="info-col">
            <h4 class="info-col__title">学籍信息</h4>
            <ul class="info-col__list">
              <li class="info-field"><span class="info-lbl">姓名</span><span class="info-val">{{ dashboard.profile.name }}</span></li>
              <li class="info-field"><span class="info-lbl">性别</span><span class="info-val">{{ dashboard.profile.gender || '男' }}</span></li>
              <li class="info-field"><span class="info-lbl">学号</span><span class="info-val">{{ dashboard.profile.studentId }}</span></li>
              <li class="info-field"><span class="info-lbl">年级</span><span class="info-val">{{ dashboard.profile.grade }}</span></li>
              <li class="info-field"><span class="info-lbl">班级</span><span class="info-val">{{ dashboard.profile.className }}</span></li>
              <li class="info-field"><span class="info-lbl">专业</span><span class="info-val">{{ dashboard.profile.major }}</span></li>
              <li class="info-field"><span class="info-lbl">学院</span><span class="info-val">{{ dashboard.profile.college }}</span></li>
              <li class="info-field"><span class="info-lbl">政治面貌</span><span class="info-val">{{ dashboard.profile.politicalStatus || '—' }}</span></li>
            </ul>
          </div>

          <!-- 第二列：管理信息 -->
          <div class="info-col">
            <h4 class="info-col__title">管理信息</h4>
            <ul class="info-col__list">
              <li class="info-field"><span class="info-lbl">辅导员</span><span class="info-val">{{ dashboard.profile.counselor || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">班主任</span><span class="info-val">{{ dashboard.profile.mentor || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">联系电话</span><span class="info-val">{{ dashboard.profile.phone || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">宿舍</span><span class="info-val">{{ dashboard.profile.dormitory || '—' }}</span></li>
              <li class="info-field" v-if="dashboard.profile.classCadreRole || dashboard.profile.highPotentialTags?.length">
                <span class="info-lbl">高潜标签</span>
                <span v-if="dashboard.profile.highPotentialTags?.length" class="info-tags">
                  <span v-for="tag in dashboard.profile.highPotentialTags" :key="tag" class="tag tag--potential">{{ tag }}</span>
                </span>
                <span v-else-if="dashboard.profile.classCadreRole" class="info-val info-val--tag">{{ dashboard.profile.classCadreRole }}</span>
              </li>
            </ul>
          </div>

          <!-- 第三列：家庭信息 -->
          <div class="info-col" :class="{ 'info-col--orphan': isOrphanOrSingleParent }">
            <h4 class="info-col__title">家庭信息<span v-if="isOrphanOrSingleParent" class="info-badge info-badge--risk">⚠ 特殊关注</span></h4>
            <ul class="info-col__list">
              <li class="info-field"><span class="info-lbl">父亲</span><span class="info-val">{{ fatherInfo.name || '—' }}</span><span class="info-val-sub">{{ fatherInfo.phone || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">母亲</span><span class="info-val">{{ motherInfo.name || '—' }}</span><span class="info-val-sub">{{ motherInfo.phone || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">其他（{{ otherGuardianInfo.name || '待补充' }}）</span><span class="info-val">{{ otherGuardianInfo.phone || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">家庭住址</span><span class="info-val">{{ dashboard.profile.address || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">家庭经济情况</span><span class="info-val">{{ dashboard.profile.economicHardship ? '困难认定' : '一般' }}</span></li>
              <li class="info-field"><span class="info-lbl">家庭成员</span><span class="info-val">{{ dashboard.profile.familyMembers?.join('、') || '暂无记录' }}</span></li>
            </ul>
            <div class="info-note info-note--inline" v-if="dashboard.profile.familySituation">
              <span class="info-note__label">家庭情况备注：</span>
              {{ dashboard.profile.familySituation }}
            </div>
            <div class="info-note info-note--inline" v-if="dashboard.profile.difficultyDetail">
              <span class="info-note__label">详细困难情况：</span>
              {{ dashboard.profile.difficultyDetail }}
            </div>
          </div>
        </div>
      </section>

      <!-- ═══ 二、管理与帮扶状态 ═══ -->
      <section class="ledger-section section--status">
        <h3 class="section-title">管理与帮扶状态<span class="section-mock-tag">部分模拟</span></h3>
        <div class="status-grid">
          <div
            v-for="item in statusItems"
            :key="item.label"
            class="status-card"
            :class="`status-card--${item.tone}`"
          >
            <span class="status-card__label">
              <DashIcon :kind="item.icon" :size="15" class="status-card__ico" />
              {{ item.label }}
            </span>
            <span class="status-card__tag" :class="`status-card__tag--${item.tone}`">{{ item.value }}</span>
          </div>
          <StuHint
            v-if="dashboard"
            :tip="growthTrendTip"
            placement="top"
            block
          >
            <div
              class="status-card status-card--growth"
              :class="`status-card--${dashboard.profile.growthTrend === 'negative' ? 'risk' : 'safe'}`"
            >
              <span class="status-card__label">
                <DashIcon kind="potential" :size="15" class="status-card__ico" />
                成长趋势
              </span>
              <span
                class="status-card__tag"
                :class="`status-card__tag--${dashboard.profile.growthTrend === 'negative' ? 'risk' : 'safe'}`"
              >{{ ({ positive: '正向上升', negative: '负向波动', stable: '总体平稳' } as const)[dashboard.profile.growthTrend ?? 'stable'] }}</span>
            </div>
          </StuHint>
        </div>
      </section>

      <!-- ═══ 三、行为轨迹时间轴 ═══ -->
      <section class="ledger-section section--dynamics" v-if="dashboard.profile.recentDynamics?.length">
        <h3 class="section-title">
          行为轨迹时间轴
          <span class="section-mock-tag">多源整合</span>
        </h3>
        <div class="timeline">
          <div
            v-for="(item, idx) in [...allDynamics].reverse()"
            :key="idx"
            class="timeline-item"
            :class="`tl--${item.kind === 'award' ? 'green' : item.kind === 'warn' ? 'yellow' : 'white'}`"
          >
            <span class="timeline-time">{{ item.time }}</span>
            <span class="timeline-track"><span class="timeline-dot" /></span>
            <span class="timeline-cat">
              {{
                item.text.includes('成绩波动') ? '成绩波动'
                  : item.text.includes('消费异常') ? '消费异常'
                    : item.text.includes('请假记录') ? '请假记录'
                      : item.text.includes('图书馆') ? '图书馆'
                        : item.text.includes('荣誉') ? '荣誉成果'
                          : '动态'
              }}
            </span>
            <p class="timeline-text">{{ item.text }}</p>
          </div>
        </div>
      </section>

      <!-- ═══ 四、预警信息详细展示 ═══ -->
      <section class="ledger-section section--warning">
        <h3 class="section-title">预警信息<span class="section-mock-tag">部分模拟</span></h3>

        <!-- 4.1 预警总览 -->
        <div class="warning-summary">
          <div
            v-for="card in warningCards"
            :key="card.label"
            class="warning-card warning-card--clickable"
            :class="[`warning-card--${card.level}`, { 'is-collapsed': card.level === 'low' && !expandSafeWarnings }]"
            @click="goWarningDetail(card.label)"
          >
            <div class="warning-card__head">
              <span
                class="warning-card__icon"
                :style="{
                  borderColor: `${levelColor(card.level)}66`,
                  background: `${levelColor(card.level)}18`,
                  boxShadow: `0 0 12px ${levelColor(card.level)}33`,
                }"
              >
                <DashIcon :kind="card.icon" :size="18" :stroke="levelColor(card.level)" />
              </span>
              <span class="warning-card__label">{{ card.label }}</span>
              <span class="warning-card__level" :style="{ color: levelColor(card.level) }">{{ card.conclusion }}</span>
            </div>
            <template v-if="card.level !== 'low' || expandSafeWarnings">
              <p class="warning-card__tip">{{ card.tip }}<span class="warning-card__link">点击查看详情 &rsaquo;</span></p>
              <div class="warning-card__items" v-if="card.items.length">
                <div
                  v-for="item in card.items"
                  :key="item.id"
                  class="warning-card__item"
                  :class="`warning-card__item--${item.level}`"
                >
                  <span class="warning-card__item-dot" :style="{ background: levelColor(item.level) }" />
                  <span class="warning-card__item-category">[{{ item.category }}]</span>
                  <span class="warning-card__item-label">{{ item.label }}</span>
                </div>
              </div>
              <div class="warning-card__empty" v-else>
                暂无此类预警项
              </div>
            </template>
            <p v-else class="warning-card__folded">展开状态</p>
          </div>
        </div>
        <button type="button" class="section-fold-btn section-fold-btn--block" @click.stop="expandSafeWarnings = !expandSafeWarnings">
          {{ expandSafeWarnings ? '折叠正常预警卡片' : '展开正常预警卡片' }}
        </button>

        <!-- 4.2 全部预警项详细列表 -->
        <div class="warning-detail-table" v-if="allAttention.length">
          <h4 class="subsection-title">预警台账明细</h4>
          <div class="table-wrap">
            <table class="warning-table">
              <thead>
                <tr>
                  <th>分类</th>
                  <th>预警项</th>
                  <th>风险等级</th>
                  <th>状态</th>
                  <th class="col-action">操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in allAttention"
                  :key="item.id"
                  :class="`row--${item.level}`"
                >
                  <td>
                    <span class="cat-badge">{{ item.category }}</span>
                  </td>
                  <td class="cell-label">{{ item.label }}</td>
                  <td>
                    <span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span>
                  </td>
                  <td>
                    <span class="risk-dot" :style="{ background: levelColor(item.level) }" />
                    {{ riskText[item.level] }}
                  </td>
                  <td class="col-action">
                    <button
                      type="button"
                      class="row-detail-btn"
                      @click.stop="goAttentionDetail(item)"
                    >查看详情 &rsaquo;</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- ═══ 五、高频功能矩阵 ═══ -->
      <section class="ledger-section section--actions">
        <h3 class="section-title">高频功能矩阵</h3>
        <div class="func-matrix">
          <button
            type="button"
            class="func-card"
            @click="router.push({ name: 'student-gpa-detail', query: { studentId: activeStudentId } })"
          >
            <span class="func-card__icon">
              <DashIcon kind="academic" :size="22" />
            </span>
            <span class="func-card__label">查看成绩单</span>
            <span class="func-card__arrow">&rsaquo;</span>
          </button>
          <button
            type="button"
            class="func-card"
            @click="router.push({ name: 'student-reward-aid-ledger', query: { studentId: activeStudentId } })"
          >
            <span class="func-card__icon">
              <DashIcon kind="trophy" :size="22" stroke="#e8c878" />
            </span>
            <span class="func-card__label">奖惩助贷详情</span>
            <span class="func-card__arrow">&rsaquo;</span>
          </button>
        </div>
      </section>

    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.basic-ledger {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 10px;
  align-items: start;
  font-size: 23px;
  line-height: 1.55;
}

.today-todo {
  grid-column: 1 / -1;
  border-radius: 8px;
  border: 1px solid rgba(250, 204, 21, 0.45);
  background: linear-gradient(100deg, rgba(120, 70, 10, 0.35), rgba(6, 17, 52, 0.55));
  overflow: hidden;

  &__head {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    border: 0;
    background: transparent;
    color: #ffe7a8;
    cursor: pointer;
    text-align: left;

    strong {
      font-size: 23px;
      letter-spacing: 0.06em;
    }

    em {
      min-width: 24px;
      padding: 2px 8px;
      border-radius: 999px;
      background: #e45858;
      color: #fff;
      font-style: normal;
      font-weight: 800;
      font-size: 20px;
      text-align: center;
    }

    span {
      margin-left: auto;
      color: #b8ecff;
      font-size: 21px;
    }
  }

  &__list {
    margin: 0;
    padding: 0 14px 12px;
    list-style: none;
    display: grid;
    gap: 6px;

    li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 12px;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(0, 20, 45, 0.45);
      color: #eaf6ff;
      font-size: 22px;

      &.is-high {
        border-color: rgba(255, 116, 116, 0.45);
        color: #ffd0d0;
      }

      &.is-medium {
        border-color: rgba(250, 204, 21, 0.4);
        color: #ffe7a8;
      }
    }

    &__text {
      flex: 1;
      min-width: 0;
    }

    &__action {
      flex-shrink: 0;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid rgba(0, 184, 255, 0.5);
      background: linear-gradient(180deg, rgba(0, 184, 255, 0.18), rgba(4, 18, 48, 0.55));
      color: #8ef6ff;
      cursor: pointer;
      font-size: 19px;
      font-weight: 800;
      white-space: nowrap;
      transition: border-color 0.15s, color 0.15s, background 0.15s;

      &:hover {
        border-color: rgba(0, 242, 255, 0.85);
        color: #ffffff;
        background: linear-gradient(180deg, rgba(0, 184, 255, 0.32), rgba(4, 18, 48, 0.7));
      }
    }
  }
}

.section-fold-btn {
  margin-left: 10px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 184, 255, 0.26);
  background: rgba(0, 184, 255, 0.08);
  color: #8ef6ff;
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: rgba(0, 184, 255, 0.16);
  }

  &--block {
    margin: 10px 0 0;
  }
}

.ledger-section {
  padding: 12px 16px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.ledger-section.section--holo { grid-column: 1 / -1; }
.ledger-section.section--basic { grid-column: 1 / -1; }
.ledger-section.section--status { grid-column: 1 / -1; }
.ledger-section.section--dynamics { grid-column: 1 / -1; }
.ledger-section.section--warning,
.ledger-section.section--actions { grid-column: 1 / -1; }

.section-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 3px;
    height: 15px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.subsection-title {
  margin: 12px 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #9edcff;
  letter-spacing: 0.03em;
}

/* ═══ 全息标签云（散落全息云） ═══ */
.holo-cloud {
  position: relative;
  width: 100%;
  min-height: 260px;
  overflow: hidden;
  padding: 2px 0;
}

.holo-tag {
  position: absolute;
  white-space: nowrap;
  cursor: default;
  line-height: 1.2;
  letter-spacing: 0.02em;
  transform-origin: center;
  text-align: center;
  text-wrap: nowrap;
  pointer-events: auto;
  text-shadow:
    0 0 10px rgba(18, 90, 150, 0.22),
    0 1px 2px rgba(0, 10, 30, 0.45);
  transition: filter 0.15s ease, color 0.15s ease;

  &:hover {
    filter: brightness(1.18);
    z-index: 20 !important;
  }

  &.holo--red { color: #ff8a8a; }
  &.holo--yellow { color: #ffd95e; }
  &.holo--green { color: #5dffa6; }
  &.holo--white { color: #e8f4ff; }
  &.holo--blue { color: #6fd0ff; }

  &--clickable {
    cursor: pointer;

    &:hover {
      filter: brightness(1.25) drop-shadow(0 0 6px currentColor);
      z-index: 30 !important;
    }
  }
}

/* ═══ 行为轨迹时间轴（横向） ═══ */
.timeline {
  display: flex;
  align-items: flex-start;
  padding: 6px 4px 2px;
  overflow-x: auto;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.2); border-radius: 2px; }
}

.timeline-item {
  position: relative;
  flex: 1 1 0;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2px 6px 6px;
  border-radius: 4px;

  &:hover { background: rgba(0, 184, 255, 0.05); }
}

/* 圆点所在的轨道行：连线由左右两段拼成 */
.timeline-track {
  position: relative;
  width: 100%;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0 6px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    height: 2px;
    width: 50%;
    transform: translateY(-50%);
    background: linear-gradient(90deg, rgba(0, 184, 255, 0.45), rgba(0, 184, 255, 0.45));
  }

  &::before { left: 0; }
  &::after { right: 0; }
}

.timeline-item:first-child .timeline-track::before { display: none; }
.timeline-item:last-child .timeline-track::after { display: none; }

.timeline-dot {
  position: relative;
  z-index: 1;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #8ef6ff;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

.timeline-time {
  font-size: 18px;
  font-weight: 700;
  color: #7eb4d8;
  white-space: nowrap;
}

.timeline-cat {
  font-size: 17px;
  font-weight: 800;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid;
  white-space: nowrap;
  margin-bottom: 4px;
}

.timeline-text {
  margin: 0;
  font-size: 18px;
  line-height: 1.4;
  color: #d0e8f8;
}

.tl--red .timeline-dot { background: #ff7474; box-shadow: 0 0 8px rgba(248, 91, 91, 0.6); }
.tl--red .timeline-cat { color: #ff8a8a; border-color: rgba(248, 91, 91, 0.5); background: rgba(185, 43, 55, 0.16); }
.tl--yellow .timeline-dot { background: #facc15; box-shadow: 0 0 8px rgba(250, 204, 21, 0.6); }
.tl--yellow .timeline-cat { color: #ffd95e; border-color: rgba(250, 204, 21, 0.5); background: rgba(174, 121, 10, 0.16); }
.tl--green .timeline-dot { background: #55e995; box-shadow: 0 0 8px rgba(74, 222, 128, 0.6); }
.tl--green .timeline-cat { color: #5dffa6; border-color: rgba(74, 222, 128, 0.5); background: rgba(38, 151, 92, 0.16); }
.tl--white .timeline-dot { background: #8ef6ff; box-shadow: 0 0 8px rgba(0, 212, 255, 0.6); }
.tl--white .timeline-cat { color: #cfe9ff; border-color: rgba(160, 220, 255, 0.45); background: rgba(0, 60, 110, 0.22); }

/* ═══ Info Table — 紧凑行内布局 ═══ */
.info-table {
  display: flex;
  flex-direction: column;
  gap: 1px;
  border: 1px solid rgba(102, 217, 255, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

/* ═══ Info Cols — 三列分组布局 ═══ */
.info-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.info-col {
  min-width: 0;
  padding: 6px 8px 8px;
  border: 1px solid rgba(102, 217, 255, 0.1);
  border-radius: 4px;
  background: rgba(0, 45, 84, 0.16);

  &--orphan {
    border-color: rgba(255, 116, 116, 0.36);
    background: rgba(140, 25, 30, 0.1);
    box-shadow: 0 0 14px rgba(255, 116, 116, 0.08);

    .info-col__title {
      color: #ffb0a0;
    }
  }
}

.info-col__title {
  margin: 0 0 4px;
  padding: 0 0 5px;
  border-bottom: 1px solid rgba(102, 217, 255, 0.14);
  color: #8fd4ff;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.5px;
}

.info-col__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.info-field {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 3px;
  min-width: 0;

  &:nth-child(even) {
    background: rgba(0, 45, 84, 0.12);
  }
}

.info-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: rgba(0, 45, 84, 0.16);

  &:nth-child(even) {
    background: rgba(0, 45, 84, 0.08);
  }
}

.info-table--family .info-row {
  grid-template-columns: 1fr 2fr;
}

.info-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  min-width: 0;
  border-right: 1px solid rgba(102, 217, 255, 0.06);

  &:last-child {
    border-right: none;
  }

  &--wide {
    grid-column: 1 / -1;
    border-right: none;
  }
}

.info-lbl {
  color: #6899b8;
  font-size: 20px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  &::after {
    content: '：';
  }
}

.info-val {
  color: #d8ecff;
  font-size: 21px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &--tag {
    padding: 2px 8px;
    border: 1px solid rgba(232, 200, 120, 0.45);
    border-radius: 3px;
    background: linear-gradient(135deg, rgba(140, 100, 20, 0.32), rgba(80, 55, 10, 0.35));
    color: #f0d78a;
    font-size: 19px;
  }
}

.info-section-divider {
  margin: 8px 0;
  border-top: 1px dashed rgba(102, 217, 255, 0.14);
}

.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag {
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 19px;
  font-weight: 700;
  white-space: nowrap;

  &--potential {
    border: 1px solid rgba(55, 233, 145, 0.55);
    background: linear-gradient(135deg, rgba(20, 140, 80, 0.28), rgba(8, 70, 42, 0.35));
    color: #4dffb0;
  }
}

.info-note {
  display: flex;
  gap: 6px;
  margin-top: 8px;
  padding: 6px 12px;
  border-radius: 3px;
  background: rgba(0, 45, 84, 0.16);

  &--inline {
    display: block;
    margin-top: 6px;
    padding: 5px 8px;
    font-size: 19px;
    line-height: 1.45;
  }
  border: 1px solid rgba(0, 180, 255, 0.06);
  font-size: 20px;
  color: #b0d4e8;
  line-height: 1.5;

  &__label {
    color: #78a9ca;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
  }
}

/* 孤儿/单亲家庭高亮 */
.info-col--orphan {
  border-color: rgba(255, 116, 116, 0.45) !important;
  box-shadow: 0 0 14px rgba(255, 116, 116, 0.14);
}

.info-badge--risk {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid rgba(255, 116, 116, 0.5);
  background: rgba(255, 116, 116, 0.12);
  color: #ff8a8a;
  font-size: 17px;
  font-weight: 700;
  vertical-align: middle;
}

.info-val-sub {
  color: #6e94ac;
  font-size: 18px;
  font-weight: 500;
  margin-left: 6px;

  &::before {
    content: '· ';
  }
}

/* ═══ Status Grid ═══ */
.status-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
}

.status-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(102, 217, 255, 0.14);
  background:
    linear-gradient(145deg, rgba(0, 80, 140, 0.18), rgba(3, 12, 34, 0.55)),
    rgba(0, 38, 73, 0.56);

  &--safe { border-color: rgba(85, 233, 149, 0.22); }
  &--warn { border-color: rgba(250, 204, 21, 0.28); }
  &--risk { border-color: rgba(255, 116, 116, 0.3); }
  &--info { border-color: rgba(101, 223, 255, 0.28); }

  &__label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #9ec7e0;
    font-size: 18px;
    font-weight: 650;
  }

  &__ico {
    flex-shrink: 0;
    opacity: 0.9;
  }

  &__tag {
    align-self: flex-start;
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: 0.02em;
    line-height: 1.35;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &--safe {
      color: #55e995;
      border-color: rgba(85, 233, 149, 0.45);
      background: rgba(85, 233, 149, 0.12);
      box-shadow: 0 0 10px rgba(85, 233, 149, 0.12);
    }

    &--warn {
      color: #facc15;
      border-color: rgba(250, 204, 21, 0.45);
      background: rgba(250, 204, 21, 0.12);
      box-shadow: 0 0 10px rgba(250, 204, 21, 0.12);
    }

    &--risk {
      color: #ff8a8a;
      border-color: rgba(255, 116, 116, 0.5);
      background: rgba(255, 116, 116, 0.14);
      box-shadow: 0 0 10px rgba(255, 116, 116, 0.14);
    }

    &--info {
      color: #65dfff;
      border-color: rgba(101, 223, 255, 0.45);
      background: rgba(101, 223, 255, 0.12);
      box-shadow: 0 0 10px rgba(101, 223, 255, 0.12);
    }
  }
}

/* 成长趋势卡片（与状态卡片同网格，带悬浮解读） */
.status-card--growth {
  cursor: help;
}

/* ═══ Dynamic List ═══ */
.dynamic-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.dynamic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 3px;
  border: 1px solid rgba(120, 200, 255, 0.14);
  background: rgba(0, 40, 78, 0.4);

  &--award {
    border-color: rgba(55, 233, 145, 0.25);
    .dynamic-time { color: #67e8a3; background: rgba(55, 233, 145, 0.15); }
  }

  &--warn {
    border-color: rgba(250, 204, 21, 0.25);
    .dynamic-time { color: #facc15; background: rgba(250, 204, 21, 0.15); }
  }

  &--info {
    .dynamic-time { color: #65dfff; background: rgba(45, 206, 255, 0.12); }
  }
}

.dynamic-time {
  padding: 2px 6px;
  border-radius: 2px;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.dynamic-text {
  color: #e8f4ff;
  font-size: 20px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ═══ Warning Summary ═══ */
.warning-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.warning-card {
  padding: 10px;
  border: 1px solid;
  border-radius: 4px;
  background: rgba(6, 17, 52, 0.4);

  &--clickable {
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0, 184, 255, 0.14);
      border-color: rgba(0, 212, 255, 0.55);
    }
  }

  &--low {
    border-color: rgba(74, 222, 128, 0.25);
    background: rgba(38, 151, 92, 0.06);
  }

  &--medium {
    border-color: rgba(250, 204, 21, 0.25);
    background: rgba(174, 121, 10, 0.06);
  }

  &--high {
    border-color: rgba(248, 91, 91, 0.3);
    background: rgba(185, 43, 55, 0.08);
  }

  &.is-collapsed {
    min-height: 0;
  }

  &__head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 4px;
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    border: 1px solid;
    flex-shrink: 0;
  }

  &__label {
    color: #e8f4ff;
    font-size: 21px;
    font-weight: 700;
    flex: 1;
  }

  &__level {
    font-size: 19px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__tip {
    margin: 0 0 8px;
    color: #8fb7cd;
    font-size: 19px;
    line-height: 1.35;
  }

  &__link {
    margin-left: 4px;
    color: #00d4ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.15);
    font-size: 18px;
    overflow: hidden;

    &--low { border-left: none; }
    &--medium { border-left: none; }
    &--high { border-left: none; }

    &-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    &-category {
      color: #78a9ca;
      flex-shrink: 0;
    }

    &-label {
      color: #d0e8f8;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &-level {
      font-weight: 700;
      flex-shrink: 0;
    }
  }

  &__empty {
    color: #5a7d96;
    font-size: 18px;
    font-style: italic;
  }

  &__folded {
    margin: 6px 0 0;
    color: #7eb4d8;
    font-size: 19px;
  }
}

/* ═══ Warning Detail Table ═══ */
.warning-detail-table {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(102, 217, 255, 0.1);
}

.table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.2); border-radius: 2px; }
}

.warning-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 21px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 6px 10px;
    font-size: 20px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
    white-space: nowrap;
  }

  .col-action {
    text-align: right;
    width: 1%;
    white-space: nowrap;
  }

  td {
    padding: 7px 10px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.05);
  }

  tbody tr {
    transition: background 0.15s;
    &:hover { background: rgba(0, 184, 255, 0.04); }
  }

  .row--low {
    td:first-child { border-left: 2px solid rgba(74, 222, 128, 0.5); }
  }
  .row--medium {
    td:first-child { border-left: 2px solid rgba(250, 204, 21, 0.5); }
  }
  .row--high {
    td:first-child { border-left: 2px solid rgba(248, 91, 91, 0.5); }
  }

  .cell-label {
    font-weight: 600;
    color: #d0e8f8;
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
  font-size: 20px;
  padding: 3px 10px;
  border-radius: 999px;
  font-weight: 700;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.risk-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.row-detail-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(0, 212, 255, 0.35);
  background: rgba(0, 184, 255, 0.1);
  color: #7ff6ff;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;

  &:hover {
    background: rgba(0, 184, 255, 0.22);
    border-color: rgba(0, 212, 255, 0.6);
  }
}



/* ═══ Section 模拟数据标签 ═══ */
.section-mock-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 18px;
  font-weight: 700;
  color: #f0a040;
  border: 1px solid rgba(240, 160, 64, 0.4);
  border-radius: 3px;
  background: rgba(240, 160, 64, 0.08);
  white-space: nowrap;
  vertical-align: middle;
  margin-left: 6px;
  line-height: 18px;
}

/* ═══ Placeholder ═══ */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 21px;
  color: rgba(184, 236, 255, 0.7);
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.38);

  &.error { color: #f87171; }

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

.func-matrix {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.func-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 5px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background: linear-gradient(135deg, rgba(0, 50, 95, 0.5), rgba(0, 28, 60, 0.4));
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 184, 255, 0.18);
    border-color: rgba(0, 212, 255, 0.55);
  }

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid rgba(0, 212, 255, 0.28);
    background: rgba(0, 184, 255, 0.1);
    box-shadow: 0 0 12px rgba(0, 184, 255, 0.16);
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: 24px;
    font-weight: 700;
    color: #d8f0ff;
  }

  &__arrow {
    font-size: 28px;
    color: #8ef6ff;
    font-weight: 700;
  }
}

/* ═══ Responsive ═══ */
@media (max-width: 1280px) {
  .info-row { grid-template-columns: 1fr 1fr; }
  .info-cols { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: repeat(2, 1fr); }
  .warning-summary { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .info-row { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: 1fr; }
}
</style>
