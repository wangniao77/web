import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { universityService } from '@/api/university/services'
import { useScope } from '@/composables/useScope'
import type { UniversityDashboardVM } from '@/types/university/view'

export function useUniversityModuleDetail() {
  const route = useRoute()
  const { universityScope } = useScope()
  const dashboard = ref<UniversityDashboardVM | null>(null)
  const loading = ref(true)

  const sectionKey = computed(() => String(route.query.section ?? ''))

  onMounted(async () => {
    try {
      dashboard.value = await universityService.fetchOverview(universityScope.value)
    } finally {
      loading.value = false
    }
  })

  return { dashboard, loading, sectionKey }
}
