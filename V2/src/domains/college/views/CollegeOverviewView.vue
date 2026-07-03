<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CockpitPanel from '@/domains/college/components/CockpitPanel.vue'
import CoreHeroGauge from '@/domains/college/modules/center-hub/CoreHeroGauge.vue'
import KeyTasksPanel from '@/domains/college/modules/key-tasks/KeyTasksPanel.vue'
import HighPotentialPanel from '@/domains/college/modules/high-potential/HighPotentialPanel.vue'
import TeachingQualityPanel from '@/domains/college/modules/teaching-quality/TeachingQualityPanel.vue'
import ResearchInnovPanel from '@/domains/college/modules/research-innov/ResearchInnovPanel.vue'
import WarningRiskPanel from '@/domains/college/modules/warning-risk/WarningRiskPanel.vue'
import StudentEmploymentPanel from '@/domains/college/modules/student-dev/StudentEmploymentPanel.vue'
import CollegeFooterBar from '@/domains/college/modules/footer/CollegeFooterBar.vue'
import CollegeDetailModal from '@/domains/college/modules/detail-modal/CollegeDetailModal.vue'
import { collegeService } from '@/domains/college/services'
import { collegeDetailService } from '@/domains/college/services/details'
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh'
import { useScope } from '@/shared/composables/useScope'

const { collegeScope } = useScope()

const hub = ref<Awaited<ReturnType<typeof collegeService.fetchOverviewHub>> | null>(null)
const tasks = ref<Awaited<ReturnType<typeof collegeService.fetchKeyTasks>>>([])
const highPotential = ref<Awaited<ReturnType<typeof collegeDetailService.fetchHighPotentialOverview>> | null>(null)
const teaching = ref<Awaited<ReturnType<typeof collegeService.fetchTeachingOverview>> | null>(null)
const research = ref<Awaited<ReturnType<typeof collegeService.fetchResearchOverview>> | null>(null)
const warning = ref<Awaited<ReturnType<typeof collegeService.fetchWarningOverview>> | null>(null)
const student = ref<Awaited<ReturnType<typeof collegeService.fetchStudentOverview>> | null>(null)
const loading = ref(true)

async function loadAll() {
  loading.value = true
  try {
    const scope = collegeScope.value
    const results = await Promise.all([
      collegeService.fetchOverviewHub(scope),
      collegeService.fetchKeyTasks(scope),
      collegeDetailService.fetchHighPotentialOverview(scope),
      collegeService.fetchTeachingOverview(scope),
      collegeService.fetchResearchOverview(scope),
      collegeService.fetchWarningOverview(scope),
      collegeService.fetchStudentOverview(scope),
    ])
    hub.value = results[0]
    tasks.value = results[1]
    highPotential.value = results[2]
    teaching.value = results[3]
    research.value = results[4]
    warning.value = results[5]
    student.value = results[6]
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
useAutoRefresh(loadAll)
</script>

<template>
  <div v-if="loading && !hub" class="cockpit-loading">加载中...</div>
  <template v-else>
    <main class="cockpit-main">
      <div class="cockpit-column cockpit-column--left">
        <CockpitPanel :number="1" title="年度重点任务推进" icon="task" panel-class="panel--key-tasks">
          <KeyTasksPanel :tasks="tasks" :loading="loading" @retry="loadAll" />
        </CockpitPanel>
        <CockpitPanel :number="2" title="高潜学生发展画像" icon="potential" panel-class="panel--high-potential">
          <HighPotentialPanel v-if="highPotential" :data="highPotential" />
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--center">
        <div class="cockpit-hero">
          <CoreHeroGauge v-if="hub" :data="hub" />
        </div>
        <CockpitPanel :number="6" title="预警与风险监测" icon="warning" panel-class="panel--warning">
          <WarningRiskPanel v-if="warning" :data="warning" />
        </CockpitPanel>
      </div>

      <div class="cockpit-column cockpit-column--right">
        <CockpitPanel :number="4" title="教学质量与运行" icon="academic">
          <TeachingQualityPanel v-if="teaching" :data="teaching" />
        </CockpitPanel>
        <CockpitPanel :number="5" title="科研创新与团队平台" icon="research">
          <ResearchInnovPanel v-if="research" :data="research" />
        </CockpitPanel>
        <CockpitPanel :number="3" title="学生就业与前景" icon="students">
          <StudentEmploymentPanel v-if="student" :data="student" />
        </CockpitPanel>
      </div>
    </main>
    <CollegeFooterBar />
    <CollegeDetailModal />
  </template>
</template>

<style scoped lang="scss">
.cockpit-loading {
  flex: 1;
  display: grid;
  place-items: center;
  color: rgba(174, 198, 230, 0.72);
  font-size: 16px;
}
</style>
