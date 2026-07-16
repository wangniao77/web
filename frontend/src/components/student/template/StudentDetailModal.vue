<script setup lang="ts">
import { computed } from 'vue'
import type { StudentDashboardVM } from '@/types/student/view'

const props = defineProps<{
  open: boolean
  section: string | null
  dashboard: StudentDashboardVM
}>()

const emit = defineEmits<{ close: [] }>()

const titleMap: Record<string, string> = {
  timetable: '本学期课表',
  academic: '学情轨迹护航详情',
  quality: '综合素养荣誉与纪律台账',
  career: '出口发展详情（实习·就业·升学）',
  graduation: '毕业审核与论文',
  mental: '心理与成长详情',
  warning: '预警与记录',
  credit: '发展与学分建议',
  ai: '智能育航',
}

const title = computed(() => (props.section ? titleMap[props.section] ?? '详情' : '详情'))

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="stu-detail-modal" @click="onBackdrop">
      <div class="stu-detail-modal__panel" role="dialog" aria-modal="true">
        <header>
          <h2>{{ title }}</h2>
          <button type="button" aria-label="关闭" @click="emit('close')">×</button>
        </header>
        <div class="stu-detail-modal__body">
          <template v-if="section === 'timetable'">
            <p>本学期共 {{ dashboard.academic.currentCourses.length }} 门在修课程</p>
            <ul>
              <li v-for="course in dashboard.academic.currentCourses" :key="course.name">
                {{ course.name }} · {{ course.credit }} 学分 · {{ course.type }}
              </li>
            </ul>
          </template>
          <template v-else-if="section === 'academic'">
            <p>GPA：<strong>{{ dashboard.academic.gpa }}</strong> · 班排 {{ dashboard.academic.classRank }}/{{ dashboard.academic.classTotal }} · 专业 {{ dashboard.academic.majorRank }}/{{ dashboard.academic.majorTotal }}</p>
            <p>学分完成：{{ dashboard.creditProgress.earned }}/{{ dashboard.creditProgress.required }}（{{ dashboard.creditProgress.earnedPercent }}%）</p>
            <p>等级考试：四级 {{ dashboard.profile.cet4Score ?? '—' }} · 六级 {{ dashboard.profile.cet6Score ?? '—' }}</p>
            <p>毕设进度：{{ dashboard.profile.thesisStatus || '未开始' }} · 导师 {{ dashboard.profile.thesisAdvisor || dashboard.profile.mentor || '—' }}</p>
            <h3>挂科课程</h3>
            <ul>
              <li v-for="course in dashboard.failedCritical" :key="course.name">{{ course.name }} · {{ course.score }} 分</li>
              <li v-if="!dashboard.failedCritical.length">暂无挂科课程</li>
            </ul>
            <h3>学业帮扶记录</h3>
            <ul>
              <li v-for="(r, i) in (dashboard.academic.supportRecords || [])" :key="i">{{ r.date }} · {{ r.person }}：{{ r.content }}</li>
              <li v-if="!(dashboard.academic.supportRecords?.length)">暂无谈心谈话 / 干预台账</li>
            </ul>
            <h3>历年成绩与排名趋势</h3>
            <ul>
              <li v-for="(term, index) in dashboard.academic.semesters" :key="term">
                {{ term }} · GPA {{ dashboard.academic.gpaValues[index] }} · 班级排名 {{ dashboard.academic.classRankValues[index] ?? '—' }} · 专业排名 {{ dashboard.academic.majorRankValues[index] ?? '—' }}
              </li>
            </ul>
            <h3>课程成绩</h3>
            <ul>
              <li v-for="c in dashboard.academic.courseGrades.slice(0, 8)" :key="c.name">
                {{ c.name }} — {{ c.score }} 分
              </li>
            </ul>
          </template>
          <template v-else-if="section === 'quality'">
            <p>综合测评排名：<strong>{{ dashboard.growthOverview.overallRank }}/{{ dashboard.growthOverview.overallTotal }}</strong></p>
            <p>行为记录台账：志愿服务 {{ dashboard.quality.volunteerHours }} 小时 · 社会实践 {{ dashboard.quality.socialPractices }} 次</p>
            <h3>荣誉成果全景</h3>
            <ul>
              <li v-for="item in dashboard.scholarships" :key="`${item.year}-${item.name}`">{{ item.year }} · {{ item.name }}</li>
              <li v-for="award in dashboard.profile.awards" :key="`${award.name}-${award.date}`">{{ award.name }} · {{ award.level }}</li>
            </ul>
            <h3>创新实践与表彰</h3>
            <ul>
              <li v-for="skill in dashboard.quality.softSkills" :key="skill.name">{{ skill.name }}：{{ skill.score }} 分</li>
              <li v-if="!dashboard.quality.softSkills.length">暂无软技能评分记录</li>
            </ul>
            <h3>纪律惩戒记录</h3>
            <ul>
              <li
                v-for="row in dashboard.quality.disciplineRecords"
                :key="row.id"
              >
                {{ row.date }} · <strong>{{ row.type }}</strong> · {{ row.reason }}
                <span v-if="row.status">（{{ row.status }}）</span>
              </li>
              <li v-if="!dashboard.quality.disciplineRecords.length">暂无受处分 / 违纪处罚记录</li>
            </ul>
            <h3>专业证书</h3>
            <ul>
              <li v-for="item in dashboard.internship.items.filter((entry) => entry.type === '证书')" :key="item.name">{{ item.name }}</li>
            </ul>
          </template>
          <template v-else-if="section === 'career'">
            <p>就业去向类型：<strong>{{ dashboard.careerDev.employmentDestination || dashboard.careerDev.employmentIntention || '待实习' }}</strong></p>
            <p>求职意向城市：{{ dashboard.careerDev.targetCity || '未填报' }}</p>
            <p>期望薪资：{{ dashboard.careerDev.expectedSalary || '未填报' }}</p>
            <p>简历完成状态：{{ dashboard.careerDev.resumeStatus || '未完善' }}</p>
            <p>实习单位：{{ dashboard.careerDev.internshipBases.join('、') || '暂无' }}</p>
            <h3>推荐岗位明细</h3>
            <ul>
              <li v-for="job in dashboard.aiPortrait.jobMatches" :key="job.role">
                {{ job.role }} · 匹配度 {{ job.match }}%
                <span v-if="job.city"> · 城市 {{ job.city }}</span>
                <span v-if="job.salary"> · 薪资 {{ job.salary }}</span>
                <span v-if="job.requirements"> · 要求 {{ job.requirements }}</span>
              </li>
            </ul>
            <h3>项目经历清单</h3>
            <ul>
              <li
                v-for="(proj, idx) in (dashboard.careerDev.projectExperiences?.length
                  ? dashboard.careerDev.projectExperiences
                  : dashboard.internship.items.filter((e) => e.type === '项目').map((e) => e.name))"
                :key="`${idx}-${proj}`"
              >{{ proj }}</li>
              <li v-if="!(dashboard.careerDev.projectExperiences?.length || dashboard.internship.items.some((e) => e.type === '项目'))">暂无项目经历</li>
            </ul>
            <h3>技能与经历</h3>
            <ul>
              <li v-for="item in dashboard.internship.items" :key="`${item.type}-${item.name}`">[{{ item.type }}] {{ item.name }}</li>
            </ul>
          </template>
          <template v-else-if="section === 'graduation'">
            <p>学分完成：{{ dashboard.creditProgress.earned }}/{{ dashboard.creditProgress.required }}（{{ dashboard.creditProgress.earnedPercent }}%）</p>
            <p>毕业论文：{{ dashboard.profile.thesisStatus || '未开始' }} · 指导教师 {{ dashboard.profile.thesisAdvisor || dashboard.profile.mentor }}</p>
            <p>挂科课程：{{ dashboard.failedCritical.length }} 门</p>
            <p class="detail-note">考研/就业/考公等出口去向与岗位匹配见「出口发展」模块；本页只跟进能否顺利毕业（学分、挂科、论文）。</p>
            <h3>分阶段行动建议</h3>
            <ul>
              <li>{{ dashboard.employment.developmentPath.short }}</li>
              <li>{{ dashboard.employment.developmentPath.medium }}</li>
              <li>{{ dashboard.employment.developmentPath.long }}</li>
            </ul>
          </template>
          <template v-else-if="section === 'mental'">
            <p>心理分级：{{ dashboard.profile.mentalLevel }}</p>
            <p>帮扶状态：{{ dashboard.mentalGrowth.supportStatus }}</p>
            <ul>
              <li v-for="(r, i) in dashboard.mentalGrowth.records" :key="i">
                {{ r.date }} · {{ r.person }}：{{ r.content }}
              </li>
            </ul>
          </template>
          <template v-else-if="section === 'warning'">
            <ul>
              <li v-for="a in dashboard.attention" :key="a.id">
                [{{ a.category }}] {{ a.label }}
              </li>
            </ul>
          </template>
          <template v-else-if="section === 'ai'">
            <p class="detail-note">{{ dashboard.aiPortrait.summary }}</p>
            <div class="detail-grid">
              <p><span>推荐方向</span><strong>{{ dashboard.aiAssistant.recommendedDirection }}</strong></p>
              <p><span>方向匹配度</span><strong>{{ dashboard.aiPortrait.jobMatches[0]?.match ?? dashboard.employment.jobReadiness }}%</strong></p>
              <p><span>画像标签</span><strong>{{ dashboard.aiPortrait.portraitTags.join('、') || '—' }}</strong></p>
            </div>

            <h3>匹配依据</h3>
            <ul>
              <li v-for="item in dashboard.aiAssistant.matchBasis" :key="item">{{ item }}</li>
            </ul>

            <h3>阶段成长路线</h3>
            <ul>
              <li><strong>本学期 · 补齐关键短板：</strong>{{ dashboard.employment.developmentPath.short }}</li>
              <li><strong>未来一年 · 强化项目实践：</strong>{{ dashboard.employment.developmentPath.medium }}</li>
              <li><strong>毕业前 · 完成方向定型：</strong>{{ dashboard.employment.developmentPath.long }}</li>
            </ul>

            <h3>短期建议</h3>
            <ul>
              <li v-for="item in dashboard.aiAssistant.shortTermSuggestions" :key="item">{{ item }}</li>
            </ul>

            <h3>长期建议</h3>
            <ul>
              <li v-for="item in dashboard.aiAssistant.longTermSuggestions" :key="item">{{ item }}</li>
            </ul>

            <h3>智能推送</h3>
            <ul>
              <li v-for="push in dashboard.aiPortrait.pushes" :key="push.time + push.text">
                <strong>{{ push.time }}</strong> · {{ push.text }}
              </li>
            </ul>
          </template>
          <template v-else-if="section === 'credit'">
            <p>{{ dashboard.aiPortrait.summary }}</p>
            <ul>
              <li v-for="(s, i) in dashboard.aiAssistant.longTermSuggestions" :key="i">{{ s }}</li>
            </ul>
          </template>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.stu-detail-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 8, 22, 0.72);
  backdrop-filter: blur(4px);
}

