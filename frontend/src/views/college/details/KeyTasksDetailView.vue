<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import { collegeDetailService } from '@/api/college/services/details'
import type { KeyTasksDetailVM } from '@/types/college/view/details'

const data = ref<KeyTasksDetailVM | null>(null)
const loading = ref(true)

const domain = ref('全部')
const status = ref('全部')

const filtered = computed(() => {
  if (!data.value) return []
  return data.value.tasks.filter((t) => {
    if (domain.value === '科研' && t.category !== 'research') return false
    if (domain.value === '教学' && t.category !== 'teaching') return false
    if (status.value !== '全部' && t.statusLabel !== status.value) return false
    return true
  })
})

const risks = computed(() => filtered.value.filter((t) => t.riskReason || t.statusClass === 'status-delayed'))

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
  <CollegeDetailLayout title="年度重点规划进展" subtitle="过程管理 · 风险预警 · 分析维度">
    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <template v-else-if="data">
      <div class="summary-row">
        <span>共 {{ data.summary.total }} 项</span>
        <span>已完成 {{ data.summary.completed }}</span>
        <span>推进中 {{ data.summary.ongoing }}</span>
        <span>需关注 {{ data.summary.delayed }}</span>
        <span>完成率 {{ data.summary.completionRate }}%</span>
      </div>

      <div class="filter-row">
        <label>
          科研 / 教学
          <select v-model="domain">
            <option v-for="d in data.filterOptions.domains" :key="d" :value="d">{{ d }}</option>
          </select>
        </label>
        <label>
          进度状态
          <select v-model="status">
            <option v-for="s in data.filterOptions.statuses" :key="s" :value="s">{{ s }}</option>
          </select>
        </label>
      </div>

      <section v-if="risks.length" class="block">
        <h3>风险预警</h3>
        <div class="task-cards">
          <article v-for="task in risks" :key="`r-${task.id}`" class="task-card task-card--risk">
            <header>
              <h3>{{ task.name }}</h3>
              <span class="status-delayed">需关注</span>
            </header>
            <p class="task-desc">{{ task.riskReason || task.description }}</p>
            <div class="task-meta">
              <span>处理状态：{{ task.handleStatus || '跟进中' }}</span>
              <span>责任人：{{ task.leadDept }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="block">
        <h3>任务过程管理</h3>
        <div class="task-cards">
          <article v-for="task in filtered" :key="task.id" class="task-card">
            <header>
              <h3>{{ task.categoryLabel ? `${task.categoryLabel} · ${task.name}` : task.name }}</h3>
              <span :class="task.statusClass">{{ task.statusLabel }}</span>
            </header>
            <div class="task-meta">
              <span>目标 {{ task.actual }}/{{ task.target }}{{ task.unit }}</span>
              <span>完成率 {{ task.progress }}%</span>
              <span>责任人 {{ task.leadDept }}</span>
              <span>计划完成 {{ task.deadline }}</span>
            </div>
            <p class="task-desc">当前里程碑：{{ task.milestone || '—' }}</p>
            <p v-if="task.materials?.length" class="task-desc">支撑材料：{{ task.materials.join(' · ') }}</p>
          </article>
        </div>
      </section>
    </template>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  color: rgba(174, 198, 230, 0.7);
}

.summary-row,
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 12px;
  font-size: $college-fs-body;
  color: rgba(174, 198, 230, 0.78);
}

.filter-row label {
  display: inline-flex;
  align-items: center;
  gap: 8px;

  select {
    min-height: 32px;
    padding: 4px 8px;
    border-radius: 6px;
    border: 1px solid rgba(102, 217, 255, 0.2);
    background: rgba(4, 14, 38, 0.7);
    color: #eaf7ff;
  }
}

.block {
  margin-bottom: 18px;

  > h3 {
    margin: 0 0 10px;
    color: #b8ecff;
    font-size: $college-fs-body;
  }
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

  &--risk {
    border-color: rgba(255, 140, 80, 0.28);
    background: rgba(48, 22, 10, 0.55);
  }

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
</style>
