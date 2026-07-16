<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import UniversityDetailLayout from '@/components/university/UniversityDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { universityDetailService } from '@/api/university/services/details'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { AcademicRiskDetailVM } from '@/types/university/view/details'

const data = ref<AcademicRiskDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await universityDetailService.fetchAcademicRiskDetail()
  } finally {
    loading.value = false
  }
})

const trendOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  return {
    grid: { ...CHART_GRID.lineLegend, top: 36, bottom: 28, left: 48, right: 16 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['学业预警', '预计延毕'], textStyle: { color: '#8eb4d8', fontSize: CHART_FONT.label } },
    xAxis: {
      type: 'category',
      data: data.value.trend.map((t) => t.month),
      axisLabel: { color: '#8eb4d8', fontSize: CHART_FONT.axis },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8eb4d8' },
      splitLine: { lineStyle: { color: 'rgba(85, 168, 255, 0.06)' } },
    },
    series: [
      { name: '学业预警', type: 'line', smooth: true, data: data.value.trend.map((t) => t.warning), lineStyle: { color: CHART_COLORS.orange }, itemStyle: { color: CHART_COLORS.orange } },
      { name: '预计延毕', type: 'line', smooth: true, data: data.value.trend.map((t) => t.delay), lineStyle: { color: CHART_COLORS.red }, itemStyle: { color: CHART_COLORS.red } },
    ],
  }
})

const riskTypeOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  return {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '62%'],
      center: ['50%', '50%'],
      label: { color: '#8eb4d8', fontSize: CHART_FONT.label },
      data: data.value.riskTypes.map((r, i) => ({
        name: r.type,
        value: r.count,
        itemStyle: { color: [CHART_COLORS.orange, CHART_COLORS.red, CHART_COLORS.blue, CHART_COLORS.purple][i] },
      })),
    }],
  }
})
</script>

<template>
  <UniversityDetailLayout title="人才培养与学业风险预警" subtitle="全校汇总数据，不含学生个人明细">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="summary-row">
        <div class="summary-item"><span>预计延毕</span><strong>{{ data.summary.expectedDelayCount }}</strong></div>
        <div class="summary-item"><span>学业预警</span><strong>{{ data.summary.warningCount }}</strong></div>
        <div class="summary-item"><span>已干预</span><strong>{{ data.summary.intervenedCount }}</strong></div>
        <div class="summary-item"><span>风险解除率</span><strong>{{ data.summary.riskResolvedRate }}%</strong></div>
        <div class="summary-item"><span>高风险学院</span><strong>{{ data.summary.highRiskCollegeCount }}</strong></div>
      </div>

      <div class="charts-grid">
        <section class="chart-section">
          <h3>预警与延毕趋势</h3>
          <ChartContainer :option="trendOption" class="chart-lg" />
        </section>
        <section class="chart-section">
          <h3>风险类型分布</h3>
          <ChartContainer :option="riskTypeOption" class="chart-lg" />
        </section>
      </div>

      <section class="group">
        <h3>学院风险分布（汇总）</h3>
        <table class="detail-table">
          <thead><tr><th>学院</th><th>预警人数</th><th>预计延毕</th></tr></thead>
          <tbody>
            <tr v-for="row in data.collegeDistribution" :key="row.collegeName">
              <td>{{ row.collegeName }}</td>
              <td>{{ row.warningCount }}</td>
              <td>{{ row.delayCount }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p class="note">学生个人明细需学院级权限，当前页面仅展示聚合统计数据。</p>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder { color: rgba(174, 198, 230, 0.7); }
.summary-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 16px; }
.summary-item {
  padding: 10px; border-radius: 8px; border: 1px solid rgba(85, 168, 255, 0.12); background: rgba(4, 14, 38, 0.55);
  span { display: block; font-size: 11px; color: rgba(174, 198, 230, 0.68); }
  strong { font-size: 20px; color: #55dfff; font-family: var(--university-font-number); }
}
.charts-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 12px; margin-bottom: 16px; }
.chart-section { padding: 12px; border-radius: 8px; border: 1px solid rgba(85, 168, 255, 0.12); background: rgba(4, 14, 38, 0.45); }
.chart-section h3 { font-size: 14px; color: #f3f8ff; margin-bottom: 8px; }
.chart-lg { height: 260px; }
.group h3 { font-size: 14px; color: #f3f8ff; margin-bottom: 8px; }
.detail-table {
  width: 100%; border-collapse: collapse; font-size: $college-fs-body;
  th, td { padding: 10px 12px; border-bottom: 1px solid rgba(85, 168, 255, 0.1); text-align: left; }
  th { color: rgba(174, 198, 230, 0.68); }
  td { color: #eef9ff; }
}
.note { margin-top: 12px; font-size: 11px; color: rgba(174, 198, 230, 0.48); }
</style>
