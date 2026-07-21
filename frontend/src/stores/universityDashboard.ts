import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DashboardMetaVM } from '@/types/university/view'

export const useUniversityDashboardStore = defineStore('universityDashboard', () => {
  const meta = ref<DashboardMetaVM | null>(null)

  function setMeta(value: DashboardMetaVM) {
    meta.value = value
  }

  return { meta, setMeta }
})
