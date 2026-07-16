<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import StudentScreenHeader from '@/components/student/StudentScreenHeader.vue'

const { scaleStyle, canvasStyle, wrapperStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper student-screen" :style="wrapperStyle">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <StudentScreenHeader />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>
