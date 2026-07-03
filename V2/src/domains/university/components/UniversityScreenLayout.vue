<script setup lang="ts">
import { useScreenScale } from '@/shared/composables/useScreenScale'
import UniversityScreenHeader from '@/domains/university/components/UniversityScreenHeader.vue'

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper university-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <UniversityScreenHeader />
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
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transform-origin: center center;
}
</style>
