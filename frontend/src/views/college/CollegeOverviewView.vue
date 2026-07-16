<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CockpitPanel from '@/components/college/CockpitPanel.vue'
import CoreHeroGauge from '@/components/college/modules/center-hub/CoreHeroGauge.vue'
import KeyTasksCarouselPanel from '@/components/college/modules/key-tasks/KeyTasksCarouselPanel.vue'
import StudentDevQualityPanel from '@/components/college/modules/student-dev/StudentDevQualityPanel.vue'
import TeachingQualityPanel from '@/components/college/modules/teaching-quality/TeachingQualityPanel.vue'
import ResearchInnovPanel from '@/components/college/modules/research-innov/ResearchInnovPanel.vue'
import WarningRiskPanel from '@/components/college/modules/warning-risk/WarningRiskPanel.vue'
import StudentEmploymentPanel from '@/components/college/modules/student-dev/StudentEmploymentPanel.vue'
import CollegeDetailModal from '@/components/college/modules/detail-modal/CollegeDetailModal.vue'
import { collegeService } from '@/api/college/services'
import { collegeDetailService } from '@/api/college/services/details'
import { isMockMode } from '@/api/createService'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'

const { collegeScope } = useScope()

const hub = ref<Awaited<ReturnType<typeof collegeService.fetchOverviewHub>> | null>(null)
const tasks = ref<Awaited<ReturnType<typeof collegeService.fetchKeyTasks>>>([])
const highPotential = ref<Awaited<ReturnType<typeof collegeDetailService.fetchHighPotentialOverview>> | null>(null)
const teaching = ref<Awaited<ReturnType<typeof collegeService.fetchTeachingOverview>> | null>(null)
const research = ref<Awaited<ReturnType<typeof collegeService.fetchResearchOverview>> | null>(null)
const warning = ref<Awaited<ReturnType<typeof collegeService.fetchWarningOverview>> | null>(null)
const student = ref<Awaited<ReturnType<typeof collegeService.fetchStudentOverview>> | null>(null)
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
    tasksRes,
    highPotentialRes,
    teachingRes,
    researchRes,
    warningRes,
    studentRes,
  ] = await Promise.allSettled([
    collegeService.fetchOverviewHub(scope),
    collegeService.fetchKeyTasks(scope),
    collegeDetailService.fetchHighPotentialOverview(scope),
    collegeService.fetchTeachingOverview(scope),
    collegeService.fetchResearchOverview(scope),
    collegeService.fetchWarningOverview(scope),
    collegeService.fetchStudentOverview(scope),
  ])

  const failures: string[] = []

  if (hubRes.status === 'fulfilled') hub.value = hubRes.value
  else {
    failures.push(`hub: ${formatError(hubRes.reason)}`)
    console.error('[college] hub 加载失败', hubRes.reason)
  }

  if (tasksRes.status === 'fulfilled') tasks.value = tasksRes.value
  else {
    failures.push(`tasks: ${formatError(tasksRes.reason)}`)
    console.error('[college] tasks 加载失败', tasksRes.reason)
  }

  if (highPotentialRes.status === 'fulfilled') highPotential.value = highPotentialRes.value
  else {
    failures.push(`highPotential: ${formatError(highPotentialRes.reason)}`)
    console.error('[college] highPotential 加载失败', highPotentialRes.reason)
  }

  if (teachingRes.status === 'fulfilled') teaching.value = teachingRes.value
  else {
    failures.push(`teaching: ${formatError(teachingRes.reason)}`)
    console.error('[college] teaching 加载失败', teachingRes.reason)
  }

  if (researchRes.status === 'fulfilled') research.value = researchRes.value
  else {
    failures.push(`research: ${formatError(researchRes.reason)}`)
    console.error('[college] research 加载失败', researchRes.reason)
  }

  if (warningRes.status === 'fulfilled') warning.value = warningRes.value
  else {
    failures.push(`warning: ${formatError(warningRes.reason)}`)
    console.error('[college] warning 加载失败', warningRes.reason)
  }

  if (studentRes.status === 'fulfilled') student.value = studentRes.value
  else {
    failures.push(`student: ${formatError(studentRes.reason)}`)
    console.error('[college] student 加载失败', studentRes.reason)
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
          title="年度重点任务推进"
          icon="task"
          panel-class="panel--key-tasks"
          module-id="key-tasks"
          :simulated="true"
        >
          <KeyTasksCarouselPanel :tasks="tasks" :loading="loading" @retry="loadAll" />
        </CockpitPanel>
        <CockpitPanel
          title="学生发展与质量"
          icon="students"
          panel-class="panel--student-dev-quality"
          module-id="student-dev-quality"
          :simulated="true"
        >
          <StudentDevQualityPanel
            v-if="student && highPotential && warning"
            :student="student"
            :high-potential="highPotential"
            :warning="warning"
          />
          <div v-else class="cockpit-panel-empty">学生发展数据暂不可用</div>
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--center">
        <div class="cockpit-hero">
          <CoreHeroGauge v-if="hub" :data="hub" />
          <div v-else class="cockpit-panel-empty">核心指标暂不可用</div>
        </div>
        <CockpitPanel title="预警与风险监测" icon="warning" panel-class="panel--warning">
          <WarningRiskPanel v-if="warning" :data="warning" />
          <div v-else class="cockpit-panel-empty">预警数据暂不可用</div>
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--right">
        <CockpitPanel title="教学质量与运行" icon="academic" module-id="teaching" :simulated="true">
          <TeachingQualityPanel v-if="teaching" :data="teaching" />
          <div v-else class="cockpit-panel-empty">教学数据暂不可用</div>
        </CockpitPanel>
        <CockpitPanel title="科研创新与团队平台" icon="research">
          <ResearchInnovPanel v-if="research" :data="research" />
          <div v-else class="cockpit-panel-empty">科研数据暂不可用</div>
        </CockpitPanel>
        <CockpitPanel title="学生就业与前景" icon="students" module-id="employment" :simulated="true">
          <StudentEmploymentPanel v-if="student" :data="student" />
          <div v-else class="cockpit-panel-empty">学生数据暂不可用</div>
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
  font-size: 16px;
  padding: 24px;
  text-align: center;
}

.cockpit-loading--error {
  color: rgba(255, 196, 196, 0.92);
}

.cockpit-loading__title {
  font-size: 18px;
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
  font-size: 14px;
}
</style>
