<script setup lang="ts">
/**
 * 学生端缩放壳：主屏 + 二级页共用 1920×1080 contain 自适应（对齐学院 CollegeShellView）
 */
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import StudentScreenLayout from '@/components/student/StudentScreenLayout.vue'
import '@/styles/student/student.scss'

const route = useRoute()
/** 二级页自带 DetailLayout 顶栏，主屏顶栏仅总览显示，避免双顶栏占高 */
const showHeader = computed(() => !route.meta.isStudentSubpage)
</script>

<template>
  <StudentScreenLayout :show-header="showHeader">
    <div class="student-shell">
      <RouterView v-slot="{ Component }">
        <div class="student-shell__page">
          <component :is="Component" />
        </div>
      </RouterView>
    </div>
  </StudentScreenLayout>
</template>

<style scoped lang="scss">
.student-shell {
  flex: 1;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.student-shell__page {
  flex: 1;
  min-height: 0;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;

  :deep(> *) {
    flex: 1 1 auto;
    min-height: 0;
    min-width: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
