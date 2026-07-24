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
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM, AttentionItemVM } from '@/types/student/view'

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
      level: psychological,
      conclusion: dashboard.value.profile.mentalLevel || riskText[psychological],
      tip: `反映心理关注侧风险（绿=正常，黄=需关注，红=高危）。${detailFor(/心理|健康|体测/, items, '当前结论见下方文字')}`,
      items: items.filter((i) => /心理|健康|体测/.test(`${i.category}${i.label}`)),
    },
    {
      label: '学业预警',
      level: academic,
      conclusion: riskText[academic],
      tip: `反映挂科、GPA 等学业风险（绿=正常，黄=需关注，红=高危）。${detailFor(/学业|课程|挂科|GPA|补考/, items, academic === 'low' ? '无挂科，仅需完成常规期末考核' : '请查看预警台账与补考安排')}`,
      items: items.filter((i) => /学业|课程|挂科|GPA|补考/.test(`${i.category}${i.label}`)),
    },
    {
      label: '就业预警',
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

const levelColor = (level: RiskLevel) => ({
  low: '#55e995',
  medium: '#facc15',
  high: '#ff7474',
}[level])

type HoloLevel = 'red' | 'yellow' | 'green' | 'white' | 'blue'
const riskToHolo = (l: RiskLevel): HoloLevel => (l === 'high' ? 'red' : l === 'medium' ? 'yellow' : 'green')

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
  ;(p.highPotentialTags ?? []).forEach((t) => ability.push(t))
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
  return tags.slice(0, 40)
})

/** 全息云布局：程序化生成——中心核心大词 + 同心环绕，各圈角度均匀分布并相互错开以减少遮挡，整体向中心收拢 */
interface HoloSlot { top: number; left: number; size: number; rotate: number; weight: number }
function buildHoloLayout(): HoloSlot[] {
  const slots: HoloSlot[] = [{ top: 50, left: 50, size: 22, rotate: 0, weight: 800 }]
  const rings = [
    { count: 6, radius: 13, size: 16, weight: 700 },
    { count: 12, radius: 20, size: 13, weight: 600 },
    { count: 21, radius: 26, size: 11, weight: 600 },
  ]
  let base = -90
  rings.forEach((ring, ri) => {
    for (let i = 0; i < ring.count; i++) {
      const ang = ((base + (360 / ring.count) * i + ri * 9) * Math.PI) / 180
      const top = 50 + ring.radius * Math.sin(ang)
      const left = 50 + ring.radius * Math.cos(ang)
      slots.push({
        top: Math.round(top * 10) / 10,
        left: Math.round(left * 10) / 10,
        size: ring.size,
        rotate: Math.round(Math.cos(ang) * 4),
        weight: ring.weight,
      })
    }
    base += 17
  })
  return slots
}
const holoLayout: HoloSlot[] = buildHoloLayout()
const holoStyle = (idx: number) => {
  const s = holoLayout[idx] ?? { top: 50, left: 50, size: 16, rotate: 0, weight: 600 }
  return {
    top: `${s.top}%`,
    left: `${s.left}%`,
    fontSize: `${s.size}px`,
    fontWeight: s.weight,
    transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
  }
}

/** 版面高度随词条数量收放：词条少则不占太多空间 */
const holoMinHeight = computed(() => {
  const n = holoTags.value.length
  if (n === 0) return 80
  if (n <= 6) return 120
  if (n <= 14) return 160
  if (n <= 24) return 200
  return 220
})

