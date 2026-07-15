<script setup lang="ts">
import { computed } from 'vue'
import CockpitCoreMetric from '@/components/college/CockpitCoreMetric.vue'
import { kpiLayout } from '@/constants/college/college-kpi'
import type { OverviewHubKpiVM, OverviewHubVM } from '@/types/college/view'

const props = defineProps<{
  data: OverviewHubVM
  centerLabel?: string
}>()

const gaugeDeg = computed(() => {
  const value = props.data.developmentIndex
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return `${percent * 3.6}deg`
})

const stars = computed(() => '★'.repeat(props.data.starLevel))

const centerTitle = computed(() => props.centerLabel ?? '学院综合发展指数')

function kpiIcon(kpi: OverviewHubKpiVM) {
  if (kpi.icon) return kpi.icon
  if (kpi.key) return kpiLayout[kpi.key].icon
  return 'academic'
}

function kpiPosition(kpi: OverviewHubKpiVM) {
  if (kpi.position) return kpi.position
  if (kpi.key) return kpiLayout[kpi.key].position
  return 'tl'
}
</script>

<template>
  <section class="core-hero-stage">
    <div class="core-hero-stage__glow" aria-hidden="true" />

    <CockpitCoreMetric
      v-for="kpi in data.kpis"
      :key="kpi.key ?? kpi.label"
      :label="kpi.label"
      :value="kpi.value"
      :trend="kpi.trend"
      :icon="kpiIcon(kpi)"
      :position="kpiPosition(kpi)"
    />

    <div class="core-hero-core">
      <div class="core-gauge-square">
        <div class="core-gauge core-gauge--hero">
          <div class="core-gauge__scan-ring" aria-hidden="true" />
          <div class="core-gauge__orbit-ring core-gauge__orbit-ring--1" aria-hidden="true" />
          <div class="core-gauge__orbit-ring core-gauge__orbit-ring--2" aria-hidden="true" />
          <div class="core-gauge__outer-ring" aria-hidden="true" />
          <div class="core-gauge__halo" aria-hidden="true" />
          <div class="core-gauge__track" aria-hidden="true" />
          <div class="core-gauge__progress" aria-hidden="true" :style="{ '--gauge-deg': gaugeDeg }" />
          <div class="core-gauge__ticks" />
          <div class="core-gauge__ring core-gauge__ring--outer" />
          <div class="core-gauge__ring core-gauge__ring--inner" />
          <div class="core-gauge__content">
            <span>{{ centerTitle }}</span>
            <strong>{{ data.developmentIndex }}</strong>
            <small>（满分{{ data.maxScore }}）</small>
            <b>{{ stars }}</b>
          </div>
        </div>
      </div>

      <div class="core-hero-platform" aria-hidden="true">
        <div class="core-hero-platform__beam core-hero-platform__beam--1" />
        <div class="core-hero-platform__beam core-hero-platform__beam--2" />
        <div class="core-hero-platform__beam core-hero-platform__beam--3" />
        <div class="core-hero-platform__disc core-hero-platform__disc--1" />
        <div class="core-hero-platform__disc core-hero-platform__disc--2" />
        <div class="core-hero-platform__disc core-hero-platform__disc--3" />
        <div class="core-hero-platform__city">
          <span /><span /><span /><span /><span /><span /><span /><span /><span /><span /><span />
        </div>
      </div>
    </div>
  </section>
</template>
