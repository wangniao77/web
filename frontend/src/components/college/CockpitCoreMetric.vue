<script setup lang="ts">
import { computed } from 'vue'
import { formatTrend } from '@/utils/trend'
import DashIcon, { type IconKind, resolveIconKind } from '@/components/college/DashIcon.vue'
import type { OrbitPosition } from '@/constants/college/college-kpi'
import type { TrendInfo } from '@/types/common'

const props = defineProps<{
  label: string
  value: string
  trend?: TrendInfo
  icon: IconKind | string
  position: OrbitPosition
}>()

const side = (position: string) => (['tl', 'uml', 'lml', 'bl'].includes(position) ? 'left' : 'right')
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
