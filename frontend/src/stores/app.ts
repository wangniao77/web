import { defineStore } from 'pinia'
import { ref } from 'vue'
import { DEMO_STUDENT_ID } from '@/constants/student'

export type ViewMode = 'college' | 'university' | 'student'

export const useAppStore = defineStore('app', () => {
  const viewMode = ref<ViewMode>(
    (import.meta.env.VITE_DEFAULT_VIEW as ViewMode) || 'college',
  )
  const collegeId = ref(import.meta.env.VITE_MOCK_COLLEGE_ID || 'big-data-ai')
  const studentId = ref(DEMO_STUDENT_ID)

  function setViewMode(mode: ViewMode) {
    viewMode.value = mode
  }

  return { viewMode, collegeId, studentId, setViewMode }
})
