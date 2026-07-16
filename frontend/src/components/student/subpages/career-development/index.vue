<script setup lang="ts">
/**
 * 出口发展详情（二级页面）
 * 路由：/student/career-development?studentId=xxx
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

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

const employmentDestination = computed(() => {
  if (!dashboard.value) return '—'
  return dashboard.value.careerDev.employmentDestination || dashboard.value.careerDev.employmentIntention || '待实习'
})

const jobReadiness = computed(() => {
  if (!dashboard.value) return 0
  return dashboard.value.employment.jobReadiness
})

const certificateReadiness = computed(() => {
  if (!dashboard.value) return 0
  return dashboard.value.employment.certificateReadiness
})

const careerDirections = computed(() => {
  if (!dashboard.value) return []
  return dashboard.value.employment.careerDirections
})

const developmentPath = computed(() => {
  if (!dashboard.value) return { short: '—', medium: '—', long: '—' }
  return dashboard.value.employment.developmentPath
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="出口发展详情"
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

    <div v-else-if="dashboard" class="career-development">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-card__label">就业去向</span>
            <strong class="kpi-card__value">{{ employmentDestination }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">求职意向城市</span>
            <strong class="kpi-card__value">{{ dashboard.careerDev.targetCity || '未填报' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">期望薪资</span>
            <strong class="kpi-card__value">{{ dashboard.careerDev.expectedSalary || '未填报' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">简历状态</span>
            <strong class="kpi-card__value">{{ dashboard.careerDev.resumeStatus || '未完善' }}</strong>
          </div>
        </div>
      </section>

      <!-- 对标信息 -->
      <section class="warn-section">
        <h3 class="warn-section__title">升学与就业对标</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-item__label">升学高校对标</span>
            <span class="info-item__value">{{ (dashboard.careerDev.targetUniversities || []).join('、') || '待明确' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">就业大厂对标</span>
            <span class="info-item__value">{{ (dashboard.careerDev.targetCompanies || []).join('、') || '待明确' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">实习单位</span>
            <span class="info-item__value">{{ dashboard.careerDev.internshipBases.join('、') || '暂无' }}</span>
          </div>
          <div class="info-item">
            <span class="info-item__label">实践基地</span>
            <span class="info-item__value">{{ dashboard.careerDev.practiceBases.join('、') || '暂无' }}</span>
          </div>
        </div>
      </section>

      <!-- 就业准备度 -->
      <section class="warn-section">
        <h3 class="warn-section__title">就业准备度</h3>
        <div class="readiness-row">
          <div class="readiness-item">
            <span class="readiness-item__label">岗位准备度</span>
            <div class="readiness-bar">
              <div class="readiness-bar__inner" :style="{ width: `${jobReadiness}%` }" />
            </div>
            <strong class="readiness-item__value">{{ jobReadiness }}%</strong>
          </div>
          <div class="readiness-item">
            <span class="readiness-item__label">证书准备度</span>
            <div class="readiness-bar">
              <div class="readiness-bar__inner" :style="{ width: `${certificateReadiness}%` }" />
            </div>
            <strong class="readiness-item__value">{{ certificateReadiness }}%</strong>
          </div>
        </div>
      </section>

      <!-- 职业方向 + 分阶段行动建议 -->
      <div class="career-row">
        <section class="warn-section">
          <h3 class="warn-section__title">职业方向</h3>
          <div class="tag-list">
            <span v-for="dir in careerDirections" :key="dir" class="tag">{{ dir }}</span>
            <span v-if="!careerDirections.length" class="empty-cell">暂无职业方向标签</span>
          </div>
        </section>

        <section class="warn-section">
          <h3 class="warn-section__title">分阶段行动建议</h3>
          <div class="path-list">
            <div class="path-item">
              <span class="path-item__label">本学期</span>
              <p class="path-item__text">{{ developmentPath.short }}</p>
            </div>
            <div class="path-item">
              <span class="path-item__label">未来一年</span>
              <p class="path-item__text">{{ developmentPath.medium }}</p>
            </div>
            <div class="path-item">
              <span class="path-item__label">毕业前</span>
              <p class="path-item__text">{{ developmentPath.long }}</p>
            </div>
          </div>
        </section>
      </div>

      <!-- 项目经历 + 技能与经历 -->
      <div class="career-row">
        <section class="warn-section">
          <h3 class="warn-section__title">项目经历清单</h3>
          <div class="project-list">
            <div
              v-for="(proj, idx) in (dashboard.careerDev.projectExperiences?.length
                ? dashboard.careerDev.projectExperiences
                : dashboard.internship.items.filter((e) => e.type === '项目').map((e) => e.name))"
              :key="`${idx}-${proj}`"
              class="project-item"
            >
              <span class="project-item__dot" />
              <span class="project-item__name">{{ proj }}</span>
            </div>
            <div v-if="!(dashboard.careerDev.projectExperiences?.length || dashboard.internship.items.some((e) => e.type === '项目'))" class="empty-cell">
              暂无项目经历
            </div>
          </div>
        </section>

        <section class="warn-section">
          <h3 class="warn-section__title">技能与经历</h3>
          <div class="skill-list">
            <div v-for="item in dashboard.internship.items" :key="`${item.type}-${item.name}`" class="skill-item">
              <span class="skill-item__badge">{{ item.type }}</span>
              <span class="skill-item__name">{{ item.name }}</span>
            </div>
            <div v-if="!dashboard.internship.items.length" class="empty-cell">暂无技能与经历记录</div>
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
.career-development {
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
  font-size: 15px;
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
    font-size: 12px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 18px;
    font-weight: 900;
    color: #f6fbff;

    small {
      font-size: 13px;
      color: #9ecae8;
      font-weight: 600;
    }
  }
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 12px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 14px;
    font-weight: 800;
    color: #f6fbff;

    small,
    em {
      font-size: 12px;
      color: #9ecae8;
      font-weight: 600;
      font-style: normal;
    }
  }
}

/* Readiness */
.readiness-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.readiness-item {
  display: grid;
  grid-template-columns: 80px 1fr 50px;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 13px;

  &__label {
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    text-align: right;
    color: #7ff6ff;
    font-family: var(--student-font-number);
    font-weight: 800;
  }
}

