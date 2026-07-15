<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { AcademicDevVM, CreditProgressVM, FailedCourseVM, PersonalInfoVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  academic: AcademicDevVM
  credit: CreditProgressVM
  failedCritical: FailedCourseVM[]
  profile: PersonalInfoVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const gpaOption = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.line, left: 32, right: 8, top: 6, bottom: 18 },
  tooltip: { trigger: 'axis', confine: true },
  xAxis: {
    type: 'category',
    data: props.academic.semesters,
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    axisLine: { lineStyle: { color: 'rgba(80,180,255,0.25)' } },
  },
  yAxis: {
    type: 'value',
    min: 3,
    max: 4,
    axisLabel: { color: '#9ecae8', fontSize: CHART_FONT.axis - 2 },
    splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
  },
  series: [{
    type: 'line',
    data: props.academic.gpaValues,
    smooth: true,
    symbol: 'circle',
    symbolSize: 5,
    lineStyle: { color: CHART_COLORS.blue, width: 2 },
    areaStyle: { color: 'rgba(0, 184, 255, 0.14)' },
  }],
}))
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard
      :index="2"
      title="学业成长信息"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <div class="stu-mod-academic">
        <div class="stu-mod-academic__top">
          <div class="stu-mod-academic__gpa">
            <strong>{{ academic.gpa }}</strong>
            <span>GPA</span>
            <em>班排 {{ academic.classRank }}/{{ academic.classTotal }}</em>
          </div>
          <div class="stu-mod-academic__chart">
            <ChartContainer :option="gpaOption" />
          </div>
          <div class="stu-mod-academic__credit">
            <div class="stu-mod-academic__ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="48" class="track" />
                <circle
                  cx="60" cy="60" r="48"
                  class="progress"
                  :style="{ strokeDashoffset: 301 - (301 * credit.earnedPercent) / 100 }"
                />
              </svg>
              <div class="text">
                <strong>{{ credit.earnedPercent }}%</strong>
                <span>学分完成</span>
              </div>
            </div>
            <p>{{ credit.earned }}/{{ credit.required }} 学分</p>
          </div>
        </div>

        <div v-if="profile.thesisAdvisor" class="stu-mod-academic__thesis">
          <span>论文导师</span>
          <strong>{{ profile.thesisAdvisor }}</strong>
          <em>{{ profile.thesisStatus }}</em>
        </div>

        <div class="stu-mod-academic__goals">
          <div v-for="g in academic.yearlyGoals" :key="g.year" class="stu-mod-academic__goal">
            <header>
              <strong>{{ g.year }}</strong>
              <span>{{ g.percent }}%</span>
            </header>
            <p>{{ g.goal }}</p>
            <div class="bar"><i :style="{ width: `${g.percent}%` }" /></div>
          </div>
        </div>

        <div class="stu-mod-academic__bottom">
          <div class="stu-mod-academic__courses">
            <h4>本学期课程</h4>
            <ul>
              <li v-for="c in academic.currentCourses" :key="c.name">
                <span>{{ c.name }}</span>
                <em>{{ c.type }} · {{ c.credit }}学分</em>
              </li>
            </ul>
          </div>

          <div class="stu-mod-academic__failed">
            <h4 class="warn">影响毕业 / 学业进度</h4>
            <ul v-if="failedCritical.length">
              <li v-for="f in failedCritical" :key="f.name" class="critical">
                {{ f.name }} <em>{{ f.score }}分 · 必修</em>
              </li>
            </ul>
            <p v-else class="empty">暂无关键挂科</p>

            <h4>选修挂科</h4>
            <ul v-if="academic.failedElective.length">
              <li v-for="f in academic.failedElective" :key="f.name">
                {{ f.name }} <em>{{ f.score }}分</em>
              </li>
            </ul>
            <p v-else class="empty">暂无选修挂科</p>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-mod-academic {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stu-mod-academic__top {
  display: grid;
  grid-template-columns: 72px 1fr 80px;
  gap: 8px;
  align-items: center;
  min-height: 72px;
}

.stu-mod-academic__gpa {
  text-align: center;

  strong {
    display: block;
    font-family: var(--student-font-number);
    font-size: 28px;
    color: #7ff6ff;
    line-height: 1;
  }

  span, em {
    display: block;
    font-size: var(--fs-micro);
    color: #9ecae8;
    font-style: normal;
  }
}

.stu-mod-academic__chart {
  min-height: 0;
  height: 72px;

  :deep(.chart-container) { height: 100%; }
}

.stu-mod-academic__credit {
  text-align: center;

  p {
    margin: 4px 0 0;
    font-size: var(--fs-micro);
    color: #9ecae8;
  }
}

.stu-mod-academic__ring {
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto;

  svg { width: 100%; height: 100%; transform: rotate(-90deg); }

  .track { fill: none; stroke: rgba(0, 80, 160, 0.4); stroke-width: 8; }
  .progress {
    fill: none;
    stroke: #39e6ff;
    stroke-width: 8;
    stroke-linecap: round;
    stroke-dasharray: 301;
  }

  .text {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    strong { font-size: var(--fs-label); color: #7ff6ff; }
    span { font-size: var(--fs-micro); color: #8ec8e8; }
  }
}

.stu-mod-academic__thesis {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  background: rgba(167, 139, 250, 0.12);
  border: 1px solid rgba(167, 139, 250, 0.3);
  font-size: var(--fs-meta);

  span { color: #9ecae8; }
  strong { color: #e9d5ff; }
  em { color: #c4b5fd; font-style: normal; margin-left: auto; }
}

.stu-mod-academic__goals {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.stu-mod-academic__goal {
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);

  header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;

    strong { font-size: var(--fs-meta); color: #7ff6ff; }
    span { font-size: var(--fs-micro); color: #ffd166; font-weight: 700; }
  }

  p {
    margin: 0 0 6px;
    font-size: var(--fs-micro);
    color: #9ecae8;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .bar {
    height: 4px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.5);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #39e6ff, #00b8ff);
    }
  }
}

.stu-mod-academic__bottom {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stu-mod-academic__courses,
.stu-mod-academic__failed {
  min-height: 0;
  overflow: auto;

  h4 {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;

    &.warn { color: #fca5a5; }
  }

  ul {
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
  }

  li {
    font-size: var(--fs-meta);
    color: #d8eeff;
    padding: 4px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.08);

    em {
      font-style: normal;
      color: #9ecae8;
      margin-left: 4px;
    }

    &.critical { color: #fca5a5; font-weight: 600; }
  }

  .empty {
    margin: 0 0 8px;
    font-size: var(--fs-micro);
    color: #6a9ec0;
  }
}

.stu-mod-academic__courses li {
  display: flex;
  justify-content: space-between;
  gap: 6px;
}
</style>
