
<script setup lang="ts">
/**
 * 学情轨迹护航详情（二级页面）
 * 路由：/student/academic-detail?studentId=xxx
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { TrendDirection } from '@/types/common'

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

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

/* ─────────── KPI ─────────── */
const gpa = computed(() => dashboard.value?.academic.gpa ?? 0)
const failCount = computed(() => dashboard.value?.failedCritical.length ?? 0)
const courseCompletionRate = computed(() => dashboard.value?.academic.courseCompletionRate ?? 0)
const excellentCourses = computed(() => dashboard.value?.academic.excellentCourses ?? 0)
const totalCourses = computed(() => dashboard.value?.academic.totalCourses ?? 0)

/* ─────────── 成绩稳定性 ─────────── */
const gpaValues = computed(() => dashboard.value?.academic.gpaValues ?? [])
const semesters = computed(() => dashboard.value?.academic.semesters ?? [])

const gpaTrend = computed(() => {
  const vals = gpaValues.value
  if (vals.length < 2) return { label: '数据不足', direction: 'flat' as TrendDirection, change: 0 }
  const first = vals[0]
  const last = vals[vals.length - 1]
  const change = last - first
  const direction: TrendDirection = change > 0.05 ? 'up' : change < -0.05 ? 'down' : 'flat'
  const label = direction === 'up' ? '上升' : direction === 'down' ? '下降' : '稳定'
  return { label, direction, change: Math.round(change * 100) / 100 }
})

const gpaTrendDetail = computed(() => {
  const vals = gpaValues.value
  const sems = semesters.value
  if (vals.length < 2) return []
  return vals.map((v, i) => ({
    semester: sems[i] ?? `第${i + 1}学期`,
    gpa: v.toFixed(2),
    change: i > 0 ? (v - vals[i - 1]).toFixed(2) : '—',
  }))
})

/* ─────────── 课程风险情况 ─────────── */
const failedCritical = computed(() => dashboard.value?.failedCritical ?? [])
const riskCourses = computed(() => {
  const grades = dashboard.value?.academic.courseGrades ?? []
  return grades.filter((c) => c.score < 60 && c.score >= 0).map((c) => c.name)
})
const below60Count = computed(() => dashboard.value?.academic.courseGrades.filter((c) => c.score < 60).length ?? 0)

/* ─────────── 培养完成情况 ─────────── */
const credit = computed(() => dashboard.value?.creditProgress)
const creditBuckets = computed(() => {
  if (credit.value?.buckets?.length) return credit.value.buckets
  const required = credit.value?.required || 160
  const earned = credit.value?.earned || 0
  return [
    { label: '必修学分', earned: Math.round(earned * 0.7 * 10) / 10, required: Math.round(required * 0.7) },
    { label: '选修学分', earned: Math.round(earned * 0.2 * 10) / 10, required: Math.round(required * 0.2) },
    { label: '通识学分', earned: Math.round(earned * 0.1 * 10) / 10, required: Math.max(1, Math.round(required * 0.1)) },
  ]
})

const progressAbnormal = computed(() => {
  const rate = courseCompletionRate.value
  if (rate < 60) return '进度异常：培养计划完成率不足 60%，需重点关注'
  if (rate < 80) return '进度偏慢：培养计划完成率低于 80%，建议加快选课进度'
  return '进度正常'
})

/* ─────────── 学业压力情况 ─────────── */
const currentCourses = computed(() => dashboard.value?.academic.currentCourses ?? [])
const totalCurrentCredits = computed(() =>
  currentCourses.value.reduce((sum, c) => sum + (c.credit || 0), 0),
)
const difficultCourseCount = computed(() =>
  // 困难课程 = 学分 >= 4 或课程名含 "高等数学/数据结构与算法/线性代数/概率论" 等关键词
  currentCourses.value.filter(
    (c) =>
      c.credit >= 4 ||
      /高数|数学分析|数据结构与算法|算法|线性代数|概率论|复变函数|数理统计|操作系统|编译原理|计算机网络|计算机组成|数字逻辑|数据库系统|机器学习|深度学习|微积分|离散数学/.test(c.name),
  ).length,
)
const courseLoadLabel = computed(() => {
  const credits = totalCurrentCredits.value
  if (credits >= 25) return '高负荷'
  if (credits >= 20) return '中等负荷'
  return '正常负荷'
})

