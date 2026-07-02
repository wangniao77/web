<script setup lang="ts">
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import type { KeyTaskVM } from '@/types/view/college'

defineProps<{
  tasks: KeyTaskVM[]
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <CollegePanelCard
    :index="1"
    icon="icon-target"
    title="年度重点任务进度"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <ul class="task-list">
      <li v-for="task in tasks" :key="task.id" class="task-item">
        <div class="task-row">
          <span class="task-name">{{ task.name }}</span>
          <span class="task-status" :class="task.statusClass">{{ task.statusLabel }}</span>
        </div>
        <div class="progress-row">
          <div class="progress-bar">
            <div class="progress-fill" :class="`fill-${task.statusClass}`" :style="{ width: `${task.progress}%` }">
              <div class="progress-shimmer" />
            </div>
          </div>
          <span class="task-progress">{{ task.progress }}%</span>
        </div>
      </li>
    </ul>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.task-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 11px;
  height: 100%;
  justify-content: space-between;
}

.task-item {
  padding: 2px 0 1px;
}

.task-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.task-name {
  font-size: $college-fs-body;
  font-weight: 600;
  color: rgba(239, 248, 255, 0.92);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 72%;
}

.task-status {
  font-size: $college-fs-meta;
  padding: 2px 8px 3px;
  border-radius: 999px;

  &.status-ongoing {
    color: $color-accent;
    background: rgba(0, 184, 255, 0.08);
    border: 1px solid rgba(0, 184, 255, 0.15);
  }

  &.status-completed {
    color: $color-success;
    background: rgba(52, 211, 153, 0.08);
    border: 1px solid rgba(52, 211, 153, 0.15);
  }

  &.status-delayed {
    color: $color-warning;
    background: rgba(240, 160, 48, 0.08);
    border: 1px solid rgba(240, 160, 48, 0.15);
  }
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-bar {
  flex: 1;
  height: 9px;
  background: rgba(5, 13, 32, 0.72);
  border-radius: 999px;
  overflow: hidden;
  border: 1px solid rgba(102, 217, 255, 0.06);
  box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.35);
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.8s ease;
  position: relative;
  overflow: hidden;

  &.fill-status-ongoing   { background: linear-gradient(90deg, #1477d9, #00d4ff); box-shadow: 0 0 12px rgba(0, 184, 255, 0.28); }
  &.fill-status-completed { background: linear-gradient(90deg, #1c9d6a, #45e0a5); box-shadow: 0 0 12px rgba(52, 211, 153, 0.22); }
  &.fill-status-delayed   { background: linear-gradient(90deg, #c97714, #f5bf4d); box-shadow: 0 0 12px rgba(240, 160, 48, 0.22); }
}

// Shimmer animation on progress bars
.progress-shimmer {
  position: absolute;
  top: 0; left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: shimmer 2s ease-in-out infinite;
}

@keyframes shimmer {
  0%   { left: -100%; }
  100% { left: 150%; }
}

.task-progress {
  font-family: var(--college-font-number);
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.72);
  min-width: 36px;
  text-align: right;
}
</style>
