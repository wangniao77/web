<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ProgressTrack from '@/components/university/ProgressTrack.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { uniAreaLine } from '@/components/university/charts/presets'
import type { ResearchSummaryVM } from '@/types/university/view'

const props = defineProps<{
  data: ResearchSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const kpiTones = ['cyan', 'ongoing', 'violet', 'green'] as const

const trendOption = computed(() =>
  uniAreaLine(
    props.data.fundingTrend.map((t) => t.year),
    props.data.fundingTrend.map((t) => t.value),
    { suffix: ' 亿', color: '#33d9ff' },
  ),
)
</script>

<template>
  <FuturisticPanel
    :index="6"
    title="科研创新"
    :detail-to="ROUTES.university.research"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="research">
      <div class="research__kpi">
        <GlowMetricCard
          v-for="(m, i) in data.metrics.slice(0, 6)"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
          :tone="kpiTones[i % kpiTones.length]"
          size="sm"
        />
      </div>

      <div class="research__phd">
        <div class="phd-head">
          <span>重点平台 · 申博支撑</span>
          <strong>{{ data.phdSupportLabel }}</strong>
        </div>
        <ProgressTrack :value="data.phdSupportRate" tone="ongoing" :height="6" />
        <p v-if="data.phdHasGap" class="phd-gap">
          <i class="phd-gap__dot" />{{ data.phdGapHint }}
        </p>
      </div>

      <div class="research__trend">
        <span class="sub-title">科研经费趋势</span>
        <ChartContainer :option="trendOption" />
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.research {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.research__kpi {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.research__phd {
  padding: 7px 12px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%);
}

.phd-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
  font-size: var(--uni-fs-body);
  color: var(--uni-text-secondary);

  strong {
    font-family: var(--uni-font-number);
    font-size: 25px;
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 12px rgba(51, 217, 255, 0.4);
  }
}

.phd-gap {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--uni-status-attention);

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--uni-status-attention);
    box-shadow: 0 0 6px var(--uni-status-attention);
  }
}

.research__trend {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
  }
}

.sub-title {
  display: block;
  font-size: 12px;
  color: var(--uni-text-muted);
  margin-bottom: 4px;
  letter-spacing: 0.04em;
}
</style>
