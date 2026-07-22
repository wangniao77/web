<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import StudentScreenHeader from '@/components/student/StudentScreenHeader.vue'

const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'contain' })
</script>

<template>
  <div class="screen-wrapper student-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <div class="stu-tech-overlay" aria-hidden="true">
        <span class="stu-tech-energy stu-tech-energy--primary" />
        <span class="stu-tech-energy stu-tech-energy--secondary" />
        <span
          v-for="n in 7"
          :key="n"
          class="stu-tech-particle"
          :style="{ '--i': n }"
        />
      </div>
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
