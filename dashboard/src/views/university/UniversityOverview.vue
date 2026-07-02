<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ScreenLayout from '@/layouts/ScreenLayout.vue'
import PanelCard from '@/components/screen/PanelCard.vue'
import MetricCard from '@/components/metrics/MetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { universityService } from '@/services/university'
import type { UniversityOverviewDTO } from '@/types/api/university'
import type { EChartsOption } from 'echarts'
import { CHART_COLORS } from '@/styles/echarts-theme'

const data = ref<UniversityOverviewDTO | null>(null)
const loading = ref(true)

onMounted(async () => {
  data.value = await universityService.fetchOverview()
  loading.value = false
})

const rankingOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const items = data.value.collegeRanking
  return {
    grid: { left: 100, right: 40, top: 16, bottom: 16 },
    xAxis: { type: 'value', max: 100, show: false },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.collegeName).reverse(),
      axisLabel: { color: '#8eb4d8', fontSize: 11 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: items.map((i) => i.score).reverse(),
        barWidth: 12,
        label: { show: true, position: 'right', color: CHART_COLORS.blue, fontSize: 11 },
        itemStyle: { color: CHART_COLORS.blue, borderRadius: [0, 4, 4, 0] },
      },
    ],
  }
})
</script>

<template>
  <ScreenLayout title="广东财经大学发展与治理驾驶舱">
    <div v-if="data" class="university-grid">
      <PanelCard title="全校综合发展指数" class="hub-panel">
        <div class="hub-content">
          <div class="hub-score">
            <span class="score-value">{{ data.hub.developmentIndex }}</span>
            <span class="score-label">/ {{ data.hub.maxScore }}</span>
          </div>
          <div class="hub-kpis">
            <MetricCard
              v-for="kpi in data.hub.kpis"
              :key="kpi.label"
              :label="kpi.label"
              :value="`${kpi.value}${kpi.unit || ''}`"
              :trend="kpi.trend"
            />
          </div>
        </div>
      </PanelCard>

      <PanelCard title="学院发展指数排行" class="rank-panel">
        <ChartContainer :option="rankingOption" />
      </PanelCard>

      <PanelCard title="全校预警汇总" class="warn-panel">
        <ul class="warn-list">
          <li v-for="w in data.warningSummary" :key="w.label">
            <span>{{ w.label }}</span>
            <em>{{ w.count }}</em>
          </li>
        </ul>
      </PanelCard>
    </div>
    <div v-else-if="loading" class="loading-state">加载中...</div>
  </ScreenLayout>
</template>

<style scoped lang="scss">
.university-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.6fr;
  gap: 12px;
}

.hub-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 16px;
}

.hub-score {
  .score-value {
    font-family: $font-display;
    font-size: 56px;
    font-weight: 700;
    color: $color-accent;
  }

  .score-label {
    font-size: 18px;
    color: $color-text-secondary;
  }
}

.hub-kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  width: 100%;
}

.warn-list {
  list-style: none;
  padding: 16px;

  li {
    display: flex;
    justify-content: space-between;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 212, 255, 0.1);
    font-size: 14px;
    color: $color-text-secondary;

    em {
      font-style: normal;
      font-family: $font-display;
      font-size: 20px;
      color: $color-warning;
    }
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $color-text-secondary;
}
</style>
