<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import { ROUTES } from '@/constants/routes'
import type { BenchmarkSummaryVM } from '@/types/university/view'

defineProps<{
  data: BenchmarkSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="3"
    title="竞争力与对标排名"
    :detail-to="ROUTES.university.benchmark"
    accent="violet"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="bench">
      <div class="bench__ranks">
        <GlowMetricCard label="全国排名" :value="String(data.nationalRank)" unit="名" tone="cyan" />
        <GlowMetricCard label="省内排名" :value="String(data.provincialRank)" unit="名" tone="ongoing" />
        <GlowMetricCard label="财经类高校" :value="String(data.financeRank)" unit="名" tone="violet" />
      </div>

      <section class="bench__section">
        <h4>对标高校差距</h4>
        <div v-for="item in data.gapVsPeers" :key="item.name" class="bench__row">
          <span>{{ item.name }}</span>
          <em :class="{ 'is-ahead': item.gap > 0 }">{{ item.gapLabel }} 位</em>
        </div>
      </section>

      <section class="bench__section">
        <h4>排名变化归因</h4>
        <div v-for="(item, i) in data.attribution.slice(0, 3)" :key="i" class="bench__attr">
          <span>{{ item.factor }}</span>
          <em>{{ item.impact }}</em>
        </div>
      </section>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.bench {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.bench__ranks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.bench__section {
  padding: 8px 10px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);

  h4 {
    font-size: 12px;
    color: var(--uni-text-muted);
    margin-bottom: 6px;
    letter-spacing: 0.04em;
  }
}

.bench__row,
.bench__attr {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: var(--uni-fs-caption);

  & + & { border-top: 1px solid rgba(90, 170, 255, 0.06); }

  span { color: var(--uni-text-primary); }
  em {
    font-style: normal;
    font-family: var(--uni-font-number);
    color: var(--uni-status-attention);

    &.is-ahead { color: var(--uni-status-normal); }
  }
}

.bench__attr em { color: var(--uni-accent-cyan); font-size: 11px; }
</style>
