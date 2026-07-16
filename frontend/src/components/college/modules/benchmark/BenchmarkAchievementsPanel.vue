<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import MarqueeText from '@/components/college/modules/benchmark/MarqueeText.vue'
import type { AchievementCategory } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  data: BenchmarkAchievementsVM
}>()

function openDetail(filter: 'all' | AchievementCategory = 'all') {
  openCollegeDetail({ kind: 'benchmark-detail', id: filter })
}

const facultyHover = ref(false)
const rosterRef = ref<HTMLElement | null>(null)
let rosterTimer: number | null = null

function startRosterScroll() {
  facultyHover.value = true
  stopRosterScroll(false)
  const el = rosterRef.value
  if (!el) return
  el.scrollTop = 0
  rosterTimer = window.setInterval(() => {
    if (!rosterRef.value) return
    const node = rosterRef.value
    const max = node.scrollHeight - node.clientHeight
    if (max <= 0) return
    if (node.scrollTop >= max - 1) node.scrollTop = 0
    else node.scrollTop += 1
  }, 45)
}

function stopRosterScroll(resetHover = true) {
  if (resetHover) facultyHover.value = false
  if (rosterTimer != null) {
    window.clearInterval(rosterTimer)
    rosterTimer = null
  }
}

const viewportRef = ref<HTMLElement | null>(null)
const trackRef = ref<HTMLElement | null>(null)
const tickerItems = computed(() => {
  const list = props.data.gallery
  if (!list.length) return []
  return [...list, ...list]
})

const journalLine = computed(() => props.data.topPapers.journals.join(' · '))
const facultyLine = computed(
  () => `国家级 ${props.data.facultyLeaders.national} / 省级 ${props.data.facultyLeaders.provincial}`,
)
const projectLine = computed(
  () => `国 ${props.data.keyProjects.national} / 省部 ${props.data.keyProjects.provincial}`,
)
const fundingLine = computed(
  () => `${props.data.keyProjects.fundingWan.toLocaleString('zh-CN')} 万元`,
)

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
  stopRosterScroll()
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
    <div class="benchmark-slide__matrix">
      <button
        type="button"
        class="benchmark-slide__hero"
        @click="openDetail('all')"
      >
        <header class="benchmark-slide__hero-head">年度里程碑</header>
        <ul class="benchmark-slide__milestones">
          <li
            v-for="(item, index) in data.milestones"
            :key="item.id"
            class="benchmark-slide__milestone"
            :style="{ '--i': index }"
            :title="item.interpretation"
          >
            <em>{{ item.badge }}</em>
            <MarqueeText class="benchmark-slide__title-marquee" :text="item.title" :duration="9" />
          </li>
        </ul>
      </button>

      <button
        type="button"
        class="benchmark-slide__card benchmark-slide__card--faculty"
        :class="{ 'is-hover': facultyHover }"
        @click="openDetail('faculty')"
        @mouseenter="startRosterScroll"
        @mouseleave="stopRosterScroll()"
      >
        <div class="benchmark-slide__card-top">
          <span>名师·头雁</span>
          <strong>{{ data.facultyLeaders.total }}<small>人</small></strong>
        </div>
        <MarqueeText class="benchmark-slide__line-marquee" :text="facultyLine" :duration="7" />
        <div ref="rosterRef" class="benchmark-slide__roster">
          <span v-for="(r, idx) in data.facultyLeaders.roster" :key="`${r.name}-${idx}`">
            {{ r.name }} · {{ r.honor }}
          </span>
          <span v-for="(r, idx) in data.facultyLeaders.roster" :key="`dup-${r.name}-${idx}`">
            {{ r.name }} · {{ r.honor }}
          </span>
        </div>
      </button>

      <button type="button" class="benchmark-slide__card" @click="openDetail('research')">
        <div class="benchmark-slide__card-top">
          <span>顶刊·智识</span>
          <strong>{{ data.topPapers.count }}<small>篇</small></strong>
        </div>
        <p class="benchmark-slide__line">
          引用 {{ data.topPapers.citations.toLocaleString('zh-CN') }}
        </p>
        <MarqueeText class="benchmark-slide__foot-marquee" :text="journalLine" :duration="8" />
      </button>

      <button type="button" class="benchmark-slide__card" @click="openDetail('research')">
        <div class="benchmark-slide__card-top">
          <span>攻坚·课题</span>
          <strong>{{ data.keyProjects.national + data.keyProjects.provincial }}<small>项</small></strong>
        </div>
        <MarqueeText class="benchmark-slide__line-marquee" :text="projectLine" :duration="7" />
        <MarqueeText class="benchmark-slide__foot-marquee" :text="fundingLine" :duration="6" />
      </button>

      <button
        type="button"
        class="benchmark-slide__card benchmark-slide__card--comp"
        @click="openDetail('competition')"
      >
        <div class="benchmark-slide__card-top">
          <span>竞攀·巅峰</span>
          <strong>{{ data.competitions.nationalAwards }}<small>项</small></strong>
        </div>
        <p class="benchmark-slide__line">三大赛国奖</p>
        <p class="benchmark-slide__foot benchmark-slide__foot--gold">
          特等/金奖 {{ data.competitions.goldOrSpecial }}
        </p>
      </button>
    </div>

    <div class="benchmark-slide__ticker" @click="openDetail('all')">
      <em class="benchmark-slide__ticker-label">成果长廊</em>
      <div ref="viewportRef" class="benchmark-slide__ticker-viewport">
        <div ref="trackRef" class="benchmark-slide__ticker-track">
          <span
            v-for="(item, index) in tickerItems"
            :key="`${item.id}-${index}`"
            class="benchmark-slide__ticker-item"
          >
            <i>{{ item.level }}</i>
            {{ item.title }}
            <small v-if="item.leader">· {{ item.leader }}</small>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.benchmark-slide {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.benchmark-slide__matrix {
  flex: 1 1 0;
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr) minmax(0, 0.9fr);
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  min-height: 0;
}

