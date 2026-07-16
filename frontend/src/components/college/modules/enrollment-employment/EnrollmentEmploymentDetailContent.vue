<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { EnrollmentEmploymentFocus } from '@/types/college/api/enrollment-employment'
import type { EnrollmentEmploymentDetailVM } from '@/types/college/view/enrollment-employment'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: EnrollmentEmploymentDetailVM
  focus?: string | null
}>()

type MainTab = 'admission' | 'graduation'
type DistTab = 'industry' | 'region' | 'salary'

const mainTab = ref<MainTab>('admission')
const year = ref('')
const major = ref('')
const distTab = ref<DistTab>('industry')
const showGradSchools = ref(false)

function resolveFocus(focus?: string | null): { tab: MainTab; highlight: EnrollmentEmploymentFocus } {
  switch (focus) {
    case 'admission-scale':
    case 'source-quality':
    case 'admission-trend':
      return { tab: 'admission', highlight: focus }
    case 'exit-quality':
    case 'high-quality-dest':
    case 'employment-trend':
      return { tab: 'graduation', highlight: focus }
    default:
      return { tab: 'admission', highlight: 'overview' }
  }
}

watch(
  () => props.focus,
  (focus) => {
    const resolved = resolveFocus(focus)
    mainTab.value = resolved.tab
    year.value = props.data.filters.years.at(-1) ?? ''
    major.value = props.data.filters.majors[0] ?? '全部专业'
    showGradSchools.value = focus === 'high-quality-dest'
  },
  { immediate: true },
)

watch(mainTab, (tab) => {
  if (tab !== 'graduation') showGradSchools.value = false
})

const highlight = computed(() => resolveFocus(props.focus).highlight)

function delta(curr: number, prev: number) {
  const d = curr - prev
  if (d > 0) return `↑${d}`
  if (d < 0) return `↓${Math.abs(d)}`
  return '→0'
}

const majorShareOption = computed<EChartsOption>(() => {
  const items = props.data.admission.majorShare
  return {
    grid: { left: 8, right: 40, top: 4, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.major.replace('科学与技术', '')),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map((i) => i.ratio),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        formatter: '{c}%',
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#126dff' },
            { offset: 1, color: '#65f7ff' },
          ],
        },
      },
    }],
  }
})

const provinceOption = computed<EChartsOption>(() => {
  const items = [...props.data.admission.sourceStructure.provinces].reverse()
  return {
    grid: { left: 8, right: 36, top: 4, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map((i) => i.count),
      barWidth: 10,
      label: {
        show: true,
        position: 'right',
        color: '#c6e6ff',
        fontSize: CHART_FONT.label,
        formatter: '{c}',
      },
      itemStyle: { color: '#39e6ff', borderRadius: [0, 4, 4, 0] },
    }],
  }
})

const admissionTrendOption = computed<EChartsOption>(() => {
  const t = props.data.admission.yearlyTrend
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: t.years,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: [
      {
        type: 'value',
        name: '人数',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
      },
      {
        type: 'value',
        name: '指数/%',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { show: false },
      },
    ],
    series: [
      { name: '录取人数', type: 'bar', data: t.enrolled, itemStyle: { color: '#1a8cff' } },
      { name: '生源质量指数', type: 'line', yAxisIndex: 1, data: t.qualityIndex, itemStyle: { color: '#39e6ff' } },
      { name: '一志愿率', type: 'line', yAxisIndex: 1, data: t.firstChoiceRate, itemStyle: { color: '#ffd56a' } },
    ],
  }
})

const distItems = computed(() => props.data.graduation.distribution[distTab.value])

const distOption = computed(() => {
  const items = distItems.value
  return {
    grid: { left: 8, right: 40, top: 4, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value' as const,
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => i.name),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map((i) => i.ratio),
      barWidth: 12,
      label: {
        show: true,
        position: 'right' as const,
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        formatter: (p: { dataIndex?: number; value?: unknown }) => {
          const item = items[p.dataIndex ?? 0]
          return `${item?.count ?? ''}人 ${item?.ratio ?? ''}%`
        },
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#126dff' },
            { offset: 1, color: '#65f7ff' },
          ],
        },
      },
    }],
  } as EChartsOption
})

