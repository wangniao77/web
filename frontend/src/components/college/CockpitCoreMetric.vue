<script setup lang="ts">
import { computed } from 'vue'
import DashIcon, { type IconKind, resolveIconKind } from '@/components/college/DashIcon.vue'
import type { OrbitPosition } from '@/constants/college/college-kpi'
import type { TrendInfo } from '@/types/common'

type KpiStatus = 'healthy' | 'watch' | 'alert' | 'neutral'

const props = defineProps<{
  label: string
  value: string
  trend?: TrendInfo
  status?: KpiStatus
  hint?: string
  icon: IconKind | string
  position: OrbitPosition
}>()

const side = (position: string) => (['tl', 'uml', 'lml', 'bl'].includes(position) ? 'left' : 'right')
const resolvedIcon = computed(() => resolveIconKind(props.icon))

const statusLabel = computed(() => {
  switch (props.status) {
    case 'healthy':
      return '达标'
    case 'watch':
      return '关注'
    case 'alert':
      return '预警'
    case 'neutral':
      return '待核'
    default:
      return undefined
  }
})
</script>

<template>
  <div
    class="core-orbit-metric"
    :class="[
      `core-orbit-metric--${side(position)}`,
      `core-orbit--${position}`,
      status ? `core-orbit-metric--${status}` : null,
    ]"
    :title="hint || undefined"
  >
    <div class="core-orbit-metric__icon">
      <DashIcon :kind="resolvedIcon" :size="22" />
    </div>
    <div class="core-orbit-metric__body">
      <div class="core-orbit-metric__head">
        <span class="core-orbit-metric__label">{{ label }}</span>
        <span
          v-if="statusLabel"
          class="core-orbit-metric__badge"
          :class="status ? `core-orbit-metric__badge--${status}` : null"
        >
          {{ statusLabel }}
        </span>
      </div>
      <strong class="core-orbit-metric__value">{{ value }}</strong>
    </div>
  </div>
</template>
