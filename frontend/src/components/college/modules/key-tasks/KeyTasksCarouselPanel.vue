<script setup lang="ts">
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import KeyTasksPanel from '@/components/college/modules/key-tasks/KeyTasksPanel.vue'
import SchoolKpiSlide from '@/components/college/modules/key-tasks/SchoolKpiSlide.vue'
import type { KeyTaskVM } from '@/types/college/view'

defineProps<{
  tasks: KeyTaskVM[]
  loading?: boolean
}>()

defineEmits<{ retry: [] }>()

const slides = [
  { id: 'tasks', label: '学院任务' },
  { id: 'kpi', label: '学校 KPI' },
]
</script>

<template>
  <PanelSlideCarousel :slides="slides" :interval="10000">
    <template #tasks>
      <KeyTasksPanel :tasks="tasks" :loading="loading" @retry="$emit('retry')" />
    </template>
    <template #kpi>
      <SchoolKpiSlide />
    </template>
  </PanelSlideCarousel>
</template>
