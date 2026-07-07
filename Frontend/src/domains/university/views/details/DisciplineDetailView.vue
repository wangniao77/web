<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UniversityDetailLayout from '@/domains/university/components/UniversityDetailLayout.vue'
import { universityDetailService } from '@/domains/university/services/details'
import type { DisciplineDetailVM } from '@/domains/university/types/view/details'

const data = ref<DisciplineDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    data.value = await universityDetailService.fetchDisciplineDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UniversityDetailLayout title="一级学科竞争力变化" subtitle="12个一级学科软科排名与目标差距">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="table-wrap">
        <table class="detail-table">
          <thead>
            <tr>
              <th>学科</th>
              <th>当前排名</th>
              <th>上年排名</th>
              <th>位次变化</th>
              <th>前百分位</th>
              <th>目标排名</th>
              <th>与目标差距</th>
              <th>对标院校</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in data.disciplines" :key="row.name">
              <td>{{ row.name }}</td>
              <td>{{ row.currentRank }}</td>
              <td>{{ row.previousRank }}</td>
              <td :class="row.change > 0 ? 'up' : row.change < 0 ? 'down' : ''">{{ row.changeLabel }}</td>
              <td>{{ row.percentile }}%</td>
              <td>{{ row.targetRank }}</td>
              <td>{{ row.gap }}</td>
              <td>{{ row.benchmarkSchool ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder { color: rgba(174, 198, 230, 0.7); }
.table-wrap { overflow: auto; }
.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-body;
  th, td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(85, 168, 255, 0.1);
    text-align: left;
  }
  th { color: rgba(174, 198, 230, 0.68); font-weight: 600; position: sticky; top: 0; background: rgba(4, 14, 38, 0.95); }
  td { color: #eef9ff; }
  .up { color: #34d399; font-weight: 600; }
  .down { color: #fb923c; font-weight: 600; }
}
</style>
