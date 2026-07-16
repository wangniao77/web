<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CockpitPanel from '@/components/college/CockpitPanel.vue'
import CoreHeroGauge from '@/components/college/modules/center-hub/CoreHeroGauge.vue'
import KeyPlanProgressPanel from '@/components/college/modules/key-tasks/KeyPlanProgressPanel.vue'
import TalentOverviewCarouselPanel from '@/components/college/modules/talent-overview/TalentOverviewCarouselPanel.vue'
import BenchmarkAchievementsPanel from '@/components/college/modules/benchmark/BenchmarkAchievementsPanel.vue'
import ProfessionalSupportPanel from '@/components/college/modules/professional-support/ProfessionalSupportPanel.vue'
import FacultyAtlasPanel from '@/components/college/modules/faculty-atlas/FacultyAtlasPanel.vue'
import CollegeDetailModal from '@/components/college/modules/detail-modal/CollegeDetailModal.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { collegeService } from '@/api/college/services'
import { studentDevService } from '@/api/college/services/student-dev'
import { benchmarkService } from '@/api/college/services/benchmark'
import { teacherService } from '@/api/college/services/teacher'
import { disciplineService } from '@/api/college/services/discipline'
import { enrollmentEmploymentService } from '@/api/college/services/enrollment-employment'
import { isMockMode } from '@/api/createService'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'

const { collegeScope } = useScope()

const hub = ref<Awaited<ReturnType<typeof collegeService.fetchOverviewHub>> | null>(null)
const devQuality = ref<Awaited<ReturnType<typeof studentDevService.fetchStudentDevQuality>> | null>(null)
const benchmark = ref<Awaited<ReturnType<typeof benchmarkService.fetchBenchmarkAchievements>> | null>(null)
const teacherAnalytics = ref<Awaited<ReturnType<typeof teacherService.fetchTeacherAnalytics>> | null>(null)
const discipline = ref<Awaited<ReturnType<typeof disciplineService.fetchDisciplineOverview>> | null>(null)
const enrollmentEmployment = ref<Awaited<ReturnType<typeof enrollmentEmploymentService.fetchEnrollmentEmploymentOverview>> | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

function formatError(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  return '加载失败'
}

async function loadAll() {
  loading.value = true
  error.value = null

  const scope = collegeScope.value
  const [
    hubRes,
    devQualityRes,
    benchmarkRes,
    teacherRes,
    disciplineRes,
    enrollmentRes,
  ] = await Promise.allSettled([
    collegeService.fetchOverviewHub(scope),
    studentDevService.fetchStudentDevQuality({ ...scope, dimension: 'major' }),
    benchmarkService.fetchBenchmarkAchievements(scope),
    teacherService.fetchTeacherAnalytics(scope),
    disciplineService.fetchDisciplineOverview(scope),
    enrollmentEmploymentService.fetchEnrollmentEmploymentOverview(scope),
  ])

  const failures: string[] = []

  if (hubRes.status === 'fulfilled') hub.value = hubRes.value
  else {
    failures.push(`hub: ${formatError(hubRes.reason)}`)
    console.error('[college] hub 加载失败', hubRes.reason)
  }

  if (devQualityRes.status === 'fulfilled') devQuality.value = devQualityRes.value
  else {
    failures.push(`devQuality: ${formatError(devQualityRes.reason)}`)
    console.error('[college] devQuality 加载失败', devQualityRes.reason)
  }

  if (benchmarkRes.status === 'fulfilled') benchmark.value = benchmarkRes.value
  else {
    failures.push(`benchmark: ${formatError(benchmarkRes.reason)}`)
    console.error('[college] benchmark 加载失败', benchmarkRes.reason)
  }

  if (teacherRes.status === 'fulfilled') teacherAnalytics.value = teacherRes.value
  else {
    failures.push(`teacherAnalytics: ${formatError(teacherRes.reason)}`)
    console.error('[college] teacherAnalytics 加载失败', teacherRes.reason)
  }

  if (disciplineRes.status === 'fulfilled') discipline.value = disciplineRes.value
  else {
    failures.push(`discipline: ${formatError(disciplineRes.reason)}`)
    console.error('[college] discipline 加载失败', disciplineRes.reason)
  }

  if (enrollmentRes.status === 'fulfilled') enrollmentEmployment.value = enrollmentRes.value
  else {
    failures.push(`enrollmentEmployment: ${formatError(enrollmentRes.reason)}`)
    console.error('[college] enrollmentEmployment 加载失败', enrollmentRes.reason)
  }

  if (!hub.value && failures.length > 0) {
    error.value = failures.join('；')
  }

  loading.value = false
}

