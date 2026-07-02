<script setup lang="ts">
import type { TrendInfo } from '@/types/api/common'

defineProps<{
  label: string
  value: string
  icon?: string
  trend?: TrendInfo
  position: 'tl' | 'tr' | 'ml' | 'mr' | 'bl' | 'br'
  enterDelay?: number
}>()

function trendClass(direction?: string) {
  if (direction === 'up') return 'trend-up'
  if (direction === 'down') return 'trend-down'
  return 'trend-flat'
}

function trendText(trend?: TrendInfo) {
  if (!trend || trend.direction === 'flat') return ''
  const arrow = trend.direction === 'up' ? '&#8593;' : '&#8595;'
  return `${arrow} ${trend.value}${trend.unit || ''}`
}
</script>

<template>
  <div
    class="kpi"
    :class="`pos-${position}`"
    :style="{ '--dot-color': icon, '--enter-delay': `${enterDelay ?? 0}s` }"
  >
    <div class="kpi-glow" />
    <div class="kpi-dot" :style="{ background: icon }" />
    <div class="kpi-body">
      <span class="kpi-label">{{ label }}</span>
      <span class="kpi-value">{{ value }}</span>
      <span
        v-if="trend && trend.direction !== 'flat'"
        class="kpi-trend"
        :class="trendClass(trend.direction)"
        v-html="trendText(trend)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 132px;
  max-width: 42%;
  padding: 10px 13px;
  background:
    linear-gradient(135deg, rgba(16, 42, 86, 0.72), rgba(5, 17, 46, 0.62)),
    rgba(5, 15, 39, 0.72);
  border: 1px solid rgba(102, 217, 255, 0.14);
  border-radius: 8px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  transition: border-color $transition-base, background $transition-base, box-shadow $transition-base, transform $transition-base;
  animation:
    kpi-enter 0.75s cubic-bezier(0.22, 1, 0.36, 1) both,
    kpi-float 5s ease-in-out infinite;
  animation-delay: var(--enter-delay), calc(var(--enter-delay) + 0.75s);
  z-index: 2;

  &:hover {
    transform: translateY(-2px);
    animation-play-state: paused, paused;
    border-color: rgba(102, 217, 255, 0.32);
    background:
      linear-gradient(135deg, rgba(20, 52, 104, 0.78), rgba(6, 20, 52, 0.72)),
      rgba(5, 15, 39, 0.8);
    box-shadow:
      0 12px 32px rgba(0, 0, 0, 0.28),
      0 0 18px rgba(0, 184, 255, 0.08),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }
}

// Neon glow dot on hover
.kpi-glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: 8px;
  opacity: 0;
  background: linear-gradient(90deg, rgba(0, 229, 255, 0.06), transparent 60%);
  box-shadow: inset 0 0 20px rgba(0, 184, 255, 0.06);
  transition: opacity $transition-base;
}

.kpi:hover .kpi-glow {
  opacity: 1;
}

// 安全区内环绕仪表盘（勿用负值，避免全屏裁切）
.pos-tl { top: 4%; left: 4%; }
.pos-tr { top: 4%; right: 4%; }
.pos-ml { top: 35%; left: 3.5%; }
.pos-mr { top: 35%; right: 3.5%; }
.pos-bl { bottom: 19%; left: 4%; }
.pos-br { bottom: 19%; right: 4%; }

// Colored indicator dot
.kpi-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--dot-color);
  box-shadow: 0 0 12px var(--dot-color), 0 0 24px rgba(0, 184, 255, 0.16);
  animation: dot-pulse 2.4s ease-in-out infinite;
}

.kpi-body { display: flex; flex-direction: column; gap: 2px; }
.kpi-label { font-size: $college-fs-label; color: rgba(174, 198, 230, 0.62); white-space: nowrap; }

.kpi-value {
  font-family: var(--college-font-number);
  font-size: $college-fs-hero;
  font-weight: 700;
  color: #f4f8ff;
  line-height: 1.1;
  text-shadow: 0 0 10px rgba(0, 184, 255, 0.18);
}

.kpi-trend { font-size: $college-fs-xs; margin-top: 2px; }

@keyframes kpi-enter {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.92);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes kpi-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-3px); }
}

@keyframes dot-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.25); opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .kpi,
  .kpi-dot {
    animation: none !important;
  }
}
</style>
