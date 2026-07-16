<script setup lang="ts">
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

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

/* ─── 1. 毕业状态总览 ─── */
const graduationStatus = computed(() => {
  if (!dashboard.value) return null
  const { profile, creditProgress, academic, failedCritical } = dashboard.value
  const failCount = failedCritical.length
  let status: string
  let level: 'normal' | 'warning' | 'risk'
  if (failCount >= 3 || creditProgress.earnedPercent < 60) {
    status = '风险'
    level = 'risk'
  } else if (failCount > 0 || creditProgress.earnedPercent < 80) {
    status = '关注'
    level = 'warning'
  } else {
    status = '正常'
    level = 'normal'
  }
  const grade = profile.grade || ''
  const m = grade.match(/(\d{4})/)
  const expectedGraduation = m ? `${parseInt(m[1]) + 4}年6月` : '预计正常毕业'
  return {
    status, level, expectedGraduation,
    creditPercent: creditProgress.earnedPercent,
    gpa: academic.gpa,
    thesisStatus: profile.thesisStatus || '未开始',
  }
})

/* ─── 2. 毕业条件完成情况 ─── */
const graduationConditions = computed(() => {
  if (!dashboard.value) return null
  const { creditProgress, academic } = dashboard.value
  const buckets = creditProgress.buckets || []
  const earned = creditProgress.earned || 0
  const required = creditProgress.required || 160
  return {
    credit: { earned, required: creditProgress.required, percent: creditProgress.earnedPercent },
    buckets: buckets.length ? buckets : [
      { label: '必修学分', earned: Math.round(earned * 0.7 * 10) / 10, required: Math.round(required * 0.7) },
      { label: '选修学分', earned: Math.round(earned * 0.2 * 10) / 10, required: Math.round(required * 0.2) },
      { label: '通识学分', earned: Math.round(earned * 0.1 * 10) / 10, required: Math.max(1, Math.round(required * 0.1)) },
    ],
    courseCompletion: {
      completed: academic.excellentCourses || 0,
      total: academic.totalCourses || 0,
      percent: academic.totalCourses > 0 ? Math.round((academic.excellentCourses / academic.totalCourses) * 100) : 0,
    },
    secondClass: { earned: creditProgress.secondClassroomEarned, required: creditProgress.secondClassroomRequired, percent: creditProgress.secondPercent },
  }
})

/* ─── 3. 毕设进度跟踪 ─── */
const thesisProgress = computed(() => {
  if (!dashboard.value) return null
  const { profile } = dashboard.value
  const steps = ['选题', '开题', '中期检查', '论文提交', '答辩']
  const currentStatus = profile.thesisStatus || '未开始'
  const activeIndex = steps.findIndex((s) => currentStatus.includes(s))
  const nextStep = activeIndex >= 0 && activeIndex < steps.length - 1 ? steps[activeIndex + 1] : '已完成'
  return { advisor: profile.thesisAdvisor || profile.mentor || '—', currentStatus, activeIndex: activeIndex >= 0 ? activeIndex : -1, steps, nextStep }
})

/* ─── 4. 毕业风险分析 ─── */
const riskAnalysis = computed(() => {
  if (!dashboard.value) return []
  const { creditProgress, failedCritical, academic, profile } = dashboard.value
  const risks: Array<{ type: string; level: 'high' | 'medium' | 'low'; desc: string }> = []
  if (creditProgress.earnedPercent < 80) {
    risks.push({ type: '学分风险', level: creditProgress.earnedPercent < 60 ? 'high' : 'medium', desc: `已修 ${creditProgress.earned}/${creditProgress.required}，完成率 ${creditProgress.earnedPercent}%` })
  }
  if (failedCritical.length > 0) {
    risks.push({ type: '挂科风险', level: failedCritical.length >= 3 ? 'high' : 'medium', desc: `挂科 ${failedCritical.length} 门，需补考或重修` })
  }
  const thesisStatus = profile.thesisStatus || '未开始'
  if (thesisStatus === '未开始' || thesisStatus.includes('选题')) {
    risks.push({ type: '毕设进度', level: 'medium', desc: `当前毕设阶段：${thesisStatus}，建议加快进度` })
  }
  if (academic.gpa > 0 && academic.gpa < 2.5) {
    risks.push({ type: '学业水平', level: academic.gpa < 2.0 ? 'high' : 'medium', desc: `GPA ${academic.gpa.toFixed(2)}，低于毕业要求` })
  }
  if (risks.length === 0) {
    risks.push({ type: '综合评估', level: 'low', desc: '当前各项毕业条件符合要求，继续保持' })
  }
  return risks
})

