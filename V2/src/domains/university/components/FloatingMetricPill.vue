<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string | number
    tone?: 'cyan' | 'green' | 'ongoing' | 'warn' | 'danger'
  }>(),
  { tone: 'cyan' },
)
</script>

<template>
  <div class="pill" :class="`pill--${tone}`">
    <span class="pill__dot" aria-hidden="true" />
    <strong class="pill__value">{{ value }}</strong>
    <span class="pill__label">{{ label }}</span>
  </div>
</template>

<style scoped lang="scss">
.pill {
  --pill-color: var(--uni-accent-cyan);
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 9px;
  align-items: center;
  padding: 7px 16px;
  background: linear-gradient(120deg, rgba(20, 44, 74, 0.35), rgba(12, 28, 50, 0.12));
  border: 1px solid rgba(90, 170, 255, 0.1);
  border-radius: 40px;
  box-shadow: inset 0 1px 0 rgba(140, 200, 255, 0.05), 0 6px 18px rgba(2, 10, 24, 0.28);
  backdrop-filter: blur(3px);

  &--green { --pill-color: var(--uni-status-normal); }
  &--ongoing { --pill-color: var(--uni-accent-blue); }
  &--warn { --pill-color: var(--uni-status-attention); }
  &--danger { --pill-color: var(--uni-status-danger); }

  &__dot {
    grid-row: 1 / 3;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--pill-color);
    box-shadow: 0 0 10px var(--pill-color), 0 0 3px var(--pill-color);
  }

  &__value {
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-metric-sm);
    font-weight: 700;
    line-height: 1;
    color: var(--pill-color);
    text-shadow: 0 0 12px color-mix(in srgb, var(--pill-color) 40%, transparent);
  }

  &__label {
    font-size: var(--uni-fs-label);
    color: var(--uni-text-secondary);
  }
}
</style>
