<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { SoftDimensionDTO } from '@/types/college/api/discipline-overview'
import type { DisciplineOverviewVM } from '@/types/college/view/discipline-overview'
import type { EChartsOption } from 'echarts'

type PeerMode = 'regional' | 'finance'
type SoftTone = 'lead' | 'even' | 'warn' | 'risk'

const props = defineProps<{
  discipline: DisciplineOverviewVM | null
}>()

const router = useRouter()

const MAJOR_ROTATION_MS = 6000

const activeIndex = ref(0)
const peerMode = ref<PeerMode>('regional')
const tabsPaused = ref(false)
const tabProgress = ref(0)

let rotationElapsed = 0
let rotationLastTs = 0
let rotationRafId = 0

function resetTabProgress() {
  rotationElapsed = 0
  rotationLastTs = 0
  tabProgress.value = 0
}

function advanceMajor() {
  const count = majors.value.length
  if (count <= 1) return
  activeIndex.value = (activeIndex.value + 1) % count
  resetTabProgress()
}

function rotationLoop(ts: number) {
  if (!rotationLastTs) rotationLastTs = ts

  if (!tabsPaused.value && majors.value.length > 1) {
    rotationElapsed += ts - rotationLastTs
    tabProgress.value = Math.min((rotationElapsed / MAJOR_ROTATION_MS) * 100, 100)

    if (rotationElapsed >= MAJOR_ROTATION_MS) {
      advanceMajor()
    }
  }

  rotationLastTs = ts
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function startMajorRotation() {
  stopMajorRotation()
  resetTabProgress()
  if (majors.value.length <= 1) return
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function stopMajorRotation() {
  if (rotationRafId) {
    window.cancelAnimationFrame(rotationRafId)
    rotationRafId = 0
  }
  rotationLastTs = 0
}

function onTabSelect(index: number) {
  activeIndex.value = index
  resetTabProgress()
}

watch(
  () => props.discipline?.majors?.length,
  (len) => {
    if (!len) {
      activeIndex.value = 0
      return
    }
    const rankWeight = (g: string) => (g === 'A' ? 3 : g.startsWith('B+') ? 2 : 1)
    const best = props.discipline!.majors.reduce(
      (bestIdx, m, i, arr) => (rankWeight(m.grade) > rankWeight(arr[bestIdx].grade) ? i : bestIdx),
      0,
    )
    activeIndex.value = best
  },
  { immediate: true },
)

watch(activeIndex, () => {
  peerMode.value = 'regional'
})

const majors = computed(() => props.discipline?.majors ?? [])
const active = computed(() => majors.value[activeIndex.value] ?? null)

onMounted(startMajorRotation)
onBeforeUnmount(stopMajorRotation)

watch(
  () => majors.value.length,
  (len) => {
    if (activeIndex.value >= len) activeIndex.value = 0
    startMajorRotation()
  },
)
const ranking = computed(() => props.discipline?.ranking)

function formatChange(change: number) {
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '→'
}

function changeClass(change: number) {
  if (change > 0) return 'is-up'
  if (change < 0) return 'is-down'
  return 'is-flat'
}

function gradeClass(grade: string) {
  return `grade--${grade.replace('+', 'plus')}`
}

function shortName(name: string) {
  if (name.includes('计算机')) return '计科'
  if (name.includes('软件')) return '软工'
  if (name.includes('人工')) return '人工智能'
  return name.slice(0, 4)
}

function openDisciplineDetail() {
  router.push(ROUTES.college.disciplineDetail)
}

function softDimensionTone(dim: SoftDimensionDTO): SoftTone {
  const gap = dim.score - dim.peerAverage
  if (gap >= 0) return 'lead'
  if (gap >= -3) return 'even'
  if (gap >= -6) return 'warn'
  return 'risk'
}

function softDimensionGap(dim: SoftDimensionDTO) {
  const gap = dim.score - dim.peerAverage
  if (gap > 0) return `+${gap}`
  if (gap < 0) return `${gap}`
  return '持平'
}

const softDimensions = computed<SoftDimensionDTO[]>(() => {
  const major = active.value
  if (!major) return []
  if (major.softDimensions?.length) return major.softDimensions
  return (props.discipline?.dimensions ?? []).map((d) => ({
    key: d.key as SoftDimensionDTO['key'],
    label: d.label,
    score: d.score,
    peerAverage: d.peerAverage,
  }))
})

const softInsight = computed(() => {
  const dims = softDimensions.value
  if (!dims.length) return ''
  const sorted = [...dims].sort((a, b) => b.score - b.peerAverage - (a.score - a.peerAverage))
  const strongest = sorted[0]
  const weakest = sorted[sorted.length - 1]
  const strongGap = strongest.score - strongest.peerAverage
  const weakGap = weakest.score - weakest.peerAverage

  if (strongGap <= 0 && weakGap >= 0) return '五维整体与对标均值基本持平'

  const strongText =
    strongGap > 0
      ? `${strongest.label}领先对标 ${strongGap} 分`
      : `${strongest.label}相对最接近对标`

  if (weakGap >= 0) return strongText

  return `${strongText} · ${weakest.label}仍是短板`
})

const constructionTags = computed(() => {
  const major = active.value
  if (!major) return []
  const tags: string[] = []
  if (major.constructionType && major.constructionType !== '无') tags.push(major.constructionType)
  if (major.accreditation) tags.push(major.accreditation)
  return tags
})

const activePeers = computed(() => {
  const major = active.value
  if (!major) return []
  if (peerMode.value === 'finance') {
    return major.financePeerSchools?.length ? major.financePeerSchools : major.peerSchools
  }
  return major.peerSchools ?? []
})

const peerOption = computed<EChartsOption>(() => {
  const peers = [...activePeers.value]
  if (!peers.length) return {}

  const byRank = [...peers].sort((a, b) => a.rank - b.rank)
  const display = [...byRank].reverse()
  const maxRank = Math.max(...display.map((p) => p.rank))
  const scoreOf = (rank: number) => maxRank + 8 - rank

  return {
    animationDuration: 650,
    animationDelay: (idx: number) => idx * 50,
    grid: { left: 2, right: 44, top: 0, bottom: 0, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.45)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
      confine: true,
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        const idx = (items[0] as { dataIndex?: number })?.dataIndex ?? 0
        const peer = display[idx]
        if (!peer) return ''
        const group = peerMode.value === 'finance' ? '财经院校' : '综合院校'
        return `${peer.school}<br/>${group} · 全国第${peer.rank}名`
      },
    },
    xAxis: {
      type: 'value',
      max: scoreOf(Math.min(...display.map((p) => p.rank))) + 2,
      axisLabel: { show: false },
      splitLine: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'category',
      data: display.map((p) => p.school),
      axisLabel: {
        ...AXIS_LABEL,
        color: '#b8e6ff',
        fontSize: Math.max(13, CHART_FONT.axis - 1),
        fontWeight: 600,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: display.map((p) => ({
          value: scoreOf(p.rank),
          itemStyle: {
            borderRadius: [0, 6, 6, 0],
            color: p.isSelf
              ? {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: '#0a6cff' },
                    { offset: 1, color: '#00f2ff' },
                  ],
                }
              : {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: 'rgba(0, 70, 140, 0.45)' },
                    { offset: 1, color: 'rgba(0, 150, 210, 0.55)' },
                  ],
                },
          },
        })),
        barWidth: 17,
        barCategoryGap: '28%',
        label: {
          show: true,
          position: 'right',
          color: '#9fe8ff',
          fontSize: Math.max(13, CHART_FONT.label - 1),
          fontWeight: 800,
          formatter: (p: { dataIndex?: number }) => {
            const peer = display[p.dataIndex ?? 0]
            return peer ? `第${peer.rank}` : ''
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="pro-panorama">
    <template v-if="active && majors.length">
      <div class="pro-panorama__hub">
        <div class="pro-panorama__hub-left">
          <div class="pro-panorama__hub-main">
            <span>学院均排名</span>
            <strong>第{{ ranking?.current ?? '—' }}</strong>
          </div>
          <div class="pro-panorama__hub-meta">
            <span :class="changeClass(ranking?.yoyChange ?? 0)">
              同比 {{ formatChange(ranking?.yoyChange ?? 0) }}
            </span>
            <i />
            <span>省内 第{{ ranking?.provincial ?? '—' }}</span>
            <i />
            <span>财经类 第{{ ranking?.peer ?? '—' }}</span>
          </div>
        </div>

        <div
          class="pro-panorama__tabs-wrap"
          :class="{ 'is-paused': tabsPaused }"
          @mouseenter="tabsPaused = true"
          @mouseleave="tabsPaused = false"
        >
          <div class="pro-panorama__tabs" role="tablist" aria-label="专业切换">
            <button
              v-for="(major, index) in majors"
              :key="major.name"
              type="button"
              role="tab"
              class="pro-panorama__tab"
              :class="{ 'is-active': index === activeIndex }"
              :aria-selected="index === activeIndex"
              @click.stop="onTabSelect(index)"
            >
              <em :class="gradeClass(major.grade)">{{ major.grade }}</em>
              <span>{{ shortName(major.name) }}</span>
            </button>
          </div>
          <div v-if="majors.length > 1" class="pro-panorama__tabs-progress-wrap" aria-hidden="true">
            <span class="pro-panorama__tabs-progress" :style="{ width: `${tabProgress}%` }" />
          </div>
        </div>
      </div>

      <div class="pro-panorama__body">
        <button type="button" class="pro-panorama__focus" @click="openDisciplineDetail">
          <header class="pro-panorama__focus-head">
            <h3>{{ active.name }}</h3>
            <em class="pro-panorama__badge" :class="gradeClass(active.grade)">{{ active.grade }}级</em>
          </header>

          <div class="pro-panorama__hero">
            <div class="pro-panorama__hero-num">
              <span>全国排名</span>
              <strong><small>第</small>{{ active.nationalRank }}</strong>
            </div>
            <div class="pro-panorama__hero-side">
              <div class="pro-panorama__hero-change" :class="changeClass(active.yoyChange)">
                较上年 {{ formatChange(active.yoyChange) }}
              </div>
              <div class="pro-panorama__hero-ranks">
                省内第{{ active.provincialRank }} · 财经类第{{ active.financePeerRank }}
              </div>
            </div>
          </div>

          <div v-if="constructionTags.length" class="pro-panorama__tags">
            <span v-for="tag in constructionTags" :key="tag">{{ tag }}</span>
          </div>

          <div class="pro-panorama__soft">
            <div
              v-for="dim in softDimensions"
              :key="dim.key"
              class="pro-panorama__soft-row"
              :class="`tone--${softDimensionTone(dim)}`"
            >
              <div class="pro-panorama__soft-meta">
                <span class="pro-panorama__soft-label">{{ dim.label }}</span>
                <span class="pro-panorama__soft-score">
                  {{ dim.score }}
                  <small>/ {{ dim.peerAverage }}</small>
                  <em>{{ softDimensionGap(dim) }}</em>
                </span>
              </div>
              <div class="pro-panorama__soft-bar">
                <b :style="{ width: `${dim.score}%` }" />
                <i class="pro-panorama__soft-peer" :style="{ left: `${dim.peerAverage}%` }" />
              </div>
            </div>
          </div>

          <p v-if="softInsight" class="pro-panorama__insight">{{ softInsight }}</p>
        </button>

        <div class="pro-panorama__chart">
          <div class="pro-panorama__chart-head">
            <strong>对比院校 · 专业对比</strong>
            <div class="pro-panorama__switch" role="tablist" aria-label="对比院校类型">
              <button
                type="button"
                role="tab"
                class="pro-panorama__switch-btn"
                :class="{ 'is-active': peerMode === 'regional' }"
                :aria-selected="peerMode === 'regional'"
                @click.stop="peerMode = 'regional'"
              >
                综合院校
              </button>
              <button
                type="button"
                role="tab"
                class="pro-panorama__switch-btn"
                :class="{ 'is-active': peerMode === 'finance' }"
                :aria-selected="peerMode === 'finance'"
                @click.stop="peerMode = 'finance'"
              >
                财经院校
              </button>
            </div>
          </div>

          <div class="pro-panorama__chart-body">
            <ChartContainer :option="peerOption" :key="`${active.name}-${peerMode}`" />
          </div>
        </div>
      </div>
    </template>

    <div v-else class="pro-panorama__empty">专业发展数据暂不可用</div>
  </div>
</template>

<style scoped lang="scss">
.pro-panorama {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.pro-panorama__hub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 2px 2px 8px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.12);
}

.pro-panorama__hub-left {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 12px 16px;
  min-width: 0;
  flex: 1 1 auto;
}

.pro-panorama__hub-main {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-shrink: 0;

  span {
    color: #8ec8e8;
    font-size: 14px;
    font-weight: 650;
    letter-spacing: 0.06em;
  }

  strong {
    color: #9ef6ff;
    font-size: clamp(26px, 1.7vw, 32px);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }
}

.pro-panorama__hub-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  min-width: 0;
  color: #a8d4ec;
  font-size: 14px;
  font-weight: 650;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;

  i {
    width: 1px;
    height: 12px;
    background: rgba(0, 200, 255, 0.22);
  }

  .is-up {
    color: #63ffe1;
  }

  .is-down {
    color: #ff8f8f;
  }
}

.pro-panorama__tabs-wrap {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  min-width: 0;
  gap: 0;

  &.is-paused .pro-panorama__tabs-progress {
    opacity: 0.72;
  }
}

.pro-panorama__tabs {
  display: flex;
  flex-shrink: 0;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;
}

.pro-panorama__tabs-progress-wrap {
  position: relative;
  height: 3px;
  margin-top: 3px;
  border-radius: 0 0 4px 4px;
  background: rgba(0, 140, 200, 0.18);
  overflow: hidden;
}

.pro-panorama__tabs-progress {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 0;
  border-radius: 0 2px 2px 0;
  background: linear-gradient(90deg, #2ec8ff, #9ef6ff);
  box-shadow: 0 0 8px rgba(62, 200, 255, 0.7);
  pointer-events: none;
}

.pro-panorama__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 7px 14px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #9ecae8;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;

  span {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.2;
  }

  em {
    flex-shrink: 0;
    padding: 1px 6px;
    border-radius: 4px;
    font-style: normal;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.3;
    border: 1px solid transparent;
  }

  &:hover {
    color: #e8f8ff;
    background: rgba(0, 100, 180, 0.16);
  }

  &.is-active {
    color: #eef9ff;
    background: rgba(0, 120, 210, 0.24);
    border-color: rgba(0, 230, 255, 0.32);
  }
}

.grade--A {
  color: #ffe29a;
  background: rgba(255, 200, 80, 0.14);
  border-color: rgba(255, 213, 106, 0.4) !important;
}

.grade--Bplus {
  color: #9fe8ff;
  background: rgba(0, 160, 220, 0.14);
  border-color: rgba(100, 210, 255, 0.35) !important;
}

.grade--B {
  color: #8ed4f0;
  background: rgba(60, 140, 200, 0.14);
  border-color: rgba(100, 180, 220, 0.3) !important;
}

.pro-panorama__body {
  display: grid;
  grid-template-columns: minmax(0, 0.88fr) minmax(0, 1.12fr);
  gap: 12px;
  min-height: 0;
  height: 100%;
}

.pro-panorama__focus {
  display: grid;
  grid-template-rows: auto auto auto minmax(0, 1fr) auto;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  border-radius: 8px;
  background: rgba(0, 45, 95, 0.22);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.36);
    background: rgba(0, 60, 120, 0.26);

    .pro-panorama__hero-num strong {
      color: #c8fbff;
    }
  }

  &:active {
    transform: scale(0.995);
  }
}

