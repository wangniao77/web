<script setup lang="ts">
import { onMounted, ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import StudentScreenLayout from '@/components/student/StudentScreenLayout.vue'
import StudentPortraitV2 from '@/components/student/v2/StudentPortraitV2.vue'
import StudentLoadingSkeleton from '@/components/student/StudentLoadingSkeleton.vue'
import { useStudentEntrance } from '@/composables/useStudentEntrance'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useScope } from '@/composables/useScope'
import { useStudentDashboardExport } from '@/composables/useStudentDashboardExport'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import '@/styles/student/student.scss'

const route = useRoute()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)
const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const { play: playEntrance } = useStudentEntrance()
useStudentDashboardExport('学生总览', dashboard)

async function loadAll() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
    requestAnimationFrame(() => playEntrance())
  }
}

onMounted(loadAll)
watch(activeStudentId, loadAll)
useAutoRefresh(loadAll)
</script>

<template>
  <StudentScreenLayout v-if="dashboard">
    <StudentPortraitV2
      :dashboard="dashboard"
      :loading="loading"
      :error="error"
      @retry="loadAll"
    />
  </StudentScreenLayout>
  <StudentLoadingSkeleton v-else-if="loading" />
  <div v-else-if="error" class="loading-screen">
    <span>{{ error }}</span>
    <button type="button" @click="loadAll">重试</button>
  </div>
</template>

<style scoped lang="scss">
.loading-screen {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: #020818;
  color: #8eb4d8;
  font-size: 16px;

  button {
    padding: 8px 20px;
    border-radius: 6px;
    border: 1px solid rgba(0, 212, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #00d4ff;
    cursor: pointer;
  }
}
</style>
