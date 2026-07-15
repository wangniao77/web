<script setup lang="ts">
import StudentDevAnalyticsSlide from '@/components/college/modules/student-dev/StudentDevAnalyticsSlide.vue'
import type { StudentDevQualityVM } from '@/types/college/view/student-dev-quality'

defineProps<{
  devQuality: StudentDevQualityVM
}>()
</script>

<template>
  <StudentDevAnalyticsSlide :data="devQuality" />
</template>
