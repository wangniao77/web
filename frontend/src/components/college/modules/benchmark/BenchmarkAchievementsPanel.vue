<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import BenchmarkMetricsSlide from '@/components/college/modules/benchmark/BenchmarkMetricsSlide.vue'
import BenchmarkStrengthSlide from '@/components/college/modules/benchmark/BenchmarkStrengthSlide.vue'
import BenchmarkWeaknessSlide from '@/components/college/modules/benchmark/BenchmarkWeaknessSlide.vue'
import { ROUTES } from '@/constants/routes'
import { analyzePage } from '@/api/agent/services'
import {
  buildDataCards,
  buildHeroKpis,
  buildStrengthShowcase,
  buildSwotBoard,
  buildWeaknessTriage,
} from '@/api/college/adapters/benchmark-pillars'
import {
  notesFromAnalysis,
  stripRepeatedMetric,
  toBenchmarkSwotSnapshot,
} from '@/utils/agent/benchmark-swot-insights'
import { useScope } from '@/composables/useScope'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  data: BenchmarkAchievementsVM
}>()

const router = useRouter()
const { collegeScope } = useScope()

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
const baseTriage = computed(() => buildWeaknessTriage(props.data.pillars))
const aiNotes = ref<Record<string, string>>({})

const triage = computed(() => {
  const raw = baseTriage.value
  const apply = <T extends {
    key: string
    note?: string
    label: string
    metricLabel: string
    value: number
    target: number
    unit: string
    gap: number
  }>(
    item: T | null,
  ) => {
    if (!item) return null
    const raw = aiNotes.value[item.key] || item.note || ''
    return { ...item, note: stripRepeatedMetric(raw, item) }
  }
  return {
    ...raw,
    worst: apply(raw.worst),
    rest: raw.rest.map((item) => apply(item)!),
  }
})

let noteSeq = 0
let noteFingerprint = ''

function weaknessFingerprint() {
  return props.data.pillars
    .flatMap((pillar) => pillar.metrics.map((m) => `${pillar.key}:${m.label}:${m.value}`))
    .join('|')
}

async function loadWeaknessNotes() {
  if (!props.data.pillars.length) return
  const fingerprint = weaknessFingerprint()
  if (fingerprint === noteFingerprint) return
  noteFingerprint = fingerprint
  const seq = ++noteSeq
  try {
    const snapshot = toBenchmarkSwotSnapshot(buildSwotBoard(props.data.pillars, 'weaknesses'))
    const report = await analyzePage(
      {
        context: {
          scope: 'college',
          page: 'college-benchmark-swot',
          collegeId: collegeScope.value.collegeId,
          summarySnapshot: snapshot as unknown as Record<string, unknown>,
        },
      },
      { force: true },
    )
    if (seq !== noteSeq) return
    const next = notesFromAnalysis(report.insights)
    if (Object.keys(next).length) aiNotes.value = next
  } catch {
    // 保留规则短句，不打断一级轮播
  }
}

watch(
  () => props.data.pillars,
  () => {
    void loadWeaknessNotes()
  },
  { immediate: true },
)

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