.stu-detail-modal__panel {
  width: min(720px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid rgba(0, 200, 255, 0.35);
  background: linear-gradient(165deg, rgba(8, 38, 78, 0.98), rgba(4, 18, 42, 0.98));
  box-shadow: 0 0 40px rgba(0, 140, 255, 0.25);
}

.stu-detail-modal__panel header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(0, 200, 255, 0.15);

  h2 {
    margin: 0;
    font-size: var(--fs-title);
    color: #e8f6ff;
  }

  button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: rgba(0, 80, 150, 0.35);
    color: #7ff6ff;
    font-size: 22px;
    cursor: pointer;
  }
}

.stu-detail-modal__body {
  padding: 16px 18px 20px;
  overflow-y: auto;
  font-size: var(--fs-meta);
  color: #d8eeff;
  line-height: 1.5;

  strong { color: #7ff6ff; }

  ul {
    margin: 12px 0 0;
    padding-left: 18px;
  }

  li { margin-bottom: 6px; }

  h3 {
    margin: 16px 0 6px;
    color: #8edcff;
    font-size: 15px;
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;

  p {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0;
    padding: 8px 10px;
    border: 1px solid rgba(0, 180, 255, 0.12);
    border-radius: 5px;
    background: rgba(0, 45, 84, 0.28);
  }

  span { color: #78a9ca; }
  strong { text-align: right; }
}

.detail-note {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 5px;
  background: rgba(0, 45, 84, 0.24);
}
</style>
