<script setup lang="ts">
import type { BenchmarkPillarKey } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkSwotRowVM } from '@/types/college/view/benchmark-achievements'

defineProps<{
  tone: 'good' | 'weak'
  rows: BenchmarkSwotRowVM[]
}>()

const emit = defineEmits<{
  open: [pillar: BenchmarkPillarKey]
}>()
</script>

<template>
  <div class="bm-swot" :class="`bm-swot--${tone}`">
    <div class="bm-swot__list">
      <button
        v-for="row in rows"
        :key="row.key"
        type="button"
        class="bm-swot__row"
        :class="{ 'is-empty': row.empty }"
        :aria-label="`查看${row.label}详情`"
        @click="emit('open', row.key)"
      >
        <span class="bm-swot__name">{{ row.label }}</span>
        <span class="bm-swot__metric">
          <strong>{{ row.metricValue }}<small v-if="row.metricUnit">{{ row.metricUnit }}</small></strong>
          <em>{{ row.metricLabel }}</em>
        </span>
        <span class="bm-swot__text">{{ row.text }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bm-swot {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 2px 2px 22px;
}

.bm-swot__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1 1 0;
  min-height: 0;
}

.bm-swot__row {
  display: grid;
  grid-template-columns: 76px 78px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  flex: 1 1 0;
  min-height: 0;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid transparent;
  background: rgba(0, 50, 100, 0.22);
  text-align: left;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.18s, background 0.18s, transform 0.18s;

  &:hover {
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #7fe9ff;
    outline-offset: 2px;
  }

  &.is-empty {
    opacity: 0.78;
  }
}

.bm-swot--good .bm-swot__row {
  border-color: rgba(110, 255, 194, 0.2);
  background: rgba(16, 72, 56, 0.22);

  &:hover {
    border-color: rgba(110, 255, 194, 0.45);
    background: rgba(16, 80, 60, 0.34);
  }
}

.bm-swot--weak .bm-swot__row {
  border-color: rgba(255, 170, 60, 0.22);
  background: rgba(72, 40, 8, 0.22);

  &:hover {
    border-color: rgba(255, 170, 60, 0.48);
    background: rgba(84, 46, 10, 0.34);
  }
}

.bm-swot__name {
  color: #eaf7ff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 0.06em;
  white-space: nowrap;
}

.bm-swot__metric {
  min-width: 0;

  strong {
    display: block;
    color: #eaf7ff;
    font-size: 26px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;

    small {
      margin-left: 2px;
      color: #9ecae8;
      font-size: 13px;
      font-weight: 600;
    }
  }

  em {
    display: block;
    margin-top: 2px;
    color: #9ecae8;
    font-size: 13px;
    font-style: normal;
    font-weight: 700;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.bm-swot--good .bm-swot__metric strong {
  color: #8ef6c8;
}

.bm-swot--weak .bm-swot__metric strong {
  color: #ffd56a;
}

.bm-swot__text {
  min-width: 0;
  color: #e8f6ff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
