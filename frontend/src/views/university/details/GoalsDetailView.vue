<script setup lang="ts">
import { computed } from 'vue'
import UniversityModuleLayout from '@/components/university/layouts/UniversityModuleLayout.vue'
import ModuleSectionContent from '@/components/university/shared/ModuleSectionContent.vue'
import { GOALS_SECTIONS } from '@/constants/university/module-sections'
import { useUniversityModuleDetail } from '@/composables/useUniversityModuleDetail'

const { dashboard, loading, sectionKey } = useUniversityModuleDetail()
const activeKey = computed(() => sectionKey.value || GOALS_SECTIONS[0].key)
const section = computed(() => dashboard.value?.modules.goals.sections[activeKey.value] ?? null)
</script>

<template>
  <UniversityModuleLayout title="年度目标达成总览" subtitle="目标完成、责任单位进展与滞后分析" :sections="GOALS_SECTIONS">
    <div v-if="loading">加载中…</div>
    <ModuleSectionContent v-else :section="section" />
  </UniversityModuleLayout>
</template>
