<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import { ROUTES } from '@/constants/routes'
import type { TeachingSummaryVM } from '@/types/university/view'

defineProps<{
  data: TeachingSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const kpiTones = ['cyan', 'ongoing', 'green', 'violet', 'cyan', 'ongoing'] as const
</script>

<template>
  <FuturisticPanel
    :index="8"
    title="人才培养与教学质量"
    :detail-to="ROUTES.university.teaching"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="teaching">
      <div class="teaching__grid">
        <GlowMetricCard
          v-for="(m, i) in data.metrics"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
          :tone="kpiTones[i % kpiTones.length]"
          size="sm"
        />
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.teaching {
  height: 100%;
  min-height: 0;
}

.teaching__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  height: 100%;
  overflow-y: auto;
}
</style>
