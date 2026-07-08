<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
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
    title="重点任务"
    :detail-to="ROUTES.university.tasks"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <template #actions>
      <div class="tasks-summary">
        <span>总体进度</span>
        <strong>{{ overall }}<i>%</i></strong>
      </div>
    </template>

    <ul class="task-list">
      <li v-for="task in tasks.slice(0, 4)" :key="task.id" class="task-item">
        <div class="task-item__head">
          <h4>{{ task.name }}</h4>
          <span class="task-item__dept">{{ task.department ?? '—' }}</span>
        </div>
        <div class="task-item__bar">
          <span class="task-item__fill" :style="{ width: `${task.progress}%` }" />
        </div>
        <div class="task-item__meta">
          <span>{{ task.progress }}%</span>
          <span v-if="task.currentIssue" class="task-item__issue">{{ task.currentIssue }}</span>
        </div>
        <div v-if="task.nextAction || task.rectifyDeadline" class="task-item__foot">
          <span v-if="task.nextAction">下一步：{{ task.nextAction }}</span>
          <em v-if="task.rectifyDeadline">时限 {{ task.rectifyDeadline }}</em>
        </div>
      </li>
    </ul>
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
    font-size: 22px;
    font-weight: 700;
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 12px rgba(51, 217, 255, 0.4);

    i { font-style: normal; font-size: 0.5em; margin-left: 1px; color: var(--uni-text-secondary); }
  }
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.task-item {
  padding: 8px 10px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
}

.task-item__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 6px;

  h4 {
    font-size: var(--uni-fs-caption);
    font-weight: 600;
    color: var(--uni-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.task-item__dept {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--uni-text-muted);
}

.task-item__bar {
  height: 4px;
  background: rgba(90, 170, 255, 0.14);
  border-radius: 4px;
  overflow: hidden;
}

.task-item__fill {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, rgba(75, 141, 255, 0.4), var(--uni-accent-cyan));
  box-shadow: 0 0 8px rgba(51, 217, 255, 0.4);
}

.task-item__meta {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--uni-text-secondary);
}

.task-item__issue {
  color: var(--uni-status-attention);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.task-item__foot {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 4px;
  font-size: 10px;
  color: var(--uni-text-muted);

  em { font-style: normal; color: var(--uni-status-attention); }
}
</style>
