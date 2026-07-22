<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

/* ────────────────────────────────────────────────
   1. 成长阶段总览
   ──────────────────────────────────────────────── */
const stageOverview = computed(() => {
  if (!dashboard.value) return null
  const { profile, growthOverview, aiAssistant, creditProgress } = dashboard.value
  // 从 grade 推断当前阶段：如 2023级 -> 大一/大二等，这里直接用 grade 字符串
  return {
    grade: profile.grade,
    name: profile.name,
    major: profile.major,
    goal: aiAssistant.recommendedDirection,
    growthIndex: growthOverview.growthIndex,
    growthLevel: growthOverview.growthLevel,
    creditPercent: creditProgress.earnedPercent,
    overallPercent: growthOverview.overallPercent,
  }
})

/* ────────────────────────────────────────────────
   2. 当前成长状态
   ──────────────────────────────────────────────── */
const growthStatus = computed(() => {
  if (!dashboard.value) return null
  const { highlights, attention, aiPortrait, timeline } = dashboard.value
  // 已完成事项：highlights + timeline 中有 milestone 的项
  const completed = highlights.map((h) => ({ label: h.label, date: h.date }))
  // 正在进行：coachingTasks 中未完成的
  const inProgress = (aiPortrait.coachingTasks || [])
    .filter((t) => t.status !== '已完成')
    .map((t) => ({ label: t.title, detail: t.detail, priority: t.priority }))
  // 待完成：attention 事项 + pushes 中 warn 类型
  const pending = attention.map((a) => ({ label: a.label, category: a.category, level: a.levelLabel }))
    .concat(
      (aiPortrait.pushes || [])
        .filter((p) => p.type === 'warn')
        .map((p) => ({ label: p.text, category: '近期提醒', level: '关注' })),
    )
  return { completed, inProgress, pending }
})

/* ────────────────────────────────────────────────
   3. 能力发展画像
   ──────────────────────────────────────────────── */
const abilityPortrait = computed(() => {
  if (!dashboard.value) return null
  const { growthPortrait, quality, academic, competition, employment } = dashboard.value
  // 将雷达图指标和个人分数映射为能力维度
  const radar = growthPortrait.indicators.map((ind, i) => ({
    name: ind.name,
    score: growthPortrait.personal[i] ?? 0,
    avg: growthPortrait.gradeAvg[i] ?? 0,
    max: ind.max,
  }))
  // 补充软技能作为能力维度
  const soft = quality.softSkills.map((s) => ({ name: s.name, score: s.score, avg: Math.round(s.score * 0.85), max: 100 }))
  // 额外补充几个核心维度（从已有数据计算）
  const extra = [
    {
      name: '学业水平',
      score: Math.round(academic.gpa * 20), // 假设 GPA 5分制 -> 百分制
      avg: 75,
      max: 100,
    },
    {
      name: '创新能力',
      score: Math.min(100, competition.innovationCount * 25 + 50),
      avg: 55,
      max: 100,
    },
    {
      name: '职业能力',
      score: employment.jobReadiness,
      avg: 60,
      max: 100,
    },
  ]
  return { radar: [...radar, ...soft, ...extra] }
})

/* ────────────────────────────────────────────────
   4. 成长任务清单
   ──────────────────────────────────────────────── */
const taskList = computed(() => {
  if (!dashboard.value) return []
  const { aiAssistant, aiPortrait, careerDev } = dashboard.value
  return [
    {
      period: '本学期',
      anchor: '课程提升 / 学科竞赛',
      tasks: aiAssistant.shortTermSuggestions.length
        ? aiAssistant.shortTermSuggestions
        : ['完成核心课程学习目标', '参加至少1项学科竞赛', '提升英语口语与写作能力'],
    },
    {
      period: '未来一年',
      anchor: '技能认证 / 实习实践',
      tasks: aiAssistant.longTermSuggestions.length
        ? aiAssistant.longTermSuggestions
        : ['完成1段专业对口实习', '获得1项专业技能证书', '建立个人项目作品集', '参加行业交流活动'],
    },
    {
      period: '毕业前',
      anchor: '就业升学 / 毕业审核',
      tasks: [
        careerDev.developmentPath?.long || '明确最终就业或升学去向',
        '完善简历、作品集或升学材料',
        '达成就业协议或录取通知',
      ],
    },
  ]
})

