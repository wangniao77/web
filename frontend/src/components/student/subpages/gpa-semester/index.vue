<script setup lang="ts">
/**
 * 学生端 GPA · 每学期课程明细（独立页面）
 *
 * 路由：/student/gpa-semester
 * 入口：gpa-detail 页面底部"查看完整明细"卡片
 *
 * 与 gpa-detail 共用 _shared/gpa-data 数据层。
 */
import { onMounted, ref } from 'vue'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import SemesterCourseTable from './components/SemesterCourseTable.vue'
import { gpaDetailService } from '../_shared/gpa-data'
import type { GpaDetailVM } from '../_shared/gpa-data'

const data = ref<GpaDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

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

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="每学期已修课程明细"
    subtitle="完整课程列表 · 按学期切换 · 支持成绩 / 学分 / 名称排序"
    back-text="← 返回 GPA 总览"
    :back-to="{ name: 'student-gpa-detail' }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载课程明细...
    </div>

    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span>
      <button type="button" @click="load">重试</button>
    </div>

    <div v-else-if="data" class="gpa-semester">
      <SemesterCourseTable
        :semesters="data.semesters"
        :courses="data.courses"
      />
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.gpa-semester {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
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
</style>
