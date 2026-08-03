<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import MarqueeText from '@/components/college/modules/benchmark/MarqueeText.vue'
import { ROUTES } from '@/constants/routes'
import type { AchievementCategory } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  data: BenchmarkAchievementsVM
}>()

const router = useRouter()

function openDetail(filter: 'all' | AchievementCategory = 'all') {
  router.push({
    path: ROUTES.college.benchmarkDetail,
    query: filter === 'all' ? { tab: 'overview' } : { tab: 'roster', filter },
  })
}

const ROSTER_LINE_H = 22
const ROSTER_STEP_MS = 2200
const rosterRef = ref<HTMLElement | null>(null)
const rosterPaused = ref(false)
let rosterTimer: number | null = null

function startRosterScroll() {
  stopRosterScroll()
  const el = rosterRef.value
  if (!el) return
  el.scrollTop = 0
  if ((props.data.facultyLeaders.roster?.length ?? 0) <= 1) return
  rosterTimer = window.setInterval(() => {
    if (rosterPaused.value || !rosterRef.value) return
    const node = rosterRef.value
    const max = node.scrollHeight - node.clientHeight
    if (max <= 0) return
    const next = node.scrollTop + ROSTER_LINE_H
    node.scrollTop = next >= max - 1 ? 0 : next
  }, ROSTER_STEP_MS)
}

function stopRosterScroll() {
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

const journalLine = computed(() => {
  const journals = props.data.topPapers.journals
  return journals.length ? journals.join(' · ') : '—'
})

/** 只展示有数的指标，避免「高被引 0 人」这类误导文案 */
const facultyStatsLine = computed(() => {
  const f = props.data.facultyLeaders
  const parts: string[] = []
  if ((f.national ?? 0) > 0) parts.push(`国家级 ${f.national}`)
  if ((f.provincial ?? 0) > 0) parts.push(`省级 ${f.provincial}`)
  if ((f.doctoralSupervisors ?? 0) > 0) parts.push(`博导 ${f.doctoralSupervisors}`)
  if ((f.esiHighCited ?? 0) > 0) parts.push(`高被引 ${f.esiHighCited}`)
  if (parts.length) return parts.join(' · ')
  if (f.roster?.length) return `名录 ${f.roster.length} 人`
  return '高层次人才建设中'
})

const projectLine = computed(
  () => `国 ${props.data.keyProjects.national} / 省部 ${props.data.keyProjects.provincial}`,
)
const fundingLine = computed(
  () => `${props.data.keyProjects.fundingWan.toLocaleString('zh-CN')} 万元`,
)

const MILESTONES_PER_PAGE = 3
const MILESTONE_ROTATE_MS = 8000
const activeMilestoneIndex = ref(0)
const milestonePaused = ref(false)
let milestoneTimer: number | null = null

/** 按成果方向分页，每页最多三条；页面间自动轮换 */
const milestonePages = computed(() => {
  const groups = new Map<string, BenchmarkAchievementsVM['milestones']>()
  for (const item of props.data.milestones ?? []) {
    const group = groups.get(item.badge) ?? []
    group.push(item)
    groups.set(item.badge, group)
  }

  return [...groups.entries()].flatMap(([badge, items]) => {
    const pages = []
    for (let start = 0; start < items.length; start += MILESTONES_PER_PAGE) {
      pages.push({
        badge,
        items: items.slice(start, start + MILESTONES_PER_PAGE),
      })
    }
    return pages
  })
})
const activeMilestoneGroup = computed(
  () => milestonePages.value[activeMilestoneIndex.value] ?? null,
)
const milestoneGroups = computed(() =>
  activeMilestoneGroup.value ? [activeMilestoneGroup.value] : [],
)
const milestoneCount = computed(() => activeMilestoneGroup.value?.items.length ?? 0)

function startMilestoneRotation() {
  if (milestoneTimer != null) window.clearInterval(milestoneTimer)
  milestoneTimer = window.setInterval(() => {
    const pageCount = milestonePages.value.length
    if (milestonePaused.value || pageCount <= 1) return
    activeMilestoneIndex.value = (activeMilestoneIndex.value + 1) % pageCount
  }, MILESTONE_ROTATE_MS)
}

watch(
  () => props.data.facultyLeaders.roster?.length ?? 0,
  async () => {
    await nextTick()
    startRosterScroll()
  },
)

watch(
  () => milestonePages.value.length,
  (pageCount) => {
    if (pageCount === 0) activeMilestoneIndex.value = 0
    else if (activeMilestoneIndex.value >= pageCount) activeMilestoneIndex.value = 0
  },
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
  startMilestoneRotation()
  startRosterScroll()
})

