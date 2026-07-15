<script setup lang="ts">
import { computed } from 'vue'
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { HealthVM, AcademicDevVM } from '@/types/student/view'

const props = defineProps<{
  health: HealthVM
  academic: AcademicDevVM
}>()

function gradeOf(score: number): string {
  if (score >= 90) return '优秀'
  if (score >= 80) return '良好'
  if (score >= 70) return '中等'
  return '待提升'
}

const physicalGrade = computed(() => gradeOf(props.academic.physicalTestScore))
const runPercent = computed(() =>
  Math.min(100, Math.round((props.health.summary30d.totalMinutes / 1200) * 100)),
)
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard title="体育健康 · 运动习惯">
      <div class="stu-health">
        <div class="stu-health__hero">
          <div class="stu-health__score">
            <strong>{{ health.healthScore }}</strong>
            <span>健康综合</span>
          </div>
          <div class="stu-health__ring">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,80,160,0.35)" stroke-width="8" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke="#34d399" stroke-width="8"
                stroke-linecap="round" :stroke-dasharray="`${runPercent * 2.51} 251`"
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div><strong>{{ runPercent }}%</strong><span>校园跑进度</span></div>
          </div>
        </div>
        <div class="stu-health__grid">
          <div><span>体测成绩</span><strong>{{ physicalGrade }}</strong></div>
          <div><span>心理健康</span><strong>{{ health.mentalHealth }}</strong></div>
          <div><span>运动习惯</span><strong>{{ health.exerciseHabit }}</strong></div>
          <div><span>30天运动</span><strong>{{ health.summary30d.frequency }}次</strong></div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-health {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stu-health__hero {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stu-health__score {
  text-align: center;
  padding: 10px 16px;
  border-radius: 8px;
  background: rgba(52, 211, 153, 0.12);
  border: 1px solid rgba(52, 211, 153, 0.28);

  strong {
    display: block;
    font-family: var(--student-font-number);
    font-size: var(--fs-highlight);
    color: #63ffe1;
  }

  span { font-size: var(--fs-meta); color: #9ecae8; }
}

.stu-health__ring {
  position: relative;
  width: 88px;
  height: 88px;

  svg { width: 100%; height: 100%; }

  div {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    strong { font-size: var(--fs-body); color: #34d399; font-family: var(--student-font-number); }
    span { font-size: var(--fs-micro); color: #8ec8e8; }
  }
}

.stu-health__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;

  div {
    text-align: center;
    padding: 6px 4px;
    border-radius: 6px;
    background: rgba(0, 50, 100, 0.2);

    span { display: block; font-size: var(--fs-micro); color: #8ec8e8; }
    strong { font-size: var(--fs-label); color: #e8f4ff; }
  }
}
</style>
