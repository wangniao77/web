<script setup lang="ts">
import FuturisticPanel from '@/domains/university/components/FuturisticPanel.vue'
import TerrainTrendChart from '@/domains/university/components/TerrainTrendChart.vue'
import { ROUTES } from '@/constants/routes'
import type { DisciplineSummaryVM } from '@/domains/university/types/view'

defineProps<{
  data: DisciplineSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="5"
    title="一级学科竞争力变化"
    :detail-to="ROUTES.university.disciplines"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="disc">
      <div class="disc__summary">
        <div class="sum sum--up">
          <strong>{{ data.risingCount }}</strong>
          <span>上升学科</span>
        </div>
        <div class="sum sum--flat">
          <strong>{{ data.stableCount }}</strong>
          <span>持平学科</span>
        </div>
        <div class="sum sum--down">
          <strong>{{ data.fallingCount }}</strong>
          <span>下降学科</span>
        </div>
      </div>

      <div class="disc__terrain">
        <TerrainTrendChart :categories="data.terrainCategories" :layers="data.terrainLayers" />
      </div>

      <div class="disc__focus">
        <div class="focus focus--up">
          <span class="focus__title">提升最快</span>
          <div v-for="item in data.topRisers.slice(0, 1)" :key="item.name" class="focus__row">
            <span class="focus__name">{{ item.name }}</span>
            <em class="focus__change">{{ item.changeLabel }}</em>
            <span class="focus__rank">第 {{ item.currentRank }} 名</span>
          </div>
        </div>
        <div class="focus focus--down">
          <span class="focus__title">需重点关注</span>
          <div v-for="item in data.topFallers.slice(0, 1)" :key="item.name" class="focus__row">
            <span class="focus__name">{{ item.name }}</span>
            <em class="focus__change">{{ item.changeLabel }}</em>
            <span class="focus__rank">第 {{ item.currentRank }} 名</span>
          </div>
        </div>
      </div>

      <p class="disc__note">排名数值越小代表竞争力越强</p>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.disc {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 6px;
  height: 100%;
  min-height: 0;
}

.disc__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.sum {
  --sum-color: var(--uni-accent-cyan);
  text-align: center;
  padding: 5px 0;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);

  &--up { --sum-color: var(--uni-status-normal); }
  &--flat { --sum-color: var(--uni-accent-blue); }
  &--down { --sum-color: var(--uni-status-attention); }

  strong {
    display: block;
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-metric-sm);
    font-weight: 700;
    line-height: 1;
    color: var(--sum-color);
    text-shadow: 0 0 12px color-mix(in srgb, var(--sum-color) 45%, transparent);
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: var(--uni-fs-label);
    color: var(--uni-text-secondary);
  }
}

.disc__terrain {
  min-height: 0;
}

.disc__focus {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
}

.disc__note {
  font-size: var(--uni-fs-meta);
  color: var(--uni-text-muted);
  text-align: right;
  margin-top: -2px;
}

.focus {
  --f-color: var(--uni-status-normal);
  padding: 7px 10px;
  background: rgba(8, 22, 42, 0.35);
  border: 1px solid rgba(90, 170, 255, 0.08);
  border-radius: var(--uni-radius-inner);

  &--down { --f-color: var(--uni-status-attention); }

  &__title {
    display: block;
    font-size: var(--uni-fs-label);
    font-weight: 600;
    color: var(--f-color);
    margin-bottom: 5px;
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 4px 8px;
    padding: 3px 0;

    & + .focus__row { border-top: 1px solid rgba(90, 170, 255, 0.05); }
  }

  &__name {
    font-size: var(--uni-fs-caption);
    color: var(--uni-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__change {
    font-style: normal;
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-caption);
    color: var(--f-color);
  }

  &__rank {
    grid-column: 1 / -1;
    font-size: var(--uni-fs-meta);
    color: var(--uni-text-muted);
  }
}
</style>
