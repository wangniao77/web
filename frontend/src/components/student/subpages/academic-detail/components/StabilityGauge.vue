<script setup lang="ts">
/**
 * 学业稳定性分析
 * 进度环仪表（无指针遮挡）+ 数字跳动 + 底部指标
 */
import { computed, onUnmounted, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { EChartsOption } from 'echarts'
import ChartCard from './ChartCard.vue'

const props = defineProps<{
  gpaValues: number[]
  failCount: number
  retakeCount: number
  lowScoreCount: number
  /** 外部统一稳定指数；不传则组件内自行计算 */
  index?: number
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
  if (typeof props.index === 'number' && Number.isFinite(props.index)) {
    return Math.max(0, Math.min(100, Math.round(props.index)))
  }
  const raw = 100 - gpaStd.value * 30 - props.failCount * 10 - props.retakeCount * 8 - props.lowScoreCount * 2.5
  return Math.max(0, Math.min(100, Math.round(raw)))
})

const level = computed(() => {
  const v = index.value
  if (v >= 85) return { label: '优秀', risk: '无', color: '#34d399', glow: 'rgba(52,211,153,0.55)' }
  if (v >= 70) return { label: '良好', risk: '低', color: '#66d9ff', glow: 'rgba(102,217,255,0.55)' }
  if (v >= 50) return { label: '中等', risk: '中', color: '#f0c040', glow: 'rgba(240,192,64,0.5)' }
  return { label: '偏弱', risk: '高', color: '#f87171', glow: 'rgba(248,113,113,0.5)' }
})

const displayValue = ref(0)
let raf = 0
function animateTo(target: number) {
  cancelAnimationFrame(raf)
  const from = displayValue.value
  const start = performance.now()
  const dur = 1200
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur)
    const ease = 1 - Math.pow(1 - t, 3)
    displayValue.value = Math.round(from + (target - from) * ease)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
watch(index, (v) => animateTo(v), { immediate: true })
onUnmounted(() => cancelAnimationFrame(raf))

const option = computed<EChartsOption>(() => {
  const c = level.value.color
  return {
    animation: true,
    animationDuration: 1400,
    animationEasing: 'cubicOut',
    series: [
      {
        type: 'gauge',
        center: ['50%', '58%'],
        radius: '88%',
        startAngle: 210,
        endAngle: -30,
        min: 0,
        max: 100,
        splitNumber: 5,
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 16,
            color: [[1, 'rgba(0, 55, 110, 0.55)']],
          },
        },
        progress: {
          show: true,
          roundCap: true,
          width: 16,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: c },
                { offset: 1, color: '#9ef0ff' },
              ],
            },
            shadowColor: level.value.glow,
            shadowBlur: 18,
          },
        },
        pointer: { show: false },
        anchor: { show: false },
        axisTick: {
          distance: -16,
          length: 6,
          splitNumber: 4,
          lineStyle: { color: 'rgba(160,220,255,0.35)', width: 1 },
        },
        splitLine: {
          distance: -16,
          length: 12,
          lineStyle: { color: 'rgba(180,230,255,0.55)', width: 2 },
        },
        axisLabel: { show: false },
        title: { show: false },
        detail: { show: false },
        data: [{ value: index.value }],
      },
    ],
  }
})
</script>

