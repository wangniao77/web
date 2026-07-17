<script setup lang="ts">
/**
 * 就业预警详情（二级页面）
 * 路由：/student/employment-warning?studentId=xxx
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'

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

const employmentItems = computed(() => {
  if (!dashboard.value) return []
  return dashboard.value.attention.filter((i) => /就业|实习|职业/.test(`${i.category}${i.label}`))
})

const employmentLevel = computed(() => {
  if (!employmentItems.value.length) return 'low'
  const weights: Record<string, number> = { low: 1, medium: 2, high: 3 }
  return employmentItems.value.reduce((highest, item) =>
    weights[item.level] > weights[highest] ? item.level : highest
  , 'low' as ReturnType<typeof employmentItems.value[number]['level']>)
})

const jobMatches = computed(() => dashboard.value?.aiPortrait.jobMatches ?? [])
const selectedJob = ref<number>(0)

const weaknesses = computed(() => {
  const d = dashboard.value
  if (!d) return []
  const list: { label: string; level: 'high' | 'medium' | 'low'; desc: string }[] = []
  if (d.internship.internshipCount === 0) {
    list.push({ label: '实习经历', level: 'high', desc: '暂无企业实习记录，建议利用假期补充' })
  }
  if (d.careerDev.resumeStatus?.includes('未完善')) {
    list.push({ label: '简历完善度', level: 'medium', desc: '简历状态未完善，缺少项目与技能亮点' })
  }
  if (!d.profile.cet4Score) {
    list.push({ label: '英语四级', level: 'high', desc: 'CET-4 未通过，多数企业设有门槛' })
  } else if (!d.profile.cet6Score) {
    list.push({ label: '英语六级', level: 'medium', desc: 'CET-6 未通过，优质岗位竞争力受限' })
  }
  if (d.academic.gpa > 0 && d.academic.gpa < 2.5) {
    list.push({ label: '学业成绩', level: 'medium', desc: 'GPA 偏低，可能影响部分企业简历筛选' })
  }
  if (list.length === 0) {
    list.push({ label: '综合条件', level: 'low', desc: '整体就业准备度尚可，持续积累即可' })
  }
  return list
})

const actionPlan = computed(() => {
  const d = dashboard.value
  if (!d) return []
  return [
    { time: '本周', action: '完善个人简历，补充项目经历与技能关键词', tag: '高优' },
    { time: '本月', action: `锁定目标方向「${d.employment.careerDirections[0] || '待定'}」，梳理岗位 JD 技能要求`, tag: '重点' },
    { time: '本学期', action: '参加至少 1 场专业对口双选会或企业宣讲', tag: '建议' },
    { time: '假期', action: '争取 1 段企业实习或项目实践经历', tag: '长期' },
  ]
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="就业预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="employment-warning">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card" :class="`kpi-card--${employmentLevel}`">
            <span class="kpi-card__label">就业风险等级</span>
            <strong class="kpi-card__value">{{ employmentLevel === 'high' ? '高危' : employmentLevel === 'medium' ? '需关注' : '正常' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">就业准备度</span>
            <strong class="kpi-card__value">{{ dashboard.employment.jobReadiness }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">推荐方向</span>
            <strong class="kpi-card__value kpi-card__value--small">{{ dashboard.aiAssistant.recommendedDirection }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">实习经历</span>
            <strong class="kpi-card__value">{{ dashboard.internship.internshipCount }} 段</strong>
          </div>
        </div>
      </section>

      <!-- 人岗匹配 -->
      <section class="warn-section">
        <h3 class="warn-section__title">人岗匹配推荐 <i class="mock-tag">模拟数据</i></h3>
        <div v-if="jobMatches.length" class="job-match-layout">
          <!-- 左侧：可选岗位列表 -->
          <div class="job-match-list">
            <div
              v-for="(job, idx) in jobMatches.slice(0, 8)"
              :key="idx"
              class="job-match-item"
              :class="{ 'is-active': selectedJob === idx }"
              @click="selectedJob = idx"
            >
              <span class="job-match-item__rank">TOP {{ idx + 1 }}</span>
              <span class="job-match-item__role">{{ job.role }}</span>
              <div class="job-match-item__bar">
                <div
                  class="job-match-item__bar-inner"
                  :style="{ width: `${job.match}%`, background: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }"
                />
              </div>
              <strong class="job-match-item__match" :style="{ color: job.match >= 80 ? '#55e995' : job.match >= 60 ? '#facc15' : '#ff7474' }">{{ job.match }}%</strong>
            </div>
          </div>
          <!-- 右侧：选中岗位详情 -->
          <div class="job-match-detail">
            <div class="job-match-detail__role">{{ jobMatches[selectedJob].role }}</div>
            <div class="job-match-detail__meta">
              <div class="job-match-detail__kv"><label>匹配度</label><strong :style="{ color: jobMatches[selectedJob].match >= 80 ? '#55e995' : jobMatches[selectedJob].match >= 60 ? '#facc15' : '#ff7474' }">{{ jobMatches[selectedJob].match }}%</strong></div>
              <div class="job-match-detail__kv"><label>城市</label><span>{{ jobMatches[selectedJob].city }}</span></div>
              <div class="job-match-detail__kv"><label>薪资</label><span>{{ jobMatches[selectedJob].salary }}</span></div>
            </div>
            <div class="job-match-detail__section">
              <label>推荐理由</label>
              <p>{{ jobMatches[selectedJob].reason }}</p>
            </div>
            <div class="job-match-detail__section">
              <label>岗位要求</label>
              <p>{{ jobMatches[selectedJob].requirements }}</p>
            </div>
          </div>
        </div>
        <div v-else class="empty-cell">暂无人岗匹配数据</div>
      </section>

      <!-- 能力短板 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业能力短板分析</h3>
        <div class="weakness-list">
          <div v-for="(w, idx) in weaknesses" :key="idx" class="weakness-item" :class="`weakness-item--${w.level}`">
            <span class="weakness-item__dot" :style="{ background: levelColor(w.level) }" />
            <span class="weakness-item__label">{{ w.label }}</span>
            <span class="weakness-item__level" :style="{ color: levelColor(w.level) }">{{ { low: '良好', medium: '需关注', high: '短板' }[w.level] }}</span>
            <span class="weakness-item__desc">{{ w.desc }}</span>
          </div>
        </div>
      </section>

      <!-- 求职行动 -->
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

      <!-- 预警台账 -->
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

      <!-- 就业意向 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业意向与准备状态</h3>
        <div class="info-grid">
          <div class="info-item"><span class="info-item__label">意向城市</span><span class="info-item__value">{{ dashboard.careerDev.targetCity }}</span></div>
          <div class="info-item"><span class="info-item__label">期望薪资</span><span class="info-item__value">{{ dashboard.careerDev.expectedSalary }}</span></div>
          <div class="info-item"><span class="info-item__label">简历状态</span><span class="info-item__value">{{ dashboard.careerDev.resumeStatus }}</span></div>
          <div class="info-item"><span class="info-item__label">项目经历</span><span class="info-item__value">{{ dashboard.careerDev.projectExperiences.length }} 项</span></div>
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

  &--low { border-color: #55e995; }
  &--medium { border-color: #facc15; }
  &--high { border-color: #ff7474; }

  &__label {
    font-size: 13px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 20px;
    font-weight: 900;
    color: #f6fbff;

    &--small {
      font-size: 14px;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

/* Job match layout: left list + right detail */
.job-match-layout {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
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
    font-size: 12px;
    padding: 1px 5px;
    border-radius: 999px;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    font-weight: 700;
    white-space: nowrap;
  }

  &__role {
    font-size: 15px;
    font-weight: 700;
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar {
    display: none;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 3px;
  }

  &__match {
    font-size: 15px;
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
    font-size: 18px;
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
      font-size: 13px;
      color: #7eb4d8;
      font-weight: 600;
    }

    strong {
      font-size: 18px;
      font-weight: 900;
      color: #f6fbff;
    }

    span {
      font-size: 15px;
      font-weight: 700;
      color: #d0e8f8;
    }
  }

  &__section {
    label {
      display: block;
      font-size: 14px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 4px;
    }

    p {
      margin: 0;
      font-size: 14px;
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
  font-size: 14px;

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
    font-size: 13px;
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
  font-size: 14px;

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
    font-size: 15px;
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
  display: inline-block;
  font-weight: 700;
  font-size: 12px;
  padding: 1px 5px;
  border-radius: 999px;
  background: rgba(0, 184, 255, 0.08);
  border: 1px solid rgba(0, 212, 255, 0.12);
  color: #8ef6ff;
  white-space: nowrap;
}

.level-badge {
  font-size: 13px;
  padding: 2px 8px;
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
  font-size: 14px;
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
    font-size: 13px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
  }
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
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .job-match-layout { grid-template-columns: 1fr; }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .weakness-item { grid-template-columns: 12px 80px 48px 1fr; }
}
</style>
