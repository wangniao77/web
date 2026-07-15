<script setup lang="ts">
import CollegePanelCard from '@/components/college/CollegePanelCard.vue'
import StudentPanelBorder from '@/components/student/StudentPanelBorder.vue'
import type {
  CareerDevVM,
  EmploymentVM,
  InternshipVM,
  AiPortraitVM,
} from '@/types/student/view'

defineProps<{
  careerDev: CareerDevVM
  internship: InternshipVM
  employment: EmploymentVM
  aiPortrait: AiPortraitVM
}>()
</script>

<template>
  <StudentPanelBorder>
    <CollegePanelCard :index="4" title="实习、就业与发展方向">
      <div class="stu-mod-career">
        <div class="stu-mod-career__bases">
          <div>
            <h4>实践教学基地</h4>
            <ul>
              <li v-for="b in careerDev.practiceBases" :key="b">{{ b }}</li>
            </ul>
          </div>
          <div>
            <h4>实习基地 / 意向</h4>
            <ul>
              <li v-for="b in careerDev.internshipBases" :key="b">{{ b }}</li>
            </ul>
          </div>
        </div>

        <div class="stu-mod-career__intent">
          <div class="stu-mod-career__tag">
            <label>就业去向类型</label>
            <strong>{{ careerDev.employmentDestination || careerDev.employmentIntention || '待实习' }}</strong>
          </div>
          <div class="stu-mod-career__tag">
            <label>意向城市</label>
            <strong>{{ careerDev.targetCity || '未填报' }}</strong>
          </div>
          <div class="stu-mod-career__tag">
            <label>期望薪资</label>
            <strong>{{ careerDev.expectedSalary || '未填报' }}</strong>
          </div>
          <div class="stu-mod-career__tag">
            <label>简历状态</label>
            <strong>{{ careerDev.resumeStatus || '未完善' }}</strong>
          </div>
        </div>

        <div class="stu-mod-career__practice">
          <h4>实习 / 项目 / 证书</h4>
          <ul>
            <li v-for="item in internship.items" :key="item.name">
              <span>{{ item.name }}</span>
              <em>{{ item.type }}</em>
            </li>
          </ul>
        </div>

        <div class="stu-mod-career__jobs">
          <h4>技能岗位推荐 <small>（基于课程与能力画像）</small></h4>
          <div class="stu-mod-career__matches">
            <div v-for="job in aiPortrait.jobMatches" :key="job.role" class="match">
              <span>{{ job.role }}</span>
              <div class="bar"><i :style="{ width: `${job.match}%` }" /></div>
              <strong>{{ job.match }}%</strong>
              <small v-if="job.city || job.salary || job.requirements">
                <em v-if="job.city">{{ job.city }}</em>
                <em v-if="job.salary">{{ job.salary }}</em>
                <em v-if="job.requirements">{{ job.requirements }}</em>
              </small>
            </div>
          </div>
        </div>
      </div>
    </CollegePanelCard>
  </StudentPanelBorder>
</template>

<style scoped lang="scss">
.stu-mod-career {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto 1fr;
  gap: 8px;
}

.stu-mod-career__bases {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  div {
    padding: 8px;
    border-radius: 6px;
    background: rgba(0, 55, 110, 0.22);
    border: 1px solid rgba(0, 200, 255, 0.12);
  }

  h4 {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    font-size: var(--fs-meta);
    color: #d8eeff;
    padding: 3px 0;
  }
}

.stu-mod-career__intent {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.stu-mod-career__tag {
  padding: 8px;
  border-radius: 6px;
  background: rgba(255, 200, 80, 0.08);
  border: 1px solid rgba(255, 200, 80, 0.2);

  label {
    display: block;
    font-size: var(--fs-micro);
    color: #9ecae8;
    margin-bottom: 2px;
  }

  strong {
    font-size: var(--fs-label);
    color: #ffd166;
    font-weight: 700;
  }
}

.stu-mod-career__practice {
  min-height: 0;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: rgba(0, 55, 110, 0.22);
  border: 1px solid rgba(0, 200, 255, 0.12);

  h4 {
    margin: 0 0 6px;
    font-size: var(--fs-meta);
    color: #b8ecff;
    font-weight: 700;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: var(--fs-meta);
    color: #d8eeff;
    padding: 4px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.06);

    em { font-style: normal; color: #9ecae8; }
  }
}

.stu-mod-career__jobs {
  min-height: 0;
  overflow: auto;
  padding: 8px;
  border-radius: 6px;
  background: rgba(52, 211, 153, 0.06);
  border: 1px solid rgba(52, 211, 153, 0.2);

  h4 {
    margin: 0 0 8px;
    font-size: var(--fs-meta);
    color: #6ee7b7;
    font-weight: 700;

    small { font-weight: 400; color: #9ecae8; }
  }
}

.stu-mod-career__matches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match {
  display: grid;
  grid-template-columns: 1fr 1.2fr auto;
  gap: 4px 8px;
  align-items: center;
  font-size: var(--fs-meta);

  span { color: #d8eeff; }

  .bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.5);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #34d399, #6ee7b7);
    }
  }

  strong {
    color: #6ee7b7;
    font-family: var(--student-font-number);
    min-width: 36px;
    text-align: right;
  }

  small {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px 10px;
    color: #9ecae8;
    font-size: 12px;

    em { font-style: normal; }
  }
}
</style>
