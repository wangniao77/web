<script setup lang="ts">
/**
 * 学生端"学分进度 / 培养方案达成"页面（路由入口）
 *
 * 路由：/student/credit-progress
 * 入口：一级页 AcademicDevPanel 点击 "学分完成率" KPI 卡
 *
 * 内容（面向老师）：
 * 1. 5 张 KPI（总进度 + 4 类别学分达成）
 * 2. 各类别学分达成对比（横向条形图）
 * 3. 未达成提醒（自动派生）
 * 4. 个人培养方案进度表（占满整行，可按类别/状态筛选）
 */
import { onMounted, ref } from 'vue'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import KpiSummary from './components/KpiSummary.vue'
import CategoryProgressChart from './components/CategoryProgressChart.vue'
import GapReminderCard from './components/GapReminderCard.vue'
import TrainingPlanTable from './components/TrainingPlanTable.vue'
import { creditProgressService } from '../_shared/credit-data'
import type { CreditProgressVM } from '../_shared/credit-data'

const data = ref<CreditProgressVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await creditProgressService.fetchProgress()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学分进度与培养方案"
    subtitle="面向老师：必修 / 选修 / 通识学分达成情况 · 缺口提醒 · 个人培养方案进度"
    back-text="← 返回学生档案"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载学分进度...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="data" class="credit-progress">
      <!-- 行 1：5 卡 KPI -->
      <KpiSummary :summary="data.summary" />

      <!-- 行 2：双列（达成图 + 提醒） -->
      <section class="row two-cols-row">
        <div class="row-2-of-3">
          <CategoryProgressChart :categories="data.summary.categories" />
        </div>
        <div class="row-1-of-3">
          <GapReminderCard v-if="data.hasGaps" :gaps="data.summary.gaps" />
          <div v-else class="all-clear">
            <span class="ac-bar" aria-hidden="true" />
            <h3 class="ac-title">培养方案已全部达成</h3>
            <p class="ac-sub">所有类别学分均已修满，无缺口项</p>
          </div>
        </div>
      </section>

      <!-- 行 3：个人培养方案进度表（占满整行 + 撑满页面剩余空间） -->
      <section class="row plan-row">
        <TrainingPlanTable
          :courses="data.courses"
          :categories="data.summary.categories"
        />
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.credit-progress {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  gap: 12px;
}

.row {
  display: flex;
  gap: 12px;
  min-height: 0;
}

.two-cols-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 12px;
  min-height: 0;
  flex-shrink: 0;
}

.row-2-of-3,
.row-1-of-3 {
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.row-2-of-3 {
  height: 360px;
}

.row-1-of-3 {
  height: 360px;
}

/* 占满整行 + 撑满剩余空间（自包含滚动） */
.plan-row {
  flex: 1;
  min-height: 480px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.38);

  &.error { color: #f87171; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover { background: rgba(0, 184, 255, 0.2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── 全部达成的占位卡片 ────────────────────────────────── */
.all-clear {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(52, 211, 153, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  border: 1px solid rgba(52, 211, 153, 0.32);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(52, 211, 153, 0.08);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(52, 211, 153, 0.62), transparent);
  }
}

.ac-bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #34d399, #10b981);
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
  position: absolute;
  top: 18px;
  left: 22px;
}

.ac-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #34d399;
  text-shadow: 0 0 12px rgba(52, 211, 153, 0.3);
  letter-spacing: 0.04em;
}

.ac-sub {
  margin: 0;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.7);
}

@media (max-width: 1280px) {
  .two-cols-row {
    grid-template-columns: 1fr;
  }
  .row-2-of-3,
  .row-1-of-3 {
    height: auto;
    min-height: 320px;
  }
  .plan-row {
    min-height: 600px;
  }
}
</style>