/* ────────────────────────────────────────────────
   5. 发展路径规划
   ──────────────────────────────────────────────── */
const pathPlan = computed(() => {
  if (!dashboard.value) return null
  const { careerDev, employment, aiPortrait } = dashboard.value
  const dest = careerDev.employmentDestination || careerDev.employmentIntention || '待实习'
  // 根据就业去向推断路径类型
  const pathType = dest.includes('考研') || dest.includes('升学')
    ? '升学路径'
    : dest.includes('考公')
      ? '考公考编路径'
      : dest.includes('创业')
        ? '自主创业路径'
        : '企业就业路径'
  return {
    pathType,
    destination: dest,
    careerDirections: employment.careerDirections,
    targetUniversities: careerDev.targetUniversities || [],
    targetCompanies: careerDev.targetCompanies || [],
    jobMatches: aiPortrait.jobMatches.slice(0, 3),
  }
})

/* ────────────────────────────────────────────────
   6. 成长资源推荐
   ──────────────────────────────────────────────── */
const resourceRecommend = computed(() => {
  if (!dashboard.value) return null
  const { careerDev, aiPortrait, competition } = dashboard.value
  return {
    // 推荐竞赛
    competitions: competition.highlights.slice(0, 3).map((h) => h.label),
    // 推荐企业/实习基地
    companies: (careerDev.targetCompanies || []).slice(0, 4),
    // 推荐高校（升学）
    universities: (careerDev.targetUniversities || []).slice(0, 4),
    // 实践基地
    bases: (careerDev.practiceBases || []).slice(0, 3),
    // 机会推送
    opportunities: (aiPortrait.opportunities || []).slice(0, 3).map((o) => o.text),
  }
})

/* ────────────────────────────────────────────────
   7. 成长记录
   ──────────────────────────────────────────────── */
const growthRecords = computed(() => {
  if (!dashboard.value) return null
  const { competition, internship, careerDev, scholarships, annualAssessments, profile } = dashboard.value
  return {
    awards: profile.awards || [],
    scholarships: scholarships || [],
    competitionHighlights: competition.highlights || [],
    internshipCount: internship.internshipCount,
    projectCount: internship.projectCount,
    certificateCount: internship.certificateCount,
    projects: careerDev.projectExperiences || [],
    annualAssessments: annualAssessments || [],
    items: internship.items || [],
  }
})

/* ────────────────────────────────────────────────
   8. 目标达成情况
   ──────────────────────────────────────────────── */
