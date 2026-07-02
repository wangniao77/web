<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import * as echarts from 'echarts/core'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT } from '@/styles/echarts-theme'
import type { GrowthPortraitVM } from '@/types/view/student'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: GrowthPortraitVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const DIMENSION_ACCENT = ['#00e5ff', '#a78bfa', '#34d399', '#fbbf24', '#66d9ff'] as const
const CYCLE_INTERVAL = 2200

const stageRef = ref<HTMLElement | null>(null)
const chartRef = ref<InstanceType<typeof ChartContainer> | null>(null)

// ── 循环高亮 / 数字滚动状态 ─────────────────────────────
const activeDim = ref(-1)
const displayScore = ref(0)
let cycleTimer: number | null = null
let cycleIndex = 0
let scoreTween: gsap.core.Tween | null = null

const compositeScore = computed(() => {
  const vals = props.data.personal
  if (!vals.length) return 0
  const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length
  return Math.round(avg * 10) / 10
})

const displayScoreText = computed(() => displayScore.value.toFixed(1))

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
  const radius = 43
  const x = 50 + radius * Math.cos(angleRad)
  const y = 47 + radius * Math.sin(angleRad)
  return {
    left: `${x}%`,
    top: `${y}%`,
    '--chip-accent': DIMENSION_ACCENT[index % DIMENSION_ACCENT.length],
  }
}

const radarOption = computed<EChartsOption>(() => ({
  animation: true,
  animationDuration: 2000,
  animationEasing: 'cubicOut',
  tooltip: {
    trigger: 'item',
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.28)',
    borderWidth: 1,
    padding: [10, 14],
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
    center: ['50%', '48%'],
    radius: '50%',
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
      symbolSize: 7,
      emphasis: {
        scale: true,
        lineStyle: { width: 3 },
        itemStyle: {
          shadowBlur: 22,
          shadowColor: 'rgba(0, 229, 255, 0.95)',
        },
      },
      data: [
        {
          name: '个人得分',
          value: props.data.personal,
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(0, 229, 255, 0.42)' },
              { offset: 0.65, color: 'rgba(0, 140, 220, 0.16)' },
              { offset: 1, color: 'rgba(0, 80, 160, 0.04)' },
            ]),
          },
          lineStyle: {
            color: CHART_COLORS.cyan,
            width: 2.5,
            shadowColor: 'rgba(0, 229, 255, 0.55)',
            shadowBlur: 14,
          },
          itemStyle: {
            color: CHART_COLORS.cyan,
            borderColor: 'rgba(255,255,255,0.85)',
            borderWidth: 1.5,
            shadowColor: 'rgba(0, 229, 255, 0.8)',
            shadowBlur: 10,
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

// ── 维度轮播高亮循环 ────────────────────────────────────
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
  scoreTween?.kill()

  displayScore.value = 0
  scoreTween = gsap.to(displayScore, {
    value: compositeScore.value,
    duration: 1.5,
    ease: 'power2.out',
    delay: 0.3,
  })

  const tl = gsap.timeline({ delay: 0.12, onComplete: startCycle })

  tl.from(stage.querySelectorAll('.deco-ring'), {
    scale: 0.55,
    opacity: 0,
    duration: 0.75,
    stagger: 0.1,
    ease: 'power2.out',
    transformOrigin: '50% 50%',
  })

  tl.from(
    stage.querySelector('.deco-sweep'),
    { opacity: 0, rotation: -90, duration: 0.9, ease: 'power2.out' },
    '-=0.55',
  )

  tl.from(
    stage.querySelectorAll('.orbit'),
    { opacity: 0, duration: 0.6, stagger: 0.12, ease: 'power1.out' },
    '-=0.7',
  )

  tl.from(
    stage.querySelector('.center-hub'),
    { scale: 0.4, opacity: 0, duration: 0.55, ease: 'back.out(1.7)' },
    '-=0.45',
  )

  tl.from(
    stage.querySelectorAll('.portrait-head > *'),
    { x: -18, opacity: 0, duration: 0.38, stagger: 0.07, ease: 'power2.out' },
    '-=0.35',
  )

  tl.from(
    stage.querySelectorAll('.dim-chip'),
    {
      y: 14,
      opacity: 0,
      scale: 0.82,
      duration: 0.42,
      stagger: 0.07,
      ease: 'power2.out',
    },
    '-=0.2',
  )

  tl.from(
    stage.querySelector('.radar-chart'),
    { opacity: 0, scale: 0.92, duration: 0.5, ease: 'power2.out' },
    '-=0.55',
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
  scoreTween?.kill()
})
</script>

<template>
  <CollegePanelCard
    :index="2"
    title="五维成长画像"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div ref="stageRef" class="portrait">
      <div class="portrait-head">
        <div class="head-stat">
          <span class="stat-label">综合成长指数</span>
          <span class="stat-value">{{ displayScoreText }}</span>
          <span class="stat-unit">/ 100</span>
        </div>
        <div class="head-legend">
          <span class="legend-pill personal">
            <i class="dot" />个人得分
          </span>
          <span class="legend-pill grade">
            <i class="dot dashed" />年级均分
          </span>
        </div>
      </div>

      <div class="radar-stage">
        <div class="deco-layer" aria-hidden="true">
          <span class="deco-glow" />
          <span class="deco-ripple" />
          <span class="deco-ripple ripple-2" />
          <span class="deco-ring ring-1" />
          <span class="deco-ring ring-2" />
          <span class="deco-ring ring-3" />
          <span class="deco-sweep" />
          <span class="orbit orbit-1"><i class="orbit-dot" /></span>
          <span class="orbit orbit-2"><i class="orbit-dot" /></span>
          <svg class="deco-pentagon" viewBox="0 0 200 200">
            <polygon
              points="100,18 178,74 148,162 52,162 22,74"
              fill="none"
              stroke="rgba(0,212,255,0.08)"
              stroke-width="1"
              stroke-dasharray="4 6"
            />
          </svg>
        </div>

        <div class="center-hub" aria-hidden="true">
          <span class="hub-ring" />
          <span class="hub-label">综合</span>
          <strong class="hub-value">{{ displayScoreText }}</strong>
        </div>

        <ChartContainer ref="chartRef" class="radar-chart" :option="radarOption" />

        <div
          v-for="(dim, i) in dimensionCards"
          :key="dim.name"
          class="dim-chip"
          :class="{ active: activeDim === i }"
          :style="chipStyle(i, dimensionCards.length)"
          @mouseenter="onChipEnter(i)"
          @mouseleave="onChipLeave"
        >
          <span class="chip-accent" />
          <span class="chip-name">{{ dim.name }}</span>
          <span class="chip-score">{{ dim.score }}</span>
          <span class="chip-delta" :class="dim.delta >= 0 ? 'up' : 'down'">
            {{ dim.delta >= 0 ? '+' : '' }}{{ dim.delta }}
          </span>
        </div>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.portrait {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.portrait-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  padding: 0 2px;
}

.head-stat {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-label {
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.62);
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 26px;
  font-weight: 700;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: #f4f8ff;
  text-shadow: 0 0 18px rgba(0, 229, 255, 0.35);
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.stat-unit {
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.45);
}

.head-legend {
  display: flex;
  gap: 10px;
}

.legend-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.72);
  background: rgba(0, 184, 255, 0.06);
  border: 1px solid rgba(0, 212, 255, 0.1);

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00e5ff;
    box-shadow: 0 0 8px rgba(0, 229, 255, 0.6);

    &.dashed {
      background: transparent;
      border: 1.5px dashed #f0c040;
      box-shadow: none;
    }
  }

  &.personal .dot {
    animation: legend-blink 2.4s ease-in-out infinite;
  }

  &.grade {
    background: rgba(240, 192, 64, 0.06);
    border-color: rgba(240, 192, 64, 0.12);
  }
}

