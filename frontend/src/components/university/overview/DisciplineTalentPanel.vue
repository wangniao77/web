<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { uniGroupedBars } from '@/components/university/charts/presets'
import { ROUTES } from '@/constants/routes'
import type { DisciplineTalentModuleVM } from '@/types/university/view/modules'

const props = defineProps<{ data: DisciplineTalentModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()

const chartOption = computed(() => uniGroupedBars(props.data.qualityCompare.categories, [
  { name: '本校', data: props.data.qualityCompare.school, color: '#33d9ff' },
  { name: '全国均值', data: props.data.qualityCompare.national, color: '#ffb057' },
]))
</script>

<template>
  <FuturisticPanel :index="4" title="学科专业与人才培养质量" :detail-to="ROUTES.university.disciplineTalent" :loading="loading" :error="error" @retry="$emit('retry')">
    <div class="disc">
      <div class="disc__kpis">
        <GlowMetricCard label="博士点" :value="String(data.phdPoints)" unit="个" tone="cyan" size="sm" />
        <GlowMetricCard label="硕士点" :value="String(data.masterPoints)" unit="个" tone="ongoing" size="sm" />
        <GlowMetricCard label="一流专业" :value="String(data.firstClassMajors)" unit="个" tone="violet" size="sm" />
        <GlowMetricCard label="满意度" :value="data.satisfactionLabel" tone="green" size="sm" />
      </div>
      <ChartContainer :option="chartOption" class="disc__chart" />
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.disc { display: flex; flex-direction: column; gap: 8px; height: 100%; min-height: 0; }
.disc__kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.disc__chart { flex: 1; min-height: 0; }
</style>
