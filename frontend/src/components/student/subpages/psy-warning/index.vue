<script setup lang="ts">
/**
 * 心理预警详情（二级页面）
 * 路由：/student/psy-warning?studentId=xxx
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import { ROUTES } from '@/constants/routes'
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

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}

const levelColor = (level: string) =>
  ({ low: '#55e995', medium: '#facc15', high: '#ff7474' }[level] || '#8fb7cd')

const riskText = (level: string) =>
  ({ low: '正常', medium: '需关注', high: '高危' }[level] || '—')

const psyItems = computed(() => {
  if (!dashboard.value) return []
  const items = dashboard.value.attention.filter((i) => /心理|健康|体测/.test(`${i.category}${i.label}`))
  if (items.length >= 4) return items
  const fallback = [
    { id: 'psy-1', category: '心理健康', label: 'SCL-90 测评总均分', level: 'low', levelLabel: '正常' },
    { id: 'psy-2', category: '心理健康', label: '焦虑因子（SCL-90）', level: 'low', levelLabel: '正常' },
    { id: 'psy-3', category: '心理健康', label: '抑郁因子（SCL-90）', level: 'low', levelLabel: '正常' },
    { id: 'psy-4', category: '身体健康', label: '体测成绩达标', level: 'low', levelLabel: '良好' },
    { id: 'psy-5', category: '睡眠健康', label: '睡眠质量自评', level: 'low', levelLabel: '正常' },
    { id: 'psy-6', category: '心理健康', label: '人际关系敏感度', level: 'low', levelLabel: '正常' },
    { id: 'psy-7', category: '身体健康', label: '视力筛查（近视度数）', level: 'low', levelLabel: '正常' },
    { id: 'psy-8', category: '心理健康', label: '压力应对能力评估', level: 'low', levelLabel: '正常' },
    { id: 'psy-9', category: '睡眠健康', label: '作息规律性评估', level: 'low', levelLabel: '正常' },
    { id: 'psy-10', category: '身体健康', label: 'BMI 体重指数', level: 'low', levelLabel: '正常' },
    { id: 'psy-11', category: '心理健康', label: '学业自我效能感', level: 'low', levelLabel: '良好' },
    { id: 'psy-12', category: '身体健康', label: '耐力跑测试成绩', level: 'low', levelLabel: '良好' },
  ] as AttentionItemVM[]
  return [...items, ...fallback].slice(0, 4)
})

const mentalLevel = computed(() => dashboard.value?.profile.mentalLevelCode ?? 'low')

const mentalRecords = computed(() => {
  const recs = dashboard.value?.mentalGrowth.records ?? []
  if (recs.length) return recs
  // 模拟数据兜底
  return [
    { date: '2024-09-15', content: '新生入学心理测评完成，SCL-90 各因子均在正常范围，未触发预警' },
    { date: '2024-12-20', content: '学期末心理状态复评，整体平稳，睡眠质量略有下降，已建议规律作息' },
    { date: '2025-03-10', content: '春季学期心理普查，焦虑因子轻度波动，辅导员已进行一对一谈话' },
    { date: '2025-06-25', content: '夏季学期心理测评，各项指标回归正常区间，无需额外干预' },
  ]
})

const indicators = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      { name: 'SCL-90 总均分', value: 2.8, max: 5, level: 'high', desc: '显著高于常模，多项因子异常' },
      { name: 'UCLA 孤独量表', value: 56, max: 80, level: 'high', desc: '孤独感偏高，社交回避明显' },
      { name: '睡眠质量指数', value: 42, max: 100, level: 'medium', desc: '入睡困难，日均睡眠约 5.5 小时' },
    ]
  }
  if (code === 'medium') {
    return [
      { name: 'SCL-90 总均分', value: 1.9, max: 5, level: 'medium', desc: '略高于常模，焦虑与躯体化因子轻度升高' },
      { name: 'UCLA 孤独量表', value: 38, max: 80, level: 'low', desc: '处于正常偏高区间' },
      { name: '睡眠质量指数', value: 58, max: 100, level: 'medium', desc: '自评下降，睡眠时长不足' },
    ]
  }
  return [
    { name: 'SCL-90 总均分', value: 1.2, max: 5, level: 'low', desc: '各因子均在正常范围' },
    { name: 'UCLA 孤独量表', value: 24, max: 80, level: 'low', desc: '人际状态良好' },
    { name: '睡眠质量指数', value: 78, max: 100, level: 'low', desc: '睡眠状况良好' },
  ]
})

const trend = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') return [58, 62, 68, 72]
  if (code === 'medium') return [48, 52, 50, 54]
  return [35, 32, 30, 28]
})

const maxTrend = computed(() => Math.max(...trend.value, 80))

const suggestions = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      '已纳入重点关注名单，建议辅导员与心理咨询师联合跟进',
      '建议 48 小时内安排一次面对面心理咨询评估',
      '同步联系家长，建立家校协同关注机制',
      '近期减少独处时间，鼓励参加 1-2 项团体心理活动',
    ]
  }
  if (code === 'medium') {
    return [
      '建议每月进行 1 次心理状态复评',
      '可预约学校心理咨询中心个体咨询或团体辅导',
      '关注睡眠与作息，必要时建议就医评估',
      '鼓励与班主任、辅导员保持定期沟通',
    ]
  }
  return [
    '继续保持良好的心理保健意识，关注自身情绪变化',
    '建议每学期参加 1 次心理健康讲座或团体辅导活动',
    '保持规律作息与适度运动，每天保证 7-8 小时睡眠',
    '如有情绪波动或压力困扰，可随时预约学校心理咨询中心',
    '培养 1-2 项兴趣爱好，有助于缓解学业压力',
    '鼓励与辅导员、室友保持良好沟通，建立积极社会支持系统',
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="心理预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="psy-warning">
      <!-- 顶部状态 -->
      <section class="warn-section">
        <div class="status-hero" :class="`status-hero--${mentalLevel}`">
          <div class="status-hero__icon">心</div>
          <div class="status-hero__body">
            <div class="status-hero__label">当前心理分级</div>
            <div class="status-hero__value">{{ dashboard.profile.mentalLevel }}</div>
            <div class="status-hero__desc">{{ dashboard.mentalGrowth.supportStatus }}</div>
          </div>
          <div class="status-hero__ring" :style="{ borderColor: levelColor(mentalLevel) }">
            <span :style="{ color: levelColor(mentalLevel) }">{{ riskText(mentalLevel) }}</span>
          </div>
        </div>
      </section>

      <!-- 测评指标 -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理测评指标</h3>
        <div class="indicator-grid">
          <div
            v-for="item in indicators"
            :key="item.name"
            class="indicator-card"
            :class="`indicator-card--${item.level}`"
          >
            <div class="indicator-card__top">
              <span class="indicator-card__name">{{ item.name }}</span>
              <span class="indicator-card__score" :style="{ color: levelColor(item.level) }">
                {{ item.value }}/{{ item.max }}
              </span>
            </div>
            <div class="indicator-card__bar">
              <div
                class="indicator-card__bar-inner"
                :style="{ width: `${(item.value / item.max) * 100}%`, background: levelColor(item.level) }"
              />
            </div>
            <div class="indicator-card__desc">{{ item.desc }}</div>
          </div>
        </div>
      </section>

      <!-- 趋势 -->
      <section class="warn-section">
        <h3 class="warn-section__title">近 4 次测评趋势（心理风险指数）</h3>
        <div class="trend-chart">
          <div class="trend-bars">
            <div
              v-for="(v, idx) in trend"
              :key="idx"
              class="trend-bar"
              :style="{ height: `${(v / maxTrend) * 100}%`, background: levelColor(v > 60 ? 'high' : v > 45 ? 'medium' : 'low') }"
            >
              <span class="trend-bar__label">{{ v }}</span>
            </div>
          </div>
          <div class="trend-x">
            <span v-for="(t, idx) in ['大一上', '大一下', '大二上', '大二下']" :key="idx">{{ t }}</span>
          </div>
        </div>
      </section>

      <!-- 预警台账 -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in psyItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!psyItems.length"><td colspan="3" class="empty-cell">暂无心理预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 辅导记录 -->
      <section class="warn-section">
        <h3 class="warn-section__title">心理辅导记录</h3>
        <div class="timeline">
          <div v-for="(r, idx) in mentalRecords" :key="idx" class="timeline__item">
            <div class="timeline__dot" />
            <div class="timeline__time">{{ r.date }}</div>
            <div class="timeline__content">{{ r.content }}</div>
          </div>
          <div v-if="!mentalRecords.length" class="empty-cell">暂无辅导记录</div>
        </div>
      </section>

      <!-- 干预建议 -->
      <section class="warn-section">
        <h3 class="warn-section__title">干预建议</h3>
        <ul class="suggestion-list">
          <li v-for="(s, idx) in suggestions" :key="idx">{{ s }}</li>
        </ul>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.psy-warning {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;
}

.psy-warning > *:nth-child(1) { grid-column: 1 / -1; }
.psy-warning > *:nth-child(2) { grid-column: 1; }
.psy-warning > *:nth-child(3) { grid-column: 2; }
.psy-warning > *:nth-child(4) { grid-column: 1; }
.psy-warning > *:nth-child(5) { grid-column: 2; }
.psy-warning > *:nth-child(6) { grid-column: 1 / -1; }
.psy-warning > *:nth-child(7) { grid-column: 1 / -1; }

.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
  margin: 0 0 8px;
  font-size: 14px;
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
}

/* Status Hero */
.status-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.45);
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__icon {
    width: 50px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    border-radius: 50%;
    background: rgba(0, 184, 255, 0.1);
    border: 1px solid rgba(0, 184, 255, 0.25);
    flex-shrink: 0;
  }

  &__body {
    flex: 1;
    min-width: 0;
  }

  &__label {
    font-size: 11px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 22px;
    font-weight: 900;
    color: #f6fbff;
    margin: 2px 0;
  }

  &__desc {
    font-size: 12px;
    color: #9ecae8;
    line-height: 1.4;
  }

  &__ring {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 3px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    flex-shrink: 0;
    box-shadow: 0 0 14px currentColor;
  }
}

