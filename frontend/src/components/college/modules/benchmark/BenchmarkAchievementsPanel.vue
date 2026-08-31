<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import BenchmarkMetricsSlide from '@/components/college/modules/benchmark/BenchmarkMetricsSlide.vue'
import BenchmarkSwotSlide from '@/components/college/modules/benchmark/BenchmarkSwotSlide.vue'
import { ROUTES } from '@/constants/routes'
import { buildSwotRows } from '@/api/college/adapters/benchmark-pillars'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  data: BenchmarkAchievementsVM
}>()

const router = useRouter()

const slides = [
  { id: 'metrics', label: '数据' },
  { id: 'strengths', label: '优势' },
  { id: 'weaknesses', label: '劣势' },
]

const strengthRows = computed(() => buildSwotRows(props.data.pillars, 'strengths'))
const weaknessRows = computed(() => buildSwotRows(props.data.pillars, 'weaknesses'))

function openDetail(pillar: BenchmarkPillarKey) {
  router.push({
    path: ROUTES.college.benchmarkDetail,
    query: { pillar },
  })
}
</script>

<template>
  <PanelSlideCarousel :slides="slides" :interval="12000" hide-chrome>
    <template #metrics>
      <BenchmarkMetricsSlide :pillars="data.pillars" @open="openDetail" />
    </template>
    <template #strengths>
      <BenchmarkSwotSlide tone="good" :rows="strengthRows" @open="openDetail" />
    </template>
    <template #weaknesses>
      <BenchmarkSwotSlide tone="weak" :rows="weaknessRows" @open="openDetail" />
    </template>
  </PanelSlideCarousel>
</template>
