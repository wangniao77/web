<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/api/college/services/details'
import type { EmploymentDetailVM } from '@/types/college/view/details'

const data = ref<EmploymentDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await collegeDetailService.fetchEmploymentDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CollegeDetailLayout title="学生就业与前景" subtitle="就业去向明细">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="overview-row">
        <div v-for="item in data.overview" :key="item.label" class="overview-item">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}<small v-if="item.unit">{{ item.unit }}</small></strong>
        </div>
      </div>

      <section class="group">
        <h3>去向分布</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>去向</th>
                <th>人数</th>
                <th>占比</th>
                <th>说明</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.byDirection" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.count }}</td>
                <td>{{ item.percent }}%</td>
                <td>{{ item.note }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="group">
        <h3>重点用人单位</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>单位</th>
                <th>行业</th>
                <th>录用人数</th>
                <th>平均起薪</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.topEmployers" :key="item.name">
                <td>{{ item.name }}</td>
                <td>{{ item.industry }}</td>
                <td>{{ item.count }}</td>
                <td>{{ item.avgSalary }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="group">
        <h3>分专业就业</h3>
        <div class="table-wrap">
          <table class="detail-table">
            <thead>
              <tr>
                <th>专业</th>
                <th>就业率</th>
                <th>人数</th>
                <th>主要去向</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in data.byMajor" :key="item.major">
                <td>{{ item.major }}</td>
                <td>{{ item.rate }}%</td>
                <td>{{ item.headcount }}</td>
                <td>{{ item.topDirection }}</td>
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

.overview-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.overview-item {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  span {
    display: block;
    font-size: $college-fs-meta;
    color: rgba(174, 198, 230, 0.62);
    margin-bottom: 4px;
  }

  strong {
    font-family: var(--college-font-number);
    color: #f4c84f;

    small {
      margin-left: 2px;
      font-size: $college-fs-meta;
    }
  }
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
