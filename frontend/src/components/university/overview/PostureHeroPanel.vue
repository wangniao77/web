<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import UniversityHeroGauge from '@/components/university/shared/UniversityHeroGauge.vue'
import { ROUTES } from '@/constants/routes'
import type { PostureModuleVM } from '@/types/university/view/modules'

defineProps<{ data: PostureModuleVM; loading?: boolean; error?: string | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel :index="1" title="学校发展综合态势" variant="core" :detail-to="ROUTES.university.posture" :loading="loading" :error="error" @retry="$emit('retry')">
    <UniversityHeroGauge
      :development-index="data.developmentIndex"
      :yoy-change-label="data.yoyChangeLabel"
      :orbit-kpis="data.orbitKpis"
    />
  </FuturisticPanel>
</template>
