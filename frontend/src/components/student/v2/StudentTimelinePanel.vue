<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { TimelineTermVM, CreditProgressVM, AcademicDevVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  timeline: TimelineTermVM[]
  credit: CreditProgressVM
  academic: AcademicDevVM
}>()

const wuyuColors = ['#39e6ff', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']

const gpaMiniOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, left: 36, right: 8, top: 8, bottom: 18 },
  tooltip: { trigger: 'axis', confine: true },
  xAxis: {
    type: 'category',
    data: props.academic.semesters,
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.25)' } },
  },
  yAxis: {
    type: 'value',
    min: 2.8,
    max: 4,
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: [{
    type: 'line',
    data: props.academic.gpaValues,
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { color: CHART_COLORS.blue, width: 2.5 },
    areaStyle: { color: 'rgba(0, 184, 255, 0.16)' },
  }],
}))
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard title="四年成长轴线 · 学业进度">
      <div class="stu-timeline-panel">
        <ul class="stu-timeline-panel__axis">
          <li v-for="(node, idx) in timeline" :key="node.term" class="stu-timeline-panel__node">
            <span class="stu-timeline-panel__dot" :style="{ '--accent': wuyuColors[idx % wuyuColors.length] }" />
            <div class="stu-timeline-panel__card">
              <header>
                <strong>{{ node.term }}</strong>
                <em>{{ node.label }}</em>
              </header>
              <div class="stu-timeline-panel__wuyu">
                <span v-for="(v, i) in [node.wuyu.de, node.wuyu.zhi, node.wuyu.ti, node.wuyu.mei, node.wuyu.lao]" :key="i">
                  <i :style="{ height: `${Math.max(v * 0.42, 8)}px`, background: wuyuColors[i] }" />
                  <b>{{ ['德', '智', '体', '美', '劳'][i] }}</b>
                </span>
              </div>
              <p v-if="node.milestone">{{ node.milestone }}</p>
            </div>
          </li>
        </ul>

        <div class="stu-timeline-panel__side">
          <div class="stu-timeline-panel__gpa">
            <span class="stu-timeline-panel__side-label">GPA 趋势 · 班排 {{ academic.classRank }}/{{ academic.classTotal }}</span>
            <ChartContainer :option="gpaMiniOption" />
          </div>
          <div class="stu-timeline-panel__credit">
            <div class="stu-timeline-panel__ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" class="stu-timeline-panel__ring-track" />
                <circle
                  cx="60" cy="60" r="48"
                  class="stu-timeline-panel__ring-progress"
                  :style="{ strokeDashoffset: 301 - (301 * credit.earnedPercent) / 100 }"
                />
              </svg>
              <div class="stu-timeline-panel__ring-text">
                <strong>{{ credit.earnedPercent }}%</strong>
                <span>必修学分</span>
                <em>{{ credit.earned }}/{{ credit.required }}</em>
              </div>
            </div>
            <div class="stu-timeline-panel__second">
              <span>第二课堂 {{ credit.secondClassroomEarned }}/{{ credit.secondClassroomRequired }}</span>
              <div class="stu-timeline-panel__second-bar">
                <i :style="{ width: `${credit.secondPercent}%` }" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-timeline-panel {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 12px;
}

.stu-timeline-panel__axis {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  min-height: 0;
}

.stu-timeline-panel__node {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stu-timeline-panel__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 10px color-mix(in srgb, var(--accent) 70%, transparent);
  flex-shrink: 0;
  margin-bottom: 6px;
}

.stu-timeline-panel__card {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 8px;
  border-radius: 8px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.14);
  display: flex;
  flex-direction: column;
  gap: 6px;

  header {
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong { font-size: var(--fs-label); color: #7ff6ff; }
    em { font-style: normal; font-size: var(--fs-meta); color: #9ecae8; }
  }

  p {
    margin: 0;
    font-size: var(--fs-meta);
    color: #c8e0f0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

.stu-timeline-panel__wuyu {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 4px;
  flex: 1;
  min-height: 48px;

  span {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;

    i {
      display: block;
      width: 100%;
      max-width: 18px;
      border-radius: 3px 3px 0 0;
      min-height: 6px;
    }

    b {
      font-size: var(--fs-micro);
      color: #8ec8e8;
      font-weight: 700;
    }
  }
}

.stu-timeline-panel__side {
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 8px;
}

.stu-timeline-panel__side-label {
  display: block;
  font-size: var(--fs-meta);
  font-weight: 700;
  color: #b8ecff;
  margin-bottom: 4px;
}

.stu-timeline-panel__gpa {
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
  }
}

.stu-timeline-panel__credit {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: center;
}

.stu-timeline-panel__ring {
  position: relative;
  width: 88px;
  height: 88px;

  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
}

.stu-timeline-panel__ring-track {
  fill: none;
  stroke: rgba(0, 80, 160, 0.4);
  stroke-width: 8;
}

.stu-timeline-panel__ring-progress {
  fill: none;
  stroke: #39e6ff;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 301;
  filter: drop-shadow(0 0 6px rgba(57, 230, 255, 0.6));
}

.stu-timeline-panel__ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  strong {
    font-family: var(--student-font-number);
    font-size: var(--fs-body);
    color: #7ff6ff;
  }

  span, em {
    font-size: var(--fs-micro);
    color: #8ec8e8;
    font-style: normal;
  }
}

.stu-timeline-panel__second {
  span {
    display: block;
    font-size: var(--fs-meta);
    color: #9ecae8;
    margin-bottom: 6px;
  }
}

.stu-timeline-panel__second-bar {
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 60, 120, 0.5);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #ffd166, #ff9f43);
  }
}
</style>
