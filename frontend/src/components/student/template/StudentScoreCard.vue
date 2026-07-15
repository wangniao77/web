<script setup lang="ts">
import { computed } from 'vue'
import type { IconKind } from '@/components/college/DashIcon.vue'
import CoreHeroGauge from '@/components/college/modules/center-hub/CoreHeroGauge.vue'
import StudentTplCard from './StudentTplCard.vue'
import type { AcademicDevVM, EmploymentVM, GrowthOverviewVM, GrowthPortraitVM, HealthVM } from '@/types/student/view'
import type { OverviewHubVM } from '@/types/college/view'

const props = defineProps<{
  growthOverview: GrowthOverviewVM
  growthPortrait: GrowthPortraitVM
  academic: AcademicDevVM
  health: HealthVM
  employment: EmploymentVM
}>()

const score = computed(() => props.growthOverview.growthIndex)
const starCount = computed(() => Math.min(5, Math.round(score.value / 18)))

const hub = computed<OverviewHubVM>(() => ({
  developmentIndex: score.value,
  maxScore: 100,
  starLevel: starCount.value,
  kpis: [
    {
      label: '学业表现',
      value: (props.growthPortrait.personal[0] ?? 89.2).toFixed(1),
      icon: 'academic' as IconKind,
      position: 'tl',
    },
    {
      label: '综合素质',
      value: props.growthOverview.qualityScore.toFixed(1),
      icon: 'trophy' as IconKind,
      position: 'tr',
    },
    {
      label: '心理状态',
      value: props.health.mentalHealth.toFixed(1),
      icon: 'mental' as IconKind,
      position: 'bl',
    },
    {
      label: '就业发展',
      value: props.employment.jobReadiness.toFixed(1),
      icon: 'employment' as IconKind,
      position: 'br',
    },
  ],
}))
</script>

<template>
  <StudentTplCard icon="ranking" title="综合画像得分" class="stu-tpl__score">
    <div class="cockpit-hero stu-score-hero">
      <CoreHeroGauge :data="hub" center-label="综合得分" />
    </div>
  </StudentTplCard>
</template>
