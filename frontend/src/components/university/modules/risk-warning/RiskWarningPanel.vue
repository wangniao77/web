<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import { ROUTES } from '@/constants/routes'
import type { RiskWarningSummaryVM } from '@/types/university/view'

defineProps<{
  data: RiskWarningSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="9"
    title="风险预警"
    :detail-to="ROUTES.university.academicRisk"
    accent="gold"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="risk">
      <div class="risk__grid">
        <GlowMetricCard label="学业风险" :value="String(data.academic)" unit="人" tone="danger" size="sm" />
        <GlowMetricCard label="就业风险" :value="String(data.employment)" unit="人" tone="warn" size="sm" />
        <GlowMetricCard label="任务逾期" :value="String(data.taskOverdue)" unit="项" tone="warn" size="sm" />
        <GlowMetricCard label="指标未达标" :value="String(data.indicatorMiss)" unit="项" tone="danger" size="sm" />
        <GlowMetricCard label="经费执行偏慢" :value="String(data.fundingSlow)" unit="项" tone="ongoing" size="sm" />
      </div>

      <section v-if="data.crossDept.length" class="risk__cross">
        <h4>跨部门协同事项</h4>
        <div v-for="(item, i) in data.crossDept" :key="i" class="risk__item">
          <span>{{ item.title }}</span>
          <em>{{ item.dept }}</em>
        </div>
      </section>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.risk {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.risk__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.risk__cross {
  padding: 8px 10px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(255, 107, 120, 0.15);

  h4 {
    font-size: 12px;
    color: var(--uni-status-attention);
    margin-bottom: 6px;
  }
}

.risk__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
  font-size: var(--uni-fs-caption);

  & + .risk__item { border-top: 1px solid rgba(90, 170, 255, 0.06); }

  span { color: var(--uni-text-primary); }
  em { font-style: normal; color: var(--uni-text-muted); font-size: 11px; }
}
</style>
