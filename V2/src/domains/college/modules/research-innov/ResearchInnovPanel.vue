<script setup lang="ts">
import { openCollegeDetail } from '@/domains/college/modules/detail-modal/useCollegeDetail'
import type { ResearchOverviewVM } from '@/domains/college/types/view'

defineProps<{ data: ResearchOverviewVM }>()

function openDetail() {
  openCollegeDetail({ kind: 'research' })
}
</script>

<template>
  <div class="research-panel">
    <div class="research-kpis research-kpis--grid">
      <button
        v-for="metric in data.metrics.slice(0, 4)"
        :key="metric.label"
        type="button"
        class="research-kpi research-kpi--clickable research-kpi--block"
        @click="openDetail"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <em
          v-if="metric.trend"
          class="research-kpi__trend"
          :class="`research-kpi__trend--${metric.trend.direction}`"
        >
          {{ metric.trend.direction === 'up' ? '↑' : metric.trend.direction === 'down' ? '↓' : '' }}{{ metric.trend.value }}{{ metric.trend.unit || '' }}
        </em>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.research-panel {
  height: 100%;
  min-height: 0;
}

/* KPI：2×2 铺满整个面板，数字单行不换行 */
.research-kpis--grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.research-kpi--block {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  column-gap: 8px;
  row-gap: 2px;
  align-content: center;
  align-items: baseline;
  min-width: 0;
  padding: 8px 14px;
  border: 1px solid rgba(57, 230, 255, 0.28);
  border-radius: 8px;
  background: rgba(0, 80, 160, 0.18);

  span {
    grid-column: 1 / -1;
    overflow: hidden;
    color: #d8efff;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  strong {
    grid-column: 1;
    grid-row: 2;
    color: #5cecff;
    font-size: 30px;
    font-weight: 900;
    line-height: 1.05;
    white-space: nowrap;
    text-shadow: 0 1px 2px rgba(0, 10, 30, 0.9), 0 0 10px rgba(57, 230, 255, 0.4);
  }
}

.research-kpi--clickable {
  cursor: pointer;
  font: inherit;
  text-align: left;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.6);
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(0, 120, 255, 0.18);
  }
}

.research-kpi__trend {
  grid-column: 2;
  grid-row: 2;
  justify-self: end;
  align-self: end;
  padding-bottom: 4px;
  font-size: 14px;
  font-style: normal;

  &--up { color: #34d399; }
  &--down { color: #f87171; }
  &--flat { color: #889ec2; }
}
</style>
