<script setup lang="ts">
/**
 * 学业预警详情（二级页面）
 * 路由：/student/academic-warning?studentId=xxx
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

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}

function goGpa() {
  router.push({ name: 'student-gpa-detail', query: { studentId: activeStudentId.value } })
}

function goFail() {
  router.push({ name: 'student-fail-detail', query: { studentId: activeStudentId.value } })
}

const levelColor = (level: string) =>
  ({ low: '#55e995', medium: '#facc15', high: '#ff7474' }[level] || '#8fb7cd')

const academicItems = computed(() => {
  if (!dashboard.value) return []
  return dashboard.value.attention.filter((i) => /学业|课程|挂科|GPA|补考/.test(`${i.category}${i.label}`))
})

const academicLevel = computed(() => {
  if (!academicItems.value.length) return 'low'
  const weights: Record<string, number> = { low: 1, medium: 2, high: 3 }
  return academicItems.value.reduce((highest, item) =>
    weights[item.level] > weights[highest] ? item.level : highest
  , 'low' as AttentionItemVM['level'])
})

const failedCourses = computed(() => {
  const item = academicItems.value.find((i) => /挂科课程/.test(i.label))
  if (!item) return []
  const match = item.label.match(/：(.+?)(等|$)/)
  return match ? match[1].split('、').map((n) => n.trim()).filter(Boolean) : []
})

const progressPercent = computed(() => dashboard.value?.creditProgress.courseCompletionRate ?? 0)

const failedCredits = computed(() => {
  const text = dashboard.value?.failedCritical[0]?.name ?? ''
  const match = text.match(/(\d+(\.\d+)?)/)
  return match ? parseFloat(match[1]) : 0
})

const suggestions = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const list: string[] = []
  if (d.academic.gpa > 0 && d.academic.gpa < 2.0) list.push(`GPA ${d.academic.gpa.toFixed(2)} 已低于 2.0 学业红线，需立即制定补考/重修计划`)
  else if (d.academic.gpa > 0 && d.academic.gpa < 2.5) list.push(`GPA ${d.academic.gpa.toFixed(2)} 处于观察区，建议加强专业课复习`)

  if (d.creditProgress.earned < d.creditProgress.required * 0.75) {
    list.push(`学分完成率 ${progressPercent.value}%，剩余 ${(d.creditProgress.required - d.creditProgress.earned).toFixed(1)} 学分待修，需合理安排选课`)
  }

  if (d.failedCritical.length) {
    list.push(`存在不及格学分，建议优先完成补考/重修闭环`)
  }

  list.push('建议每周固定自习时间，重点关注专业核心课程')
  list.push('可预约学业导师或朋辈辅导，及时解决课程难点')
  return list.slice(0, 5)
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学业预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="academic-warning">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card" :class="`kpi-card--${academicLevel}`">
            <span class="kpi-card__label">学业风险等级</span>
            <strong class="kpi-card__value">{{ academicLevel === 'high' ? '高危' : academicLevel === 'medium' ? '需关注' : '正常' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">当前 GPA</span>
            <strong class="kpi-card__value">{{ dashboard.academic.gpa.toFixed(2) }}</strong>
          </div>
          <div class="kpi-card" :class="failedCredits > 0 ? 'kpi-card--warn' : 'kpi-card--safe'">
            <span class="kpi-card__label">不及格学分</span>
            <strong class="kpi-card__value">{{ failedCredits.toFixed(1) }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">学分完成率</span>
            <strong class="kpi-card__value">{{ progressPercent }}%</strong>
          </div>
        </div>
      </section>

      <!-- 学分进度 + 挂科课程 并排 -->
      <div class="credit-fail-row">
        <section class="warn-section">
          <h3 class="warn-section__title">培养方案学分进度</h3>
          <div class="credit-progress">
            <div class="credit-progress__head">
              <span>已修 {{ dashboard.creditProgress.earned.toFixed(1) }} / 要求 {{ dashboard.creditProgress.required }} 学分</span>
              <span :class="progressPercent < 60 ? 'text-risk' : progressPercent < 80 ? 'text-warn' : 'text-safe'">{{ progressPercent }}%</span>
            </div>
            <div class="credit-progress__bar">
              <div class="credit-progress__bar-inner" :style="{ width: `${Math.min(100, progressPercent)}%`, background: progressPercent < 60 ? '#ff7474' : progressPercent < 80 ? '#facc15' : '#55e995' }" />
            </div>
          </div>
          <div class="bucket-grid">
            <div v-for="b in dashboard.creditProgress.buckets" :key="b.label" class="bucket-card">
              <span class="bucket-card__label">{{ b.label }}</span>
              <span class="bucket-card__value">{{ b.earned }}/{{ b.required }}</span>
              <div class="bucket-card__bar">
                <div class="bucket-card__bar-inner" :style="{ width: `${Math.min(100, (b.earned / b.required) * 100)}%` }" />
              </div>
            </div>
          </div>
        </section>

        <section class="warn-section">
          <h3 class="warn-section__title">挂科 / 补考 / 重修课程</h3>
          <div v-if="failedCourses.length" class="course-list">
            <div v-for="(c, idx) in failedCourses" :key="idx" class="course-item course-item--warn">
              <span class="course-item__dot" />
              <span class="course-item__name">{{ c }}</span>
              <span class="course-item__tag">待补考/重修</span>
            </div>
          </div>
          <div v-else-if="dashboard.failedCritical.length" class="course-list">
            <div class="course-item course-item--warn">
              <span class="course-item__dot" />
              <span class="course-item__name">{{ dashboard.failedCritical[0].name }}</span>
              <span class="course-item__tag">关注</span>
            </div>
          </div>
          <div v-else class="empty-cell">当前无挂科记录</div>
          <div class="section-actions">
            <button class="section-actions__btn" @click="goFail">查看挂科详情</button>
            <button class="section-actions__btn" @click="goGpa">查看 GPA 详情</button>
          </div>
        </section>
      </div>

      <!-- 预警台账 -->
      <section class="warn-section" style="grid-column: 1 / -1;">
        <h3 class="warn-section__title">学业预警台账</h3>
        <div class="warn-table-wrap">
          <table class="warn-table">
            <thead><tr><th>分类</th><th>预警项</th><th>等级</th></tr></thead>
            <tbody>
              <tr v-for="item in academicItems" :key="item.id" :class="`row--${item.level}`">
                <td><span class="cat-badge">{{ item.category }}</span></td>
                <td class="cell-label">{{ item.label }}</td>
                <td><span class="level-badge" :class="`level-badge--${item.level}`">{{ item.levelLabel }}</span></td>
              </tr>
              <tr v-if="!academicItems.length"><td colspan="3" class="empty-cell">暂无学业预警项</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 帮扶记录 + 建议 并排 -->
      <div class="support-suggestion-row">
        <section class="warn-section">
          <h3 class="warn-section__title">学业帮扶记录</h3>
          <div v-if="dashboard.academic.supportRecords.length" class="support-list">
            <div v-for="(r, idx) in dashboard.academic.supportRecords" :key="idx" class="support-item">
              <span class="support-item__time">{{ r.date }}</span>
              <span class="support-item__person">{{ r.person }}</span>
              <span class="support-item__content">{{ r.content }}</span>
            </div>
          </div>
          <div v-else class="empty-cell">暂无帮扶记录</div>
        </section>

        <section class="warn-section">
          <h3 class="warn-section__title">学业提升建议</h3>
          <ul class="suggestion-list">
            <li v-for="(s, idx) in suggestions" :key="idx">{{ s }}</li>
          </ul>
        </section>
      </div>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.academic-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }
  &--safe { border-color: #55e995; }
  &--warn { border-color: #facc15; }

  &__label {
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 20px;
    font-weight: 900;
    color: #f6fbff;
  }
}

/* Credit progress */
.credit-progress {
  margin-bottom: 10px;

  &__head {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #9ecae8;
    margin-bottom: 6px;
    font-weight: 600;
  }

  &__bar {
    height: 10px;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 5px;
    transition: width 0.5s ease;
  }
}

