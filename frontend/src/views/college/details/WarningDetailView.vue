<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import { isWarningCategoryType } from '@/api/college/adapters/details'
import { collegeDetailService } from '@/api/college/services/details'
import type { WarningDetailVM } from '@/types/college/view/details'

const route = useRoute()
const data = ref<WarningDetailVM | null>(null)
const loading = ref(true)

async function load() {
  const type = String(route.params.type ?? '')
  if (!isWarningCategoryType(type)) {
    data.value = null
    loading.value = false
    return
  }

  loading.value = true
  try {
    data.value = await collegeDetailService.fetchWarningDetail(type)
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => route.params.type, load)
</script>

<template>
  <CollegeDetailLayout
    title="预警与风险监测"
    :subtitle="data ? `${data.label} · 名单明细` : '预警明细'"
  >
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="data" class="table-wrap">
      <table class="detail-table">
        <thead>
          <tr>
            <th>姓名</th>
            <th>学号</th>
            <th>专业</th>
            <th>年级</th>
            <th>预警原因</th>
            <th>等级</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in data.records" :key="row.studentId">
            <td>{{ row.name }}</td>
            <td>{{ row.studentId }}</td>
            <td>{{ row.major }}</td>
            <td>{{ row.grade }}</td>
            <td>{{ row.reason }}</td>
            <td>{{ row.level }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="detail-placeholder">未找到对应预警类别</div>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
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
