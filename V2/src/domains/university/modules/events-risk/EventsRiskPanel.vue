<script setup lang="ts">
import FuturisticPanel from '@/domains/university/components/FuturisticPanel.vue'
import GlowMetricCard from '@/domains/university/components/GlowMetricCard.vue'
import AlertSignalCard from '@/domains/university/components/AlertSignalCard.vue'
import RiskVortex from '@/domains/university/components/RiskVortex.vue'
import { ROUTES } from '@/constants/routes'
import type { AcademicRiskSummaryVM, SchoolEventVM } from '@/domains/university/types/view'

defineProps<{
  events: SchoolEventVM[]
  academicRisk: AcademicRiskSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="6"
    title="重要事项与人才培养风险"
    accent="gold"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="er">
      <section class="er__events">
        <header class="er__sub">
          <h4>学校重要事项</h4>
          <RouterLink :to="ROUTES.university.events" class="er__more">全部</RouterLink>
        </header>
        <AlertSignalCard
          v-for="item in events.slice(0, 1)"
          :key="item.id"
          :event="item"
        />
      </section>

      <section class="er__risk">
        <header class="er__sub">
          <h4>人才培养与学业风险</h4>
          <RouterLink :to="ROUTES.university.academicRisk" class="er__more">全部</RouterLink>
        </header>
        <div class="er__risk-body">
          <div class="er__metrics">
            <GlowMetricCard
              label="预计延毕"
              :value="academicRisk.expectedDelayCount"
              :trend="`同比 ${academicRisk.delayRateChangeLabel}`"
              tone="warn"
            />
            <GlowMetricCard label="学业预警" :value="academicRisk.warningCount" tone="danger" />
            <GlowMetricCard label="已干预" :value="academicRisk.intervenedCount" tone="ongoing" />
            <GlowMetricCard label="高风险学院" :value="academicRisk.highRiskCollegeCount" unit="个" tone="warn" />
          </div>
          <div class="er__vortex">
            <RiskVortex
              :value="academicRisk.riskResolvedLabel"
              label="风险解除率"
              tone="gold"
            />
          </div>
        </div>
      </section>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.er {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.er__sub {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  flex-shrink: 0;

  h4 {
    font-size: var(--uni-fs-body);
    font-weight: 600;
    color: var(--uni-text-primary);
  }
}

.er__more {
  font-size: var(--uni-fs-label);
  color: var(--uni-text-secondary);
  text-decoration: none;
  white-space: nowrap;

  &:hover { color: var(--uni-accent-cyan); }
}

.er__events {
  min-height: 0;
}

.er__risk {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.er__risk-body {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 88px;
  gap: 6px;
  align-items: center;
}

.er__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  min-height: 0;
  align-content: center;

  :deep(.glow-metric) {
    padding: 6px 8px;
  }

  :deep(.glow-metric__label) {
    font-size: var(--uni-fs-meta);
  }

  :deep(.glow-metric__value) {
    font-size: var(--uni-fs-caption);
  }

  :deep(.glow-metric__trend) {
    display: none;
  }
}

.er__vortex {
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
