<script setup lang="ts">
/**
 * 学生基础信息台账 · 奖惩助贷详情（二级页面）
 *
 * 路由：/student/reward-aid-ledger
 * 入口：基础信息台账「高频功能矩阵」→「奖惩助贷详情」
 *
 * 与「综合素养台账」相互独立：本页整合 荣誉 / 奖学金 / 资助 / 纪律 四大维度，
 * 不跳转到综合素养台账二级页；仅「重点成果卡片」可下钻至综合素养台账详情。
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import StuHint from '@/components/student/template/StuHint.vue'
import {
  honorGroups,
  disciplinaryRecords,
  aidProfile,
  type AidHistoryItem,
} from '../_shared/qualityMock'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { rewardAidToSheets } from '@/utils/studentDashboardExport'

/**
 * 本页为「模拟数据」展示页（顶部已标注「模拟数据」徽标），
 * 全部内容来自 qualityMock，不依赖真实接口，故直接渲染，无需 loading 等待。
 */
const mockProfile = {
  name: '张三',
  studentId: '2021210001',
  className: '计算机科学与技术 21(1)班',
}

// 导出：本页为模拟数据，直接基于 qualityMock 常量导出荣誉/纪律/资助
useStudentDashboardExport('奖惩助贷详情', ref({ profile: { studentId: mockProfile.studentId } }), () =>
  rewardAidToSheets(honorGroups, disciplinaryRecords, aidProfile),
)

const route = useRoute()
const router = useRouter()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || mockProfile.studentId,
)

function goComprehensive() {
  router.push({ name: 'student-comprehensive-ledger', query: { studentId: activeStudentId.value } })
}

function goLedgerWithFocus(focus: 'reward' | 'discipline') {
  router.push({
    name: 'student-comprehensive-ledger',
    query: { studentId: activeStudentId.value, focus },
  })
}

/* ─────────── 各分类成果计数 ─────────── */
function groupCount(key: string): number {
  const g = honorGroups.find((x) => x.key === key)
  if (!g) return 0
  return g.sub ? g.sub.reduce((s, x) => s + x.rows.length, 0) : (g.rows?.length ?? 0)
}

const honorTotalCount = computed(() =>
  honorGroups.reduce((sum, g) => sum + groupCount(g.key), 0),
)

const scholarshipCount = computed(() => groupCount('scholarship'))

/* ─────────── 资助悬浮提示 & 汇总 ─────────── */
const activeAidProjects = computed(() =>
  aidProfile.aidTypes.filter(t => t.on).map(t => t.name),
)
const aidStatusTip = computed(() => {
  if (!aidProfile.hasAid) return ''
  return `当前享受：${activeAidProjects.value.join('、')}`
})
const aidSummary = computed(() => {
  if (!aidProfile.hasAid) return ''
  const types = activeAidProjects.value.join('、')
  const first = aidProfile.history[0]?.date || ''
  return `该生自${first}起享受${types}等资助，累计${aidProfile.history.length}项资助记录，当前${aidProfile.difficultyLevel}，处于${aidProfile.statusText}状态。`
})

/* ─────────── 环形图悬浮交互 ─────────── */
const donutSvg = ref<SVGSVGElement | null>(null)
const donutHoverIdx = ref(-1)
const donutTipStyle = ref<Record<string, string>>({})
function onDonutMove(e: MouseEvent) {
  if (!donutSvg.value) return
  const rect = donutSvg.value.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const dx = e.clientX - cx
  const dy = e.clientY - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const d = donut.value
  const inner = d.r - d.stroke - 4
  const outer = d.r + d.stroke + 4
  if (dist < inner || dist > outer) { donutHoverIdx.value = -1; return }
  let angle = Math.atan2(dx, -dy)
  if (angle < 0) angle += 2 * Math.PI
  const frac = angle / (2 * Math.PI)
  let cum = 0
  for (let i = 0; i < d.segments.length; i++) {
    cum += d.segments[i].len / d.c
    if (frac <= cum) {
      donutHoverIdx.value = i
      donutTipStyle.value = {
        left: `${Math.min(e.clientX + 14, window.innerWidth - 200)}px`,
        top: `${e.clientY - 48}px`,
      }
      return
    }
  }
  donutHoverIdx.value = -1
}
function onDonutLeave() { donutHoverIdx.value = -1 }