.readiness-bar {
  height: 6px;
  border-radius: 999px;
  background: rgba(0, 60, 120, 0.45);
  overflow: hidden;

  &__inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #00b8ff, #00e5ff);
  }
}

/* Tags */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 184, 255, 0.25);
  background: rgba(0, 184, 255, 0.1);
  color: #8ef6ff;
  font-size: 13px;
  font-weight: 700;
}

/* Job match */
.job-match-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-match-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  &__role {
    color: #d0e8f8;
    font-weight: 700;
    font-size: 14px;
  }

  &__percent {
    color: #5ce8bd;
    font-family: var(--student-font-number);
    font-size: 16px;
    font-weight: 800;
  }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 10px;
    color: #8fb7cd;
    font-size: 12px;

    span {
      font-weight: 600;
    }
  }
}

/* Project list */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 13px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #43e7af;
    flex-shrink: 0;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* Skill list */
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.skill-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;

  &__badge {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    border: 1px solid rgba(0, 184, 255, 0.22);
    flex-shrink: 0;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* Path list */
.path-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.path-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 13px;

  &__label {
    flex-shrink: 0;
    color: #43e7af;
    font-weight: 700;
    width: 56px;
  }

  &__text {
    margin: 0;
    color: #d0e8f8;
    line-height: 1.5;
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
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

.career-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 13px;
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
  to {
    transform: rotate(360deg);
  }
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

.warn-section,
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
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .career-row {
    grid-template-columns: 1fr;
  }
}
</style>
