<script setup lang="ts">
import { BENCHMARK_PILLAR_META } from '@/api/college/adapters/benchmark-pillars'
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkPillarVM } from '@/types/college/view/benchmark-achievements'

const props = defineProps<{
  pillars: BenchmarkPillarVM[]
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()

function pillarOf(key: BenchmarkPillarKey) {
  return props.pillars.find((item) => item.key === key)
}
</script>

<template>
  <div class="bm-metrics">
    <div class="bm-metrics__list">
      <button
        v-for="meta in BENCHMARK_PILLAR_META"
        :key="meta.key"
        type="button"
        class="bm-metrics__row"
        :aria-label="`查看${meta.label}详情`"
        @click="emit('open', meta.key)"
      >
        <span class="bm-metrics__name">{{ meta.label }}</span>
        <span class="bm-metrics__cells">
          <span
            v-for="metric in pillarOf(meta.key)?.metrics ?? []"
            :key="metric.label"
            class="bm-metrics__cell"
          >
            <strong>{{ metric.value }}<small v-if="metric.unit">{{ metric.unit }}</small></strong>
            <em>{{ metric.label }}</em>
          </span>
          <span v-if="!(pillarOf(meta.key)?.metrics.length)" class="bm-metrics__empty">暂无指标</span>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bm-metrics {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 2px 2px 22px;
}

.bm-metrics__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 0;
  min-height: 0;
}

.bm-metrics__row {
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  min-height: 0;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.18);
  background: rgba(0, 50, 100, 0.24);
  text-align: left;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s, background 0.18s, transform 0.18s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
    background: rgba(0, 70, 130, 0.32);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #7fe9ff;
    outline-offset: 2px;
  }
}

.bm-metrics__name {
  color: #eaf7ff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.bm-metrics__cells {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 6px;
  min-width: 0;
}

.bm-metrics__cell {
  flex: 1 1 52px;
  min-width: 52px;
  padding: 2px 4px;

  strong {
    display: block;
    color: #7fe9ff;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.05;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    small {
      margin-left: 2px;
      color: #9ecae8;
      font-size: 12px;
      font-weight: 600;
    }
  }

  em {
    display: block;
    margin-top: 2px;
    color: #9ecae8;
    font-size: 12px;
    font-style: normal;
    font-weight: 700;
    letter-spacing: 0.02em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.bm-metrics__empty {
  color: rgba(171, 207, 231, 0.7);
  font-size: 15px;
}
</style>
