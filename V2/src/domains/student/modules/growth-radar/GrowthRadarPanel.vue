<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import * as echarts from 'echarts/core'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import StudentPanelBorder from '@/domains/student/components/StudentPanelBorder.vue'
import DashIcon, { type IconKind } from '@/domains/college/components/DashIcon.vue'
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
// 外圈图标标签轨道（相对 arena 宽/高的百分比，X 略小以补偿横向拉伸近似圆形）
const BADGE_ORBIT_X = 37
const BADGE_ORBIT_Y = 40
// 雷达几何（需与 ECharts radar 配置保持一致）
const RADAR_CENTER_X = 50
const RADAR_CENTER_Y = 52
const RADAR_RADIUS_PCT = 58
const RADAR_SPLIT = 5
// 顶点距中心占 arena 高度的百分比（radius 相对 min(W,H)/2，此处 arena 高 < 宽）
const RADAR_R_VH = RADAR_RADIUS_PCT / 2

// 中轴刻度数字（20 / 40 / 60 / 80 / 100），填充中心留白
const scaleMarks = computed(() => {
  const max = props.data.indicators[0]?.max ?? 100
  return Array.from({ length: RADAR_SPLIT }, (_, k) => {
    const ratio = (k + 1) / RADAR_SPLIT
    return {
      value: Math.round(max * ratio),
      top: RADAR_CENTER_Y - RADAR_R_VH * ratio,
    }
  })
})

function dimIcon(name: string): IconKind {
  if (name.includes('学业')) return 'academic'
  if (name.includes('组织') || name.includes('协调')) return 'students'
  if (name.includes('身心') || name.includes('心') || name.includes('健康')) return 'heart'
  if (name.includes('实践') || name.includes('实习')) return 'briefcase'
  if (name.includes('专业') || name.includes('创新')) return 'research'
  return 'potential'
}

function badgePos(index: number, total: number) {
  const angleRad = ((-90 + (360 / total) * index) * Math.PI) / 180
  return {
    left: `${50 + BADGE_ORBIT_X * Math.cos(angleRad)}%`,
    top: `${50 + BADGE_ORBIT_Y * Math.sin(angleRad)}%`,
    '--badge-accent': DIMENSION_ACCENT[index % DIMENSION_ACCENT.length],
  }
}

const stageRef = ref<HTMLElement | null>(null)
const chartRef = ref<InstanceType<typeof ChartContainer> | null>(null)

const activeDim = ref(-1)
let cycleTimer: number | null = null
let cycleIndex = 0

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
    center: [`${RADAR_CENTER_X}%`, `${RADAR_CENTER_Y}%`],
    radius: `${RADAR_RADIUS_PCT}%`,
    startAngle: 90,
    splitNumber: RADAR_SPLIT,
    indicator: props.data.indicators.map((ind) => ({
      name: ind.name,
      max: ind.max,
    })),
    axisName: { show: false },
    axisLabel: { show: false },
    splitLine: {
      lineStyle: {
        color: [
          'rgba(0, 212, 255, 0.24)',
          'rgba(0, 212, 255, 0.14)',
          'rgba(0, 212, 255, 0.1)',
          'rgba(0, 212, 255, 0.07)',
          'rgba(0, 212, 255, 0.05)',
        ],
      },
    },
    splitArea: {
      show: true,
      areaStyle: {
        color: [
          'rgba(0, 184, 255, 0.06)',
          'rgba(0, 184, 255, 0.04)',
          'rgba(0, 184, 255, 0.025)',
          'rgba(0, 184, 255, 0.015)',
          'rgba(0, 184, 255, 0.008)',
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
            opacity: 0.9,
          },
          itemStyle: { color: CHART_COLORS.gold, opacity: 0.95 },
          areaStyle: {
            color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
              { offset: 0, color: 'rgba(245, 196, 70, 0.5)' },
              { offset: 0.75, color: 'rgba(210, 150, 40, 0.34)' },
              { offset: 1, color: 'rgba(150, 105, 25, 0.22)' },
            ]),
          },
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

function onBadgeEnter(i: number) {
  stopCycle()
  highlightDim(i)
}

