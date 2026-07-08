<script setup lang="ts">
import CircularHud from '@/components/university/CircularHud.vue'
import type { OrbitKpiVM } from '@/types/university/view/modules'

const props = defineProps<{
  developmentIndex: number
  yoyChangeLabel: string
  orbitKpis: OrbitKpiVM[]
}>()

const posClass: Record<string, string> = {
  tl: 'orbit--tl', tr: 'orbit--tr', ml: 'orbit--ml', mr: 'orbit--mr',
  bl: 'orbit--bl', br: 'orbit--br', ll: 'orbit--ll', rr: 'orbit--rr',
}
</script>

<template>
  <div class="hero-gauge">
    <div
      v-for="kpi in orbitKpis"
      :key="kpi.key"
      class="orbit"
      :class="posClass[kpi.position]"
    >
      <span class="orbit__label">{{ kpi.label }}</span>
      <strong>{{ kpi.valueLabel }}<small v-if="kpi.unit">{{ kpi.unit }}</small></strong>
    </div>

    <div class="hero-gauge__core">
      <CircularHud :value="developmentIndex" :planned="developmentIndex" label="发展指数" />
      <em class="hero-gauge__yoy">同比 {{ yoyChangeLabel }}</em>
    </div>
  </div>
</template>

<style scoped lang="scss">
.hero-gauge {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.hero-gauge__core {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.hero-gauge__yoy {
  font-size: var(--uni-fs-small);
  color: var(--uni-status-normal);
  font-style: normal;
}

.orbit {
  position: absolute;
  padding: 8px 12px;
  background: rgba(8, 22, 42, 0.65);
  border: 1px solid rgba(90, 170, 255, 0.15);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
  min-width: 84px;
  text-align: center;

  &__label { display: block; font-size: var(--uni-fs-micro); color: var(--uni-text-muted); margin-bottom: 3px; }
  strong { font-family: var(--uni-font-number); font-size: var(--uni-fs-metric-sm); color: var(--uni-accent-cyan); }
  small { font-size: var(--uni-fs-micro); color: var(--uni-text-secondary); margin-left: 2px; }

  &--tl { top: 6%; left: 4%; }
  &--tr { top: 6%; right: 4%; }
  &--ml { top: 50%; left: 2%; transform: translateY(-50%); }
  &--mr { top: 50%; right: 2%; transform: translateY(-50%); }
  &--ll { bottom: 6%; left: 4%; }
  &--rr { bottom: 6%; right: 4%; }
  &--bl { bottom: 4%; left: 22%; }
  &--br { bottom: 4%; right: 22%; }
}
</style>