const majorCompareOption = computed<EChartsOption>(() => {
  const items = props.data.graduation.majorCompare
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: items.map((i) => i.major.replace('科学与技术', '')),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [
      { name: '去向落实率', type: 'bar', data: items.map((i) => i.placementRate), itemStyle: { color: '#39e6ff' } },
      { name: '高质量就业率', type: 'bar', data: items.map((i) => i.highQualityRate), itemStyle: { color: '#ffd56a' } },
    ],
  }
})

const employmentTrendOption = computed<EChartsOption>(() => {
  const t = props.data.graduation.yearlyTrend
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, containLabel: true },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: t.years,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [
      { name: '去向落实率', type: 'line', smooth: true, data: t.placementRate, itemStyle: { color: '#39e6ff' } },
      { name: '高质量就业率', type: 'line', smooth: true, data: t.highQualityRate, itemStyle: { color: '#ffd56a' } },
    ],
  }
})

function onDestClick(key: string) {
  if (key === 'domestic-grad') showGradSchools.value = !showGradSchools.value
}
</script>

<template>
  <div class="ee-detail">
    <div class="ee-detail__toolbar">
      <div class="ee-detail__tabs">
        <button
          type="button"
          class="ee-detail__tab"
          :class="{ 'is-active': mainTab === 'admission' }"
          @click="mainTab = 'admission'"
        >
          招生入口分析
        </button>
        <button
          type="button"
          class="ee-detail__tab"
          :class="{ 'is-active': mainTab === 'graduation' }"
          @click="mainTab = 'graduation'"
        >
          毕业出口分析
        </button>
      </div>
      <div class="ee-detail__filters">
        <label>
          年份
          <select v-model="year">
            <option v-for="item in data.filters.years" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          专业
          <select v-model="major">
            <option v-for="item in data.filters.majors" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
      </div>
    </div>

    <template v-if="mainTab === 'admission'">
      <div class="ee-detail__grid">
        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'admission-scale' }">
          <h3>招生规模与吸引力</h3>
          <div class="ee-detail__metrics">
            <div><span>录取人数</span><strong>{{ data.admission.scale.enrolledCount.toLocaleString('zh-CN') }}<small>人</small></strong></div>
            <div><span>一志愿报考率</span><strong>{{ data.admission.scale.firstChoiceRate }}<small>%</small></strong></div>
          </div>
        </section>

        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'source-quality' }">
          <h3>生源质量</h3>
          <div class="ee-detail__metrics ee-detail__metrics--quality">
            <div><span>生源质量指数</span><strong>{{ data.admission.quality.sourceQualityIndex }}</strong></div>
            <div>
              <span>录取均分</span>
              <strong>{{ data.admission.quality.avgScore }}</strong>
              <em>{{ delta(data.admission.quality.avgScore, data.admission.quality.prevAvgScore) }}</em>
            </div>
            <div>
              <span>最低录取分</span>
              <strong>{{ data.admission.quality.minScore }}</strong>
              <em>{{ delta(data.admission.quality.minScore, data.admission.quality.prevMinScore) }}</em>
            </div>
            <div>
              <span>平均录取位次</span>
              <strong>{{ data.admission.quality.avgRank.toLocaleString('zh-CN') }}</strong>
              <em>{{ delta(data.admission.quality.prevAvgRank, data.admission.quality.avgRank) }}</em>
            </div>
          </div>
        </section>

        <section class="ee-detail__card">
          <h3>专业结构</h3>
          <div class="ee-detail__chart">
            <ChartContainer :option="majorShareOption" />
          </div>
        </section>

        <section class="ee-detail__card">
          <h3>生源结构</h3>
          <div class="ee-detail__structure">
            <div class="ee-detail__bars">
              <div class="ee-detail__dual">
                <span>省内外比例</span>
                <div class="ee-detail__dual-track">
                  <i :style="{ width: `${data.admission.sourceStructure.inOutProvince.inProvince}%` }" />
                  <b :style="{ width: `${data.admission.sourceStructure.inOutProvince.outProvince}%` }" />
                </div>
                <em>省内 {{ data.admission.sourceStructure.inOutProvince.inProvince }}% · 省外 {{ data.admission.sourceStructure.inOutProvince.outProvince }}%</em>
              </div>
              <div class="ee-detail__dual">
                <span>男女比例</span>
                <div class="ee-detail__dual-track ee-detail__dual-track--gender">
                  <i :style="{ width: `${data.admission.sourceStructure.gender.male}%` }" />
                  <b :style="{ width: `${data.admission.sourceStructure.gender.female}%` }" />
                </div>
                <em>男 {{ data.admission.sourceStructure.gender.male }}% · 女 {{ data.admission.sourceStructure.gender.female }}%</em>
              </div>
            </div>
            <div class="ee-detail__chart ee-detail__chart--province">
              <ChartContainer :option="provinceOption" />
            </div>
          </div>
        </section>
      </div>

      <section class="ee-detail__card ee-detail__card--wide" :class="{ 'is-focus': highlight === 'admission-trend' }">
        <h3>招生历年趋势</h3>
        <div class="ee-detail__chart ee-detail__chart--trend">
          <ChartContainer :option="admissionTrendOption" />
        </div>
      </section>
    </template>

    <template v-else>
      <div class="ee-detail__grid">
        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'exit-quality' }">
          <h3>出口质量</h3>
          <div class="ee-detail__metrics">
            <div><span>毕业去向落实率</span><strong>{{ data.graduation.exitQuality.placementRate }}<small>%</small></strong></div>
            <div><span>高质量就业率</span><strong>{{ data.graduation.exitQuality.highQualityEmploymentRate }}<small>%</small></strong></div>
          </div>
        </section>

        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'high-quality-dest' }">
          <h3>高质量去向结构</h3>
          <div class="ee-detail__dests">
            <button
              v-for="item in data.graduation.highQualityDest"
              :key="item.key"
              type="button"
              class="ee-detail__dest"
              :class="{ 'is-active': item.key === 'domestic-grad' && showGradSchools }"
              @click="onDestClick(item.key)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}人</strong>
              <em>{{ item.ratio }}%</em>
              <div class="ee-detail__dest-bar"><i :style="{ width: `${item.ratio}%` }" /></div>
            </button>
          </div>
          <div v-if="showGradSchools" class="ee-detail__schools">
            <h4>高质量升学院校</h4>
            <ul>
              <li v-for="item in data.graduation.gradSchools" :key="item.name">
                <span>{{ item.name }}</span>
                <strong>{{ item.count }}人 · {{ item.ratio }}%</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="ee-detail__card">
          <h3>就业分布</h3>
          <div class="ee-detail__subtabs">
            <button type="button" :class="{ 'is-active': distTab === 'industry' }" @click="distTab = 'industry'">行业</button>
            <button type="button" :class="{ 'is-active': distTab === 'region' }" @click="distTab = 'region'">地区</button>
            <button type="button" :class="{ 'is-active': distTab === 'salary' }" @click="distTab = 'salary'">薪资</button>
          </div>
          <div class="ee-detail__chart">
            <ChartContainer :option="distOption" />
          </div>
        </section>

        <section class="ee-detail__card">
          <h3>三个专业对比</h3>
          <div class="ee-detail__chart">
            <ChartContainer :option="majorCompareOption" />
          </div>
        </section>
      </div>

      <section class="ee-detail__card ee-detail__card--wide" :class="{ 'is-focus': highlight === 'employment-trend' }">
        <h3>就业历年趋势</h3>
        <div class="ee-detail__chart ee-detail__chart--trend">
          <ChartContainer :option="employmentTrendOption" />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.ee-detail__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.ee-detail__tabs {
  display: inline-flex;
  gap: 6px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(0, 40, 90, 0.35);
  border: 1px solid rgba(0, 200, 255, 0.18);
}

