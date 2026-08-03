<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/api/college/services/details'
import type { TeachingCoursesDetailVM } from '@/types/college/view/details'

const data = ref<TeachingCoursesDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await collegeDetailService.fetchTeachingCoursesDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CollegeDetailLayout module="教学质量与教学运行" title="教学质量与教学运行" subtitle="课程建设明细">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="data" class="table-wrap">
      <table class="detail-table">
        <thead>
          <tr>
            <th>课程名称</th>
            <th>建设级别</th>
            <th>负责人</th>
            <th>学时</th>
            <th>选课人数</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="course in data.courses" :key="course.name">
            <td>{{ course.name }}</td>
            <td>{{ course.level }}</td>
            <td>{{ course.leader }}</td>
            <td>{{ course.hours }}</td>
            <td>{{ course.students }}</td>
            <td>{{ course.status }}</td>
          </tr>
        </tbody>
      </table>
    </div>
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
