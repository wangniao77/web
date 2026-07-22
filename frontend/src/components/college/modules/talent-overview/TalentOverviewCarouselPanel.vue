<script setup lang="ts">
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import StudentDevQualityPanel from '@/components/college/modules/student-dev/StudentDevQualityPanel.vue'
import EnrollmentEmploymentPanel from '@/components/college/modules/enrollment-employment/EnrollmentEmploymentPanel.vue'
import type { StudentDevQualityVM } from '@/types/college/view/student-dev-quality'
import type { EnrollmentEmploymentOverviewVM } from '@/types/college/view/enrollment-employment'

defineProps<{
  devQuality: StudentDevQualityVM | null
  enrollment: EnrollmentEmploymentOverviewVM | null
}>()

const slides = [
  { id: 'portrait', label: '人才培养画像' },
  { id: 'enrollment', label: '生源与就业质量' },
]
</script>

<template>
  <PanelSlideCarousel :slides="slides" :interval="12000" hide-chrome>
    <template #portrait>
      <StudentDevQualityPanel v-if="devQuality" :dev-quality="devQuality" />
      <div v-else class="cockpit-panel-empty">人才培养画像数据暂不可用</div>
    </template>

    <template #enrollment>
      <EnrollmentEmploymentPanel v-if="enrollment" :data="enrollment" />
      <div v-else class="cockpit-panel-empty">生源与就业质量数据暂不可用</div>
    </template>
  </PanelSlideCarousel>
</template>

<style scoped lang="scss">
.cockpit-panel-empty {
  display: grid;
  place-items: center;
  min-height: 120px;
  color: rgba(174, 198, 230, 0.55);
  font-size: 24px;
}
</style>
