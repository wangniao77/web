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
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import {
  honorGroups,
  disciplinaryRecords,
  criticismRecords,
  academicWarnings,
  integrityRecords,
  aidProfile,
} from '../_shared/qualityMock'

/**
 * 本页为「模拟数据」展示页（顶部已标注「模拟数据」徽标），
 * 全部内容来自 qualityMock，不依赖真实接口，故直接渲染，无需 loading 等待。
 */
const mockProfile = {
  name: '张三',
  studentId: '2021210001',
  className: '计算机科学与技术 21(1)班',
}

const route = useRoute()
const router = useRouter()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || mockProfile.studentId,
)

function goComprehensive() {
  router.push({ name: 'student-comprehensive-ledger', query: { studentId: activeStudentId.value } })
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

/* ─────────── 第一部分：顶部概览卡 ─────────── */
const overviewCards = computed(() => [
  {
    key: 'honor',
    icon: '🏅',
    label: '荣誉成果',
    value: `${honorTotalCount.value}`,
    unit: '项',
    tone: 'blue',
  },
  {
    key: 'scholarship',
    icon: '💰',
    label: '奖学金情况',
    value: `${scholarshipCount.value}`,
    unit: '项',
    tone: 'gold',
  },
  {
    key: 'aid',
    icon: '🤝',
    label: '资助状态',
    value: aidProfile.hasAid ? aidProfile.statusText : '正常',
    unit: '',
    tone: aidProfile.hasAid ? 'green' : 'mute',
  },
  {
    key: 'discipline',
    icon: '📋',
    label: '纪律状态',
    value: disciplineLevel.value === 'low' && disciplinaryRecords.length === 0 ? '无处分' : `${disciplinaryRecords.length} 项`,
    unit: disciplinaryRecords.length ? '' : '',
    tone: disciplineLevel.value === 'low' ? 'green' : disciplineLevel.value === 'medium' ? 'yellow' : 'red',
  },
])

/* ─────────── 第二部分：奖励荣誉画像（环形图 + 重点成果） ─────────── */
const honorDistribution = computed(() => [
  { label: '学科竞赛', value: groupCount('competition'), color: '#5b9cff' },
  { label: '科研成果', value: groupCount('research'), color: '#43e7b0' },
  { label: '奖学金', value: groupCount('scholarship'), color: '#ffcf6b' },
  {
    label: '其他成果',
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
  const count = disciplinaryRecords.length + criticismRecords.length + academicWarnings.length + integrityRecords.length
  if (count >= 2) return 'high'
  if (count === 1) return 'medium'
  return 'low'
})

const disciplineSummary = computed(() => {
  if (disciplinaryRecords.length === 0) {
    return { hasRecord: false, type: '', time: '', status: '' }
  }
  const r = disciplinaryRecords[0]
  return { hasRecord: true, type: r.type, time: r.date, status: r.status }
})

const disciplineItems = computed(() => {
  const items: { cat: string; text: string; date: string }[] = []
  disciplinaryRecords.forEach((r) => items.push({ cat: '校纪处分', text: `${r.type} · ${r.reason}`, date: r.date }))
  criticismRecords.forEach((r) => items.push({ cat: '通报批评', text: r.reason, date: r.date }))
  academicWarnings.forEach((r) => items.push({ cat: '学业警示', text: `${r.type}（${r.target}）`, date: r.date }))
  integrityRecords.forEach((r) => items.push({ cat: '诚信档案', text: r.detail, date: r.date }))
  return items
})

/* ─────────── 第五部分：成长时间轴（奖励 + 资助 + 处分 混合） ─────────── */
interface GrowthItem {
  date: string
  type: 'award' | 'aid' | 'discipline'
  icon: string
  title: string
  sub: string
}
const growthItems = computed<GrowthItem[]>(() => {
  const items: GrowthItem[] = []
  for (const g of honorGroups) {
    const rows = g.sub ? g.sub.flatMap((s) => s.rows) : (g.rows ?? [])
    for (const r of rows) {
      const date = (r.date as string) || ''
      if (!date) continue
      items.push({ date, type: 'award', icon: '🏆', title: (r.name || r.title) as string, sub: g.label })
    }
  }
  aid.history.forEach((h) => items.push({ date: h.date, type: 'aid', icon: '💰', title: h.text, sub: '资助帮扶' }))
  disciplineItems.value.forEach((d) =>
    items.push({ date: d.date, type: 'discipline', icon: '⚠️', title: d.text, sub: d.cat }),
  )
  const toNum = (d: string) => Number(d.replace(/[^0-9]/g, '')) || 0
  return items.sort((a, b) => toNum(b.date) - toNum(a.date)).slice(0, 8)
})
</script>

<template>
  <StudentDetailLayout
    title="奖惩助贷详情"
    :subtitle="`${mockProfile.name} · ${mockProfile.studentId} · ${mockProfile.className}`"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div class="reward-aid-ledger">
      <!-- ═══ 第一部分：顶部概览卡 ═══ -->
      <section class="overview-grid">
        <div
          v-for="card in overviewCards"
          :key="card.key"
          class="overview-card"
          :class="`overview-card--${card.tone}`"
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
            <!-- 环形图 -->
            <div class="donut-wrap">
              <svg class="donut" :width="donut.size" :height="donut.size" :viewBox="`0 0 ${donut.size} ${donut.size}`">
                <g :transform="`rotate(-90 ${donut.center} ${donut.center})`">
                  <circle
                    v-for="(seg, i) in donut.segments"
                    :key="i"
                    :cx="donut.center"
                    :cy="donut.center"
                    :r="donut.r"
                    fill="none"
                    :stroke="seg.color"
                    :stroke-width="donut.stroke"
                    :stroke-dasharray="`${seg.len} ${donut.c - seg.len}`"
                    :stroke-dashoffset="seg.offset"
                    stroke-linecap="butt"
                  />
                </g>
                <text :x="donut.center" :y="donut.center - 6" text-anchor="middle" class="donut__total">{{ donut.total }}</text>
                <text :x="donut.center" :y="donut.center + 16" text-anchor="middle" class="donut__caption">荣誉成果</text>
              </svg>
              <ul class="donut-legend">
                <li v-for="(seg, i) in donut.segments" :key="i">
                  <span class="donut-legend__dot" :style="{ background: seg.color }" />
                  <span class="donut-legend__label">{{ seg.label }}</span>
                  <span class="donut-legend__value">{{ seg.value }} 项</span>
                </li>
              </ul>
            </div>

            <!-- 查看详情：跳转综合素养台账二级页 -->
            <button class="detail-btn" type="button" @click="goComprehensive">
              查看详情<span class="detail-btn__arrow">›</span>
            </button>
          </div>
        </section>

        <!-- 右：资助帮扶分析 -->
        <section class="panel">
          <h3 class="section-title">资助帮扶分析</h3>

          <template v-if="aid.hasAid">
            <!-- 学生资助画像 -->
            <div class="aid-profile">
              <div class="aid-profile__row">
                <span class="aid-profile__label">当前资助状态</span>
                <span class="aid-profile__value" :class="`is-${aid.statusLevel}`">
                  <span class="aid-dot" />{{ aid.statusText }}
                </span>
              </div>
              <div class="aid-profile__row">
                <span class="aid-profile__label">困难认定</span>
                <span class="aid-profile__value">{{ aid.difficultyLevel }}</span>
              </div>
              <div class="aid-profile__row aid-profile__row--types">
                <span class="aid-profile__label">资助类型</span>
                <span class="aid-types">
                  <span
                    v-for="t in aid.aidTypes"
                    :key="t.name"
                    class="aid-type"
                    :class="{ 'aid-type--off': !t.on }"
                  >{{ t.on ? '✓' : '—' }} {{ t.name }}</span>
                </span>
              </div>
            </div>

            <!-- 资助历史时间轴 -->
            <h4 class="subsection-title">资助历史时间轴</h4>
            <ul class="aid-timeline">
              <li v-for="(h, i) in aid.history" :key="i" class="aid-timeline__item">
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

      <!-- ═══ 第四部分：纪律风险分析（小模块） ═══ -->
      <section class="panel panel--discipline">
        <div class="panel-head">
          <h3 class="section-title">纪律与行为状态</h3>
          <button class="detail-btn detail-btn--inline" type="button" @click="goComprehensive">
            查看详情<span class="detail-btn__arrow">›</span>
          </button>
        </div>

        <div v-if="!disciplineSummary.hasRecord" class="discipline-ok">
          <span class="discipline-ok__dot" />
          <div>
            <strong>当前无处分记录</strong>
            <p>近三年：无违规行为</p>
          </div>
        </div>

        <div v-else class="discipline-box">
          <div class="discipline-fields">
            <div class="discipline-field">
              <span class="discipline-field__label">处分类型</span>
              <span class="discipline-field__value">{{ disciplineSummary.type }}</span>
            </div>
            <div class="discipline-field">
              <span class="discipline-field__label">时间</span>
              <span class="discipline-field__value">{{ disciplineSummary.time }}</span>
            </div>
            <div class="discipline-field">
              <span class="discipline-field__label">状态</span>
              <span class="discipline-field__value" :class="`is-${disciplineLevel}`">{{ disciplineSummary.status }}</span>
            </div>
          </div>
          <ul v-if="disciplineItems.length" class="discipline-list">
            <li v-for="(d, i) in disciplineItems" :key="i">
              <span class="discipline-list__cat">{{ d.cat }}</span>
              <span class="discipline-list__text">{{ d.text }}</span>
              <span class="discipline-list__date">{{ d.date }}</span>
            </li>
          </ul>
        </div>
      </section>

      <!-- ═══ 第五部分：成长时间轴（混合） ═══ -->
      <section class="panel">
        <h3 class="section-title">成长时间轴</h3>
        <div class="growth-timeline">
          <div
            v-for="(it, i) in growthItems"
            :key="i"
            class="growth-item"
            :class="`growth-item--${it.type}`"
          >
            <span class="growth-item__dot" />
            <span class="growth-item__time">{{ it.date }}</span>
            <div class="growth-item__content">
              <span class="growth-item__icon">{{ it.icon }}</span>
              <div>
                <strong class="growth-item__title">{{ it.title }}</strong>
                <span class="growth-item__sub">{{ it.sub }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.reward-aid-ledger {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 17px;
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
  margin: 14px 0 8px;
  font-size: 15px;
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

  &__icon {
    font-size: 26px;
    flex-shrink: 0;
    filter: drop-shadow(0 0 6px rgba(0, 184, 255, 0.25));
  }

  &__body {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  &__label {
    font-size: 14px;
    color: #8fb7cd;
    font-weight: 600;
  }

  &__value {
    font-size: 24px;
    font-weight: 900;
    color: #f6fbff;
    line-height: 1.1;

    small {
      font-size: 15px;
      color: #9ecae8;
      font-weight: 600;
      margin-left: 2px;
    }
  }
}

/* ═══ 第二部分/第三部分：左右两栏 ═══ */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
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

  &__total {
    fill: #f6fbff;
    font-size: 30px;
    font-weight: 900;
  }

  &__caption {
    fill: #8fb7cd;
    font-size: 13px;
    font-weight: 600;
  }
}

.donut-legend {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 160px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
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
  }

  &__value {
    margin-left: auto;
    color: #8fb7cd;
    font-weight: 700;
  }
}

/* 查看详情按钮 */
.detail-btn {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 6px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  background: rgba(0, 184, 255, 0.12);
  color: #8ef6ff;
  font-size: 14px;
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
    font-size: 17px;
    font-weight: 700;
    line-height: 1;
  }

  &--inline {
    align-self: center;
    margin-left: auto;
    padding: 5px 14px;
    font-size: 13px;
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
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
    flex-shrink: 0;
    min-width: 84px;
  }

  &__value {
    font-size: 15px;
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
  font-size: 13px;
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

/* 资助历史时间轴（横向） */
.aid-timeline {
  list-style: none;
  margin: 0;
  padding: 16px 0 4px;
  display: flex;
  flex-direction: row;
  overflow-x: auto;

  &__item {
    position: relative;
    flex: 0 0 170px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 18px 12px 0;

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
    font-size: 13px;
    font-weight: 700;
    color: #7eb4d8;
    margin-bottom: 8px;
  }

  &__text {
    font-size: 13px;
    color: #d8eeff;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 6px;
    background: rgba(0, 40, 78, 0.3);
    border: 1px solid rgba(67, 231, 175, 0.15);
  }
}

.aid-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px;
  color: #8fb7cd;

  &__icon { font-size: 34px; }
  p { margin: 0; font-size: 15px; }
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
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #55e995;
    box-shadow: 0 0 10px rgba(85, 233, 149, 0.7);
    flex-shrink: 0;
  }

  strong { color: #5dffa6; font-size: 16px; }
  p { margin: 2px 0 0; color: #8fb7cd; font-size: 14px; }
}

.discipline-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.discipline-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.discipline-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.45);
  min-width: 120px;

  &__label {
    font-size: 13px;
    color: #8fb7cd;
    font-weight: 600;
  }

  &__value {
    font-size: 16px;
    color: #e8f4ff;
    font-weight: 700;

    &.is-medium { color: #facc15; }
    &.is-high { color: #ff7474; }
    &.is-low { color: #55e995; }
  }
}

.discipline-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 10px;
    border-radius: 4px;
    background: rgba(0, 40, 78, 0.35);
    border: 1px solid rgba(120, 200, 255, 0.1);
  }

  &__cat {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.1);
    border: 1px solid rgba(0, 212, 255, 0.14);
    color: #8ef6ff;
    white-space: nowrap;
  }

  &__text {
    flex: 1;
    font-size: 14px;
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__date {
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 700;
    white-space: nowrap;
  }
}

/* ═══ 第五部分：成长时间轴（一条横向贯穿线） ═══ */
.growth-timeline {
  display: flex;
  flex-direction: row;
  gap: 0;
  padding: 16px 0 4px;
  overflow-x: auto;
}

.growth-item {
  position: relative;
  flex: 0 0 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 18px 12px 0;

  &::before {
    content: '';
    position: absolute;
    top: 6px;
    left: -50%;
    width: 100%;
    height: 2px;
    background: rgba(102, 217, 255, 0.28);
  }

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
    font-size: 13px;
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
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 40, 78, 0.3);
    border: 1px solid rgba(102, 217, 255, 0.12);
  }

  &__icon { font-size: 18px; flex-shrink: 0; }

  &__title {
    display: block;
    font-size: 14px;
    color: #eaf6ff;
    font-weight: 700;
  }

  &__sub {
    display: block;
    font-size: 12px;
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
