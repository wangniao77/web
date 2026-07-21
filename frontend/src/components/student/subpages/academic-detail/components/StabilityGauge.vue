<script setup lang="ts">
/**
 * 学业稳定性分析
 * 学习稳定指数仪表盘 + 子指标（GPA波动 / 不及格 / 重修 / 低分课程）
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import ChartCard from './ChartCard.vue'

const props = defineProps<{
  gpaValues: number[]
  failCount: number
  retakeCount: number
  lowScoreCount: number
}>()

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}

const gpaStd = computed(() => Math.round(stdDev(props.gpaValues) * 100) / 100)
const volatility = computed(() => {
  const v = gpaStd.value
  if (v <= 0.15) return '低'
  if (v <= 0.35) return '中'
  return '高'
})

const index = computed(() => {
  const raw = 100 - gpaStd.value * 30 - props.failCount * 10 - props.retakeCount * 8 - props.lowScoreCount * 2.5
  return Math.max(0, Math.min(100, Math.round(raw)))
})

const level = computed(() => {
  const v = index.value
  if (v >= 85) return { label: '优秀', risk: '无', color: '#34d399' }
  if (v >= 70) return { label: '良好', risk: '低', color: '#66d9ff' }
  if (v >= 50) return { label: '中等', risk: '中', color: '#f0c040' }
  return { label: '偏弱', risk: '高', color: '#f87171' }
})

const option = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      center: ['50%', '46%'],
      radius: '68%',
      startAngle: 210,
      endAngle: -30,
      min: 0,
      max: 100,
      splitNumber: 5,
      progress: { show: true, width: 14, roundCap: true, itemStyle: { color: level.value.color } },
      pointer: { width: 5, length: '40%', itemStyle: { color: level.value.color } },
      anchor: { show: true, size: 10, itemStyle: { color: level.value.color } },
      axisLine: { lineStyle: { width: 14, color: [[1, 'rgba(0, 60, 120, 0.45)']] } },
      axisTick: { distance: -14, length: 5, lineStyle: { color: 'rgba(102,217,255,0.3)' } },
      splitLine: { distance: -14, length: 12, lineStyle: { color: 'rgba(102,217,255,0.45)', width: 2 } },
      axisLabel: { distance: -26, color: '#6f9bbd', fontSize: 11 },
      title: { show: false },
      detail: {
        valueAnimation: true,
        offsetCenter: [0, '42%'],
        fontSize: CHART_FONT.gaugeCompact + 8,
        fontFamily: 'DIN Alternate, sans-serif',
        fontWeight: 'bolder',
        color: level.value.color,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowBlur: 12,
        formatter: '{value}',
      },
      data: [{ value: index.value }],
    },
  ],
}))
</script>

<template>
  <ChartCard title="学业稳定性分析" :sub="`稳定指数 · ${level.label}`">
    <ChartContainer :option="option" />
    <template #footer>
      <div class="metrics">
        <div class="metric">
          <span class="metric__label">GPA 波动</span>
          <span class="metric__value">{{ volatility }}<small>σ {{ gpaStd }}</small></span>
        </div>
        <div class="metric">
          <span class="metric__label">不及格次数</span>
          <span class="metric__value" :class="{ 'is-alert': failCount > 0 }">{{ failCount }}</span>
        </div>
        <div class="metric">
          <span class="metric__label">重修次数</span>
          <span class="metric__value" :class="{ 'is-alert': retakeCount > 0 }">{{ retakeCount }}</span>
        </div>
        <div class="metric">
          <span class="metric__label">低分课程</span>
          <span class="metric__value" :class="{ 'is-alert': lowScoreCount > 0 }">{{ lowScoreCount }}</span>
        </div>
        <div class="metric metric--risk">
          <span class="metric__label">风险</span>
          <span class="metric__value" :style="{ color: level.color }">{{ level.risk }}</span>
        </div>
      </div>
    </template>
  </ChartCard>
</template>

<style scoped lang="scss">
.metrics {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border: 1px solid rgba(102, 217, 255, 0.08);

  &__label {
    font-size: 11px;
    color: #7eb4d8;
    white-space: nowrap;
  }

  &__value {
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;

    small {
      font-size: 10px;
      color: #6f9bbd;
      margin-left: 3px;
      font-weight: 500;
    }

    &.is-alert { color: #ff9b7a; }
  }

  &--risk {
    background: rgba(0, 38, 73, 0.5);
    border-color: rgba(102, 217, 255, 0.16);
  }
}
</style>
