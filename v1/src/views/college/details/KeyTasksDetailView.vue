<script setup lang="ts">
import { onMounted, ref } from 'vue'
import CollegeDetailLayout from '@/components/screen/college/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/services/college/details'
import type { KeyTasksDetailVM } from '@/types/view/college/details'

const data = ref<KeyTasksDetailVM | null>(null)
const loading = ref(true)

onMounted(async () => {
  loading.value = true
  try {
    data.value = await collegeDetailService.fetchKeyTasksDetail()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <CollegeDetailLayout title="年度重点任务推进" subtitle="任务明细与里程碑">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="summary-row">
        <span>共 {{ data.summary.total }} 项</span>
        <span>已完成 {{ data.summary.completed }}</span>
        <span>进行中 {{ data.summary.ongoing }}</span>
        <span>滞后 {{ data.summary.delayed }}</span>
      </div>
      <div class="task-cards">
        <article v-for="task in data.tasks" :key="task.id" class="task-card">
          <header>
            <h3>{{ task.name }}</h3>
            <span :class="task.statusClass">{{ task.statusLabel }}</span>
          </header>
          <p class="task-desc">{{ task.description }}</p>
          <div class="task-meta">
            <span>牵头：{{ task.leadDept }}</span>
            <span>截止：{{ task.deadline }}</span>
            <span>进度：{{ task.progress }}%</span>
          </div>
          <ul class="milestones">
            <li v-for="item in task.milestones" :key="item.label" :class="{ done: item.done }">
              {{ item.label }}
            </li>
          </ul>
        </article>
      </div>
    </template>
  </CollegeDetailLayout>
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
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(4, 14, 38, 0.55);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    h3 {
      font-size: $college-fs-body;
      color: #f3f8ff;
    }

    span {
      font-size: $college-fs-meta;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .status-ongoing {
      color: $color-accent;
      background: rgba(0, 184, 255, 0.08);
    }

    .status-completed {
      color: $color-success;
      background: rgba(52, 211, 153, 0.08);
    }

    .status-delayed {
      color: $color-warning;
      background: rgba(240, 160, 48, 0.08);
    }
  }
}

.task-desc {
  font-size: $college-fs-label;
  color: rgba(174, 198, 230, 0.72);
  margin-bottom: 8px;
  line-height: 1.5;
}

.task-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: $college-fs-meta;
  color: rgba(174, 198, 230, 0.62);
  margin-bottom: 8px;
}

.milestones {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;

  li {
    font-size: $college-fs-meta;
    color: rgba(174, 198, 230, 0.55);
    padding-left: 12px;
    position: relative;

    &::before {
      content: '○';
      position: absolute;
      left: 0;
      color: rgba(174, 198, 230, 0.35);
    }

    &.done {
      color: #45e0a5;

      &::before {
        content: '●';
        color: #45e0a5;
      }
    }
  }
}
</style>
