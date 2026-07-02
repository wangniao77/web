<script setup lang="ts">
import { computed, ref } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import HubKpiItem from '@/components/metrics/HubKpiItem.vue'
import { useCenterAmbient } from '@/composables/useCenterAmbient'
import type { OverviewHubVM } from '@/types/view/college'
import type { KpiKey } from '@/types/api/college'
import type { EChartsOption } from 'echarts'

const props = defineProps<{ data: OverviewHubVM }>()

// ── Perpetual GSAP ambient effects ─────────────────────────
const hubRef = ref<HTMLElement | null>(null)
useCenterAmbient(hubRef)

const kpiMeta: Record<KpiKey, { icon: string; position: 'tl' | 'tr' | 'ml' | 'mr' | 'bl' | 'br' }> = {
  students:     { icon: 'icon-people', position: 'tl' },
  faculty:      { icon: 'icon-star', position: 'tr' },
  funding:      { icon: 'icon-funding', position: 'ml' },
  ranking:      { icon: 'icon-ranking', position: 'mr' },
  satisfaction: { icon: 'icon-satisfaction', position: 'bl' },
  influence:    { icon: 'icon-influence', position: 'br' },
}

const dotColors: Record<string, string> = {
  students:     '#00b8ff',
  faculty:      '#8b5cf6',
  funding:      '#f0c040',
  ranking:       '#34d399',
  satisfaction: '#f87171',
  influence:    '#66d9ff',
}

const gaugeOption = computed<EChartsOption>(() => ({
  series: [
    {
      type: 'gauge',
      startAngle: 220,
      endAngle: -40,
      min: 0,
      max: props.data.maxScore,
      radius: '88%',
      center: ['50%', '52%'],
      progress: {
        show: true,
        width: 16,
        roundCap: true,
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#00b8ff' },
              { offset: 0.5, color: '#00e5ff' },
              { offset: 1, color: '#66d9ff' },
            ],
          },
        },
      },
      axisLine: {
        lineStyle: {
          width: 16,
          color: [[1, 'rgba(102, 217, 255, 0.07)']],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      pointer: { show: false },
      detail: {
        valueAnimation: true,
        fontSize: 76,
        fontWeight: 500,
        fontFamily: 'DIN Alternate, Bahnschrift, sans-serif',
        color: '#f4f8ff',
        offsetCenter: [0, '-8%'],
        textShadow: '0 0 24px rgba(0, 184, 255, 0.44)',
      },
      title: {
        show: true,
        offsetCenter: [0, '32%'],
        fontSize: 17,
        color: '#9fb9db',
        fontWeight: 500,
      },
      data: [{ value: props.data.developmentIndex, name: '综合发展指数' }],
      animationDuration: 2200,
      animationEasing: 'cubicOut',
    },
  ],
}))
</script>

