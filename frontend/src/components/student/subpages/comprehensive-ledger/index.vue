<script setup lang="ts">
/**
 * 综合素养台账详情（二级页面）
 * 路由：/student/comprehensive-ledger?studentId=xxx
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
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

const disciplineLevel = computed(() => {
  if (!dashboard.value) return 'low'
  const count = dashboard.value.quality.disciplineRecords.length
  if (count >= 2) return 'high'
  if (count === 1) return 'medium'
  return 'low'
})

const overallTopPercent = computed(() => {
  if (!dashboard.value) return '—'
  const d = dashboard.value.growthOverview
  if (!d.overallTotal) return '—'
  return `${Math.max(1, Math.round((d.overallRank / d.overallTotal) * 100))}`
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="综合素养台账详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回学生发展概览"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="comprehensive-ledger">
      <!-- KPI -->
      <section class="warn-section">
        <div class="kpi-grid">
          <div class="kpi-card" :class="`kpi-card--${disciplineLevel}`">
            <span class="kpi-card__label">纪律风险等级</span>
            <strong class="kpi-card__value">{{ disciplineLevel === 'high' ? '高危' : disciplineLevel === 'medium' ? '需关注' : '正常' }}</strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">综测排名</span>
            <strong class="kpi-card__value">{{ dashboard.growthOverview.overallRank }}<small>/{{ dashboard.growthOverview.overallTotal }}</small></strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">奖学金</span>
            <strong class="kpi-card__value">{{ dashboard.scholarships.length }}<small>项</small></strong>
          </div>
          <div class="kpi-card">
            <span class="kpi-card__label">竞赛获奖</span>
            <strong class="kpi-card__value">{{ dashboard.competition.awardCount }}<small>项</small></strong>
          </div>
        </div>
      </section>

      <!-- 综合测评与行为记录 -->
      <section class="warn-section">
        <h3 class="warn-section__title">综合测评与行为记录</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-item__label">综测排名</span>
            <span class="info-item__value">{{ dashboard.growthOverview.overallRank }} / {{ dashboard.growthOverview.overallTotal }} <em>（前 {{ overallTopPercent }}%）</em></span>
          </div>
          <div class="info-item">
            <span class="info-item__label">志愿服务</span>
            <span class="info-item__value">{{ dashboard.quality.volunteerHours }}<small> 小时</small></span>
          </div>
          <div class="info-item">
            <span class="info-item__label">社会实践</span>
            <span class="info-item__value">{{ dashboard.quality.socialPractices }}<small> 次</small></span>
          </div>
          <div class="info-item">
            <span class="info-item__label">学生干部</span>
            <span class="info-item__value">{{ dashboard.quality.cadreRoles.join('、') || '—' }}</span>
          </div>
        </div>
      </section>

      <!-- 荣誉成果 -->
      <section class="warn-section">
        <h3 class="warn-section__title">荣誉成果全景</h3>
        <div v-if="dashboard.scholarships.length || dashboard.profile.awards.length" class="honor-list">
          <div v-for="item in dashboard.scholarships" :key="`${item.year}-${item.name}`" class="honor-item">
            <span class="honor-item__badge honor-item__badge--scholarship">奖学金</span>
            <span class="honor-item__name">{{ item.name }}</span>
            <span class="honor-item__year">{{ item.year }}</span>
          </div>
          <div v-for="award in dashboard.profile.awards" :key="`${award.name}-${award.date}`" class="honor-item">
            <span class="honor-item__badge honor-item__badge--award">表彰</span>
            <span class="honor-item__name">{{ award.name }}</span>
            <span class="honor-item__level">{{ award.level }}</span>
          </div>
        </div>
        <div v-else class="empty-cell">暂无荣誉记录</div>
      </section>

      <!-- 创新实践与软技能 -->
      <section class="warn-section">
        <h3 class="warn-section__title">创新实践与软技能</h3>
        <div class="info-grid info-grid--2">
          <div class="info-item">
            <span class="info-item__label">科研项目</span>
            <span class="info-item__value">{{ dashboard.competition.researchCount }}<small> 项</small></span>
          </div>
          <div class="info-item">
            <span class="info-item__label">创新创业</span>
            <span class="info-item__value">{{ dashboard.competition.innovationCount }}<small> 项</small></span>
          </div>
        </div>
        <div v-if="dashboard.quality.softSkills.length" class="skill-list">
          <div v-for="skill in dashboard.quality.softSkills" :key="skill.name" class="skill-item">
            <span class="skill-item__name">{{ skill.name }}</span>
            <div class="skill-item__bar">
              <div class="skill-item__bar-inner" :style="{ width: `${skill.score}%` }" />
            </div>
            <strong class="skill-item__score">{{ skill.score }}</strong>
          </div>
        </div>
        <div v-else class="empty-cell">暂无软技能评分记录</div>
      </section>

      <!-- 纪律惩戒记录 -->
      <section class="warn-section">
        <h3 class="warn-section__title">纪律惩戒记录</h3>
        <div v-if="dashboard.quality.disciplineRecords.length" class="discipline-list">
          <div
            v-for="row in dashboard.quality.disciplineRecords"
            :key="row.id"
            class="discipline-item"
            :class="`discipline-item--${row.level || 'medium'}`"
          >
            <span class="discipline-item__date">{{ row.date }}</span>
            <span class="discipline-item__type">{{ row.type }}</span>
            <span class="discipline-item__reason">{{ row.reason }}</span>
            <span v-if="row.status" class="discipline-item__status">{{ row.status }}</span>
          </div>
        </div>
        <div v-else class="empty-cell">暂无受处分 / 违纪处罚记录</div>
      </section>

      <!-- 专业证书 -->
      <section class="warn-section">
        <h3 class="warn-section__title">专业证书</h3>
        <div class="cert-list">
          <div
            v-for="item in dashboard.internship.items.filter((entry) => entry.type === '证书')"
            :key="item.name"
            class="cert-item"
          >
            <span class="cert-item__dot" />
            <span class="cert-item__name">{{ item.name }}</span>
          </div>
          <div v-if="!dashboard.internship.items.filter((entry) => entry.type === '证书').length" class="empty-cell">暂无专业证书记录</div>
        </div>
      </section>

      <!-- 竞赛亮点 -->
      <section class="warn-section">
        <h3 class="warn-section__title">竞赛与科研亮点</h3>
        <div v-if="dashboard.highlights.length" class="highlight-list">
          <div v-for="h in dashboard.highlights" :key="h.id" class="highlight-item">
            <span class="highlight-item__date">{{ h.date }}</span>
            <span class="highlight-item__label">{{ h.label }}</span>
            <span v-if="h.level" class="highlight-item__level">{{ h.level }}</span>
          </div>
        </div>
        <div v-else class="empty-cell">暂无竞赛 / 科研亮点记录</div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.comprehensive-ledger {
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

  &__label {
    font-size: 11px;
    color: #7eb4d8;
    font-weight: 600;
  }

  &__value {
    font-size: 18px;
    font-weight: 900;
    color: #f6fbff;

    small {
      font-size: 12px;
      color: #9ecae8;
      font-weight: 600;
    }
  }
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;

  &--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label {
    font-size: 11px;
    color: #7eb4d8;
  }

  &__value {
    font-size: 13px;
    font-weight: 800;
    color: #f6fbff;

    small, em {
      font-size: 11px;
      color: #9ecae8;
      font-weight: 600;
      font-style: normal;
    }
  }
}

/* Honor list */
.honor-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.honor-item {
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
    flex-shrink: 0;

    &--scholarship {
      background: rgba(250, 204, 21, 0.12);
      color: #facc15;
      border: 1px solid rgba(250, 204, 21, 0.22);
    }

    &--award {
      background: rgba(74, 222, 128, 0.12);
      color: #55e995;
      border: 1px solid rgba(74, 222, 128, 0.22);
    }
  }

  &__name {
    flex: 1;
    color: #d0e8f8;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__year,
  &__level {
    color: #9ecae8;
    font-size: 11px;
    white-space: nowrap;
  }
}