/* ─── 5. 毕业流程时间轴 ─── */
const graduationTimeline = computed(() => {
  if (!dashboard.value) return []
  const { profile } = dashboard.value
  const currentStatus = profile.thesisStatus || '未开始'
  const steps = ['选题', '开题', '中期检查', '论文提交', '答辩', '毕业审核']
  const currentIndex = steps.findIndex((s) => currentStatus.includes(s))
  return steps.map((name, i) => ({
    name,
    status: i < currentIndex ? 'completed' : i === currentIndex ? 'active' : 'pending' as const,
  }))
})

/* ─── 6. 出口发展情况 ─── */
const exportDevelopment = computed(() => {
  if (!dashboard.value) return null
  const { careerDev, employment, aiPortrait } = dashboard.value
  return {
    destination: careerDev.employmentDestination || careerDev.employmentIntention || '待实习',
    careerDirections: employment.careerDirections,
    jobReadiness: employment.jobReadiness,
    certificateReadiness: employment.certificateReadiness,
    targetUniversities: careerDev.targetUniversities || [],
    targetCompanies: careerDev.targetCompanies || [],
    jobMatches: aiPortrait.jobMatches.slice(0, 3),
  }
})

/* ─── 7. 行动建议 ─── */
const actionSuggestions = computed(() => {
  if (!dashboard.value) return []
  const { employment, aiAssistant, failedCritical, creditProgress } = dashboard.value
  const suggestions: string[] = []
  if (failedCritical.length > 0) {
    suggestions.push(`优先补考/重修挂科课程：${failedCritical.map((c) => c.name).join('、')}`)
  }
  if (creditProgress.earnedPercent < 80) {
    suggestions.push(`加修学分课程，当前完成率 ${creditProgress.earnedPercent}%，需达到 100%`)
  }
  if (employment.developmentPath.short) {
    suggestions.push(employment.developmentPath.short)
  }
  if (employment.developmentPath.medium) {
    suggestions.push(employment.developmentPath.medium)
  }
  if (aiAssistant.shortTermSuggestions.length) {
    suggestions.push(...aiAssistant.shortTermSuggestions.slice(0, 2))
  }
  if (suggestions.length === 0) {
    suggestions.push('继续保持当前学习状态，按时完成各阶段毕业审核任务')
  }
  return suggestions
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="毕业审核与毕设进度"
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

    <div v-else-if="dashboard" class="graduation-audit">
      <!-- 1. 毕业状态总览 -->
      <section v-if="graduationStatus" class="warn-section">
        <h3 class="warn-section__title">毕业状态总览</h3>
        <div class="status-overview">
          <div class="status-card" :class="`status-card--${graduationStatus.level}`">
            <span class="status-card__label">当前毕业状态</span>
            <strong class="status-card__value">{{ graduationStatus.status }}</strong>
          </div>
          <div class="status-card">
            <span class="status-card__label">预计毕业时间</span>
            <strong class="status-card__value">{{ graduationStatus.expectedGraduation }}</strong>
          </div>
          <div class="status-card">
            <span class="status-card__label">学分完成率</span>
            <strong class="status-card__value">{{ graduationStatus.creditPercent }}%</strong>
          </div>
          <div class="status-card">
            <span class="status-card__label">当前 GPA</span>
            <strong class="status-card__value">{{ graduationStatus.gpa.toFixed(2) }}</strong>
          </div>
          <div class="status-card">
            <span class="status-card__label">毕设阶段</span>
            <strong class="status-card__value">{{ graduationStatus.thesisStatus }}</strong>
          </div>
        </div>
      </section>

      <!-- 2. 毕业条件完成情况 -->
      <section v-if="graduationConditions" class="warn-section">
        <h3 class="warn-section__title">毕业条件完成情况</h3>
        <div class="condition-grid">
          <div class="condition-block">
            <div class="condition-block__head">
              <span>总学分</span>
              <strong>{{ graduationConditions.credit.earned }} / {{ graduationConditions.credit.required }}</strong>
            </div>
            <div class="condition-block__bar">
              <div class="condition-block__bar-inner" :style="{ width: `${graduationConditions.credit.percent}%` }" />
            </div>
          </div>
          <div class="condition-block">
            <div class="condition-block__head">
              <span>必修课程</span>
              <strong>{{ graduationConditions.courseCompletion.completed }} / {{ graduationConditions.courseCompletion.total }}</strong>
            </div>
            <div class="condition-block__bar">
              <div class="condition-block__bar-inner" :style="{ width: `${graduationConditions.courseCompletion.percent}%` }" />
            </div>
          </div>
          <div class="condition-block">
            <div class="condition-block__head">
              <span>第二课堂</span>
              <strong>{{ graduationConditions.secondClass.earned }} / {{ graduationConditions.secondClass.required }}</strong>
            </div>
            <div class="condition-block__bar">
              <div class="condition-block__bar-inner" :style="{ width: `${graduationConditions.secondClass.percent}%` }" />
            </div>
          </div>
        </div>
        <div class="bucket-list">
          <div v-for="b in graduationConditions.buckets" :key="b.label" class="bucket-item">
            <span class="bucket-item__label">{{ b.label }}</span>
            <div class="bucket-item__bar">
              <div class="bucket-item__bar-inner" :style="{ width: `${Math.min(100, Math.round((b.earned / Math.max(1, b.required)) * 100))}%` }" />
            </div>
            <span class="bucket-item__value">{{ b.earned }}/{{ b.required }}</span>
          </div>
        </div>
      </section>

      <!-- 3. 毕设进度跟踪 -->
      <section v-if="thesisProgress" class="warn-section">
        <h3 class="warn-section__title">毕设进度跟踪</h3>
        <div class="thesis-info">
          <div class="info-cell">
            <em>指导教师</em><span>{{ thesisProgress.advisor }}</span>
          </div>
          <div class="info-cell">
            <em>当前阶段</em><span class="highlight">{{ thesisProgress.currentStatus }}</span>
          </div>
          <div class="info-cell">
            <em>下一阶段</em><span>{{ thesisProgress.nextStep }}</span>
          </div>
        </div>
        <div class="thesis-steps">
          <div
            v-for="(step, i) in thesisProgress.steps"
            :key="step"
            class="thesis-step"
            :class="{ completed: i <= thesisProgress.activeIndex, active: i === thesisProgress.activeIndex }"
          >
            <div class="thesis-step__dot" />
            <span class="thesis-step__name">{{ step }}</span>
          </div>
        </div>
      </section>

      <!-- 4. 毕业风险分析 -->
      <section class="warn-section">
        <h3 class="warn-section__title">毕业风险分析</h3>
        <div class="risk-list">
          <div
            v-for="risk in riskAnalysis"
            :key="risk.type"
            class="risk-item"
            :class="`risk-item--${risk.level}`"
          >
            <span class="risk-item__badge">{{ risk.level === 'high' ? '高风险' : risk.level === 'medium' ? '需关注' : '正常' }}</span>
            <strong class="risk-item__type">{{ risk.type }}</strong>
            <span class="risk-item__desc">{{ risk.desc }}</span>
          </div>
        </div>
      </section>

      <!-- 5. 毕业流程时间轴 -->
      <section class="warn-section">
        <h3 class="warn-section__title">毕业流程时间轴</h3>
        <div class="timeline">
          <div class="timeline__track" />
          <div class="timeline__nodes">
            <div
              v-for="node in graduationTimeline"
              :key="node.name"
              class="timeline__node"
              :class="node.status"
            >
              <div class="timeline__dot" />
              <span class="timeline__name">{{ node.name }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 6. 出口发展情况 -->
      <section v-if="exportDevelopment" class="warn-section">
        <h3 class="warn-section__title">出口发展情况</h3>
        <div class="export-overview">
          <div class="export-main">
            <div class="export-item">
              <span class="export-item__label">当前去向</span>
              <strong class="export-item__value">{{ exportDevelopment.destination }}</strong>
            </div>
          </div>
          <div class="export-readiness" v-if="exportDevelopment.careerDirections.length">
            <span class="export-label">职业方向</span>
            <div class="tag-list">
              <span v-for="d in exportDevelopment.careerDirections" :key="d" class="tag">{{ d }}</span>
            </div>
          </div>
          <div class="export-readiness">
            <div class="readiness-row">
              <span>就业准备度</span>
              <div class="readiness-bar">
                <div class="readiness-bar__inner" :style="{ width: `${exportDevelopment.jobReadiness}%` }" />
              </div>
              <strong>{{ exportDevelopment.jobReadiness }}%</strong>
            </div>
            <div class="readiness-row">
              <span>证书准备度</span>
              <div class="readiness-bar">
                <div class="readiness-bar__inner" :style="{ width: `${exportDevelopment.certificateReadiness}%` }" />
              </div>
              <strong>{{ exportDevelopment.certificateReadiness }}%</strong>
            </div>
          </div>
          <div class="export-targets" v-if="exportDevelopment.targetUniversities.length || exportDevelopment.targetCompanies.length">
            <div v-if="exportDevelopment.targetUniversities.length" class="target-group">
              <span class="target-group__label">目标高校</span>
              <div class="target-group__list">
                <span v-for="u in exportDevelopment.targetUniversities" :key="u" class="target-tag">{{ u }}</span>
              </div>
            </div>
            <div v-if="exportDevelopment.targetCompanies.length" class="target-group">
              <span class="target-group__label">目标企业</span>
              <div class="target-group__list">
                <span v-for="c in exportDevelopment.targetCompanies" :key="c" class="target-tag">{{ c }}</span>
              </div>
            </div>
          </div>
          <div class="export-matches" v-if="exportDevelopment.jobMatches.length">
            <span class="export-label">岗位匹配</span>
            <div class="match-list">
              <div v-for="job in exportDevelopment.jobMatches" :key="job.role" class="match-row">
                <span>{{ job.role }}</span>
                <div class="match-bar">
                  <div class="match-bar__inner" :style="{ width: `${job.match}%` }" />
                </div>
                <strong>{{ job.match }}%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 7. 行动建议 -->
      <section class="warn-section">
        <h3 class="warn-section__title">行动建议</h3>
        <ul class="action-list">
          <li v-for="(item, i) in actionSuggestions" :key="i">
            <span class="action-list__dot" />
            <span>{{ item }}</span>
          </li>
        </ul>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.graduation-audit {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)), rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
  animation: sectionSlideUp 0.5s ease-out both;
  &:nth-child(1) { animation-delay: 0.04s; }
  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.12s; }
  &:nth-child(4) { animation-delay: 0.16s; }
  &:nth-child(5) { animation-delay: 0.20s; }
  &:nth-child(6) { animation-delay: 0.24s; }
  &:nth-child(7) { animation-delay: 0.28s; }
}

