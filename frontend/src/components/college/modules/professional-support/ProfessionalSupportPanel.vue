<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineOverviewVM } from '@/types/college/view/discipline-overview'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  discipline: DisciplineOverviewVM | null
}>()

const activeIndex = ref(0)

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

const majors = computed(() => props.discipline?.majors ?? [])
const active = computed(() => majors.value[activeIndex.value] ?? null)
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
  openCollegeDetail({ kind: 'discipline-detail' })
}

const peerOption = computed<EChartsOption>(() => {
  const peers = [...(active.value?.peerSchools ?? [])]
  if (!peers.length) return {}

  // 名次升序：越好越在上；category 数组末项在顶部
  const byRank = [...peers].sort((a, b) => a.rank - b.rank)
  const display = [...byRank].reverse() // 最差在底、最好在顶
  const maxRank = Math.max(...display.map((p) => p.rank))
  const scoreOf = (rank: number) => maxRank + 8 - rank

  return {
    animationDuration: 700,
    animationDelay: (idx: number) => idx * 60,
    grid: { left: 4, right: 44, top: 4, bottom: 4, containLabel: true },
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
        return `${peer.school}<br/>全国排名：第${peer.rank}名`
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
        fontSize: CHART_FONT.axis - 2,
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
                    { offset: 0, color: 'rgba(0, 80, 160, 0.45)' },
                    { offset: 1, color: 'rgba(0, 160, 220, 0.55)' },
                  ],
                },
          },
        })),
        barWidth: 12,
        label: {
          show: true,
          position: 'right',
          color: '#9fe8ff',
          fontSize: CHART_FONT.label - 2,
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
        <div class="pro-panorama__hub-item is-main">
          <span>学院均排名</span>
          <strong>第{{ ranking?.current ?? '—' }}</strong>
        </div>
        <div class="pro-panorama__hub-item" :class="changeClass(ranking?.yoyChange ?? 0)">
          <span>同比</span>
          <strong>{{ formatChange(ranking?.yoyChange ?? 0) }}</strong>
        </div>
        <div class="pro-panorama__hub-item">
          <span>省内</span>
          <strong>第{{ ranking?.provincial ?? '—' }}</strong>
        </div>
        <div class="pro-panorama__hub-item">
          <span>财经类</span>
          <strong>第{{ ranking?.peer ?? '—' }}</strong>
        </div>
      </div>

      <div class="pro-panorama__tabs" role="tablist" aria-label="专业切换">
        <button
          v-for="(major, index) in majors"
          :key="major.name"
          type="button"
          role="tab"
          class="pro-panorama__tab"
          :class="{ 'is-active': index === activeIndex }"
          :aria-selected="index === activeIndex"
          @click.stop="activeIndex = index"
        >
          <em :class="gradeClass(major.grade)">{{ major.grade }}</em>
          <span>{{ shortName(major.name) }}</span>
        </button>
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
            <div class="pro-panorama__hero-change" :class="changeClass(active.yoyChange)">
              较上年 {{ formatChange(active.yoyChange) }}
            </div>
          </div>

          <div class="pro-panorama__kpis">
            <div>
              <span>省内</span>
              <strong>第{{ active.provincialRank }}</strong>
            </div>
            <div>
              <span>财经类</span>
              <strong>第{{ active.financePeerRank }}</strong>
            </div>
            <div>
              <span>在校生</span>
              <strong>{{ active.studentCount }}<small>人</small></strong>
            </div>
            <div>
              <span>去向落实</span>
              <strong>{{ active.employmentRate }}<small>%</small></strong>
            </div>
          </div>
        </button>

        <div class="pro-panorama__chart">
          <div class="pro-panorama__chart-head">
            <strong>对比院校 · 专业对比</strong>
          </div>
          <div class="pro-panorama__chart-body">
            <ChartContainer :option="peerOption" />
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
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 14px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.pro-panorama__hub {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  padding: 4px 0 2px;
}

.pro-panorama__hub-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding: 0 8px;
  border-right: 1px solid rgba(0, 200, 255, 0.12);

  &:last-child {
    border-right: none;
  }

  span {
    color: #8ec8e8;
    font-size: 20px;
    font-weight: 600;
    line-height: 1.2;
  }

  strong {
    color: #eaf7ff;
    font-size: clamp(24px, 1.5vw, 30px);
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  &.is-main strong {
    color: #9ef6ff;
  }

  &.is-up strong {
    color: #63ffe1;
  }

  &.is-down strong {
    color: #ff8f8f;
  }
}

.pro-panorama__tabs {
  display: flex;
  gap: 10px;
}

.pro-panorama__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 8px 14px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #9ecae8;
  cursor: pointer;
  transition: color 0.2s, background 0.2s;

  span {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
  }

  em {
    flex-shrink: 0;
    padding: 1px 8px;
    border-radius: 999px;
    font-style: normal;
    font-size: 18px;
    font-weight: 800;
    line-height: 1.3;
    border: 1px solid transparent;
  }

  &:hover {
    color: #e8f8ff;
    background: rgba(0, 120, 200, 0.18);
  }

  &.is-active {
    color: #eef9ff;
    background: rgba(0, 140, 230, 0.28);
    box-shadow: inset 0 0 0 1px rgba(0, 242, 255, 0.35);
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
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
  min-height: 0;
  height: 100%;
}

.pro-panorama__focus {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 8px 4px 4px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover .pro-panorama__hero-num strong {
    color: #c8fbff;
  }
}

.pro-panorama__focus-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;

  h3 {
    margin: 0;
    color: #eef9ff;
    font-size: clamp(24px, 1.5vw, 30px);
    font-weight: 800;
    line-height: 1.3;
    text-wrap: balance;
  }
}

.pro-panorama__badge {
  flex-shrink: 0;
  padding: 4px 12px;
  border-radius: 999px;
  font-style: normal;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.3;
}

.pro-panorama__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 0;
}

.pro-panorama__hero-num {
  display: flex;
  flex-direction: column;
  gap: 6px;

  span {
    color: #8ec8e8;
    font-size: 20px;
    font-weight: 600;
  }

  strong {
    color: #9ef6ff;
    font-size: clamp(44px, 3.2vw, 58px);
    font-weight: 900;
    line-height: 0.95;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 0 22px rgba(0, 230, 255, 0.35);
    transition: color 0.2s;

    small {
      margin-right: 6px;
      color: #7fdfff;
      font-size: 0.36em;
      font-weight: 700;
    }
  }
}

.pro-panorama__hero-change {
  padding: 8px 0;
  font-size: 22px;
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

.pro-panorama__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px 18px;
  margin-top: auto;
  padding-top: 8px;

  div {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    span {
      color: #8ec8e8;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.2;
    }

    strong {
      color: #eaf7ff;
      font-size: clamp(24px, 1.4vw, 28px);
      font-weight: 800;
      line-height: 1.15;
      font-variant-numeric: tabular-nums;

      small {
        margin-left: 2px;
        color: #9ecae8;
        font-size: 0.5em;
        font-weight: 600;
      }
    }
  }
}

.pro-panorama__chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 4px 2px 2px;
}

.pro-panorama__chart-head {
  display: flex;
  flex-shrink: 0;

  strong {
    color: #c8e8f8;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.04em;
    line-height: 1.2;
  }
}

.pro-panorama__chart-body {
  flex: 1 1 0;
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
  font-size: 20px;
}
</style>
