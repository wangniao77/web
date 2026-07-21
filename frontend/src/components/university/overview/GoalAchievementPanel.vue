<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import TaskProgressTable from '@/components/university/shared/TaskProgressTable.vue'
import { ROUTES } from '@/constants/routes'
import type { GoalsModuleVM } from '@/types/university/view/modules'

defineProps<{ data: GoalsModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel :index="2" title="年度目标达成总览" :detail-to="ROUTES.university.goals" :loading="loading" :error="error" @retry="$emit('retry')">
    <div class="goals">
      <div class="goals__counts">
        <div class="count count--done"><strong>{{ data.statusCounts.completed }}</strong><span>已完成<em>项</em></span></div>
        <div class="count count--ongoing"><strong>{{ data.statusCounts.ongoing }}</strong><span>进行中<em>项</em></span></div>
        <div class="count count--lag"><strong>{{ data.statusCounts.lagging }}</strong><span>滞后<em>项</em></span></div>
      </div>
      <TaskProgressTable :rows="data.tasks" :limit="6" />
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.goals { display: flex; flex-direction: column; gap: 10px; height: 100%; min-height: 0; }
.goals__counts { display: flex; gap: 8px; flex-shrink: 0; }
.count {
  flex: 1; text-align: center; padding: 10px 8px; background: rgba(8,22,42,0.45); border: 1px solid rgba(90,170,255,0.1);
  strong { display: block; font-family: var(--uni-font-number); font-size: var(--uni-fs-metric-sm); }
  span { font-size: var(--uni-fs-micro); color: var(--uni-text-muted); em { font-style: normal; margin-left: 1px; } }
  &--done strong { color: var(--uni-status-normal); }
  &--ongoing strong { color: var(--uni-accent-blue); }
  &--lag strong { color: var(--uni-status-attention); }
}
</style>