.radar-stage {
  position: relative;
  flex: 1;
  min-height: 180px;
  overflow: hidden;
}

.deco-layer {
  position: absolute;
  inset: 4% 2% 8%;
  pointer-events: none;
  z-index: 0;
}

.deco-glow {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 38%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 184, 255, 0.14) 0%, transparent 70%);
  animation: glow-breathe 4s ease-in-out infinite;
}

// ── 中心扩散能量波纹（循环特效）─────────────────────────
.deco-ripple {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 20%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(0, 229, 255, 0.4);
  opacity: 0;
  animation: ripple-out 4.4s ease-out infinite;
}

.ripple-2 {
  animation-delay: 2.2s;
  border-color: rgba(167, 139, 250, 0.35);
}

.deco-ring {
  position: absolute;
  left: 50%;
  top: 48%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px solid rgba(102, 217, 255, 0.1);
  box-shadow: inset 0 0 24px rgba(0, 184, 255, 0.03);
}

.ring-1 {
  width: 28%;
  aspect-ratio: 1;
  animation: ring-breathe 4.2s ease-in-out infinite;
}

.ring-2 {
  width: 44%;
  aspect-ratio: 1;
  border-style: dashed;
  opacity: 0.75;
  animation: ring-spin 28s linear infinite;
}

.ring-3 {
  width: 58%;
  aspect-ratio: 1;
  opacity: 0.45;
  animation: ring-spin 40s linear infinite reverse;
}

// ── 沿圆环环绕的轨道光点（循环特效）───────────────────────
.orbit {
  position: absolute;
  left: 50%;
  top: 48%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
}

.orbit-dot {
  position: absolute;
  top: -3px;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: 50%;
  background: #66d9ff;
  box-shadow: 0 0 10px 2px rgba(0, 229, 255, 0.75);
}

