<script setup lang="ts">
import { computed } from 'vue'
import CockpitCoreMetric from '@/components/college/CockpitCoreMetric.vue'
import { kpiLayout } from '@/constants/college/college-kpi'
import type { OverviewHubVM } from '@/types/college/view'

const props = defineProps<{ data: OverviewHubVM }>()

const gaugeDeg = computed(() => {
  const value = props.data.developmentIndex
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return `${percent * 3.6}deg`
})

const leftOrder = ['tl', 'uml', 'lml', 'bl'] as const
const rightOrder = ['tr', 'umr', 'lmr', 'br'] as const

const leftKpis = computed(() =>
  [...props.data.kpis]
    .filter((kpi) => leftOrder.includes((kpiLayout[kpi.key]?.position ?? 'tl') as (typeof leftOrder)[number]))
    .sort(
      (a, b) =>
        leftOrder.indexOf((kpiLayout[a.key]?.position ?? 'tl') as (typeof leftOrder)[number]) -
        leftOrder.indexOf((kpiLayout[b.key]?.position ?? 'tl') as (typeof leftOrder)[number]),
    ),
)

const rightKpis = computed(() =>
  [...props.data.kpis]
    .filter((kpi) => rightOrder.includes((kpiLayout[kpi.key]?.position ?? 'tr') as (typeof rightOrder)[number]))
    .sort(
      (a, b) =>
        rightOrder.indexOf((kpiLayout[a.key]?.position ?? 'tr') as (typeof rightOrder)[number]) -
        rightOrder.indexOf((kpiLayout[b.key]?.position ?? 'tr') as (typeof rightOrder)[number]),
    ),
)
</script>

<template>
  <section class="core-hero-stage">
    <div class="core-hero-stage__glow" aria-hidden="true" />

    <div class="core-hero-stage__rail core-hero-stage__rail--left">
      <CockpitCoreMetric
        v-for="kpi in leftKpis"
        :key="kpi.key"
        :label="kpi.label"
        :value="kpi.value"
        :trend="kpi.trend"
        :icon="kpiLayout[kpi.key]?.icon ?? 'status'"
        :position="kpiLayout[kpi.key]?.position ?? 'tl'"
      />
    </div>

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
            <span>学院综合发展指数</span>
            <strong>{{ data.developmentIndex }}</strong>
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

    <div class="core-hero-stage__rail core-hero-stage__rail--right">
      <CockpitCoreMetric
        v-for="kpi in rightKpis"
        :key="kpi.key"
        :label="kpi.label"
        :value="kpi.value"
        :trend="kpi.trend"
        :icon="kpiLayout[kpi.key]?.icon ?? 'status'"
        :position="kpiLayout[kpi.key]?.position ?? 'tr'"
      />
    </div>
  </section>
</template>
