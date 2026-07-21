<script setup lang="ts">
import { ref } from 'vue'
import StudentIdentityCard from '@/components/student/template/StudentIdentityCard.vue'
import StudentScoreCard from '@/components/student/template/StudentScoreCard.vue'
import StudentKanbanCarousel from '@/components/student/template/StudentKanbanCarousel.vue'
import StudentAiAdviceCard from '@/components/student/template/StudentAiAdviceCard.vue'
import StudentDetailModal from '@/components/student/template/StudentDetailModal.vue'
import type { StudentDashboardVM } from '@/types/student/view'

defineProps<{
  dashboard: StudentDashboardVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const detailOpen = ref(false)
const detailSection = ref<string | null>(null)

function openDetail(id: string) {
  detailSection.value = id
  detailOpen.value = true
}

function closeDetail() {
  detailOpen.value = false
}
</script>

<template>
  <div class="stu-tpl stu-tpl--ai-span">
    <StudentIdentityCard
      class="stu-tpl__identity"
      :profile="dashboard.profile"
      :attention="dashboard.attention"
      :career-dev="dashboard.careerDev"
      :academic="dashboard.academic"
      :highlights="dashboard.highlights"
      :cadre-roles="dashboard.quality.cadreRoles"
      @open="openDetail"
    />
    <StudentScoreCard
      class="stu-tpl__score"
      :growth-overview="dashboard.growthOverview"
      :growth-portrait="dashboard.growthPortrait"
      :academic="dashboard.academic"
      :health="dashboard.health"
      :employment="dashboard.employment"
      :profile="dashboard.profile"
      :credit="dashboard.creditProgress"
      :competition="dashboard.competition"
      :internship="dashboard.internship"
      :quality="dashboard.quality"
      :scholarships="dashboard.scholarships"
    />
    <StudentAiAdviceCard
      class="stu-tpl__ai"
      :assistant="dashboard.aiAssistant"
      :portrait="dashboard.aiPortrait"
      :employment="dashboard.employment"
      :academic="dashboard.academic"
      :competition="dashboard.competition"
      :highlights="dashboard.highlights"
      :profile="dashboard.profile"
      :career-dev="dashboard.careerDev"
      :quality="dashboard.quality"
      :growth-overview="dashboard.growthOverview"
      :internship="dashboard.internship"
      @open="openDetail"
    />
    <div class="stu-tpl__kanban">
      <StudentKanbanCarousel
        :academic="dashboard.academic"
        :credit="dashboard.creditProgress"
        :failed-critical="dashboard.failedCritical"
        :growth-overview="dashboard.growthOverview"
        :competition="dashboard.competition"
        :quality="dashboard.quality"
        :scholarships="dashboard.scholarships"
        :profile="dashboard.profile"
        @open="openDetail"
      />
    </div>

    <StudentDetailModal
      :open="detailOpen"
      :section="detailSection"
      :dashboard="dashboard"
      @close="closeDetail"
    />
  </div>
</template>
