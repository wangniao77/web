<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import UniversityDetailLayout from '@/domains/university/components/UniversityDetailLayout.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import RiskBadge from '@/domains/university/components/RiskBadge.vue'
import { universityDetailService } from '@/domains/university/services/details'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { ResearchDetailVM } from '@/domains/university/types/view/details'

const data = ref<ResearchDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await universityDetailService.fetchResearchDetail()
  } finally {
    loading.value = false
  }
})

const trendOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  return {
    grid: { ...CHART_GRID.line, top: 24, bottom: 28, left: 48, right: 16 },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: data.value.fundingTrend.map((t) => t.year),
      axisLabel: { color: '#8eb4d8', fontSize: CHART_FONT.axis },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#8eb4d8', formatter: '{value} 亿' },
      splitLine: { lineStyle: { color: 'rgba(85, 168, 255, 0.06)' } },
    },
    series: [{
      type: 'bar',
      data: data.value.fundingTrend.map((t) => t.value),
      itemStyle: { color: CHART_COLORS.cyan },
      barWidth: 28,
    }],
  }
})
</script>

<template>
  <UniversityDetailLayout title="科研创新与申博支撑" subtitle="科研项目、成果与申博关键指标">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <section class="group">
        <h3>科研项目概况</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr><th>层级</th><th>项目数</th><th>到账经费（亿元）</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in data.projects" :key="row.name">
                <td>{{ row.level }}</td>
                <td>{{ row.count }}</td>
                <td>{{ row.funding.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="group">
        <h3>申博关键指标</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr><th>指标</th><th>目标</th><th>当前</th><th>差距</th><th>责任部门</th><th>节点</th></tr>
            </thead>
            <tbody>
              <tr v-for="row in data.phdIndicators" :key="row.name">
                <td>{{ row.name }}</td>
                <td>{{ row.target }}</td>
                <td>{{ row.current }}</td>
                <td><RiskBadge :level="row.gap > 0 ? 'attention' : 'normal'" :label="String(row.gap)" /></td>
                <td>{{ row.dept }}</td>
                <td>{{ row.deadline }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div class="charts-grid">
        <section class="chart-section">
          <h3>科研经费近三年趋势</h3>
          <ChartContainer :option="trendOption" class="chart-lg" />
        </section>
        <section class="chart-section">
          <h3>学院科研贡献</h3>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr><th>学院</th><th>项目</th><th>经费</th><th>论文</th></tr>
              </thead>
              <tbody>
                <tr v-for="row in data.collegeRanking" :key="row.collegeName">
                  <td>{{ row.collegeName }}</td>
                  <td>{{ row.projects }}</td>
                  <td>{{ row.funding.toFixed(2) }} 亿</td>
                  <td>{{ row.papers }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder { color: rgba(174, 198, 230, 0.7); }
.group { margin-bottom: 16px; }
.group h3 { font-size: 14px; color: #f3f8ff; margin-bottom: 8px; }
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.chart-section {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(85, 168, 255, 0.12);
  background: rgba(4, 14, 38, 0.45);
  h3 { font-size: 14px; color: #f3f8ff; margin-bottom: 8px; }
}
.chart-lg { height: 240px; }
.table-wrap { overflow: auto; }
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-body;
  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(85, 168, 255, 0.1);
    text-align: left;
  }
  th { color: rgba(174, 198, 230, 0.68); font-weight: 600; }
  td { color: #eef9ff; }
}
</style>