<template>
  <div ref="hubRef" class="center-hub">
    <div class="hub-ambient" aria-hidden="true">
      <span class="ambient-beam beam-h" />
      <span class="ambient-beam beam-v" />
      <!-- GSAP energy pulse waves -->
      <span class="energy-wave wave-1" />
      <span class="energy-wave wave-2" />
      <span class="energy-wave wave-3" />
      <span class="energy-wave wave-4" />
      <!-- GSAP scanning beam -->
      <span class="scan-beam" />
    </div>

    <div class="hub-orbit">
      <div class="hub-radar" aria-hidden="true">
        <span class="hub-ring ring-1" />
        <span class="hub-ring ring-2" />
        <span class="hub-ring ring-3" />
        <span class="hub-sweep" />
        <span class="orbit-dot dot-1" />
        <span class="orbit-dot dot-2" />
        <span class="orbit-dot dot-3" />
        <span class="hub-axis axis-x" />
        <span class="hub-axis axis-y" />
      </div>

      <div class="hub-particles" aria-hidden="true">
        <span v-for="n in 10" :key="n" class="particle" :style="{ '--i': n }" />
        <!-- GSAP data nodes on elliptical orbits -->
        <span class="data-node node-1" />
        <span class="data-node node-2" />
        <span class="data-node node-3" />
      </div>

      <HubKpiItem
        v-for="(kpi, idx) in data.kpis"
        :key="kpi.key"
        :label="kpi.label"
        :value="kpi.value"
        :trend="kpi.trend"
        :icon="dotColors[kpi.key]"
        :position="kpiMeta[kpi.key].position"
        :enter-delay="idx * 0.12"
      />

      <div class="gauge-area">
        <span class="gauge-pulse-ring" aria-hidden="true" />
        <span class="gauge-pulse-ring delay" aria-hidden="true" />
        <div class="gauge-glow" aria-hidden="true" />
        <ChartContainer :option="gaugeOption" />
        <div class="gauge-core" aria-hidden="true" />
        <div class="star-row">
          <svg
            v-for="n in data.starLevel"
            :key="n"
            class="star-icon"
            aria-hidden="true"
          >
            <use href="/icons.svg#icon-star" />
          </svg>
        </div>
        <span class="max-score">/ {{ data.maxScore }}</span>
      </div>
    </div>

    <!-- bottom cityscape divider -->
    <div class="hub-footer">
      <svg viewBox="0 0 600 40" preserveAspectRatio="xMidYMax meet" class="footer-svg">
        <line x1="0" y1="38" x2="600" y2="38" stroke="rgba(0, 212, 255, 0.06)" stroke-width="1" />

        <!-- Cityscape buildings -->
        <rect x="30" y="10" width="40" height="28" fill="none" stroke="rgba(0, 212, 255, 0.06)" stroke-width="0.8" rx="2" />
        <rect x="85" y="18" width="32" height="20" fill="none" stroke="rgba(0, 212, 255, 0.05)" stroke-width="0.8" rx="2" />
        <rect x="135" y="6" width="48" height="32" fill="none" stroke="rgba(0, 212, 255, 0.08)" stroke-width="0.8" rx="2" />
        <rect x="200" y="14" width="36" height="24" fill="none" stroke="rgba(0, 212, 255, 0.06)" stroke-width="0.8" rx="2" />
        <rect x="255" y="4" width="56" height="34" fill="none" stroke="rgba(0, 212, 255, 0.09)" stroke-width="0.8" rx="2" />
        <rect x="330" y="16" width="44" height="22" fill="none" stroke="rgba(0, 212, 255, 0.06)" stroke-width="0.8" rx="2" />
        <rect x="395" y="8" width="38" height="30" fill="none" stroke="rgba(0, 212, 255, 0.07)" stroke-width="0.8" rx="2" />
        <rect x="450" y="20" width="50" height="18" fill="none" stroke="rgba(0, 212, 255, 0.05)" stroke-width="0.8" rx="2" />
        <rect x="520" y="12" width="42" height="26" fill="none" stroke="rgba(0, 212, 255, 0.06)" stroke-width="0.8" rx="2" />

        <!-- Light dots on buildings -->
        <rect class="win-light" x="45" y="14" width="2" height="2" fill="rgba(0, 229, 255, 0.2)" rx="0.5" />
        <rect class="win-light" x="55" y="18" width="2" height="2" fill="rgba(0, 229, 255, 0.15)" rx="0.5" />
        <rect class="win-light" x="150" y="10" width="2" height="2" fill="rgba(0, 229, 255, 0.25)" rx="0.5" />
        <rect class="win-light" x="155" y="16" width="2" height="2" fill="rgba(0, 229, 255, 0.15)" rx="0.5" />
        <rect class="win-light" x="143" y="22" width="2" height="2" fill="rgba(0, 229, 255, 0.18)" rx="0.5" />
        <rect class="win-light" x="270" y="8" width="2" height="2" fill="rgba(0, 229, 255, 0.3)" rx="0.5" />
        <rect class="win-light" x="265" y="16" width="2" height="2" fill="rgba(0, 229, 255, 0.2)" rx="0.5" />
        <rect class="win-light" x="278" y="20" width="2" height="2" fill="rgba(0, 229, 255, 0.15)" rx="0.5" />
        <rect class="win-light" x="410" y="12" width="2" height="2" fill="rgba(0, 229, 255, 0.22)" rx="0.5" />
        <rect class="win-light" x="415" y="18" width="2" height="2" fill="rgba(0, 229, 255, 0.15)" rx="0.5" />
        <rect class="win-light" x="535" y="16" width="2" height="2" fill="rgba(0, 229, 255, 0.18)" rx="0.5" />
        <rect class="win-light" x="545" y="22" width="2" height="2" fill="rgba(0, 229, 255, 0.12)" rx="0.5" />

        <!-- Base glow -->
        <ellipse cx="300" cy="38" rx="200" ry="6" fill="rgba(0, 184, 255, 0.03)" />
      </svg>
    </div>
  </div>
</template>

<style scoped lang="scss">
.center-hub {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.hub-orbit {
  flex: 1;
  position: relative;
  min-height: 0;
  padding: 10px 12px;
  overflow: hidden;
  animation: hub-fade-in 1s ease-out both;
}

// ── Ambient cross beams ─────────────────────────────────────
.hub-ambient {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ambient-beam {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.35;
}

.beam-h {
  width: 120%;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.5), transparent);
  /* GSAP controls autoAlpha + scaleX */
}

