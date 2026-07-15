<script setup lang="ts">
import { computed, ref } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import PanelSlideCarousel from '@/components/college/PanelSlideCarousel.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type {
  AnnualAssessmentVM,
  CompetitionVM,
  GrowthPortraitVM,
  HealthVM,
  HighlightItemVM,
  MentalGrowthVM,
  PersonalInfoVM,
  TimelineTermVM,
} from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  profile: PersonalInfoVM
  timeline: TimelineTermVM[]
  annualAssessments: AnnualAssessmentVM[]
  scholarships: Array<{ name: string; year: string }>
  competition: CompetitionVM
  highlights: HighlightItemVM[]
  mentalGrowth: MentalGrowthVM
  growthPortrait: GrowthPortraitVM
  health: HealthVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const avatarError = ref(false)

const slides = [
  { id: 'basic', label: '基础信息' },
  { id: 'quality', label: '综合素质与荣誉' },
  { id: 'mental', label: '心理与成长趋势' },
]

const mentalClass: Record<string, string> = {
  low: 'tag--low',
  medium: 'tag--medium',
  high: 'tag--high',
}

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

const wuyuLabels = ['德', '智', '体', '美', '劳']
const wuyuColors = ['#39e6ff', '#a78bfa', '#34d399', '#fbbf24', '#f472b6']

const assessmentOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, left: 36, right: 8, top: 8, bottom: 22 },
  tooltip: { trigger: 'axis', confine: true },
  xAxis: {
    type: 'category',
    data: props.annualAssessments.map((a) => a.year.replace('-', '\n')),
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
    barMaxWidth: 24,
  }],
}))

