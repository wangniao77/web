<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import DetailButton from '@/domains/university/components/DetailButton.vue'

defineProps<{
  title: string
  index?: number
  detailTo?: RouteLocationRaw
}>()
</script>

<template>
  <header class="panel-header">
    <div class="panel-header__title-wrap">
      <span v-if="index != null" class="panel-header__index">{{ String(index).padStart(2, '0') }}</span>
      <span class="panel-header__bar" aria-hidden="true" />
      <h3 class="panel-header__title">{{ title }}</h3>
    </div>
    <slot name="actions">
      <DetailButton v-if="detailTo" :to="detailTo" />
    </slot>
  </header>
</template>

<style scoped lang="scss">
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px var(--uni-pad-module) 6px;
  flex-shrink: 0;
}

.panel-header__title-wrap {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.panel-header__index {
  font-family: var(--uni-font-number);
  font-size: var(--uni-fs-label);
  font-weight: 700;
  color: rgba(51, 217, 255, 0.55);
  letter-spacing: 0.06em;
}

.panel-header__bar {
  width: 3px;
  height: 20px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--uni-accent-cyan), rgba(51, 217, 255, 0.1));
  box-shadow: 0 0 8px rgba(51, 217, 255, 0.6);
}

.panel-header__title {
  font-size: var(--uni-fs-module-title);
  font-weight: 600;
  color: var(--uni-text-primary);
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