/* ─────────── 时间轴悬浮状态 ─────────── */
const hoveredAidIdx = ref(-1)
const hoveredGrowth = ref<GrowthItem | null>(null)
const aidTipStyle = ref<Record<string, string>>({})
const growthTipStyle = ref<Record<string, string>>({})
const aidHistoryReversed = computed(() => [...aid.history].reverse())

function onAidEnter(idx: number, e: MouseEvent) {
  hoveredAidIdx.value = idx
  aidTipStyle.value = {
    left: `${Math.min(e.clientX + 10, window.innerWidth - 260)}px`,
    top: `${Math.max(e.clientY - 150, 80)}px`,
  }
}
function onAidLeave() { hoveredAidIdx.value = -1 }
function onGrowthEnter(item: GrowthItem, e: MouseEvent) {
  hoveredGrowth.value = item
  growthTipStyle.value = {
    left: `${Math.min(e.clientX + 10, window.innerWidth - 340)}px`,
    top: `${Math.max(e.clientY - 220, 80)}px`,
  }
}
function onGrowthLeave() { hoveredGrowth.value = null }

/* ─────────── 第一部分：顶部概览卡 ─────────── */
const overviewCards = computed(() => [
  {
    key: 'honor',
    icon: '🏅',
    label: '荣誉成果',
    value: `${honorTotalCount.value}`,
    unit: '项',
    tone: 'blue',
    clickable: false,
  },
  {
    key: 'scholarship',
    icon: '💰',
    label: '奖学金情况',
    value: `${scholarshipCount.value}`,
    unit: '项',
    tone: 'gold',
    clickable: true,
    focus: 'reward' as const,
  },
  {
    key: 'aid',
    icon: '🤝',
    label: '资助状态',
    value: aidProfile.hasAid ? aidProfile.statusText : '正常',
    unit: '',
    tone: aidProfile.hasAid ? 'green' : 'mute',
    clickable: false,
  },
  {
    key: 'discipline',
    icon: '📋',
    label: '纪律状态',
    value: disciplineLevel.value === 'low' && disciplinaryRecords.length === 0 ? '无处分' : `${disciplinaryRecords.length}`,
    unit: disciplinaryRecords.length ? '项' : '',
    tone: disciplineLevel.value === 'low' ? 'green' : disciplineLevel.value === 'medium' ? 'yellow' : 'red',
    clickable: true,
    focus: 'discipline' as const,
  },
])

function onOverviewCardClick(card: { clickable: boolean; focus?: 'reward' | 'discipline' }) {
  if (!card.clickable) return
  if (card.focus) goLedgerWithFocus(card.focus)
}

/* ─────────── 第二部分：奖励荣誉画像（环形图 + 重点成果） ─────────── */
const honorDistribution = computed(() => [
  { label: '学科竞赛', value: groupCount('competition'), color: '#5b9cff' },
  { label: '科研成果', value: groupCount('research'), color: '#43e7b0' },
  { label: '奖学金', value: groupCount('scholarship'), color: '#ffcf6b' },
  {
    label: '其他荣誉',
    value: groupCount('honor') + groupCount('practice') + groupCount('art') + groupCount('collective') + groupCount('skill'),
    color: '#b08bff',
  },
])

const donut = computed(() => {
  const segs = honorDistribution.value
  const total = segs.reduce((s, x) => s + x.value, 0) || 1
  const r = 72
  const c = 2 * Math.PI * r
  const stroke = 22
  const size = 2 * r + stroke + 16
  const center = size / 2
  let acc = 0
  const segments = segs.map((s) => {
    const len = (s.value / total) * c
    const seg = { ...s, len, offset: -acc }
    acc += len
    return seg
  })
  return { r, c, size, center, stroke, segments, total }
})

/* ─────────── 第三部分：资助帮扶分析 ─────────── */
const aid = aidProfile

/* ─────────── 第四部分：纪律风险分析 ─────────── */
type RiskLevel = 'low' | 'medium' | 'high'
const disciplineLevel = computed<RiskLevel>(() => {
  const count = disciplinaryRecords.length
  if (count >= 2) return 'high'
  if (count === 1) return 'medium'
  return 'low'
})

const disciplineSummary = computed(() => {
  if (disciplinaryRecords.length === 0) return { hasRecord: false, type: '', time: '', status: '' }
  const r = disciplinaryRecords[0]
  return { hasRecord: true, type: r.type, time: r.date, status: r.status }
})

