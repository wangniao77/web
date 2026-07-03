<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import * as echarts from 'echarts/core'
import { DigitalFlop } from '@kjgl77/datav-vue3'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import StudentPanelBorder from '@/domains/student/components/StudentPanelBorder.vue'
import { CHART_COLORS, CHART_FONT } from '@/styles/echarts-theme'
import type { GrowthPortraitVM } from '@/domains/student/types/view'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: GrowthPortraitVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const DIMENSION_ACCENT = ['#00e5ff', '#a78bfa', '#34d399', '#fbbf24', '#66d9ff'] as const
const CYCLE_INTERVAL = 2200
const RADAR_CENTER = 50
// 轨道需留出卡片半高边距，避免 overflow 裁切
const CHIP_ORBIT_X = 44
const CHIP_ORBIT_Y = 40

const stageRef = ref<HTMLElement | null>(null)
const chartRef = ref<InstanceType<typeof ChartContainer> | null>(null)

const activeDim = ref(-1)
let cycleTimer: number | null = null
let cycleIndex = 0

const compositeScore = computed(() => {
  const vals = props.data.personal
  if (!vals.length) return 0
  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length
  return Math.round(avg * 10) / 10
})

const flopConfig = computed(() => ({
  number: [compositeScore.value],
  content: '{nt}',
  toFixed: 1,
  textAlign: 'center' as const,
  style: {
    fontSize: 28,
    fill: '#f4f8ff',
    fontWeight: 'bold' as const,
    fontFamily: 'DIN Alternate, Bahnschrift, Roboto Condensed, sans-serif',
  },
  animationCurve: 'easeOutCubic',
  animationFrame: 50,
}))

const dimensionCards = computed(() =>
  props.data.indicators.map((ind, i) => {
    const score = props.data.personal[i] ?? 0
    const avg = props.data.gradeAvg[i] ?? 0
    return {
      name: ind.name,
      score,
      avg,
      delta: Math.round((score - avg) * 10) / 10,
      accent: DIMENSION_ACCENT[i % DIMENSION_ACCENT.length],
    }
  }),
)

function chipStyle(index: number, total: number) {
  const angleDeg = -90 + (360 / total) * index
  const angleRad = (angleDeg * Math.PI) / 180
  const x = RADAR_CENTER + CHIP_ORBIT_X * Math.cos(angleRad)
  const y = RADAR_CENTER + CHIP_ORBIT_Y * Math.sin(angleRad)
  return {
    left: `${x}%`,
    top: `${y}%`,
    '--chip-accent': DIMENSION_ACCENT[index % DIMENSION_ACCENT.length],
  }
}

const radarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 1600,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.28)',
    borderWidth: 1,
    padding: [8, 12],
    textStyle: { color: '#e2edff', fontSize: CHART_FONT.tooltip },
    formatter: (params: unknown) => {
      const p = params as { name: string; value: number[]; marker: string }
      if (!Array.isArray(p.value)) return ''
      const rows = p.value
        .map((v, i) => {
          const label = props.data.indicators[i]?.name ?? ''
          return `<span style="opacity:0.72">${label}</span> <b style="color:#00e5ff">${v}</b>`
        })
        .join('<br/>')
      return `<div style="margin-bottom:6px;font-weight:600">${p.marker}${p.name}</div>${rows}`
    },
  },
  radar: {
    center: ['50%', '50%'],
    radius: '58%',
    startAngle: 90,
    splitNumber: 4,
    indicator: props.data.indicators.map((ind) => ({
      name: ind.name,
      max: ind.max,
    })),
    axisName: { show: false },
    splitLine: {
      lineStyle: {
        color: [
          'rgba(0, 212, 255, 0.22)',
          'rgba(0, 212, 255, 0.1)',
          'rgba(0, 212, 255, 0.06)',
          'rgba(0, 212, 255, 0.03)',
        ],
      },
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: [
          'rgba(0, 184, 255, 0.07)',
          'rgba(0, 184, 255, 0.04)',
          'rgba(0, 184, 255, 0.02)',
          'rgba(0, 184, 255, 0.01)',
        ],
      },
    },
    axisLine: {
      lineStyle: {
        color: 'rgba(0, 212, 255, 0.14)',
        type: 'dashed',
      },
    },
  },
  series: [
    {
      type: 'radar',
      symbol: 'circle',
      symbolSize: 9,
      emphasis: {
        scale: true,
        lineStyle: { width: 3 },
        itemStyle: {
          shadowBlur: 20,
          shadowColor: 'rgba(0, 229, 255, 0.95)',
        },
      },
      data: [
        {
          name: '个人得分',
          value: props.data.personal,
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(0, 229, 255, 0.44)' },
              { offset: 0.65, color: 'rgba(0, 140, 220, 0.16)' },
              { offset: 1, color: 'rgba(0, 80, 160, 0.04)' },
            ]),
          },
          lineStyle: {
            color: CHART_COLORS.cyan,
            width: 2.5,
            shadowColor: 'rgba(0, 229, 255, 0.5)',
            shadowBlur: 12,
          },
          itemStyle: {
            color: CHART_COLORS.cyan,
            borderColor: 'rgba(255,255,255,0.85)',
            borderWidth: 1.5,
            shadowColor: 'rgba(0, 229, 255, 0.75)',
            shadowBlur: 8,
          },
        },
        {
          name: '年级均分',
          value: props.data.gradeAvg,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            color: CHART_COLORS.gold,
            width: 1.5,
            type: 'dashed',
            opacity: 0.85,
          },
          itemStyle: { color: CHART_COLORS.gold, opacity: 0.9 },
          areaStyle: { opacity: 0 },
        },
      ],
    },
  ],
}))

