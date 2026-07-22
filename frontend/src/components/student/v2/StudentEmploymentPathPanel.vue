<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { EmploymentVM, TimelineTermVM } from '@/types/student/view'

defineProps<{
  employment: EmploymentVM
  timeline: TimelineTermVM[]
}>()

const yearSteps = [
  { key: 'y1', label: '大一', text: '探索兴趣 · 夯实基础' },
  { key: 'y2', label: '大二', text: '竞赛突破 · 能力积累' },
  { key: 'y3', label: '大三', text: '实习实践 · 证书补强' },
  { key: 'y4', label: '大四', text: '就业升学 · 职业启航' },
]
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard title="就业成长 · 四年路径">
      <div class="stu-employ">
        <div class="stu-employ__readiness">
          <div>
            <span>就业准备度</span>
            <strong>{{ employment.jobReadiness }}%</strong>
          </div>
          <div>
            <span>证书准备度</span>
            <strong>{{ employment.certificateReadiness }}%</strong>
          </div>
        </div>

        <div class="stu-employ__path">
          <div v-for="step in yearSteps" :key="step.key" class="stu-employ__step">
            <span class="stu-employ__node">{{ step.label }}</span>
            <p>{{ step.text }}</p>
            <i v-if="step.key !== 'y4'" aria-hidden="true">→</i>
          </div>
        </div>

        <div class="stu-employ__dirs">
          <span v-for="d in employment.careerDirections" :key="d">{{ d }}</span>
        </div>

        <p class="stu-employ__note">{{ employment.developmentPath.long }}</p>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-employ {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stu-employ__readiness {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  div {
    text-align: center;
    padding: 8px;
    border-radius: 8px;
    background: rgba(255, 200, 80, 0.1);
    border: 1px solid rgba(255, 200, 80, 0.22);

    span { display: block; font-size: var(--fs-meta); color: #9ecae8; }
    strong { font-family: var(--student-font-number); font-size: var(--fs-highlight); color: #ffd166; }
  }
}

.stu-employ__path {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.stu-employ__step {
  position: relative;
  padding: 6px 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);
  text-align: center;

  p {
    margin: 4px 0 0;
    font-size: var(--fs-micro);
    color: #c8e0f0;
    line-height: 1.35;
  }

  i {
    position: absolute;
    right: -10px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(0, 229, 255, 0.45);
    font-style: normal;
    font-size: 12px;
  }
}

.stu-employ__node {
  font-size: var(--fs-label);
  font-weight: 800;
  color: #7ff6ff;
}

.stu-employ__dirs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    padding: 3px 10px;
    border-radius: 4px;
    font-size: var(--fs-meta);
    color: #ffd166;
    background: rgba(255, 200, 80, 0.12);
    border: 1px solid rgba(255, 200, 80, 0.22);
  }
}

.stu-employ__note {
  margin: 0;
  font-size: var(--fs-meta);
  color: #9ecae8;
  line-height: 1.4;
}
</style>
