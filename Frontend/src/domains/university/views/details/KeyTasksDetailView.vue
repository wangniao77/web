<script setup lang="ts">
import { onMounted, ref } from 'vue'
import UniversityDetailLayout from '@/domains/university/components/UniversityDetailLayout.vue'
import RiskBadge from '@/domains/university/components/RiskBadge.vue'
import { universityDetailService } from '@/domains/university/services/details'
import type { KeyTasksDetailVM } from '@/domains/university/types/view/details'

const data = ref<KeyTasksDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await universityDetailService.fetchKeyTasksDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <UniversityDetailLayout title="年度重点任务进度" subtitle="任务明细、风险等级与里程碑">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="summary-row">
        <span>共 {{ data.summary.total }} 项</span>
        <span>已完成 {{ data.summary.completed }}</span>
        <span>推进中 {{ data.summary.ongoing }}</span>
        <span>需关注 {{ data.summary.attention }}</span>
        <span v-if="data.summary.overdue != null">逾期 {{ data.summary.overdue }}</span>
      </div>
      <div class="task-cards">
        <article v-for="task in data.tasks" :key="task.id" class="task-card">
          <header>
            <h3>{{ task.name }}</h3>
            <RiskBadge :level="task.riskLevel" />
          </header>
          <p class="task-desc">{{ task.description }}</p>
          <div class="task-meta">
            <span>牵头：{{ task.leadDept }}</span>
            <span>截止：{{ task.deadline }}</span>
            <span>进度：{{ task.progress }}%</span>
          </div>
          <div class="progress-bar"><i :style="{ width: `${task.progress}%` }" /></div>
          <ul class="milestones">
            <li v-for="item in task.milestones" :key="item.label" :class="{ done: item.done }">
              {{ item.label }}
            </li>
          </ul>
        </article>
      </div>
    </template>
  </UniversityDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.summary-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.78);
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-card {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(85, 168, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    h3 {
      font-size: 15px;
      color: #f3f8ff;
    }
  }
}

.task-desc {
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.72);
  margin-bottom: 8px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.65);
  margin-bottom: 8px;
}

.progress-bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(7, 55, 128, 0.65);
  margin-bottom: 10px;

  i {
    position: absolute;
    inset: 0 auto 0 0;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #0d71ff, #00f2ff);
  }
}

.milestones {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    font-size: $college-fs-label;
    color: rgba(174, 198, 230, 0.6);
    padding-left: 14px;
    position: relative;

    &::before {
      content: '○';
      position: absolute;
      left: 0;
      color: rgba(85, 168, 255, 0.4);
    }

    &.done {
      color: #9dffd4;

      &::before {
        content: '●';
        color: #37ffb1;
      }
    }
  }
}
</style>