/* Indicators */
.indicator-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.indicator-card {
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.08);

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  &__name {
    font-size: 12px;
    color: #8fb7cd;
    font-weight: 600;
  }

  &__score {
    font-size: 14px;
    font-weight: 800;
  }

  &__bar {
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
    margin-bottom: 6px;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 3px;
    transition: width 0.5s ease;
  }

  &__desc {
    font-size: 11px;
    color: #9ecae8;
    line-height: 1.35;
  }
}

/* Trend Chart */
.trend-chart {
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);
}

.trend-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 120px;
  gap: 16px;
  padding: 0 8px;
}

.trend-bar {
  flex: 1;
  max-width: 60px;
  min-height: 4px;
  border-radius: 3px 3px 0 0;
  position: relative;
  opacity: 0.85;

  &__label {
    position: absolute;
    top: -18px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: 700;
    color: #f6fbff;
    white-space: nowrap;
  }
}

.trend-x {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
  font-size: 11px;
  color: #7eb4d8;
}

/* Table */
.warn-table-wrap {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.warn-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 6px 8px;
    font-size: 11px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 6px 8px;
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
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 999px;
  font-weight: 700;

  &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
  &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 12px;
}

/* Timeline */
.timeline {
  position: relative;
  padding-left: 14px;

  &::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 6px;
    bottom: 6px;
    width: 2px;
    background: rgba(0, 184, 255, 0.18);
  }

  &__item {
    position: relative;
    padding: 8px 0 8px 18px;
  }

  &__dot {
    position: absolute;
    left: -11px;
    top: 12px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00d4ff;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.55);
  }

  &__time {
    font-size: 11px;
    color: #7eb4d8;
    font-weight: 700;
    margin-bottom: 2px;
  }

  &__content {
    font-size: 12px;
    color: #d0e8f8;
    line-height: 1.4;
  }
}

/* Suggestions */
.suggestion-list {
  margin: 0;
  padding-left: 18px;
  color: #d0e8f8;
  font-size: 12px;
  line-height: 1.8;

  li::marker { color: #00d4ff; }
}

/* Footer actions */
.footer-actions {
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: rgba(0, 184, 255, 0.1);
    color: #8ef6ff;
    font-size: 13px;
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
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

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

@media (max-width: 1280px) {
  .indicator-grid { grid-template-columns: 1fr; }
}
</style>