.orbit-1 {
  width: 44%;
  animation: orbit-spin 9s linear infinite;
}

.orbit-2 {
  width: 58%;
  animation: orbit-spin 15s linear infinite reverse;

  .orbit-dot {
    width: 5px;
    height: 5px;
    margin-left: -2.5px;
    background: #a78bfa;
    box-shadow: 0 0 10px 2px rgba(167, 139, 250, 0.65);
  }
}

.deco-sweep {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 60%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 288deg,
    rgba(0, 229, 255, 0.1) 320deg,
    rgba(0, 229, 255, 0.32) 352deg,
    rgba(140, 245, 255, 0.5) 360deg
  );
  mask: radial-gradient(circle, transparent 16%, #000 17%, #000 100%);
  -webkit-mask: radial-gradient(circle, transparent 16%, #000 17%, #000 100%);
  animation: radar-sweep 6s linear infinite;
}

.deco-pentagon {
  position: absolute;
  left: 50%;
  top: 48%;
  width: 52%;
  transform: translate(-50%, -50%);
  opacity: 0.85;
}

.center-hub {
  position: absolute;
  left: 50%;
  top: 48%;
  z-index: 2;
  transform: translate(-50%, -50%);
  width: 72px;
  height: 72px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(0, 229, 255, 0.12), rgba(4, 16, 42, 0.92) 68%);
  border: 1px solid rgba(0, 212, 255, 0.22);
  box-shadow:
    0 0 24px rgba(0, 184, 255, 0.15),
    inset 0 0 20px rgba(0, 184, 255, 0.06);
  pointer-events: none;
}

.hub-ring {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  border: 1px solid rgba(0, 212, 255, 0.15);
  animation: hub-ring-pulse 3s ease-in-out infinite;
}

.hub-label {
  font-size: 11px;
  color: rgba(174, 198, 230, 0.55);
  letter-spacing: 0.12em;
}

.hub-value {
  font-size: 22px;
  font-weight: 700;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: #f4f8ff;
  text-shadow: 0 0 16px rgba(0, 229, 255, 0.4);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.radar-chart {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
}

.dim-chip {
  position: absolute;
  z-index: 3;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  min-width: 64px;
  padding: 5px 8px 6px;
  border-radius: 8px;
  background: linear-gradient(145deg, rgba(8, 24, 56, 0.92), rgba(4, 14, 36, 0.88));
  border: 1px solid rgba(0, 212, 255, 0.14);
  box-shadow:
    0 4px 16px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(6px);
  cursor: default;
  transition:
    transform 0.3s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.3s ease,
    border-color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, var(--chip-accent, #00e5ff), transparent 60%);
    opacity: 0.08;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translate(-50%, -50%) scale(1.06);
    box-shadow:
      0 6px 20px rgba(0, 184, 255, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  // 循环高亮激活态
  &.active {
    z-index: 5;
    transform: translate(-50%, -50%) scale(1.12);
    border-color: var(--chip-accent, #00e5ff);
    box-shadow:
      0 8px 26px rgba(0, 0, 0, 0.32),
      0 0 22px var(--chip-accent, #00e5ff);

    &::before {
      opacity: 0.24;
    }

    .chip-accent {
      width: 30px;
    }

    .chip-score {
      color: #ffffff;
      text-shadow: 0 0 14px var(--chip-accent, #00e5ff);
    }
  }
}

.chip-accent {
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--chip-accent, #00e5ff);
  box-shadow: 0 0 8px var(--chip-accent, #00e5ff);
  margin-bottom: 2px;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
}

.chip-name {
  font-size: 11px;
  color: rgba(174, 198, 230, 0.68);
  white-space: nowrap;
}

.chip-score {
  font-size: 17px;
  font-weight: 700;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: #f4f8ff;
  line-height: 1.1;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.chip-delta {
  font-size: 10px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 8px;

  &.up {
    color: #34d399;
    background: rgba(52, 211, 153, 0.12);
  }

  &.down {
    color: #f87171;
    background: rgba(248, 113, 113, 0.12);
  }
}

@keyframes glow-breathe {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}

@keyframes ripple-out {
  0%   { width: 20%; opacity: 0; }
  12%  { opacity: 0.5; }
  70%  { opacity: 0.08; }
  100% { width: 64%; opacity: 0; }
}

@keyframes ring-breathe {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; }
  50%      { transform: translate(-50%, -50%) scale(1.04); opacity: 1; }
}

@keyframes ring-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes orbit-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes radar-sweep {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes hub-ring-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50%      { transform: scale(1.08); opacity: 1; }
}

@keyframes legend-blink {
  0%, 100% { box-shadow: 0 0 8px rgba(0, 229, 255, 0.6); }
  50%      { box-shadow: 0 0 14px rgba(0, 229, 255, 1); }
}
</style>
