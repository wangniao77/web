<script setup lang="ts">
import { computed } from 'vue'
import UniversityModuleLayout from '@/components/university/layouts/UniversityModuleLayout.vue'
import ModuleSectionContent from '@/components/university/shared/ModuleSectionContent.vue'
import { POSTURE_SECTIONS } from '@/constants/university/module-sections'
import { useUniversityModuleDetail } from '@/composables/useUniversityModuleDetail'

const { dashboard, loading, sectionKey } = useUniversityModuleDetail()
const activeKey = computed(() => sectionKey.value || POSTURE_SECTIONS[0].key)
const section = computed(() => dashboard.value?.modules.posture.sections[activeKey.value] ?? null)
</script>

<template>
  <UniversityModuleLayout title="学校发展综合态势" subtitle="综合态势、学生规模、学院专业与核心发展指数" :sections="POSTURE_SECTIONS">
    <div v-if="loading">加载中…</div>
    <ModuleSectionContent v-else :section="section" />
  </UniversityModuleLayout>
</template>
