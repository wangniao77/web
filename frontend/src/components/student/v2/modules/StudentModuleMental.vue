<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type {
  GrowthPortraitVM,
  HealthVM,
  MentalGrowthVM,
  PersonalInfoVM,
  TimelineTermVM,
} from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  profile: PersonalInfoVM
  mentalGrowth: MentalGrowthVM
  growthPortrait: GrowthPortraitVM
  health: HealthVM
  timeline: TimelineTermVM[]
}>()

const trendLabel = {
  positive: '正向成长',
  negative: '负向下滑',
  stable: '平稳发展',
} as const

const trendClass = {
  positive: 'trend--up',
  negative: 'trend--down',
  stable: 'trend--flat',
} as const

const mentalClass: Record<string, string> = {
  low: 'level--low',
  medium: 'level--medium',
  high: 'level--high',
}

const wuyuAvgOption = computed<EChartsOption>(() => {
  const terms = props.timeline.map((t) => t.term)
  const avg = props.timeline.map((t) => {
    const w = t.wuyu
    return Math.round((w.de + w.zhi + w.ti + w.mei + w.lao) / 5)
  })
  return {
    grid: { ...CHART_GRID.line, left: 32, right: 8, top: 8, bottom: 18 },
    tooltip: { trigger: 'axis', confine: true },
    xAxis: {
      type: 'category',
      data: terms,
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
      type: 'line',
      data: avg,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { color: CHART_COLORS.purple, width: 2.5 },
      areaStyle: { color: 'rgba(167, 139, 250, 0.16)' },
    }],
  }
})
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard :index="5" title="心理状态与成长趋势">
      <div class="stu-mod-mental">
        <div class="stu-mod-mental__status">
          <div class="stu-mod-mental__level" :class="mentalClass[profile.mentalLevelCode || 'medium']">
            <span>心理分级</span>
            <strong>{{ profile.mentalLevel || '—' }}</strong>
          </div>
          <div class="stu-mod-mental__trend" :class="trendClass[profile.growthTrend || 'stable']">
            <span>成长趋势</span>
            <strong>{{ trendLabel[profile.growthTrend || 'stable'] }}</strong>
          </div>
          <div class="stu-mod-mental__support">
            <span>帮扶状态</span>
            <strong>{{ mentalGrowth.supportStatus || '—' }}</strong>
          </div>
          <div class="stu-mod-mental__health">
            <span>心理健康指数</span>
            <strong>{{ health.mentalHealth }}</strong>
          </div>
        </div>

        <div class="stu-mod-mental__chart">
          <span class="label">五维综合评分变化</span>
          <ChartContainer :option="wuyuAvgOption" />
        </div>

        <div class="stu-mod-mental__records">
          <h4>心理关注 · 谈话记录</h4>
          <ul>
            <li v-for="(r, idx) in mentalGrowth.records" :key="idx">
              <header>
                <strong>{{ r.date }}</strong>
                <em>{{ r.person }}</em>
                <span>{{ r.level }}</span>
              </header>
              <p>{{ r.content }}</p>
            </li>
          </ul>
        </div>

        <div class="stu-mod-mental__dims">
          <h4>当前五维画像</h4>
          <div class="stu-mod-mental__radar-mini">
            <div
              v-for="(name, i) in growthPortrait.indicators.map((d) => d.name)"
              :key="name"
              class="dim"
            >
              <div class="bar">
                <i :style="{ width: `${growthPortrait.personal[i]}%`, background: ['#39e6ff','#a78bfa','#34d399','#fbbf24','#f472b6'][i] }" />
              </div>
              <span>{{ name }}</span>
              <strong>{{ growthPortrait.personal[i] }}</strong>
            </div>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-mod-mental {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: 8px;
}

.stu-mod-mental__status {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.stu-mod-mental__level,
.stu-mod-mental__trend,
.stu-mod-mental__support,
.stu-mod-mental__health {
  padding: 8px 10px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);
  text-align: center;

  span {
    display: block;
    font-size: var(--fs-micro);
    color: #9ecae8;
    margin-bottom: 4px;
  }

  strong {
    font-size: var(--fs-label);
    font-weight: 800;
    color: #d8eeff;
  }
}

.level--low strong { color: #6ee7b7; }
.level--medium strong { color: #fcd34d; }
.level--high strong { color: #fca5a5; }

.trend--up strong { color: #6ee7b7; }
.trend--down strong { color: #fca5a5; }
.trend--flat strong { color: #93c5fd; }

.stu-mod-mental__chart {
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 8px;
  border-radius: 6px;
  background: rgba(167, 139, 250, 0.08);
  border: 1px solid rgba(167, 139, 250, 0.2);

  .label {
    font-size: var(--fs-micro);
    font-weight: 700;
    color: #e9d5ff;
    margin-bottom: 4px;
  }

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
  }
}

.stu-mod-mental__records {
  min-height: 0;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);

  h4 {
    margin: 0 0 8px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  li {
    padding: 6px 8px;
    border-radius: 6px;
    background: rgba(2, 20, 50, 0.5);
    border: 1px solid rgba(0, 200, 255, 0.08);
  }

  header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    font-size: var(--fs-micro);

    strong { color: #7ff6ff; }
    em { font-style: normal; color: #9ecae8; }
    span {
      margin-left: auto;
      padding: 1px 6px;
      border-radius: 999px;
      background: rgba(251, 191, 36, 0.15);
      color: #fcd34d;
      font-weight: 600;
    }
  }

  p {
    margin: 0;
    font-size: var(--fs-meta);
    color: #d8eeff;
    line-height: 1.4;
  }
}

.stu-mod-mental__dims {
  grid-column: 1 / -1;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.15);
  border: 1px solid rgba(0, 200, 255, 0.1);

  h4 {
    margin: 0 0 8px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }
}

.stu-mod-mental__radar-mini {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.dim {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;

  .bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.5);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
    }
  }

  span {
    font-size: var(--fs-micro);
    color: #9ecae8;
    text-align: center;
  }

  strong {
    font-family: var(--student-font-number);
    font-size: var(--fs-label);
    color: #7ff6ff;
  }
}
</style>
