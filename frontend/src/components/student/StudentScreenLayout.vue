<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import StudentScreenHeader from '@/components/student/StudentScreenHeader.vue'

withDefaults(
  defineProps<{
    /** 是否显示主屏顶栏；二级页通常关闭 */
    showHeader?: boolean
  }>(),
  {
    showHeader: true,
  },
)

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
      <StudentScreenHeader v-if="showHeader" />
      <main class="screen-main" :class="{ 'screen-main--flush': !showHeader }">
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
  min-width: 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;

  &--flush {
    /* 二级页无主顶栏时，内容贴满画布 */
    padding-top: 0;
  }
}
</style>
