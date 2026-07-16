<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    value: number
    planned: number
    label?: string
  }>(),
  { label: '年度目标达成度' },
)

const SIZE = 260
const C = SIZE / 2

const rActual = 96
const circActual = 2 * Math.PI * rActual
const actualDash = computed(() => (clamp(props.value) / 100) * circActual)
const plannedDash = computed(() => (clamp(props.planned) / 100) * circActual)

// planned target node position (angle from top, clockwise)
const plannedNode = computed(() => {
  const deg = (clamp(props.planned) / 100) * 360 - 90
  const rad = (deg * Math.PI) / 180
  return { x: C + rActual * Math.cos(rad), y: C + rActual * Math.sin(rad) }
})

// outer segmented ticks
const rTick = 116
const tickLines = computed(() =>
  Array.from({ length: 60 }, (_, i) => {
    const major = i % 5 === 0
    const len = major ? 10 : 5
    const deg = (i / 60) * 360 - 90
    const rad = (deg * Math.PI) / 180
    const inner = rTick - len
    return {
      x1: C + rTick * Math.cos(rad),
      y1: C + rTick * Math.sin(rad),
      x2: C + inner * Math.cos(rad),
      y2: C + inner * Math.sin(rad),
      major,
    }
  }),
)

function clamp(v: number) {
  return Math.min(100, Math.max(0, v))
}
</script>

<template>
  <div class="hud">
    <span class="hud__aura" aria-hidden="true" />
    <svg :viewBox="`0 0 ${SIZE} ${SIZE}`" class="hud__svg">
      <defs>
        <linearGradient id="hudActual" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#33d9ff" />
          <stop offset="55%" stop-color="#37e0a4" />
          <stop offset="100%" stop-color="#33d9ff" />
        </linearGradient>
        <radialGradient id="hudCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="rgba(51,217,255,0.22)" />
          <stop offset="70%" stop-color="rgba(51,217,255,0.05)" />
          <stop offset="100%" stop-color="transparent" />
        </radialGradient>
      </defs>

      <!-- core glow -->
      <circle :cx="C" :cy="C" r="72" fill="url(#hudCore)" />

      <!-- rotating outer tick ring -->
      <g class="hud__spin">
        <line
          v-for="(t, i) in tickLines"
          :key="i"
          :x1="t.x1"
          :y1="t.y1"
          :x2="t.x2"
          :y2="t.y2"
          :stroke="t.major ? 'rgba(51,217,255,0.55)' : 'rgba(90,170,255,0.22)'"
          stroke-width="1.4"
        />
      </g>

      <!-- track -->
      <circle :cx="C" :cy="C" :r="rActual" fill="none" stroke="rgba(90,170,255,0.16)" stroke-width="13" />

      <!-- planned (dashed, subtle) -->
      <circle
        :cx="C"
        :cy="C"
        :r="rActual"
        fill="none"
        stroke="rgba(75,141,255,0.5)"
        stroke-width="3"
        stroke-linecap="round"
        :style="{ strokeDasharray: `${plannedDash} ${circActual}` }"
        :transform="`rotate(-90 ${C} ${C})`"
      />

      <!-- actual progress -->
      <circle
        :cx="C"
        :cy="C"
        :r="rActual"
        fill="none"
        stroke="url(#hudActual)"
        stroke-width="11"
        stroke-linecap="round"
        :style="{ strokeDasharray: `${actualDash} ${circActual}` }"
        :transform="`rotate(-90 ${C} ${C})`"
        class="hud__actual"
      />

      <!-- planned target node -->
      <circle :cx="plannedNode.x" :cy="plannedNode.y" r="4" fill="#4b8dff" class="hud__node" />

      <!-- inner counter-rotating ring -->
      <circle :cx="C" :cy="C" r="60" fill="none" stroke="rgba(51,217,255,0.16)" stroke-width="1" stroke-dasharray="2 8" class="hud__spin-rev" />
    </svg>

    <div class="hud__center">
      <strong class="hud__value">{{ value.toFixed(1) }}<span>%</span></strong>
      <span class="hud__label">{{ label }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hud {
  position: relative;
  width: 100%;
  max-width: 384px;
  aspect-ratio: 1 / 1;
  margin: 0 auto;
}

.hud__aura {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 128%;
  height: 128%;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(51, 217, 255, 0.26), rgba(51, 217, 255, 0.07) 46%, transparent 66%);
  filter: blur(26px);
  pointer-events: none;
  z-index: 0;
  animation: hud-breathe 6s ease-in-out infinite;
}

.hud__svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  overflow: visible;
}

.hud__spin {
  transform-origin: center;
  animation: hud-rotate 24s linear infinite;
}

.hud__spin-rev {
  transform-origin: center;
  animation: hud-rotate 16s linear infinite reverse;
}

.hud__actual {
  filter: drop-shadow(0 0 6px rgba(51, 217, 255, 0.55));
  transition: stroke-dasharray 1.1s cubic-bezier(0.16, 1, 0.3, 1);
}

.hud__node {
  filter: drop-shadow(0 0 4px rgba(75, 141, 255, 0.8));
}

.hud__center {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  // foreground plate: lifts the number off the ring layer
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 62%;
    height: 62%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, rgba(4, 12, 26, 0.72), rgba(4, 12, 26, 0.28) 55%, transparent 74%);
    z-index: -1;
  }
}

.hud__value {
  font-family: var(--uni-font-number);
  font-size: 70px;
  font-weight: 700;
  line-height: 1;
  color: #f4fbff;
  text-shadow: 0 0 38px rgba(51, 217, 255, 0.75), 0 0 12px rgba(51, 217, 255, 0.6);

  span { font-size: 0.42em; color: var(--uni-accent-cyan); margin-left: 2px; }
}

.hud__label {
  margin-top: 9px;
  font-size: var(--uni-fs-body);
  color: var(--uni-text-secondary);
  letter-spacing: 0.08em;
}

@keyframes hud-rotate { to { transform: rotate(360deg); } }

@keyframes hud-breathe {
  0%, 100% { opacity: 0.75; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.05); }
}
</style>