function highlightDim(i: number) {
  const inst = chartRef.value?.getInstance()
  if (!inst) return
  inst.dispatchAction({ type: 'downplay', seriesIndex: 0 })
  inst.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: i })
  activeDim.value = i
  cycleIndex = i
}

function stopCycle() {
  if (cycleTimer != null) {
    window.clearInterval(cycleTimer)
    cycleTimer = null
  }
}

function startCycle() {
  stopCycle()
  const total = props.data.indicators.length
  if (total < 2) return
  if (activeDim.value < 0) highlightDim(0)
  cycleTimer = window.setInterval(() => {
    highlightDim((cycleIndex + 1) % total)
  }, CYCLE_INTERVAL)
}

function onChipEnter(i: number) {
  stopCycle()
  highlightDim(i)
}

function onChipLeave() {
  startCycle()
}

async function playEntrance() {
  await nextTick()
  const stage = stageRef.value
  if (!stage || props.loading || props.error) return

  stopCycle()

  const tl = gsap.timeline({ delay: 0.06, onComplete: startCycle })

  tl.from(stage.querySelector('.radar-arena'), {
    scale: 0.9,
    opacity: 0,
    duration: 0.55,
    ease: 'power2.out',
  })

  tl.from(
    stage.querySelectorAll('.dim-chip'),
    {
      opacity: 0,
      scale: 0.88,
      duration: 0.32,
      stagger: 0.05,
      ease: 'power2.out',
    },
    '-=0.3',
  )
}

watch(
  () => [props.loading, props.error] as const,
  ([loading, error]) => {
    if (!loading && !error) playEntrance()
  },
  { immediate: true },
)

onUnmounted(() => {
  stopCycle()
})
</script>