const disciplineItemsFull = computed(() =>
  disciplinaryRecords.map((r) => ({
    type: r.type,
    reason: r.reason,
    docNumber: r.docNumber,
    unit: r.unit,
    date: r.date,
    period: r.period,
    status: r.status,
    removalDate: (r as any).removalDate as string | undefined,
    requirement: r.requirement,
    evidence: r.evidence,
  })),
)

const disciplineRecordsTip = computed(() => {
  if (disciplinaryRecords.length === 0) return ''
  return `处分完整材料：${disciplineItemsFull.value
    .map((d) => `${d.type}·${d.reason}（${d.date}，${d.period}，${d.removalDate || '未解除'}）`)
    .join('；')}`
})

/* ─────────── 第五部分：成长时间轴（奖励 + 资助 + 处分 混合） ─────────── */
interface GrowthItem {
  date: string
  type: 'award' | 'aid' | 'discipline'
  title: string
  sub: string
  detail?: string
}
const growthItems = computed<GrowthItem[]>(() => {
  const items: GrowthItem[] = []
  for (const g of honorGroups) {
    const rows = g.sub ? g.sub.flatMap((s) => s.rows) : (g.rows ?? [])
    for (const r of rows) {
      const date = (r.date as string) || ''
      if (!date) continue
      items.push({ date, type: 'award', title: (r.name || r.title) as string, sub: g.label })
    }
  }
  aid.history.forEach((h) => items.push({
    date: h.date, type: 'aid', title: h.text, sub: '资助帮扶',
    detail: `资助金额：${h.amount || '—'}\n资助周期：${h.period || '—'}`,
  }))
  disciplinaryRecords.forEach((r) => items.push({
    date: r.date, type: 'discipline',
    title: `${r.type} · ${r.reason}`,
    sub: '校纪处分',
    detail: `违纪事由：${r.reason}\n文号：${r.docNumber}\n发文单位：${r.unit}\n处分日期：${r.date}\n处分期限：${r.period}\n处分解除：${(r as any).removalDate || '—'}\n整改要求：${r.requirement}\n佐证：${r.evidence}`,
  }))
  const toNum = (d: string) => Number(d.replace(/[^0-9]/g, '')) || 0
  return items.sort((a, b) => toNum(b.date) - toNum(a.date)).slice(0, 8)
})
</script>

