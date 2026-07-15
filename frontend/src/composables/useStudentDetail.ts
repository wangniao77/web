import { reactive, readonly } from 'vue'

export type StudentDetailSection = 'academic' | 'quality' | 'mental' | 'basic'

const state = reactive<{
  open: boolean
  section: StudentDetailSection | null
}>({
  open: false,
  section: null,
})

export function useStudentDetail() {
  function openDetail(section: StudentDetailSection) {
    state.section = section
    state.open = true
  }

  function closeDetail() {
    state.open = false
    state.section = null
  }

  return {
    state: readonly(state),
    openDetail,
    closeDetail,
  }
}
