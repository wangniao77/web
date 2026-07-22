<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { StudentDevDetailVM } from '@/types/college/view/student-dev-quality'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: StudentDevDetailVM
}>()

type HpTab = 'byMajor' | 'byGrade' | 'byType'
type WarnTab = 'byType' | 'byMajor' | 'byGrade'

const hpTab = ref<HpTab>('byMajor')
const warnTab = ref<WarnTab>('byType')

const hpTabs: Array<{ id: HpTab; label: string }> = [
  { id: 'byMajor', label: '专业' },
  { id: 'byGrade', label: '年级' },
  { id: 'byType', label: '类型' },
]

const warnTabs: Array<{ id: WarnTab; label: string }> = [
  { id: 'byType', label: '类型' },
  { id: 'byMajor', label: '专业' },
  { id: 'byGrade', label: '年级' },
]

function shortenMajor(name: string) {
  return name
    .replace('计算机科学与技术', '计科')
    .replace('软件工程', '软工')
    .replace('大数据管理与应用', '大数据')
}

const outcomePieOption = computed<EChartsOption>(() => ({
  color: ['#39e6ff', '#ffb07a', '#30d7a4'],
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
    formatter: '{b}<br/>{c}人 ({d}%)',
  },
  series: [{
    type: 'pie' as const,
    radius: ['42%', '68%'],
    center: ['50%', '52%'],
    label: {
      color: '#eaf7ff',
      fontSize: CHART_FONT.label,
      fontWeight: 700,
      formatter: '{b}\n{d}%',
    },
    data: props.data.outcomes.map((o) => ({ name: o.label, value: o.count })),
  }],
}))

const salaryOption = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 12, top: 36, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
    valueFormatter: (v) => `${v}万`,
  },
  legend: {
    top: 0,
    right: 0,
    textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend },
  },
  xAxis: {
    type: 'category' as const,
    data: props.data.salaryByMajor.years,
    axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value' as const,
    axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis, formatter: '{value}万' },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: props.data.salaryByMajor.series.map((s) => ({
    name: shortenMajor(s.name),
    type: 'line' as const,
    smooth: true,
    symbol: 'circle',
    symbolSize: 7,
    data: s.data,
    lineStyle: { width: 3 },
  })),
}))

