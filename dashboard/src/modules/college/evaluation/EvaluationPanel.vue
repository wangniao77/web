<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID, AXIS_LABEL } from '@/styles/echarts-theme'
import type { EvaluationOverviewVM } from '@/types/view/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: EvaluationOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const gaugeOption = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 225,
      endAngle: -45,
      min: 0,
      max: 100,
      radius: '82%',
      center: ['50%', '52%'],
      progress: {
        show: true,
        width: 8,
        itemStyle: { color: CHART_COLORS.gold },
      },
      axisLine: {
        lineStyle: { width: 8, color: [[1, 'rgba(240, 192, 64, 0.12)']] },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        fontSize: CHART_FONT.gaugeCompact,
        fontWeight: 700,
        fontFamily: 'DIN Alternate, monospace',
        color: CHART_COLORS.gold,
        offsetCenter: [0, '2%'],
      },
      data: [{ value: props.data.developmentIndex }],
    },
  ],
}))

const barOption = computed<EChartsOption>(() => ({
  grid: CHART_GRID.barH,
  xAxis: { type: 'value', max: 100, show: false },
  yAxis: {
    type: 'category',
    data: props.data.dimensions.map((d) => d.name).reverse(),
    axisLabel: { ...AXIS_LABEL, width: 64, overflow: 'truncate' },
    axisLine: { show: false },
    axisTick: { show: false },
  },
  series: [
    {
      type: 'bar',
      data: props.data.dimensions.map((d) => d.score).reverse(),
      barWidth: 10,
      label: { show: true, position: 'right', distance: 4, color: CHART_COLORS.blue, fontSize: CHART_FONT.label },
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
          colorStops: [
            { offset: 0, color: 'rgba(0, 184, 255, 0.35)' },
            { offset: 1, color: CHART_COLORS.blue },
          ],
        },
        borderRadius: [0, 3, 3, 0],
      },
    },
  ],
}))
</script>

<template>
  <CollegePanelCard
    :index="7"
    icon="icon-ranking"
    title="综合评价与改进建议"
    show-more
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="eval-panel">
      <div class="gauge-box">
        <ChartContainer :option="gaugeOption" />
        <span class="gauge-label">综合指数</span>
      </div>
      <div class="bar-box">
        <span class="section-label">评价维度 TOP5</span>
        <ChartContainer :option="barOption" />
      </div>
      <div class="suggestions">
        <span class="section-label">改进建议 TOP3</span>
        <div class="suggestion-btns">
          <button
            v-for="(s, i) in data.suggestions"
            :key="i"
            type="button"
            class="suggestion-btn"
          >{{ s }}</button>
        </div>
        <div class="qr-box">
          <div class="qr-inner">
            <svg class="qr-svg" aria-hidden="true">
              <use href="/icons.svg#icon-qr" />
            </svg>
            <span class="qr-text">扫码反馈</span>
          </div>
        </div>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.eval-panel {
  height: 100%;
  display: grid;
  grid-template-columns: 118px 1fr 146px;
  gap: 12px;
}

.gauge-box {
  position: relative;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background:
    radial-gradient(circle at 50% 46%, rgba(240, 192, 64, 0.09), transparent 66%),
    rgba(255, 255, 255, 0.015);
}

.gauge-label {
  position: absolute;
  bottom: 8%;
  left: 50%;
  transform: translateX(-50%);
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.56);
  white-space: nowrap;
}

.bar-box,
.suggestions {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.section-label {
  font-size: $college-fs-label;
  margin-bottom: 6px;
  padding-left: 8px;
  border-left: 2px solid #f4c84f;
}

.suggestion-btns {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.suggestion-btn {
  padding: 7px 9px;
  font-size: $college-fs-meta;
  color: rgba(220, 232, 248, 0.72);
  background:
    linear-gradient(90deg, rgba(240, 192, 64, 0.075), rgba(255, 255, 255, 0.018));
  border: 1px solid rgba(240, 192, 64, 0.12);
  border-radius: 7px;
  text-align: left;
  cursor: pointer;
  line-height: 1.4;
  transition: border-color $transition-base, color $transition-base, background $transition-base;

  &:hover {
    border-color: rgba(240, 192, 64, 0.34);
    color: #f4c84f;
    background: rgba(240, 192, 64, 0.08);
  }
}

.qr-box {
  margin-top: 3px;
  display: flex;
  justify-content: center;
}

.qr-inner {
  width: 58px;
  height: 58px;
  border: 1px solid rgba(102, 217, 255, 0.14);
  background:
    linear-gradient(180deg, rgba(0, 184, 255, 0.055), rgba(255, 255, 255, 0.018));
  border-radius: 7px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
}

.qr-svg {
  width: 20px;
  height: 20px;
  color: #42d8ff;
  opacity: 0.72;
}

.qr-text {
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.56);
}
</style>