onMounted(loadAll)
useAutoRefresh(loadAll)
</script>

<template>
  <div v-if="loading && !hub" class="cockpit-loading">数据加载中…</div>
  <div v-else-if="error && !hub" class="cockpit-loading cockpit-loading--error">
    <p class="cockpit-loading__title">学院数据加载失败</p>
    <p class="cockpit-loading__message">{{ error }}</p>
    <p class="cockpit-loading__hint">
      {{ isMockMode() ? '当前为 Mock 模式' : '请确认后端已启动：uvicorn main:app --reload（端口 8000）' }}
    </p>
    <button type="button" class="cockpit-loading__retry" @click="loadAll">重试</button>
  </div>
  <template v-else>
    <main class="cockpit-main">
      <div class="cockpit-column cockpit-column--left">
        <CockpitPanel
          title="年度重点规划进展"
          icon="task"
          panel-class="panel--key-tasks"
          module-id="key-tasks"
          :simulated="true"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="openCollegeDetail({ kind: 'key-tasks' })"
            >
              详情 →
            </button>
          </template>
          <KeyPlanProgressPanel />
        </CockpitPanel>
        <CockpitPanel
          title="人才培养纵览"
          icon="students"
          panel-class="panel--talent-overview"
          module-id="talent-overview"
          :simulated="true"
        >
          <TalentOverviewCarouselPanel
            :dev-quality="devQuality"
            :enrollment="enrollmentEmployment"
          />
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--center">
        <div class="cockpit-hero">
          <CoreHeroGauge v-if="hub" :data="hub" />
          <div v-else class="cockpit-panel-empty">核心指标暂不可用</div>
        </div>
        <CockpitPanel
          title="专业发展全景"
          icon="support"
          panel-class="panel--professional-support"
          module-id="professional-support"
          :simulated="true"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="openCollegeDetail({ kind: 'discipline-detail' })"
            >
              详情 →
            </button>
          </template>
          <ProfessionalSupportPanel :discipline="discipline" />
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--right">
        <CockpitPanel
          title="精品成果集萃"
          icon="trophy"
          panel-class="panel--benchmark"
          module-id="benchmark-achievements"
          :simulated="true"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="openCollegeDetail({ kind: 'benchmark-detail' })"
            >
              详情 →
            </button>
          </template>
          <BenchmarkAchievementsPanel v-if="benchmark" :data="benchmark" />
          <div v-else class="cockpit-panel-empty">精品成果数据暂不可用</div>
        </CockpitPanel>
        <CockpitPanel
          title="师资建设图谱"
          icon="support"
          panel-class="panel--faculty-atlas"
          module-id="faculty-atlas"
          :simulated="true"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="openCollegeDetail({ kind: 'teacher-detail' })"
            >
              详情 →
            </button>
          </template>
          <FacultyAtlasPanel v-if="teacherAnalytics" :data="teacherAnalytics" />
          <div v-else class="cockpit-panel-empty">师资建设数据暂不可用</div>
        </CockpitPanel>
      </div>
    </main>
    <CollegeDetailModal />
  </template>
</template>

<style scoped lang="scss">
.cockpit-loading {
  flex: 1;
  display: grid;
  place-items: center;
  gap: 12px;
  color: rgba(174, 198, 230, 0.72);
  font-size: 24px;
  padding: 24px;
  text-align: center;
}

.cockpit-loading--error {
  color: rgba(255, 196, 196, 0.92);
}

.cockpit-loading__title {
  font-size: 24px;
  font-weight: 600;
}

.cockpit-loading__message,
.cockpit-loading__hint {
  max-width: 640px;
  line-height: 1.6;
  color: rgba(174, 198, 230, 0.82);
}

.cockpit-loading__retry {
  margin-top: 8px;
  padding: 8px 20px;
  border: 1px solid rgba(0, 229, 255, 0.45);
  border-radius: 6px;
  background: rgba(0, 70, 130, 0.35);
  color: #d8f6ff;
  cursor: pointer;
}

.cockpit-panel-empty {
  display: grid;
  place-items: center;
  min-height: 120px;
  color: rgba(174, 198, 230, 0.55);
  font-size: 24px;
}
</style>
