<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { QualityVM, CreditProgressVM, HealthVM } from '@/types/student/view'

defineProps<{
  quality: QualityVM
  credit: CreditProgressVM
  health: HealthVM
}>()
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard title="综合素质 · 第二课堂">
      <div class="stu-comp">
        <div class="stu-comp__top">
          <div class="stu-comp__ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" class="stu-comp__ring-track" />
              <circle
                cx="60" cy="60" r="48"
                class="stu-comp__ring-progress stu-comp__ring-progress--credit"
                :style="{ strokeDashoffset: 301 - (301 * credit.earnedPercent) / 100 }"
              />
            </svg>
            <div class="stu-comp__ring-text">
              <strong>{{ credit.earnedPercent }}%</strong>
              <span>必修学分</span>
            </div>
          </div>
          <div class="stu-comp__ring">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" class="stu-comp__ring-track" />
              <circle
                cx="60" cy="60" r="48"
                class="stu-comp__ring-progress stu-comp__ring-progress--second"
                :style="{ strokeDashoffset: 301 - (301 * credit.secondPercent) / 100 }"
              />
            </svg>
            <div class="stu-comp__ring-text">
              <strong>{{ credit.secondPercent }}%</strong>
              <span>第二课堂</span>
            </div>
          </div>
        </div>

        <div class="stu-comp__stats">
          <div><span>志愿时长</span><strong>{{ quality.volunteerHours }}h</strong></div>
          <div><span>社会实践</span><strong>{{ quality.socialPractices }}次</strong></div>
          <div><span>健康指数</span><strong>{{ health.healthScore }}</strong></div>
          <div><span>心理健康</span><strong>{{ health.mentalHealth }}</strong></div>
        </div>

        <div class="stu-comp__roles">
          <span v-for="role in quality.cadreRoles" :key="role" class="stu-comp__role">{{ role }}</span>
        </div>

        <div class="stu-comp__skills">
          <div v-for="skill in quality.softSkills" :key="skill.name" class="stu-comp__skill">
            <strong>{{ skill.score }}</strong>
            <span>{{ skill.name }}</span>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-comp {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stu-comp__top {
  display: flex;
  justify-content: space-around;
  gap: 8px;
}

.stu-comp__ring {
  position: relative;
  width: 96px;
  height: 96px;

  svg { width: 100%; height: 100%; transform: rotate(-90deg); }
}

.stu-comp__ring-track {
  fill: none;
  stroke: rgba(0, 80, 160, 0.35);
  stroke-width: 8;
}

.stu-comp__ring-progress {
  fill: none;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 301;

  &--credit { stroke: #39e6ff; filter: drop-shadow(0 0 6px rgba(57, 230, 255, 0.5)); }
  &--second { stroke: #ffd166; filter: drop-shadow(0 0 6px rgba(255, 209, 102, 0.4)); }
}

.stu-comp__ring-text {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  strong {
    font-family: var(--student-font-number);
    font-size: var(--fs-body);
    color: #7ff6ff;
  }

  span { font-size: var(--fs-micro); color: #8ec8e8; }
}

.stu-comp__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  div {
    text-align: center;
    padding: 5px 4px;
    border-radius: 6px;
    background: rgba(0, 50, 100, 0.22);
    border: 1px solid rgba(0, 180, 255, 0.1);

    span { display: block; font-size: var(--fs-micro); color: #8ec8e8; }
    strong { font-size: var(--fs-label); color: #7ff6ff; font-family: var(--student-font-number); }
  }
}

.stu-comp__roles {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.stu-comp__role {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: var(--fs-meta);
  color: #ffd166;
  background: rgba(255, 200, 80, 0.12);
  border: 1px solid rgba(255, 200, 80, 0.22);
}

.stu-comp__skills {
  flex: 1;
  min-height: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
}

.stu-comp__skill {
  flex: 1;
  text-align: center;
  padding: 6px 4px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.2);
  border: 1px solid rgba(0, 200, 255, 0.1);

  strong {
    display: block;
    font-family: var(--student-font-number);
    font-size: var(--fs-body);
    color: #7ff6ff;
  }

  span { font-size: var(--fs-micro); color: #9ecae8; }
}
</style>