<template>
  <StudentDetailLayout
    title="奖惩助贷详情"
    :subtitle="`${mockProfile.name} · ${mockProfile.studentId} · ${mockProfile.className}`"
    back-text="← 返回"
    mock-badge="模拟数据"
  >
    <div class="reward-aid-ledger">
      <!-- ═══ 第一部分：顶部概览卡 ═══ -->
      <section class="overview-grid">
        <div
          v-for="card in overviewCards"
          :key="card.key"
          class="overview-card"
          :class="[`overview-card--${card.tone}`, { 'overview-card--clickable': card.clickable }]"
          @click="onOverviewCardClick(card)"
        >
          <span class="overview-card__icon">{{ card.icon }}</span>
          <div class="overview-card__body">
            <span class="overview-card__label">{{ card.label }}</span>
            <strong class="overview-card__value">{{ card.value }}<small v-if="card.unit">{{ card.unit }}</small></strong>
          </div>
        </div>
      </section>

      <!-- ═══ 第二部分 / 第三部分：左右两栏 ═══ -->
      <div class="main-grid">
        <!-- 左：奖励荣誉画像 -->
        <section class="panel">
          <h3 class="section-title">奖励荣誉画像</h3>
          <div class="honor-body">
            <div class="donut-wrap">
              <svg ref="donutSvg" class="donut" :width="donut.size" :height="donut.size" :viewBox="`0 0 ${donut.size} ${donut.size}`" @mousemove="onDonutMove" @mouseleave="onDonutLeave">
                <g :transform="`rotate(-90 ${donut.center} ${donut.center})`">
                  <circle
                    v-for="(seg, i) in donut.segments"
                    :key="i"
                    :cx="donut.center" :cy="donut.center" :r="donut.r"
                    fill="none" :stroke="seg.color"
                    :stroke-width="donutHoverIdx === i ? donut.stroke + 7 : donut.stroke"
                    :stroke-dasharray="`${seg.len} ${donut.c - seg.len}`"
                    :stroke-dashoffset="seg.offset" stroke-linecap="butt"
                    class="donut__arc"
                    :class="{ 'donut__arc--active': donutHoverIdx === i }"
                  />
                </g>
                <text :x="donut.center" :y="donut.center - 6" text-anchor="middle" class="donut__total">{{ donut.total }}</text>
                <text :x="donut.center" :y="donut.center + 16" text-anchor="middle" class="donut__caption">荣誉成果</text>
              </svg>
              <div class="donut-right">
                <ul class="donut-legend">
                  <li
                    v-for="(seg, i) in donut.segments"
                    :key="i"
                    :class="{ 'donut-legend--active': donutHoverIdx === i }"
                  >
                    <span class="donut-legend__dot" :style="{ background: seg.color }" />
                    <span class="donut-legend__label">{{ seg.label }}</span>
                    <span class="donut-legend__value">{{ seg.value }} 项</span>
                  </li>
                </ul>
                <button class="detail-btn" type="button" @click="goComprehensive">
                  查看详情<span class="detail-btn__arrow">›</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 右：资助帮扶分析 -->
        <section class="panel">
          <h3 class="section-title">资助帮扶分析</h3>

          <template v-if="aid.hasAid">
            <div class="aid-profile">
              <div class="aid-profile__row">
                <span class="aid-profile__label">当前资助状态</span>
                <StuHint :tip="aidStatusTip">
                  <span class="aid-profile__value" :class="`is-${aid.statusLevel}`">
                    <span class="aid-dot" />{{ aid.statusText }}
                  </span>
                </StuHint>
              </div>
              <div class="aid-profile__row">
                <span class="aid-profile__label">困难认定</span>
                <span class="aid-profile__value">{{ aid.difficultyLevel }}</span>
              </div>
              <div class="aid-profile__row aid-profile__row--types">
                <span class="aid-profile__label">资助类型</span>
                <span class="aid-types">
                  <span v-for="t in aid.aidTypes" :key="t.name" class="aid-type" :class="{ 'aid-type--off': !t.on }">{{ t.name }}</span>
                </span>
              </div>
            </div>

            <p v-if="aidSummary" class="aid-summary">{{ aidSummary }}</p>

            <h4 class="subsection-title">资助历史时间轴</h4>
            <ul class="aid-timeline">
              <li
                v-for="(h, i) in aidHistoryReversed"
                :key="i"
                class="aid-timeline__item"
                @mouseenter="onAidEnter(i, $event)"
                @mouseleave="onAidLeave"
              >
                <span class="aid-timeline__date">{{ h.date }}</span>
                <span class="aid-timeline__dot" />
                <span class="aid-timeline__text">{{ h.text }}</span>
              </li>
            </ul>
          </template>

          <div v-else class="aid-empty">
            <span class="aid-empty__icon">🤝</span>
            <p>暂无资助记录</p>
          </div>
        </section>
      </div>

      <!-- ═══ 第四部分：纪律风险分析 ─── -->
      <section class="panel panel--discipline">
        <div class="panel-head">
          <h3 class="section-title">纪律与行为状态</h3>
          <StuHint v-if="disciplineSummary.hasRecord" :tip="disciplineRecordsTip">
            <button class="detail-btn detail-btn--inline" type="button" @click="goComprehensive">
              查看详情<span class="detail-btn__arrow">›</span>
            </button>
          </StuHint>
        </div>

        <div v-if="!disciplineSummary.hasRecord" class="discipline-ok">
          <span class="discipline-ok__dot" />
          <div><strong>当前无处分记录</strong><p>近三年：无违规行为</p></div>
        </div>

        <div v-else class="discipline-box">
          <ul class="discipline-full-list">
            <li v-for="(d, i) in disciplineItemsFull" :key="i" class="discipline-full-item">
              <div class="discipline-full-item__head">
                <span class="discipline-full-item__type">{{ d.type }}</span>
                <span class="discipline-full-item__status" :class="d.status === '已解除' ? 'is-released' : 'is-active'">{{ d.status }}</span>
              </div>
              <div class="discipline-full-item__body">
                <span class="discipline-full-item__reason">事由：{{ d.reason }}</span>
                <span class="discipline-full-item__date">日期：{{ d.date }}</span>
                <span class="discipline-full-item__period">期限：{{ d.period }}</span>
                <span v-if="d.removalDate" class="discipline-full-item__removal">解除：{{ d.removalDate }}</span>
              </div>
              <div class="discipline-full-item__meta">
                <span>文号：{{ d.docNumber }}</span>
                <span>单位：{{ d.unit }}</span>
                <span>要求：{{ d.requirement }}</span>
                <span>佐证：{{ d.evidence }}</span>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <!-- ═══ 第五部分：成长时间轴（混合、倒序、可点击） ═══ -->
      <section class="panel">
        <h3 class="section-title">成长时间轴</h3>
        <div class="growth-timeline">
          <div
            v-for="(it, i) in growthItems"
            :key="i"
            class="growth-item"
            :class="`growth-item--${it.type}`"
            @mouseenter="it.detail ? onGrowthEnter(it, $event) : null"
            @mouseleave="onGrowthLeave"
          >
            <span class="growth-item__dot" />
            <span class="growth-item__time">{{ it.date }}</span>
            <div class="growth-item__content">
              <StuHint :tip="it.title">
                <strong class="growth-item__title">{{ it.title.length > 10 ? it.title.slice(0, 10) + '...' : it.title }}</strong>
              </StuHint>
              <span class="growth-item__sub">{{ it.sub }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 环形图悬浮浮层 -->
    <Teleport to="body">
      <div
        v-if="donutHoverIdx >= 0"
        class="donut-float"
        :style="donutTipStyle"
      >
        <span class="donut-float__dot" :style="{ background: donut.segments[donutHoverIdx].color }" />
        <span class="donut-float__label">{{ donut.segments[donutHoverIdx].label }}</span>
        <span class="donut-float__value">{{ donut.segments[donutHoverIdx].value }} 项</span>
      </div>
    </Teleport>

    <!-- 资助时间轴悬浮弹窗 -->
    <Teleport to="body">
      <div
        v-if="hoveredAidIdx >= 0"
        class="timeline-popup"
        :style="aidTipStyle"
      >
        <div class="timeline-popup__head">
          <span class="timeline-popup__dot aid-dot--pop" />
          <strong class="timeline-popup__title">资助记录详情</strong>
        </div>
        <dl class="timeline-popup__list">
          <div><dt>日期</dt><dd>{{ aidHistoryReversed[hoveredAidIdx]?.date }}</dd></div>
          <div><dt>项目</dt><dd>{{ aidHistoryReversed[hoveredAidIdx]?.text }}</dd></div>
          <div><dt>金额</dt><dd>{{ aidHistoryReversed[hoveredAidIdx]?.amount || '—' }}</dd></div>
          <div><dt>周期</dt><dd>{{ aidHistoryReversed[hoveredAidIdx]?.period || '—' }}</dd></div>
        </dl>
      </div>
    </Teleport>

    <!-- 成长时间轴悬浮弹窗 -->
    <Teleport to="body">
      <div
        v-if="hoveredGrowth"
        class="timeline-popup"
        :class="`timeline-popup--${hoveredGrowth.type}`"
        :style="growthTipStyle"
      >
        <div class="timeline-popup__head">
          <span class="timeline-popup__dot" :class="`timeline-popup__dot--${hoveredGrowth.type}`" />
          <strong class="timeline-popup__title">
            {{ hoveredGrowth.type === 'award' ? '荣誉成果' : hoveredGrowth.type === 'aid' ? '资助帮扶' : '违纪处分' }}
          </strong>
        </div>
        <dl class="timeline-popup__list">
          <div><dt>日期</dt><dd>{{ hoveredGrowth.date }}</dd></div>
          <div><dt>名称</dt><dd>{{ hoveredGrowth.title }}</dd></div>
          <template v-if="hoveredGrowth.detail">
            <div v-for="(line, li) in hoveredGrowth.detail.split('\n')" :key="li">
              <dt>{{ line.split('：')[0] }}</dt><dd>{{ line.split('：').slice(1).join('：') }}</dd>
            </div>
          </template>
        </dl>
      </div>
    </Teleport>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.reward-aid-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 21px;
  line-height: 1.55;
}

