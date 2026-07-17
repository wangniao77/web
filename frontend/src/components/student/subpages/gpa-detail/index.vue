<script setup lang="ts">
/**
 * 学生端 GPA 详情页（路由入口 / 概览）
 *
 * 路由：/student/gpa-detail
 * 从一级页面 AcademicDevPanel 点击 "绩点 GPA" KPI 卡进入。
 *
 * 内容：KPI 摘要 + 4 个图表 + 2 个课程榜单。
 * 学期课程明细已独立为 /student/gpa-semester，从下方入口卡片进入。
 */
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import KpiSummary from './components/KpiSummary.vue'
import TrendChart from './components/TrendChart.vue'
import DistributionChart from './components/DistributionChart.vue'
import CategoryRadar from './components/CategoryRadar.vue'
import CourseScatter from './components/CourseScatter.vue'
import ExcellentCourseList from './components/ExcellentCourseList.vue'
import WarningCourseList from './components/WarningCourseList.vue'
import { gpaDetailService } from '../_shared/gpa-data'
import type { GpaDetailVM } from '../_shared/gpa-data'
import { ROUTES } from '@/constants/routes'

const data = ref<GpaDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const router = useRouter()

async function load() {
  loading.value = true
  error.value = null
  try {
    data.value = await gpaDetailService.fetchDetail()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function gotoSemester() {
  router.push(ROUTES.student.gpaSemester)
}

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学生 GPA 详情"
    subtitle="学业总览 · 课程分布 · 擅长 / 潜力分析"
    back-text="← 返回学生档案"
    :back-to="{ name: 'student' }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载 GPA 数据...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="data" class="gpa-detail">
      <!-- 行 1：KPI 摘要（占整行） -->
      <section class="row full-width">
        <KpiSummary :data="data.overview" />
      </section>

      <!-- 行 2-3：4 个图表，两两一行 -->
      <section class="row">
        <TrendChart :semesters="data.semesters" />
      </section>
      <section class="row">
        <DistributionChart :data="data.overview" />
      </section>

      <section class="row chart-row-tall">
        <CategoryRadar :data="data.categoryStats" />
      </section>
      <section class="row chart-row-tall">
        <CourseScatter :courses="data.courses" :semesters="data.semesterList" />
      </section>

      <!-- 行 4：双列表 -->
      <section class="row list-row">
        <ExcellentCourseList :courses="data.excellentCourses" />
      </section>
      <section class="row list-row">
        <WarningCourseList :courses="data.warningCourses" />
      </section>

      <!-- 行 5：跳转入口（占整行） -->
      <section class="row full-width">
        <button
          type="button"
          class="semester-entry"
          @click="gotoSemester"
        >
          <span class="entry-bar" aria-hidden="true" />
          <div class="entry-info">
            <h3 class="entry-title">每学期已修课程明细</h3>
            <p class="entry-sub">
              共 <b>{{ data.semesters.length }}</b> 个学期 ·
              <b>{{ data.courses.length }}</b> 门课程 ·
              支持按成绩 / 学分 / 名称排序
            </p>
          </div>
          <div class="entry-stats">
            <div class="entry-stat">
              <span class="entry-stat-num">{{ data.courses.filter(c => c.counted).length }}</span>
              <span class="entry-stat-label">计入 GPA</span>
            </div>
            <div class="entry-stat">
              <span class="entry-stat-num">{{ data.courses.filter(c => !c.counted).length }}</span>
              <span class="entry-stat-label">不计入</span>
            </div>
            <div class="entry-stat">
              <span class="entry-stat-num">{{ data.courses.reduce((s, c) => s + c.credit, 0) }}</span>
              <span class="entry-stat-label">总学分</span>
            </div>
          </div>
          <span class="entry-arrow" aria-hidden="true">查看完整明细 →</span>
        </button>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.gpa-detail {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.row {
  min-height: 0;
}

.full-width {
  grid-column: span 2;
}

.chart-row-tall {
  height: 320px;
}

.list-row {
  height: 280px;
}

/* ── 学期明细跳转入口卡片 ────────────────────────────── */
.semester-entry {
  position: relative;
  width: 100%;
  display: grid;
  grid-template-columns: 4px minmax(0, 1.2fr) minmax(0, 1fr) auto;
  align-items: center;
  gap: 18px;
  padding: 18px 24px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  border: 1px solid rgba(102, 217, 255, 0.18);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  cursor: pointer;
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }

  &:hover,
  &:focus-visible {
    transform: translateY(-2px);
    border-color: rgba(0, 212, 255, 0.55);
    box-shadow:
      0 16px 32px rgba(0, 130, 200, 0.22),
      inset 0 0 24px rgba(0, 212, 255, 0.12);
    outline: none;

    .entry-arrow {
      color: #66d9ff;
      transform: translateX(4px);
    }
    .entry-bar {
      box-shadow: 0 0 12px rgba(0, 212, 255, 0.85);
    }
  }
}

.entry-bar {
  width: 4px;
  height: 56px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.55);
  transition: box-shadow 0.2s ease;
}

.entry-info {
  min-width: 0;
}

.entry-title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: 0.04em;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.28);
}

.entry-sub {
  margin: 0;
  font-size: 13px;
  color: rgba(184, 236, 255, 0.7);
  letter-spacing: 0.02em;

  b {
    color: #f0c040;
    font-weight: 800;
    font-family: 'DIN Alternate', sans-serif;
    font-size: 14px;
    margin: 0 2px;
  }
}

.entry-stats {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.entry-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.entry-stat-num {
  font-family: 'DIN Alternate', sans-serif;
  font-size: 24px;
  font-weight: 800;
  color: #66d9ff;
  line-height: 1;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.35);
}

.entry-stat-label {
  font-size: 11px;
  color: rgba(184, 236, 255, 0.55);
  letter-spacing: 0.04em;
}

.entry-arrow {
  font-size: 14px;
  font-weight: 700;
  color: #8ef6ff;
  letter-spacing: 0.06em;
  white-space: nowrap;
  transition: color 0.2s ease, transform 0.2s ease;
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

@media (max-width: 1280px) {
  .gpa-detail {
    grid-template-columns: 1fr;
  }
  .full-width {
    grid-column: span 1;
  }
  .chart-row-tall { height: auto; min-height: 320px; }
  .list-row { height: auto; }

  .semester-entry {
    grid-template-columns: 4px 1fr;
    grid-template-rows: auto auto auto;
    gap: 12px;
  }
  .entry-stats {
    grid-column: 2;
    justify-content: flex-start;
  }
  .entry-arrow {
    grid-column: 2;
  }
}
</style>
