<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UniversityDetailLayout from '@/components/university/UniversityDetailLayout.vue'
import { universityDetailService } from '@/api/university/services/details'
import type { MetricsDetailVM } from '@/types/university/view/details'

const data = ref<MetricsDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await universityDetailService.fetchMetricsDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UniversityDetailLayout title="数据口径与指标说明" subtitle="指标定义、数据来源与计算逻辑">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <section v-for="section in data.sections" :key="section.title" class="metrics-section">
        <h3>{{ section.title }}</h3>
        <div class="metrics-list">
          <article v-for="item in section.items" :key="item.name" class="metric-card">
            <h4>{{ item.name }}</h4>
            <p><strong>定义：</strong>{{ item.definition }}</p>
            <p><strong>来源：</strong>{{ item.source }}</p>
            <p v-if="item.formula"><strong>计算：</strong>{{ item.formula }}</p>
          </article>
        </div>
      </section>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder { color: rgba(174, 198, 230, 0.7); }
.metrics-section { margin-bottom: 20px; }
.metrics-section h3 { font-size: 16px; color: #f3f8ff; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid rgba(85, 168, 255, 0.12); }
.metrics-list { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.metric-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(85, 168, 255, 0.12);
  background: rgba(4, 14, 38, 0.45);
  h4 { font-size: 14px; color: #55dfff; margin-bottom: 8px; }
  p { font-size: 12px; color: rgba(174, 198, 230, 0.78); line-height: 1.55; margin-bottom: 4px; }
  strong { color: rgba(232, 244, 255, 0.92); font-weight: 600; }
}
</style>
