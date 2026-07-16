<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MarqueeText from '@/components/college/modules/benchmark/MarqueeText.vue'
import { ROUTES } from '@/constants/routes'
import type { FacultyHealthLevel, FacultyMetricTone } from '@/types/college/api/teacher-analytics'
import type { TeacherAnalyticsVM } from '@/types/college/view/teacher-analytics'

const props = defineProps<{
  data: TeacherAnalyticsVM
}>()

const router = useRouter()

function openTeacherDetail() {
  router.push(ROUTES.college.teacherResourceBase)
}

const health = computed(() => props.data.health)
const metrics = computed(() => props.data.metrics)

const ringStyle = computed(() => {
  const score = Math.max(0, Math.min(100, health.value.score))
  return {
    background: `conic-gradient(
      from -90deg,
      #5cefff 0deg,
      #00d4ff ${score * 3.6}deg,
      rgba(0, 55, 100, 0.5) ${score * 3.6}deg,
      rgba(0, 55, 100, 0.5) 360deg
    )`,
  }
})

const statusChips = computed(() => [
  { key: 'structure', title: '结构', phrase: levelPhrase('结构', health.value.structure), level: health.value.structure },
  { key: 'load', title: '负荷', phrase: levelPhrase('负荷', health.value.load), level: health.value.load },
  { key: 'risk', title: '风险', phrase: levelPhrase('风险', health.value.risk), level: health.value.risk },
])

function levelPhrase(axis: string, level: FacultyHealthLevel) {
  if (axis === '结构') {
    if (level === '优') return '结构健康'
    if (level === '紧' || level === '警') return '结构告警'
    return '结构一般'
  }
  if (axis === '负荷') {
    if (level === '优') return '负荷宽松'
    if (level === '紧') return '负荷偏紧'
    if (level === '警') return '负荷告警'
    return '负荷适中'
  }
  if (level === '优') return '风险较低'
  if (level === '紧' || level === '警') return '风险偏高'
  return '风险中等'
}

function levelClass(level: FacultyHealthLevel) {
  if (level === '优') return 'is-good'
  if (level === '紧' || level === '警') return 'is-alert'
  return 'is-mid'
}

function toneClass(tone?: FacultyMetricTone) {
  if (!tone) return ''
  return `faculty-atlas__metric--${tone}`
}

function formatValue(metric: (typeof props.data.metrics)[number]) {
  if (metric.key === 'load') return `均${metric.value}`
  if (metric.key === 'stuTeacher') return String(metric.value)
  if (Number.isInteger(metric.value)) return String(metric.value)
  return String(metric.value)
}

const insightItems = computed(() => {
  const list = props.data.insights
  if (!list.length) return []
  return [...list, ...list]
})

const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
let loopDistance = 0
let lastTs = 0
let running = false
let channel: MessageChannel | null = null
const SPEED = 38

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
  <div class="faculty-atlas">
    <div class="faculty-atlas__matrix">
      <button type="button" class="faculty-atlas__hero" @click="openTeacherDetail">
        <header class="faculty-atlas__hero-head">师资健康度</header>
        <div class="faculty-atlas__ring" :style="ringStyle">
          <div class="faculty-atlas__ring-core">
            <strong class="faculty-atlas__score">{{ health.score }}</strong>
            <span class="faculty-atlas__score-unit">分</span>
          </div>
        </div>
        <ul class="faculty-atlas__chips">
          <li
            v-for="chip in statusChips"
            :key="chip.key"
            class="faculty-atlas__chip"
            :class="levelClass(chip.level)"
          >
            <em>{{ chip.level }}</em>
            <span>{{ chip.phrase }}</span>
          </li>
        </ul>
      </button>

      <button
        v-for="(metric, index) in metrics"
        :key="metric.key"
        type="button"
        class="faculty-atlas__metric"
        :class="toneClass(metric.tone)"
        :style="{ '--i': index }"
        @click="openTeacherDetail"
      >
        <span class="faculty-atlas__metric-label">{{ metric.label }}</span>
        <strong class="faculty-atlas__metric-value">
          {{ formatValue(metric) }}<small>{{ metric.unit }}</small>
        </strong>
        <MarqueeText
          class="faculty-atlas__metric-meaning"
          :text="metric.meaning"
          :duration="8"
        />
      </button>
    </div>

    <div class="faculty-atlas__ticker" @click="openTeacherDetail">
      <em class="faculty-atlas__ticker-label">师资诊断</em>
      <div ref="viewportRef" class="faculty-atlas__ticker-viewport">
        <div ref="trackRef" class="faculty-atlas__ticker-track">
          <span
            v-for="(text, index) in insightItems"
            :key="`${index}-${text.slice(0, 8)}`"
            class="faculty-atlas__ticker-item"
          >
            {{ text }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.faculty-atlas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.faculty-atlas__matrix {
  flex: 1 1 0;
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-height: 0;
}

.faculty-atlas__hero {
  grid-row: 1 / span 3;
  grid-column: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  padding: 14px 12px 12px;
  border: 1px solid rgba(0, 230, 255, 0.32);
  border-radius: 8px;
  background:
    radial-gradient(ellipse at 50% 18%, rgba(0, 220, 255, 0.18), transparent 55%),
    rgba(0, 42, 88, 0.36);
  color: inherit;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  animation: fa-hero-in 0.55s ease-out both;
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.2s;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 38%,
      rgba(120, 230, 255, 0.1) 50%,
      transparent 62%
    );
    transform: translateX(-120%);
    animation: fa-sheen 4.8s ease-in-out infinite;
  }

  &:hover {
    border-color: rgba(0, 242, 255, 0.55);
    box-shadow: 0 0 22px rgba(0, 180, 255, 0.22);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }
}

