<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeScreenLayout from '@/layouts/CollegeScreenLayout.vue'
import CenterHub from '@/modules/college/center-hub/CenterHub.vue'
import KeyTasksPanel from '@/modules/college/key-tasks/KeyTasksPanel.vue'
import StudentDevPanel from '@/modules/college/student-dev/StudentDevPanel.vue'
import TeachingQualityPanel from '@/modules/college/teaching-quality/TeachingQualityPanel.vue'
import ResearchInnovPanel from '@/modules/college/research-innov/ResearchInnovPanel.vue'
import WarningRiskPanel from '@/modules/college/warning-risk/WarningRiskPanel.vue'
import EvaluationPanel from '@/modules/college/evaluation/EvaluationPanel.vue'
import { collegeService } from '@/services/college'
import { useCollegeEntrance } from '@/composables/useCollegeEntrance'
import type {
  EvaluationOverviewVM,
  KeyTaskVM,
  OverviewHubVM,
  ResearchOverviewVM,
  StudentOverviewVM,
  TeachingOverviewVM,
  WarningOverviewVM,
} from '@/types/view/college'
import '@/styles/college.scss'

const hub = ref<OverviewHubVM | null>(null)
const tasks = ref<KeyTaskVM[]>([])
const student = ref<StudentOverviewVM | null>(null)
const teaching = ref<TeachingOverviewVM | null>(null)
const research = ref<ResearchOverviewVM | null>(null)
const warning = ref<WarningOverviewVM | null>(null)
const evaluation = ref<EvaluationOverviewVM | null>(null)
const loading = ref(true)
const { play: playEntrance } = useCollegeEntrance()

async function loadAll() {
  loading.value = true
  try {
    const results = await Promise.all([
      collegeService.fetchOverviewHub(),
      collegeService.fetchKeyTasks(),
      collegeService.fetchStudentOverview(),
      collegeService.fetchTeachingOverview(),
      collegeService.fetchResearchOverview(),
      collegeService.fetchWarningOverview(),
      collegeService.fetchEvaluationOverview(),
    ])
    hub.value = results[0]
    tasks.value = results[1]
    student.value = results[2]
    teaching.value = results[3]
    research.value = results[4]
    warning.value = results[5]
    evaluation.value = results[6]
  } finally {
    loading.value = false
    // Trigger entrance animation after DOM is painted
    requestAnimationFrame(() => playEntrance())
  }
}

onMounted(loadAll)
</script>

<template>
  <CollegeScreenLayout>
    <div class="college-grid">
      <div class="area-left">
        <KeyTasksPanel :tasks="tasks" :loading="loading && !tasks.length" @retry="loadAll" />
        <StudentDevPanel v-if="student" :data="student" @retry="loadAll" />
      </div>

      <div class="area-center">
        <CenterHub v-if="hub" :data="hub" />
      </div>

      <div class="area-right">
        <TeachingQualityPanel v-if="teaching" :data="teaching" @retry="loadAll" />
        <ResearchInnovPanel v-if="research" :data="research" @retry="loadAll" />
        <EvaluationPanel v-if="evaluation" :data="evaluation" @retry="loadAll" />
      </div>

      <div class="area-warning">
        <WarningRiskPanel v-if="warning" :data="warning" @retry="loadAll" />
      </div>
    </div>
  </CollegeScreenLayout>
</template>

<style scoped lang="scss">
.college-grid {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(396px, 29.5%) minmax(620px, 1fr) minmax(396px, 29.5%);
  grid-template-rows: minmax(0, 1fr) minmax(224px, 23.5%);
  grid-template-areas:
    'left center right'
    'left warning right';
  gap: 12px;
}

.area-left {
  grid-area: left;
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
  min-height: 0;
}

.area-center {
  grid-area: center;
  min-height: 0;
  min-width: 0;
  position: relative;
  border-radius: $panel-radius;
  border: 1px solid rgba(103, 205, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(8, 31, 66, 0.24), rgba(2, 10, 27, 0.1)),
    radial-gradient(ellipse 70% 60% at 50% 45%, rgba(0, 184, 255, 0.09) 0%, transparent 70%);
  box-shadow: inset 0 0 48px rgba(0, 184, 255, 0.045);
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background:
      linear-gradient(90deg, transparent 0%, rgba(0, 229, 255, 0.035) 50%, transparent 100%),
      radial-gradient(circle at 50% 42%, rgba(0, 184, 255, 0.12) 0%, transparent 55%);
    animation: center-ambient 6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(102, 217, 255, 0.42), transparent);
    animation: center-line-glow 4s ease-in-out infinite;
  }
}

@keyframes center-ambient {
  0%, 100% { opacity: 0.75; }
  50%      { opacity: 1; }
}

@keyframes center-line-glow {
  0%, 100% { opacity: 0.45; box-shadow: 0 0 8px rgba(102, 217, 255, 0.15); }
  50%      { opacity: 1; box-shadow: 0 0 18px rgba(102, 217, 255, 0.35); }
}

.area-right {
  grid-area: right;
  display: grid;
  grid-template-rows: minmax(0, 1.03fr) minmax(0, 1.12fr) minmax(0, 0.85fr);
  gap: 8px;
  min-height: 0;
}

.area-warning {
  grid-area: warning;
  min-height: 0;
  min-width: 0;
}
</style>