.benchmark-slide__hero {
  grid-row: 1 / span 2;
  grid-column: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  min-height: 0;
  padding: 14px 16px;
  border: 1px solid rgba(255, 213, 106, 0.34);
  border-radius: 8px;
  background:
    radial-gradient(ellipse at 18% 0%, rgba(255, 200, 80, 0.12), transparent 52%),
    rgba(0, 40, 80, 0.28);
  text-align: left;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  animation: bm-hero-in 0.55s ease-out both;
  transition: border-color 0.22s, box-shadow 0.22s, transform 0.2s;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      110deg,
      transparent 40%,
      rgba(255, 230, 150, 0.08) 50%,
      transparent 60%
    );
    transform: translateX(-120%);
    animation: bm-sheen 4.5s ease-in-out infinite;
  }

  &:hover {
    border-color: rgba(255, 213, 106, 0.58);
    box-shadow: 0 0 22px rgba(255, 180, 60, 0.2);
    transform: translateY(-1px);
  }
}

.benchmark-slide__hero-head {
  flex-shrink: 0;
  color: #ffe29a;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 0.14em;
  line-height: 1.2;
  text-shadow: 0 0 12px rgba(255, 200, 80, 0.35);
}

.benchmark-slide__milestones {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 0;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.benchmark-slide__milestone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  padding: 10px 0;
  border-top: 1px solid rgba(255, 213, 106, 0.14);
  animation: bm-in 0.5s ease-out both;
  animation-delay: calc(0.12s + var(--i, 0) * 0.1s);

  &:first-child {
    border-top: none;
    padding-top: 0;
  }

  em {
    display: inline-flex;
    align-self: flex-start;
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid rgba(255, 213, 106, 0.45);
    background: rgba(255, 200, 80, 0.14);
    color: #ffe29a;
    font-style: normal;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.06em;
    line-height: 1.35;
    white-space: nowrap;
    animation: bm-badge-pulse 2.8s ease-in-out infinite;
    animation-delay: calc(var(--i, 0) * 0.35s);
  }
}

.benchmark-slide__title-marquee {
  display: block;
  min-width: 0;
  max-width: 100%;
  width: 100%;

  :deep(.bm-marquee__item) {
    color: #eef9ff;
    font-size: clamp(18px, 1.25vw, 22px);
    font-weight: 700;
    line-height: 1.35;
  }
}

