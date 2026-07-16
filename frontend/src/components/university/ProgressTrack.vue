<script setup lang="ts">
defineProps<{
  value: number
  tone?: 'default' | 'normal' | 'ongoing' | 'attention' | 'warning'
  height?: number
}>()
</script>

<template>
  <div class="progress-track" :style="{ height: `${height ?? 6}px` }">
    <i
      class="progress-track__fill"
      :class="tone ? `progress-track__fill--${tone}` : ''"
      :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
    />
  </div>
</template>

<style scoped lang="scss">
.progress-track {
  border-radius: 999px;
  background: rgba(104, 178, 255, 0.1);
  overflow: hidden;
}

.progress-track__fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--uni-accent-blue), var(--uni-accent-cyan));
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);

  &--normal { background: linear-gradient(90deg, #2bc896, var(--uni-status-normal)); }
  &--ongoing { background: linear-gradient(90deg, #3a7ae8, var(--uni-status-ongoing)); }
  &--attention { background: linear-gradient(90deg, #e8923a, var(--uni-status-attention)); }
  &--warning { background: linear-gradient(90deg, #e85562, var(--uni-status-danger)); }
}
</style>
