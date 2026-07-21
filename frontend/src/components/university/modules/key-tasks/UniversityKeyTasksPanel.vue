<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import TaskFlowTrack from '@/components/university/TaskFlowTrack.vue'
import { ROUTES } from '@/constants/routes'
import type { KeyTaskVM } from '@/types/university/view'

const props = defineProps<{
  tasks: KeyTaskVM[]
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const overall = computed(() => {
  if (!props.tasks.length) return 0
  const sum = props.tasks.reduce((a, t) => a + t.progress, 0)
  return Math.round(sum / props.tasks.length)
})
</script>

<template>
  <FuturisticPanel
    :index="4"
    title="年度重点任务进度"
    :detail-to="ROUTES.university.tasks"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <template #actions>
      <div class="tasks-summary">
        <span>总体完成率</span>
        <strong>{{ overall }}<i>%</i></strong>
      </div>
    </template>

    <TaskFlowTrack :tasks="tasks" :limit="5" />
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.tasks-summary {
  display: flex;
  align-items: baseline;
  gap: 8px;

  span { font-size: 12px; color: var(--uni-text-muted); }

  strong {
    font-family: var(--uni-font-number);
    font-size: 26px;
    font-weight: 700;
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 12px rgba(51, 217, 255, 0.4);

    i { font-style: normal; font-size: 0.5em; margin-left: 1px; color: var(--uni-text-secondary); }
  }
}
</style>