/* ─────────── 各学期排名趋势 ─────────── */
const rankTrend = computed(() => {
  const vals = dashboard.value?.academic.majorRankValues ?? []
  const sems = semesters.value
  return vals.map((v, i) => ({
    semester: sems[i] ?? `第${i + 1}学期`,
    rank: v,
  }))
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学情轨迹护航详情"
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

    <div v-else-if="dashboard" class="academic-detail">
      <!-- KPI 概览 -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-card__label">当前 GPA</span>
            <strong class="kpi-card__value">{{ gpa.toFixed(2) }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">专业排名</span>
            <strong class="kpi-card__value">{{ dashboard.academic.majorRank }}/{{ dashboard.academic.majorTotal || '—' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">课程完成率</span>
            <strong class="kpi-card__value">{{ courseCompletionRate }}%</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">挂科/不及格</span>
            <strong class="kpi-card__value" :class="failCount > 0 ? 'is-alert' : 'is-safe'">{{ failCount }} 门</strong>
          </div>
        </div>
      </section>

      <!-- 成绩稳定性 -->
      <section class="warn-section">
        <h3 class="warn-section__title">成绩稳定性</h3>
        <div class="stability-summary">
          <div class="stability-badge" :class="`stability-badge--${gpaTrend.direction}`">
            <strong>{{ gpaTrend.label }}</strong>
            <span>GPA 总体趋势</span>
          </div>
          <p class="stability-desc">
            近 {{ gpaValues.length }} 个学期 GPA 从 {{ gpaValues[0]?.toFixed(2) ?? '—' }} 到 {{ gpaValues[gpaValues.length - 1]?.toFixed(2) ?? '—' }}，
            变化 {{ gpaTrend.change >= 0 ? '+' : '' }}{{ gpaTrend.change.toFixed(2) }}。
          </p>
        </div>
        <div class="trend-table-wrap">
          <table class="trend-table">
            <thead>
              <tr>
                <th>学期</th>
                <th>GPA</th>
                <th>环比变化</th>
                <th>趋势</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in gpaTrendDetail" :key="row.semester">
                <td>{{ row.semester }}</td>
                <td>{{ row.gpa }}</td>
                <td>{{ row.change }}</td>
                <td>
                  <span v-if="row.change === '—'" class="tag tag--info">—</span>
                  <span v-else-if="Number(row.change) > 0" class="tag tag--up">↑</span>
                  <span v-else-if="Number(row.change) < 0" class="tag tag--down">↓</span>
                  <span v-else class="tag tag--flat">→</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 四合一并排区域：课程风险 + 培养完成 | 学业压力 + 各学期排名趋势 -->
      <div class="two-col-grid">
        <!-- 课程风险情况 -->
        <section class="warn-section">
          <h3 class="warn-section__title">课程风险情况</h3>
          <div class="risk-summary">
            <div class="risk-kpi">
              <span class="risk-kpi__label">存在风险课程</span>
              <strong class="risk-kpi__value" :class="riskCourses.length > 0 ? 'is-alert' : 'is-safe'">{{ riskCourses.length }} 门</strong>
            </div>
            <div class="risk-kpi">
              <span class="risk-kpi__label">不及格课程</span>
              <strong class="risk-kpi__value" :class="failCount > 0 ? 'is-alert' : 'is-safe'">{{ failCount }} 门</strong>
            </div>
            <div class="risk-kpi">
              <span class="risk-kpi__label">低于 60 分课程</span>
              <strong class="risk-kpi__value" :class="below60Count > 0 ? 'is-alert' : 'is-safe'">{{ below60Count }} 门</strong>
            </div>
          </div>
          <div class="risk-list">
            <div v-for="course in dashboard.failedCritical" :key="course.name" class="risk-item">
              <span class="risk-item__name">{{ course.name }}</span>
              <span class="risk-item__score">{{ course.score }} 分</span>
              <span class="risk-item__tag" :class="course.required ? 'is-required' : 'is-elective'">{{ course.required ? '必修' : '选修' }}</span>
            </div>
            <div v-if="!dashboard.failedCritical.length" class="empty-cell">暂无不及格课程</div>
          </div>
        </section>

        <!-- 培养完成情况 -->
        <section class="warn-section">
          <h3 class="warn-section__title">培养完成情况</h3>
          <div class="completion-summary">
            <div class="completion-kpi">
              <span class="completion-kpi__label">总学分</span>
              <strong class="completion-kpi__value">{{ credit?.earned ?? 0 }}/{{ credit?.required ?? 160 }}</strong>
            </div>
            <div class="completion-kpi">
              <span class="completion-kpi__label">完成率</span>
              <strong class="completion-kpi__value">{{ credit?.earnedPercent ?? 0 }}%</strong>
            </div>
            <div class="completion-kpi">
              <span class="completion-kpi__label">优秀课程</span>
              <strong class="completion-kpi__value">{{ excellentCourses }}/{{ totalCourses }}</strong>
            </div>
          </div>
          <div class="completion-progress">
            <div class="completion-progress__label">培养计划进度</div>
            <div class="completion-progress__bar">
              <div class="completion-progress__inner" :style="{ width: `${Math.min(100, courseCompletionRate)}%` }" />
            </div>
            <div class="completion-progress__percent">{{ courseCompletionRate }}%</div>
          </div>
          <div class="completion-status">
            <span class="completion-status__label">进度评估</span>
            <span class="completion-status__value" :class="courseCompletionRate < 80 ? 'is-warn' : 'is-safe'">{{ progressAbnormal }}</span>
          </div>
          <div class="credit-bucket-list">
            <div v-for="bucket in creditBuckets" :key="bucket.label" class="credit-bucket">
              <span class="credit-bucket__label">{{ bucket.label }}</span>
              <div class="credit-bucket__bar">
                <div class="credit-bucket__inner" :style="{ width: `${Math.min(100, Math.round((bucket.earned / Math.max(1, bucket.required)) * 100))}%` }" />
              </div>
              <span class="credit-bucket__value">{{ bucket.earned }}/{{ bucket.required }}</span>
            </div>
          </div>
        </section>

        <!-- 学业压力情况 -->
        <section class="warn-section">
          <h3 class="warn-section__title">学业压力情况</h3>
          <div class="pressure-summary">
            <div class="pressure-kpi">
              <span class="pressure-kpi__label">当前学期课程数</span>
              <strong class="pressure-kpi__value">{{ currentCourses.length }} 门</strong>
            </div>
            <div class="pressure-kpi">
              <span class="pressure-kpi__label">总学分负荷</span>
              <strong class="pressure-kpi__value">{{ totalCurrentCredits }} 学分</strong>
            </div>
            <div class="pressure-kpi">
              <span class="pressure-kpi__label">困难课程</span>
              <strong class="pressure-kpi__value">{{ difficultCourseCount }} 门</strong>
            </div>
            <div class="pressure-kpi">
              <span class="pressure-kpi__label">负荷评估</span>
              <strong class="pressure-kpi__value" :class="courseLoadLabel === '高负荷' ? 'is-warn' : 'is-safe'">{{ courseLoadLabel }}</strong>
            </div>
          </div>
          <div class="course-list">
            <div class="course-list__header">
              <span>课程名称</span>
              <span>学分</span>
              <span>类型</span>
            </div>
            <div v-for="course in currentCourses" :key="course.name" class="course-row">
              <span>{{ course.name }}</span>
              <span>{{ course.credit }}</span>
              <span class="course-type">{{ course.type }}</span>
            </div>
            <div v-if="!currentCourses.length" class="empty-cell">暂无当前学期课程数据</div>
          </div>
        </section>

        <!-- 各学期排名趋势 -->
        <section class="warn-section">
          <h3 class="warn-section__title">各学期排名趋势</h3>
          <div class="rank-trend-list">
            <div v-for="item in rankTrend" :key="item.semester" class="rank-trend-item">
              <span class="rank-trend-item__sem">{{ item.semester }}</span>
              <div class="rank-trend-item__bar">
                <div class="rank-trend-item__fill" :style="{ width: `${Math.min(100, (item.rank / Math.max(1, dashboard.academic.majorTotal)) * 100)}%` }" />
              </div>
              <span class="rank-trend-item__rank">第 {{ item.rank }} 名</span>
            </div>
            <div v-if="!rankTrend.length" class="empty-cell">暂无排名趋势数据</div>
          </div>
        </section>
      </div>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goBack">返回学生发展概览</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.academic-detail {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

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

/* KPI */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid #65dfff;

  &__label {
    font-size: 11px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 16px;
    font-weight: 900;
    color: #f6fbff;

    &.is-safe { color: #55e995; }
    &.is-alert { color: #ff9b7a; }
  }
}

/* 成绩稳定性 */
.stability-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.stability-badge {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 12px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.45);
  border-left: 3px solid #65dfff;

  strong {
    font-size: 15px;
    font-weight: 900;
    color: #f6fbff;
  }

  span {
    font-size: 11px;
    color: #7eb4d8;
  }

  &--up { border-left-color: #55e995; strong { color: #55e995; } }
  &--down { border-left-color: #ff9b7a; strong { color: #ff9b7a; } }
  &--flat { border-left-color: #ffd166; strong { color: #ffd166; } }
}

.stability-desc {
  margin: 0;
  font-size: 12px;
  color: #8fb7cd;
  line-height: 1.5;
}

/* 趋势表格 */
.trend-table-wrap {
  overflow-x: auto;
}

.trend-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th, td {
    padding: 6px 8px;
    text-align: left;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
  }

  th {
    color: #7eb4d8;
    font-weight: 700;
    background: rgba(0, 38, 73, 0.25);
  }

  td {
    color: #d0e8f8;
  }

  tr:hover td {
    background: rgba(0, 184, 255, 0.06);
  }
}

.tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;

  &--up { background: rgba(85, 233, 149, 0.15); color: #55e995; border: 1px solid rgba(85, 233, 149, 0.25); }
  &--down { background: rgba(255, 155, 122, 0.15); color: #ff9b7a; border: 1px solid rgba(255, 155, 122, 0.25); }
  &--flat { background: rgba(255, 209, 102, 0.15); color: #ffd166; border: 1px solid rgba(255, 209, 102, 0.25); }
  &--info { background: rgba(102, 217, 255, 0.15); color: #7eb4d8; border: 1px solid rgba(102, 217, 255, 0.25); }
}

/* ─────────── 两列并排布局 ─────────── */
.two-col-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  align-items: start;

  .warn-section {
    animation: sectionSlideUp 0.5s ease-out both;
    &:nth-child(1) { animation-delay: 0.04s; }
    &:nth-child(2) { animation-delay: 0.12s; }
    &:nth-child(3) { animation-delay: 0.2s; }
    &:nth-child(4) { animation-delay: 0.28s; }
  }
}

/* 课程风险 */
.risk-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.risk-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { font-size: 11px; color: #7eb4d8; }
  &__value { font-size: 14px; font-weight: 800; color: #f6fbff;
    &.is-safe { color: #55e995; }
    &.is-alert { color: #ff9b7a; }
  }
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;

  &__name { flex: 1; color: #d0e8f8; font-weight: 600; }
  &__score { color: #ff9b7a; font-weight: 700; font-family: var(--student-font-number); }
  &__tag {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    &.is-required { background: rgba(255, 155, 122, 0.15); color: #ff9b7a; border: 1px solid rgba(255, 155, 122, 0.25); }
    &.is-elective { background: rgba(102, 217, 255, 0.15); color: #7eb4d8; border: 1px solid rgba(102, 217, 255, 0.25); }
  }
}

/* 培养完成 */
.completion-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.completion-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { font-size: 11px; color: #7eb4d8; }
  &__value { font-size: 14px; font-weight: 800; color: #f6fbff; }
}

.completion-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;

  &__label { font-size: 12px; color: #7eb4d8; font-weight: 600; width: 90px; flex-shrink: 0; }
  &__bar { flex: 1; height: 6px; border-radius: 999px; background: rgba(0, 60, 120, 0.45); overflow: hidden; }
  &__inner { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00b8ff, #00e5ff); }
  &__percent { font-size: 12px; color: #7ff6ff; font-weight: 700; font-family: var(--student-font-number); width: 40px; text-align: right; flex-shrink: 0; }
}

.completion-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 12px;

  &__label { color: #7eb4d8; font-weight: 600; width: 90px; flex-shrink: 0; }
  &__value { color: #d0e8f8;
    &.is-safe { color: #55e995; }
    &.is-warn { color: #ff9b7a; }
  }
}

.credit-bucket-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.credit-bucket {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);
  font-size: 11px;

  &__label { color: #7eb4d8; width: 70px; flex-shrink: 0; }
  &__bar { flex: 1; height: 5px; border-radius: 999px; background: rgba(0, 60, 120, 0.45); overflow: hidden; }
  &__inner { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #20c997, #52e8bf); }
  &__value { color: #d0e8f8; font-weight: 700; font-family: var(--student-font-number); width: 50px; text-align: right; flex-shrink: 0; }
}

/* 学业压力 */
.pressure-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.pressure-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { font-size: 11px; color: #7eb4d8; }
  &__value { font-size: 14px; font-weight: 800; color: #f6fbff;
    &.is-safe { color: #55e995; }
    &.is-warn { color: #ff9b7a; }
  }
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 2px;

  &__header {
    display: grid;
    grid-template-columns: 1fr 60px 80px;
    gap: 8px;
    padding: 6px 10px;
    font-size: 11px;
    color: #7eb4d8;
    font-weight: 700;
    background: rgba(0, 38, 73, 0.25);
  }
}

.course-row {
  display: grid;
  grid-template-columns: 1fr 60px 80px;
  gap: 8px;
  padding: 5px 10px;
  font-size: 12px;
  color: #d0e8f8;
  border-radius: 3px;

  &:nth-child(even) { background: rgba(0, 38, 73, 0.15); }
  &:hover { background: rgba(0, 184, 255, 0.06); }

  .course-type {
    font-size: 11px;
    color: #8fb7cd;
  }
}

/* 排名趋势 */
.rank-trend-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rank-trend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);
  font-size: 12px;

  &__sem { width: 90px; color: #7eb4d8; flex-shrink: 0; }
  &__bar { flex: 1; height: 5px; border-radius: 999px; background: rgba(0, 60, 120, 0.45); overflow: hidden; }
  &__fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00b8ff, #00e5ff); }
  &__rank { width: 70px; text-align: right; color: #f6fbff; font-weight: 700; font-family: var(--student-font-number); flex-shrink: 0; }
}

/* Footer */
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

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 12px;
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

  &.error {
    color: #f87171;
    flex-direction: column;
  }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      background: rgba(0, 184, 255, 0.2);
    }
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

/* ─────────── 滑动入场动画 ─────────── */
@keyframes sectionSlideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.academic-detail > .warn-section,
.footer-actions {
  animation: sectionSlideUp 0.5s ease-out both;
  &:nth-child(1) { animation-delay: 0.04s; }
  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.12s; }
  &:nth-child(4) { animation-delay: 0.16s; }
  &:nth-child(5) { animation-delay: 0.2s; }
  &:nth-child(6) { animation-delay: 0.24s; }
  &:nth-child(7) { animation-delay: 0.28s; }
  &:nth-child(8) { animation-delay: 0.32s; }
  &:nth-child(9) { animation-delay: 0.36s; }
  &:nth-child(10) { animation-delay: 0.4s; }
}

@media (max-width: 1280px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .risk-summary { grid-template-columns: repeat(2, 1fr); }
  .completion-summary { grid-template-columns: repeat(2, 1fr); }
  .pressure-summary { grid-template-columns: repeat(2, 1fr); }
  .two-col-grid {
    grid-template-columns: 1fr;
  }
}
</style>
