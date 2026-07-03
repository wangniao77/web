<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeRankingPanel from '@/domains/university/modules/college-ranking/CollegeRankingPanel.vue'
import SchoolHubPanel from '@/domains/university/modules/school-hub/SchoolHubPanel.vue'
import EmploymentQualityPanel from '@/domains/university/modules/employment-quality/EmploymentQualityPanel.vue'
import NewsBroadcastPanel from '@/domains/university/modules/news-broadcast/NewsBroadcastPanel.vue'
import UniversityKeyTasksPanel from '@/domains/university/modules/key-tasks/UniversityKeyTasksPanel.vue'
import UniversityLoadingSkeleton from '@/domains/university/components/UniversityLoadingSkeleton.vue'
import { useUniversityEntrance } from '@/shared/composables/useUniversityEntrance'
import { useAutoRefresh } from '@/shared/composables/useAutoRefresh'
import { useScope } from '@/shared/composables/useScope'
import { universityService } from '@/domains/university/services'
import type { UniversityDashboardVM } from '@/domains/university/types/view'

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
    <CollegeRankingPanel
      class="cell-ranking panel-row1"
      :items="dashboard.collegeRanking"
      :formula="dashboard.rankingFormula"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <SchoolHubPanel
      class="cell-hub panel-row1"
      :data="dashboard.hub"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <EmploymentQualityPanel
      class="cell-employ panel-row1"
      :data="dashboard.employmentQuality"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <NewsBroadcastPanel
      class="cell-news panel-row2"
      :items="dashboard.news"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
    <UniversityKeyTasksPanel
      class="cell-tasks panel-row2"
      :tasks="dashboard.keyTasks"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
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
  color: rgba(174, 198, 230, 0.72);

  button {
    color: $color-accent;
    text-decoration: underline;
  }
}
</style>
