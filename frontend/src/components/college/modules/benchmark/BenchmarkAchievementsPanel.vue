<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import BenchmarkMetricsSlide from '@/components/college/modules/benchmark/BenchmarkMetricsSlide.vue'
import BenchmarkStrengthSlide from '@/components/college/modules/benchmark/BenchmarkStrengthSlide.vue'
import BenchmarkWeaknessSlide from '@/components/college/modules/benchmark/BenchmarkWeaknessSlide.vue'
import { ROUTES } from '@/constants/routes'
import {
  buildDataCards,
  buildHeroKpis,
  buildStrengthShowcase,
  buildWeaknessTriage,
} from '@/api/college/adapters/benchmark-pillars'
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

const heroes = computed(() => buildHeroKpis(props.data.pillars))
const cards = computed(() => buildDataCards(props.data.pillars))
const showcase = computed(() =>
  buildStrengthShowcase({
    pillars: props.data.pillars,
    gallery: props.data.gallery,
    highlights: props.data.highlights,
    milestones: props.data.milestones,
  }),
)
const triage = computed(() => buildWeaknessTriage(props.data.pillars))

function openDetail(pillar: BenchmarkPillarKey) {
  router.push({
    path: ROUTES.college.benchmarkDetail,
    query: { pillar },
  })
}
</script>

<template>
  <PanelSlideCarousel :slides="slides" :interval="12000" hide-chrome overlay-caption>
    <template #metrics>
      <BenchmarkMetricsSlide :heroes="heroes" :cards="cards" @open="openDetail" />
    </template>
    <template #strengths>
      <BenchmarkStrengthSlide :showcase="showcase" @open="openDetail" />
    </template>
    <template #weaknesses>
      <BenchmarkWeaknessSlide :triage="triage" @open="openDetail" />
    </template>
  </PanelSlideCarousel>
</template>