.pro-panorama__focus-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;

  h3 {
    margin: 0;
    color: #eef9ff;
    font-size: clamp(20px, 1.35vw, 24px);
    font-weight: 800;
    line-height: 1.3;
    text-wrap: balance;
  }
}

.pro-panorama__badge {
  flex-shrink: 0;
  padding: 3px 10px;
  border-radius: 5px;
  font-style: normal;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  border: 1px solid transparent;
}

.pro-panorama__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 10px;
}

.pro-panorama__hero-num {
  display: flex;
  flex-direction: column;
  gap: 4px;

  span {
    color: #8ec8e8;
    font-size: 15px;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  strong {
    color: #9ef6ff;
    font-size: clamp(36px, 2.5vw, 46px);
    font-weight: 900;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 18px rgba(0, 230, 255, 0.32);
    transition: color 0.2s;

    small {
      margin-right: 4px;
      color: #7fdfff;
      font-size: 0.36em;
      font-weight: 700;
    }
  }
}

.pro-panorama__hero-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  min-width: 0;
}

.pro-panorama__hero-change {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;

  &.is-up {
    color: #63ffe1;
  }

  &.is-down {
    color: #ff8f8f;
  }

  &.is-flat {
    color: #b8dff5;
  }
}

.pro-panorama__hero-ranks {
  color: #8ec8e8;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.3;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.pro-panorama__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    padding: 2px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: rgba(0, 80, 150, 0.18);
    color: #b8e6ff;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: 0.02em;
  }
}

