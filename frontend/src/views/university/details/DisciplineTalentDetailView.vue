<script setup lang="ts">
import { computed } from 'vue'
import UniversityModuleLayout from '@/components/university/layouts/UniversityModuleLayout.vue'
import ModuleSectionContent from '@/components/university/shared/ModuleSectionContent.vue'
import { DISCIPLINE_TALENT_SECTIONS } from '@/constants/university/module-sections'
import { useUniversityModuleDetail } from '@/composables/useUniversityModuleDetail'

const { dashboard, loading, sectionKey } = useUniversityModuleDetail()
const activeKey = computed(() => sectionKey.value || DISCIPLINE_TALENT_SECTIONS[0].key)
const section = computed(() => dashboard.value?.modules.disciplineTalent.sections[activeKey.value] ?? null)
</script>

<template>
  <UniversityModuleLayout title="学科专业与人才培养质量" :sections="DISCIPLINE_TALENT_SECTIONS">
    <div v-if="loading">加载中…</div>
    <ModuleSectionContent v-else :section="section" />
  </UniversityModuleLayout>
</template>