<template>
  <StudentPanelBorder variant="13">
    <CollegePanelCard
      :index="2"
      title="五维成长画像"
      class="growth-radar-card"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <div ref="stageRef" class="portrait">
        <div class="radar-stage">
          <div class="radar-arena">
            <ChartContainer ref="chartRef" class="radar-chart" :option="radarOption" />

            <div class="radar-overlay">
              <div class="deco-layer" aria-hidden="true">
                <span class="deco-glow" />
                <span class="deco-ring ring-outer" />
                <span class="deco-sweep" />
              </div>

              <div class="center-hub" aria-hidden="true">
                <span class="hub-label">综合</span>
                <DigitalFlop :config="flopConfig" class="hub-flop" />
              </div>

              <div
                v-for="(dim, i) in dimensionCards"
                :key="dim.name"
                class="dim-chip"
                :class="{ active: activeDim === i }"
                :style="chipStyle(i, dimensionCards.length)"
                @mouseenter="onChipEnter(i)"
                @mouseleave="onChipLeave"
              >
                <span class="chip-name">{{ dim.name }}</span>
                <div class="chip-metrics">
                  <span class="chip-score">{{ dim.score }}</span>
                  <span class="chip-delta" :class="dim.delta >= 0 ? 'up' : 'down'">
                    {{ dim.delta >= 0 ? '+' : '' }}{{ dim.delta }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.growth-radar-card {
  height: 100%;

  :deep(.panel-header) {
    height: 38px;
    flex-shrink: 0;
  }

  :deep(.panel-body) {
    padding: 0 2px 2px;
    overflow: hidden;
  }
}

.portrait {
  height: 100%;
  min-height: 0;
}

.radar-stage {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.radar-arena {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.radar-chart {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.radar-overlay {
  position: absolute;
  inset: 5% 3%;
  z-index: 2;
  pointer-events: none;
}

.deco-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.deco-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 52%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 184, 255, 0.16) 0%, transparent 72%);
  animation: glow-breathe 4s ease-in-out infinite;
}

.deco-ring.ring-outer {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(102, 217, 255, 0.14);
  opacity: 0.75;
}

.deco-sweep {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 62%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 300deg,
    rgba(0, 229, 255, 0.1) 330deg,
    rgba(0, 229, 255, 0.3) 352deg,
    rgba(140, 245, 255, 0.48) 360deg
  );
  mask: radial-gradient(circle, transparent 20%, #000 21%, #000 100%);
  -webkit-mask: radial-gradient(circle, transparent 20%, #000 21%, #000 100%);
  animation: radar-sweep 7s linear infinite;
}

.center-hub {
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 3;
  transform: translate(-50%, -50%);
  width: min(24%, 96px);
  height: min(24%, 96px);
  min-width: 76px;
  min-height: 76px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 28%, rgba(0, 229, 255, 0.14), rgba(4, 16, 42, 0.94) 70%);
  border: 1.5px solid rgba(0, 212, 255, 0.26);
  box-shadow:
    0 0 24px rgba(0, 184, 255, 0.18),
    inset 0 0 20px rgba(0, 184, 255, 0.06);
  pointer-events: none;
}

.hub-label {
  font-size: var(--fs-meta);
  color: rgba(174, 198, 230, 0.58);
  letter-spacing: 0.06em;
  line-height: 1;
  margin-bottom: 2px;
}

.hub-flop {
  width: 78px;
  height: 34px;
}

.dim-chip {
  position: absolute;
  z-index: 4;
  pointer-events: auto;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: min(18vw, 76px);
  padding: 4px 8px 5px;
  border-radius: 9px;
  background: linear-gradient(155deg, rgba(10, 30, 68, 0.94), rgba(5, 16, 40, 0.9));
  border: 1px solid rgba(0, 212, 255, 0.18);
  border-top: 2px solid var(--chip-accent, #00e5ff);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(6px);
  cursor: default;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease,
    border-color 0.25s ease;

  &:hover,
  &.active {
    transform: translate(-50%, -50%) scale(1.05);
    border-color: var(--chip-accent, #00e5ff);
    box-shadow:
      0 6px 18px rgba(0, 0, 0, 0.32),
      0 0 16px color-mix(in srgb, var(--chip-accent, #00e5ff) 30%, transparent);
  }

  &.active {
    z-index: 5;

    .chip-score {
      color: #fff;
      text-shadow: 0 0 12px var(--chip-accent, #00e5ff);
    }
  }
}

.chip-name {
  font-size: var(--fs-label);
  font-weight: 600;
  color: rgba(210, 228, 252, 0.86);
  white-space: nowrap;
}

.chip-metrics {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.chip-score {
  font-size: 21px;
  font-weight: 700;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: #f4f8ff;
  line-height: 1;
}

.chip-delta {
  font-size: var(--fs-micro);
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 8px;
  font-family: var(--student-font-number, inherit);

  &.up {
    color: #34d399;
    background: rgba(52, 211, 153, 0.14);
  }

  &.down {
    color: #f87171;
    background: rgba(248, 113, 113, 0.14);
  }
}

@keyframes glow-breathe {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
}

@keyframes radar-sweep {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}
</style>
