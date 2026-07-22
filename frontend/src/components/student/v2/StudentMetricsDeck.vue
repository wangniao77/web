<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type {
  AcademicDevVM,
  CompetitionVM,
  InternshipVM,
  EmploymentVM,
  FailedCourseVM,
  HighlightItemVM,
} from '@/types/student/view'

defineProps<{
  academic: AcademicDevVM
  competition: CompetitionVM
  internship: InternshipVM
  employment: EmploymentVM
  failedCritical: FailedCourseVM[]
  highlights: HighlightItemVM[]
}>()
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard :index="4" title="能力画像 · 智创劳就">
      <div class="stu-deck">
        <article class="stu-deck__card stu-deck__card--academic">
          <header>
            <span class="stu-deck__icon">智</span>
            <h4>学业发展</h4>
          </header>
          <div class="stu-deck__kpis">
            <div><span>GPA</span><strong>{{ academic.gpa }}</strong></div>
            <div><span>优良课</span><strong>{{ academic.excellentCourses }}/{{ academic.totalCourses }}</strong></div>
            <div><span>完成率</span><strong>{{ academic.courseCompletionRate }}%</strong></div>
          </div>
          <ul v-if="failedCritical.length" class="stu-deck__warn">
            <li v-for="c in failedCritical" :key="c.name">
              {{ c.name }} <em>{{ c.score }}分 · 影响毕业</em>
            </li>
          </ul>
          <ul v-else class="stu-deck__list">
            <li v-for="c in academic.courseGrades.slice(0, 3)" :key="c.name">
              {{ c.name }} <strong>{{ c.score }}</strong>
            </li>
          </ul>
        </article>

        <article class="stu-deck__card stu-deck__card--comp">
          <header>
            <span class="stu-deck__icon">创</span>
            <h4>竞赛科研</h4>
          </header>
          <div class="stu-deck__kpis">
            <div><span>获奖</span><strong>{{ competition.awardCount }}</strong></div>
            <div><span>科研</span><strong>{{ competition.researchCount }}</strong></div>
            <div><span>创新</span><strong>{{ competition.innovationCount }}</strong></div>
          </div>
          <ul class="stu-deck__list">
            <li v-for="h in highlights.slice(0, 3)" :key="h.id">{{ h.label }}</li>
          </ul>
        </article>

        <article class="stu-deck__card stu-deck__card--practice">
          <header>
            <span class="stu-deck__icon">劳</span>
            <h4>实习实践</h4>
          </header>
          <div class="stu-deck__kpis">
            <div><span>实习</span><strong>{{ internship.internshipCount }}</strong></div>
            <div><span>项目</span><strong>{{ internship.projectCount }}</strong></div>
            <div><span>证书</span><strong>{{ internship.certificateCount }}</strong></div>
          </div>
          <ul class="stu-deck__list">
            <li v-for="item in internship.items.slice(0, 3)" :key="item.name">
              {{ item.name }} <em>{{ item.type }}</em>
            </li>
          </ul>
        </article>

        <article class="stu-deck__card stu-deck__card--career">
          <header>
            <span class="stu-deck__icon">就</span>
            <h4>就业升学</h4>
          </header>
          <div class="stu-deck__kpis stu-deck__kpis--two">
            <div><span>就业准备</span><strong>{{ employment.jobReadiness }}%</strong></div>
            <div><span>证书准备</span><strong>{{ employment.certificateReadiness }}%</strong></div>
          </div>
          <div class="stu-deck__chips">
            <span v-for="d in employment.careerDirections" :key="d">{{ d }}</span>
          </div>
          <p class="stu-deck__note">{{ employment.developmentPath.medium }}</p>
        </article>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-deck {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.stu-deck__card {
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(10, 32, 72, 0.55), rgba(4, 14, 38, 0.62)),
    rgba(4, 14, 38, 0.45);
  border: 1px solid rgba(102, 217, 255, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);

  header {
    display: flex;
    align-items: center;
    gap: 8px;

    h4 {
      margin: 0;
      font-size: var(--fs-label);
      font-weight: 800;
      color: #eef5ff;
    }
  }

  &--academic { border-top: 2px solid #39e6ff; }
  &--comp { border-top: 2px solid #a78bfa; }
  &--practice { border-top: 2px solid #34d399; }
  &--career { border-top: 2px solid #ffd166; }
}

.stu-deck__icon {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  font-size: var(--fs-label);
  font-weight: 900;
  color: #fff;
  background: rgba(0, 120, 200, 0.35);
  box-shadow: 0 0 10px rgba(0, 184, 255, 0.2);
}

.stu-deck__kpis {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;

  &--two { grid-template-columns: repeat(2, 1fr); }

  div {
    text-align: center;
    padding: 5px 4px;
    border-radius: 6px;
    background: rgba(0, 40, 90, 0.38);
    border: 1px solid rgba(0, 180, 255, 0.08);

    span {
      display: block;
      font-size: var(--fs-meta);
      color: rgba(190, 210, 238, 0.75);
      margin-bottom: 2px;
    }

    strong {
      font-family: var(--student-font-number);
      font-size: var(--fs-body);
      color: #7ff6ff;
      font-weight: 700;
    }
  }
}

.stu-deck__warn li {
  font-size: var(--fs-meta);
  color: #ffb07a;
  padding: 2px 0;

  em { font-style: normal; color: #ff8a8a; }
}

.stu-deck__list {
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
  min-height: 0;

  li {
    font-size: var(--fs-meta);
    color: #c8e0f0;
    padding: 3px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    strong { color: #7ff6ff; margin-left: 4px; }
    em { font-style: normal; color: #8ec8e8; margin-left: 4px; }
  }
}

.stu-deck__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;

  span {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: var(--fs-meta);
    color: #ffd166;
    background: rgba(255, 200, 80, 0.12);
    border: 1px solid rgba(255, 200, 80, 0.22);
  }
}

.stu-deck__note {
  margin: 0;
  font-size: var(--fs-meta);
  color: #9ecae8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
