<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import CockpitPanel from '@/components/college/CockpitPanel.vue'
import CoreHeroGauge from '@/components/college/modules/center-hub/CoreHeroGauge.vue'
import KeyPlanProgressPanel from '@/components/college/modules/key-tasks/KeyPlanProgressPanel.vue'
import TalentOverviewCarouselPanel from '@/components/college/modules/talent-overview/TalentOverviewCarouselPanel.vue'
import BenchmarkAchievementsPanel from '@/components/college/modules/benchmark/BenchmarkAchievementsPanel.vue'
import ProfessionalSupportPanel from '@/components/college/modules/professional-support/ProfessionalSupportPanel.vue'
import FacultyAtlasPanel from '@/components/college/modules/faculty-atlas/FacultyAtlasPanel.vue'
import CollegeDetailModal from '@/components/college/modules/detail-modal/CollegeDetailModal.vue'
import { collegeService } from '@/api/college/services'
import { studentDevService } from '@/api/college/services/student-dev'
import { benchmarkService } from '@/api/college/services/benchmark'
import { teacherService } from '@/api/college/services/teacher'
import { disciplineService } from '@/api/college/services/discipline'
import { enrollmentEmploymentService } from '@/api/college/services/enrollment-employment'
import { isMockMode } from '@/api/createService'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'
import { ROUTES } from '@/constants/routes'

const router = useRouter()

const { collegeScope } = useScope()

const hub = ref<Awaited<ReturnType<typeof collegeService.fetchOverviewHub>> | null>(null)
const keyPlan = ref<Awaited<ReturnType<typeof collegeService.fetchKeyPlanProgress>> | null>(null)
const devQuality = ref<Awaited<ReturnType<typeof studentDevService.fetchStudentDevQuality>> | null>(null)
const benchmark = ref<Awaited<ReturnType<typeof benchmarkService.fetchBenchmarkAchievements>> | null>(null)
const teacherAnalytics = ref<Awaited<ReturnType<typeof teacherService.fetchTeacherAnalytics>> | null>(null)
const discipline = ref<Awaited<ReturnType<typeof disciplineService.fetchDisciplineOverview>> | null>(null)
const enrollmentEmployment = ref<Awaited<ReturnType<typeof enrollmentEmploymentService.fetchEnrollmentEmploymentOverview>> | null>(null)

/** 仅首屏 gate：hub 一到就出布局，其余面板渐进填入 */
const loading = ref(true)
const error = ref<string | null>(null)
const panelLoading = reactive({
  keyPlan: true,
  talent: true,
  benchmark: true,
  discipline: true,
  faculty: true,
})

function formatError(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  return '加载失败'
}

async function loadOne<T>(
  label: string,
  promise: Promise<T>,
  assign: (value: T) => void,
  failures: string[],
): Promise<void> {
  try {
    assign(await promise)
  } catch (reason) {
    failures.push(`${label}: ${formatError(reason)}`)
    console.error(`[college] ${label} 加载失败`, reason)
  }
}

