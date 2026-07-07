<script setup lang="ts">
import { computed } from 'vue'
import FuturisticPanel from '@/domains/university/components/FuturisticPanel.vue'
import GlowMetricCard from '@/domains/university/components/GlowMetricCard.vue'
import ProgressTrack from '@/domains/university/components/ProgressTrack.vue'
import ChartContainer from '@/shared/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { uniAreaLine } from '@/domains/university/charts/presets'
import type { ResearchSummaryVM } from '@/domains/university/types/view'

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

const maxContributor = computed(() =>
  Math.max(...props.data.topContributors.map((c) => Number(c.value)), 1),
)
</script>

<template>
  <FuturisticPanel
    :index="1"
    title="科研创新与申博支撑"
    :detail-to="ROUTES.university.research"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="research">
      <div class="research__kpi">
        <GlowMetricCard
          v-for="(m, i) in data.metrics"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
          :tone="kpiTones[i % kpiTones.length]"
        />
      </div>

      <div class="research__phd">
        <div class="phd-head">
          <span>申博关键指标完成度</span>
          <strong>{{ data.phdSupportLabel }}</strong>
        </div>
        <ProgressTrack :value="data.phdSupportRate" tone="ongoing" :height="9" />
        <p v-if="data.phdHasGap" class="phd-gap">
          <i class="phd-gap__dot" />{{ data.phdGapHint }}
        </p>
      </div>

      <div class="research__bottom">
        <div class="heat">
          <span class="sub-title">贡献热度榜 · Top 2</span>
          <div v-for="(c, i) in data.topContributors.slice(0, 2)" :key="c.name" class="heat__item">
            <em class="heat__rank">{{ i + 1 }}</em>
            <div class="heat__body">
              <span>{{ c.name }}</span>
              <ProgressTrack :value="(Number(c.value) / maxContributor) * 100" tone="normal" :height="4" />
            </div>
            <strong>{{ c.value }}</strong>
          </div>
        </div>
        <div class="trend">
          <span class="sub-title">科研经费趋势</span>
          <ChartContainer :option="trendOption" />
        </div>
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.research {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 6px;
  height: 100%;
  min-height: 0;
}

.research__kpi {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;

  :deep(.glow-metric) {
    padding: 6px 9px;
  }

  :deep(.glow-metric__value) {
    font-size: var(--uni-fs-body);
  }
}

.research__phd {
  padding: 5px 10px;
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
    font-size: var(--uni-fs-metric-sm);
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 12px rgba(51, 217, 255, 0.4);
  }
}

.phd-gap {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  font-size: var(--uni-fs-label);
  color: var(--uni-status-attention);

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--uni-status-attention);
    box-shadow: 0 0 6px var(--uni-status-attention);
  }
}

.research__bottom {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1.05fr;
  gap: var(--uni-gap-inner);
}

.heat {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.sub-title {
  display: block;
  font-size: var(--uni-fs-label);
  color: var(--uni-text-muted);
  margin-bottom: 6px;
  letter-spacing: 0.04em;
}

.heat__item {
  display: grid;
  grid-template-columns: 20px 1fr auto;
  gap: 9px;
  align-items: center;
  padding: 3px 0;

  & + .heat__item { border-top: 1px solid rgba(90, 170, 255, 0.06); }
}

.heat__rank {
  font-style: normal;
  font-family: var(--uni-font-number);
  font-weight: 700;
  color: var(--uni-accent-cyan);
}

.heat__body span {
  display: block;
  font-size: var(--uni-fs-body);
  color: var(--uni-text-primary);
  margin-bottom: 3px;
}

.heat__item strong {
  font-family: var(--uni-font-number);
  color: var(--uni-status-normal);
  font-size: var(--uni-fs-body);
}

.trend {
  display: flex;
  flex-direction: column;
  min-height: 0;

  :deep(.chart-container) {
    flex: 1;
    min-height: 0;
  }
}
</style>
