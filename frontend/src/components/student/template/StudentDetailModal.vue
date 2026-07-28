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
  basic: '学生基础信息台账',
  timetable: '本学期课表',
  academic: '学情轨迹护航详情',
  quality: '综合素养台账（荣誉成果 · 纪律处分）',
  career: '出口发展详情（实习·就业·升学）',
  graduation: '毕业审核与毕设进度',
  mental: '心理与成长详情',
  warning: '预警与记录',
  credit: '发展与学分建议',
  ai: '智能育航',
}

const title = computed(() => (props.section ? titleMap[props.section] ?? '详情' : '详情'))

function onBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

const honorAiAdvice = computed(() => {
  const d = props.dashboard
  const honorCount = (d.scholarships?.length ?? 0) + (d.profile.awards?.length ?? 0)
  const overallRank = d.growthOverview.overallRank
  const overallTotal = d.growthOverview.overallTotal || 0
  const topPercent = overallTotal ? Math.max(1, Math.round((overallRank / overallTotal) * 100)) : null

  const softSkills = d.quality.softSkills ?? []
  const lowestSoft = softSkills.length
    ? [...softSkills].sort((a, b) => Number(a.score ?? 0) - Number(b.score ?? 0))[0]
    : null

  const strengths = honorCount > 0
    ? `综合测评位次：第 ${overallRank}/${overallTotal}${topPercent ? `（前 ${topPercent}%）` : ''}；已积累 ${honorCount} 项荣誉/奖学金类成果。` +
      `竞赛获奖 ${d.competition.awardCount} 项、科研 ${d.competition.researchCount} 项、创新 ${d.competition.innovationCount} 项，具备较强的成果产出与展示能力。`
    : `当前荣誉成果登记较少，建议将学业稳定性作为底座，同时补齐“可量化成果 + 可佐证过程记录”的组合。`

  const weaknessesParts: string[] = []
  if ((d.scholarships?.length ?? 0) === 0) weaknessesParts.push('奖学金/激励类成果偏少')
  if ((d.profile.awards?.length ?? 0) === 0) weaknessesParts.push('荣誉称号/奖项记录相对缺乏')
  if (lowestSoft && Number(lowestSoft.score) <= 75) weaknessesParts.push(`创新实践的软技能短板：${lowestSoft.name}`)
  if (!softSkills.length) weaknessesParts.push('软技能评分记录缺失，难以体现能力成长曲线')

  const weaknesses = weaknessesParts.length
    ? `存在短板：${weaknessesParts.join('；')}。建议围绕短板维度建立“目标—过程—产出—归档”闭环。`
    : '荣誉结构相对均衡。后续建议继续向更高等级赛事/科研平台升级，并强化成果持续性与可迁移经验沉淀。'

  const future = weaknessesParts.length
    ? `未来发展建议：优先补齐“${weaknessesParts[0]}”，每学期至少新增 1–2 项可佐证成果（竞赛/科研/志愿等），并同步沉淀过程材料（申报书、证书、阶段报告、反思复盘）。同时把现有优势与下一阶段方向绑定，提升综测与升学就业竞争力。`
    : `未来发展建议：在保持优势的同时，推动“核心成果（1项）+过程记录（1–2项）”的组合打法，持续提升成果等级与连续性。建议建立成果台账，确保每学期都有可追踪的进度与证据链。`

  return { strengths, weaknesses, future }
})

