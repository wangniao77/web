<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import CollegeScreenHeader from '@/components/screen/college/CollegeScreenHeader.vue'

// fluid：高度完整显示 + 宽屏拉宽画布，两侧无留白、顶底不裁切
const { scaleStyle, canvasStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper college-screen">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
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
}

.screen-scale {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transform-origin: center center;
}
</style>
