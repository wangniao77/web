<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import UniversityScreenHeader from '@/components/university/UniversityScreenHeader.vue'
import StarfieldBackdrop from '@/components/university/StarfieldBackdrop.vue'
import ParticleRainBackground from '@/components/university/ParticleRainBackground.vue'
import type { DashboardMetaVM } from '@/types/university/view'

defineProps<{
  meta?: DashboardMetaVM | null
}>()

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper university-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <StarfieldBackdrop />
      <ParticleRainBackground :count="96" />
      <UniversityScreenHeader :meta="meta" />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.university-screen {
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
}
</style>