const disciplineAiAdvice = computed(() => {
  const d = props.dashboard
  const records = d.quality.disciplineRecords ?? []
  const activeRecords = records.filter((r) => (r.status ?? '') !== '已解除')
  const activeCount = activeRecords.length
  const latest = records[0] ?? null

  const disciplineLevel = activeCount >= 2 ? 'high' : activeCount === 1 ? 'medium' : 'low'

  const strengths = (() => {
    if (!records.length) {
      return '暂无校纪处分、通报批评及诚信失信记录，纪律表现稳定。建议继续保持过程性自我约束，巩固良好合规习惯。'
    }
    if (disciplineLevel === 'low' && activeCount === 0) {
      return '已存在历史纪律记录，但均已解除。说明整改态度与执行较好，具备恢复信誉的基础；建议继续按要求留存佐证，避免再次触发同类风险。'
    }
    if (disciplineLevel === 'medium') {
      return '当前在册问题以警示/单次违纪为主，尚有较充分的纠正窗口期。若持续完成整改并形成正向行为修复，仍可逐步稳定纪律评价。'
    }
    return '纪律台账显示存在多项叠加风险。建议尽快完善整改闭环，并与辅导员/学院形成跟进机制，确保风险可控。'
  })()

  const weaknesses = (() => {
    if (disciplineLevel === 'high') {
      const types = activeRecords.map((r) => r.type).filter(Boolean).slice(0, 3)
      const typeText = types.length ? `涉及类型：${types.join('、')}` : '涉及类型需进一步核实'
      return `存在短板：当前在册纪律相关记录 ${activeCount} 条，可能对评奖评优与部分审核环节产生持续影响。${typeText}；同时需要重点修正“导致问题反复发生”的薄弱环节。`
    }
    if (disciplineLevel === 'medium') {
      return `存在短板：在册纪律相关记录 ${activeCount} 条，说明仍需提高对课堂纪律、考试诚信与日常行为规范的稳定性。建议把最新问题“${latest?.type ?? '相关类型'}”作为重点改进对象。`
    }
    return latest
      ? `存在短板：虽然当前无在册处分，但历史记录仍提示需保持警惕。建议对照最新“${latest.type}”的整改要求进行自查，避免小问题累积成预警。`
      : '存在短板：暂无明确问题，但建议保持过程性自我检查，避免隐性风险在后续学期累积。'
  })()

  const future = (() => {
    if (disciplineLevel === 'high') {
      return '未来发展建议：与辅导员建立月度跟进机制；（1）完成全部整改要求并留存佐证，（2）重点规范考试诚信与出勤纪律，（3）用志愿服务/课堂表现等正向行为逐步修复评价。'
    }
    if (disciplineLevel === 'medium') {
      return '未来发展建议：制定 3 个月纪律改善计划；每周自查考勤与宿舍作息、考试周前完成诚信承诺与复习打卡；主动参与学院组织的帮扶活动，避免同类问题二次发生。'
    }
    return '未来发展建议：持续保持良好作息与守纪意识，建议每学期做一次纪律复盘，把“风险点—改进动作—佐证材料”固化成可追踪台账。'
  })()

  return { strengths, weaknesses, future }
})
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
          <template v-if="section === 'basic'">
            <div class="detail-grid">
              <p><span>姓名</span><strong>{{ dashboard.profile.name }}</strong></p>
              <p><span>性别</span><strong>{{ dashboard.profile.gender || '男' }}</strong></p>
              <p><span>学号</span><strong>{{ dashboard.profile.studentId }}</strong></p>
              <p><span>班级</span><strong>{{ dashboard.profile.className }}</strong></p>
              <p><span>学籍状态</span><strong>{{ dashboard.profile.onCampusStatus }}</strong></p>
              <p><span>高潜标签</span><strong>{{ dashboard.profile.highPotentialTags?.join('、') || '无' }}</strong></p>
              <p><span>政治面貌</span><strong>{{ dashboard.profile.politicalStatus }}</strong></p>
              <p><span>辅导员</span><strong>{{ dashboard.profile.counselor }}</strong></p>
              <p><span>班主任</span><strong>{{ dashboard.profile.mentor }}</strong></p>
              <p><span>毕设导师</span><strong>{{ dashboard.profile.thesisAdvisor || dashboard.profile.mentor || '—' }}</strong></p>
              <p><span>升学对标</span><strong>{{ (dashboard.careerDev.targetUniversities || []).join('、') || '待明确' }}</strong></p>
              <p><span>就业对标</span><strong>{{ (dashboard.careerDev.targetCompanies || []).join('、') || '待明确' }}</strong></p>
              <p><span>联系电话</span><strong>{{ dashboard.profile.phone || '—' }}</strong></p>
              <p><span>家庭住址</span><strong>{{ dashboard.profile.address }}</strong></p>
              <p><span>家长姓名</span><strong>{{ dashboard.profile.guardianName }}</strong></p>
              <p><span>家长联系方式</span><strong>{{ dashboard.profile.guardianPhone }}</strong></p>
              <p><span>家庭成员</span><strong>{{ dashboard.profile.familyMembers?.join('、') || '暂无记录' }}</strong></p>
              <p><span>家庭经济情况</span><strong>{{ dashboard.profile.economicHardship ? '困难认定' : '一般' }}</strong></p>
            </div>
            <p class="detail-note">家庭情况：{{ dashboard.profile.familySituation || '暂无详细记录' }}</p>
            <p class="detail-note">详细困难情况：{{ dashboard.profile.difficultyDetail || '暂无详细记录' }}</p>
          </template>
          <template v-else-if="section === 'timetable'">
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
            <p>
              年级邻域前三：
              {{
                (dashboard.growthOverview.neighborsAhead || [])
                  .map((n) => `${n.name} ${n.gpa.toFixed(2)}`)
                  .join(' · ') || '暂无'
              }}
            </p>
            <p>
              年级邻域后三：
              {{
                (dashboard.growthOverview.neighborsBehind || [])
                  .map((n) => `${n.name} ${n.gpa.toFixed(2)}`)
                  .join(' · ') || '暂无'
              }}
            </p>
            <p>行为记录台账：志愿服务 {{ dashboard.quality.volunteerHours }} 小时 · 社会实践 {{ dashboard.quality.socialPractices }} 次</p>
            <h3>荣誉成果</h3>
            <ul>
              <li v-for="item in dashboard.scholarships" :key="`${item.year}-${item.name}`">{{ item.year }} · {{ item.name }}</li>
              <li v-for="award in dashboard.profile.awards" :key="`${award.name}-${award.date}`">{{ award.name }} · {{ award.level }}</li>
            </ul>
            <section class="detail-ai-advice">
              <header class="detail-ai-advice__head">
                <span class="detail-ai-advice__badge">AI 研判</span>
                <h4 class="detail-ai-advice__title">荣誉成果 · 对策与建议</h4>
              </header>
              <div class="detail-ai-advice__grid">
                <article class="detail-ai-advice__block detail-ai-advice__block--good">
                  <h5>优势亮点</h5>
                  <p>{{ honorAiAdvice.strengths }}</p>
                </article>
                <article class="detail-ai-advice__block detail-ai-advice__block--warn">
                  <h5>存在短板</h5>
                  <p>{{ honorAiAdvice.weaknesses }}</p>
                </article>
                <article class="detail-ai-advice__block detail-ai-advice__block--future">
                  <h5>未来发展</h5>
                  <p>{{ honorAiAdvice.future }}</p>
                </article>
              </div>
            </section>
            <h3>创新实践与表彰</h3>
            <ul>
              <li v-for="skill in dashboard.quality.softSkills" :key="skill.name">{{ skill.name }}：{{ skill.score }} 分</li>
              <li v-if="!dashboard.quality.softSkills.length">暂无软技能评分记录</li>
            </ul>
            <h3>纪律处分</h3>
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
            <section class="detail-ai-advice">
              <header class="detail-ai-advice__head">
                <span class="detail-ai-advice__badge">AI 研判</span>
                <h4 class="detail-ai-advice__title">纪律处分 · 对策与建议</h4>
              </header>
              <div class="detail-ai-advice__grid">
                <article class="detail-ai-advice__block detail-ai-advice__block--good">
                  <h5>优势亮点</h5>
                  <p>{{ disciplineAiAdvice.strengths }}</p>
                </article>
                <article class="detail-ai-advice__block detail-ai-advice__block--warn">
                  <h5>存在短板</h5>
                  <p>{{ disciplineAiAdvice.weaknesses }}</p>
                </article>
                <article class="detail-ai-advice__block detail-ai-advice__block--future">
                  <h5>未来发展</h5>
                  <p>{{ disciplineAiAdvice.future }}</p>
                </article>
              </div>
            </section>
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
            <p>升学高校对标：{{ (dashboard.careerDev.targetUniversities || []).join('、') || '待明确' }}</p>
            <p>就业大厂对标：{{ (dashboard.careerDev.targetCompanies || []).join('、') || '待明确' }}</p>
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
            <p>毕设进度：{{ dashboard.profile.thesisStatus || '未开始' }} · 指导教师 {{ dashboard.profile.thesisAdvisor || dashboard.profile.mentor }}</p>
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