.benchmark-slide__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  min-height: 0;
  padding: 12px 14px;
  border: 1px solid rgba(0, 200, 255, 0.18);
  border-radius: 8px;
  background: rgba(0, 50, 100, 0.24);
  text-align: left;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  animation: bm-card-in 0.5s ease-out both;
  transition: border-color 0.2s, background 0.2s, transform 0.2s, box-shadow 0.2s;

  &:nth-child(2) { animation-delay: 0.14s; }
  &:nth-child(3) { animation-delay: 0.2s; }
  &:nth-child(4) { animation-delay: 0.26s; }
  &:nth-child(5) { animation-delay: 0.32s; }

  &:hover {
    border-color: rgba(0, 242, 255, 0.48);
    background: rgba(0, 90, 160, 0.3);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 120, 200, 0.22);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }

  &--faculty .benchmark-slide__card-top strong {
    color: #7fe9ff;
  }

  &--comp .benchmark-slide__card-top strong {
    color: #ffd98a;
  }
}

.benchmark-slide__card-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;

  span {
    color: #9ecae8;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  strong {
    color: #eaf7ff;
    font-size: clamp(28px, 2vw, 36px);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    animation: bm-num-glow 2.6s ease-in-out infinite;

    small {
      margin-left: 3px;
      color: #9ecae8;
      font-size: 0.4em;
      font-weight: 600;
    }
  }
}

.benchmark-slide__line {
  margin: 0;
  color: #8ec8e8;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
}

.benchmark-slide__line-marquee {
  display: block;
  min-width: 0;
  max-width: 100%;
  width: 100%;

  :deep(.bm-marquee__item) {
    color: #8ec8e8;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
}

.benchmark-slide__foot {
  margin: 0;
  margin-top: auto;
  color: #b8e8ff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;

  &--gold {
    color: #ffd98a;
  }
}

.benchmark-slide__foot-marquee {
  display: block;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  margin-top: auto;

  :deep(.bm-marquee__item) {
    color: #b8e8ff;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.3;
  }
}

.benchmark-slide__roster {
  flex: 1 1 0;
  min-height: 0;
  max-height: 26px;
  overflow: hidden;
  opacity: 0.75;
  transition: max-height 0.25s, opacity 0.25s;

  span {
    display: block;
    height: 26px;
    color: #9fe8ff;
    font-size: 15px;
    font-weight: 600;
    line-height: 26px;
    white-space: nowrap;
  }
}

.benchmark-slide__card--faculty.is-hover .benchmark-slide__roster {
  max-height: 52px;
  opacity: 1;
}

.benchmark-slide__ticker {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 42px;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.18);
  background: rgba(0, 60, 120, 0.24);
  cursor: pointer;
  animation: bm-ticker-in 0.55s ease-out 0.35s both;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
    box-shadow: 0 0 14px rgba(0, 180, 255, 0.16);
  }
}

.benchmark-slide__ticker-label {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255, 213, 106, 0.4);
  background: rgba(255, 200, 80, 0.12);
  color: #ffe29a;
  font-style: normal;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 0.05em;
  white-space: nowrap;
  animation: bm-badge-pulse 3s ease-in-out infinite;
}

.benchmark-slide__ticker-viewport {
  min-width: 0;
  overflow: hidden;
  mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent);
}

.benchmark-slide__ticker-track {
  display: flex;
  align-items: center;
  gap: 28px;
  width: max-content;
  padding-right: 36px;
  white-space: nowrap;
}

.benchmark-slide__ticker-item {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: #e8f6ff;
  font-size: 18px;
  font-weight: 600;

  i {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 3px;
    border: 1px solid rgba(0, 200, 255, 0.28);
    background: rgba(0, 100, 180, 0.22);
    color: #9fe8ff;
    font-style: normal;
    font-size: 13px;
    font-weight: 700;
  }

  small {
    color: rgba(174, 210, 235, 0.72);
    font-size: 0.88em;
  }
}

@keyframes bm-in {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes bm-hero-in {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bm-card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bm-ticker-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bm-badge-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 rgba(255, 200, 80, 0);
  }
  50% {
    box-shadow: 0 0 12px rgba(255, 200, 80, 0.35);
  }
}

@keyframes bm-num-glow {
  0%,
  100% {
    text-shadow: 0 0 0 transparent;
  }
  50% {
    text-shadow: 0 0 14px rgba(0, 230, 255, 0.35);
  }
}

@keyframes bm-sheen {
  0%,
  55% {
    transform: translateX(-120%);
  }
  75%,
  100% {
    transform: translateX(120%);
  }
}
</style>
