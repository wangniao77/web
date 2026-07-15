<script setup lang="ts">
import type { PersonalInfoVM, GrowthOverviewVM, StudentDashboardVM } from '@/types/student/view'

defineProps<{
  profile: PersonalInfoVM
  overview: GrowthOverviewVM
  scholarships: StudentDashboardVM['scholarships']
}>()

const trendLabel = {
  positive: '正向成长',
  negative: '负向下滑',
  stable: '平稳',
} as const
</script>

<template>
  <div class="stu-identity">
    <div class="stu-identity__hero">
      <div class="stu-identity__avatar-wrap">
        <img :src="profile.avatarUrl || '/student/avatar.png'" :alt="profile.name" class="stu-identity__avatar" />
        <span class="stu-identity__status">{{ profile.onCampusStatus || '在校' }}</span>
      </div>
      <div class="stu-identity__main">
        <h2 class="stu-identity__name">{{ profile.name }}</h2>
        <p class="stu-identity__id">{{ profile.studentId }} · {{ profile.grade }}</p>
        <p class="stu-identity__major">{{ profile.major }} · {{ profile.className }}</p>
        <div class="stu-identity__badges">
          <span class="stu-badge">{{ profile.politicalStatus || '群众' }}</span>
          <span class="stu-badge stu-badge--cyan">{{ trendLabel[profile.growthTrend || 'stable'] }}</span>
          <span
            v-if="profile.mentalLevel"
            class="stu-badge"
            :class="profile.mentalLevelCode === 'high' ? 'stu-badge--warn' : 'stu-badge--amber'"
          >
            心理{{ profile.mentalLevel }}
          </span>
          <span v-if="profile.economicHardship" class="stu-badge stu-badge--warn">经济困难</span>
        </div>
      </div>
      <div class="stu-identity__index">
        <span>成长指数</span>
        <strong>{{ overview.growthIndex }}</strong>
        <em>{{ overview.growthLevel }}</em>
      </div>
    </div>

    <div class="stu-identity__grid">
      <div><span>辅导员</span><strong>{{ profile.counselor }}</strong></div>
      <div><span>班主任</span><strong>{{ profile.mentor }}</strong></div>
      <div><span>论文导师</span><strong>{{ profile.thesisAdvisor || '—' }}</strong></div>
      <div><span>论文进度</span><strong>{{ profile.thesisStatus || '—' }}</strong></div>
      <div><span>联系电话</span><strong>{{ profile.phone || '—' }}</strong></div>
      <div><span>家庭住址</span><strong>{{ profile.address || '—' }}</strong></div>
    </div>

    <div v-if="scholarships.length" class="stu-identity__scholarships">
      <span class="stu-identity__section-label">奖学金</span>
      <ul>
        <li v-for="s in scholarships" :key="`${s.name}-${s.year}`">
          <strong>{{ s.name }}</strong>
          <em>{{ s.year }}</em>
        </li>
      </ul>
    </div>

    <div v-if="profile.awards.length" class="stu-identity__honors">
      <span class="stu-identity__section-label">近期荣誉</span>
      <ul>
        <li v-for="a in profile.awards.slice(0, 3)" :key="a.name">
          {{ a.name }}<em>{{ a.date }}</em>
        </li>
      </ul>
    </div>
  </div>
</template>
