<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UniversityDetailLayout from '@/components/university/UniversityDetailLayout.vue'
import RiskBadge from '@/components/university/RiskBadge.vue'
import { universityDetailService } from '@/api/university/services/details'
import type { EventsDetailVM } from '@/types/university/view/details'

const data = ref<EventsDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await universityDetailService.fetchEventsDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UniversityDetailLayout title="学校重要事项动态" subtitle="按类型与优先级分类的校务事项">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="event-cards">
        <article v-for="item in data.items" :key="item.id" class="event-card">
          <header>
            <span class="tag">{{ item.categoryLabel }}</span>
            <RiskBadge v-if="item.needsAttention" level="attention" />
            <span class="status">{{ item.statusLabel }}</span>
          </header>
          <h3>{{ item.title }}</h3>
          <p>{{ item.summary }}</p>
          <footer>
            <span>{{ item.date }}</span>
            <span>责任：{{ item.leadDept }}</span>
            <span v-if="item.nextAction">下一步：{{ item.nextAction }}</span>
          </footer>
        </article>
      </div>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder { color: rgba(174, 198, 230, 0.7); }
.event-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.event-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(85, 168, 255, 0.12);
  background: rgba(4, 14, 38, 0.45);
  header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
  .tag { font-size: 10px; padding: 2px 8px; border-radius: 4px; background: rgba(85, 168, 255, 0.12); color: #55a8ff; }
  .status { margin-left: auto; font-size: 10px; color: rgba(174, 198, 230, 0.62); }
  h3 { font-size: 14px; color: #f3f8ff; margin-bottom: 6px; }
  p { font-size: 12px; color: rgba(174, 198, 230, 0.78); line-height: 1.5; margin-bottom: 8px; }
  footer { display: flex; flex-wrap: wrap; gap: 8px; font-size: 10px; color: rgba(174, 198, 230, 0.58); }
}
</style>
