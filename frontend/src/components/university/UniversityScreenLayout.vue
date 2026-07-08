<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import UniversityScreenHeader from '@/components/university/UniversityScreenHeader.vue'
import UniversityScreenFooter from '@/components/university/UniversityScreenFooter.vue'
import StarfieldBackdrop from '@/components/university/StarfieldBackdrop.vue'
import ParticleRainBackground from '@/components/university/ParticleRainBackground.vue'

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper university-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <StarfieldBackdrop />
      <ParticleRainBackground :count="96" />
      <UniversityScreenHeader />
      <main class="screen-main">
        <slot />
      </main>
      <UniversityScreenFooter />
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