const gaokaoOption = computed<EChartsOption>(() => {
  const items = [...props.data.gaokaoScores].sort((a, b) => a.avgScore - b.avgScore)
  return {
    grid: { left: 8, right: 28, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
    },
    xAxis: {
      type: 'value' as const,
      min: Math.min(...items.map((i) => i.minScore)) - 10,
      axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => shortenMajor(i.major)),
      axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map((i) => i.avgScore),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        fontWeight: 700,
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

function breakdownBarOption(items: Array<{ name: string; count: number }>): EChartsOption {
  const sorted = [...items].sort((a, b) => a.count - b.count)
  return {
    grid: { left: 8, right: 28, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
    },
    xAxis: {
      type: 'value' as const,
      axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category' as const,
      data: sorted.map((i) => shortenMajor(i.name)),
      axisLabel: { color: '#c6e6ff', fontSize: CHART_FONT.axis },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: sorted.map((i) => i.count),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        fontWeight: 700,
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
}

const hpBarOption = computed(() => breakdownBarOption(props.data.highPotentialBreakdown[hpTab.value]))
const warnBarOption = computed(() => breakdownBarOption(props.data.warningBreakdown[warnTab.value]))

function openHp() {
  openCollegeDetail({ kind: 'high-potential-overview' })
}

function openWarning() {
  openCollegeDetail({ kind: 'warning', id: 'academic' })
}

function openFlow() {
  openCollegeDetail({ kind: 'student-flow' })
}
</script>

<template>
  <div class="talent-detail">
    <div class="cdm-stat-row">
      <div class="cdm-stat"><span>在校生</span><strong>{{ data.summary.enrolledUndergrad }}<small>人</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>研究生</span><strong>{{ data.summary.enrolledGraduate }}<small>人</small></strong></div>
      <div class="cdm-stat cdm-stat--green"><span>就业率</span><strong>{{ data.summary.employmentRate }}<small>%</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>高潜学生</span><strong>{{ data.summary.highPotential }}<small>人</small></strong></div>
      <div class="cdm-stat cdm-stat--orange"><span>预警学生</span><strong>{{ data.summary.warning }}<small>人</small></strong></div>
    </div>

    <div class="talent-detail__section">
      <div class="talent-detail__head">
        <h3>毕业去向 · 就业 / 考公 / 升学</h3>
        <button type="button" class="talent-detail__link" @click="openFlow">查看桑基图 →</button>
      </div>
      <div class="talent-detail__outcomes">
        <div class="talent-detail__outcome-cards">
          <div v-for="item in data.outcomes" :key="item.key" class="talent-detail__outcome-card">
            <span>{{ item.label }}</span>
            <strong>{{ item.count }}<small>人</small></strong>
            <em>{{ item.ratio }}%</em>
          </div>
        </div>
        <div class="talent-detail__chart talent-detail__chart--sm">
          <ChartContainer :option="outcomePieOption" />
        </div>
      </div>
    </div>

    <div class="talent-detail__section">
      <h3>专业薪资变化（万元/年）</h3>
      <div class="talent-detail__chart">
        <ChartContainer :option="salaryOption" />
      </div>
    </div>

    <div class="talent-detail__section">
      <h3>本科入学高考均分</h3>
      <div class="talent-detail__chart">
        <ChartContainer :option="gaokaoOption" />
      </div>
      <div class="talent-detail__table-wrap">
        <table class="talent-detail__table">
          <thead>
            <tr>
              <th>专业</th>
              <th>均分</th>
              <th>最低</th>
              <th>最高</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in data.gaokaoScores" :key="item.major">
              <td>{{ item.major }}</td>
              <td>{{ item.avgScore }}</td>
              <td>{{ item.minScore }}</td>
              <td>{{ item.maxScore }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="talent-detail__columns">
      <div class="talent-detail__section">
        <div class="talent-detail__head">
          <h3>高潜学生细分</h3>
          <button type="button" class="talent-detail__link" @click="openHp">名单 →</button>
        </div>
        <div class="talent-detail__tabs">
          <button
            v-for="tab in hpTabs"
            :key="tab.id"
            type="button"
            class="talent-detail__tab"
            :class="{ 'talent-detail__tab--active': hpTab === tab.id }"
            @click="hpTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="talent-detail__chart talent-detail__chart--md">
          <ChartContainer :option="hpBarOption" />
        </div>
      </div>

      <div class="talent-detail__section">
        <div class="talent-detail__head">
          <h3>预警学生细分</h3>
          <button type="button" class="talent-detail__link" @click="openWarning">名单 →</button>
        </div>
        <div class="talent-detail__tabs">
          <button
            v-for="tab in warnTabs"
            :key="tab.id"
            type="button"
            class="talent-detail__tab"
            :class="{ 'talent-detail__tab--active': warnTab === tab.id }"
            @click="warnTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
        <div class="talent-detail__chart talent-detail__chart--md">
          <ChartContainer :option="warnBarOption" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.talent-detail__section {
  margin-top: 16px;

  h3 {
    margin: 0 0 10px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }
}

.talent-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
  }
}

.talent-detail__link {
  padding: 4px 10px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  border-radius: 4px;
  background: rgba(0, 70, 130, 0.3);
  color: #9fe8ff;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
}

.talent-detail__outcomes {
  display: grid;
  grid-template-columns: 1fr 220px;
  gap: 12px;
  align-items: stretch;
}

.talent-detail__outcome-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.talent-detail__outcome-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(0, 40, 90, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.16);

  span {
    font-size: 24px;
    color: #9ecae8;
  }

  strong {
    font-size: 24px;
    color: #7fe9ff;

    small {
      font-size: 24px;
    }
  }

  em {
    font-style: normal;
    font-size: 24px;
    color: #8ec8e8;
  }
}

.talent-detail__chart {
  height: 260px;

  &--sm {
    height: 180px;
  }

  &--md {
    height: 240px;
  }
}

.talent-detail__table-wrap {
  margin-top: 10px;
  max-height: 200px;
  overflow: auto;
  border: 1px solid rgba(0, 200, 255, 0.16);
  border-radius: 8px;
}

.talent-detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 24px;

  th,
  td {
    padding: 8px 10px;
    text-align: left;
    border-bottom: 1px solid rgba(0, 200, 255, 0.08);
  }

  th {
    position: sticky;
    top: 0;
    background: rgba(0, 50, 100, 0.6);
    color: #9fe8ff;
    font-weight: 700;
  }

  td {
    color: #d8f0ff;
  }
}

.talent-detail__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.talent-detail__tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.talent-detail__tab {
  padding: 4px 10px;
  border: 1px solid rgba(0, 200, 255, 0.22);
  border-radius: 4px;
  background: rgba(0, 50, 100, 0.25);
  color: #9fe8ff;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;

  &--active {
    border-color: rgba(0, 242, 255, 0.55);
    background: rgba(0, 100, 180, 0.35);
    color: #fff;
  }
}
</style>