/** 三、行为轨迹时间轴：整合多源行为数据，按时间倒序排列 */
const behaviorTimeline = computed(() => {
  const list = dashboard.value?.profile.recentDynamics ?? []
  const catOf = (text: string) => {
    if (text.includes('成绩波动')) return '成绩波动'
    if (text.includes('消费异常')) return '消费异常'
    if (text.includes('请假记录')) return '请假记录'
    if (text.includes('图书馆')) return '图书馆'
    if (text.includes('荣誉')) return '荣誉成果'
    if (text.includes('系统采集') || text.includes('伴学')) return '系统采集'
    return '动态'
  }
  const lvlOf = (kind: string): HoloLevel => (kind === 'award' ? 'green' : kind === 'warn' ? 'yellow' : 'white')
  return [...list]
    .map((d) => ({ time: d.time, text: d.text, category: catOf(d.text), level: lvlOf(d.kind) }))
    .sort((a, b) => (a.time < b.time ? 1 : a.time > b.time ? -1 : 0))
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学生基础信息台账"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId} · ${dashboard.profile.className}` : ''"
    back-text="← 返回学生档案"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载学生档案...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="basic-ledger">
      <!-- ═══ 〇、全息标签云（置顶，姓名下方） ═══ -->
      <section class="ledger-section section--holo">
        <h3 class="section-title">全息标签云<span class="section-mock-tag">动态生成</span></h3>
        <div class="holo-cloud" :style="{ minHeight: holoMinHeight + 'px' }">
          <span
            v-for="(t, idx) in holoTags"
            :key="t.text"
            class="holo-tag"
            :class="`holo--${t.level}`"
            :style="holoStyle(idx)"
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
            </ul>
          </div>

          <!-- 第二列：管理信息 -->
          <div class="info-col">
            <h4 class="info-col__title">管理信息</h4>
            <ul class="info-col__list">
              <li class="info-field"><span class="info-lbl">辅导员</span><span class="info-val">{{ dashboard.profile.counselor || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">班主任</span><span class="info-val">{{ dashboard.profile.mentor || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">联系电话</span><span class="info-val">{{ dashboard.profile.phone || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">政治面貌</span><span class="info-val">{{ dashboard.profile.politicalStatus || '—' }}</span></li>
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
          <div class="info-col">
            <h4 class="info-col__title">家庭信息</h4>
            <ul class="info-col__list">
              <li class="info-field"><span class="info-lbl">家庭住址</span><span class="info-val">{{ dashboard.profile.address || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">家长姓名</span><span class="info-val">{{ dashboard.profile.guardianName || '—' }}</span></li>
              <li class="info-field"><span class="info-lbl">家长联系方式</span><span class="info-val">{{ dashboard.profile.guardianPhone || '—' }}</span></li>
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
          <div class="status-card status-card--safe">
            <span class="status-card__label">学籍状态</span>
            <strong class="status-card__value">{{ dashboard.profile.onCampusStatus || '在校' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.economicHardship ? 'status-card--warn' : 'status-card--safe'"
          >
            <span class="status-card__label">困难认定</span>
            <strong class="status-card__value">{{ dashboard.profile.economicHardship ? '已认定' : '未认定' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.mentalLevelCode === 'high' ? 'status-card--risk' : dashboard.profile.mentalLevelCode === 'medium' ? 'status-card--warn' : 'status-card--safe'"
          >
            <span class="status-card__label">心理分级</span>
            <strong class="status-card__value">{{ dashboard.profile.mentalLevel || '正常' }}</strong>
          </div>
          <div
            class="status-card"
            :class="dashboard.profile.growthTrend === 'negative' ? 'status-card--risk' : 'status-card--safe'"
          >
            <span class="status-card__label">成长趋势</span>
            <strong class="status-card__value">{{
              { positive: '正向上升', negative: '负向波动', stable: '总体平稳' }[dashboard.profile.growthTrend ?? 'stable']
            }}</strong>
          </div>
          <div class="status-card status-card--info">
            <span class="status-card__label">征兵状态</span>
            <strong class="status-card__value">{{ dashboard.careerDev.militaryNote || '无' }}</strong>
          </div>
        </div>
      </section>

      <!-- ═══ 三、行为轨迹时间轴 ═══ -->
      <section class="ledger-section section--dynamics" v-if="behaviorTimeline.length">
        <h3 class="section-title">行为轨迹时间轴<span class="section-mock-tag">多源整合</span></h3>
        <div class="timeline">
          <div
            v-for="(item, idx) in [...behaviorTimeline].reverse()"
            :key="idx"
            class="timeline-item"
            :class="`tl--${item.level}`"
          >
            <span class="timeline-time">{{ item.time }}</span>
            <span class="timeline-track"><span class="timeline-dot" /></span>
            <span class="timeline-cat" :class="`tl-cat--${item.level}`">{{ item.category }}</span>
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
            :class="`warning-card--${card.level}`"
            @click="goWarningDetail(card.label)"
          >
            <div class="warning-card__head">
              <span class="warning-card__dot" :style="{ background: levelColor(card.level), boxShadow: `0 0 10px ${levelColor(card.level)}` }" />
              <span class="warning-card__label">{{ card.label }}</span>
              <span class="warning-card__level" :style="{ color: levelColor(card.level) }">{{ card.conclusion }}</span>
            </div>
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
          </div>
        </div>

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
            <span class="func-card__icon">📊</span>
            <span class="func-card__label">查看成绩单</span>
            <span class="func-card__arrow">&rsaquo;</span>
          </button>
          <button
            type="button"
            class="func-card"
            @click="router.push({ name: 'student-psy-warning', query: { studentId: activeStudentId } })"
          >
            <span class="func-card__icon">💬</span>
            <span class="func-card__label">谈心谈话记录</span>
            <span class="func-card__arrow">&rsaquo;</span>
          </button>
          <button
            type="button"
            class="func-card"
            @click="router.push({ name: 'student-comprehensive-ledger', query: { studentId: activeStudentId } })"
          >
            <span class="func-card__icon">🏅</span>
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
  font-size: 16px;
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
  font-size: 16px;
  font-weight: 700;
  color: #9edcff;
  letter-spacing: 0.03em;
}

/* ═══ 全息标签云（散落全息云） ═══ */
.holo-cloud {
  position: relative;
  width: 100%;
  min-height: 220px;
}

.holo-tag {
  position: absolute;
  white-space: nowrap;
  cursor: default;
  line-height: 1.1;
  letter-spacing: 0.02em;
  transform-origin: center;
  transition: filter 0.15s ease;

  &:hover {
    filter: brightness(1.18);
    z-index: 6;
  }

  &.holo--red { color: #ff8a8a; }
  &.holo--yellow { color: #ffd95e; }
  &.holo--green { color: #5dffa6; }
  &.holo--white { color: #e8f4ff; }
  &.holo--blue { color: #6fd0ff; }
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
  font-size: 12px;
  font-weight: 700;
  color: #7eb4d8;
  white-space: nowrap;
}

.timeline-cat {
  font-size: 11px;
  font-weight: 800;
  padding: 1px 8px;
  border-radius: 999px;
  border: 1px solid;
  white-space: nowrap;
  margin-bottom: 4px;
}

.timeline-text {
  margin: 0;
  font-size: 12px;
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
}

.info-col__title {
  margin: 0 0 4px;
  padding: 0 0 5px;
  border-bottom: 1px solid rgba(102, 217, 255, 0.14);
  color: #8fd4ff;
  font-size: 14px;
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
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;

  &::after {
    content: '：';
  }
}

.info-val {
  color: #d8ecff;
  font-size: 15px;
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
    font-size: 13px;
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
  font-size: 13px;
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
    font-size: 13px;
    line-height: 1.45;
  }
  border: 1px solid rgba(0, 180, 255, 0.06);
  font-size: 14px;
  color: #b0d4e8;
  line-height: 1.5;

  &__label {
    color: #78a9ca;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
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
  gap: 2px;
  padding: 6px 8px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.56);

  &__label {
    color: #7eb4d8;
    font-size: 13px;
    font-weight: 600;
  }

  &__value {
    color: #e8f4ff;
    font-size: 15px;
    font-weight: 700;
  }
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
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  flex-shrink: 0;
}

.dynamic-text {
  color: #e8f4ff;
  font-size: 14px;
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

  &__head {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-bottom: 4px;
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__label {
    color: #e8f4ff;
    font-size: 15px;
    font-weight: 700;
    flex: 1;
  }

  &__level {
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }

  &__tip {
    margin: 0 0 8px;
    color: #8fb7cd;
    font-size: 13px;
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
    font-size: 12px;
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
    font-size: 12px;
    font-style: italic;
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
  font-size: 15px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 6px 10px;
    font-size: 14px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
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
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 14px;
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



/* ═══ Section 模拟数据标签 ═══ */
.section-mock-tag {
  display: inline-block;
  padding: 2px 8px;
  font-size: 12px;
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
  font-size: 15px;
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
    font-size: 13px;

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
  gap: 10px;
  padding: 16px;
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
    font-size: 24px;
    flex-shrink: 0;
  }

  &__label {
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    color: #d8f0ff;
  }

  &__arrow {
    font-size: 20px;
    color: #8ef6ff;
    font-weight: 700;
  }
}

/* ═══ Responsive ═══ */
@media (max-width: 1280px) {
  .info-row { grid-template-columns: 1fr 1fr; }
  .info-cols { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: repeat(3, 1fr); }
  .warning-summary { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .info-row { grid-template-columns: 1fr; }
  .status-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