async function loadAll() {
  const isFirstPaint = !hub.value
  if (isFirstPaint) loading.value = true
  error.value = null

  panelLoading.keyPlan = true
  panelLoading.talent = true
  panelLoading.benchmark = true
  panelLoading.discipline = true
  panelLoading.faculty = true

  const scope = collegeScope.value
  const failures: string[] = []

  // hub 优先：完成即解除全屏 loading，不必等其余 6 个接口
  const hubTask = loadOne('hub', collegeService.fetchOverviewHub(scope), (v) => {
    hub.value = v
  }, failures).finally(() => {
    loading.value = false
  })

  const panelTasks = [
    loadOne('keyPlan', collegeService.fetchKeyPlanProgress(scope), (v) => {
      keyPlan.value = v
    }, failures).finally(() => {
      panelLoading.keyPlan = false
    }),
    loadOne(
      'devQuality',
      studentDevService.fetchStudentDevQuality({ ...scope, dimension: 'major' }),
      (v) => {
        devQuality.value = v
      },
      failures,
    ),
    loadOne(
      'enrollmentEmployment',
      enrollmentEmploymentService.fetchEnrollmentEmploymentOverview(scope),
      (v) => {
        enrollmentEmployment.value = v
      },
      failures,
    ),
    loadOne('benchmark', benchmarkService.fetchBenchmarkAchievements(scope), (v) => {
      benchmark.value = v
    }, failures).finally(() => {
      panelLoading.benchmark = false
    }),
    loadOne('teacherAnalytics', teacherService.fetchTeacherAnalytics(scope), (v) => {
      teacherAnalytics.value = v
    }, failures).finally(() => {
      panelLoading.faculty = false
    }),
    loadOne('discipline', disciplineService.fetchDisciplineOverview(scope), (v) => {
      discipline.value = v
    }, failures).finally(() => {
      panelLoading.discipline = false
    }),
  ]

  // 人才培养面板依赖 devQuality + enrollment，二者都结束后再关 loading
  const talentTask = Promise.allSettled([panelTasks[1], panelTasks[2]]).finally(() => {
    panelLoading.talent = false
  })

  await Promise.allSettled([hubTask, ...panelTasks, talentTask])

  if (!hub.value && failures.length > 0) {
    error.value = failures.join('；')
  }
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
          title="学院重点工作动态监测总览"
          icon="task"
          panel-class="panel--key-tasks"
          module-id="key-tasks"
          :simulated="false"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="router.push(ROUTES.college.keyTasks)"
            >
              详情 →
            </button>
          </template>
          <KeyPlanProgressPanel v-if="keyPlan" :data="keyPlan" />
          <div v-else class="cockpit-panel-empty">
            {{ panelLoading.keyPlan ? '加载中…' : '重点工作数据暂不可用' }}
          </div>
        </CockpitPanel>
        <CockpitPanel
          title="人才培养纵览"
          icon="students"
          panel-class="panel--talent-overview"
          module-id="talent-overview"
          :simulated="false"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="router.push(ROUTES.college.studentDevDetail)"
            >
              详情 →
            </button>
          </template>
          <TalentOverviewCarouselPanel
            v-if="devQuality || enrollmentEmployment"
            :dev-quality="devQuality"
            :enrollment="enrollmentEmployment"
          />
          <div v-else class="cockpit-panel-empty">
            {{ panelLoading.talent ? '加载中…' : '人才培养数据暂不可用' }}
          </div>
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
          :simulated="false"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="router.push(ROUTES.college.disciplineDetail)"
            >
              详情 →
            </button>
          </template>
          <ProfessionalSupportPanel v-if="discipline" :discipline="discipline" />
          <div v-else class="cockpit-panel-empty">
            {{ panelLoading.discipline ? '加载中…' : '专业发展数据暂不可用' }}
          </div>
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--right">
        <CockpitPanel
          title="精品成果集萃"
          icon="trophy"
          panel-class="panel--benchmark"
          module-id="benchmark-achievements"
          :simulated="false"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="router.push(ROUTES.college.benchmarkDetail)"
            >
              详情 →
            </button>
          </template>
          <BenchmarkAchievementsPanel v-if="benchmark" :data="benchmark" />
          <div v-else class="cockpit-panel-empty">
            {{ panelLoading.benchmark ? '加载中…' : '精品成果数据暂不可用' }}
          </div>
        </CockpitPanel>
        <CockpitPanel
          title="师资建设图谱"
          icon="support"
          panel-class="panel--faculty-atlas"
          module-id="faculty-atlas"
        >
          <template #actions>
            <button
              type="button"
              class="panel__action-link"
              @click="router.push(ROUTES.college.teacherResourceBase)"
            >
              详情 →
            </button>
          </template>
          <FacultyAtlasPanel v-if="teacherAnalytics" :data="teacherAnalytics" />
          <div v-else class="cockpit-panel-empty">
            {{ panelLoading.faculty ? '加载中…' : '师资建设数据暂不可用' }}
          </div>
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
