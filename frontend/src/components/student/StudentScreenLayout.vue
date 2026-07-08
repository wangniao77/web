<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import StudentScreenHeader from '@/components/student/StudentScreenHeader.vue'

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fill' })
</script>

<template>
  <div class="screen-wrapper student-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <StudentScreenHeader />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.student-screen {
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
