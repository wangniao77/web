<script setup lang="ts">
import { useScreenScale } from '@/shared/composables/useScreenScale'
import UniversityScreenHeader from '@/domains/university/components/UniversityScreenHeader.vue'
import StarfieldBackdrop from '@/domains/university/components/StarfieldBackdrop.vue'
import ParticleRainBackground from '@/domains/university/components/ParticleRainBackground.vue'
import type { DashboardMetaVM } from '@/domains/university/types/view'

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
