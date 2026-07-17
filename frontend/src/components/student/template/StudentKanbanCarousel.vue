<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import DashIcon from '@/components/college/DashIcon.vue'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import type {
  AcademicDevVM,
  AiPortraitVM,
  CareerDevVM,
  CompetitionVM,
  CreditProgressVM,
  EmploymentVM,
  FailedCourseVM,
  GrowthOverviewVM,
  InternshipVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'

const props = defineProps<{
  academic: AcademicDevVM
  credit: CreditProgressVM
  failedCritical: FailedCourseVM[]
  growthOverview: GrowthOverviewVM
  competition: CompetitionVM
  quality: QualityVM
  scholarships: Array<{ name: string; year: string }>
  careerDev: CareerDevVM
  internship: InternshipVM
  employment: EmploymentVM
  aiPortrait: AiPortraitVM
  profile: PersonalInfoVM
}>()

const router = useRouter()

const emit = defineEmits<{ open: [id: string] }>()

const creditBuckets = computed(() => {
  if (props.credit.buckets?.length) return props.credit.buckets
  const required = props.credit.required || 160
  const earned = props.credit.earned || 0
  return [
    { label: '必修学分', earned: Math.round(earned * 0.7 * 10) / 10, required: Math.round(required * 0.7) },
    { label: '选修学分', earned: Math.round(earned * 0.2 * 10) / 10, required: Math.round(required * 0.2) },
    { label: '通识学分', earned: Math.round(earned * 0.1 * 10) / 10, required: Math.max(1, Math.round(required * 0.1)) },
  ]
})

const failCount = computed(() => props.failedCritical.length)
const failTone = computed(() => {
  if (failCount.value >= 3) return 'high'
  if (failCount.value > 0) return 'medium'
  return 'low'
})

const academicRisk = computed(() => {
  if (failCount.value >= 3 || (props.academic.gpa > 0 && props.academic.gpa < 2.0)) {
    return { label: '高风险', level: 'high' as const, tip: '存在多门挂科或 GPA 显著偏低，需立即干预' }
  }
  if (failCount.value > 0 || (props.academic.gpa > 0 && props.academic.gpa < 2.5)) {
    return { label: '中风险', level: 'medium' as const, tip: '有挂科或学业偏弱，建议谈心谈话与补修闭环' }
  }
  return { label: '低风险', level: 'low' as const, tip: '低风险：无挂科，仅需完成常规期末考核' }
})

const gpaDelta = computed(() => {
  const values = props.academic.gpaValues
  const current = values[values.length - 1] ?? props.academic.gpa
  const previous = values[values.length - 2] ?? current
  return Math.round((current - previous) * 100) / 100
})

const gpaGauge = computed(() => Math.min(100, Math.round((props.academic.gpa / 4) * 100)))

const thesisSteps = ['选题', '开题', '初稿', '答辩'] as const
const thesisIndex = computed(() => {
  const status = props.profile.thesisStatus || '未开始'
  const idx = thesisSteps.findIndex((s) => status.includes(s))
  return idx
})

const graduationRisk = computed(() => {
  if (failCount.value >= 3) {
    return { label: '高风险', level: 'high', tip: '挂科较多，毕业延期风险较高，需尽快闭环未完成项。' }
  }
  if (failCount.value > 0) {
    return { label: '需关注', level: 'medium', tip: '存在未闭环任务或挂科，需关注毕业审核进度。' }
  }
  return { label: '正常', level: 'low', tip: '毕业审核进度总体正常，继续按节点推进即可。' }
})

const thesisStage = computed(() => {
  if (thesisIndex.value >= 0) return thesisSteps[thesisIndex.value]
  return props.profile.thesisStatus || '未开始'
})

const jobMatches = computed(() => props.aiPortrait.jobMatches.slice(0, 2))

const scholarshipCount = computed(() => props.scholarships.length)
const disciplineRecords = computed(() => props.quality.disciplineRecords ?? [])
const disciplineCount = computed(() => disciplineRecords.value.length)
const latestDiscipline = computed(() => disciplineRecords.value[0] ?? null)
const overallTopPercent = computed(() => {
  const total = props.growthOverview.overallTotal || 1
  return ((props.growthOverview.overallRank / total) * 100).toFixed(1)
})
const qualityHighlights = computed(() => {
  const items: string[] = []
  for (const s of props.scholarships) {
    items.push(`${s.year} · ${s.name}`)
  }
  for (const h of props.competition.highlights) {
    if (h.label && !h.label.includes('暂无')) items.push(h.detail ? `${h.label}（${h.detail}）` : h.label)
  }
  for (const a of props.profile.awards) {
    items.push(a.level ? `${a.name} · ${a.level}` : a.name)
  }
  return [...new Set(items)]
})
const visibleQualityHighlights = computed(() => qualityHighlights.value.slice(0, 2))
const hiddenQualityCount = computed(() => Math.max(0, qualityHighlights.value.length - 2))
const qualityExtraLine = computed(() => {
  const roles = props.quality.cadreRoles?.length
    ? props.quality.cadreRoles.slice(0, 2).join('、')
    : '无干部职务'
  return `科研 ${props.competition.researchCount} · 志愿 ${props.quality.volunteerHours}h · ${roles} · 实践 ${props.quality.socialPractices}次`
})
const qualityInsight = computed(() => {
  const disc =
    disciplineCount.value > 0
      ? `处分 ${disciplineCount.value} 项（${latestDiscipline.value?.type ?? '在册'}）`
      : '暂无处分'
  return `综测前 ${overallTopPercent.value}% · 竞赛 ${props.competition.awardCount} · ${disc}`
})
const failNames = computed(() =>
  props.failedCritical.map((c) => c.name).filter(Boolean).slice(0, 2).join('、'),
)
const employmentDestination = computed(
  () => props.careerDev.employmentDestination || props.careerDev.employmentIntention || '待实习',
)

const secondClassGap = computed(() => {
  const earned = props.credit.secondClassroomEarned
  const required = props.credit.secondClassroomRequired || 10
  const gap = Math.max(0, Math.round((required - earned) * 10) / 10)
  return { earned, required, gap, percent: props.credit.secondPercent || 0 }
})

const cetLine = computed(() => {
  const cet4 = props.profile.cet4Score
  const cet6 = props.profile.cet6Score
  if (!cet4 && !cet6) return '四六级成绩待接入'
  return `四级 ${cet4 ?? '—'} · 六级 ${cet6 ?? '—'}`
})

const academicTrend = computed(() => {
  const delta = gpaDelta.value
  const direction = delta >= 0 ? '↑' : '↓'
  return `GPA ${direction}${Math.abs(delta).toFixed(2)} · ${failCount.value ? `挂科${failCount.value}门` : '无挂科'} · ${cetLine.value} · 二课${secondClassGap.value.percent}%`
})

function goGpaDetail() {
  router.push(ROUTES.student.gpaDetail)
}

function goFailDetail() {
  router.push(ROUTES.student.failDetail)
}

function goCreditProgress() {
  router.push(ROUTES.student.creditProgress)
}
</script>

<template>
  <StudentTplCard
    icon="map"
    title="学生发展概览"
    tip="学情轨迹、综合素养与出口发展三大板块一览。"
    class="stu-kanban-wrap"
  >
    <div class="dev-board">
      <!-- 学情轨迹 -->
      <article class="development-card development-card--academic">
        <header class="development-card__head">
          <span class="development-card__icon" aria-hidden="true">
            <DashIcon kind="academic" :size="20" />
          </span>
          <div>
            <StuHint tip="盯 GPA、挂科与学分进度，判断是否需要学业干预。">
              <h4>学情轨迹护航</h4>
            </StuHint>
          </div>
          <StuHint :tip="`学业风险等级：${academicRisk.tip}`">
            <span class="development-status" :class="`development-status--${academicRisk.level}`">{{ academicRisk.label }}</span>
          </StuHint>
        </header>

        <div class="academic-body">
          <StuHint tip="点击 GPA 绩点查看学业总览详情。" class="academic-gpa-wrap clickable-card" @click="goGpaDetail">
            <div class="gpa-gauge">
              <svg viewBox="0 0 72 72" aria-hidden="true">
                <circle cx="36" cy="36" r="28" class="gpa-gauge__track" />
                <circle
                  cx="36"
                  cy="36"
                  r="28"
                  class="gpa-gauge__value"
                  :style="{ strokeDasharray: `${gpaGauge * 1.76} 176` }"
                />
              </svg>
              <div class="gpa-gauge__text">
                <strong>{{ academic.gpa.toFixed(2) }}</strong>
                <span>GPA</span>
              </div>
            </div>
            <div class="gpa-gauge__label">GPA 绩点</div>
          </StuHint>

          <div class="credit-bars clickable-card" @click="goCreditProgress">
            <div class="credit-bars__header">学分完成率</div>
            <div class="credit-bars__grid">
              <StuHint
                v-for="bucket in creditBuckets"
                :key="bucket.label"
                block
                :tip="`${bucket.label}：已获 ${bucket.earned} / 应修 ${bucket.required}`"
              >
                <div class="credit-bars__row">
                  <span>{{ bucket.label.replace('学分', '') }}</span>
                  <i>
                    <b
                      :style="{ width: `${Math.min(100, Math.round((bucket.earned / Math.max(1, bucket.required)) * 100))}%` }"
                    />
                  </i>
                  <em>{{ bucket.earned }}/{{ bucket.required }}</em>
                </div>
              </StuHint>
            </div>
            <div class="credit-bars__total">
              合计 {{ credit.earned }}/{{ credit.required }}（{{ credit.earnedPercent }}%）
            </div>
          </div>

          <div class="academic-kpis">
            <StuHint tip="较上一学期 GPA 变化，正值为上升。" block>
              <div class="academic-kpi">
                <span>环比</span>
                <strong :class="{ up: gpaDelta >= 0, down: gpaDelta < 0 }">
                  {{ gpaDelta >= 0 ? '+' : '' }}{{ gpaDelta.toFixed(2) }}
                </strong>
              </div>
            </StuHint>
            <StuHint tip="专业内名次 / 专业人数，名次越小越好。" block>
              <div class="academic-kpi">
                <span>专排</span>
                <strong>{{ academic.majorRank }}/{{ academic.majorTotal || '—' }}</strong>
              </div>
            </StuHint>
            <StuHint
              :tip="failNames ? `挂科课程：${failNames}` : '暂无挂科课程。'"
              block
            >
              <button
                type="button"
                class="fail-chip"
                :class="`fail-chip--${failTone}`"
                @click="goFailDetail"
              >
                挂科 {{ failCount }} 门
              </button>
            </StuHint>
          </div>

          <StuHint :tip="`学情摘要：${academicTrend}`" block class="academic-note-wrap">
            <p class="academic-hero__note">
              <em>{{ cetLine }}</em>
              <em>二课 {{ secondClassGap.earned }}/{{ secondClassGap.required }}（{{ secondClassGap.percent }}%）</em>
              <em v-if="failNames">待补：{{ failNames }}</em>
              <em v-else>无挂科待补</em>
            </p>
          </StuHint>

          <div class="academic-graduation-brief">
            <StuHint :tip="graduationRisk.tip">
              <div class="graduation-brief-item">
                <span>毕业审核</span>
                <strong :class="`is-${graduationRisk.level}`">{{ graduationRisk.label }}</strong>
              </div>
            </StuHint>
            <StuHint tip="一级页面仅展示当前毕设阶段，论文节点与审核任务进入二级页面查看。">
              <div class="graduation-brief-item">
                <span>毕设阶段</span>
                <strong>{{ thesisStage }}</strong>
              </div>
            </StuHint>
            <button type="button" class="graduation-brief-btn" @click="router.push({ path: ROUTES.student.graduationAudit, query: { studentId: profile.studentId } })">
              查看审核 ›
            </button>
          </div>
        </div>

        <button type="button" class="development-card__action" @click="router.push({ path: ROUTES.student.academicDetail, query: { studentId: profile.studentId } })">
          查看学情详情 <span aria-hidden="true">›</span>
        </button>
      </article>

      <!-- 综合素养 -->
      <article class="development-card development-card--quality">
        <header class="development-card__head">
          <span class="development-card__icon" aria-hidden="true">
            <DashIcon kind="trophy" :size="20" stroke="#e8c878" />
          </span>
          <div>
            <StuHint tip="综合素养荣誉与纪律台账：奖学金、竞赛、科研、综测，以及违纪处分记录。">
              <h4>综合素养台账</h4>
            </StuHint>
          </div>
          <StuHint :tip="disciplineCount ? `在册处分 ${disciplineCount} 项，点击详情查看事由。` : '当前无纪律处分记录；有处分时角标会标红。'">
            <span
              class="development-status"
              :class="disciplineCount ? 'development-status--high' : 'development-status--blue'"
            >{{ disciplineCount ? `处分 ${disciplineCount}` : '荣誉·纪律' }}</span>
          </StuHint>
        </header>

        <div class="quality-body">
          <div class="development-metrics development-metrics--quality">
            <StuHint tip="综合测评在同年级/范围内的位次，分子是名次，分母是总人数。" block>
              <div class="q-metric">
                <span>综测排名</span>
                <strong>{{ growthOverview.overallRank }} <small>/ {{ growthOverview.overallTotal }}</small></strong>
                <em>前 {{ overallTopPercent }}%</em>
              </div>
            </StuHint>
            <StuHint tip="已获得的奖学金次数与代表条目。" block>
              <div class="q-metric">
                <span>奖学金</span>
                <strong>{{ scholarshipCount }}<small>项</small></strong>
                <em>{{ scholarships[0]?.name || '暂无获奖' }}</em>
              </div>
            </StuHint>
            <StuHint tip="学科竞赛等获奖次数。" block>
              <div class="q-metric">
                <span>竞赛</span>
                <strong>{{ competition.awardCount }}<small>项</small></strong>
                <em>{{ competition.highlights[0]?.label || '暂无竞赛记录' }}</em>
              </div>
            </StuHint>
            <StuHint
              :tip="disciplineCount
                ? `最近：${latestDiscipline?.type ?? ''} · ${latestDiscipline?.reason ?? ''}。详情见台账。`
                : '纪律处分次数；暂无则显示 0。警告/记过等明细见详情。'"
              block
            >
              <div class="q-metric" :class="{ 'is-disc-alert': disciplineCount > 0 }">
                <span>纪律处分</span>
                <strong :class="disciplineCount ? 'is-alert-num' : ''">{{ disciplineCount }}<small>项</small></strong>
                <em>{{ disciplineCount ? (latestDiscipline?.type || '在册') : '暂无受处分记录' }}</em>
              </div>
            </StuHint>
          </div>

          <div class="quality-panels">
            <div class="quality-panel">
              <span>荣誉成果</span>
              <ul>
                <li v-for="(item, idx) in visibleQualityHighlights" :key="`${idx}-${item}`" :title="item">{{ item }}</li>
                <li v-if="!qualityHighlights.length">暂无奖学金 / 竞赛 / 表彰记录</li>
              </ul>
              <p v-if="hiddenQualityCount" class="quality-panel__more">
                另有 {{ hiddenQualityCount }} 项，进入详情查看
              </p>
            </div>
            <div class="quality-panel" :class="{ 'is-alert': disciplineCount > 0 }">
              <span>纪律处分</span>
              <ul v-if="disciplineCount">
                <li v-for="row in disciplineRecords.slice(0, 2)" :key="row.id">
                  {{ row.date }} · {{ row.type }} · {{ row.reason }}
                </li>
              </ul>
              <p v-else>当前无违纪处分、学业处分在册记录。</p>
              <p class="quality-panel__sub">{{ qualityExtraLine }}</p>
            </div>
          </div>

          <StuHint tip="基于排名、荣誉与处分数据的一句话摘要。" block>
            <div class="development-insight">
              <span>解读</span>
              <p>{{ qualityInsight }}</p>
            </div>
          </StuHint>
        </div>

        <button type="button" class="development-card__action" @click="router.push({ path: ROUTES.student.comprehensiveLedger, query: { studentId: profile.studentId } })">
          查看台账详情 <span aria-hidden="true">›</span>
        </button>
      </article>

      <!-- 出口发展 -->
      <article class="development-card development-card--career">
        <header class="development-card__head">
          <span class="development-card__icon" aria-hidden="true">
            <DashIcon kind="employment" :size="20" stroke="#43e7af" />
          </span>
          <div>
            <StuHint tip="就业/升学等毕业出口准备：去向、城市、薪资与岗位匹配。">
              <h4>出口发展</h4>
            </StuHint>
          </div>
          <StuHint tip="当前填报或推断的毕业去向类型。">
            <span class="development-status development-status--low">{{ employmentDestination }}</span>
          </StuHint>
        </header>

        <div class="development-metrics development-metrics--pair">
          <StuHint tip="毕业出口意向（就业/考研/考公等）。" block>
            <div><span>去向类型</span><strong class="is-text">{{ employmentDestination }}</strong></div>
          </StuHint>
          <StuHint tip="对标升学高校（系统挖掘推荐）。" block>
            <div>
              <span>升学高校</span>
              <strong class="is-text">{{ (careerDev.targetUniversities && careerDev.targetUniversities[0]) || '待明确' }}</strong>
            </div>
          </StuHint>
          <StuHint tip="对标就业大厂 / 名企（系统挖掘推荐）。" block>
            <div>
              <span>就业大厂</span>
              <strong class="is-text">{{ (careerDev.targetCompanies && careerDev.targetCompanies[0]) || '待明确' }}</strong>
            </div>
          </StuHint>
          <StuHint tip="简历完善进度，影响岗位推荐与面试准备。" block>
            <div><span>简历状态</span><strong class="is-text">{{ careerDev.resumeStatus || '未完善' }}</strong></div>
          </StuHint>
        </div>

        <div class="career-matches">
          <template v-if="(careerDev.targetUniversities?.length || 0) + (careerDev.targetCompanies?.length || 0)">
            <div class="career-benchmark-block">
              <p><em>升学对标</em><span>{{ (careerDev.targetUniversities || []).slice(0, 3).join(' · ') || '—' }}</span></p>
              <p><em>就业对标</em><span>{{ (careerDev.targetCompanies || []).slice(0, 3).join(' · ') || '—' }}</span></p>
            </div>
          </template>
          <template v-if="jobMatches.length">
            <StuHint
              v-for="job in jobMatches"
              :key="job.role"
              block
              :tip="`AI 岗位匹配度 ${job.match}%，越高越契合当前画像。`"
            >
              <div class="career-match-rich">
                <div class="career-match-rich__head">
                  <span>{{ job.role }}</span>
                  <strong>{{ job.match }}%</strong>
                </div>
                <i><b :style="{ width: `${job.match}%` }" /></i>
                <small>
                  <em v-if="job.city">{{ job.city }}</em>
                  <em v-if="job.salary">{{ job.salary }}</em>
                </small>
              </div>
            </StuHint>
          </template>
          <p v-else-if="!(careerDev.targetUniversities?.length || careerDev.targetCompanies?.length)" class="career-matches__empty">
            暂无岗位匹配推荐，完善简历后可生成
          </p>
        </div>

        <StuHint tip="已登记的代表性项目经历。" block>
          <div class="development-insight">
            <span>项目</span>
            <p>
              {{
                (careerDev.projectExperiences && careerDev.projectExperiences.length)
                  ? careerDev.projectExperiences.slice(0, 2).join('；')
                  : (internship.items.filter((x) => x.type === '项目').map((x) => x.name).slice(0, 2).join('；') || '暂无项目经历')
              }}
            </p>
          </div>
        </StuHint>

        <button type="button" class="development-card__action" @click="router.push({ path: ROUTES.student.careerDevelopment, query: { studentId: profile.studentId } })">
          查看发展建议 <span aria-hidden="true">›</span>
        </button>
      </article>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">

.dev-board {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 0.9fr 1.15fr 1.05fr;
  gap: 16px;
  padding: 2px 6px 6px;
}

.development-card {
  --card-accent: #1ed6ff;
  --fs: 13px;
  --fs-sm: 12px;
  --fs-label: 11px;
  --fs-title: 15px;
  --fs-num: 18px;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 8px;
  padding: 10px 14px 10px 14px;
  overflow: hidden;
  font-size: var(--fs);
  line-height: 1.45;
  border: 1px solid color-mix(in srgb, var(--card-accent) 34%, transparent);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 10%, transparent), transparent 42%),
    linear-gradient(160deg, rgba(6, 40, 78, 0.88), rgba(0, 16, 38, 0.9));
  box-shadow:
    inset 0 0 28px rgba(0, 90, 160, 0.12),
    inset 0 1px 0 rgba(180, 230, 255, 0.1);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 32px rgba(0, 100, 180, 0.16),
      0 10px 28px rgba(0, 0, 0, 0.28),
      0 0 18px color-mix(in srgb, var(--card-accent) 16%, transparent);
  }

  &--quality { --card-accent: #e8c878; }
  &--career { --card-accent: #43e7af; }
}

.development-card--career {
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  gap: 4px;
}

.development-card__head {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  flex: 0 0 auto;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(104, 200, 255, 0.12);

  h4 {
    margin: 0;
    color: #eef9ff;
    font-size: var(--fs-title);
    font-weight: 700;
    letter-spacing: 0.03em;
  }
}

.development-card__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--card-accent) 40%, transparent);
  border-radius: 2px;
  background: color-mix(in srgb, var(--card-accent) 12%, transparent);
  color: var(--card-accent);
  box-shadow: inset 0 0 12px color-mix(in srgb, var(--card-accent) 10%, transparent);
}