onBeforeUnmount(() => {
  running = false
  stopRosterScroll()
  if (milestoneTimer != null) {
    window.clearInterval(milestoneTimer)
    milestoneTimer = null
  }
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
    <div class="benchmark-slide__cards">
      <button
        type="button"
        class="benchmark-slide__card benchmark-slide__card--faculty"
        @click="openDetail('faculty')"
        @mouseenter="rosterPaused = true"
        @mouseleave="rosterPaused = false"
      >
        <div class="benchmark-slide__card-top">
          <span>名师·头雁</span>
          <strong>{{ data.facultyLeaders.total }}<small>人</small></strong>
        </div>
        <p class="benchmark-slide__line">{{ facultyStatsLine }}</p>
        <div ref="rosterRef" class="benchmark-slide__roster" aria-live="polite">
          <template v-if="data.facultyLeaders.roster.length">
            <span v-for="(r, idx) in data.facultyLeaders.roster" :key="`${r.name}-${idx}`">
              {{ r.name }} · {{ r.honor }}
            </span>
            <template v-if="data.facultyLeaders.roster.length > 1">
              <span
                v-for="(r, idx) in data.facultyLeaders.roster"
                :key="`dup-${r.name}-${idx}`"
                aria-hidden="true"
              >
                {{ r.name }} · {{ r.honor }}
              </span>
            </template>
          </template>
          <span v-else>暂无名师名录</span>
        </div>
      </button>

      <button type="button" class="benchmark-slide__card" @click="openDetail('research')">
        <div class="benchmark-slide__card-top">
          <span>顶刊·智识</span>
          <strong>{{ data.topPapers.count }}</strong>
        </div>
        <p class="benchmark-slide__line">
          中科院一区 {{ data.topPapers.firstTierCount }} 篇
        </p>
        <MarqueeText class="benchmark-slide__foot-marquee" :text="journalLine" :duration="8" />
      </button>

      <button type="button" class="benchmark-slide__card" @click="openDetail('research')">
        <div class="benchmark-slide__card-top">
          <span>攻坚·课题</span>
          <strong>{{ data.keyProjects.national + data.keyProjects.provincial }}</strong>
        </div>
        <p class="benchmark-slide__line">{{ projectLine }}</p>
        <p class="benchmark-slide__foot">{{ fundingLine }}</p>
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
          一等奖 {{ data.competitions.goldOrSpecial }}
        </p>
      </button>
    </div>

    <section
      class="benchmark-slide__hero"
      role="button"
      tabindex="0"
      aria-label="查看年度里程碑详情"
      @click="openDetail('all')"
      @keydown.enter="openDetail('all')"
      @keydown.space.prevent="openDetail('all')"
      @mouseenter="milestonePaused = true"
      @mouseleave="milestonePaused = false"
      @focusin="milestonePaused = true"
      @focusout="milestonePaused = false"
    >
      <header class="benchmark-slide__hero-head">
        <span>年度里程碑</span>
        <div v-if="milestoneCount" class="benchmark-slide__hero-status">
          <small>
            {{ activeMilestoneIndex + 1 }}/{{ milestonePages.length }} ·
            {{ milestoneCount }} 项成果
          </small>
          <span
            v-if="milestonePages.length > 1"
            class="benchmark-slide__hero-dots"
            aria-hidden="true"
          >
            <i
              v-for="(_, index) in milestonePages"
              :key="index"
              :class="{ 'is-active': index === activeMilestoneIndex }"
            ></i>
          </span>
        </div>
      </header>
      <Transition name="milestone-swap" mode="out-in">
        <div
          v-if="milestoneGroups.length"
          :key="`${activeMilestoneIndex}-${activeMilestoneGroup?.badge}`"
          class="benchmark-slide__milestones"
        >
          <article
            v-for="(group, gIndex) in milestoneGroups"
            :key="`${group.badge}-${group.items[0]?.id ?? gIndex}`"
            class="benchmark-slide__milestone"
          >
            <div class="benchmark-slide__milestone-meta">
              <em>{{ group.badge }}</em>
              <span>{{ group.items.length }} 项</span>
            </div>
            <ul class="benchmark-slide__milestone-list">
              <li
                v-for="item in group.items"
                :key="item.id"
                class="benchmark-slide__milestone-row"
                :title="`${item.title}｜${item.interpretation}`"
              >
                <i aria-hidden="true"></i>
                <span class="benchmark-slide__milestone-title">{{ item.title }}</span>
                <time v-if="item.yearLabel">{{ item.yearLabel }}</time>
              </li>
            </ul>
          </article>
        </div>
      </Transition>
      <p v-if="!milestoneGroups.length" class="benchmark-slide__milestone-empty">
        暂无年度里程碑
      </p>
    </section>

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
  gap: 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.benchmark-slide__cards {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  min-height: 108px;

  .benchmark-slide__card {
    min-width: 0;
    min-height: 108px;
  }
}

.benchmark-slide__hero {
  flex: 1 1 0;
  min-height: 120px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  padding: 10px 14px 12px;
  border: 1px solid rgba(255, 213, 106, 0.3);
  border-radius: 8px;
  background: rgba(0, 31, 66, 0.58);
  text-align: left;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease-out, background 0.2s ease-out;

  &:hover {
    border-color: rgba(255, 213, 106, 0.52);
    background: rgba(0, 38, 78, 0.68);
  }

  &:focus-visible {
    outline: 2px solid #7fe9ff;
    outline-offset: 2px;
  }
}

.benchmark-slide__hero-head {
  flex-shrink: 0;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  color: #ffe29a;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 0.1em;
  line-height: 1.25;

  small {
    color: rgba(195, 222, 240, 0.78);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0;
    white-space: nowrap;
  }
}

.benchmark-slide__hero-status {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.benchmark-slide__hero-dots {
  display: flex;
  align-items: center;
  gap: 4px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: rgba(158, 202, 232, 0.36);
    transition: width 0.2s ease-out, background 0.2s ease-out;

    &.is-active {
      width: 12px;
      border-radius: 3px;
      background: #ffd56a;
    }
  }
}

.benchmark-slide__milestones {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0;
  min-height: 0;
}

.benchmark-slide__milestone {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 0 auto;
  min-height: 34px;
  min-width: 0;
  max-width: 100%;
  padding: 6px 0;
  border-top: 1px solid rgba(255, 213, 106, 0.14);

  &:first-child {
    border-top: none;
  }
}

.benchmark-slide__milestone-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;

  em {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 84px;
    padding: 3px 9px;
    border-radius: 4px;
    border: 1px solid rgba(255, 213, 106, 0.38);
    background: rgba(255, 200, 80, 0.1);
    color: #ffe29a;
    font-style: normal;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.35;
    white-space: nowrap;
  }

  span {
    color: rgba(171, 207, 231, 0.78);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
  }
}

.benchmark-slide__milestone-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.benchmark-slide__milestone-row {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 26px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #ffd56a;
    box-shadow: 0 0 5px rgba(255, 213, 106, 0.45);
  }

  time {
    color: rgba(151, 198, 228, 0.78);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
}

.benchmark-slide__milestone-title {
  min-width: 0;
  overflow: hidden;
  color: #eef8ff;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.benchmark-slide__milestone-empty {
  display: grid;
  flex: 1;
  place-items: center;
  margin: 0;
  color: rgba(171, 207, 231, 0.7);
  font-size: 15px;
}

.milestone-swap-enter-active,
.milestone-swap-leave-active {
  transition: opacity 0.18s ease-out, transform 0.18s ease-out;
}

.milestone-swap-enter-from {
  opacity: 0;
  transform: translateY(3px);
}

.milestone-swap-leave-to {
  opacity: 0;
  transform: translateY(-3px);
}

.benchmark-slide__card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  width: 100%;
  min-height: 108px;
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
    font-size: 17px;
    font-weight: 700;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  strong {
    color: #eaf7ff;
    font-size: clamp(26px, 1.6vw, 32px);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    animation: bm-num-glow 2.6s ease-in-out infinite;

    small {
      margin-left: 3px;
      color: #9ecae8;
      font-size: 0.42em;
      font-weight: 600;
    }
  }
}