.beam-v {
  width: 1px;
  height: 120%;
  background: linear-gradient(180deg, transparent, rgba(0, 229, 255, 0.35), transparent);
  /* GSAP controls autoAlpha + scaleY */
}

.hub-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

/* ── GSAP energy pulse waves ─────────────────────────────── */
.energy-wave {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 60px;
  height: 60px;
  margin: -30px;
  border-radius: 50%;
  border: 1px solid rgba(0, 229, 255, 0.4);
  background: radial-gradient(circle, rgba(0, 184, 255, 0.08) 0%, transparent 70%);
  pointer-events: none;
  /* GSAP controls scale + autoAlpha */
}

/* ── GSAP scanning beam ──────────────────────────────────── */
.scan-beam {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 2px;
  height: 46%;
  margin-left: -1px;
  margin-top: -23%;
  background: linear-gradient(180deg,
    rgba(0, 229, 255, 0.6) 0%,
    rgba(0, 184, 255, 0.18) 60%,
    transparent 100%
  );
  border-radius: 1px;
  transform-origin: center bottom;
  pointer-events: none;
  /* GSAP controls rotation */
}

/* ── GSAP data nodes on elliptical orbits ────────────────── */
.data-node {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 7px;
  height: 7px;
  margin: -3.5px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.9);
  box-shadow: 0 0 10px rgba(0, 184, 255, 0.55), 0 0 2px rgba(255, 255, 255, 0.5);
  pointer-events: none;
  /* GSAP controls x, y, scale, autoAlpha */
}

.node-1 { background: rgba(0, 229, 255, 0.9); box-shadow: 0 0 10px rgba(0, 184, 255, 0.55); }
.node-2 { background: rgba(139, 92, 246, 0.9); box-shadow: 0 0 10px rgba(139, 92, 246, 0.5); }
.node-3 { background: rgba(240, 192, 64, 0.9); box-shadow: 0 0 10px rgba(240, 192, 64, 0.5); }

.particle {
  position: absolute;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.55);
  box-shadow: 0 0 8px rgba(0, 184, 255, 0.45);
  left: calc(10% + var(--i) * 8%);
  bottom: calc(6% + var(--i) * 2.2%);
  animation: particle-rise 4.5s ease-in-out infinite;
  animation-delay: calc(var(--i) * -0.55s);
  opacity: 0;
}

.hub-radar {
  position: absolute;
  inset: 7% 5% 9%;
  pointer-events: none;
  opacity: 0.9;
  z-index: 0;
}

.hub-ring,
.hub-axis {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.hub-ring {
  border: 1px solid rgba(102, 217, 255, 0.08);
  border-radius: 50%;
  box-shadow: inset 0 0 28px rgba(0, 184, 255, 0.025);
}

.ring-1 {
  width: 34%;
  aspect-ratio: 1;
  animation: ring-breathe 4s ease-in-out infinite;
}

.ring-2 {
  width: 52%;
  aspect-ratio: 1;
  border-style: dashed;
  opacity: 0.78;
  /* GSAP controls rotation */
}

.ring-3 {
  width: 70%;
  aspect-ratio: 1;
  opacity: 0.45;
  /* GSAP controls reverse rotation */
}

.hub-sweep {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 72%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    transparent 300deg,
    rgba(0, 229, 255, 0.22) 328deg,
    rgba(0, 229, 255, 0.04) 360deg
  );
  mask: radial-gradient(circle, transparent 18%, #000 19%, #000 100%);
  -webkit-mask: radial-gradient(circle, transparent 18%, #000 19%, #000 100%);
  animation: radar-sweep 6s linear infinite;
}

.orbit-dot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 6px;
  height: 6px;
  margin: -3px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.85);
  box-shadow: 0 0 10px rgba(0, 184, 255, 0.6);
}

.dot-1 {
  offset-path: circle(26% at 50% 50%);
  animation: orbit-travel 14s linear infinite;
}

.dot-2 {
  offset-path: circle(38% at 50% 50%);
  animation: orbit-travel 22s linear infinite reverse;
  background: rgba(240, 192, 64, 0.9);
  box-shadow: 0 0 10px rgba(240, 192, 64, 0.5);
}

.dot-3 {
  offset-path: circle(48% at 50% 50%);
  animation: orbit-travel 32s linear infinite;
  width: 4px;
  height: 4px;
  margin: -2px;
  opacity: 0.7;
}

.hub-axis {
  background: linear-gradient(90deg, transparent, rgba(102, 217, 255, 0.18), transparent);
}

.axis-x {
  width: 78%;
  height: 1px;
  animation: axis-flicker 3s ease-in-out infinite;
}

.axis-y {
  width: 1px;
  height: 78%;
  background: linear-gradient(180deg, transparent, rgba(102, 217, 255, 0.14), transparent);
  animation: axis-flicker 3.6s ease-in-out infinite reverse;
}