.detail-ai-advice {
  margin: 10px 0 0;
  padding: 12px 12px 10px;
  border-radius: 8px;
  border: 1px solid rgba(0, 206, 255, 0.25);
  background:
    linear-gradient(135deg, rgba(0, 90, 150, 0.18), rgba(6, 17, 52, 0.5)),
    rgba(4, 18, 48, 0.55);
  box-shadow: inset 0 0 24px rgba(0, 184, 255, 0.06);
}

.detail-ai-advice__head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.detail-ai-advice__badge {
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(0, 206, 255, 0.45);
  background: rgba(0, 184, 255, 0.14);
  color: #8ef6ff;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.detail-ai-advice__title {
  margin: 0;
  font-size: 14px;
  color: #e8f4ff;
  font-weight: 900;
  letter-spacing: 0.02em;
}

.detail-ai-advice__grid {
  display: grid;
  gap: 8px;
}

.detail-ai-advice__block {
  border-radius: 6px;
  padding: 10px 10px 9px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 45, 84, 0.24);

  h5 {
    margin: 0 0 6px;
    font-size: 13px;
    color: #b8ecff;
    font-weight: 900;
  }

  p {
    margin: 0;
    color: #d8eeff;
    font-size: 13px;
    line-height: 1.45;
  }
}

.detail-ai-advice__block--good {
  border-color: rgba(55, 233, 145, 0.25);
  background: rgba(18, 88, 78, 0.22);
}

.detail-ai-advice__block--warn {
  border-color: rgba(250, 204, 21, 0.25);
  background: rgba(90, 62, 14, 0.22);
}

.detail-ai-advice__block--future {
  border-color: rgba(30, 214, 255, 0.25);
  background: rgba(0, 70, 120, 0.25);
}
</style>
