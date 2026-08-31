<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import AnalysisInsightPanel from '@/components/ai/AnalysisInsightPanel.vue'
import {
  BENCHMARK_PILLAR_META,
  buildHeroKpis,
  buildSwotBoard,
  collectPillarEvidence,
  refinePartyPillar,
} from '@/api/college/adapters/benchmark-pillars'
import { useAgentAnalysis } from '@/composables/useAgentAnalysis'
import { useScope } from '@/composables/useScope'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import {
  buildBenchmarkOverviewRuleAnalysis,
  toOverviewGauges,
  type BenchmarkOverviewSnapshot,
} from '@/utils/agent/benchmark-overview-insights'
import type { AgentAnalyzeContextDTO } from '@/types/agent/api'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkAchievementsDetailVM,
  BenchmarkFeaturedVM,
} from '@/types/college/view/benchmark-achievements'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: BenchmarkAchievementsDetailVM
  featured: BenchmarkFeaturedVM | null
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()

const { collegeScope } = useScope()

const pillars = computed(() =>
  props.data.pillars.map((pillar) => {
    const count = collectPillarEvidence(pillar.key, props.data.achievements, props.featured).length
    return refinePartyPillar(pillar, count)
  }),
)

const heroes = computed(() => buildHeroKpis(pillars.value))
const weakBoard = computed(() => buildSwotBoard(pillars.value, 'weaknesses'))
const strengthBoard = computed(() => buildSwotBoard(pillars.value, 'strengths'))

const evidenceCounts = computed(() =>
  BENCHMARK_PILLAR_META.map((meta) => ({
    key: meta.key,
    label: meta.label,
    count: collectPillarEvidence(meta.key, props.data.achievements, props.featured).length,
  })),
)

const snapshot = computed<BenchmarkOverviewSnapshot>(() => ({
  headline: weakBoard.value.headline,
  heroes: heroes.value,
  gauges: toOverviewGauges(weakBoard.value.items),
  summary: { ...weakBoard.value.summary },
  byLevel: (props.data.byLevel ?? []).slice(0, 8),
  evidenceCounts: evidenceCounts.value,
}))

const stableSnapshot = ref<BenchmarkOverviewSnapshot>(snapshot.value)
let snapshotFp = ''

watch(
  snapshot,
  (next) => {
    const fp = JSON.stringify({
      gauges: next.gauges,
      heroes: next.heroes,
      summary: next.summary,
      evidenceCounts: next.evidenceCounts,
    })
    if (fp === snapshotFp) return
    snapshotFp = fp
    stableSnapshot.value = next
  },
  { immediate: true },
)

const agentContext = computed<AgentAnalyzeContextDTO | null>(() => ({
  scope: 'college',
  page: 'college-benchmark-overview',
  collegeId: collegeScope.value.collegeId,
  summarySnapshot: stableSnapshot.value as unknown as Record<string, unknown>,
}))

const {
  analysis: agentAnalysis,
  loading: agentLoading,
  error: agentError,
  refresh: refreshAgentAnalysis,
  run: runAgentAnalysis,
} = useAgentAnalysis(agentContext, { auto: true, force: true })

const displayAnalysis = computed(
  () => agentAnalysis.value ?? buildBenchmarkOverviewRuleAnalysis(snapshot.value),
)

const tooltip = {
  backgroundColor: 'rgba(2,14,38,0.94)',
  borderColor: 'rgba(0,242,255,0.5)',
  textStyle: { color: '#f4fbff', fontSize: 17 },
}

const radarOption = computed<EChartsOption>(() => {
  const items = weakBoard.value.items
  return {
    tooltip,
    radar: {
      indicator: items.map((item) => ({ name: item.shortLabel || item.label, max: 100 })),
      axisName: { color: '#8fb4cc', fontSize: CHART_FONT.legend },
      splitLine: { lineStyle: { color: 'rgba(160, 214, 236, 0.16)' } },
      splitArea: { areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'transparent'] } },
      axisLine: { lineStyle: { color: 'rgba(160, 214, 236, 0.22)' } },
    },
    series: [
      {
        type: 'radar',
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { color: '#7ad8ee', width: 2 },
        itemStyle: { color: '#7ad8ee' },
        areaStyle: { color: 'rgba(122, 216, 238, 0.22)' },
        data: [
          {
            name: '完成度',
            value: items.map((item) => Math.round(Math.min(1.2, item.ratio) * 100)),
          },
        ],
      },
    ],
  }
})

const gapBarOption = computed<EChartsOption>(() => {
  const items = weakBoard.value.items
  return {
    tooltip: {
      ...tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = items[(row as { dataIndex?: number }).dataIndex ?? 0]
        if (!item) return ''
        return `${item.label} · ${item.metricLabel}<br/>当前 ${item.value}${item.unit} / 门槛 ${item.target}${item.unit}`
      },
    },
    grid: { left: 8, right: 16, top: 28, bottom: 8, containLabel: true },
    legend: { top: 0, textStyle: { color: '#8fb4cc', fontSize: CHART_FONT.legend } },
    xAxis: {
      type: 'category',
      data: items.map((item) => item.shortLabel || item.label),
      axisLabel: AXIS_LABEL,
      axisLine: { lineStyle: { color: 'rgba(160, 214, 236, 0.16)' } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: 'rgba(160, 214, 236, 0.08)' } },
    },
    series: [
      {
        name: '当前',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: '#7ad8ee' },
        data: items.map((item) => item.value),
      },
      {
        name: '门槛',
        type: 'bar',
        barMaxWidth: 18,
        itemStyle: { color: 'rgba(240, 197, 106, 0.55)' },
        data: items.map((item) => item.target),
      },
    ],
  }
})

