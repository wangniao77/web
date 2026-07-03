<script setup lang="ts">
import { computed } from 'vue'
import { formatTrend } from '@/shared/utils/trend'
import DashIcon, { type IconKind, resolveIconKind } from '@/domains/college/components/DashIcon.vue'
import type { TrendInfo } from '@/core/types/common'

const props = defineProps<{
  label: string
  value: string
  trend?: TrendInfo
  icon: IconKind | string
  position: 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'
}>()

const side = (position: string) => (['tl', 'ml', 'bl'].includes(position) ? 'left' : 'right')
const resolvedIcon = computed(() => resolveIconKind(props.icon))
</script>

<template>
  <div
    class="core-orbit-metric"
    :class="[`core-orbit-metric--${side(position)}`, `core-orbit--${position}`]"
  >
    <div class="core-orbit-metric__icon">
      <DashIcon :kind="resolvedIcon" :size="20" />
    </div>
    <div class="core-orbit-metric__body">
      <span class="core-orbit-metric__label">{{ label }}</span>
      <strong class="core-orbit-metric__value">{{ value }}</strong>
      <em v-if="formatTrend(trend)" class="core-orbit-metric__trend">{{ formatTrend(trend) }}</em>
    </div>
  </div>
</template>