.pro-panorama__soft {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  min-height: 0;
  height: 100%;
}

.pro-panorama__soft-row {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  flex: 1 1 0;
  min-height: 0;
}

.pro-panorama__soft-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.pro-panorama__soft-label {
  color: #a8d8f0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
}

.pro-panorama__soft-score {
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  color: #eaf7ff;
  font-size: 15px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;

  small {
    color: #8ec8e8;
    font-size: 0.85em;
    font-weight: 650;
  }

  em {
    font-style: normal;
    font-size: 0.85em;
    font-weight: 700;
  }
}

.pro-panorama__soft-bar {
  position: relative;
  height: 7px;
  border-radius: 3px;
  background: rgba(0, 60, 120, 0.35);
  overflow: hidden;

  b,
  i {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    border-radius: 3px;
  }

  i {
    width: 2px;
    min-width: 2px;
    background: rgba(255, 255, 255, 0.55);
    box-shadow: 0 0 4px rgba(255, 255, 255, 0.4);
    z-index: 2;
    transform: translateX(-1px);
  }

  b {
    z-index: 1;
    transition: width 0.4s ease;
  }
}

.tone--lead {
  .pro-panorama__soft-score em {
    color: #63ffe1;
  }

  .pro-panorama__soft-bar b {
    background: linear-gradient(90deg, rgba(0, 180, 200, 0.7), #00f2ff);
  }
}

.tone--even {
  .pro-panorama__soft-score em {
    color: #ffe29a;
  }

  .pro-panorama__soft-bar b {
    background: linear-gradient(90deg, rgba(200, 160, 40, 0.65), #ffd56a);
  }
}

.tone--warn {
  .pro-panorama__soft-score em {
    color: #ffb86a;
  }

  .pro-panorama__soft-bar b {
    background: linear-gradient(90deg, rgba(220, 120, 30, 0.65), #ff9a3d);
  }
}

.tone--risk {
  .pro-panorama__soft-score em {
    color: #ff8f8f;
  }

  .pro-panorama__soft-bar b {
    background: linear-gradient(90deg, rgba(220, 60, 60, 0.65), #ff6b6b);
  }
}

.pro-panorama__insight {
  margin: 0;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 200, 255, 0.1);
  color: #b8e6ff;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.45;
  letter-spacing: 0.02em;
}

.pro-panorama__chart {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 8px 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  border-radius: 8px;
  background: rgba(0, 40, 85, 0.2);
}

.pro-panorama__chart-head {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;

  strong {
    color: #c8e8f8;
    font-size: 17px;
    font-weight: 750;
    letter-spacing: 0.04em;
    line-height: 1.2;
    white-space: nowrap;
  }
}

.pro-panorama__switch {
  display: inline-flex;
  flex-shrink: 0;
  padding: 2px;
  border-radius: 6px;
  background: rgba(0, 40, 90, 0.45);
  border: 1px solid rgba(0, 200, 255, 0.16);
}

.pro-panorama__switch-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ecae8;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
  cursor: pointer;
  transition: color 0.18s, background 0.18s;

  &:hover {
    color: #e8f8ff;
  }

  &.is-active {
    color: #041428;
    background: linear-gradient(90deg, #3ec8ff, #7ff0ff);
  }
}

.pro-panorama__chart-body {
  min-height: 0;
  height: 100%;

  :deep(.chart-container) {
    width: 100%;
    height: 100%;
    min-height: 0;
  }
}

.pro-panorama__empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: rgba(174, 198, 230, 0.55);
  font-size: 16px;
}
</style>
