<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import CollegeScreenHeader from '@/components/college/CollegeScreenHeader.vue'

withDefaults(
  defineProps<{
    showHud?: boolean
  }>(),
  {
    showHud: false,
  },
)

const { scaleStyle, canvasStyle, wrapperStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper college-screen" :style="wrapperStyle">
    <div class="screen-scale dashboard cockpit" :style="{ ...canvasStyle, ...scaleStyle }">
      <div v-if="showHud" class="dashboard-scanline" aria-hidden="true" />
      <div v-if="showHud" class="cockpit-hud" aria-hidden="true">
        <span class="cockpit-hud__corner cockpit-hud__corner--tl" />
        <span class="cockpit-hud__corner cockpit-hud__corner--tr" />
        <span class="cockpit-hud__corner cockpit-hud__corner--bl" />
        <span class="cockpit-hud__corner cockpit-hud__corner--br" />
        <span class="cockpit-hud__ring" />
      </div>
      <CollegeScreenHeader />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>