.benchmark-slide__line {
  flex-shrink: 0;
  margin: 0;
  color: #8ec8e8;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.benchmark-slide__line-marquee {
  display: block;
  min-width: 0;
  max-width: 100%;
  width: 100%;

  :deep(.bm-marquee__item) {
    color: #8ec8e8;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
  }
}

.benchmark-slide__foot {
  flex-shrink: 0;
  margin: 0;
  color: #b8e8ff;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--gold {
    color: #ffd98a;
  }
}

.benchmark-slide__foot-marquee {
  display: block;
  min-width: 0;
  max-width: 100%;
  width: 100%;

  :deep(.bm-marquee__item) {
    color: #b8e8ff;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.2;
  }
}

.benchmark-slide__roster {
  flex: 0 0 auto;
  height: 22px;
  min-height: 22px;
  max-height: 22px;
  overflow: hidden;
  scroll-behavior: smooth;

  span {
    display: block;
    height: 22px;
    color: #9fe8ff;
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.benchmark-slide__ticker {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  flex: 0 0 auto;
  min-width: 0;
  min-height: 40px;
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

@media (prefers-reduced-motion: reduce) {
  .benchmark-slide__card,
  .benchmark-slide__ticker,
  .benchmark-slide__ticker-label,
  .benchmark-slide__card-top strong {
    animation: none;
  }

  .benchmark-slide__card,
  .benchmark-slide__hero,
  .benchmark-slide__ticker,
  .benchmark-slide__hero-dots i,
  .milestone-swap-enter-active,
  .milestone-swap-leave-active {
    transition: none;
  }
}
</style>
