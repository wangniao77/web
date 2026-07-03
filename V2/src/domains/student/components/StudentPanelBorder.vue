<script setup lang="ts">
import { BorderBox8, BorderBox13 } from '@kjgl77/datav-vue3'
import { STUDENT_DATAV_BG, STUDENT_DATAV_COLORS } from '@/domains/student/constants/datav-theme'

withDefaults(
  defineProps<{
    variant?: '8' | '13'
  }>(),
  { variant: '8' },
)
</script>

<template>
  <div class="student-panel-border">
    <BorderBox8
      v-if="variant === '8'"
      :color="STUDENT_DATAV_COLORS"
      :background-color="STUDENT_DATAV_BG"
    >
      <slot />
    </BorderBox8>
    <BorderBox13
      v-else
      :color="STUDENT_DATAV_COLORS"
      :background-color="STUDENT_DATAV_BG"
    >
      <slot />
    </BorderBox13>
  </div>
</template>

<style scoped lang="scss">
.student-panel-border {
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;

  :deep(.dv-border-box-8),
  :deep(.dv-border-box-13) {
    width: 100%;
    height: 100%;
  }

  :deep(.dv-border-box-content) {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
  }

  :deep(.panel) {
    height: 100%;
    border-color: transparent;
    background: transparent;
    box-shadow: none;

    &::before,
    &::after {
      display: none;
    }

    &:hover {
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }
  }

  :deep(.panel-glow) {
    opacity: 0.45;
  }
}
</style>
