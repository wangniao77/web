<script setup lang="ts">
import { onMounted, ref } from 'vue'
import GoalOverviewPanel from '@/components/university/modules/goal-overview/GoalOverviewPanel.vue'
import ResearchInnovationPanel from '@/components/university/modules/research-innovation/ResearchInnovationPanel.vue'
import UniversityKeyTasksPanel from '@/components/university/modules/key-tasks/UniversityKeyTasksPanel.vue'
import DisciplineCompetitivenessPanel from '@/components/university/modules/discipline-competitiveness/DisciplineCompetitivenessPanel.vue'
import EmploymentQualityPanel from '@/components/university/modules/employment-quality/EmploymentQualityPanel.vue'
import EventsRiskPanel from '@/components/university/modules/events-risk/EventsRiskPanel.vue'
import UniversityLoadingSkeleton from '@/components/university/UniversityLoadingSkeleton.vue'
import { useUniversityEntrance } from '@/composables/useUniversityEntrance'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'
import { universityService } from '@/api/university/services'
import type { UniversityDashboardVM } from '@/types/university/view'

const { universityScope } = useScope()
const dashboard = ref<UniversityDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const { play: playEntrance } = useUniversityEntrance()

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await universityService.fetchOverview(universityScope.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
    requestAnimationFrame(() => playEntrance())
  }
}

onMounted(loadAll)
useAutoRefresh(loadAll)
</script>

<template>
  <UniversityLoadingSkeleton v-if="loading && !dashboard" />
  <div v-else-if="error && !dashboard" class="university-loading">
    <p>{{ error }}</p>
    <button type="button" @click="loadAll">重试</button>
  </div>
  <div v-else-if="dashboard" class="university-grid">
    <div class="university-row university-row--top">
      <ResearchInnovationPanel
        class="cell-research panel-row1"
        :data="dashboard.research"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
      <GoalOverviewPanel
        class="cell-goal panel-row1"
        :data="dashboard.goalOverview"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
      <EmploymentQualityPanel
        class="cell-employ panel-row1"
        :data="dashboard.employment"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
    </div>
    <div class="university-row university-row--bottom">
      <UniversityKeyTasksPanel
        class="cell-tasks panel-row2"
        :tasks="dashboard.keyTasks"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
      <DisciplineCompetitivenessPanel
        class="cell-disciplines panel-row2"
        :data="dashboard.disciplines"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
      <EventsRiskPanel
        class="cell-events panel-row2"
        :events="dashboard.events"
        :academic-risk="dashboard.academicRisk"
        :loading="loading"
        :error="error"
        @retry="loadAll"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.university-loading {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--uni-text-secondary);

  button {
    color: var(--uni-accent-cyan);
    cursor: pointer;
  }
}
</style>