.warn-section__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

/* ─── 1. 毕业状态总览 ─── */
.status-overview {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  text-align: center;

  &__label {
    color: #8fb7cd;
    font-size: 12px;
    font-weight: 600;
  }

  &__value {
    color: #d0e8f8;
    font-size: 15px;
    font-weight: 700;
  }

  &--normal &__value { color: #43e7af; }
  &--warning &__value { color: #e8b450; }
  &--risk &__value { color: #f87171; }
}

/* ─── 2. 毕业条件完成情况 ─── */
.condition-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 10px;
}

.condition-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span { color: #8fb7cd; font-size: 13px; font-weight: 600; }
    strong { color: #43e7af; font-size: 14px; font-weight: 700; }
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }
}

.bucket-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bucket-item {
  display: grid;
  grid-template-columns: 80px 1fr 70px;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);

  &__label { color: #8fb7cd; font-size: 12px; font-weight: 600; }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #00b8ff, #62dfff);
  }

  &__value { color: #d0e8f8; font-size: 12px; text-align: right; }
}

/* ─── 3. 毕设进度跟踪 ─── */
.thesis-info {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.info-cell {
  display: flex;
  align-items: baseline;
  gap: 6px;
  font-size: 13px;

  em { color: #8fb7cd; font-style: normal; font-weight: 600; flex-shrink: 0; }
  span { color: #d0e8f8; font-weight: 600; }
  .highlight { color: #43e7af; font-weight: 700; }
}

.thesis-steps {
  display: flex;
  align-items: stretch;
  gap: 8px;
  position: relative;
  padding: 0 4px;
}

.thesis-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  text-align: center;
  padding: 8px 4px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(100, 200, 255, 0.3);
    background: rgba(0, 40, 80, 0.8);
  }

  &__name {
    color: #8fb7cd;
    font-size: 12px;
    font-weight: 600;
  }

  &.completed {
    background: rgba(67, 231, 175, 0.08);
    .thesis-step__dot { border-color: #43e7af; background: #43e7af; }
    .thesis-step__name { color: #43e7af; }
  }

  &.active {
    background: rgba(0, 184, 255, 0.1);
    .thesis-step__dot { border-color: #00b8ff; background: #00b8ff; box-shadow: 0 0 10px rgba(0, 184, 255, 0.4); }
    .thesis-step__name { color: #7ff6ff; font-weight: 700; }
  }
}

/* ─── 4. 毕业风险分析 ─── */
.risk-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.risk-item {
  display: grid;
  grid-template-columns: 70px 100px 1fr;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__badge {
    padding: 2px 8px;
    border-radius: 3px;
    font-size: 11px;
    font-weight: 700;
    text-align: center;
  }

  &--high &__badge { background: rgba(248, 113, 113, 0.15); color: #f87171; }
  &--medium &__badge { background: rgba(232, 180, 80, 0.15); color: #e8b450; }
  &--low &__badge { background: rgba(67, 231, 175, 0.15); color: #43e7af; }

  &__type {
    color: #d0e8f8;
    font-size: 13px;
    font-weight: 700;
  }

  &__desc {
    color: #8fb7cd;
    font-size: 12px;
  }
}

/* ─── 5. 毕业流程时间轴 ─── */
.timeline {
  position: relative;
  padding: 10px 0 6px;

  &__track {
    position: absolute;
    top: 24px;
    left: 8%;
    right: 8%;
    height: 2px;
    background: linear-gradient(90deg, rgba(100, 200, 255, 0.55), rgba(100, 200, 255, 0.12));
  }

  &__nodes {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    position: relative;
  }

  &__node {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;

    .timeline__dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid rgba(100, 200, 255, 0.3);
      background: rgba(0, 40, 80, 0.8);
      flex-shrink: 0;
    }

    .timeline__name {
      color: #8fb7cd;
      font-size: 12px;
      font-weight: 600;
    }

    &.completed {
      .timeline__dot { border-color: #43e7af; background: #43e7af; }
      .timeline__name { color: #43e7af; }
    }

    &.active {
      .timeline__dot { border-color: #00b8ff; background: #00b8ff; box-shadow: 0 0 10px rgba(0, 184, 255, 0.4); }
      .timeline__name { color: #7ff6ff; font-weight: 700; }
    }
  }
}

/* ─── 6. 出口发展情况 ─── */
.export-overview {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-main {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.export-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { color: #8fb7cd; font-size: 12px; font-weight: 600; }
  &__value { color: #43e7af; font-size: 15px; font-weight: 700; }
}

.export-readiness {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
}

.readiness-row {
  display: grid;
  grid-template-columns: 100px 1fr 50px;
  align-items: center;
  gap: 8px;

  span { color: #8fb7cd; font-size: 13px; font-weight: 600; }
  strong { color: #43e7af; font-size: 13px; font-weight: 700; text-align: right; }
}

.readiness-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 69, 91, 0.68);
  overflow: hidden;

  &__inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }
}

.export-label {
  color: #8fb7cd;
  font-size: 12px;
  font-weight: 600;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  border-radius: 3px;
  background: rgba(67, 231, 175, 0.12);
  color: #43e7af;
  font-size: 12px;
  font-weight: 600;
}

.export-targets {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.target-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { color: #8fb7cd; font-size: 12px; font-weight: 600; }

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.target-tag {
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.12);
  color: #55dfff;
  font-size: 12px;
  font-weight: 600;
}

.export-matches {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-row {
  display: grid;
  grid-template-columns: 1fr 100px 50px;
  align-items: center;
  gap: 8px;

  span { color: #d0e8f8; font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  strong { color: #43e7af; font-size: 13px; font-weight: 700; text-align: right; }
}

.match-bar {
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 69, 91, 0.68);
  overflow: hidden;

  &__inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }
}

/* ─── 7. 行动建议 ─── */
.action-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);
    color: #d0e8f8;
    font-size: 13px;
    line-height: 1.45;
  }
}

.action-list__dot {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  border-radius: 50%;
  background: #43e7af;
  flex-shrink: 0;
  box-shadow: 0 0 6px rgba(67, 231, 175, 0.35);
}

/* ─── Loading / Error ─── */
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

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes sectionSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── 响应式 ─── */
@media (max-width: 1280px) {
  .status-overview { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .condition-grid { grid-template-columns: 1fr; }
  .thesis-info { grid-template-columns: 1fr; }
  .export-main { grid-template-columns: 1fr; }
  .export-targets { grid-template-columns: 1fr; }
  .risk-item { grid-template-columns: 70px 1fr; gap: 6px; }
  .risk-item__type { display: none; }
  .readiness-row { grid-template-columns: 80px 1fr 50px; }
  .match-row { grid-template-columns: 1fr 80px 40px; }
  .timeline__nodes { gap: 6px; }
}
</style>
