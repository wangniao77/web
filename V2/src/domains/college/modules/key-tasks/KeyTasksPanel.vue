<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import type { KeyTaskVM } from '@/domains/college/types/view'

const props = defineProps<{
  tasks: KeyTaskVM[]
  loading?: boolean
}>()

defineEmits<{ retry: [] }>()

const router = useRouter()

const summary = computed(() => {
  const total = props.tasks.length
  const completed = props.tasks.filter((t) => t.statusClass === 'status-completed').length
  const delayed = props.tasks.filter((t) => t.statusClass === 'status-delayed').length
  const ongoing = total - completed - delayed
  return {
    total,
    completed,
    ongoing,
    delayed,
    completedPct: total ? Math.round((completed / total) * 100) : 0,
    ongoingPct: total ? Math.round((ongoing / total) * 100) : 0,
    delayedPct: total ? Math.round((delayed / total) * 100) : 0,
  }
})

function statusKey(statusClass: string) {
  if (statusClass === 'status-completed') return 'completed'
  if (statusClass === 'status-delayed') return 'attention'
  return 'in-progress'
}

function openDetail() {
  router.push(ROUTES.college.keyTasks)
}
</script>

<template>
  <div class="task-progress-panel">
    <div class="task-progress-panel__legend" aria-label="任务状态图例">
      <span class="task-progress-panel__legend-item task-progress-panel__legend-item--completed"><i /> 已完成</span>
      <span class="task-progress-panel__legend-item task-progress-panel__legend-item--progress"><i /> 推进中</span>
      <span class="task-progress-panel__legend-item task-progress-panel__legend-item--attention"><i /> 需关注</span>
    </div>

    <ul class="task-progress-panel__list">
      <li
        v-for="task in tasks"
        :key="task.id"
        class="task-progress-panel__row"
        :class="`task-progress-panel__row--${statusKey(task.statusClass)}`"
      >
        <span class="task-progress-panel__icon">
          <svg aria-hidden="true"><use href="/icons.svg#icon-target" /></svg>
        </span>
        <span class="task-progress-panel__name">{{ task.name }}</span>
        <div class="task-progress-panel__bar">
          <i :style="{ width: `${task.progress}%` }" />
        </div>
        <strong class="task-progress-panel__percent">{{ task.progress }}%</strong>
        <span class="task-progress-panel__tag" :class="`task-progress-panel__tag--${statusKey(task.statusClass)}`">
          {{ task.statusLabel }}
        </span>
      </li>
    </ul>

    <div class="task-progress-panel__summary">
      <div class="task-progress-panel__summary-item">
        <span>重点任务总数</span>
        <strong>{{ summary.total }}<small>项</small></strong>
      </div>
      <div class="task-progress-panel__summary-item task-progress-panel__summary-item--completed">
        <div>
          <span>已完成</span>
          <strong>{{ summary.completed }}<small>项</small> {{ summary.completedPct }}%</strong>
        </div>
      </div>
      <div class="task-progress-panel__summary-item task-progress-panel__summary-item--progress">
        <div>
          <span>推进中</span>
          <strong>{{ summary.ongoing }}<small>项</small> {{ summary.ongoingPct }}%</strong>
        </div>
      </div>
      <div class="task-progress-panel__summary-item task-progress-panel__summary-item--attention">
        <div>
          <span>需关注</span>
          <strong>{{ summary.delayed }}<small>项</small> {{ summary.delayedPct }}%</strong>
        </div>
      </div>
    </div>

    <button type="button" class="task-progress-panel__more" @click="openDetail">查看详情 →</button>
  </div>
</template>

<style scoped lang="scss">
.task-progress-panel__icon svg {
  width: 16px;
  height: 16px;
  color: #55dfff;
}
</style>