.bucket-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.bucket-card {
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 13px;
    color: #7eb4d8;
  }

  &__value {
    float: right;
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__bar {
    clear: both;
    height: 5px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.06);
    margin-top: 6px;
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, #00b8ff, #00e5ff);
  }
}

/* Course list */
.course-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #facc15;
    flex-shrink: 0;
  }

  &__name {
    flex: 1;
    color: #d0e8f8;
    font-weight: 600;
  }

  &__tag {
    font-size: 12px;
    padding: 1px 6px;
    border-radius: 999px;
    background: rgba(250, 204, 21, 0.12);
    color: #facc15;
    font-weight: 700;
  }
}

.section-actions {
  display: flex;
  gap: 8px;

  &__btn {
    flex: 1;
    padding: 6px 0;
    border-radius: 3px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.08);
    color: #8ef6ff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;

    &:hover { background: rgba(0, 184, 255, 0.16); }
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
  font-size: 14px;
  color: rgba(184, 236, 255, 0.85);

  th {
    text-align: left;
    padding: 6px 8px;
    font-size: 13px;
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
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 12px;
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
  font-size: 14px;
}

/* Support + Suggestion row */
.support-suggestion-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  grid-column: 1 / -1;
}

/* Support */
.support-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.support-item {
  display: flex;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;

  &__time { color: #7eb4d8; font-weight: 700; white-space: nowrap; }
  &__person { color: #8ef6ff; font-weight: 700; white-space: nowrap; }
  &__content { color: #d0e8f8; flex: 1; }
}

/* Suggestions */
.suggestion-list {
  margin: 0;
  padding-left: 18px;
  color: #d0e8f8;
  font-size: 14px;
  line-height: 1.8;

  li::marker { color: #00d4ff; }
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
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

.text-safe { color: #55e995; }
.text-warn { color: #facc15; }
.text-risk { color: #ff7474; }

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
    cursor: pointer;
    font-size: 15px;

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
  .academic-warning { grid-template-columns: 1fr; }
  .credit-fail-row { grid-template-columns: 1fr; }
  .support-suggestion-row { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .bucket-grid { grid-template-columns: 1fr; }
}

</style>
