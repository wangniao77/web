<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { TeacherAnalyticsDetailVM } from '@/types/college/view/teacher-analytics'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: TeacherAnalyticsDetailVM
}>()

const titleBarOption = computed<EChartsOption>(() => {
  const items = props.data.titleStructure
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value',
      max: Math.ceil(maxVal * 1.15),
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.title),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map((i) => i.count),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        formatter: '{c}人',
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: '#1a8cff' },
            { offset: 1, color: '#5cecff' },
          ],
        },
      },
    }],
  }
})

const serviceMonthOption = computed<EChartsOption>(() => {
  const items = props.data.publicServiceAnalysis.byMonth
  return {
    grid: { left: 8, right: 8, top: 28, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: {
      top: 0,
      textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend },
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: items.map((i) => `${i.month}月`),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: [
      {
        type: 'value',
        name: '次',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
      },
      {
        type: 'value',
        name: '小时',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '次数',
        type: 'bar',
        data: items.map((i) => i.count),
        itemStyle: { color: '#39e6ff' },
      },
      {
        name: '时长',
        type: 'line',
        yAxisIndex: 1,
        data: items.map((i) => i.hours),
        itemStyle: { color: '#ffd56a' },
      },
    ],
  }
})
</script>

<template>
  <div class="teacher-detail">
    <div class="cdm-stat-row">
      <div class="cdm-stat"><span>专任教师</span><strong>{{ data.summary.totalTeachers }}<small>人</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>博士占比</span><strong>{{ data.summary.phdRatio }}<small>%</small></strong></div>
      <div class="cdm-stat"><span>高级职称</span><strong>{{ data.summary.seniorTitleRatio }}<small>%</small></strong></div>
      <div class="cdm-stat cdm-stat--green"><span>平均课时</span><strong>{{ data.summary.avgTeachingHours }}<small>学时</small></strong></div>
      <div class="cdm-stat cdm-stat--blue"><span>教师标兵</span><strong>{{ data.summary.modelTeacherCount }}<small>人</small></strong></div>
      <div class="cdm-stat cdm-stat--orange"><span>年度预警</span><strong>{{ data.summary.warningCount }}<small>人</small></strong></div>
      <div class="cdm-stat">
        <span>公共服务</span>
        <strong>{{ data.summary.publicService.count }}<small>次</small>/{{ data.summary.publicService.hours }}<small>小时</small></strong>
      </div>
    </div>

    <div class="teacher-detail__section">
      <h3>师资结构（年龄 / 学历 / 职称 / 学缘）</h3>
      <div class="teacher-detail__structure">
        <div
          v-for="(group, key) in {
            年龄: data.structure.age,
            学历: data.structure.education,
            职称: data.structure.title,
            学缘: data.structure.academicOrigin,
          }"
          :key="key"
          class="teacher-detail__structure-card"
        >
          <h4>{{ key }}结构</h4>
          <ul>
            <li v-for="item in group" :key="item.label">
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}人 · {{ item.ratio }}%</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="teacher-detail__columns">
      <div class="teacher-detail__section">
        <h3>职称结构</h3>
        <div class="teacher-detail__chart teacher-detail__chart--short">
          <ChartContainer :option="titleBarOption" />
        </div>
      </div>
      <div class="teacher-detail__section">
        <h3>平均学年课时明细</h3>
        <ul class="teacher-detail__list">
          <li v-for="item in data.teachingHoursDetail" :key="item.name">
            <strong>{{ item.name }}</strong>
            <span>{{ item.title }} · {{ item.major }}</span>
            <em>{{ item.hours }}学时</em>
          </li>
        </ul>
      </div>
    </div>

    <div class="teacher-detail__columns">
      <div class="teacher-detail__section">
        <h3>教师标兵名单</h3>
        <ul class="teacher-detail__list">
          <li v-for="item in data.modelTeachers" :key="`${item.name}-${item.year}`">
            <strong>{{ item.name }}</strong>
            <span>{{ item.year }} · {{ item.title }} · {{ item.major }}</span>
            <em>{{ item.highlight }}</em>
          </li>
        </ul>
      </div>
      <div class="teacher-detail__section">
        <h3>年度考核预警</h3>
        <ul class="teacher-detail__list teacher-detail__list--warn">
          <li v-for="item in data.warningSamples" :key="item.name">
            <strong>{{ item.name }}</strong>
            <span>{{ item.type }} · {{ item.title }} · {{ item.major }}</span>
            <em>{{ item.reason }} · {{ item.status }}</em>
          </li>
        </ul>
      </div>
    </div>

    <div class="teacher-detail__section">
      <h3>公共服务分析</h3>
      <div class="teacher-detail__service-grid">
        <div>
          <h4>按教师</h4>
          <ul class="teacher-detail__list">
            <li v-for="item in data.publicServiceAnalysis.byTeacher" :key="item.name">
              <strong>{{ item.name }}</strong>
              <em>{{ item.count }}次 / {{ item.hours }}小时</em>
            </li>
          </ul>
        </div>
        <div>
          <h4>按类型</h4>
          <ul class="teacher-detail__list">
            <li v-for="item in data.publicServiceAnalysis.byType" :key="item.type">
              <strong>{{ item.type }}</strong>
              <em>{{ item.count }}次 / {{ item.hours }}小时</em>
            </li>
          </ul>
        </div>
        <div class="teacher-detail__service-chart">
          <h4>按月份</h4>
          <div class="teacher-detail__chart">
            <ChartContainer :option="serviceMonthOption" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.teacher-detail__section {
  margin-top: 16px;

  h3 {
    margin: 0 0 10px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }

  h4 {
    margin: 0 0 8px;
    color: #9fe8ff;
    font-size: 24px;
    font-weight: 700;
  }
}

.teacher-detail__structure {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.teacher-detail__structure-card {
  padding: 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 50, 100, 0.2);

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 4px 0;
    color: #c6e6ff;
    font-size: 24px;

    strong {
      color: #7fe9ff;
      white-space: nowrap;
    }
  }
}

.teacher-detail__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.teacher-detail__chart {
  height: 200px;

  &--short {
    height: 160px;
  }
}

.teacher-detail__list {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: grid;
    gap: 2px;
    padding: 8px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.1);
    color: #9ecae8;
    font-size: 24px;

    strong {
      color: #eaf7ff;
      font-size: 24px;
    }

    em {
      color: #7fe9ff;
      font-style: normal;
    }
  }

  &--warn em {
    color: #ff9b6a;
  }
}

.teacher-detail__service-grid {
  display: grid;
  grid-template-columns: 0.9fr 0.9fr 1.4fr;
  gap: 12px;
}

.teacher-detail__service-chart {
  min-width: 0;
}

@media (max-width: 1100px) {
  .teacher-detail__structure,
  .teacher-detail__columns,
  .teacher-detail__service-grid {
    grid-template-columns: 1fr;
  }
}
</style>
