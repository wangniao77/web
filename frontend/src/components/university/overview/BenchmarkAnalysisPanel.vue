<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { uniAreaLine, uniRadar } from '@/components/university/charts/presets'
import { ROUTES } from '@/constants/routes'
import type { BenchmarkModuleVM } from '@/types/university/view/modules'

const props = defineProps<{ data: BenchmarkModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()

const radarOption = computed(() => uniRadar(props.data.radar.indicators, [
  { name: '本校', value: props.data.radar.self, color: '#33d9ff' },
  { name: '对标均值', value: props.data.radar.benchmark, color: '#37e0a4' },
]))
const trendOption = computed(() =>
  uniAreaLine(props.data.rankTrend.map((t) => t.year), props.data.rankTrend.map((t) => t.rank), { color: '#7c8bff' }),
)
</script>

<template>
  <FuturisticPanel :index="3" title="竞争力排名与对标分析" :detail-to="ROUTES.university.benchmark" accent="violet" :loading="loading" :error="error" @retry="$emit('retry')">
    <div class="bench">
      <div class="bench__kpis">
        <GlowMetricCard label="全国排名" :value="String(data.nationalRank)" unit="名" tone="cyan" size="sm" />
        <GlowMetricCard label="省内排名" :value="`${data.provincialRank}/76`" tone="ongoing" size="sm" />
        <GlowMetricCard label="对标高校" :value="String(data.benchmarkCount)" unit="所" tone="violet" size="sm" />
        <GlowMetricCard label="较上年" :value="`↑${data.rankChange}`" unit="位" tone="green" size="sm" />
      </div>
      <div class="bench__charts">
        <ChartContainer :option="radarOption" class="bench__radar" />
        <ChartContainer :option="trendOption" class="bench__line" />
      </div>
      <div class="bench__growth">
        <span v-for="g in data.dimensionGrowth" :key="g.label">{{ g.label }} {{ g.changeLabel }}</span>
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.bench { display: flex; flex-direction: column; gap: 6px; height: 100%; min-height: 0; }
.bench__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.bench__charts { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.bench__radar, .bench__line { min-height: 0; }
.bench__growth { display: flex; flex-wrap: wrap; gap: 8px; font-size: var(--uni-fs-micro); color: var(--uni-status-normal); }
</style>
