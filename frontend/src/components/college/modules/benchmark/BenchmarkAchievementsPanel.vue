<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { AchievementCategory } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  data: BenchmarkAchievementsVM
}>()

const kpiList = computed(() => [
  {
    key: 'annualHonors',
    label: '年度荣誉',
    value: props.data.summary.annualHonors,
    filter: 'all' as const,
  },
  {
    key: 'competitionAwards',
    label: '竞赛获奖',
    value: props.data.summary.competitionAwards,
    filter: 'competition' as const,
  },
  {
    key: 'researchOutputs',
    label: '科研成果',
    value: props.data.summary.researchOutputs,
    filter: 'research' as const,
  },
  {
    key: 'nationalProvincial',
    label: '国省部级',
    value: props.data.summary.nationalProvincial,
    filter: 'all' as const,
    tone: 'highlight' as const,
  },
  {
    key: 'platformOutputs',
    label: '平台成果',
    value: props.data.summary.platformOutputs,
    filter: 'platform' as const,
    tone: 'excellent' as const,
  },
  {
    key: 'facultyAchievements',
    label: '师资成果',
    value: props.data.summary.facultyAchievements,
    filter: 'faculty' as const,
  },
])

function openDetail(filter: 'all' | AchievementCategory = 'all') {
  openCollegeDetail({ kind: 'benchmark-detail', id: filter })
}

/** 最新进展播报：双份列表 + scrollLeft 无缝横向滚动 */
const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const tickerItems = computed(() => {
  const list = props.data.highlights
  if (!list.length) return []
  return [...list, ...list]
})

let loopDistance = 0
let lastTs = 0
let running = false
let channel: MessageChannel | null = null
const SPEED = 42

function measureLoop() {
  const track = trackRef.value
  if (!track) {
    loopDistance = 0
    return
  }
  loopDistance = Math.floor(track.scrollWidth / 2)
}

function step() {
  const viewport = viewportRef.value
  if (!viewport || !running) return
  const now = performance.now()
  if (!lastTs) lastTs = now
  const dt = Math.min(1, Math.max(0, (now - lastTs) / 1000))
  lastTs = now
  if (loopDistance < 8) measureLoop()
  if (loopDistance < 8) return
  let next = viewport.scrollLeft + SPEED * dt
  if (next >= loopDistance) next -= loopDistance
  viewport.scrollLeft = next
}

function pump() {
  if (!running || !channel) return
  step()
  try {
    channel.port2.postMessage(null)
  } catch {
    window.setTimeout(pump, 50)
  }
}

onMounted(async () => {
  await nextTick()
  measureLoop()
  lastTs = performance.now()
  if (viewportRef.value) viewportRef.value.scrollLeft = 0
  running = true
  channel = new MessageChannel()
  channel.port1.onmessage = () => {
    window.setTimeout(pump, 50)
  }
  pump()
  window.setTimeout(measureLoop, 200)
})

onBeforeUnmount(() => {
  running = false
  if (channel) {
    channel.port1.onmessage = null
    channel.port1.close()
    channel.port2.close()
    channel = null
  }
})
</script>

<template>
  <div class="benchmark-slide">
    <div class="benchmark-slide__kpis">
      <button
        v-for="item in kpiList"
        :key="item.key"
        type="button"
        class="benchmark-slide__kpi"
        :class="{
          'benchmark-slide__kpi--highlight': item.tone === 'highlight',
          'benchmark-slide__kpi--excellent': item.tone === 'excellent',
        }"
        @click="openDetail(item.filter)"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}<small>项</small></strong>
      </button>
    </div>

    <div class="benchmark-slide__ticker" @click="openDetail('all')">
      <em class="benchmark-slide__ticker-label">最新进展</em>
      <div ref="viewportRef" class="benchmark-slide__ticker-viewport">
        <div ref="trackRef" class="benchmark-slide__ticker-track">
          <span
            v-for="(item, index) in tickerItems"
            :key="`${item.id}-${index}`"
            class="benchmark-slide__ticker-item"
          >
            <b>{{ item.date }}</b>
            <i>{{ item.level }}</i>
            {{ item.title }}
            <small v-if="item.leader">· {{ item.leader }}</small>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
