<script setup lang="ts">
import { computed } from 'vue'
import type { RiskLevel } from '@/domains/university/constants/risk'

const props = withDefaults(
  defineProps<{
    label: string
    value: number
    level?: RiskLevel
    trendLabel?: string
    size?: number
  }>(),
  { level: 'normal', size: 62 },
)

const COLORS: Record<RiskLevel, string> = {
  normal: '#37e0a4',
  ongoing: '#4b8dff',
  attention: '#ffb057',
  warning: '#ff6b78',
}

const color = computed(() => COLORS[props.level])
const r = computed(() => props.size / 2 - 5)
const circ = computed(() => 2 * Math.PI * r.value)
const dash = computed(() => (Math.min(100, Math.max(0, props.value)) / 100) * circ.value)
</script>

<template>
  <div class="ring-stat" :style="{ '--rs-color': color }">
    <div class="ring-stat__ring" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg :viewBox="`0 0 ${size} ${size}`">
        <circle :cx="size / 2" :cy="size / 2" :r="r" fill="none" stroke="rgba(90,170,255,0.12)" stroke-width="4" />
        <circle
          :cx="size / 2"
          :cy="size / 2"
          :r="r"
          fill="none"
          :stroke="color"
          stroke-width="4"
          stroke-linecap="round"
          :stroke-dasharray="`${dash} ${circ}`"
          :transform="`rotate(-90 ${size / 2} ${size / 2})`"
          class="ring-stat__arc"
        />
      </svg>
      <span class="ring-stat__value">{{ value }}<i>%</i></span>
    </div>
    <div class="ring-stat__meta">
      <span class="ring-stat__label">{{ label }}</span>
      <em v-if="trendLabel" class="ring-stat__trend">{{ trendLabel }}</em>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ring-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  max-width: 76px;
}

.ring-stat__ring {
  position: relative;
  flex-shrink: 0;

  svg { width: 100%; height: 100%; }
}

.ring-stat__arc {
  filter: drop-shadow(0 0 4px var(--rs-color));
  transition: stroke-dasharray 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.ring-stat__value {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--uni-font-number);
  font-size: var(--uni-fs-label);
  font-weight: 700;
  color: var(--uni-text-primary);

  i { font-style: normal; font-size: 0.58em; color: var(--uni-text-secondary); margin-left: 1px; }
}

.ring-stat__meta {
  text-align: center;
  line-height: 1.2;
}

.ring-stat__label {
  display: block;
  font-size: var(--uni-fs-meta);
  color: var(--uni-text-secondary);
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ring-stat__trend {
  font-style: normal;
  font-size: var(--uni-fs-meta);
  color: var(--rs-color);
}
</style>
