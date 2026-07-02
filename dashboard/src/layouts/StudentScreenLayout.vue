<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import ScreenHeader from '@/components/screen/ScreenHeader.vue'

defineProps<{
  title?: string
  studentName?: string
  studentMeta?: string
}>()

const { scaleStyle } = useScreenScale()
</script>

<template>
  <div class="screen-wrapper">
    <div class="screen-scale" :style="scaleStyle">
      <ScreenHeader
        :title="title || `${studentName || '学生'}个人发展驾驶舱`"
        :subtitle="studentMeta"
        :principles="['我的学业', '我的成长', '我的规划']"
      />
      <main class="screen-main student-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.student-main {
  padding-top: 8px;
}
</style>
