import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useFilterStore = defineStore('filter', () => {
  const academicYear = ref('2024-2025')
  const semester = ref<'1' | '2'>('2')

  return { academicYear, semester }
})
