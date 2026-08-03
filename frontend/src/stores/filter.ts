import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const academicYear = ref('2025-2026')
  const semester = ref<'1' | '2'>('2')

  return { academicYear, semester }
})
