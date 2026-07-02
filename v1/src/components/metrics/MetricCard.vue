<script setup lang="ts">
import type { TrendInfo } from '@/types/api/common'

withDefaults(
  defineProps<{
    label: string
    value: string
    trend?: TrendInfo
    variant?: 'default' | 'bordered'
  }>(),
  { variant: 'default' },
)

function trendClass(direction?: string) {
  if (direction === 'up') return 'trend-up'
  if (direction === 'down') return 'trend-down'
  return 'trend-flat'
}

function trendText(trend?: TrendInfo) {
  if (!trend || trend.direction === 'flat') return ''
  const arrow = trend.direction === 'up' ? '&#8593;' : '&#8595;'
  return `${arrow} ${trend.value}${trend.unit || ''}`
}
</script>

<template>
  <div class="metric" :class="variant">
    <span class="metric-label">{{ label }}</span>
    <span class="metric-value">{{ value }}</span>
    <span
      v-if="trend && trend.direction !== 'flat'"
      class="metric-trend"
      :class="trendClass(trend.direction)"
      v-html="trendText(trend)"
    />
  </div>
</template>

<style scoped lang="scss">
.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;

  &.bordered {
    @include glass-card;
    padding: 10px 6px;
    transition: border-color $transition-fast, background $transition-fast, box-shadow $transition-fast;

    &:hover {
      border-color: $color-border-card-hover;
      background: rgba(8, 22, 55, 0.5);
      box-shadow: 0 0 12px rgba(0, 184, 255, 0.06);
    }
  }
}

.metric-label {
  font-size: $college-fs-sm;
  color: $color-text-muted;
  letter-spacing: 0.3px;
}

.metric-value {
  font-family: $font-mono;
  font-size: $college-fs-metric;
  font-weight: 600;
  color: $color-text-primary;
  line-height: 1.2;
  text-shadow: 0 0 8px rgba(0, 184, 255, 0.2);
  animation: value-glow-in 2s ease-out 1;
}

@keyframes value-glow-in {
  0%   { text-shadow: 0 0 20px rgba(0, 184, 255, 0.5); }
  100% { text-shadow: 0 0 8px rgba(0, 184, 255, 0.2); }
}

.metric-trend {
  font-size: $college-fs-xs;
  font-weight: 500;
}
</style>
