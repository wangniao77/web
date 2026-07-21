<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL } from '@/styles/echarts-theme'
import type { AchievementCategory } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsDetailVM } from '@/types/college/view/benchmark-achievements'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: BenchmarkAchievementsDetailVM
  /** L1 KPI 下钻时传入分类：all / teaching / research / ... */
  initialFilter?: string | null
}>()

type FilterKey = 'all' | AchievementCategory

function resolveFilter(raw?: string | null): FilterKey {
  const allowed: FilterKey[] = [
    'all',
    'teaching',
    'research',
    'competition',
    'platform',
    'faculty',
    'social',
  ]
  if (raw && (allowed as string[]).includes(raw)) return raw as FilterKey
  return 'all'
}

const filter = ref<FilterKey>(resolveFilter(props.initialFilter))

watch(
  () => props.initialFilter,
  (v) => {
    filter.value = resolveFilter(v)
  },
)

const filteredAchievements = computed(() => {
  if (filter.value === 'all') return props.data.achievements
  return props.data.achievements.filter((item) => item.category === filter.value)
})

const levelBarOption = computed<EChartsOption>(() => {
  const items = props.data.byLevel
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 12, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value' as const,
      max: Math.ceil(maxVal * 1.15),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => i.level),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map((i) => i.count),
      barWidth: 12,
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

const categoryBarOption = computed<EChartsOption>(() => {
  const items = props.data.byCategory
  return {
    grid: { left: 8, right: 28, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value' as const,
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => i.label),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar' as const,
      data: items.map((i) => i.count),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        formatter: '{c}',
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1a8cff' },
            { offset: 1, color: '#5cecff' },
          ],
        },
      },
    }],
  }
})
</script>

<template>
  <div class="benchmark-detail">
    <div class="cdm-stat-row">
      <div class="cdm-stat"><span>年度荣誉</span><strong>{{ data.summary.annualHonors }}<small>项</small></strong></div>
      <div class="cdm-stat cdm-stat--green"><span>竞赛获奖</span><strong>{{ data.summary.competitionAwards }}<small>项</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>科研成果</span><strong>{{ data.summary.researchOutputs }}<small>项</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>国家级/省部级</span><strong>{{ data.summary.nationalProvincial }}<small>项</small></strong></div>
      <div class="cdm-stat cdm-stat--green"><span>平台成果</span><strong>{{ data.summary.platformOutputs }}<small>项</small></strong></div>
      <div class="cdm-stat"><span>师资成果</span><strong>{{ data.summary.facultyAchievements }}<small>项</small></strong></div>
    </div>

    <div class="benchmark-detail__columns">
      <div class="benchmark-detail__section">
        <h3>成果类别分布</h3>
        <div class="benchmark-detail__chart">
          <ChartContainer :option="categoryBarOption" />
        </div>
      </div>
      <div class="benchmark-detail__section">
        <h3>成果级别分布</h3>
        <div class="benchmark-detail__chart">
          <ChartContainer :option="levelBarOption" />
        </div>
      </div>
    </div>

    <div class="benchmark-detail__section">
      <h3>代表性成果清单</h3>
      <div class="benchmark-detail__tabs">
        <button
          type="button"
          class="benchmark-detail__tab"
          :class="{ 'is-active': filter === 'all' }"
          @click="filter = 'all'"
        >
          全部
        </button>
        <button
          v-for="item in data.byCategory"
          :key="item.category"
          type="button"
          class="benchmark-detail__tab"
          :class="{ 'is-active': filter === item.category }"
          @click="filter = item.category"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="benchmark-detail__table-wrap">
        <table class="benchmark-detail__table">
          <thead>
            <tr>
              <th>成果名称</th>
              <th>类别</th>
              <th>级别</th>
              <th>时间</th>
              <th>负责人</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredAchievements" :key="item.id">
              <td>{{ item.title }}</td>
              <td>{{ item.categoryLabel }}</td>
              <td>{{ item.level }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.leader ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.benchmark-detail__section {
  margin-top: 16px;

  h3 {
    margin: 0 0 10px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }
}

.benchmark-detail__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.benchmark-detail__chart {
  height: 220px;
}

.benchmark-detail__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.benchmark-detail__tab {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid rgba(0, 200, 255, 0.2);
  background: transparent;
  color: #9ecae8;
  cursor: pointer;

  &.is-active {
    background: rgba(0, 140, 255, 0.3);
    color: #eaf7ff;
    border-color: rgba(0, 242, 255, 0.4);
  }
}

.benchmark-detail__table-wrap {
  max-height: 320px;
  overflow: auto;
  border: 1px solid rgba(0, 200, 255, 0.16);
  border-radius: 8px;
}

.benchmark-detail__table {
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

@media (max-width: 1100px) {
  .benchmark-detail__columns {
    grid-template-columns: 1fr;
  }
}
</style>
