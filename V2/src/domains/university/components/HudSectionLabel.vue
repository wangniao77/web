<script setup lang="ts">
defineProps<{ title: string; index?: number }>()
</script>

<template>
  <div class="hud-label">
    <span v-if="index != null" class="hud-label__index">{{ String(index).padStart(2, '0') }}</span>
    <span class="hud-label__bar" aria-hidden="true" />
    <h3 class="hud-label__title">{{ title }}</h3>
    <span class="hud-label__line" aria-hidden="true" />
  </div>
</template>

<style scoped lang="scss">
.hud-label {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 2px 0;
}

.hud-label__index {
  font-family: var(--uni-font-number);
  font-size: var(--uni-fs-label);
  font-weight: 700;
  color: rgba(51, 217, 255, 0.6);
  letter-spacing: 0.06em;
}

.hud-label__bar {
  width: 3px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--uni-accent-cyan), rgba(51, 217, 255, 0.1));
  box-shadow: 0 0 8px rgba(51, 217, 255, 0.7);
}

.hud-label__title {
  font-size: var(--uni-fs-module-title);
  font-weight: 600;
  color: var(--uni-text-primary);
  letter-spacing: 0.05em;
  text-shadow: 0 0 16px rgba(51, 217, 255, 0.3);
  white-space: nowrap;
}

.hud-label__line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(51, 217, 255, 0.4), transparent);
}
</style>
