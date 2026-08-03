<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineNum } from '@/types/college/api/discipline-overview'
import type { DisciplineOverviewVM } from '@/types/college/view/discipline-overview'
import { fmtFacultyNum, isMissingMark } from '@/utils/facultyDisplay'
import type { EChartsOption } from 'echarts'

type PeerMode = 'regional' | 'finance'

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
    // 有真实在校生数时按规模优先，否则保持首项
    const list = props.discipline!.majors
    const best = list.reduce((bestIdx, m, i, arr) => {
      const a = typeof m.studentCount === 'number' ? m.studentCount : -1
      const b = typeof arr[bestIdx].studentCount === 'number' ? arr[bestIdx].studentCount : -1
      return a > b ? i : bestIdx
    }, 0)
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
function fmtNum(v: DisciplineNum | string | null | undefined) {
  return fmtFacultyNum(v as never)
}

function formatChange(change: DisciplineNum | undefined) {
  if (isMissingMark(change)) return '**'
  if (typeof change !== 'number') return '**'
  if (change > 0) return `↑${change}位`
  if (change < 0) return `↓${Math.abs(change)}位`
  return '持平'
}

function changeClass(change: DisciplineNum | undefined) {
  if (isMissingMark(change) || typeof change !== 'number') return 'is-flat'
  if (change > 0) return 'is-up'
  if (change < 0) return 'is-down'
  return 'is-flat'
}

function gradeClass(grade: string) {
  if (!grade || isMissingMark(grade)) return 'grade--missing'
  return `grade--${grade.replace('+', 'plus')}`
}

function shortName(name: string) {
  if (name.includes('计算机')) return '计科'
  if (name.includes('软件')) return '软工'
  if (name.includes('人工')) return '人工智能'
  if (name.includes('数据')) return '大数据'
  if (name.includes('网络') || name.includes('安全')) return '网安'
  return name.slice(0, 4)
}

function openDisciplineDetail() {
  router.push(ROUTES.college.disciplineDetail)
}

/** 优先本专业多年名次；不足两年时回退学院中位数趋势 */
const trendSeries = computed(() => {
  const major = active.value
  const majorYears = major?.rankTrend?.years ?? []
  const majorRanks = major?.rankTrend?.ranks ?? []
  if (majorYears.length >= 2 && majorRanks.length >= 2) {
    return {
      years: majorYears,
      ranks: majorRanks,
      peerAvgRanks: [] as number[],
      scope: 'major' as const,
      title: '名次走势',
    }
  }
  const t = props.discipline?.trend
  if (t?.years?.length && t.years.length >= 2 && t.ranks?.length) {
    const peer = (t.peerAvgRanks ?? []).filter((v): v is number => typeof v === 'number')
    return {
      years: t.years.map(String),
      ranks: t.ranks.map((v) => (typeof v === 'number' ? v : Number.NaN)),
      peerAvgRanks: peer.length === t.years.length ? peer : [],
      scope: 'college' as const,
      title: '学院中位走势',
    }
  }
  return null
})

/** 走势短注：放在图表标题旁，避免底部再堆长句 */
const trendNote = computed(() => {
  const series = trendSeries.value
  if (!series) return ''
  const ranks = series.ranks.filter((v): v is number => Number.isFinite(v))
  if (ranks.length < 2) return ''
  const first = ranks[0]
  const last = ranks[ranks.length - 1]
  const delta = first - last
  if (delta > 0) return `${first}→${last} · ↑${delta}`
  if (delta < 0) return `${first}→${last} · ↓${Math.abs(delta)}`
  return `${last} · 持平`
})

const noTrendMessage = computed(() => {
  if (active.value && isMissingMark(active.value.nationalRank)) {
    return '本校未进入软科公开发布榜，暂无排名走势'
  }
  return '多年排名快照不足'
})

