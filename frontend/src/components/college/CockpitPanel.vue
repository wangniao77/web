<script setup lang="ts">
import { computed } from 'vue'
import DashIcon, { type IconKind, resolveIconKind } from '@/components/college/DashIcon.vue'
import {
  COLLEGE_SIMULATED_DATA_HINT,
  isCollegeSimulatedModule,
} from '@/constants/college/simulated-modules'

const props = defineProps<{
  title: string
  icon?: IconKind | string
  panelClass?: string
  /** 模块 id，若在 simulated-modules 清单中则自动显示「模拟数据」标签 */
  moduleId?: string
  /** 强制显示/隐藏模拟标签（覆盖 moduleId 判断） */
  simulated?: boolean
  simulatedHint?: string
}>()

const resolvedIcon = computed(() => (props.icon ? resolveIconKind(props.icon) : undefined))

const showSimulatedBadge = computed(() => {
  if (props.simulated === true) return true
  if (props.simulated === false) return false
  return isCollegeSimulatedModule(props.moduleId)
})

const badgeHint = computed(() => props.simulatedHint || COLLEGE_SIMULATED_DATA_HINT)
</script>

<template>
  <section class="panel panel--section" :class="panelClass">
    <div class="panel__title">
      <span v-if="resolvedIcon" class="panel__icon">
        <DashIcon :kind="resolvedIcon" :size="18" />
      </span>
      <div class="panel__title-text">
        <span class="panel__label">{{ title }}</span>
        <span
          v-if="showSimulatedBadge"
          class="sim-data-badge"
          :title="badgeHint"
          aria-label="模拟数据"
        >
          模拟数据
        </span>
      </div>
    </div>
    <div class="panel__body">
      <slot />
    </div>
  </section>
</template>
