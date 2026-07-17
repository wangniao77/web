<script setup lang="ts">
/**
 * GPA 详情页 · 课程类别 GPA 雷达
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CategoryStatDTO } from '../../_shared/gpa-data'

const props = defineProps<{
  data: CategoryStatDTO[]
}>()

const indicators = computed(() =>
  props.data.map((d) => ({ name: d.categoryLabel, max: 4.0 }),
  ),
)

const option = computed<EChartsOption>(() => ({
  grid: { ...CHART_GRID.pie, top: 4 },
  tooltip: {
    trigger: 'item',
    formatter: (p: unknown) => {
      const arr = p as { value: number[]; name: string }
      const rows = props.data.map((d, i) =>
        `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${CHART_COLORS.cyan};margin-right:4px"></span>` +
        `${d.categoryLabel}：<b>${arr.value[i].toFixed(2)}</b> GPA · ${d.averageScore} 分 · ${d.courseCount} 门`,
      )
      return `<div style="line-height:1.6">${rows.join('<br/>')}</div>`
    },
  },
  radar: {
    indicator: indicators.value,
    center: ['50%', '52%'],
    radius: '64%',
    shape: 'polygon',
    splitNumber: 4,
    name: {
      color: '#9eefff',
      fontSize: 13,
      fontWeight: 600,
    },
    nameGap: 6,
    splitLine: {
      lineStyle: { color: 'rgba(0, 212, 255, 0.18)' },
    },
    splitArea: {
      areaStyle: {
        color: ['rgba(0, 184, 255, 0.02)', 'rgba(0, 184, 255, 0.05)'],
      },
    },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
  },
  series: [
    {
      name: '类别 GPA',
      type: 'radar',
      symbol: 'circle',
      symbolSize: 6,
      data: [
        {
          name: 'GPA',
          value: props.data.map((d) => d.gpa),
          lineStyle: { color: CHART_COLORS.cyan, width: 2 },
          itemStyle: { color: CHART_COLORS.cyan },
          areaStyle: {
            color: {
              type: 'radial', x: 0.5, y: 0.5, r: 0.7,
              colorStops: [
                { offset: 0, color: 'rgba(0, 229, 255, 0.32)' },
                { offset: 1, color: 'rgba(0, 229, 255, 0.04)' },
              ],
            },
          },
        },
      ],
    },
  ],
}))

const strongCategory = computed(() => {
  return [...props.data].sort((a, b) => b.gpa - a.gpa)[0]
})
const weakCategory = computed(() => {
  return [...props.data].sort((a, b) => a.gpa - b.gpa)[0]
})
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">课程类别 GPA 雷达</h3>
      <span class="chart-card__sub">反映各学科能力分布</span>
    </header>
    <div class="chart-card__body">
      <ChartContainer :option="option" />
    </div>
    <footer class="chart-card__foot">
      <div class="foot-item strong">
        <span class="foot-label">擅长</span>
        <span class="foot-val">{{ strongCategory.categoryLabel }}</span>
        <span class="foot-num">{{ strongCategory.gpa.toFixed(2) }}</span>
      </div>
      <div class="foot-item weak">
        <span class="foot-label">潜力</span>
        <span class="foot-val">{{ weakCategory.categoryLabel }}</span>
        <span class="foot-num">{{ weakCategory.gpa.toFixed(2) }}</span>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
}

.chart-card__foot {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 6px;
  border-top: 1px dashed rgba(0, 212, 255, 0.1);
}

.foot-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 184, 255, 0.08);

  &.strong { border-color: rgba(52, 211, 153, 0.3); background: rgba(52, 211, 153, 0.06); }
  &.weak   { border-color: rgba(240, 192, 64, 0.3); background: rgba(240, 192, 64, 0.06); }
}

.foot-label {
  color: rgba(184, 236, 255, 0.6);
}

.foot-val {
  color: #f4fbff;
  font-weight: 600;
  flex: 1;
}

.foot-num {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 14px;
  font-weight: 700;

  .strong & { color: #34d399; }
  .weak &   { color: #f0c040; }
}
</style>
