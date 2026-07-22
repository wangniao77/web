<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type {
  AnnualAssessmentVM,
  CompetitionVM,
  HighlightItemVM,
  TimelineTermVM,
} from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  timeline: TimelineTermVM[]
  annualAssessments: AnnualAssessmentVM[]
  scholarships: Array<{ name: string; year: string }>
  competition: CompetitionVM
  highlights: HighlightItemVM[]
}>()

const wuyuLabels = ['德', '智', '体', '美', '劳']
const wuyuColors = ['#39e6ff', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']

const wuyuTrendOption = computed<EChartsOption>(() => {
  const terms = props.timeline.map((t) => t.term)
  const keys = ['de', 'zhi', 'ti', 'mei', 'lao'] as const
  return {
    grid: { ...CHART_GRID.line, left: 28, right: 8, top: 24, bottom: 18 },
    tooltip: { trigger: 'axis', confine: true },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 8,
      itemHeight: 6,
      textStyle: { color: '#9ecae8', fontSize: CHART_FONT.legend - 2 },
      data: wuyuLabels,
    },
    xAxis: {
      type: 'category',
      data: terms,
      axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
      axisLine: { lineStyle: { color: 'rgba(80,180,255,0.25)' } },
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: keys.map((k, i) => ({
      name: wuyuLabels[i],
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, color: wuyuColors[i] },
      data: props.timeline.map((t) => t.wuyu[k]),
    })),
  }
})

const assessmentOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, left: 36, right: 8, top: 8, bottom: 18 },
  tooltip: { trigger: 'axis', confine: true },
  xAxis: {
    type: 'category',
    data: props.annualAssessments.map((a) => a.year),
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.25)' } },
  },
  yAxis: {
    type: 'value',
    min: 70,
    max: 100,
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: [{
    type: 'bar',
    data: props.annualAssessments.map((a) => a.score),
    itemStyle: { color: CHART_COLORS.cyan, borderRadius: [4, 4, 0, 0] },
    barMaxWidth: 28,
  }],
}))
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard :index="3" title="综合素质与荣誉成果">
      <div class="stu-mod-quality">
        <div class="stu-mod-quality__charts">
          <div class="stu-mod-quality__chart">
            <span class="label">德智体美劳成长轴线</span>
            <ChartContainer :option="wuyuTrendOption" />
          </div>
          <div class="stu-mod-quality__chart">
            <span class="label">历年综合测评</span>
            <ChartContainer :option="assessmentOption" />
          </div>
        </div>

        <div class="stu-mod-quality__honors">
          <div class="stu-mod-quality__block">
            <h4>奖学金</h4>
            <ul>
              <li v-for="s in scholarships" :key="s.name + s.year">
                <strong>{{ s.name }}</strong>
                <em>{{ s.year }}</em>
              </li>
            </ul>
          </div>

          <div class="stu-mod-quality__block">
            <h4>竞赛 · 科研 · 获奖</h4>
            <div class="stu-mod-quality__stats">
              <span>竞赛 <b>{{ competition.awardCount }}</b></span>
              <span>科研 <b>{{ competition.researchCount }}</b></span>
              <span>创新 <b>{{ competition.innovationCount }}</b></span>
            </div>
            <ul class="compact">
              <li v-for="h in highlights.slice(0, 4)" :key="h.id">
                {{ h.label }} <em>{{ h.date }}</em>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-mod-quality {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stu-mod-quality__charts {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 8px;
  min-height: 0;
  flex: 1;
}

.stu-mod-quality__chart {
  min-height: 0;
  display: flex;
  flex-direction: column;

  .label {
    font-size: var(--fs-micro);
    font-weight: 700;
    color: #b8ecff;
    margin-bottom: 4px;
  }

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
  }
}

.stu-mod-quality__honors {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 8px;
}

.stu-mod-quality__block {
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);
  min-height: 0;
  overflow: auto;

  h4 {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    font-size: var(--fs-meta);
    color: #d8eeff;
    padding: 3px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.06);

    strong { color: #ffd166; }
    em { font-style: normal; color: #9ecae8; margin-left: 6px; }
  }
}

.stu-mod-quality__stats {
  display: flex;
  gap: 12px;
  margin-bottom: 6px;
  font-size: var(--fs-meta);
  color: #9ecae8;

  b {
    color: #7ff6ff;
    font-family: var(--student-font-number);
    margin-left: 4px;
  }
}
</style>
