<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { EChartsOption } from 'echarts'
import UniversityDetailLayout from '@/domains/university/components/UniversityDetailLayout.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { universityDetailService } from '@/domains/university/services/details'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EmploymentDetailVM } from '@/domains/university/types/view/details'

const data = ref<EmploymentDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await universityDetailService.fetchEmploymentDetail()
  } finally {
    loading.value = false
  }
})

const trendOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  return {
    grid: { ...CHART_GRID.line, top: 36, bottom: 28, left: 48, right: 24 },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['就业率', '升学率'],
      textStyle: { color: '#8eb4d8', fontSize: CHART_FONT.label },
      top: 0,
    },
    xAxis: {
      type: 'category',
      data: data.value.trend.map((t) => t.term),
      axisLabel: { color: '#8eb4d8', fontSize: CHART_FONT.axis },
    },
    yAxis: {
      type: 'value',
      min: 20,
      max: 100,
      axisLabel: { color: '#8eb4d8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    series: [
      {
        name: '就业率',
        type: 'line',
        smooth: true,
        data: data.value.trend.map((t) => t.rate),
        lineStyle: { color: CHART_COLORS.cyan },
        itemStyle: { color: CHART_COLORS.cyan },
      },
      {
        name: '升学率',
        type: 'line',
        smooth: true,
        data: data.value.trend.map((t) => t.furtherRate),
        lineStyle: { color: CHART_COLORS.gold },
        itemStyle: { color: CHART_COLORS.gold },
      },
    ],
  }
})

const pieOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    series: [{
      type: 'pie',
      radius: ['36%', '58%'],
      center: ['50%', '52%'],
      label: { color: '#8eb4d8', fontSize: CHART_FONT.label },
      data: data.value.distribution.map((d, i) => ({
        name: d.name,
        value: d.value,
        itemStyle: {
          color: [CHART_COLORS.cyan, CHART_COLORS.blue, CHART_COLORS.gold, CHART_COLORS.green][i],
        },
      })),
    }],
  }
})
</script>

<template>
  <UniversityDetailLayout title="就业与升学质量" subtitle="全校就业升学数据明细">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="overview-row">
        <div v-for="item in data.overview" :key="item.label" class="overview-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}<small v-if="item.unit">{{ item.unit }}</small></strong>
        </div>
      </div>

      <div class="charts-grid">
        <section class="chart-section">
          <h3>近6学期就业与升学趋势</h3>
          <ChartContainer :option="trendOption" class="chart-lg" />
        </section>
        <section class="chart-section">
          <h3>就业地域分布</h3>
          <ChartContainer :option="pieOption" class="chart-lg" />
        </section>
      </div>

      <section class="group">
        <h3>分学院就业与升学</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>学院</th>
                <th>就业率</th>
                <th>升学率</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in data.byCollege" :key="row.collegeName">
                <td>{{ row.collegeName }}</td>
                <td>{{ row.employmentRate }}%</td>
                <td>{{ row.furtherRate }}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section v-if="data.salaryCoverage" class="group">
        <h3>薪酬区间分布（覆盖率 {{ data.salaryCoverage }}%）</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead><tr><th>区间</th><th>人数</th></tr></thead>
            <tbody>
              <tr v-for="row in data.salaryDistribution" :key="row.range">
                <td>{{ row.range }}</td>
                <td>{{ row.count }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.overview-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.overview-item {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  span {
    display: block;
    font-size: $college-fs-label;
    color: rgba(174, 198, 230, 0.68);
    margin-bottom: 4px;
  }

  strong {
    font-size: 20px;
    color: #00e5ff;
    font-family: var(--university-font-number);

    small {
      font-size: 12px;
      margin-left: 2px;
    }
  }
}

.charts-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
  margin-bottom: 16px;
}

.chart-section {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.45);

  h3 {
    font-size: 14px;
    color: #f3f8ff;
    margin-bottom: 8px;
  }
}

.chart-lg {
  height: 280px;
}

.group h3 {
  font-size: 14px;
  color: #f3f8ff;
  margin-bottom: 8px;
}

.table-wrap {
  overflow: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-body;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.1);
    text-align: left;
  }

  th {
    color: rgba(174, 198, 230, 0.68);
    font-weight: 600;
  }

  td {
    color: #eef9ff;
  }
}
</style>