const trendOption = computed<EChartsOption>(() => {
  const series = trendSeries.value
  if (!series) return {}

  const ranks = series.ranks.map((v) => (Number.isFinite(v) ? v : null))
  const peers = series.peerAvgRanks
  const values = ranks.filter((v): v is number => v != null)
  const peerVals = peers.filter((v) => Number.isFinite(v))
  const all = [...values, ...peerVals]
  if (!all.length) return {}

  const minR = Math.min(...all)
  const maxR = Math.max(...all)
  const pad = Math.max(4, Math.round((maxR - minR) * 0.15) || 8)

  const lineSeries: EChartsOption['series'] = [
    {
      name: series.scope === 'major' ? '本专业' : '学院中位',
      type: 'line',
      data: ranks,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 2.5, color: '#4de0ff' },
      itemStyle: { color: '#7ff0ff' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(77, 224, 255, 0.28)' },
            { offset: 1, color: 'rgba(77, 224, 255, 0.02)' },
          ],
        },
      },
    },
  ]
  if (peers.length === series.years.length) {
    lineSeries.push({
      name: '对标均值',
      type: 'line',
      data: peers,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2, color: '#ffd56a', type: 'dashed' },
      itemStyle: { color: '#ffe29a' },
    })
  }

  return {
    animationDuration: 550,
    grid: { left: 8, right: 10, top: 28, bottom: 4, containLabel: true },
    legend: {
      show: (lineSeries?.length ?? 0) > 1,
      top: 0,
      right: 0,
      textStyle: { color: '#9ecae8', fontSize: 14 },
      itemWidth: 16,
      itemHeight: 9,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.45)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        const head = (items[0] as { axisValue?: string })?.axisValue ?? ''
        const lines = items
          .map((p) => {
            const row = p as { marker?: string; seriesName?: string; data?: number | null }
            if (row.data == null || Number.isNaN(row.data)) return ''
            return `${row.marker ?? ''}${row.seriesName} 第${row.data}`
          })
          .filter(Boolean)
        return `${head}<br/>${lines.join('<br/>')}`
      },
    },
    xAxis: {
      type: 'category',
      data: series.years,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, color: '#b8e6ff', fontSize: 15 },
      axisLine: { lineStyle: { color: 'rgba(0, 200, 255, 0.25)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      inverse: true,
      min: Math.max(1, minR - pad),
      max: maxR + pad,
      axisLabel: {
        ...AXIS_LABEL,
        color: '#b8e6ff',
        fontSize: 15,
        formatter: (v: number) => `${v}`,
      },
      splitLine: { lineStyle: { color: 'rgba(0, 200, 255, 0.1)', type: 'dashed' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: lineSeries,
  }
})

const activePeers = computed(() => {
  const major = active.value
  if (!major) return []
  const list =
    peerMode.value === 'finance'
      ? major.financePeerSchools?.length
        ? major.financePeerSchools
        : major.peerSchools
      : major.peerSchools ?? []
  return list.filter((p) => typeof p.rank === 'number' && Number.isFinite(p.rank))
})

const peerOption = computed<EChartsOption>(() => {
  const peers = [...activePeers.value]
  if (!peers.length) return {}

  const byRank = [...peers].sort((a, b) => Number(a.rank) - Number(b.rank))
  const display = [...byRank].reverse()
  const maxRank = Math.max(...display.map((p) => Number(p.rank)))
  const scoreOf = (rank: number) => maxRank + 8 - rank

  return {
    animationDuration: 650,
    animationDelay: (idx: number) => idx * 50,
    grid: { left: 2, right: 44, top: 0, bottom: 0, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
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
      max: scoreOf(Math.min(...display.map((p) => Number(p.rank)))) + 2,
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
        fontSize: Math.max(16, CHART_FONT.axis - 1),
        fontWeight: 600,
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: display.map((p) => ({
          value: scoreOf(Number(p.rank)),
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
        barWidth: 18,
        barCategoryGap: '28%',
        label: {
          show: true,
          position: 'right',
          color: '#9fe8ff',
          fontSize: Math.max(15, CHART_FONT.label - 2),
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
        <div class="pro-panorama__hub-meta">
          <span :class="changeClass(active.yoyChange)">
            同比 {{ formatChange(active.yoyChange) }}
          </span>
          <i />
          <span>省内 第{{ fmtNum(active.provincialRank) }}</span>
          <i />
          <span>财经类 第{{ fmtNum(active.financePeerRank) }}</span>
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
            <em class="pro-panorama__badge" :class="gradeClass(active.grade)">
              {{ isMissingMark(active.grade) ? '**' : `${active.grade}级` }}
            </em>
          </header>

          <div class="pro-panorama__hero">
            <div class="pro-panorama__hero-num">
              <span>全国排名</span>
              <strong><small>第</small>{{ fmtNum(active.nationalRank) }}</strong>
            </div>
            <div class="pro-panorama__stats">
              <div class="pro-panorama__stat">
                <span>在校</span>
                <strong>{{ fmtNum(active.studentCount) }}</strong>
              </div>
              <div class="pro-panorama__stat">
                <span>落实率</span>
                <strong>{{ fmtNum(active.employmentRate) }}<small>%</small></strong>
              </div>
              <div class="pro-panorama__stat">
                <span>均分</span>
                <strong>{{ fmtNum(active.avgScore) }}</strong>
              </div>
            </div>
          </div>

          <div v-if="trendSeries" class="pro-panorama__trend" @click.stop>
            <div class="pro-panorama__trend-head">
              <strong>{{ trendSeries.title }}</strong>
              <em v-if="trendNote">{{ trendNote }}</em>
            </div>
            <div class="pro-panorama__trend-chart">
              <ChartContainer
                :option="trendOption"
                :key="`trend-${active.name}-${trendSeries.scope}`"
              />
            </div>
          </div>
          <p v-else class="pro-panorama__insight">{{ noTrendMessage }}</p>
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
            <ChartContainer
              v-if="activePeers.length"
              :option="peerOption"
              :key="`${active.name}-${peerMode}`"
            />
            <div v-else class="pro-panorama__empty" style="min-height:160px;display:grid;place-items:center;">
              对标院校排名缺源
            </div>
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

.pro-panorama__hub-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  min-width: 0;
  flex: 1 1 auto;
  color: #cfe8f8;
  font-size: 18px;
  font-weight: 650;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;

  i {
    width: 1px;
    height: 14px;
    background: rgba(0, 200, 255, 0.28);
  }

  .is-up {
    color: #63ffe1;
  }

  .is-down {
    color: #ff8f8f;
  }

  .is-flat {
    color: #a8d4ec;
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
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: #9ecae8;
  cursor: pointer;
  transition: color 0.2s, background 0.2s, border-color 0.2s;

  span {
    font-size: 19px;
    font-weight: 700;
    line-height: 1.2;
  }

  em {
    flex-shrink: 0;
    padding: 2px 7px;
    border-radius: 4px;
    font-style: normal;
    font-size: 15px;
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

.grade--missing {
  color: #9ecae8;
  background: rgba(30, 60, 90, 0.35);
  border-color: rgba(158, 202, 232, 0.35) !important;
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
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 10px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 10px 12px;
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

.pro-panorama__trend {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 4px;
  min-height: 0;
  min-width: 0;
  height: 100%;
  padding: 6px 8px 4px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.12);
  background: rgba(0, 35, 75, 0.22);
}

.pro-panorama__trend-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;

  strong {
    color: #cfefff;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  em {
    flex-shrink: 0;
    color: rgba(158, 202, 232, 0.85);
    font-style: normal;
    font-size: 13px;
    font-weight: 650;
    font-variant-numeric: tabular-nums;
  }
}

.pro-panorama__trend-chart {
  min-height: 0;
  height: 100%;
  min-width: 0;
}

.pro-panorama__focus-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  h3 {
    margin: 0;
    color: #eef9ff;
    font-size: clamp(18px, 1.2vw, 22px);
    font-weight: 800;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
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
  gap: 12px;
  min-width: 0;
}

.pro-panorama__hero-num {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;

  span {
    color: #8ec8e8;
    font-size: 13px;
    font-weight: 650;
    letter-spacing: 0.04em;
  }

  strong {
    color: #9ef6ff;
    font-size: clamp(36px, 2.4vw, 46px);
    font-weight: 900;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 18px rgba(0, 230, 255, 0.32);
    transition: color 0.2s;

    small {
      margin-right: 3px;
      color: #7fdfff;
      font-size: 0.36em;
      font-weight: 700;
    }
  }
}

.pro-panorama__stats {
  display: flex;
  flex: 1 1 auto;
  align-items: stretch;
  justify-content: flex-end;
  gap: 0;
  min-width: 0;
  max-width: 220px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.12);
  background: rgba(0, 50, 100, 0.2);
  overflow: hidden;
}

.pro-panorama__stat {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 0;
  padding: 6px 4px;
  text-align: center;

  & + & {
    border-left: 1px solid rgba(0, 200, 255, 0.12);
  }

  span {
    color: #8ec8e8;
    font-size: 11px;
    font-weight: 650;
    letter-spacing: 0.02em;
    line-height: 1.1;
    white-space: nowrap;
  }

  strong {
    color: #eaf7ff;
    font-size: 16px;
    font-weight: 800;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;

    small {
      margin-left: 1px;
      color: #9ecae8;
      font-size: 10px;
      font-weight: 650;
    }
  }
}

.pro-panorama__insight {
  margin: 0;
  color: rgba(184, 230, 255, 0.75);
  font-size: 14px;
  font-weight: 650;
  line-height: 1.4;
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
    font-size: 19px;
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
  padding: 5px 12px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ecae8;
  font-size: 16px;
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
  color: rgba(174, 198, 230, 0.6);
  font-size: 18px;
  font-weight: 650;
}
</style>