.ee-detail__tab {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9ecae8;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;

  &.is-active {
    background: rgba(0, 140, 255, 0.35);
    color: #eaf7ff;
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.25);
  }
}

.ee-detail__filters {
  display: flex;
  gap: 10px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #9ecae8;
    font-size: 24px;
  }

  select {
    min-width: 110px;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid rgba(0, 200, 255, 0.28);
    background: rgba(0, 40, 90, 0.45);
    color: #eaf7ff;
  }
}

.ee-detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ee-detail__card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.22);

  &--wide {
    margin-top: 12px;
  }

  &.is-focus {
    border-color: rgba(255, 213, 106, 0.55);
    box-shadow: 0 0 16px rgba(255, 213, 106, 0.18);
  }

  h3 {
    margin: 0 0 10px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }

  h4 {
    margin: 10px 0 6px;
    color: #9fe8ff;
    font-size: 24px;
  }
}

.ee-detail__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  &--quality {
    grid-template-columns: 1fr 1fr;
  }

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    border-radius: 6px;
    background: rgba(0, 60, 120, 0.22);

    span {
      color: #9ecae8;
      font-size: 24px;
    }

    strong {
      color: #eaf7ff;
      font-size: 24px;
      font-weight: 800;

      small {
        margin-left: 2px;
        font-size: 24px;
        color: #9ecae8;
      }
    }

    em {
      color: #63ffe1;
      font-style: normal;
      font-size: 24px;
    }
  }
}

