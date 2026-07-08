<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { uniDonut, uniGlowBars } from '@/components/university/charts/presets'
import { ROUTES } from '@/constants/routes'
import type { ResearchModuleVM } from '@/types/university/view/modules'

const props = defineProps<{ data: ResearchModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()

const barOption = computed(() =>
  uniGlowBars(props.data.fundingTrend.map((t) => t.year), props.data.fundingTrend.map((t) => t.value), { suffix: '万' }),
)
const donutOption = computed(() => uniDonut(props.data.fundingStructure))
</script>

<template>
  <FuturisticPanel :index="5" title="科研创新" :detail-to="ROUTES.university.research" :loading="loading" :error="error" @retry="$emit('retry')">
    <div class="research">
      <div class="research__kpis">
        <GlowMetricCard label="科研经费" :value="String(data.funding)" unit="万" tone="cyan" size="sm" />
        <GlowMetricCard label="横向经费" :value="String(data.horizontalFunding)" unit="万" tone="ongoing" size="sm" />
        <GlowMetricCard label="专利" :value="String(data.patents)" unit="项" tone="violet" size="sm" />
        <GlowMetricCard label="获奖" :value="String(data.awards)" unit="项" tone="green" size="sm" />
      </div>
      <div class="research__charts">
        <ChartContainer :option="barOption" class="research__bar" />
        <ChartContainer :option="donutOption" class="research__donut" />
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.research { display: flex; flex-direction: column; gap: 8px; height: 100%; min-height: 0; }
.research__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.research__charts { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 6px; }
.research__bar, .research__donut { min-height: 0; }
</style>