.development-status {
  padding: 4px 9px;
  border: 1px solid;
  border-radius: 2px;
  font-size: var(--fs-label);
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  &--low { border-color: rgba(74, 222, 128, 0.34); background: rgba(74, 222, 128, 0.1); color: #55e995; }
  &--medium { border-color: rgba(250, 204, 21, 0.36); background: rgba(250, 204, 21, 0.1); color: #facc15; }
  &--high { border-color: rgba(248, 91, 91, 0.42); background: rgba(248, 91, 91, 0.12); color: #ff7474; }
  &--blue { border-color: rgba(45, 206, 255, 0.34); background: rgba(45, 206, 255, 0.1); color: #65dfff; }
}

.development-card--quality .development-metrics,
.development-card--career .development-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(58px, auto));
  flex: 0 0 auto;
  gap: 8px;
  align-content: start;
  min-height: 0;

  :deep(.stu-hint) {
    min-width: 0;
    display: block;
    height: auto;
  }

  :deep(.stu-hint > div),
  > div {
    box-sizing: border-box;
    min-width: 0;
    min-height: 46px;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 4px 8px;
    border: 1px solid rgba(120, 200, 255, 0.16);
    border-radius: 3px;
    background: linear-gradient(160deg, rgba(0, 50, 95, 0.45), rgba(0, 28, 58, 0.5));
    box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.06);
  }

  :deep(.stu-hint > .q-metric.is-disc-alert),
  :deep(.stu-hint > div.is-disc-alert) {
    border-color: rgba(255, 140, 100, 0.4);
    background: linear-gradient(160deg, rgba(90, 36, 28, 0.5), rgba(28, 18, 40, 0.5));
  }

  span {
    display: block;
    color: #8ec2de;
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;
  }

  strong {
    display: block;
    overflow: visible;
    color: var(--card-accent);
    font-family: var(--student-font-number);
    font-size: 14px;
    line-height: 1.15;
    white-space: nowrap;

    small {
      color: #9fc2dd;
      font-family: var(--student-font-body);
      font-size: 11px;
    }

    &.is-safe { color: #55e995; font-family: var(--student-font-body); font-size: 13px; }
    &.is-text { color: #dff4ff; font-family: var(--student-font-body); font-size: 13px; }
    &.is-alert-num { color: #ff9b7a; }
  }

  em {
    display: block;
    overflow: hidden;
    color: #8fb7cd;
    font-size: 12px;
    font-style: normal;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.development-card--quality .development-metrics.development-metrics--quality {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr);
  height: 90px;

  :deep(.stu-hint > div),
  > div {
    min-height: 0;
    height: 100%;
    gap: 0;
    padding: 3px 8px;
  }

  span { font-size: 13px; }
  strong { font-size: 22px; }
  em { font-size: 12px; }
}

.development-metrics--pair {
  grid-template-rows: repeat(2, minmax(46px, auto));

  :deep(.stu-hint),
  :deep(.stu-hint > div) {
    height: auto;
    min-height: 46px;
  }
}

.quality-body {
  display: grid;
  grid-template-rows: 90px minmax(108px, 1fr) 42px;
  gap: 5px;
  min-height: 0;
  overflow: hidden;
}

.quality-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 8px;
  flex: 1 1 auto;
  min-height: 80px;
  overflow: hidden;
}

.quality-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 8px;
  overflow: hidden;
  border: 1px solid rgba(232, 200, 120, 0.18);
  border-radius: 4px;
  background: rgba(0, 36, 68, 0.4);

  &.is-alert {
    border-color: rgba(255, 140, 100, 0.35);
    background: rgba(70, 30, 28, 0.35);
  }

  > span {
    color: #e8c878;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 2px;
    overflow: hidden;
  }

  li,
  p {
    margin: 0;
    overflow: hidden;
    color: #c5e0f0;
    font-size: 14px;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__sub {
    margin-top: auto !important;
    color: #8eb8d4 !important;
    white-space: normal !important;
  }
}

.academic-body {
  display: grid;
  grid-template-columns: minmax(120px, 0.82fr) minmax(0, 1.18fr);
  grid-template-rows: auto auto 32px;
  gap: 4px 10px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: stretch;
  overflow: hidden;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb { background: rgba(0, 184, 255, 0.18); border-radius: 2px; }
}

.academic-gpa-wrap {
  display: grid;
  place-items: center;
  align-self: stretch;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(30, 214, 255, 0.14);
  border-radius: 4px;
  background:
    radial-gradient(circle at center, rgba(30, 214, 255, 0.1), transparent 62%),
    rgba(0, 35, 73, 0.24);
  gap: 2px;
}

.clickable-card,
.academic-gpa-wrap.clickable-card {
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.55);
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.14), inset 0 0 14px rgba(0, 212, 255, 0.06);
    background: rgba(0, 55, 105, 0.36);
  }
}

.gpa-gauge__label {
  color: #b8ecff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  white-space: nowrap;
}

.credit-bars__header {
  flex-shrink: 0;
  color: #b8ecff;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  margin-bottom: 2px;
}

.academic-kpis {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: auto;
  }
}

