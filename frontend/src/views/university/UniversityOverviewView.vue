<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import PostureHeroPanel from '@/components/university/overview/PostureHeroPanel.vue'
import GoalAchievementPanel from '@/components/university/overview/GoalAchievementPanel.vue'
import BenchmarkAnalysisPanel from '@/components/university/overview/BenchmarkAnalysisPanel.vue'
import DisciplineTalentPanel from '@/components/university/overview/DisciplineTalentPanel.vue'
import ResearchInnovationOverviewPanel from '@/components/university/overview/ResearchInnovationOverviewPanel.vue'
import EmploymentRiskPanel from '@/components/university/overview/EmploymentRiskPanel.vue'
import UniversityLoadingSkeleton from '@/components/university/UniversityLoadingSkeleton.vue'
import { useUniversityEntrance } from '@/composables/useUniversityEntrance'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'
import { universityService } from '@/api/university/services'
import { useUniversityDashboardStore } from '@/stores/universityDashboard'
import type { UniversityDashboardVM } from '@/types/university/view'

const { universityScope } = useScope()
const dashboardStore = useUniversityDashboardStore()
const dashboard = ref<UniversityDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const { play: playEntrance } = useUniversityEntrance()

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await universityService.fetchOverview(universityScope.value)
    dashboardStore.setMeta(dashboard.value.meta)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
    requestAnimationFrame(() => playEntrance())
  }
}

onMounted(loadAll)
watch(universityScope, loadAll, { deep: true })
useAutoRefresh(loadAll)
</script>

<template>
  <UniversityLoadingSkeleton v-if="loading && !dashboard" />
  <div v-else-if="error && !dashboard" class="uni-cockpit-loading uni-cockpit-loading--error">
    <p>{{ error }}</p>
    <button type="button" @click="loadAll">重试</button>
  </div>
  <main v-else-if="dashboard" class="uni-overview-grid">
    <GoalAchievementPanel
      class="uni-overview-goals"
      :data="dashboard.modules.goals"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <PostureHeroPanel
      class="uni-overview-hero"
      :data="dashboard.modules.posture"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <BenchmarkAnalysisPanel
      class="uni-overview-benchmark"
      :data="dashboard.modules.benchmark"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <DisciplineTalentPanel
      class="uni-overview-discipline"
      :data="dashboard.modules.disciplineTalent"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <ResearchInnovationOverviewPanel
      class="uni-overview-research"
      :data="dashboard.modules.research"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <EmploymentRiskPanel
      class="uni-overview-employment"
      :data="dashboard.modules.employmentRisk"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
  </main>
</template>
