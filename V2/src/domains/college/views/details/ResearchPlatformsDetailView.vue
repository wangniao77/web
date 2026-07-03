<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeDetailLayout from '@/domains/college/components/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/domains/college/services/details'
import type { ResearchPlatformsDetailVM } from '@/domains/college/types/view/details'

const data = ref<ResearchPlatformsDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await collegeDetailService.fetchResearchPlatformsDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CollegeDetailLayout title="科研创新与团队平台" subtitle="平台与团队明细">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <section v-for="group in data.categories" :key="group.category" class="group">
        <h3>{{ group.category }}</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>级别</th>
                <th>负责人</th>
                <th>成员数</th>
                <th>成立时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in group.items" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.level }}</td>
                <td>{{ item.leader }}</td>
                <td>{{ item.members }}</td>
                <td>{{ item.foundedAt }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.group {
  margin-bottom: 16px;

  h3 {
    margin-bottom: 8px;
    font-size: $college-fs-body;
    color: #55dfff;
  }
}

.table-wrap {
  overflow: auto;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: $college-fs-label;

  th,
  td {
    padding: 10px 12px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);
    text-align: left;
  }

  th {
    color: rgba(174, 198, 230, 0.72);
    background: rgba(0, 184, 255, 0.06);
  }

  td {
    color: rgba(220, 232, 248, 0.88);
  }
}
</style>
