<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { ROUTES } from '@/constants/routes'
import type { KeyTaskVM } from '@/types/college/view'

const router = useRouter()

const props = defineProps<{
  tasks: KeyTaskVM[]
  loading?: boolean
}>()

defineEmits<{ retry: [] }>()

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

const taskIcon: Record<string, IconKind> = {
  双一流建设: 'research',
  专业认证: 'academic',
  师资队伍建设: 'faculty',
  科研平台建设: 'innovation',
  学科竞赛组织: 'trophy',
  学生工作重点项目: 'students',
  就业率提升工程: 'placement',
  就业攻坚任务: 'complete',
}
function iconFor(name: string): IconKind {
  return taskIcon[name] ?? 'task'
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
        class="task-progress-panel__row task-progress-panel__row--clickable"
        :class="`task-progress-panel__row--${statusKey(task.statusClass)}`"
        @click="openDetail"
      >
        <span class="task-progress-panel__icon">
          <DashIcon :kind="iconFor(task.name)" :size="16" />
        </span>
        <span class="task-progress-panel__name">{{ task.name }}</span>
        <div class="task-progress-panel__bar">
          <i :style="{ width: `${task.progress}%` }" />
        </div>
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

.task-progress-panel__row--clickable {
  cursor: pointer;
  transition: background 0.18s;

  &:hover {
    background: rgba(0, 130, 230, 0.12);
  }
}
</style>
