<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { AcademicDevVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: AcademicDevVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const axisCompact = { ...AXIS_LABEL, fontSize: 13, margin: 6 }

function gradeOf(score: number): string {
  if (score >= 90) return '优'
  if (score >= 80) return '良'
  if (score >= 70) return '中'
  if (score >= 60) return '及格'
  return '不及格'
}

const physicalGrade = computed(() => gradeOf(props.data.physicalTestScore))

const gpaOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, top: 8, bottom: 2 },
  tooltip: { trigger: 'axis' },
  xAxis: {
    type: 'category',
    data: props.data.semesters,
    axisLabel: axisCompact,
  },
  yAxis: {
    type: 'value',
    min: 3,
    max: 4,
    axisLabel: { ...axisCompact, formatter: '{value}' },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
  },
  series: [{
    name: 'GPA',
    type: 'line',
    smooth: true,
    data: props.data.gpaValues,
    lineStyle: { color: CHART_COLORS.blue, width: 2 },
    itemStyle: { color: CHART_COLORS.blue },
    areaStyle: { color: 'rgba(0, 184, 255, 0.12)' },
  }],
}))

const rankOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.lineLegend, top: 28, bottom: 2 },
  tooltip: {
    trigger: 'axis',
    formatter: (params: unknown) => {
      const arr = params as Array<{ axisValue: string; seriesName: string; value: number; marker: string }>
      if (!Array.isArray(arr) || !arr.length) return ''
      const lines = arr.map((p) => {
        const val = p.seriesName === '体测成绩' ? gradeOf(p.value) : `第 ${p.value} 名`
        return `${p.marker}${p.seriesName}：${val}`
      })
      return `${arr[0].axisValue}<br/>${lines.join('<br/>')}`
    },
  },
  legend: {
    top: 0,
    right: 0,
    itemWidth: 10,
    itemHeight: 8,
    textStyle: { color: '#889ec2', fontSize: CHART_FONT.legend - 2 },
    data: ['体测成绩', '专业排名'],
  },
  xAxis: {
    type: 'category',
    data: props.data.semesters,
    axisLabel: axisCompact,
  },
  yAxis: [
    {
      type: 'value',
      min: 60,
      max: 100,
      interval: 10,
      axisLabel: {
        ...axisCompact,
        formatter: (val: number) => (val >= 100 ? '' : gradeOf(val)),
      },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.04)' } },
    },
    {
      type: 'value',
      inverse: true,
      axisLabel: axisCompact,
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '体测成绩',
      type: 'line',
      smooth: true,
      yAxisIndex: 0,
      data: props.data.physicalTestValues,
      lineStyle: { color: CHART_COLORS.cyan, width: 2 },
      itemStyle: { color: CHART_COLORS.cyan },
      areaStyle: { color: 'rgba(0, 212, 255, 0.08)' },
    },
    {
      name: '专业排名',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: props.data.majorRankValues,
      lineStyle: { color: CHART_COLORS.gold, width: 2 },
      itemStyle: { color: CHART_COLORS.gold },
    },
  ],
}))

const advantageCourses = computed(() =>
  props.data.courseGrades.filter((c) => c.score >= 90),
)

const warningCourses = computed(() =>
  props.data.courseGrades.filter((c) => c.score < 70),
)

function formatCourseList(courses: typeof props.data.courseGrades) {
  if (!courses.length) return '无'
  return courses.map((c) => `${c.name}(${c.score})`).join('、')
}

const advantageText = computed(() => formatCourseList(advantageCourses.value))
const warningText = computed(() => formatCourseList(warningCourses.value))
</script>

<template>
  <CollegePanelCard
    :index="4"
    title="成长概览 · 学业发展"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="academic-growth">
      <div class="kpi-row">
        <div class="kpi-card primary">
          <span class="kpi-label">绩点 GPA</span>
          <span class="kpi-value">{{ data.gpa }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">体测成绩</span>
          <span class="kpi-value">{{ physicalGrade }}</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">专业排名</span>
          <span class="kpi-value">{{ data.majorRank }}<small>/{{ data.majorTotal }}</small></span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">学分完成率</span>
          <span class="kpi-value">{{ data.courseCompletionRate }}<small>%</small></span>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-box">
          <span class="chart-label">GPA 趋势</span>
          <ChartContainer :option="gpaOption" />
        </div>
        <div class="chart-box">
          <span class="chart-label">体测成绩 / 专业排名变化</span>
          <ChartContainer :option="rankOption" />
        </div>
      </div>

      <div class="course-summary">
        <p class="course-line advantage">
          <span class="line-label">优势课程：</span>
          <span class="line-text">{{ advantageText }}</span>
        </p>
        <p class="course-line warning">
          <span class="line-label">预警课程：</span>
          <span class="line-text">{{ warningText }}</span>
        </p>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.academic-growth {
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(88px, 1fr) auto;
  gap: 5px;
  min-height: 0;
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  flex-shrink: 0;
}

.kpi-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 5px 4px;
  border-radius: 6px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.64), rgba(5, 17, 45, 0.56)),
    rgba(6, 17, 52, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &.primary {
    border-color: rgba(0, 212, 255, 0.25);
  }
}

.kpi-label {
  font-size: var(--fs-meta);
  color: rgba(190, 210, 238, 0.8);
  white-space: nowrap;
}

.kpi-value {
  font-family: var(--student-font-number, inherit);
  font-size: var(--fs-body);
  font-weight: 700;
  color: #f2f7ff;

  small {
    font-size: 0.55em;
    color: rgba(186, 208, 236, 0.7);
    font-weight: 400;
  }
}

.charts-row {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.chart-box {
  display: flex;
  flex-direction: column;
  min-height: 0;

  .chart-label {
    font-size: var(--fs-meta);
    color: rgba(198, 216, 242, 0.82);
    margin-bottom: 2px;
    flex-shrink: 0;
  }

  :deep(.chart-container) {
    flex: 1;
    min-height: 76px;
  }
}

.course-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 212, 255, 0.08);
  flex-shrink: 0;
}

.course-line {
  margin: 0;
  font-size: var(--fs-label);
  line-height: 1.45;
  display: flex;
  gap: 2px;
}

.line-label {
  flex-shrink: 0;
  font-weight: 600;
}

.line-text {
  color: rgba(224, 238, 255, 0.94);
  word-break: break-all;
}

.course-line.advantage .line-label {
  color: $color-success;
}

.course-line.warning .line-label {
  color: $color-danger;
}

.course-line.warning .line-text {
  color: rgba(255, 180, 180, 0.92);
}
</style>
