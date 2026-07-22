<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import type { QualityVM } from '@/types/student/view'

defineProps<{
  data: QualityVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <CollegePanelCard
    :index="7"
    title="干部贡献 / 综合素质"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="quality">
      <div class="meta-row">
        <div class="roles">
          <span v-for="role in data.cadreRoles" :key="role" class="role-tag">{{ role }}</span>
        </div>
        <div class="counts">
          <span>志愿 <em>{{ data.volunteerHours }}h</em></span>
          <span>实践 <em>{{ data.socialPractices }}次</em></span>
        </div>
      </div>
      <div class="skills-row">
        <div v-for="skill in data.softSkills" :key="skill.name" class="skill-badge">
          <svg viewBox="0 0 36 36" class="ring">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="3" />
            <circle
              cx="18" cy="18" r="15" fill="none"
              stroke="url(#skillGrad)" stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="`${skill.score * 0.94} 100`"
              transform="rotate(-90 18 18)"
            />
            <defs>
              <linearGradient id="skillGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#00b8ff" />
                <stop offset="100%" stop-color="#00e5ff" />
              </linearGradient>
            </defs>
            <text x="18" y="20" text-anchor="middle" fill="#e2edff" font-size="9" font-weight="700">{{ skill.score }}</text>
          </svg>
          <span class="skill-name">{{ skill.name }}</span>
        </div>
      </div>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.quality {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-tag {
  font-size: var(--fs-meta);
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(240, 192, 64, 0.12);
  color: $color-accent-gold;
  border: 1px solid rgba(240, 192, 64, 0.2);
}

.counts {
  display: flex;
  gap: 16px;
  font-size: var(--fs-label);
  color: rgba(174, 198, 230, 0.68);

  em {
    font-style: normal;
    color: $color-accent-cyan;
    font-family: var(--student-font-number, inherit);
    margin-left: 4px;
  }
}

.skills-row {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.skill-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.ring {
  width: 38px;
  height: 38px;
}

.skill-name {
  font-size: var(--fs-meta);
  color: rgba(174, 198, 230, 0.62);
  text-align: center;
}
</style>
