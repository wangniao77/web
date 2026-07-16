<script setup lang="ts">
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import StudentEntranceOutcomesSlide from '@/components/college/modules/student-dev/StudentEntranceOutcomesSlide.vue'
import StudentEndsSlide from '@/components/college/modules/student-dev/StudentEndsSlide.vue'
import type { HighPotentialOverviewVM } from '@/types/college/view/details'
import type { StudentOverviewVM, WarningOverviewVM } from '@/types/college/view'

defineProps<{
  student: StudentOverviewVM
  highPotential: HighPotentialOverviewVM
  warning: WarningOverviewVM
}>()

const slides = [
  { id: 'io', label: '入口 · 出口' },
  { id: 'ends', label: '两端监测' },
]
</script>

<template>
  <PanelSlideCarousel :slides="slides" :interval="10000">
    <template #io>
      <StudentEntranceOutcomesSlide :student="student" />
    </template>
    <template #ends>
      <StudentEndsSlide :high-potential="highPotential" :warning="warning" />
    </template>
  </PanelSlideCarousel>
</template>
