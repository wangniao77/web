import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { useFilterStore } from '@/stores/filter'
import type { CollegeScope, StudentScope, UniversityScope } from '@/core/types/common'

export function useScope() {
  const appStore = useAppStore()
  const filterStore = useFilterStore()

  const collegeScope = computed<CollegeScope>(() => ({
    collegeId: appStore.collegeId,
    academicYear: filterStore.academicYear,
    semester: filterStore.semester,
  }))

  const studentScope = computed<StudentScope>(() => ({
    studentId: appStore.studentId,
    academicYear: filterStore.academicYear,
    semester: filterStore.semester,
  }))

  const universityScope = computed<UniversityScope>(() => ({
    academicYear: filterStore.academicYear,
    semester: filterStore.semester,
  }))

  const termLabel = computed(
    () => `${filterStore.academicYear} 第${filterStore.semester}学期`,
  )

  return {
    collegeScope,
    studentScope,
    universityScope,
    termLabel,
  }
}
