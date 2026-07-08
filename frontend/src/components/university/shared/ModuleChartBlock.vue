<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { uniAreaLine, uniDonut, uniGlowBars, uniGroupedBars, uniRadar, uniRoundedBars } from '@/components/university/charts/presets'
import type { ModuleChartLineDTO } from '@/types/university/api/modules'

const props = defineProps<{ chart?: ModuleChartLineDTO }>()

const option = computed(() => {
  const c = props.chart
  if (!c) return null
  if (c.type === 'line') return uniAreaLine(c.categories ?? [], c.values ?? [])
  if (c.type === 'bar') return uniGlowBars(c.categories ?? [], c.values ?? [])
  if (c.type === 'donut') return uniDonut(c.data ?? [])
  if (c.type === 'groupedBar') return uniGroupedBars(c.categories ?? [], c.series ?? [])
  if (c.type === 'radar') return uniRadar(c.indicators ?? [], (c.radarSeries ?? []).map((s) => ({ name: s.name, value: s.value })))
  if (c.type === 'hbar') return uniRoundedBars(c.categories ?? [], c.values ?? [], ['#33d9ff', '#37e0a4', '#4b8dff', '#ffb057'])
  return null
})
</script>

<template>
  <ChartContainer v-if="option" :option="option" class="module-chart" />
</template>

<style scoped lang="scss">
.module-chart { flex: 1; min-height: 80px; }
</style>
