<script setup lang="ts">
import { computed } from 'vue'
import CockpitCoreMetric from '@/components/college/CockpitCoreMetric.vue'
import { kpiLayout } from '@/constants/college/college-kpi'
import type { OverviewHubKpiVM, OverviewHubVM } from '@/types/college/view'
import { scoreToneFromValue } from '@/utils/scoreTone'

const props = defineProps<{
  data: OverviewHubVM
  centerLabel?: string
  /** 中心指数悬停说明（学生舱新手引导） */
  centerTip?: string
}>()

const gaugeDeg = computed(() => {
  const value = props.data.developmentIndex
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return `${percent * 3.6}deg`
})

const stars = computed(() => '★'.repeat(props.data.starLevel))

const centerTitle = computed(() => props.centerLabel ?? '学院综合发展指数')

const centerTone = computed(() => scoreToneFromValue(props.data.developmentIndex))

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
      :details="kpi.details"
      :level-text="kpi.levelText"
      :score-tone="kpi.scoreTone"
      :tip="kpi.tip"
    />

    <div class="core-hero-core">
      <div class="core-gauge-square">
        <div
          class="core-gauge core-gauge--hero"
          :class="[`core-gauge--tone-${centerTone}`, { 'core-gauge--has-tip': Boolean(centerTip) }]"
        >
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
            <em v-if="data.centerDelta" class="core-gauge__delta">{{ data.centerDelta }}</em>
            <small>（满分{{ data.maxScore }}）</small>
            <b>{{ stars }}</b>
          </div>
          <p v-if="centerTip" class="core-gauge__tip" role="tooltip">{{ centerTip }}</p>
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

<style scoped lang="scss">
.core-gauge__delta {
  display: block;
  margin-top: 2px;
  color: #67e8a3;
  font-size: 12px;
  font-style: normal;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.core-gauge--tone-risk .core-gauge__content strong {
  color: #ff6b6b;
  text-shadow: 0 0 16px rgba(255, 80, 80, 0.55);
}

.core-gauge--tone-warn .core-gauge__content strong {
  color: #ffd666;
  text-shadow: 0 0 16px rgba(255, 200, 80, 0.5);
}

.core-gauge--tone-good .core-gauge__content strong {
  color: #5ec8ff;
  text-shadow: 0 0 16px rgba(80, 200, 255, 0.55);
}

.core-gauge--has-tip {
  overflow: visible;
}

.core-gauge__tip {
  position: absolute;
  z-index: 8;
  left: 50%;
  bottom: calc(100% - 18px);
  width: max-content;
  max-width: 240px;
  padding: 8px 10px;
  border: 1px solid rgba(120, 200, 255, 0.35);
  border-radius: 6px;
  background: rgba(6, 24, 48, 0.96);
  box-shadow: 0 8px 22px rgba(0, 0, 0, 0.45);
  color: #d7eefc;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
  line-height: 1.45;
  text-align: left;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    visibility 0s linear 0.45s;
}

.core-gauge--has-tip:hover .core-gauge__tip {
  opacity: 1;
  visibility: visible;
  transition-delay: 0.45s, 0.45s;
}
</style>
