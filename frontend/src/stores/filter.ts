import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { SchoolScope, StatsPeriod } from '@/types/common'

export const useFilterStore = defineStore('filter', () => {
  const academicYear = ref('2024-2025')
  const semester = ref<'1' | '2'>('2')
  const statsPeriod = ref<StatsPeriod>('semester')
  const schoolScope = ref<SchoolScope>('all')

  return { academicYear, semester, statsPeriod, schoolScope }
})