const statusPieOption = computed<EChartsOption>(() => {
  const { met, near, gap, empty } = weakBoard.value.summary
  return {
    tooltip: { ...tooltip, trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#8fb4cc', fontSize: CHART_FONT.legend } },
    series: [
      {
        type: 'pie',
        radius: ['42%', '68%'],
        center: ['50%', '44%'],
        label: { color: '#e8f4fc', fontSize: 14, formatter: '{b}\n{c}' },
        data: [
          { name: '达标', value: met, itemStyle: { color: '#34d399' } },
          { name: '接近', value: near, itemStyle: { color: '#7ad8ee' } },
          { name: '缺口', value: gap, itemStyle: { color: '#f0c56a' } },
          { name: '不足', value: empty, itemStyle: { color: '#8fb4cc' } },
        ],
      },
    ],
  }
})

const levelPieOption = computed<EChartsOption>(() => {
  const rows = (props.data.byLevel ?? []).filter((item) => item.count > 0).slice(0, 6)
  return {
    tooltip: { ...tooltip, trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#8fb4cc', fontSize: 14 } },
    series: [
      {
        type: 'pie',
        radius: ['36%', '64%'],
        center: ['50%', '42%'],
        label: { color: '#e8f4fc', fontSize: 13, formatter: '{b} {c}' },
        data: rows.map((item, index) => ({
          name: item.level || '未分级',
          value: item.count,
          itemStyle: {
            color: ['#7ad8ee', '#f0c56a', '#34d399', '#8b5cf6', '#66d9ff', '#fb923c'][index % 6],
          },
        })),
      },
    ],
  }
})

const volumeBarOption = computed<EChartsOption>(() => {
  const rows = [...evidenceCounts.value].reverse()
  return {
    tooltip: {
      ...tooltip,
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    grid: { left: 8, right: 28, top: 8, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: AXIS_LABEL,
      splitLine: { lineStyle: { color: 'rgba(160, 214, 236, 0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((item) => item.label),
      axisLabel: AXIS_LABEL,
      axisTick: { show: false },
      axisLine: { show: false },
    },
    series: [
      {
        type: 'bar',
        barMaxWidth: 16,
        itemStyle: { color: '#7ad8ee' },
        label: { show: true, position: 'right', color: '#8fb4cc', fontSize: 14 },
        data: rows.map((item) => item.count),
      },
    ],
  }
})

function onRadarClick(params: unknown) {
  const name = (params as { name?: string })?.name
  const hit = weakBoard.value.items.find((item) => item.shortLabel === name || item.label === name)
  if (hit) emit('open', hit.key)
}

function onGapBarClick(params: unknown) {
  const index = (params as { dataIndex?: number }).dataIndex
  const item = weakBoard.value.items[index ?? -1]
  if (item) emit('open', item.key)
}

function onVolumeClick(params: unknown) {
  const name = (params as { name?: string })?.name
  const hit = evidenceCounts.value.find((item) => item.label === name)
  if (hit) emit('open', hit.key as BenchmarkPillarKey)
}
</script>

<template>
  <div class="bm-ov">
    <section class="bm-ov__block">
      <header class="bm-ov__head">
        <p>总览</p>
        <h2>五维对标全景</h2>
      </header>
      <p class="bm-ov__lead">{{ weakBoard.headline }}</p>
      <dl class="bm-ov__heroes">
        <div v-for="item in heroes" :key="item.key">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}<small>{{ item.unit }}</small></dd>
        </div>
        <div>
          <dt>对标达标</dt>
          <dd>{{ weakBoard.summary.met }}<small>项</small></dd>
        </div>
        <div>
          <dt>待补缺口</dt>
          <dd>{{ weakBoard.summary.gap + weakBoard.summary.empty }}<small>项</small></dd>
        </div>
      </dl>
    </section>

    <section class="bm-ov__block">
      <header class="bm-ov__head">
        <p>可视化</p>
        <h2>完成度与门槛对照</h2>
      </header>
      <div class="bm-ov__charts">
        <article>
          <h3>五维完成度</h3>
          <div class="bm-ov__chart">
            <ChartContainer :option="radarOption" @chart-click="onRadarClick" />
          </div>
        </article>
        <article>
          <h3>当前 / 门槛</h3>
          <div class="bm-ov__chart">
            <ChartContainer :option="gapBarOption" @chart-click="onGapBarClick" />
          </div>
        </article>
      </div>
    </section>

    <section class="bm-ov__block">
      <div class="bm-ov__charts bm-ov__charts--3">
        <article>
          <h3>对标结构</h3>
          <div class="bm-ov__chart bm-ov__chart--sm">
            <ChartContainer :option="statusPieOption" />
          </div>
        </article>
        <article>
          <h3>能级分布</h3>
          <div class="bm-ov__chart bm-ov__chart--sm">
            <ChartContainer v-if="data.byLevel?.length" :option="levelPieOption" />
            <p v-else class="bm-ov__empty">暂无能级分层</p>
          </div>
        </article>
        <article>
          <h3>成果体量</h3>
          <div class="bm-ov__chart bm-ov__chart--sm">
            <ChartContainer :option="volumeBarOption" @chart-click="onVolumeClick" />
          </div>
        </article>
      </div>
    </section>

    <section class="bm-ov__block">
      <div class="bm-ov__boards">
        <article>
          <h3>优势支点</h3>
          <ol v-if="strengthBoard.items.some((item) => item.status === 'met')">
            <li
              v-for="item in strengthBoard.items.filter((row) => row.status === 'met')"
              :key="item.key"
            >
              <button type="button" @click="emit('open', item.key)">
                {{ item.label }} · {{ item.metricLabel }} {{ item.value }}{{ item.unit }}
              </button>
            </li>
          </ol>
          <p v-else class="bm-ov__empty">暂无已达标的高光项</p>
        </article>
        <article>
          <h3>短板清单</h3>
          <ol>
            <li
              v-for="item in weakBoard.items.filter((row) => row.status !== 'met')"
              :key="item.key"
            >
              <button type="button" @click="emit('open', item.key)">
                {{ item.label }} · {{ item.metricLabel }} {{ item.value }}/{{ item.target }}{{ item.unit }}
              </button>
            </li>
          </ol>
        </article>
      </div>
    </section>

    <section class="bm-ov__block">
      <AnalysisInsightPanel
        :data="displayAnalysis"
        :loading="agentLoading"
        :error="agentError"
        @refresh="refreshAgentAnalysis"
        @retry="() => runAgentAnalysis(false)"
      />
    </section>
  </div>
</template>

<style scoped lang="scss">
.bm-ov {
  --ink: #e8f4fc;
  --mute: #8fb4cc;
  --line: rgba(160, 214, 236, 0.16);
  --accent: #7ad8ee;
}

.bm-ov__block {
  margin-bottom: 28px;
  padding: 6px 2px 22px;
  border-bottom: 1px solid var(--line);

  &:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
}

.bm-ov__head {
  display: flex;
  align-items: baseline;
  gap: 8px 14px;
  margin-bottom: 12px;

  p {
    margin: 0;
    color: var(--mute);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.24em;
  }

  h2 {
    margin: 0;
    color: var(--ink);
    font-size: 24px;
    font-weight: 700;
  }
}

.bm-ov__lead {
  margin: 0 0 16px;
  max-width: 52em;
  color: var(--mute);
  font-size: 16px;
  line-height: 1.7;
}

.bm-ov__heroes {
  display: flex;
  flex-wrap: wrap;
  margin: 0;
  gap: 0;

  > div {
    flex: 1 1 140px;
    min-width: 0;
    padding: 4px 20px 4px 0;

    + div {
      padding-left: 20px;
      box-shadow: inset 1px 0 0 var(--line);
    }
  }

  dt {
    color: var(--mute);
    font-size: 13px;
    font-weight: 600;
  }

  dd {
    margin: 6px 0 0;
    color: var(--accent);
    font-family: 'Bahnschrift', 'DIN Alternate', ui-monospace, sans-serif;
    font-size: 32px;
    font-weight: 600;
    line-height: 1;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 4px;
      color: var(--mute);
      font-size: 14px;
      font-weight: 500;
    }
  }
}

.bm-ov__charts {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 22px;

  &--3 {
    grid-template-columns: 1fr 1fr 1fr;
  }

  article h3 {
    margin: 0 0 8px;
    color: var(--ink);
    font-size: 16px;
    font-weight: 700;
  }
}

.bm-ov__chart {
  height: 280px;

  &--sm { height: 240px; }
}

.bm-ov__boards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;

  article {
    padding-left: 14px;
    box-shadow: inset 2px 0 0 var(--line);
  }

  h3 {
    margin: 0 0 10px;
    color: var(--ink);
    font-size: 16px;
    font-weight: 700;
  }

  ol {
    margin: 0;
    padding-left: 18px;
  }

  li + li { margin-top: 8px; }

  button {
    padding: 0;
    border: none;
    background: none;
    color: #c9dcec;
    font-size: 16px;
    line-height: 1.6;
    text-align: left;
    cursor: pointer;

    &:hover { color: var(--accent); }
  }
}

.bm-ov__empty {
  margin: 28px 0;
  color: rgba(143, 180, 204, 0.7);
  font-size: 16px;
  text-align: center;
}

@media (max-width: 1100px) {
  .bm-ov__charts,
  .bm-ov__charts--3,
  .bm-ov__boards {
    grid-template-columns: 1fr;
  }
}
</style>
