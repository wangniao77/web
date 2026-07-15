<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type { CompetitionVM, InternshipVM } from '@/types/student/view'

defineProps<{
  competition: CompetitionVM
  internship: InternshipVM
}>()
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard title="实践创新 · 竞赛科研">
      <div class="stu-innov">
        <div class="stu-innov__kpis">
          <div><span>竞赛获奖</span><strong>{{ competition.awardCount }}</strong></div>
          <div><span>科研项目</span><strong>{{ competition.researchCount }}</strong></div>
          <div><span>创新项目</span><strong>{{ competition.innovationCount }}</strong></div>
          <div><span>实习</span><strong>{{ internship.internshipCount }}</strong></div>
          <div><span>项目</span><strong>{{ internship.projectCount }}</strong></div>
          <div><span>证书</span><strong>{{ internship.certificateCount }}</strong></div>
        </div>

        <div class="stu-innov__lists">
          <section>
            <h4>竞赛 / 科研亮点</h4>
            <ul>
              <li v-for="(item, i) in competition.highlights" :key="i">
                <span>{{ item.label }}</span>
                <em>{{ item.detail }}</em>
              </li>
            </ul>
          </section>
          <section>
            <h4>项目 / 证书经历</h4>
            <ul>
              <li v-for="(item, i) in internship.items" :key="i">
                <span class="stu-innov__tag">{{ item.type }}</span>
                <span>{{ item.name }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-innov {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stu-innov__kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;

  div {
    text-align: center;
    padding: 5px 2px;
    border-radius: 6px;
    background: rgba(0, 50, 100, 0.22);
    border: 1px solid rgba(0, 180, 255, 0.1);

    span { display: block; font-size: var(--fs-micro); color: #8ec8e8; }
    strong { font-family: var(--student-font-number); font-size: var(--fs-label); color: #7ff6ff; }
  }
}

.stu-innov__lists {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  h4 {
    margin: 0 0 4px;
    font-size: var(--fs-meta);
    font-weight: 800;
    color: #b8ecff;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--fs-meta);
    color: #d0e8ff;
    padding: 4px 6px;
    border-radius: 4px;
    background: rgba(0, 45, 95, 0.18);

    em { margin-left: auto; font-style: normal; color: #7a9eb8; font-size: var(--fs-micro); }
  }
}

.stu-innov__tag {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: var(--fs-micro);
  color: #a78bfa;
  background: rgba(139, 92, 246, 0.15);
}
</style>