.academic-top {
  display: none;
}

.academic-kpi {
  min-width: 0;
  overflow: hidden;
  padding: 6px 8px;
  border: 1px solid rgba(120, 200, 255, 0.16);
  border-radius: 3px;
  background: rgba(0, 36, 72, 0.4);

  span {
    display: block;
    color: #8eb8d8;
    font-size: 15px;
    font-weight: 600;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: #e8f7ff;
    font-family: var(--student-font-number);
    font-size: 15px;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;

    &.up { color: #55e995; }
    &.down { color: #ff7474; }
  }
}

.gpa-gauge {
  position: relative;
  display: grid;
  place-items: center;
  margin: 0 auto;

  svg { width: 80px; height: 80px; transform: rotate(-90deg); }
  &__track { fill: none; stroke: rgba(80, 120, 160, 0.35); stroke-width: 6; }
  &__value {
    fill: none;
    stroke: #62dfff;
    stroke-width: 6;
    stroke-linecap: round;
  }

  &__text {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;

    strong {
      color: #7ff6ff;
      font-family: var(--student-font-number);
      font-size: 13px;
      line-height: 1;
    }
    span { color: #8eb8d8; font-size: 11px; font-weight: 700; }
  }
}

.academic-note-wrap {
  grid-column: 1 / -1;
  min-height: 40px;
  overflow: hidden;
}

.academic-hero__note {
  margin: 0;
  min-height: 40px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  padding: 6px 10px;
  border: 1px solid rgba(0, 190, 255, 0.12);
  border-radius: 4px;
  background: rgba(0, 35, 73, 0.28);
  color: #c5e0f0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;

  em { font-style: normal; }
}

.fail-chip {
  width: 100%;
  min-height: 42px;
  padding: 6px 8px;
  border: 1px solid;
  border-radius: 3px;
  font-size: 15px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &--low { border-color: rgba(74, 222, 128, 0.35); background: rgba(74, 222, 128, 0.1); color: #55e995; }
  &--medium { border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { border-color: rgba(248, 91, 91, 0.45); background: rgba(248, 91, 91, 0.14); color: #ff7474; }
}

.credit-bars {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 5px 8px;
  border: 1px solid rgba(0, 190, 255, 0.12);
  border-radius: 4px;
  background: rgba(0, 35, 73, 0.28);

  :deep(.stu-hint--block) {
    display: block;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(56px, 1fr));
    gap: 4px;
  }

  &__total {
    margin-top: 2px;
    padding-top: 3px;
    border-top: 1px dashed rgba(120, 190, 240, 0.18);
    color: #9ecae8;
    font-size: 13px;
    font-weight: 600;
  }

  &__row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    span { color: #9ecae8; font-size: 13px; font-weight: 600; text-align: center; }
    i {
      width: 100%;
      height: 5px;
      overflow: hidden;
      border-radius: 99px;
      background: rgba(0, 60, 100, 0.55);
      b {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #1ed6ff, #43e7af);
      }
    }
    em {
      color: #cfe6f8;
      font-size: 12px;
      font-style: normal;
      text-align: center;
      white-space: nowrap;
    }
  }

  @at-root .credit-bars__grid > :nth-child(1) .credit-bars__row i b { background: linear-gradient(90deg, #1ed6ff, #4cc9f0); }
  @at-root .credit-bars__grid > :nth-child(2) .credit-bars__row i b { background: linear-gradient(90deg, #43e7af, #67e8a3); }
  @at-root .credit-bars__grid > :nth-child(3) .credit-bars__row i b { background: linear-gradient(90deg, #e8c878, #facc15); }
}

.thesis-steps {
  padding: 8px;
  border: 1px solid rgba(0, 190, 255, 0.14);
  border-radius: 4px;
  background: rgba(0, 35, 73, 0.34);

  > span { color: #b6e4ff; font-size: 15px; font-weight: 700; }

  ol {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 7px 2px;
    border-radius: 3px;
    background: rgba(0, 50, 90, 0.45);
    color: #7aa4c0;
    font-size: 15px;
    font-weight: 700;
    text-align: center;

    &.done {
      background: rgba(30, 120, 200, 0.35);
      color: #7ff6ff;
      box-shadow: inset 0 0 0 1px rgba(100, 200, 255, 0.35);
    }

    &.current {
      background: rgba(30, 160, 255, 0.45);
      color: #eaf8ff;
    }
  }
}

.career-matches {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 0;
  padding: 5px 6px;
  overflow-x: hidden;
  border: 1px solid rgba(67, 231, 175, 0.12);
  border-radius: 5px;
  background: rgba(0, 50, 69, 0.25);
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__label {
    flex: 1 1 100%;
    font-size: 13px;
    font-weight: 700;
    color: #b8ecff;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  &__empty {
    flex: 1 1 100%;
    margin: 0;
    padding: 10px;
    color: #8fb7cd;
    font-size: 14px;
    font-weight: 600;
    text-align: center;
    line-height: 1.4;
  }

  :deep(.stu-hint) {
    min-width: 0;
    flex: 0 0 38%;
  }

  :deep(.stu-hint:only-child) {
    flex: 0 0 38%;
  }
}

.career-benchmark-block {
  flex: 0 0 55%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;

  p {
    margin: 0;
    display: flex;
    gap: 4px;
    align-items: baseline;
    font-size: 13px;
    line-height: 1.25;
    white-space: nowrap;
  }

  em {
    color: #43e7af;
    font-style: normal;
    font-weight: 700;
    font-size: 12px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  span {
    color: #c5e4f6;
    font-weight: 600;
    font-size: 12px;
    white-space: nowrap;
  }
}

.quality-panel li {
  position: relative;
  min-width: 0;
  padding: 1px 0 1px 10px;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.quality-panel li::before {
  position: absolute;
  top: 50%;
  left: 1px;
  width: 4px;
  height: 4px;
  transform: translateY(-50%);
  border-radius: 50%;
  background: #e8c878;
  box-shadow: 0 0 6px rgba(232, 200, 120, 0.55);
  content: '';
}

.quality-panel__more {
  margin: auto 0 0 !important;
  padding-top: 3px;
  border-top: 1px dashed rgba(232, 200, 120, 0.2);
  color: #d8bd72 !important;
  font-size: 14px !important;
  line-height: 1.2 !important;
  white-space: nowrap !important;
}

.career-match-rich {
  flex: 0 0 38%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;

    span {
      overflow: hidden;
      color: #c5e4f6;
      font-size: 13px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: #5ce8bd;
      font-family: var(--student-font-number);
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
    }
  }

  > i {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);

    b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #20c997, #52e8bf); }
  }

  small {
    display: flex;
    flex-wrap: nowrap;
    gap: 3px 6px;
    color: #8fb7cd;
    font-size: 12px;

    em {
      font-style: normal;
      padding: 1px 0;
      white-space: nowrap;
    }
  }
}

.academic-graduation-brief {
  grid-column: 1 / -1;
  min-width: 0;
  min-height: 28px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  gap: 4px;

  .graduation-brief-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    padding: 3px 6px;
    border: 1px solid rgba(120, 200, 255, 0.16);
    border-radius: 3px;
    background: linear-gradient(160deg, rgba(0, 50, 95, 0.45), rgba(0, 28, 58, 0.5));

    span {
      display: block;
      color: #8ec2de;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    strong {
      display: block;
      overflow: hidden;
      color: #dff4ff;
      font-size: 12px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-low { color: #55e995; }
      &.is-medium { color: #facc15; }
      &.is-high { color: #ff7474; }
    }
  }

  .graduation-brief-btn {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid rgba(0, 212, 255, 0.28);
    border-radius: 3px;
    background: linear-gradient(180deg, rgba(0, 90, 160, 0.32), rgba(0, 50, 100, 0.28));
    color: #8ee9ff;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: rgba(0, 212, 255, 0.5);
      background: linear-gradient(180deg, rgba(0, 110, 190, 0.42), rgba(0, 60, 120, 0.38));
    }
  }
}

.graduation-progress {
  display: flex !important;
  align-items: center;
  gap: 7px;

  i {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
  }

  &--low { color: #55e995 !important; }
  &--medium { color: #facc15 !important; }
  &--high { color: #ff7474 !important; }
}

.graduation-thesis {
  padding: 6px 8px !important;
}

.graduation-tasks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 4px 6px;
  min-height: 0;
  overflow: hidden;

  :deep(.stu-hint--block) {
    min-width: 0;
    display: block;
    height: 100%;
  }

  :deep(.stu-hint > div),
  > div {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    gap: 6px;
    align-items: center;
    height: 100%;
    padding: 4px 8px;
    border: 1px solid rgba(126, 184, 255, 0.16);
    border-radius: 4px;
    background: rgba(30, 50, 100, 0.28);
  }

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7aa4c0;
  }

  span {
    overflow: hidden;
    color: #d8eeff;
    font-size: 15px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    color: #9ecae8;
    font-size: 14px;
    font-style: normal;
    white-space: nowrap;
  }

  .done {
    border-color: rgba(74, 222, 128, 0.28);
    i { background: #55e995; box-shadow: 0 0 8px rgba(85, 233, 149, 0.45); }
    span { color: #9ef0c2; }
  }
}

.development-insight {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 6px 10px;
  border-left: 2px solid var(--card-accent);
  border-radius: 3px;
  background: color-mix(in srgb, var(--card-accent) 7%, rgba(0, 28, 60, 0.7));

  span {
    padding: 4px 9px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--card-accent) 12%, transparent);
    color: var(--card-accent);
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
  }

  p {
    margin: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: #c2e0f0;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.45;
  }
}

.development-card--career .development-insight p {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.development-card__action {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 0;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--card-accent) 28%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-accent) 10%, transparent);
  color: color-mix(in srgb, var(--card-accent) 82%, white);
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 50%, transparent);
    background: color-mix(in srgb, var(--card-accent) 16%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .development-slide {
    transition: none;
  }
}
</style>
