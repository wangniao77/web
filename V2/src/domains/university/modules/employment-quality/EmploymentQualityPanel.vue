<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/domains/university/components/FuturisticPanel.vue'
import GlowMetricCard from '@/domains/university/components/GlowMetricCard.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { uniAreaLine, uniDonut } from '@/domains/university/charts/presets'
import type { EmploymentSummaryVM } from '@/domains/university/types/view'

const props = defineProps<{
  data: EmploymentSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const kpiOrder = [0, 2, 3, 1]
const kpiTones = ['cyan', 'green', 'ongoing', 'violet'] as const

const trendOption = computed(() =>
  uniAreaLine(
    props.data.trend.map((t) => t.year),
    props.data.trend.map((t) => t.rate),
    { min: 88, max: 100, suffix: '%', color: '#37e0a4' },
  ),
)

const pieOption = computed(() => uniDonut(props.data.destinationStructure))
const footer = computed(() => props.data.metrics.slice(4, 6))
</script>

<template>
  <FuturisticPanel
    :index="3"
    title="就业与升学质量"
    :detail-to="ROUTES.university.employment"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="employ">
      <div class="employ__kpi">
        <GlowMetricCard
          v-for="(idx, i) in kpiOrder"
          :key="data.metrics[idx].label"
          :label="data.metrics[idx].label"
          :value="data.metrics[idx].value"
          :trend="data.metrics[idx].trendLabel"
          :tone="kpiTones[i]"
          :size="i === 0 ? 'lg' : 'md'"
        />
      </div>

      <div class="employ__charts">
        <div class="chart-cell">
          <span class="cell-title">毕业去向结构</span>
          <ChartContainer :option="pieOption" />
        </div>
        <div class="chart-cell">
          <span class="cell-title">近三年落实率</span>
          <ChartContainer :option="trendOption" />
        </div>
      </div>

      <div class="employ__foot">
        <div v-for="m in footer" :key="m.label" class="foot-item">
          <span class="foot-item__label">{{ m.label }}</span>
          <strong class="foot-item__value">{{ m.value }}</strong>
          <span v-if="m.hint" class="foot-item__hint">{{ m.hint }}</span>
        </div>
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.employ {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: var(--uni-gap-inner);
  height: 100%;
  min-height: 0;
}

.employ__kpi {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  grid-template-rows: auto auto;
  gap: 8px;

  > :first-child { grid-row: 1 / 3; }
}

.employ__charts {
  min-height: 0;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: var(--uni-gap-inner);
}

.chart-cell {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 8px 9px;
  background: rgba(8, 22, 42, 0.35);
  border: 1px solid rgba(90, 170, 255, 0.08);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);

  :deep(.chart-container) { flex: 1; min-height: 0; }
}

.cell-title {
  font-size: 12px;
  color: var(--uni-text-muted);
  margin-bottom: 4px;
}

.employ__foot {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
}

.foot-item {
  display: flex;
  flex-direction: column;
  padding: 7px 12px;
  background: rgba(8, 22, 42, 0.4);
  border-left: 2px solid var(--uni-accent-cyan);

  &__label { font-size: 12px; color: var(--uni-text-secondary); }
  &__value {
    font-family: var(--uni-font-number);
    font-size: 23px;
    font-weight: 700;
    color: var(--uni-accent-cyan);
    margin-top: 2px;
  }
  &__hint { font-size: 11px; color: var(--uni-text-muted); margin-top: 2px; }
}
</style>
