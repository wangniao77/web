<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

defineProps<{ to: RouteLocationRaw; label?: string }>()
</script>

<template>
  <RouterLink :to="to" class="detail-btn">
    <span>{{ label ?? '查看详情' }}</span>
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
  </RouterLink>
</template>

<style scoped lang="scss">
.detail-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 14px 5px 15px;
  font-size: var(--uni-fs-caption);
  color: var(--uni-text-secondary);
  text-decoration: none;
  letter-spacing: 0.02em;
  background: linear-gradient(180deg, rgba(51, 217, 255, 0.08), rgba(51, 217, 255, 0.02));
  border: 1px solid rgba(90, 170, 255, 0.18);
  clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px);
  transition: color 0.2s, border-color 0.2s, box-shadow 0.2s;

  svg {
    width: 13px;
    height: 13px;
    transition: transform 0.2s;
  }

  &:hover {
    color: var(--uni-accent-cyan);
    border-color: var(--uni-border-hover);
    box-shadow: var(--uni-glow-soft);

    svg { transform: translateX(2px); }
  }
}
</style>
