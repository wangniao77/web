<script setup lang="ts">
import type { RiskLevel } from '@/domains/university/constants/risk'
import { RISK_LEVEL_MAP } from '@/domains/university/constants/risk'

const props = withDefaults(
  defineProps<{
    level: RiskLevel
    label?: string
    size?: 'sm' | 'md'
  }>(),
  { size: 'sm' },
)

const displayLabel = props.label ?? RISK_LEVEL_MAP[props.level].label
</script>

<template>
  <span class="risk-badge" :class="[`risk-badge--${level}`, `risk-badge--${size}`]">
    {{ displayLabel }}
  </span>
</template>

<style scoped lang="scss">
.risk-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid transparent;

  &--sm {
    padding: 4px 11px;
    font-size: var(--uni-fs-meta);
  }

  &--md {
    padding: 5px 13px;
    font-size: var(--uni-fs-label);
  }

  &--normal {
    color: var(--uni-status-normal);
    background: rgba(53, 220, 165, 0.1);
    border-color: rgba(53, 220, 165, 0.22);
  }

  &--ongoing {
    color: var(--uni-status-ongoing);
    background: rgba(75, 141, 255, 0.1);
    border-color: rgba(75, 141, 255, 0.22);
  }

  &--attention {
    color: var(--uni-status-attention);
    background: rgba(255, 170, 76, 0.1);
    border-color: rgba(255, 170, 76, 0.22);
  }

  &--warning {
    color: var(--uni-status-danger);
    background: rgba(255, 107, 120, 0.1);
    border-color: rgba(255, 107, 120, 0.22);
  }
}
</style>
