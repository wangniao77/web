<script setup lang="ts">
import { onMounted, ref } from 'vue'
import StudentScreenLayout from '@/layouts/StudentScreenLayout.vue'
import PanelCard from '@/components/screen/PanelCard.vue'
import MetricCard from '@/components/metrics/MetricCard.vue'
import { studentService } from '@/services/student'
import type { StudentProfileDTO } from '@/types/api/student'

const profile = ref<StudentProfileDTO | null>(null)
const loading = ref(true)

onMounted(async () => {
  profile.value = await studentService.fetchProfile()
  loading.value = false
})
</script>

<template>
  <StudentScreenLayout
    v-if="profile"
    :student-name="profile.name"
    :student-meta="`${profile.college} · ${profile.major} · ${profile.grade} · ${profile.studentId}`"
  >
    <div class="student-grid">
      <PanelCard title="个人成长指数" class="profile-panel">
        <div class="profile-score">
          <span class="score">{{ profile.growthIndex }}</span>
          <span class="label">综合成长指数</span>
        </div>
        <div class="profile-meta">
          <div>GPA <em>{{ profile.gpa }}</em></div>
          <div>学分 <em>{{ profile.credits.earned }}/{{ profile.credits.required }}</em></div>
        </div>
      </PanelCard>

      <PanelCard title="学业概况">
        <div class="metrics-grid">
          <MetricCard label="GPA" :value="String(profile.gpa)" />
          <MetricCard
            label="已修学分"
            :value="`${profile.credits.earned}/${profile.credits.required}`"
          />
        </div>
      </PanelCard>

      <PanelCard title="素质成长">
        <ul class="achievement-list">
          <li v-for="a in profile.achievements" :key="a.label">
            <span>{{ a.label }}</span>
            <em>{{ a.value }}</em>
          </li>
        </ul>
      </PanelCard>

      <PanelCard title="个人预警">
        <ul class="warning-list">
          <li
            v-for="w in profile.warnings"
            :key="w.type"
            :class="`level-${w.level}`"
          >
            <span>{{ w.label }}</span>
            <span class="level-tag">{{ w.level === 'low' ? '低' : w.level === 'medium' ? '中' : '高' }}</span>
          </li>
          <li v-if="!profile.warnings.length" class="no-warning">暂无预警</li>
        </ul>
      </PanelCard>
    </div>
  </StudentScreenLayout>
  <div v-else-if="loading" class="loading">加载中...</div>
</template>

<style scoped lang="scss">
.student-grid {
  height: 100%;
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 12px;
}

.profile-panel {
  grid-row: span 2;
}

.profile-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0;

  .score {
    font-family: $font-display;
    font-size: 48px;
    font-weight: 700;
    color: $color-accent;
  }

  .label {
    font-size: 13px;
    color: $color-text-secondary;
    margin-top: 4px;
  }
}

.profile-meta {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 16px;
  font-size: 13px;
  color: $color-text-secondary;

  em {
    font-style: normal;
    color: $color-accent-gold;
    font-family: $font-display;
    margin-left: 8px;
  }
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 16px;
}

.achievement-list,
.warning-list {
  list-style: none;
  padding: 12px 16px;

  li {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid rgba(0, 212, 255, 0.08);
    font-size: 13px;
    color: $color-text-secondary;

    em {
      font-style: normal;
      color: $color-accent;
      font-family: $font-display;
    }
  }
}

.level-low .level-tag {
  color: $color-success;
}

.level-medium .level-tag {
  color: $color-warning;
}

.level-high .level-tag {
  color: $color-danger;
}

.no-warning {
  justify-content: center !important;
  color: $color-success !important;
}

.loading {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #020818;
  color: #8eb4d8;
}
</style>