// ── Gauge ───────────────────────────────────────────────────
.gauge-area {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -52%);
  width: min(390px, 90%);
  height: min(390px, 78%);
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(0, 184, 255, 0.08) 0%, rgba(0, 184, 255, 0.02) 40%, transparent 68%);
  filter: drop-shadow(0 18px 36px rgba(0, 0, 0, 0.24));
  animation: gauge-enter 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: 0.15s;
  z-index: 1;
}

.gauge-glow {
  position: absolute;
  inset: -8%;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  background: radial-gradient(circle, rgba(0, 184, 255, 0.14) 0%, transparent 68%);
  animation: gauge-glow-pulse 3.5s ease-in-out infinite;
}

.gauge-pulse-ring {
  position: absolute;
  inset: 8%;
  border-radius: 50%;
  border: 1px solid rgba(0, 229, 255, 0.28);
  pointer-events: none;
  z-index: 0;
  animation: gauge-ring-expand 3.5s ease-out infinite;

  &.delay {
    animation-delay: 1.75s;
  }
}

.gauge-area :deep(.chart-container) {
  position: relative;
  z-index: 1;
}

.gauge-core {
  position: absolute;
  inset: 27%;
  z-index: 0;
  border-radius: 50%;
  pointer-events: none;
  border: 1px solid rgba(102, 217, 255, 0.08);
  background: radial-gradient(circle, rgba(4, 18, 42, 0.46), rgba(0, 184, 255, 0.02) 70%);
  animation: core-breathe 4s ease-in-out infinite;
}

.star-row {
  position: absolute;
  bottom: 19%;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  z-index: 2;
}

.star-icon {
  width: 16px;
  height: 16px;
  color: $color-accent-gold;
  filter: drop-shadow(0 0 4px rgba(240, 192, 64, 0.5));
  animation: star-twinkle 3s ease-in-out infinite;

  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.6s; }
  &:nth-child(3) { animation-delay: 1.2s; }
  &:nth-child(4) { animation-delay: 1.8s; }
  &:nth-child(5) { animation-delay: 2.4s; }
}

@keyframes star-twinkle {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50%      { opacity: 1; transform: scale(1.1); }
}

.max-score {
  position: absolute;
  bottom: 30%;
  right: 20%;
  z-index: 2;
  font-size: $college-fs-sm;
  color: rgba(174, 198, 230, 0.52);
  font-family: var(--college-font-number);
}

// ── Footer ──────────────────────────────────────────────────
.hub-footer {
  height: 42px;
  flex-shrink: 0;
  opacity: 0.58;
}

.footer-svg { width: 100%; height: 100%; }

.win-light {
  animation: win-blink 3s ease-in-out infinite;

  &:nth-child(odd) { animation-delay: 0.8s; }
  &:nth-child(3n) { animation-delay: 1.6s; }
}

@keyframes hub-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes particle-rise {
  0%   { opacity: 0; transform: translateY(0) scale(0.6); }
  20%  { opacity: 0.75; }
  80%  { opacity: 0.35; }
  100% { opacity: 0; transform: translateY(-72px) scale(1); }
}

@keyframes ring-breathe {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.85; }
  50%      { transform: translate(-50%, -50%) scale(1.03); opacity: 1; }
}

@keyframes radar-sweep {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to   { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes orbit-travel {
  from { offset-distance: 0%; }
  to   { offset-distance: 100%; }
}

@keyframes axis-flicker {
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
}

@keyframes gauge-enter {
  from {
    opacity: 0;
    transform: translate(-50%, -52%) scale(0.88);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -52%) scale(1);
  }
}

@keyframes gauge-glow-pulse {
  0%, 100% { opacity: 0.45; transform: scale(0.96); }
  50%      { opacity: 1; transform: scale(1.04); }
}

@keyframes gauge-ring-expand {
  0%   { transform: scale(0.82); opacity: 0.55; }
  100% { transform: scale(1.18); opacity: 0; }
}

@keyframes core-breathe {
  0%, 100% { box-shadow: inset 0 0 24px rgba(0, 184, 255, 0.04); }
  50%      { box-shadow: inset 0 0 36px rgba(0, 184, 255, 0.1); }
}

@keyframes win-blink {
  0%, 100% { opacity: 0.35; }
  50%      { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .hub-orbit,
  .gauge-area,
  .hub-ring,
  .hub-sweep,
  .orbit-dot,
  .particle,
  .gauge-glow,
  .gauge-pulse-ring,
  .gauge-core,
  .axis-x,
  .axis-y,
  .star-icon,
  .win-light {
    animation: none !important;
  }
}
</style>
