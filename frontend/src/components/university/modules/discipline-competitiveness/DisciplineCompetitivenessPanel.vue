<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import TerrainTrendChart from '@/components/university/TerrainTrendChart.vue'
import { ROUTES } from '@/constants/routes'
import type { DisciplineSummaryVM } from '@/types/university/view'

defineProps<{
  data: DisciplineSummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="7"
    title="学科与专业建设"
    :detail-to="ROUTES.university.disciplines"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="disc">
      <div v-if="data.keyDisciplines != null" class="disc__build">
        <span>重点学科 <strong>{{ data.keyDisciplines }}</strong></span>
        <span>博士点 <strong>{{ data.phdPoints }}</strong></span>
        <span>硕士点 <strong>{{ data.masterPoints }}</strong></span>
        <span>一流专业 <strong>{{ data.firstClassMajors }}</strong></span>
      </div>
      <p v-if="data.structureOptimization" class="disc__opt">{{ data.structureOptimization }}</p>

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
          <div v-for="item in data.topRisers.slice(0, 2)" :key="item.name" class="focus__row">
            <span class="focus__name">{{ item.name }}</span>
            <em class="focus__change">{{ item.changeLabel }}</em>
            <span class="focus__rank">第 {{ item.currentRank }} 名</span>
          </div>
        </div>
        <div class="focus focus--down">
          <span class="focus__title">需重点关注</span>
          <div v-for="item in data.topFallers.slice(0, 2)" :key="item.name" class="focus__row">
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
  grid-template-rows: auto auto auto 1fr auto auto;
  gap: 6px;
  height: 100%;
  min-height: 0;
}

.disc__build {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  font-size: 10px;
  color: var(--uni-text-secondary);

  strong {
    display: block;
    font-family: var(--uni-font-number);
    font-size: 16px;
    color: var(--uni-accent-cyan);
  }
}

.disc__opt {
  font-size: 10px;
  color: var(--uni-text-muted);
  padding: 4px 8px;
  background: rgba(8, 22, 42, 0.35);
  border-left: 2px solid var(--uni-accent-violet, #7c8bff);
}

.disc__summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.sum {
  --sum-color: var(--uni-accent-cyan);
  text-align: center;
  padding: 7px 0;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
  clip-path: polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px);

  &--up { --sum-color: var(--uni-status-normal); }
  &--flat { --sum-color: var(--uni-accent-blue); }
  &--down { --sum-color: var(--uni-status-attention); }

  strong {
    display: block;
    font-family: var(--uni-font-number);
    font-size: 30px;
    font-weight: 700;
    line-height: 1;
    color: var(--sum-color);
    text-shadow: 0 0 12px color-mix(in srgb, var(--sum-color) 45%, transparent);
  }

  span {
    display: block;
    margin-top: 4px;
    font-size: 12px;
    color: var(--uni-text-secondary);
  }
}

.disc__terrain {
  min-height: 0;
}

.disc__focus {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 9px;
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
    font-size: 12px;
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
    font-size: 15px;
    color: var(--f-color);
  }

  &__rank {
    grid-column: 1 / -1;
    font-size: 11px;
    color: var(--uni-text-muted);
  }
}

.disc__note {
  font-size: 11px;
  color: var(--uni-text-muted);
  text-align: right;
}
</style>