.faculty-atlas__hero-head {
  flex-shrink: 0;
  color: #8ff0ff;
  font-size: clamp(18px, 1.2vw, 22px);
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-shadow: 0 0 14px rgba(0, 220, 255, 0.35);
}

.faculty-atlas__ring {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: clamp(96px, 8.5vw, 118px);
  height: clamp(96px, 8.5vw, 118px);
  border-radius: 50%;
  animation: fa-pulse 3.6s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 7px;
    border-radius: 50%;
    background:
      radial-gradient(circle at 40% 35%, rgba(40, 120, 180, 0.35), transparent 55%),
      rgba(2, 20, 46, 0.94);
  }
}

.faculty-atlas__ring-core {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1;
}

.faculty-atlas__score {
  color: #f2fbff;
  font-size: clamp(36px, 2.6vw, 48px);
  font-weight: 800;
  letter-spacing: 0.01em;
  text-shadow: 0 0 18px rgba(0, 230, 255, 0.5);
}

.faculty-atlas__score-unit {
  color: #9ecae8;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.faculty-atlas__chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  min-height: 0;
}

.faculty-atlas__chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.2);
  background: rgba(0, 60, 120, 0.28);

  em {
    flex: 0 0 auto;
    font-style: normal;
    font-size: 16px;
    font-weight: 800;
    letter-spacing: 0.08em;
    line-height: 1;
  }

  span {
    flex: 1 1 auto;
    min-width: 0;
    color: #d4eefc;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &.is-good {
    border-color: rgba(80, 230, 180, 0.4);
    background: rgba(18, 90, 72, 0.28);

    em {
      color: #8dffd2;
    }
  }

  &.is-mid {
    border-color: rgba(255, 210, 100, 0.38);
    background: rgba(90, 70, 18, 0.28);

    em {
      color: #ffe29a;
    }
  }

  &.is-alert {
    border-color: rgba(255, 140, 90, 0.45);
    background: rgba(100, 42, 18, 0.3);

    em {
      color: #ffb08a;
    }
  }
}

.faculty-atlas__metric {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  padding: 11px 13px;
  border: 1px solid rgba(0, 200, 255, 0.18);
  border-radius: 8px;
  background: rgba(0, 52, 105, 0.28);
  color: inherit;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  animation: fa-card-in 0.48s ease-out both;
  animation-delay: calc(0.08s + 0.05s * var(--i, 0));
  transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.48);
    background: rgba(0, 85, 150, 0.32);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 120, 200, 0.2);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &--ok .faculty-atlas__metric-value,
  &--up .faculty-atlas__metric-value {
    color: #7ff6ff;
  }

  &--warn .faculty-atlas__metric-value {
    color: #ffe29a;
  }

  &--risk .faculty-atlas__metric-value,
  &--down .faculty-atlas__metric-value {
    color: #ff9b6a;
  }
}

.faculty-atlas__metric-label {
  color: #9ecae8;
  font-size: clamp(15px, 1.05vw, 18px);
  font-weight: 700;
  letter-spacing: 0.05em;
  line-height: 1.2;
  white-space: nowrap;
}

.faculty-atlas__metric-value {
  color: #eaf7ff;
  font-size: clamp(26px, 1.9vw, 34px);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: 0.01em;
  white-space: nowrap;

  small {
    margin-left: 3px;
    color: #9ecae8;
    font-size: 0.48em;
    font-weight: 650;
  }
}

.faculty-atlas__metric-meaning {
  flex: 0 0 auto;
  min-width: 0;
  min-height: 1.35em;
  color: #b8e4ff;

  :deep(.bm-marquee__item) {
    color: #b8e4ff;
    font-size: clamp(15px, 1vw, 17px);
    font-weight: 700;
    letter-spacing: 0.02em;
    line-height: 1.35;
  }
}

.faculty-atlas__ticker {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  min-height: 44px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.2);
  background:
    linear-gradient(90deg, rgba(0, 90, 160, 0.3), rgba(0, 40, 90, 0.36));
  cursor: pointer;
  transition: border-color 0.18s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
  }
}

.faculty-atlas__ticker-label {
  flex: 0 0 auto;
  color: #7ff6ff;
  font-size: 16px;
  font-style: normal;
  font-weight: 800;
  letter-spacing: 0.12em;
  white-space: nowrap;
  text-shadow: 0 0 10px rgba(0, 220, 255, 0.28);
}

.faculty-atlas__ticker-viewport {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.faculty-atlas__ticker-track {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 32px;
  width: max-content;
}

.faculty-atlas__ticker-item {
  flex: 0 0 auto;
  color: #d8f0ff;
  font-size: 16px;
  font-weight: 650;
  letter-spacing: 0.03em;
  white-space: nowrap;

  &::before {
    content: '◆';
    margin-right: 10px;
    color: rgba(0, 230, 255, 0.55);
    font-size: 0.65em;
  }
}

@keyframes fa-hero-in {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fa-card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fa-sheen {
  0%,
  55% {
    transform: translateX(-120%);
  }
  80%,
  100% {
    transform: translateX(120%);
  }
}

@keyframes fa-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(0, 230, 255, 0.16);
  }
  50% {
    box-shadow: 0 0 18px 2px rgba(0, 230, 255, 0.3);
  }
}

@media (prefers-reduced-motion: reduce) {
  .faculty-atlas__hero,
  .faculty-atlas__metric,
  .faculty-atlas__ring,
  .faculty-atlas__hero::after {
    animation: none !important;
  }
}
</style>
