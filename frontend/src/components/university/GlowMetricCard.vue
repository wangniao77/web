<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number
    unit?: string
    trend?: string
    hint?: string
    tone?: 'cyan' | 'green' | 'ongoing' | 'violet' | 'warn' | 'danger'
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { tone: 'cyan', size: 'md' },
)

const trendDir = computed(() => {
  const t = props.trend ?? ''
  if (/↑|\+/.test(t)) return 'up'
  if (/↓|-/.test(t)) return 'down'
  return 'flat'
})
</script>

<template>
  <div class="glow-metric" :class="[`glow-metric--${tone}`, `glow-metric--${size}`]">
    <span class="glow-metric__scan" aria-hidden="true" />
    <span class="glow-metric__label">{{ label }}</span>
    <div class="glow-metric__value-row">
      <strong class="glow-metric__value">
        {{ value }}<small v-if="unit">{{ unit }}</small>
      </strong>
      <em v-if="trend" class="glow-metric__trend" :class="`is-${trendDir}`">{{ trend }}</em>
    </div>
    <p v-if="hint" class="glow-metric__hint">{{ hint }}</p>
  </div>
</template>

<style scoped lang="scss">
.glow-metric {
  position: relative;
  padding: 10px 13px;
  min-height: 0;
  overflow: hidden;
  background: linear-gradient(160deg, rgba(13, 32, 58, 0.6), rgba(8, 20, 38, 0.4));
  border: 1px solid rgba(90, 170, 255, 0.12);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%);

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 10px;
    bottom: 10px;
    width: 2px;
    border-radius: 2px;
    background: var(--tone-color, var(--uni-accent-cyan));
    box-shadow: 0 0 8px var(--tone-glow, rgba(51, 217, 255, 0.6));
  }

  &__scan {
    position: absolute;
    inset: 0;
    background: radial-gradient(60% 80% at 100% 0%, var(--tone-wash, rgba(51, 217, 255, 0.08)), transparent 60%);
    pointer-events: none;
  }

  &__label {
    display: block;
    position: relative;
    font-size: var(--uni-fs-caption);
    color: var(--uni-text-secondary);
    margin-bottom: 4px;
    letter-spacing: 0.02em;
  }

  &__value-row {
    position: relative;
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__value {
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-metric-md);
    font-weight: 700;
    line-height: 1.05;
    color: var(--tone-color, var(--uni-accent-cyan));
    text-shadow: 0 0 14px var(--tone-glow, rgba(51, 217, 255, 0.45));

    small {
      font-size: var(--uni-fs-small);
      font-weight: 500;
      margin-left: 2px;
      color: var(--uni-text-secondary);
      text-shadow: none;
    }
  }

  &__trend {
    font-style: normal;
    font-size: var(--uni-fs-caption);
    font-weight: 600;
    color: var(--uni-status-normal);

    &.is-down { color: var(--uni-status-attention); }
    &.is-flat { color: var(--uni-text-muted); }
  }

  &__hint {
    position: relative;
    margin-top: 5px;
    font-size: var(--uni-fs-small);
    color: var(--uni-text-muted);
    line-height: 1.35;
  }

  &--lg .glow-metric__value { font-size: var(--uni-fs-metric-lg); }

  &--sm {
    padding: 8px 11px;

    .glow-metric__label { font-size: var(--uni-fs-micro); margin-bottom: 3px; }
    .glow-metric__value { font-size: var(--uni-fs-metric-sm); }
  }

  &--cyan { --tone-color: var(--uni-accent-cyan); --tone-glow: rgba(51, 217, 255, 0.5); --tone-wash: rgba(51, 217, 255, 0.09); }
  &--green { --tone-color: var(--uni-status-normal); --tone-glow: rgba(55, 224, 164, 0.45); --tone-wash: rgba(55, 224, 164, 0.08); }
  &--ongoing { --tone-color: var(--uni-accent-blue); --tone-glow: rgba(75, 141, 255, 0.45); --tone-wash: rgba(75, 141, 255, 0.08); }
  &--violet { --tone-color: var(--uni-accent-violet); --tone-glow: rgba(124, 139, 255, 0.45); --tone-wash: rgba(124, 139, 255, 0.08); }
  &--warn { --tone-color: var(--uni-status-attention); --tone-glow: rgba(255, 176, 87, 0.45); --tone-wash: rgba(255, 176, 87, 0.08); }
  &--danger { --tone-color: var(--uni-status-danger); --tone-glow: rgba(255, 107, 120, 0.45); --tone-wash: rgba(255, 107, 120, 0.09); }
}
</style>
