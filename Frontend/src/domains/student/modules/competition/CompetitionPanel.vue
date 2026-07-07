<script setup lang="ts">
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import type { CompetitionVM } from '@/domains/student/types/view'

defineProps<{
  data: CompetitionVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <CollegePanelCard
    :index="6"
    title="竞赛 / 科研 / 创新"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="competition pair-panel">
      <div class="stats-row pair-stats-row">
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.awardCount }}</span>
          <span class="stat-label pair-stat-label">竞赛获奖</span>
        </div>
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.researchCount }}</span>
          <span class="stat-label pair-stat-label">科研项目</span>
        </div>
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.innovationCount }}</span>
          <span class="stat-label pair-stat-label">创新项目</span>
        </div>
      </div>
      <ul class="highlight-list pair-list">
        <li v-for="(item, i) in data.highlights" :key="i">
          <span class="label">{{ item.label }}</span>
          <span v-if="item.detail" class="detail">{{ item.detail }}</span>
        </li>
      </ul>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
@use '../shared/panel-pair.scss';

.highlight-list li {
  justify-content: space-between;
}

.highlight-list .label {
  color: rgba(212, 231, 255, 0.88);
}

.highlight-list .detail {
  color: rgba(174, 198, 230, 0.5);
  font-size: var(--fs-meta);
}
</style>
