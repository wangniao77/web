<script setup lang="ts">
import { ref } from 'vue'
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

const selectedJobIdx = ref(0)
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
          <h4>技能岗位推荐 <small>（基于课程与能力画像）</small><small class="mock-badge">模拟数据</small></h4>
          <div v-if="aiPortrait.jobMatches.length" class="job-split">
            <div class="job-split__list">
              <div
                v-for="(job, idx) in aiPortrait.jobMatches.slice(0, 8)"
                :key="job.role"
                class="job-split__item"
                :class="{ 'is-active': selectedJobIdx === idx }"
                @click="selectedJobIdx = idx"
              >
                <span>{{ job.role }}</span>
                <strong>{{ job.match }}%</strong>
              </div>
            </div>
            <div class="job-split__detail">
              <div class="job-split__detail-role">{{ aiPortrait.jobMatches[selectedJobIdx].role }}</div>
              <div class="job-split__kv">
                <div><label>匹配度</label><strong>{{ aiPortrait.jobMatches[selectedJobIdx].match }}%</strong></div>
                <div><label>城市</label><span>{{ aiPortrait.jobMatches[selectedJobIdx].city }}</span></div>
                <div><label>薪资</label><span>{{ aiPortrait.jobMatches[selectedJobIdx].salary }}</span></div>
              </div>
              <div class="job-split__bar-wrap">
                <div class="job-split__bar"><i :style="{ width: `${aiPortrait.jobMatches[selectedJobIdx].match}%` }" /></div>
              </div>
              <div class="job-split__info">
                <label>岗位要求</label>
                <p>{{ aiPortrait.jobMatches[selectedJobIdx].requirements }}</p>
              </div>
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

.job-split {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 8px;
  min-height: 160px;

  &__list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.25);
    border: 1px solid rgba(52, 211, 153, 0.08);
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;

    &:hover { background: rgba(0, 50, 100, 0.4); }
    &.is-active {
      border-color: rgba(52, 211, 153, 0.4);
      background: rgba(0, 60, 100, 0.4);
    }

    span {
      font-size: var(--fs-meta);
      color: #d8eeff;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      font-size: var(--fs-meta);
      color: #6ee7b7;
      font-family: var(--student-font-number);
      white-space: nowrap;
    }
  }

  &__detail {
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.25);
    border: 1px solid rgba(52, 211, 153, 0.12);
    display: flex;
    flex-direction: column;
    gap: 6px;

    &-role {
      font-size: var(--fs-label);
      font-weight: 800;
      color: #eef9ff;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(52, 211, 153, 0.12);
    }
  }

  &__kv {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;

    div {
      padding: 4px 6px;
      border-radius: 3px;
      background: rgba(0, 56, 100, 0.3);

      label {
        display: block;
        font-size: 10px;
        color: #7eb4d8;
        font-weight: 600;
      }

      strong {
        font-size: 14px;
        font-weight: 900;
        color: #6ee7b7;
        font-family: var(--student-font-number);
      }

      span {
        font-size: 12px;
        font-weight: 700;
        color: #d0e8f8;
      }
    }
  }

  &__bar-wrap {
    padding: 2px 0;
  }

  &__bar {
    height: 4px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.4);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, #34d399, #6ee7b7);
    }
  }

  &__info {
    label {
      display: block;
      font-size: 11px;
      font-weight: 700;
      color: #7eb4d8;
      margin-bottom: 2px;
    }

    p {
      margin: 0;
      font-size: 11px;
      color: #c8dff0;
      line-height: 1.4;
    }
  }
}
</style>