/* Skill list */
.skill-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 8px;
}

.skill-item {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #00b8ff, #00e5ff);
  }

  &__score {
    text-align: right;
    color: #7ff6ff;
    font-family: var(--student-font-number);
    font-weight: 800;
  }
}

/* Discipline list */
.discipline-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.discipline-item {
  display: grid;
  grid-template-columns: 80px 80px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;
  border-left: 3px solid transparent;

  &--low { border-left-color: rgba(74, 222, 128, 0.7); }
  &--medium { border-left-color: rgba(250, 204, 21, 0.7); }
  &--high { border-left-color: rgba(248, 91, 91, 0.7); }

  &__date {
    color: #7eb4d8;
    font-weight: 700;
    white-space: nowrap;
  }

  &__type {
    color: #ffd166;
    font-weight: 700;
    white-space: nowrap;
  }

  &__reason {
    color: #d0e8f8;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__status {
    color: #9ecae8;
    font-size: 11px;
    white-space: nowrap;
  }
}

/* Cert list */
.cert-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #55e995;
    flex-shrink: 0;
  }

  &__name {
    color: #d0e8f8;
    font-weight: 600;
  }
}

/* Highlight list */
.highlight-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.highlight-item {
  display: grid;
  grid-template-columns: 80px 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 12px;

  &__date {
    color: #7eb4d8;
    font-weight: 700;
    white-space: nowrap;
  }

  &__label {
    color: #d0e8f8;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__level {
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 700;
    background: rgba(0, 184, 255, 0.12);
    color: #8ef6ff;
    white-space: nowrap;
  }
}

/* Footer */
.footer-actions {
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;
  grid-column: 1 / -1;

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
  .comprehensive-ledger { grid-template-columns: 1fr; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .info-grid { grid-template-columns: repeat(2, 1fr); }
  .discipline-item { grid-template-columns: 70px 70px 1fr auto; }
}
</style>
