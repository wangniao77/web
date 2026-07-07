<script setup lang="ts">
import { formatTrend } from '@/shared/utils/trend'
import type { TrendInfo } from '@/core/types/common'

defineProps<{
  label: string
  value: string
  trend?: TrendInfo
  icon: string
  position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'
}>()

const side = (position: string) => (['tl', 'ml', 'bl'].includes(position) ? 'left' : 'right')
</script>

<template>
  <div
    class="core-orbit-metric"
    :class="[`core-orbit-metric--${side(position)}`, `core-orbit--${position}`]"
  >
    <div class="core-orbit-metric__icon">
      <svg aria-hidden="true"><use :href="`/icons.svg#${icon}`" /></svg>
    </div>
    <div class="core-orbit-metric__body">
      <span class="core-orbit-metric__label">{{ label }}</span>
      <strong class="core-orbit-metric__value">{{ value }}</strong>
      <em v-if="formatTrend(trend)" class="core-orbit-metric__trend">{{ formatTrend(trend) }}</em>
    </div>
  </div>
</template>

<style scoped lang="scss">
.core-orbit-metric__icon svg {
  width: 20px;
  height: 20px;
  color: #55dfff;
}
</style>