.ee-detail__chart {
  height: 180px;

  &--province {
    height: 160px;
  }

  &--trend {
    height: 220px;
  }
}

.ee-detail__structure {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 10px;
}

.ee-detail__dual {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;

  span,
  em {
    color: #9ecae8;
    font-size: 24px;
  }

  em {
    font-style: normal;
  }
}

.ee-detail__dual-track {
  display: flex;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 40, 90, 0.4);

  i,
  b {
    display: block;
    height: 100%;
  }

  i {
    background: linear-gradient(90deg, #1a8cff, #39e6ff);
  }

  b {
    background: linear-gradient(90deg, #5a7a9a, #9ecae8);
  }

  &--gender {
    i {
      background: linear-gradient(90deg, #1a8cff, #4db8ff);
    }

    b {
      background: linear-gradient(90deg, #ff7eb3, #ffb3d1);
    }
  }
}

.ee-detail__dests {
  display: grid;
  gap: 8px;
}

.ee-detail__dest {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 6px 10px;
  align-items: center;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 50, 100, 0.2);
  color: #c6e6ff;
  text-align: left;
  cursor: pointer;

  &.is-active,
  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
  }

  strong,
  em {
    color: #7fe9ff;
    font-style: normal;
  }

  .ee-detail__dest-bar {
    grid-column: 1 / -1;
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 40, 90, 0.45);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #126dff, #65f7ff);
    }
  }
}

.ee-detail__schools ul {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.1);
    color: #c6e6ff;
    font-size: 24px;

    strong {
      color: #7fe9ff;
      white-space: nowrap;
    }
  }
}

.ee-detail__subtabs {
  display: inline-flex;
  gap: 4px;
  margin-bottom: 8px;

  button {
    padding: 3px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: transparent;
    color: #9ecae8;
    cursor: pointer;

    &.is-active {
      background: rgba(0, 140, 255, 0.3);
      color: #eaf7ff;
    }
  }
}

@media (max-width: 1100px) {
  .ee-detail__grid,
  .ee-detail__structure {
    grid-template-columns: 1fr;
  }
}
</style>
