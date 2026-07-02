<script setup lang="ts">
import { ref } from 'vue'
import CollegePanelCard from '@/components/screen/college/CollegePanelCard.vue'
import type { PersonalInfoVM, QualityVM } from '@/types/view/student'

defineProps<{
  data: PersonalInfoVM
  quality: QualityVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const avatarError = ref(false)

function onAvatarError() {
  avatarError.value = true
}
</script>

<template>
  <CollegePanelCard
    :index="1"
    title="个人信息 · 干部贡献 / 综合素质"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="personal-info">
      <div class="portrait-section">
        <div class="avatar-wrap">
          <div class="avatar">
            <img
              v-if="data.avatarUrl && !avatarError"
              :src="data.avatarUrl"
              :alt="`${data.name} 头像`"
              class="avatar-img"
              @error="onAvatarError"
            />
            <span v-else class="avatar-text">{{ data.name.slice(0, 1) }}</span>
          </div>
          <div class="portrait-glow" aria-hidden="true" />
        </div>
        <div class="name-block">
          <h4 class="name">{{ data.name }}</h4>
          <span class="class-name">{{ data.className }}</span>
        </div>
      </div>

      <ul class="info-list">
        <li><span>学号</span><em>{{ data.studentId }}</em></li>
        <li><span>学院</span><em>{{ data.college }}</em></li>
        <li><span>专业</span><em>{{ data.major }}</em></li>
        <li><span>年级</span><em>{{ data.grade }}</em></li>
        <li><span>导师</span><em>{{ data.mentor }}</em></li>
        <li><span>辅导员</span><em>{{ data.counselor }}</em></li>
      </ul>

      <section class="quality-section">
        <div class="quality-head">
          <div class="roles">
            <span v-for="role in quality.cadreRoles" :key="role" class="role-tag">{{ role }}</span>
          </div>
          <div class="counts">
            <span>志愿 <em>{{ quality.volunteerHours }}h</em></span>
            <span>实践 <em>{{ quality.socialPractices }}次</em></span>
          </div>
        </div>
        <div class="skills-row">
          <div v-for="(skill, i) in quality.softSkills" :key="skill.name" class="skill-badge">
            <svg viewBox="0 0 36 36" class="ring">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(0,212,255,0.1)" stroke-width="3" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                :stroke="`url(#skillGrad-${i})`"
                stroke-width="3"
                stroke-linecap="round"
                :stroke-dasharray="`${skill.score * 0.94} 100`"
                transform="rotate(-90 18 18)"
              />
              <defs>
                <linearGradient :id="`skillGrad-${i}`" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stop-color="#00b8ff" />
                  <stop offset="100%" stop-color="#00e5ff" />
                </linearGradient>
              </defs>
              <text x="18" y="20" text-anchor="middle" fill="#e2edff" font-size="9" font-weight="700">
                {{ skill.score }}
              </text>
            </svg>
            <span class="skill-name">{{ skill.name }}</span>
          </div>
        </div>
      </section>

      <blockquote class="motto">"{{ data.motto }}"</blockquote>
    </div>
  </CollegePanelCard>
</template>

<style scoped lang="scss">
.personal-info {
  height: 100%;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 8px;
  min-height: 0;
}

.portrait-section {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(0, 212, 255, 0.08);
}

.avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(0, 184, 255, 0.25), rgba(5, 14, 34, 0.6));
  border: 2px solid rgba(0, 212, 255, 0.45);
  box-shadow: 0 0 24px rgba(0, 184, 255, 0.2);
  position: relative;
  z-index: 1;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

.avatar-text {
  font-size: 32px;
  font-weight: 700;
  color: #e2f4ff;
}

.portrait-glow {
  position: absolute;
  inset: -6px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(0, 212, 255, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.name-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.name {
  font-size: $college-fs-highlight;
  font-weight: 700;
  color: #f4f8ff;
}

.class-name {
  font-size: $college-fs-label;
  color: rgba(190, 210, 238, 0.85);
}

.info-list {
  list-style: none;
  margin: 0;
  padding: 0;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1px;

  li {
    display: flex;
    justify-content: space-between;
    font-size: $college-fs-label;
    padding: 2px 0;
    border-bottom: 1px solid rgba(0, 212, 255, 0.06);

    span { color: rgba(190, 210, 238, 0.8); flex-shrink: 0; }
    em {
      font-style: normal;
      color: #eef5ff;
      text-align: right;
      max-width: 62%;
      line-height: 1.3;
    }
  }
}

.quality-section {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 0 4px;
  border-top: 1px solid rgba(0, 212, 255, 0.1);
}

.quality-head {
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
  font-size: $college-fs-meta;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(240, 192, 64, 0.12);
  color: $color-accent-gold;
  border: 1px solid rgba(240, 192, 64, 0.2);
}

.counts {
  display: flex;
  gap: 12px;
  font-size: $college-fs-label;
  color: rgba(190, 210, 238, 0.8);

  em {
    font-style: normal;
    color: $color-accent-cyan;
    font-family: var(--student-font-number, inherit);
    margin-left: 4px;
  }
}

.skills-row {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 4px;
}

.skill-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 0;
}

.ring {
  width: 36px;
  height: 36px;
}

.skill-name {
  font-size: 11px;
  color: rgba(198, 216, 242, 0.82);
  text-align: center;
  line-height: 1.2;
  max-width: 56px;
}

.motto {
  margin: 0;
  padding: 6px 10px;
  font-size: $college-fs-meta;
  color: rgba(202, 221, 245, 0.9);
  font-style: italic;
  border-left: 2px solid rgba(0, 212, 255, 0.4);
  background: rgba(0, 184, 255, 0.04);
  border-radius: 0 6px 6px 0;
  line-height: 1.35;
}
</style>
