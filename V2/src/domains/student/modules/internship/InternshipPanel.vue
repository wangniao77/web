<script setup lang="ts">
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import type { InternshipVM } from '@/domains/student/types/view'

defineProps<{
  data: InternshipVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <CollegePanelCard
    :index="5"
    title="实习 / 实践经历"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="internship pair-panel">
      <div class="stats-row pair-stats-row">
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.internshipCount }}</span>
          <span class="stat-label pair-stat-label">实习</span>
        </div>
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.projectCount }}</span>
          <span class="stat-label pair-stat-label">项目</span>
        </div>
        <div class="stat pair-stat">
          <span class="stat-num pair-stat-num">{{ data.certificateCount }}</span>
          <span class="stat-label pair-stat-label">证书</span>
        </div>
      </div>
      <ul class="item-list pair-list">
        <li v-for="(item, i) in data.items" :key="i">
          <span class="type-tag">{{ item.type }}</span>
          <span class="name">{{ item.name }}</span>
        </li>
      </ul>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
@use '../shared/panel-pair.scss';

.type-tag {
  font-size: $college-fs-meta;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
  flex-shrink: 0;
}

.name {
  color: rgba(212, 231, 255, 0.88);
}
</style>