const goalStatus = computed(() => {
  if (!dashboard.value) return null
  const { academic, creditProgress, footer, timeline } = dashboard.value
  // 年度目标
  const yearly = academic.yearlyGoals || []
  // 学分进度
  const credit = {
    earned: creditProgress.earned,
    required: creditProgress.required,
    percent: creditProgress.earnedPercent,
  }
  // 第二课堂
  const secondClass = {
    earned: creditProgress.secondClassroomEarned,
    required: creditProgress.secondClassroomRequired,
    percent: creditProgress.secondPercent,
  }
  // 里程碑统计
  const milestones = timeline.filter((t) => t.milestone).length
  return {
    yearlyGoals: yearly,
    credit,
    secondClass,
    goalCompletionRate: footer.goalCompletionRate,
    milestoneCount: footer.milestoneCount,
    totalAwards: footer.totalAwards,
  }
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="成长路径完整方案"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回学生发展概览"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard" class="growth-path">
      <!-- ─── 1. 成长阶段总览 ─── -->
      <section v-if="stageOverview" class="warn-section">
        <h3 class="warn-section__title">成长阶段总览</h3>
        <div class="overview-card">
          <div class="overview-card__left">
            <div class="overview-card__stage">
              <span class="stage-label">当前阶段</span>
              <strong class="stage-value">{{ stageOverview.grade }}</strong>
            </div>
            <div class="overview-card__goal">
              <span class="goal-label">发展目标</span>
              <strong class="goal-value">{{ stageOverview.goal }}</strong>
            </div>
          </div>
          <div class="overview-card__right">
            <div class="stat-ring">
              <div class="stat-ring__inner">
                <strong>{{ stageOverview.growthIndex }}</strong>
                <span>成长指数</span>
              </div>
            </div>
            <div class="stat-items">
              <div class="stat-item">
                <strong>{{ stageOverview.growthLevel }}</strong>
                <span>成长等级</span>
              </div>
              <div class="stat-item">
                <strong>{{ stageOverview.creditPercent }}%</strong>
                <span>学分完成</span>
              </div>
              <div class="stat-item">
                <strong>{{ stageOverview.overallPercent }}</strong>
                <span>年级排名</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 2. 当前成长状态 ─── -->
      <section v-if="growthStatus" class="warn-section">
        <h3 class="warn-section__title">当前成长状态</h3>
        <div class="status-grid">
          <div class="status-block">
            <div class="status-block__head">
              <span class="dot dot--green" />
              <strong>已完成事项</strong>
              <span class="count">{{ growthStatus.completed.length }}</span>
            </div>
            <ul class="status-list">
              <li v-for="(item, i) in growthStatus.completed.slice(0, 5)" :key="`c-${i}`">
                <span class="status-list__label">{{ item.label }}</span>
                <span v-if="item.date" class="status-list__date">{{ item.date }}</span>
              </li>
              <li v-if="!growthStatus.completed.length" class="empty">暂无已完成事项</li>
            </ul>
          </div>
          <div class="status-block">
            <div class="status-block__head">
              <span class="dot dot--blue" />
              <strong>正在进行</strong>
              <span class="count">{{ growthStatus.inProgress.length }}</span>
            </div>
            <ul class="status-list">
              <li v-for="(item, i) in growthStatus.inProgress.slice(0, 5)" :key="`p-${i}`">
                <span class="status-list__label">{{ item.label }}</span>
                <span v-if="item.priority" class="status-list__priority">{{ item.priority }}</span>
              </li>
              <li v-if="!growthStatus.inProgress.length" class="empty">暂无进行中事项</li>
            </ul>
          </div>
          <div class="status-block">
            <div class="status-block__head">
              <span class="dot dot--orange" />
              <strong>待完成事项</strong>
              <span class="count">{{ growthStatus.pending.length }}</span>
            </div>
            <ul class="status-list">
              <li v-for="(item, i) in growthStatus.pending.slice(0, 5)" :key="`w-${i}`">
                <span class="status-list__label">{{ item.label }}</span>
                <span v-if="item.level" class="status-list__level">{{ item.level }}</span>
              </li>
              <li v-if="!growthStatus.pending.length" class="empty">暂无待完成事项</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ─── 3. 能力发展画像 ─── -->
      <section v-if="abilityPortrait" class="warn-section">
        <h3 class="warn-section__title">能力发展画像</h3>
        <div class="ability-list">
          <div
            v-for="item in abilityPortrait.radar.slice(0, 8)"
            :key="item.name"
            class="ability-item"
          >
            <div class="ability-item__info">
              <div class="ability-item__head">
                <span class="ability-item__name">{{ item.name }}</span>
                <span class="ability-item__score">{{ item.score }} <small>/ {{ item.max }}</small></span>
              </div>
              <div class="ability-item__legend">
                <span><i class="legend-personal" />个人</span>
                <span><i class="legend-avg" />年级平均</span>
              </div>
            </div>
            <div class="ability-item__ring">
              <svg viewBox="0 0 100 100" class="ring-svg">
                <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(0,69,91,0.68)" stroke-width="7" />
                <circle
                  cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="7"
                  stroke-dasharray="251.2"
                  :stroke-dashoffset="251.2 - (251.2 * item.avg / item.max)"
                  stroke-linecap="round"
                />
                <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(0,69,91,0.68)" stroke-width="5" />
                <circle
                  cx="50" cy="50" r="28" fill="none" stroke="#20c997" stroke-width="5"
                  stroke-dasharray="175.9"
                  :stroke-dashoffset="175.9 - (175.9 * item.score / item.max)"
                  stroke-linecap="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 4. 成长任务清单 ─── -->
      <section class="warn-section">
        <h3 class="warn-section__title">成长任务清单</h3>
        <div class="task-timeline">
          <div class="task-timeline__track" />
          <div class="task-timeline__nodes">
            <div
              v-for="node in taskList"
              :key="node.period"
              class="task-timeline__node"
            >
              <div class="task-timeline__dot" />
              <div class="task-timeline__content">
                <strong class="task-timeline__title">{{ node.period }}</strong>
                <span class="task-timeline__anchor">{{ node.anchor }}</span>
                <ul class="task-list">
                  <li v-for="(t, i) in node.tasks" :key="i">{{ t }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 5. 发展路径规划 ─── -->
      <section v-if="pathPlan" class="warn-section">
        <h3 class="warn-section__title">发展路径规划</h3>
        <div class="path-plan">
          <div class="path-plan__main">
            <div class="path-plan__type">
              <span class="path-plan__label">路径类型</span>
              <strong class="path-plan__value">{{ pathPlan.pathType }}</strong>
            </div>
            <div class="path-plan__dest">
              <span class="path-plan__label">当前去向</span>
              <strong class="path-plan__value">{{ pathPlan.destination }}</strong>
            </div>
          </div>
          <div class="path-plan__directions" v-if="pathPlan.careerDirections.length">
            <span class="path-plan__label">职业方向</span>
            <div class="tag-list">
              <span v-for="d in pathPlan.careerDirections" :key="d" class="tag">{{ d }}</span>
            </div>
          </div>
          <div class="path-plan__targets" v-if="pathPlan.targetUniversities.length || pathPlan.targetCompanies.length">
            <div v-if="pathPlan.targetUniversities.length" class="target-block">
              <span class="path-plan__label">目标高校</span>
              <div class="target-list">
                <span v-for="u in pathPlan.targetUniversities" :key="u" class="target-tag">{{ u }}</span>
              </div>
            </div>
            <div v-if="pathPlan.targetCompanies.length" class="target-block">
              <span class="path-plan__label">目标企业</span>
              <div class="target-list">
                <span v-for="c in pathPlan.targetCompanies" :key="c" class="target-tag">{{ c }}</span>
              </div>
            </div>
          </div>
          <div class="path-plan__matches" v-if="pathPlan.jobMatches.length">
            <span class="path-plan__label">推荐岗位</span>
            <div class="match-list">
              <div v-for="job in pathPlan.jobMatches" :key="job.role" class="match-item">
                <span class="match-item__role">{{ job.role }}</span>
                <div class="match-item__bar">
                  <div class="match-item__bar-inner" :style="{ width: `${job.match}%` }" />
                </div>
                <strong class="match-item__percent">{{ job.match }}%</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 6. 成长资源推荐 ─── -->
      <section v-if="resourceRecommend" class="warn-section">
        <h3 class="warn-section__title">成长资源推荐</h3>
        <div class="resource-grid">
          <div class="resource-block" v-if="resourceRecommend.competitions.length">
            <div class="resource-block__head">
              <span class="resource-icon">🏆</span>
              <strong>推荐竞赛</strong>
            </div>
            <ul class="resource-list">
              <li v-for="(c, i) in resourceRecommend.competitions" :key="`comp-${i}`">{{ c }}</li>
            </ul>
          </div>
          <div class="resource-block" v-if="resourceRecommend.companies.length">
            <div class="resource-block__head">
              <span class="resource-icon">🏢</span>
              <strong>推荐企业</strong>
            </div>
            <ul class="resource-list">
              <li v-for="(c, i) in resourceRecommend.companies" :key="`co-${i}`">{{ c }}</li>
            </ul>
          </div>
          <div class="resource-block" v-if="resourceRecommend.universities.length">
            <div class="resource-block__head">
              <span class="resource-icon">🎓</span>
              <strong>推荐高校</strong>
            </div>
            <ul class="resource-list">
              <li v-for="(u, i) in resourceRecommend.universities" :key="`u-${i}`">{{ u }}</li>
            </ul>
          </div>
          <div class="resource-block" v-if="resourceRecommend.bases.length">
            <div class="resource-block__head">
              <span class="resource-icon">🔬</span>
              <strong>实践基地</strong>
            </div>
            <ul class="resource-list">
              <li v-for="(b, i) in resourceRecommend.bases" :key="`b-${i}`">{{ b }}</li>
            </ul>
          </div>
          <div class="resource-block" v-if="resourceRecommend.opportunities.length">
            <div class="resource-block__head">
              <span class="resource-icon">💡</span>
              <strong>近期机会</strong>
            </div>
            <ul class="resource-list">
              <li v-for="(o, i) in resourceRecommend.opportunities" :key="`o-${i}`">{{ o }}</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- ─── 7. 成长记录 ─── -->
      <section v-if="growthRecords" class="warn-section">
        <h3 class="warn-section__title">成长记录</h3>
        <div class="record-kpi">
          <div class="record-kpi__item">
            <strong>{{ growthRecords.scholarships.length }}</strong>
            <span>奖学金</span>
          </div>
          <div class="record-kpi__item">
            <strong>{{ growthRecords.awards.length }}</strong>
            <span>竞赛获奖</span>
          </div>
          <div class="record-kpi__item">
            <strong>{{ growthRecords.internshipCount }}</strong>
            <span>实习经历</span>
          </div>
          <div class="record-kpi__item">
            <strong>{{ growthRecords.projectCount }}</strong>
            <span>项目经历</span>
          </div>
          <div class="record-kpi__item">
            <strong>{{ growthRecords.certificateCount }}</strong>
            <span>技能证书</span>
          </div>
        </div>
        <div class="record-detail">
          <div class="record-group" v-if="growthRecords.competitionHighlights.length">
            <h4 class="record-group__title">竞赛与科研</h4>
            <div class="record-group__list">
              <div v-for="item in growthRecords.competitionHighlights" :key="item.label" class="record-item">
                <span class="record-item__label">{{ item.label }}</span>
                <span class="record-item__detail" v-if="item.detail">{{ item.detail }}</span>
              </div>
            </div>
          </div>
          <div class="record-group" v-if="growthRecords.projects.length">
            <h4 class="record-group__title">项目经历</h4>
            <div class="record-group__list">
              <div v-for="(p, i) in growthRecords.projects" :key="`proj-${i}`" class="record-item">
                <span class="record-item__dot" />
                <span>{{ p }}</span>
              </div>
            </div>
          </div>
          <div class="record-group" v-if="growthRecords.items.length">
            <h4 class="record-group__title">技能与证书</h4>
            <div class="record-group__list">
              <div v-for="item in growthRecords.items" :key="`${item.type}-${item.name}`" class="record-item">
                <span class="record-item__badge">{{ item.type }}</span>
                <span>{{ item.name }}</span>
              </div>
            </div>
          </div>
          <div class="record-group" v-if="growthRecords.annualAssessments.length">
            <h4 class="record-group__title">年度评价</h4>
            <div class="record-group__list">
              <div v-for="ass in growthRecords.annualAssessments" :key="ass.year" class="record-item">
                <span class="record-item__year">{{ ass.year }}</span>
                <span class="record-item__score">{{ ass.score }} 分</span>
                <span class="record-item__level">{{ ass.level }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ─── 8. 目标达成情况 ─── -->
      <section v-if="goalStatus" class="warn-section">
        <h3 class="warn-section__title">目标达成情况</h3>
        <div class="goal-summary">
          <div class="goal-summary__item">
            <strong>{{ goalStatus.goalCompletionRate }}%</strong>
            <span>总体目标完成率</span>
          </div>
          <div class="goal-summary__item">
            <strong>{{ goalStatus.milestoneCount }}</strong>
            <span>已达成的里程碑</span>
          </div>
          <div class="goal-summary__item">
            <strong>{{ goalStatus.totalAwards }}</strong>
            <span>累计成果数</span>
          </div>
        </div>
        <div class="goal-progress" v-if="goalStatus.credit">
          <div class="goal-progress__item">
            <div class="goal-progress__head">
              <span>学分进度</span>
              <strong>{{ goalStatus.credit.earned }} / {{ goalStatus.credit.required }}</strong>
            </div>
            <div class="goal-progress__bar">
              <div class="goal-progress__bar-inner" :style="{ width: `${goalStatus.credit.percent}%` }" />
            </div>
          </div>
          <div class="goal-progress__item">
            <div class="goal-progress__head">
              <span>第二课堂</span>
              <strong>{{ goalStatus.secondClass.earned }} / {{ goalStatus.secondClass.required }}</strong>
            </div>
            <div class="goal-progress__bar">
              <div class="goal-progress__bar-inner" :style="{ width: `${goalStatus.secondClass.percent}%` }" />
            </div>
          </div>
        </div>
        <div class="yearly-goals" v-if="goalStatus.yearlyGoals.length">
          <h4 class="yearly-goals__title">年度目标</h4>
          <div class="yearly-goals__list">
            <div v-for="g in goalStatus.yearlyGoals" :key="g.year" class="yearly-goal">
              <span class="yearly-goal__year">{{ g.year }}</span>
              <span class="yearly-goal__text">{{ g.goal }}</span>
              <div class="yearly-goal__bar">
                <div class="yearly-goal__bar-inner" :style="{ width: `${g.percent}%` }" />
              </div>
              <strong class="yearly-goal__percent">{{ g.percent }}%</strong>
            </div>
          </div>
        </div>
      </section>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.growth-path {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
  animation: sectionSlideUp 0.5s ease-out both;
  &:nth-child(1) { animation-delay: 0.04s; }
  &:nth-child(2) { animation-delay: 0.08s; }
  &:nth-child(3) { animation-delay: 0.12s; }
  &:nth-child(4) { animation-delay: 0.16s; }
  &:nth-child(5) { animation-delay: 0.20s; }
  &:nth-child(6) { animation-delay: 0.24s; }
  &:nth-child(7) { animation-delay: 0.28s; }
  &:nth-child(8) { animation-delay: 0.32s; }
}

.warn-section__title {
  margin: 0 0 12px;
  font-size: 15px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

/* ─── 1. 成长阶段总览 ─── */
.overview-card {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
  align-items: center;

  &__left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__stage,
  &__goal {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .stage-label,
  .goal-label {
    color: #8fb7cd;
    font-size: 13px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .stage-value {
    color: #43e7af;
    font-size: 18px;
    font-weight: 700;
  }

  .goal-value {
    color: #d0e8f8;
    font-size: 16px;
    font-weight: 700;
  }

  &__right {
    display: flex;
    align-items: center;
    gap: 16px;
    justify-content: flex-end;
  }
}

.stat-ring {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  border: 3px solid rgba(67, 231, 175, 0.25);
  border-top-color: #43e7af;
  display: flex;
  align-items: center;
  justify-content: center;

  &__inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    strong {
      color: #43e7af;
      font-size: 24px;
      font-weight: 700;
    }

    span {
      color: #8fb7cd;
      font-size: 11px;
    }
  }
}

.stat-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  align-items: baseline;
  gap: 6px;

  strong {
    color: #d0e8f8;
    font-size: 14px;
    font-weight: 700;
  }

  span {
    color: #8fb7cd;
    font-size: 12px;
  }
}

/* ─── 2. 当前成长状态 ─── */
.status-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.status-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);

    strong {
      color: #d0e8f8;
      font-size: 13px;
      font-weight: 700;
    }

    .count {
      margin-left: auto;
      color: #43e7af;
      font-size: 14px;
      font-weight: 700;
    }
  }
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;

  &--green { background: #43e7af; box-shadow: 0 0 6px rgba(67, 231, 175, 0.4); }
  &--blue { background: #00b8ff; box-shadow: 0 0 6px rgba(0, 184, 255, 0.4); }
  &--orange { background: #e8b450; box-shadow: 0 0 6px rgba(232, 180, 80, 0.4); }
}

.status-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;

  li {
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 12px;
    line-height: 1.4;
  }

  .empty {
    color: #5a7d96;
    font-size: 12px;
    padding: 4px 0;
  }
}

.status-list__label {
  color: #d0e8f8;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.status-list__date,
.status-list__priority,
.status-list__level {
  flex-shrink: 0;
  color: #8fb7cd;
  font-size: 11px;
}

.status-list__priority {
  color: #e8b450;
}

/* ─── 3. 能力发展画像 ─── */
.ability-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ability-item {
  display: grid;
  grid-template-columns: 1fr 56px;
  gap: 8px;
  align-items: center;

  &__info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__name {
    color: #8fb7cd;
    font-size: 13px;
    font-weight: 600;
  }

  &__score {
    color: #43e7af;
    font-size: 14px;
    font-weight: 700;

    small {
      color: #8fb7cd;
      font-size: 11px;
      font-weight: 400;
    }
  }

  &__ring {
    width: 56px;
    height: 56px;
    position: relative;
  }

  &__legend {
    display: flex;
    gap: 12px;
    font-size: 11px;
    color: #8fb7cd;

    span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    i {
      display: inline-block;
      width: 10px;
      height: 3px;
      border-radius: 2px;
    }

    .legend-personal { background: linear-gradient(90deg, #20c997, #52e8bf); }
    .legend-avg { background: rgba(255, 255, 255, 0.25); }
  }
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

/* ─── 4. 成长任务清单 ─── */
.task-timeline {
  position: relative;
  padding: 10px 0 0;

  &__track {
    position: absolute;
    top: 24px;
    left: 14px;
    right: 14px;
    height: 2px;
    background: linear-gradient(90deg, rgba(100, 200, 255, 0.55), rgba(100, 200, 255, 0.12));
  }

  &__nodes {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    position: relative;
  }

  &__node {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
  }

  &__dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid rgba(100, 200, 255, 0.45);
    background: rgba(0, 40, 80, 0.8);
    flex-shrink: 0;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    align-items: center;
  }

  &__title {
    color: #7ff6ff;
    font-size: 14px;
    font-weight: 700;
  }

  &__anchor {
    color: #8fb7cd;
    font-size: 12px;
    font-weight: 600;
  }
}

.task-list {
  margin: 6px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
  width: 100%;

  li {
    padding: 5px 8px;
    border-radius: 3px;
    background: rgba(0, 38, 73, 0.3);
    color: #d0e8f8;
    font-size: 12px;
    line-height: 1.4;
  }
}

/* ─── 5. 发展路径规划 ─── */
.path-plan {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__main {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  &__type,
  &__dest {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);
  }

  &__label {
    color: #8fb7cd;
    font-size: 12px;
    font-weight: 600;
  }

  &__value {
    color: #43e7af;
    font-size: 14px;
    font-weight: 700;
  }

  &__directions {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);
  }

  &__targets {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  &__matches {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);
  }
}

.target-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);
}

.target-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.target-tag {
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(0, 184, 255, 0.12);
  color: #55dfff;
  font-size: 12px;
  font-weight: 600;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  padding: 3px 10px;
  border-radius: 3px;
  background: rgba(67, 231, 175, 0.12);
  color: #43e7af;
  font-size: 12px;
  font-weight: 600;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.match-item {
  display: grid;
  grid-template-columns: 1fr 100px 50px;
  align-items: center;
  gap: 8px;

  &__role {
    color: #d0e8f8;
    font-size: 13px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }

  &__percent {
    color: #43e7af;
    font-size: 13px;
    font-weight: 700;
    text-align: right;
  }
}

/* ─── 6. 成长资源推荐 ─── */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.resource-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__head {
    display: flex;
    align-items: center;
    gap: 6px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.08);

    .resource-icon {
      font-size: 18px;
    }

    strong {
      color: #d0e8f8;
      font-size: 13px;
      font-weight: 700;
    }
  }
}

.resource-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;

  li {
    color: #8fb7cd;
    font-size: 12px;
    line-height: 1.4;
    padding: 3px 0;
  }
}

/* ─── 7. 成长记录 ─── */
.record-kpi {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);

    strong {
      color: #43e7af;
      font-size: 20px;
      font-weight: 700;
    }

    span {
      color: #8fb7cd;
      font-size: 11px;
      font-weight: 600;
    }
  }
}

