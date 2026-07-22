<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { uniDonut, uniRoundedBars } from '@/components/university/charts/presets'
import { ROUTES } from '@/constants/routes'
import type { EmploymentRiskModuleVM } from '@/types/university/view/modules'

const props = defineProps<{ data: EmploymentRiskModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()

const donutOption = computed(() => uniDonut(props.data.destination))
const hbarOption = computed(() =>
  uniRoundedBars(
    props.data.unitTypes.map((u) => u.name),
    props.data.unitTypes.map((u) => u.value),
    ['#33d9ff', '#37e0a4', '#4b8dff', '#ffb057'],
  ),
)
</script>

<template>
  <FuturisticPanel :index="6" title="就业升学与风险预警督办" :detail-to="ROUTES.university.employmentRisk" accent="gold" :loading="loading" :error="error" @retry="$emit('retry')">
    <div class="employ">
      <div class="employ__kpis">
        <GlowMetricCard label="落实率" :value="`${data.placementRate}%`" tone="cyan" size="sm" />
        <GlowMetricCard label="升学率" :value="`${data.furtherStudyRate}%`" tone="green" size="sm" />
        <GlowMetricCard label="高质量就业" :value="`${data.highQualityRate}%`" tone="ongoing" size="sm" />
      </div>
      <div class="employ__charts">
        <ChartContainer :option="donutOption" class="employ__donut" />
        <ChartContainer :option="hbarOption" class="employ__hbar" />
      </div>
      <div class="employ__risks">
        <span v-for="r in data.risks" :key="r.label" class="risk-tag">{{ r.label }} {{ r.value }}</span>
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.employ { display: flex; flex-direction: column; gap: 6px; height: 100%; min-height: 0; }
.employ__kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; }
.employ__charts { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.employ__donut, .employ__hbar { min-height: 0; }
.employ__risks { display: flex; flex-wrap: wrap; gap: 6px; }
.risk-tag { font-size: var(--uni-fs-micro); padding: 4px 10px; background: rgba(255,107,120,0.12); border: 1px solid rgba(255,107,120,0.25); color: var(--uni-status-attention); }
</style>
