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

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fill' })
</script>

<template>
  <div class="screen-wrapper college-screen">
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

<style scoped lang="scss">
.college-screen {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-scale {
  position: relative;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transform-origin: center center;
  overflow: hidden;
}

.screen-main {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
}
</style>
