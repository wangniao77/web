<script setup lang="ts">
import { computed } from 'vue'
import { DigitalFlop } from '@kjgl77/datav-vue3'
import CockpitCoreMetric from '@/domains/college/components/CockpitCoreMetric.vue'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import UniversityPanelBorder from '@/domains/university/components/UniversityPanelBorder.vue'
import { UNIVERSITY_DIGITAL_FLOP_STYLE } from '@/domains/university/constants/datav-theme'
import type { SchoolHubVM } from '@/domains/university/types/view'

const props = defineProps<{
  data: SchoolHubVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const gaugeDeg = computed(() => {
  const value = props.data.developmentIndex
  const percent = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0
  return `${percent * 3.6}deg`
})

const flopConfig = computed(() => ({
  number: [props.data.developmentIndex],
  content: '{nt}',
  toFixed: 1,
  textAlign: 'center' as const,
  style: UNIVERSITY_DIGITAL_FLOP_STYLE,
  animationCurve: 'easeOutCubic',
  animationFrame: 50,
}))

const deltaLabel = computed(() =>
  props.data.yearDelta >= 0 ? `↑ ${props.data.yearDelta}` : `↓ ${Math.abs(props.data.yearDelta)}`,
)
</script>

<template>
  <UniversityPanelBorder variant="13">
    <CollegePanelCard
      :index="2"
      title="学校总体态势"
      :loading="loading"
      :error="error"
      @retry="$emit('retry')"
    >
      <section class="core-hero-stage">
        <div class="core-hero-stage__glow" aria-hidden="true" />

        <CockpitCoreMetric
          v-for="kpi in data.kpis"
          :key="kpi.key"
          :label="kpi.label"
          :value="kpi.value"
          :trend="kpi.trend"
          :icon="kpi.icon"
          :position="kpi.position"
        />

        <div class="core-hero-core">
          <div class="core-gauge-square">
            <div class="core-gauge core-gauge--hero">
              <div class="core-gauge__scan-ring" aria-hidden="true" />
              <div class="core-gauge__track" aria-hidden="true" />
              <div class="core-gauge__progress" aria-hidden="true" :style="{ '--gauge-deg': gaugeDeg }" />
              <div class="core-gauge__content">
                <span class="hub-level">{{ data.levelLabel }}</span>
                <div class="hub-flop-wrap">
                  <DigitalFlop :config="flopConfig" />
                </div>
                <span class="hub-delta">{{ deltaLabel }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </CollegePanelCard>
  </UniversityPanelBorder>
</template>