function onBadgeLeave() {
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

            <div class="scale-marks" aria-hidden="true">
              <span
                v-for="m in scaleMarks"
                :key="m.value"
                class="scale-mark"
                :style="{ top: m.top + '%' }"
                >{{ m.value }}</span
              >
            </div>

            <div class="radar-overlay">
              <div class="deco-layer" aria-hidden="true">
                <span class="deco-glow" />
                <span class="deco-ring ring-outer" />
                <span class="deco-ticks" />
                <span class="deco-sweep" />
                <span class="deco-corner deco-corner--tl" />
                <span class="deco-corner deco-corner--tr" />
                <span class="deco-corner deco-corner--bl" />
                <span class="deco-corner deco-corner--br" />
              </div>

              <div
                v-for="(dim, i) in dimensionCards"
                :key="dim.name"
                class="dim-badge"
                :class="{ active: activeDim === i }"
                :style="badgePos(i, dimensionCards.length)"
                @mouseenter="onBadgeEnter(i)"
                @mouseleave="onBadgeLeave"
              >
                <span class="badge-icon"><DashIcon :kind="dimIcon(dim.name)" :size="22" /></span>
                <span class="badge-name">{{ dim.name }}</span>
                <span class="badge-score">{{ dim.score }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="radar-legend">
          <span class="lg lg--solid">个人得分</span>
          <span class="lg lg--dash">同年级平均</span>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.growth-radar-card {
  height: 100%;

  :deep(.panel-header) {
    height: 40px;
    flex-shrink: 0;
    justify-content: center;
  }

  :deep(.panel-num) {
    display: none;
  }

  :deep(.header-left) {
    gap: 12px;
    align-items: center;

    &::before,
    &::after {
      content: '';
      width: 46px;
      height: 14px;
      flex-shrink: 0;
      background: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='46' height='14' viewBox='0 0 46 14'><g fill='none' stroke='%2339e6ff' stroke-width='2' stroke-linecap='round'><path d='M4 3 L11 7 L4 11' stroke-opacity='0.4'/><path d='M15 3 L22 7 L15 11' stroke-opacity='0.7'/><path d='M26 3 L33 7 L26 11' stroke-opacity='1'/></g></svg>") center / contain no-repeat;
      filter: drop-shadow(0 0 4px rgba(57, 230, 255, 0.55));
    }

    &::after {
      transform: scaleX(-1);
    }
  }

  :deep(.panel-body) {
    padding: 0 2px 2px;
    overflow: hidden;
  }
}

.portrait {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.radar-stage {
  flex: 1;
  min-height: 0;
  overflow: visible;
}

.radar-legend {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 22px;
  height: 24px;

  .lg {
    position: relative;
    padding-left: 26px;
    font-size: 12px;
    color: rgba(196, 216, 242, 0.82);

    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 50%;
      width: 20px;
      transform: translateY(-50%);
    }
  }

  .lg--solid::before {
    border-top: 2px solid #00e5ff;
    box-shadow: 0 0 6px rgba(0, 229, 255, 0.7);
  }

  .lg--dash::before {
    border-top: 2px dashed #f0c040;
  }
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

// 中轴刻度数字
.scale-marks {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}

.scale-mark {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 11px;
  font-weight: 600;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: rgba(150, 182, 220, 0.5);
  text-shadow: 0 1px 3px rgba(0, 8, 24, 0.9);
  letter-spacing: 0.04em;
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
  width: 66%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 184, 255, 0.2) 0%, transparent 72%);
  animation: glow-breathe 4s ease-in-out infinite;
}

.deco-ring.ring-outer {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 82%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  border: 1px dashed rgba(102, 217, 255, 0.18);
  opacity: 0.8;
}

// 外圈刻度环，填充四周留白
.deco-ticks {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 90%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(0, 212, 255, 0.32) 0deg 0.6deg,
    transparent 0.6deg 6deg
  );
  -webkit-mask: radial-gradient(circle, transparent 0 45%, #000 46% 50%, transparent 51%);
  mask: radial-gradient(circle, transparent 0 45%, #000 46% 50%, transparent 51%);
  animation: ticks-spin 30s linear infinite;
}

.deco-sweep {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 76%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 318deg,
    rgba(0, 229, 255, 0.05) 338deg,
    rgba(0, 229, 255, 0.14) 354deg,
    rgba(140, 245, 255, 0.22) 360deg
  );
  mask: radial-gradient(circle, transparent 20%, #000 21%, #000 100%);
  -webkit-mask: radial-gradient(circle, transparent 20%, #000 21%, #000 100%);
  animation: radar-sweep 7s linear infinite;
}

// 四角 HUD 角标
.deco-corner {
  position: absolute;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(0, 212, 255, 0.4);
  opacity: 0.7;
}

.deco-corner--tl {
  top: 4px;
  left: 4px;
  border-right: 0;
  border-bottom: 0;
}

.deco-corner--tr {
  top: 4px;
  right: 4px;
  border-left: 0;
  border-bottom: 0;
}

.deco-corner--bl {
  bottom: 4px;
  left: 4px;
  border-right: 0;
  border-top: 0;
}

.deco-corner--br {
  bottom: 4px;
  right: 4px;
  border-left: 0;
  border-top: 0;
}

@keyframes glow-breathe {
  0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
  50%      { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
}

@keyframes radar-sweep {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes ticks-spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

// ── 外圈维度标签（图标 + 名称 + 分数），对齐参考图 ──
.dim-badge {
  position: absolute;
  z-index: 4;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  pointer-events: auto;
  transition: transform 0.25s ease;

  &.active {
    transform: translate(-50%, -50%) scale(1.08);

    .badge-icon {
      border-color: var(--badge-accent, #00e5ff);
      box-shadow:
        0 0 16px color-mix(in srgb, var(--badge-accent, #00e5ff) 55%, transparent),
        inset 0 0 12px rgba(0, 184, 255, 0.25);
    }

    .badge-score {
      color: #fff;
      text-shadow: 0 0 12px var(--badge-accent, #00e5ff);
    }
  }
}

.badge-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, rgba(0, 229, 255, 0.18), rgba(4, 16, 42, 0.92) 72%);
  border: 1.5px solid rgba(0, 212, 255, 0.45);
  box-shadow: 0 0 14px rgba(0, 184, 255, 0.32), inset 0 0 10px rgba(0, 184, 255, 0.14);
}

.badge-name {
  font-size: 15px;
  font-weight: 700;
  color: rgba(224, 238, 255, 0.94);
  white-space: nowrap;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 2px rgba(0, 10, 30, 0.85);
}

.badge-score {
  font-size: 25px;
  font-weight: 800;
  line-height: 1;
  font-family: var(--student-font-number, 'DIN Alternate', Bahnschrift, sans-serif);
  color: #00e5ff;
  text-shadow: 0 1px 2px rgba(0, 10, 30, 0.9), 0 0 8px rgba(0, 229, 255, 0.45);
}
</style>
