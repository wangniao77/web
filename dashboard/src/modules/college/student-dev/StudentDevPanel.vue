<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import MetricCard from '@/components/metrics/MetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT } from '@/styles/echarts-theme'
import type { StudentOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: StudentOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const donutOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
  legend: {
    orient: 'vertical',
    right: 4,
    top: 'middle',
    itemGap: 10,
    textStyle: { color: '#8899aa', fontSize: CHART_FONT.legend },
    itemWidth: 10,
    itemHeight: 10,
  },
  series: [
    {
      type: 'pie',
      radius: ['36%', '56%'],
      center: ['28%', '52%'],
      label: { show: false },
      emphasis: { scale: true, scaleSize: 4 },
      data: props.data.employmentDirection.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: {
          color: [CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green, CHART_COLORS.purple][i],
          borderColor: '#000b2b',
          borderWidth: 2,
        },
      })),
    },
  ],
}))
</script>

<template>
  <CollegePanelCard
    :index="2"
    title="学生工作与学生发展"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="student-dev">
      <div class="metrics-row">
        <MetricCard
          v-for="m in data.metrics"
          :key="m.label"
          variant="bordered"
          :label="m.label"
          :value="m.value"
          :trend="m.trend"
        />
      </div>
      <div class="charts-row">
        <div class="chart-box">
          <span class="chart-label">就业去向（2025）</span>
          <ChartContainer :option="donutOption" />
        </div>
        <div class="quality-box">
          <span class="chart-label">学生素质发展</span>
          <ul class="quality-list">
            <li v-for="q in data.qualityDevelopment" :key="q.name">
              <span class="q-name">{{ q.name }}</span>
              <span class="q-bar-wrap">
                <span class="q-bar" :style="{ width: `${q.value}%` }" />
              </span>
              <em class="q-val">{{ q.value }}</em>
            </li>
          </ul>
        </div>
      </div>
      <div class="footer-stats">
        <span>学业预警 <em>{{ data.warnings.academic }}</em> 人</span>
        <span>资助覆盖率 <em>{{ data.warnings.fundingRate }}</em></span>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.student-dev {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.charts-row {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
}

.chart-box,
.quality-box {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.chart-label {
  font-size: $college-fs-label;
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 2px solid #42d8ff;
}

.quality-list {
  list-style: none;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  min-height: 0;
  overflow: hidden;
}

.quality-list li {
  display: grid;
  grid-template-columns: 68px 1fr 38px;
  align-items: center;
  gap: 6px;
  font-size: $college-fs-label;
}

.q-name {
  color: rgba(174, 198, 230, 0.74);
  white-space: nowrap;
}

.q-bar-wrap {
  height: 8px;
  background: rgba(5, 13, 32, 0.72);
  border: 1px solid rgba(102, 217, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
}

.q-bar {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #66d9ff, #00b8ff);
  border-radius: 999px;
  box-shadow: 0 0 10px rgba(0, 184, 255, 0.22);
}

.q-val {
  font-style: normal;
  font-family: var(--college-font-number);
  color: #55dfff;
  text-align: right;
  font-size: $college-fs-label;
}

.footer-stats {
  display: flex;
  justify-content: space-around;
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.7);
  padding-top: 5px;
  flex-shrink: 0;
  border-top: 1px solid rgba(102, 217, 255, 0.075);

  em {
    font-style: normal;
    color: #55dfff;
    font-family: var(--college-font-number);
    font-weight: 600;
  }
}
</style>
