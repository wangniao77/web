<script setup lang="ts">
import type { ModuleKpiDTO } from '@/types/university/api/modules'

defineProps<{ kpis: ModuleKpiDTO[] }>()
</script>

<template>
  <div class="kpi-strip">
    <div v-for="k in kpis" :key="k.label" class="kpi-strip__item">
      <span>{{ k.label }}</span>
      <strong>{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></strong>
      <em v-if="k.trend">{{ k.trend }}</em>
    </div>
  </div>
</template>

<style scoped lang="scss">
.kpi-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
  gap: 6px;
}
.kpi-strip__item {
  padding: 6px 8px;
  background: rgba(8, 22, 42, 0.45);
  border: 1px solid rgba(90, 170, 255, 0.1);
  span { display: block; font-size: var(--uni-fs-micro); color: var(--uni-text-muted); }
  strong { font-family: var(--uni-font-number); font-size: var(--uni-fs-metric-sm); color: var(--uni-accent-cyan); }
  small { font-size: var(--uni-fs-micro); color: var(--uni-text-secondary); }
  em { display: block; font-size: var(--uni-fs-micro); color: var(--uni-status-normal); font-style: normal; }
}
</style>