/* 通用面板 */
.panel {
  padding: 12px 16px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.section-title {
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
    height: 15px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.subsection-title {
  margin: 14px 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: #9edcff;
  letter-spacing: 0.03em;
}

/* ═══ 第一部分：顶部概览卡 ═══ */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.5);
  border-left: 3px solid #65dfff;
  border: 1px solid rgba(102, 217, 255, 0.14);
  border-left: 3px solid #65dfff;

  &--gold { border-left-color: #ffcf6b; }
  &--green { border-left-color: #55e995; }
  &--yellow { border-left-color: #facc15; }
  &--red { border-left-color: #ff7474; }
  &--mute { border-left-color: #7ea8c8; }

  &--clickable {
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 212, 255, 0.55);
      background: rgba(0, 60, 110, 0.6);
    }
  }

  &__icon {
    font-size: 30px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 6px rgba(0, 184, 255, 0.25));
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__label {
    font-size: 18px;
    color: #8fb7cd;
    font-weight: 600;
  }

  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.1;

    small {
      font-size: 19px;
      color: #9ecae8;
      font-weight: 600;
      margin-left: 2px;
    }
  }
}

/* ═══ 第二部分/第三部分：左右两栏 ═══ */
.main-grid {
  display: grid;
  grid-template-columns: 3fr 7fr;
  gap: 10px;
  align-items: start;
}

/* 环形图 */
.honor-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.donut-wrap {
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.donut {
  flex-shrink: 0;

  &__arc {
    transition: stroke-width 0.18s ease, filter 0.18s ease;

    &--active {
      filter: drop-shadow(0 0 10px currentColor) brightness(1.15);
    }
  }

  &__total {
    fill: #f6fbff;
    font-size: 34px;
    font-weight: 900;
  }

  &__caption {
    fill: #8fb7cd;
    font-size: 17px;
    font-weight: 600;
  }
}

/* 环形图右侧区域 */
.donut-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  min-width: 140px;
}

.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;

  li {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    font-size: 18px;
    padding: 6px 8px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
    transition: background 0.18s, padding-left 0.18s;
    border-radius: 4px;

    &:last-child { border-bottom: none; }
  }

  &--active {
    background: rgba(0, 184, 255, 0.08);

    .donut-legend__label { color: #ffffff; }
    .donut-legend__value { color: #b8ecff; font-size: 19px; }
  }

  &__dot {
    width: 11px;
    height: 11px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  &__label {
    color: #d0e8f8;
    font-weight: 600;
    font-size: 18px;
  }

  &__value {
    color: #8fb7cd;
    font-weight: 700;
    white-space: nowrap;
    margin-left: auto;
    text-align: right;
  }
}

/* 查看详情按钮 */
.detail-btn {
  align-self: flex-end;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  background: rgba(0, 184, 255, 0.12);
  color: #8ef6ff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s, background 0.15s;

  &:hover {
    transform: translateY(-1px);
    background: rgba(0, 184, 255, 0.22);
    border-color: rgba(0, 212, 255, 0.7);
    box-shadow: 0 6px 18px rgba(0, 184, 255, 0.16);
  }

  &__arrow {
    font-size: 21px;
    font-weight: 700;
    line-height: 1;
  }

  &--inline {
    align-self: center;
    margin-left: auto;
    padding: 5px 14px;
    font-size: 17px;
  }
}

/* 标题 + 查看详情 同行 */
.panel-head {
  display: flex;
  align-items: center;
  margin: 0 0 12px;

  .section-title { margin: 0; }
}

/* 资助画像 */
.aid-profile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid rgba(67, 231, 175, 0.18);
  background: rgba(0, 50, 69, 0.22);

  &__row {
    display: flex;
    align-items: flex-start;
    gap: 10px;

    &--types {
      align-items: flex-start;
    }
  }

  &__label {
    font-size: 18px;
    color: #7eb4d8;
    font-weight: 600;
    flex-shrink: 0;
    min-width: 84px;
  }

  &__value {
    font-size: 19px;
    color: #e8f4ff;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &.is-green { color: #55e995; }
    &.is-warn { color: #facc15; }
  }
}

.aid-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #55e995;
  box-shadow: 0 0 8px rgba(85, 233, 149, 0.6);
}

.aid-types {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.aid-type {
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 17px;
  font-weight: 700;
  color: #5dffa6;
  border: 1px solid rgba(85, 233, 149, 0.4);
  background: rgba(38, 151, 92, 0.14);

  &--off {
    color: #6a8298;
    border-color: rgba(120, 150, 170, 0.25);
    background: rgba(20, 40, 60, 0.2);
  }
}

/* 资助小结 */
.aid-summary {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 6px;
  border: 1px solid rgba(67, 231, 175, 0.16);
  background: rgba(0, 50, 69, 0.16);
  font-size: 17px;
  color: #a8dce8;
  line-height: 1.6;
}

/* 资助历史时间轴（一条横向贯穿线，占满整行） */
.aid-timeline {
  list-style: none;
  margin: 0;
  padding: 16px 0 4px;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  overflow-x: auto;

  &__item {
    position: relative;
    flex: 1 1 150px;
    min-width: 120px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 18px 12px 0;
    cursor: pointer;
    border-radius: 4px;
    transition: background 0.15s;

    &:hover { background: rgba(67, 231, 176, 0.08); }

    &::before {
      content: '';
      position: absolute;
      top: 6px;
      left: -50%;
      width: 100%;
      height: 2px;
      background: rgba(67, 231, 175, 0.3);
    }

    &:first-child::before { display: none; }
  }

  &__dot {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #43e7b0;
    box-shadow: 0 0 8px rgba(67, 231, 176, 0.6);
    z-index: 1;
  }

  &__date {
    font-size: 17px;
    font-weight: 700;
    color: #7eb4d8;
    margin-bottom: 8px;
  }

  &__text {
    font-size: 17px;
    color: #d8eeff;
    font-weight: 600;
  }
}

.aid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: #8fb7cd;

  &__icon { font-size: 38px; }
  p { margin: 0; font-size: 19px; }
}

/* ═══ 第四部分：纪律风险分析 ═══ */
.discipline-ok {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 6px;
  background: rgba(38, 151, 92, 0.08);
  border: 1px solid rgba(85, 233, 149, 0.22);

  &__dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: #55e995;
    box-shadow: 0 0 10px rgba(85, 233, 149, 0.7);
    flex-shrink: 0;
  }
  strong { color: #5dffa6; font-size: 20px; }
  p { margin: 2px 0 0; color: #8fb7cd; font-size: 18px; }
}

.discipline-full-list {
  list-style: none; margin: 0; padding: 0;
  display: flex; flex-direction: column; gap: 10px;
}

.discipline-full-item {
  padding: 12px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 116, 116, 0.18);
  background: rgba(70, 20, 20, 0.16);

  &__head {
    display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
  }
  &__type {
    font-size: 19px; font-weight: 800; color: #ff8a8a;
    padding: 2px 10px; border-radius: 999px;
    border: 1px solid rgba(255, 116, 116, 0.3);
    background: rgba(200, 50, 50, 0.12);
  }
  &__status {
    font-size: 17px; font-weight: 700; padding: 2px 10px; border-radius: 999px;
    &.is-released { color: #55e995; border: 1px solid rgba(85,233,149,.3); background: rgba(38,151,92,.1); }
    &.is-active { color: #ff7474; border: 1px solid rgba(255,116,116,.3); background: rgba(200,50,50,.1); }
  }
  &__body {
    display: flex; flex-wrap: wrap; gap: 6px 16px; margin-bottom: 6px;
    font-size: 17px; color: #d0e8f8;
  }
  &__reason { flex: 1 1 100%; min-width: 0; }
  &__removal { color: #5dffa6; font-weight: 700; }
  &__meta {
    display: flex; flex-wrap: wrap; gap: 6px 16px;
    font-size: 16px; color: #7eb4d8;
    padding-top: 6px;
    border-top: 1px solid rgba(120, 200, 255, 0.08);
  }
}

/* ═══ 环形图悬浮浮层（暗色主题，pointer-events: none） ═══ */
.donut-float {
  position: fixed;
  z-index: 10060;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(85, 224, 255, 0.4);
  background: rgba(4, 16, 40, 0.95);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  pointer-events: none;
  white-space: nowrap;

  &__dot {
    width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0;
  }

  &__label {
    font-size: 17px; font-weight: 700; color: #d0e8f8;
  }

  &__value {
    font-size: 17px; font-weight: 800; color: #7ff6ff;
  }
}

/* ═══ 时间轴悬浮弹窗（暗色主题） ═══ */
.timeline-popup {
  position: fixed;
  z-index: 10060;
  min-width: 200px;
  max-width: 320px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(85, 224, 255, 0.4);
  background: rgba(4, 16, 40, 0.95);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  pointer-events: none;

  &--award { border-color: rgba(85, 233, 149, 0.5); }
  &--aid { border-color: rgba(255, 207, 107, 0.5); }
  &--discipline { border-color: rgba(255, 116, 116, 0.5); }

  &__head {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.15);
  }

  &__title {
    font-size: 18px; font-weight: 800; color: #b8ecff;
    letter-spacing: 0.03em;
  }

  &__dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    background: #8ef6ff;
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.6);

    &--award { background: #5dffa6; box-shadow: 0 0 6px rgba(85, 233, 149, 0.6); }
    &--aid { background: #ffcf6b; box-shadow: 0 0 6px rgba(255, 207, 107, 0.6); }
    &--discipline { background: #ff8a8a; box-shadow: 0 0 6px rgba(255, 116, 116, 0.6); }
  }

  &__list {
    display: flex; flex-direction: column; gap: 6px;

    > div {
      display: flex; gap: 10px;
      dt { font-size: 16px; color: #7eb4d8; font-weight: 600; min-width: 56px; flex-shrink: 0; }
      dd { font-size: 16px; color: #d8eeff; word-break: break-word; }
    }
  }
}

.aid-dot--pop {
  background: #43e7b0;
  box-shadow: 0 0 6px rgba(67, 231, 176, 0.6);
}

/* ═══ 弹窗（保留兼容，悬浮已替代） ═══ */
.detail-modal-mask {
  position: fixed; inset: 0; z-index: 10000;
  background: rgba(0, 0, 0, 0.55);
  display: flex; align-items: center; justify-content: center;
}
.detail-modal {
  position: relative;
  width: min(480px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid rgba(120, 200, 255, 0.3);
  background: rgba(6, 22, 44, 0.98);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.6);

  &__close {
    position: absolute; top: 12px; right: 14px;
    background: none; border: none;
    font-size: 22px; color: #8fb7cd; cursor: pointer;
    &:hover { color: #fff; }
  }
  &__title {
    margin: 0 0 16px; font-size: 21px; font-weight: 800;
    color: #b8ecff; letter-spacing: 0.03em;
  }
  &__list {
    display: flex; flex-direction: column; gap: 8px;

    > div {
      display: flex; gap: 12px;
      dt { font-size: 17px; color: #7eb4d8; font-weight: 600; min-width: 72px; flex-shrink: 0; }
      dd { font-size: 17px; color: #d8eeff; word-break: break-word; }
    }
  }
}

/* ═══ 第五部分：成长时间轴（一条横向贯穿线，占满整行居中） ═══ */
.growth-timeline {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0;
  padding: 16px 0 4px;
  overflow-x: auto;
}

.growth-item {
  position: relative;
  flex: 1 1 200px;
  min-width: 130px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px 0;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.15s;

  &:hover { background: rgba(102, 217, 255, 0.06); }

  &--award:hover { background: rgba(85, 233, 149, 0.06); }
  &--aid:hover { background: rgba(255, 207, 107, 0.06); }
  &--discipline:hover { background: rgba(255, 116, 116, 0.06); }

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: -50%;
    width: 100%;
    height: 2px;
    background: rgba(102, 217, 255, 0.28);
  }
  &--award::before { background: rgba(85, 233, 149, 0.28); }
  &--aid::before { background: rgba(255, 207, 107, 0.28); }
  &--discipline::before { background: rgba(255, 116, 116, 0.28); }

  &:first-child::before { display: none; }

  &__dot {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: #8ef6ff;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
    z-index: 1;
  }

  &--award &__dot { background: #5dffa6; box-shadow: 0 0 8px rgba(85, 233, 149, 0.6); }
  &--aid &__dot { background: #ffcf6b; box-shadow: 0 0 8px rgba(255, 207, 107, 0.6); }
  &--discipline &__dot { background: #ff8a8a; box-shadow: 0 0 8px rgba(255, 116, 116, 0.6); }

  &__time {
    font-size: 17px;
    font-weight: 700;
    color: #7eb4d8;
    margin-bottom: 8px;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    width: 100%;
  }

  &__title {
    display: block;
    font-size: 18px;
    color: #eaf6ff;
    font-weight: 700;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: help;
  }

  &__sub {
    display: block;
    font-size: 16px;
    color: #8fb7cd;
  }
}

/* ═══ Responsive ═══ */
@media (max-width: 1280px) {
  .overview-grid { grid-template-columns: repeat(2, 1fr); }
  .main-grid { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .overview-grid { grid-template-columns: 1fr; }
}
</style>