.record-detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.record-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__title {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    color: #7ff6ff;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }
}

.record-item {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 6px;
  font-size: 12px;
  line-height: 1.4;

  &__label {
    color: #d0e8f8;
    font-size: 13px;
    font-weight: 600;
  }

  &__detail {
    color: #8fb7cd;
  }

  &__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #43e7af;
    flex-shrink: 0;
  }

  &__badge {
    padding: 1px 5px;
    border-radius: 3px;
    background: rgba(0, 184, 255, 0.15);
    color: #55dfff;
    font-size: 10px;
    font-weight: 700;
    flex-shrink: 0;
  }

  &__year {
    color: #8fb7cd;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__score {
    color: #d0e8f8;
  }

  &__level {
    color: #43e7af;
    font-weight: 700;
    margin-left: auto;
  }
}

/* ─── 8. 目标达成情况 ─── */
.goal-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;

  &__item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);

    strong {
      color: #43e7af;
      font-size: 22px;
      font-weight: 700;
    }

    span {
      color: #8fb7cd;
      font-size: 12px;
      font-weight: 600;
    }
  }
}

.goal-progress {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;

  &__item {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px 10px;
    border-radius: 4px;
    background: rgba(0, 38, 73, 0.3);
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    span { color: #8fb7cd; font-size: 13px; font-weight: 600; }
    strong { color: #43e7af; font-size: 14px; font-weight: 700; }
  }

  &__bar {
    height: 6px;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
  }
}

.yearly-goals {
  &__title {
    margin: 0 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: #7ff6ff;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.yearly-goal {
  display: grid;
  grid-template-columns: 60px 1fr 120px 50px;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__year {
    color: #8fb7cd;
    font-size: 12px;
    font-weight: 600;
    flex-shrink: 0;
  }

  &__text {
    color: #d0e8f8;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__bar {
    height: 5px;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);
    overflow: hidden;
  }

  &__bar-inner {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #00b8ff, #62dfff);
  }

  &__percent {
    color: #43e7af;
    font-size: 12px;
    font-weight: 700;
    text-align: right;
  }
}

/* ─── Loading / Error ─── */
.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error {
    color: #f87171;
    flex-direction: column;
  }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 13px;

    &:hover {
      background: rgba(0, 184, 255, 0.2);
    }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.empty-cell {
  padding: 12px;
  text-align: center;
  color: #5a7d96;
  font-size: 13px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes sectionSlideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ─── 响应式 ─── */
@media (max-width: 1280px) {
  .growth-path {
    grid-template-columns: 1fr;
  }

  .warn-section:first-child,
  .warn-section:last-child {
    grid-column: auto;
  }

  .overview-card {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .ability-list {
    grid-template-columns: 1fr;
  }

  .task-timeline__nodes {
    flex-direction: column;
  }

  .task-timeline__track {
    display: none;
  }

  .path-plan__main,
  .path-plan__targets {
    grid-template-columns: 1fr;
  }

  .resource-grid {
    grid-template-columns: 1fr;
  }

  .record-kpi {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .record-detail {
    grid-template-columns: 1fr;
  }

  .goal-summary {
    grid-template-columns: 1fr;
  }

  .yearly-goal {
    grid-template-columns: 50px 1fr 80px 40px;
  }
}
</style>