const wuyuTrendOption = computed<EChartsOption>(() => {
  const terms = props.timeline.map((t) => t.term)
  const keys = ['de', 'zhi', 'ti', 'mei', 'lao'] as const
  return {
    grid: { ...CHART_GRID.line, left: 28, right: 6, top: 22, bottom: 18 },
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
</script>

<template>
  <StudentPanelBorder variant="8">
    <CollegePanelCard
      :index="1"
      title="学生成长档案"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <PanelSlideCarousel :slides="slides" :interval="10000" class="stu-archive-carousel">
        <template #basic>
          <div class="stu-slide stu-slide--basic">
            <div class="stu-slide__hero">
              <div class="stu-slide__photo">
                <img
                  v-if="profile.avatarUrl && !avatarError"
                  :src="profile.avatarUrl"
                  :alt="profile.name"
                  @error="avatarError = true"
                >
                <div v-else class="stu-slide__avatar-fallback">
                  {{ profile.name.slice(0, 1) }}
                </div>
                <span
                  class="stu-slide__mental"
                  :class="mentalClass[profile.mentalLevelCode || 'medium']"
                >
                  {{ profile.mentalLevel || '—' }}
                </span>
              </div>
              <div class="stu-slide__identity">
                <h3>{{ profile.name }}</h3>
                <span>{{ profile.studentId }}</span>
                <em>{{ profile.className }}</em>
                <p class="stu-slide__trend" :class="trendClass[profile.growthTrend || 'stable']">
                  {{ trendLabel[profile.growthTrend || 'stable'] }}
                </p>
              </div>
            </div>
            <div class="stu-slide__grid">
              <div><label>学院</label><span>{{ profile.college }}</span></div>
              <div><label>专业</label><span>{{ profile.major }}</span></div>
              <div><label>年级</label><span>{{ profile.grade }}</span></div>
              <div><label>政治面貌</label><span>{{ profile.politicalStatus || '—' }}</span></div>
              <div><label>班主任</label><span>{{ profile.mentor }}</span></div>
              <div><label>辅导员</label><span>{{ profile.counselor }}</span></div>
              <div><label>联系电话</label><span>{{ profile.phone || '—' }}</span></div>
              <div><label>宿舍</label><span>{{ profile.dormitory || '—' }}</span></div>
              <div class="wide"><label>家庭住址</label><span class="wrap">{{ profile.address || '—' }}</span></div>
              <div class="wide"><label>家庭情况</label><span class="wrap">{{ profile.familySituation || '—' }}</span></div>
              <div><label>监护人</label><span>{{ profile.guardianName || '—' }}</span></div>
              <div><label>监护人电话</label><span>{{ profile.guardianPhone || '—' }}</span></div>
              <div>
                <label>经济困难</label>
                <span :class="profile.economicHardship ? 'tag--warn' : 'tag--ok'">
                  {{ profile.economicHardship ? '是' : '否' }}
                </span>
              </div>
              <div><label>在校状态</label><span>{{ profile.onCampusStatus || '在校' }}</span></div>
              <div><label>论文导师</label><span>{{ profile.thesisAdvisor || '—' }}</span></div>
              <div><label>论文进度</label><span>{{ profile.thesisStatus || '—' }}</span></div>
            </div>
          </div>
        </template>

        <template #quality>
          <div class="stu-slide stu-slide--quality">
            <div class="stu-slide__chart-box">
              <span class="label">历年综合测评</span>
              <ChartContainer :option="assessmentOption" class="chart-sm" />
            </div>
            <div class="stu-slide__chart-box">
              <span class="label">德智体美劳成长轴线</span>
              <ChartContainer :option="wuyuTrendOption" class="chart-sm" />
            </div>
            <div class="stu-slide__dual">
              <div>
                <h5>奖学金</h5>
                <ul>
                  <li v-for="s in scholarships" :key="s.name + s.year">
                    <strong>{{ s.name }}</strong><em>{{ s.year }}</em>
                  </li>
                </ul>
              </div>
              <div>
                <h5>竞赛 · 科研 · 获奖</h5>
                <p class="stats">
                  竞赛 <b>{{ competition.awardCount }}</b>
                  科研 <b>{{ competition.researchCount }}</b>
                  创新 <b>{{ competition.innovationCount }}</b>
                </p>
                <ul>
                  <li v-for="h in highlights" :key="h.id">
                    {{ h.label }} <em>{{ h.date }}</em>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </template>

        <template #mental>
          <div class="stu-slide stu-slide--mental">
            <div class="stu-slide__status-row">
              <div :class="mentalClass[profile.mentalLevelCode || 'medium']">
                <label>心理分级</label>
                <strong>{{ profile.mentalLevel || '—' }}</strong>
              </div>
              <div :class="trendClass[profile.growthTrend || 'stable']">
                <label>成长趋势</label>
                <strong>{{ trendLabel[profile.growthTrend || 'stable'] }}</strong>
              </div>
              <div>
                <label>帮扶状态</label>
                <strong>{{ mentalGrowth.supportStatus || '—' }}</strong>
              </div>
              <div>
                <label>心理健康</label>
                <strong>{{ health.mentalHealth }}</strong>
              </div>
            </div>
            <div class="stu-slide__records">
              <h5>心理关注 · 谈话记录</h5>
              <article v-for="(r, idx) in mentalGrowth.records" :key="idx">
                <header>
                  <strong>{{ r.date }}</strong>
                  <em>{{ r.person }}</em>
                  <span>{{ r.level }}</span>
                </header>
                <p>{{ r.content }}</p>
              </article>
            </div>
            <div class="stu-slide__dims">
              <h5>当前五维得分</h5>
              <div class="dim-bars">
                <div
                  v-for="(ind, i) in growthPortrait.indicators"
                  :key="ind.name"
                  class="dim"
                >
                  <span>{{ ind.name }}</span>
                  <div class="bar"><i :style="{ width: `${growthPortrait.personal[i]}%`, background: wuyuColors[i] }" /></div>
                  <strong>{{ growthPortrait.personal[i] }}</strong>
                </div>
              </div>
            </div>
          </div>
        </template>
      </PanelSlideCarousel>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-archive-carousel {
  height: 100%;
  min-height: 0;
}

.stu-slide {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.stu-slide__hero {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 12px;
  margin-bottom: 10px;
}

.stu-slide__photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;

  img,
  .stu-slide__avatar-fallback {
    width: 92px;
    height: 112px;
    border-radius: 8px;
    object-fit: cover;
    border: 2px solid rgba(57, 230, 255, 0.45);
    box-shadow: 0 0 14px rgba(0, 180, 255, 0.28);
  }

  .stu-slide__avatar-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 34px;
    font-weight: 800;
    color: #7ff6ff;
    background: linear-gradient(145deg, rgba(0, 80, 160, 0.5), rgba(2, 20, 50, 0.9));
  }
}

.stu-slide__mental {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: var(--fs-micro);
  font-weight: 700;
  white-space: nowrap;

  &.tag--low { background: rgba(52, 211, 153, 0.2); color: #6ee7b7; border: 1px solid rgba(52, 211, 153, 0.4); }
  &.tag--medium { background: rgba(251, 191, 36, 0.18); color: #fcd34d; border: 1px solid rgba(251, 191, 36, 0.4); }
  &.tag--high { background: rgba(248, 113, 113, 0.18); color: #fca5a5; border: 1px solid rgba(248, 113, 113, 0.4); }
}

.stu-slide__identity {
  min-width: 0;

  h3 {
    margin: 0;
    font-size: var(--fs-highlight);
    color: #f4fbff;
    font-weight: 800;
  }

  span {
    display: block;
    font-size: var(--fs-meta);
    color: #7ff6ff;
    font-family: var(--student-font-number);
  }

  em {
    display: block;
    font-style: normal;
    font-size: var(--fs-meta);
    color: #9ecae8;
  }
}

.stu-slide__trend {
  margin: 6px 0 0;
  font-size: var(--fs-meta);
  font-weight: 700;

  &.trend--up { color: #6ee7b7; }
  &.trend--down { color: #fca5a5; }
  &.trend--flat { color: #93c5fd; }
}

.stu-slide__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px 12px;

  div {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }

  label {
    font-size: var(--fs-micro);
    color: #6a9ec0;
  }

  span {
    font-size: var(--fs-label);
    color: #d8eeff;
    line-height: 1.35;

    &.wrap {
      white-space: normal;
      word-break: break-all;
    }
  }

  .wide { grid-column: 1 / -1; }
}

.tag--warn { color: #fca5a5 !important; font-weight: 700; }
.tag--ok { color: #6ee7b7 !important; font-weight: 700; }

.stu-slide__chart-box {
  margin-bottom: 8px;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.14);

  .label {
    display: block;
    font-size: var(--fs-micro);
    font-weight: 700;
    color: #b8ecff;
    margin-bottom: 4px;
  }

  .chart-sm { height: 120px; }
}

.stu-slide__dual {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  h5 {
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
    border-bottom: 1px solid rgba(0, 200, 255, 0.08);
    line-height: 1.35;

    strong { color: #ffd166; }
    em { font-style: normal; color: #9ecae8; margin-left: 6px; }
  }

  .stats {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #9ecae8;

    b {
      color: #7ff6ff;
      font-family: var(--student-font-number);
      margin: 0 8px 0 4px;
    }
  }
}

.stu-slide__status-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 8px;

  > div {
    padding: 8px;
    border-radius: 6px;
    background: rgba(0, 55, 110, 0.22);
    border: 1px solid rgba(0, 200, 255, 0.12);
    text-align: center;

    label {
      display: block;
      font-size: var(--fs-micro);
      color: #9ecae8;
      margin-bottom: 4px;
    }

    strong {
      font-size: var(--fs-label);
      color: #eef9ff;
      font-weight: 800;
    }

    &.tag--low strong { color: #6ee7b7; }
    &.tag--medium strong { color: #fcd34d; }
    &.tag--high strong { color: #fca5a5; }
    &.trend--up strong { color: #6ee7b7; }
    &.trend--down strong { color: #fca5a5; }
    &.trend--flat strong { color: #93c5fd; }
  }
}

.stu-slide__records {
  margin-bottom: 8px;

  h5 {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }

  article {
    padding: 6px 8px;
    margin-bottom: 6px;
    border-radius: 6px;
    background: rgba(2, 20, 50, 0.45);
    border: 1px solid rgba(0, 200, 255, 0.1);
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

.stu-slide__dims h5 {
  margin: 0 0 6px;
  font-size: var(--fs-meta);
  color: #b8ecff;
  font-weight: 700;
}

.dim-bars {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dim {
  display: grid;
  grid-template-columns: 72px 1fr 36px;
  gap: 8px;
  align-items: center;

  span {
    font-size: var(--fs-micro);
    color: #9ecae8;
  }

  .bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.5);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
    }
  }

  strong {
    text-align: right;
    font-family: var(--student-font-number);
    font-size: var(--fs-label);
    color: #7ff6ff;
  }
}
</style>