<template>
  <ChartCard title="学业稳定性分析" :sub="`稳定指数 · ${level.label}`">
    <div class="stability-stage">
      <div class="gauge-wrap">
        <div class="gauge-orbit gauge-orbit--outer" aria-hidden="true" />
        <div class="gauge-orbit gauge-orbit--inner" aria-hidden="true" />
        <div class="gauge-glow" aria-hidden="true" />
        <ChartContainer :option="option" />
        <div class="gauge-center">
          <span class="gauge-center__eyebrow">稳定指数</span>
          <b
            class="gauge-center__val"
            :style="{ color: level.color, textShadow: `0 0 22px ${level.glow}` }"
          >
            {{ displayValue }}
          </b>
          <span class="gauge-center__lvl">{{ level.label }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="metrics">
        <div class="metric metric--primary" style="--i: 0">
          <span class="metric__label">GPA 波动</span>
          <span class="metric__value">
            {{ volatility }}<small>σ {{ gpaStd }}</small>
          </span>
        </div>
        <div class="metric" style="--i: 1">
          <span class="metric__label">不及格次数</span>
          <span class="metric__value" :class="{ 'is-alert': failCount > 0 }">{{ failCount }}</span>
        </div>
        <div class="metric" style="--i: 2">
          <span class="metric__label">重修次数</span>
          <span class="metric__value" :class="{ 'is-alert': retakeCount > 0 }">{{ retakeCount }}</span>
        </div>
        <div class="metric" style="--i: 3">
          <span class="metric__label">低分课程</span>
          <span class="metric__value" :class="{ 'is-alert': lowScoreCount > 0 }">{{ lowScoreCount }}</span>
        </div>
        <div class="metric metric--risk" style="--i: 4">
          <span class="metric__label">风险等级</span>
          <span class="metric__value" :style="{ color: level.color }">{{ level.risk }}</span>
        </div>
      </div>
    </template>
  </ChartCard>
</template>

<style scoped lang="scss">
.stability-stage {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  height: 100%;
  border-radius: 12px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background:
    radial-gradient(circle at 50% 55%, rgba(0, 206, 255, 0.12), transparent 58%),
    rgba(0, 20, 48, 0.28);
  overflow: hidden;
}

.gauge-wrap {
  position: relative;
  width: min(100%, 280px);
  height: 220px;
  overflow: hidden;
}

.gauge-orbit {
  position: absolute;
  left: 50%;
  top: 54%;
  border-radius: 50%;
  pointer-events: none;
  transform: translate(-50%, -50%);

  &--outer {
    width: 88%;
    aspect-ratio: 1;
    border: 1px dashed rgba(113, 232, 255, 0.28);
    animation: orbit-rotate 18s linear infinite;
  }

  &--inner {
    width: 68%;
    aspect-ratio: 1;
    border: 1px solid rgba(120, 220, 255, 0.12);
    border-right-color: rgba(125, 239, 255, 0.55);
    animation: orbit-rotate-reverse 11s linear infinite;
  }
}

.gauge-glow {
  position: absolute;
  left: 50%;
  top: 54%;
  width: 42%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102, 217, 255, 0.18), transparent 70%);
  pointer-events: none;
  animation: glow-breathe 2.8s ease-in-out infinite;
}

.gauge-wrap :deep(.chart-container) {
  width: 100%;
  height: 100%;
}

.gauge-center {
  position: absolute;
  left: 50%;
  top: 52%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  z-index: 2;

  &__eyebrow {
    margin-bottom: 0;
    color: #95cdea;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.16em;
  }

  &__val {
    font-size: 48px;
    font-weight: 900;
    line-height: 1;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__lvl {
    margin-top: 2px;
    padding: 1px 10px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    line-height: 1.35;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #66d9ff);
    letter-spacing: 0.08em;
  }
}

.metrics {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.metric {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 10px;
  border-radius: 12px;
  min-height: 84px;
  background:
    radial-gradient(90% 70% at 50% 0%, rgba(0, 184, 255, 0.08), transparent 60%),
    rgba(0, 28, 58, 0.5);
  border: 1px solid rgba(102, 217, 255, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  animation: metric-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--i, 0) * 80ms + 400ms);

  &__label {
    font-size: 15px;
    font-weight: 650;
    color: #9ecae8;
    white-space: nowrap;
  }

  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1.1;

    small {
      font-size: 14px;
      color: #7eb4d8;
      margin-left: 4px;
      font-weight: 650;
    }

    &.is-alert {
      color: #ff9b7a;
    }
  }

  &--risk {
    border-color: rgba(102, 217, 255, 0.28);
  }

  &--primary {
    border-left: 3px solid #55dfff;
    .metric__value { color: #74e7ff; }
  }
}

@keyframes orbit-rotate {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes orbit-rotate-reverse {
  to { transform: translate(-50%, -50%) rotate(-360deg); }
}

@keyframes glow-breathe {
  0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.08); }
}

@keyframes metric-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (prefers-reduced-motion: reduce) {
  .gauge-orbit,
  .gauge-glow,
  .metric {
    animation: none;
  }
}
</style>
