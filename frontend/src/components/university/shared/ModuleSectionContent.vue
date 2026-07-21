<script setup lang="ts">
import type { ModuleSectionDTO } from '@/types/university/api/modules'
import ModuleKpiStrip from '@/components/university/shared/ModuleKpiStrip.vue'
import ModuleChartBlock from '@/components/university/shared/ModuleChartBlock.vue'
import TaskProgressTable from '@/components/university/shared/TaskProgressTable.vue'

defineProps<{ section?: ModuleSectionDTO | null }>()
</script>

<template>
  <div v-if="section" class="section-content">
    <h2>{{ section.title }}</h2>
    <p v-if="section.summary" class="section-content__summary">{{ section.summary }}</p>
    <ModuleKpiStrip v-if="section.kpis?.length" :kpis="section.kpis" />
    <ModuleChartBlock v-if="section.chart" :chart="section.chart" />
    <TaskProgressTable v-if="section.table?.length" :rows="section.table" :limit="10" />
    <ul v-if="section.items?.length" class="section-content__list">
      <li v-for="item in section.items" :key="item.label">
        <span>{{ item.label }}</span><strong>{{ item.value }}</strong>
      </li>
    </ul>
    <p v-if="!section.kpis?.length && !section.chart && !section.table?.length && !section.items?.length" class="section-content__empty">
      该子栏目数据建设中，请稍后查看。
    </p>
  </div>
  <p v-else class="section-content__empty">暂无数据</p>
</template>

<style scoped lang="scss">
.section-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  h2 { font-size: 16px; color: var(--uni-text-primary); margin: 0; }
  &__summary { font-size: 13px; color: var(--uni-text-muted); margin: 0; }
  &__list {
    list-style: none; margin: 0; padding: 0;
    li { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid rgba(90,170,255,0.08); font-size: 13px; }
    strong { color: var(--uni-accent-cyan); }
  }
  &__empty { color: var(--uni-text-muted); font-size: 14px; padding: 24px 0; }
}
</style>
