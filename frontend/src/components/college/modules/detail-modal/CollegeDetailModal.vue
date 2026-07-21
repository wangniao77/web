<script setup lang="ts">
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import type { EChartsOption } from 'echarts'
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import StudentFlowSankeyChart from '@/components/college/modules/student-dev/StudentFlowSankeyChart.vue'
import StudentDevDetailContent from '@/components/college/modules/student-dev/StudentDevDetailContent.vue'
import BenchmarkDetailContent from '@/components/college/modules/benchmark/BenchmarkDetailContent.vue'
import TeacherDetailContent from '@/components/college/modules/teacher/TeacherDetailContent.vue'
import DisciplineDetailContent from '@/components/college/modules/discipline/DisciplineDetailContent.vue'
import EnrollmentEmploymentDetailContent from '@/components/college/modules/enrollment-employment/EnrollmentEmploymentDetailContent.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import {
  COLLEGE_SIMULATED_DATA_HINT,
  isCollegeSimulatedDetailKind,
  isCollegeSimulatedWarning,
} from '@/constants/college/simulated-modules'
import { collegeDetailService } from '@/api/college/services/details'
import { studentDevService } from '@/api/college/services/student-dev'
import { benchmarkService } from '@/api/college/services/benchmark'
import { teacherService } from '@/api/college/services/teacher'
import { disciplineService } from '@/api/college/services/discipline'
import { enrollmentEmploymentService } from '@/api/college/services/enrollment-employment'
import { ROUTES } from '@/constants/routes'
import type { EmploymentRosterDTO, RosterStudentDTO } from '@/api/college/details'
import { useCollegeDetail } from './useCollegeDetail'
import { useScope } from '@/composables/useScope'
import type { HighPotentialModuleId, WarningCategoryType } from '@/types/college/api/high-potential'
import type { EvaluationIndicatorKey } from '@/types/college/api/student-dev-quality'
import type {
  StudentDevDetailVM,
  StudentEvaluationDetailVM,
  StudentFlowSankeyVM,
} from '@/types/college/view/student-dev-quality'
import type { BenchmarkAchievementsDetailVM } from '@/types/college/view/benchmark-achievements'
import type { TeacherAnalyticsDetailVM } from '@/types/college/view/teacher-analytics'
import type { DisciplineOverviewDetailVM } from '@/types/college/view/discipline-overview'
import type { EnrollmentEmploymentDetailVM } from '@/types/college/view/enrollment-employment'
import type {
  EmploymentDetailVM,
  HighPotentialModuleVM,
  HighPotentialOverviewVM,
  KeyTasksDetailVM,
  ResearchPlatformsDetailVM,
  TeachingCoursesDetailVM,
  WarningDetailVM,
} from '@/types/college/view/details'

const { state, closeCollegeDetail } = useCollegeDetail()
const { collegeScope } = useScope()
const router = useRouter()

const loading = ref(false)
const keyTasks = ref<KeyTasksDetailVM | null>(null)
const hpOverview = ref<HighPotentialOverviewVM | null>(null)
const warning = ref<WarningDetailVM | null>(null)
const teaching = ref<TeachingCoursesDetailVM | null>(null)
const research = ref<ResearchPlatformsDetailVM | null>(null)
const employment = ref<EmploymentDetailVM | null>(null)
const hpRoster = ref<RosterStudentDTO[]>([])
const warningRoster = ref<RosterStudentDTO[]>([])
const empRoster = ref<EmploymentRosterDTO[]>([])
const flowSankey = ref<StudentFlowSankeyVM | null>(null)
const evaluationDetail = ref<StudentEvaluationDetailVM | null>(null)
const studentDevDetail = ref<StudentDevDetailVM | null>(null)
const benchmarkDetail = ref<BenchmarkAchievementsDetailVM | null>(null)
const teacherDetail = ref<TeacherAnalyticsDetailVM | null>(null)
const disciplineDetail = ref<DisciplineOverviewDetailVM | null>(null)
const enrollmentEmploymentDetail = ref<EnrollmentEmploymentDetailVM | null>(null)

const hpModule = computed<HighPotentialModuleVM | null>(() => {
  if (state.kind !== 'high-potential' || !hpOverview.value) return null
  return hpOverview.value.modules.find((m) => m.id === state.id) ?? null
})

const moduleIcon: Record<string, IconKind> = {
  academic: 'academic',
  competition: 'trophy',
  leadership: 'community',
  rural: 'event',
  internship: 'briefcase',
  career: 'placement',
}

const titleMap: Record<string, { icon: IconKind; title: string }> = {
  'key-tasks': { icon: 'task', title: '年度重点规划进展' },
  'high-potential': { icon: 'potential', title: '人才培养画像 · 高潜' },
  'high-potential-overview': { icon: 'potential', title: '人才培养画像 · 高潜' },
  warning: { icon: 'warning', title: '预警与风险监测' },
  teaching: { icon: 'academic', title: '教学质量与运行' },
  research: { icon: 'research', title: '科研创新与团队平台' },
  employment: { icon: 'students', title: '学生就业与前景' },
  'student-flow': { icon: 'students', title: '学生入口 · 出口流向' },
  'student-evaluation': { icon: 'academic', title: '学生评价指标' },
  'student-dev-detail': { icon: 'students', title: '人才培养画像' },
  'benchmark-detail': { icon: 'trophy', title: '精品成果集萃' },
  'teacher-detail': { icon: 'faculty', title: '师资支撑详情' },
  'discipline-detail': { icon: 'ranking', title: '专业发展详情' },
  'enrollment-employment': { icon: 'employment', title: '生源与就业质量' },
}

const headerIcon = computed<IconKind>(() => (state.kind ? titleMap[state.kind]?.icon ?? 'status' : 'status'))
const headerTitle = computed(() => (state.kind ? titleMap[state.kind]?.title ?? '详情' : '详情'))
const headerSubtitle = computed(() => {
  switch (state.kind) {
    case 'key-tasks':
      return '总体概况 · 任务过程 · 风险预警 · 分析维度'
    case 'high-potential':
      return hpModule.value ? `${hpModule.value.title} · 学生名单与画像` : '维度详情'
    case 'high-potential-overview':
      return '高潜学生总览与各维度分布'
    case 'warning':
      return warning.value ? `${warning.value.label} · 学生名单` : '预警名单'
    case 'teaching':
      return '课程建设明细'
    case 'research':
      return '科研平台与团队明细'
    case 'employment':
      return '毕业去向与就业质量分析'
    case 'student-flow':
      return '高考生源录取与应届毕业去向桑基分析'
    case 'student-evaluation':
      return evaluationDetail.value?.label ?? '教评指标详情'
    case 'student-dev-detail':
      return '毕业去向 · 薪资 · 高考 · 高潜与预警细分'
    case 'benchmark-detail':
      return '精品成果专题 · 平台 / 师资 / 教学科研与竞赛'
    case 'teacher-detail':
      return '教师专题分析 · 考核指标与师资对比'
    case 'discipline-detail':
      return '专业发展全景 · 基础概况 / 师资 / 成果 / 生源育人 / 对标研判'
    case 'enrollment-employment':
      return '招生入口与毕业出口专题分析'
    default:
      return ''
  }
})

function warningLevelClass(level: string) {
  if (level.includes('红')) return 'lv-red'
  if (level.includes('橙')) return 'lv-orange'
  if (level.includes('黄')) return 'lv-yellow'
  return 'lv-blue'
}

// ===== 年度重点规划分析筛选 =====
const planFilterYear = ref('全部')
const planFilterDomain = ref('全部')
const planFilterType = ref('全部')
const planFilterOwner = ref('全部')
const planFilterLevel = ref('全部')
const planFilterMajor = ref('全部')
const planFilterStatus = ref('全部')

const filteredPlanTasks = computed(() => {
  if (!keyTasks.value) return []
  return keyTasks.value.tasks.filter((t) => {
    if (planFilterYear.value !== '全部' && keyTasks.value?.year !== planFilterYear.value) return false
    if (planFilterDomain.value === '科研' && t.category !== 'research') return false
    if (planFilterDomain.value === '教学' && t.category !== 'teaching') return false
    if (planFilterType.value !== '全部' && t.taskType !== planFilterType.value) return false
    if (planFilterOwner.value !== '全部' && t.leadDept !== planFilterOwner.value) return false
    if (planFilterLevel.value !== '全部' && t.projectLevel !== planFilterLevel.value) return false
    if (planFilterMajor.value !== '全部' && t.majorDirection !== planFilterMajor.value) return false
    if (planFilterStatus.value !== '全部' && t.statusLabel !== planFilterStatus.value) return false
    return true
  })
})

const planRiskTasks = computed(() =>
  filteredPlanTasks.value.filter((t) => t.statusClass === 'status-delayed' || t.riskReason),
)

function resetPlanFilters() {
  planFilterYear.value = '全部'
  planFilterDomain.value = '全部'
  planFilterType.value = '全部'
  planFilterOwner.value = '全部'
  planFilterLevel.value = '全部'
  planFilterMajor.value = '全部'
  planFilterStatus.value = '全部'
}

// ===== 学生名单（花名册）筛选 =====
const filterText = ref('')
const filterClass = ref('')
const filterCounselor = ref('')
const filterMajor = ref('')
const filterGrade = ref('')
const filterLevel = ref('')

const isWarning = computed(() => state.kind === 'warning')
const showRoster = computed(
  () =>
    state.kind === 'high-potential' ||
    state.kind === 'high-potential-overview' ||
    state.kind === 'warning',
)

const baseRoster = computed(() => {
  if (state.kind === 'high-potential' || state.kind === 'high-potential-overview') return hpRoster.value
  if (state.kind === 'warning') return warningRoster.value
  return []
})

const classOptions = computed(() => Array.from(new Set(baseRoster.value.map((s) => s.className))))
const counselorOptions = computed(() => Array.from(new Set(baseRoster.value.map((s) => s.counselor))))
const majorOptions = computed(() => Array.from(new Set(baseRoster.value.map((s) => s.major))))
const gradeOptions = computed(() => Array.from(new Set(baseRoster.value.map((s) => s.grade))))
const levelOptions = computed(() =>
  Array.from(new Set(baseRoster.value.map((s) => s.warnLevel).filter((v): v is string => !!v))),
)

const rosterRows = computed(() => {
  const kw = filterText.value.trim()
  return baseRoster.value
    .filter((s) => !filterClass.value || s.className === filterClass.value)
    .filter((s) => !filterCounselor.value || s.counselor === filterCounselor.value)
    .filter((s) => !filterMajor.value || s.major === filterMajor.value)
    .filter((s) => !filterGrade.value || s.grade === filterGrade.value)
    .filter((s) => !filterLevel.value || s.warnLevel === filterLevel.value)
    .filter(
      (s) =>
        !kw ||
        [s.name, s.studentId, s.className, s.counselor, s.dorm, s.major, s.phone].some((v) =>
          v.includes(kw),
        ),
    )
    .map((s) => ({ ...s, dormmates: [] as { name: string; kind: string }[] }))
})

// ===== 就业毕业生名单筛选 =====
const empFilterText = ref('')
const empFilterDirection = ref('')
const empFilterRegion = ref('')
const empFilterClass = ref('')

const empBase = computed(() => (state.kind === 'employment' ? empRoster.value : []))
const empDirectionOptions = computed(() => Array.from(new Set(empBase.value.map((s) => s.direction))))
const empRegionOptions = computed(() => Array.from(new Set(empBase.value.map((s) => s.region))))
const empClassOptions = computed(() => Array.from(new Set(empBase.value.map((s) => s.className))))

const empRows = computed(() => {
  const kw = empFilterText.value.trim()
  return empBase.value
    .filter((s) => !empFilterDirection.value || s.direction === empFilterDirection.value)
    .filter((s) => !empFilterRegion.value || s.region === empFilterRegion.value)
    .filter((s) => !empFilterClass.value || s.className === empFilterClass.value)
    .filter(
      (s) =>
        !kw ||
        [s.name, s.studentId, s.className, s.major, s.counselor, s.unit].some((v) => v.includes(kw)),
    )
})

const rosterTotal = computed(() => {
  if (state.kind === 'warning') return warningRoster.value.length
  if (state.kind === 'high-potential' || state.kind === 'high-potential-overview') return hpRoster.value.length
  return 0
})

const rosterTitle = computed(() => {
  if (state.kind === 'warning') return `${warning.value?.label ?? '预警'}学生名单`
  if (state.kind === 'high-potential') return `${hpModule.value?.title ?? '高潜'}学生名单`
  return '全部高潜学生名单'
})

function resetFilters() {
  filterText.value = ''
  filterClass.value = ''
  filterCounselor.value = ''
  filterMajor.value = ''
  filterGrade.value = ''
  filterLevel.value = ''
  empFilterText.value = ''
  empFilterDirection.value = ''
  empFilterRegion.value = ''
  empFilterClass.value = ''
  resetPlanFilters()
}

async function load() {
  if (!state.kind) return
  loading.value = true
  const scope = collegeScope.value
  try {
    switch (state.kind) {
      case 'key-tasks':
        keyTasks.value = await collegeDetailService.fetchKeyTasksDetail(scope)
        break
      case 'high-potential':
      case 'high-potential-overview':
        hpOverview.value = await collegeDetailService.fetchHighPotentialOverview(scope)
        hpRoster.value = await collegeDetailService.fetchHighPotentialRoster({
          ...scope,
          moduleId:
            state.kind === 'high-potential'
              ? ((state.id ?? undefined) as HighPotentialModuleId | undefined)
              : undefined,
        })
        break
      case 'warning':
        warning.value = await collegeDetailService.fetchWarningDetail(
          (state.id ?? 'academic') as WarningCategoryType,
          scope,
        )
        warningRoster.value = await collegeDetailService.fetchWarningRoster(
          (state.id ?? 'academic') as WarningCategoryType,
          scope,
        )
        break
      case 'teaching':
        teaching.value = await collegeDetailService.fetchTeachingCoursesDetail(scope)
        break
      case 'research':
        research.value = await collegeDetailService.fetchResearchPlatformsDetail(scope)
        break
      case 'employment':
        employment.value = await collegeDetailService.fetchEmploymentDetail(scope)
        empRoster.value = await collegeDetailService.fetchEmploymentRoster(scope)
        break
      case 'student-flow':
        flowSankey.value = await studentDevService.fetchStudentFlowSankey(scope)
        break
      case 'student-evaluation':
        evaluationDetail.value = await studentDevService.fetchStudentEvaluationDetail(
          (state.id ?? 'academic') as EvaluationIndicatorKey,
          scope,
        )
        break
      case 'student-dev-detail':
        studentDevDetail.value = await studentDevService.fetchStudentDevDetail(scope)
        break
      case 'benchmark-detail':
        benchmarkDetail.value = await benchmarkService.fetchBenchmarkDetail(scope)
        break
      case 'teacher-detail':
        teacherDetail.value = await teacherService.fetchTeacherDetail(scope)
        break
      case 'discipline-detail':
        disciplineDetail.value = await disciplineService.fetchDisciplineDetail(scope)
        break
      case 'enrollment-employment':
        enrollmentEmploymentDetail.value = await enrollmentEmploymentService.fetchEnrollmentEmploymentDetail(scope)
        break
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => [state.visible, state.kind, state.id],
  () => {
    if (state.visible) {
      resetFilters()
      load()
    }
  },
  { immediate: true },
)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && state.visible) closeCollegeDetail()
}

const evaluationTrendOption = computed<EChartsOption>(() => {
  if (!evaluationDetail.value) return {}
  return {
    grid: { left: 8, right: 12, top: 16, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 20 },
    },
    xAxis: {
      type: 'category' as const,
      boundaryGap: false,
      data: evaluationDetail.value.trend.months,
      axisLabel: { color: '#c6e6ff', fontSize: 20 },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#c6e6ff', fontSize: 20 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [{
      type: 'line' as const,
      smooth: true,
      data: evaluationDetail.value.trend.values,
      lineStyle: { width: 3, color: '#39e6ff' },
      areaStyle: { color: 'rgba(57,230,255,0.12)' },
    }],
  }
})

function goToStudentProfile(studentId: string) {
  closeCollegeDetail()
  router.push({ path: ROUTES.student, query: { studentId } })
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="cdm-fade">
      <div v-if="state.visible" class="cdm-mask" @click.self="closeCollegeDetail">
        <div class="cdm-panel" role="dialog" aria-modal="true">
          <header class="cdm-head">
            <span class="cdm-head__icon"><DashIcon :kind="headerIcon" :size="22" /></span>
            <div class="cdm-head__text">
              <h2>
                {{ headerTitle }}
                <span
                  v-if="isCollegeSimulatedDetailKind(state.kind) || (state.kind === 'warning' && isCollegeSimulatedWarning(state.id))"
                  class="sim-data-badge"
                  :title="COLLEGE_SIMULATED_DATA_HINT"
                  aria-label="模拟数据"
                >
                  模拟数据
                </span>
              </h2>
              <span>{{ headerSubtitle }}</span>
            </div>
            <button type="button" class="cdm-close" @click="closeCollegeDetail" aria-label="关闭">×</button>
          </header>

          <div class="cdm-body">
            <div v-if="loading" class="cdm-loading">加载中...</div>

            <!-- 年度重点任务 -->
            <template v-else-if="state.kind === 'key-tasks' && keyTasks">
              <div class="cdm-stat-row">
                <div class="cdm-stat"><span>重点任务总数</span><strong>{{ keyTasks.summary.total }}</strong></div>
                <div class="cdm-stat cdm-stat--green"><span>已完成</span><strong>{{ keyTasks.summary.completed }}</strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>推进中</span><strong>{{ keyTasks.summary.ongoing }}</strong></div>
                <div class="cdm-stat cdm-stat--orange"><span>需关注</span><strong>{{ keyTasks.summary.delayed }}</strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>年度总体完成率</span><strong>{{ keyTasks.summary.completionRate }}<small>%</small></strong></div>
              </div>

              <div class="cdm-section">
                <h3>分析维度</h3>
                <div class="cdm-plan-filters">
                  <label>
                    <span>年度</span>
                    <select v-model="planFilterYear">
                      <option v-for="y in keyTasks.filterOptions.years" :key="y" :value="y">{{ y }}</option>
                    </select>
                  </label>
                  <label>
                    <span>科研 / 教学</span>
                    <select v-model="planFilterDomain">
                      <option v-for="d in keyTasks.filterOptions.domains" :key="d" :value="d">{{ d }}</option>
                    </select>
                  </label>
                  <label>
                    <span>任务类型</span>
                    <select v-model="planFilterType">
                      <option v-for="t in keyTasks.filterOptions.taskTypes" :key="t" :value="t">{{ t }}</option>
                    </select>
                  </label>
                  <label>
                    <span>责任人</span>
                    <select v-model="planFilterOwner">
                      <option v-for="o in keyTasks.filterOptions.owners" :key="o" :value="o">{{ o }}</option>
                    </select>
                  </label>
                  <label>
                    <span>项目级别</span>
                    <select v-model="planFilterLevel">
                      <option v-for="l in keyTasks.filterOptions.projectLevels" :key="l" :value="l">{{ l }}</option>
                    </select>
                  </label>
                  <label>
                    <span>专业方向</span>
                    <select v-model="planFilterMajor">
                      <option v-for="m in keyTasks.filterOptions.majorDirections" :key="m" :value="m">{{ m }}</option>
                    </select>
                  </label>
                  <label>
                    <span>进度状态</span>
                    <select v-model="planFilterStatus">
                      <option v-for="s in keyTasks.filterOptions.statuses" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </label>
                  <button type="button" class="cdm-plan-filters__reset" @click="resetPlanFilters">重置</button>
                </div>
              </div>

              <div v-if="planRiskTasks.length" class="cdm-section">
                <h3>风险预警</h3>
                <div class="cdm-cards">
                  <div v-for="t in planRiskTasks" :key="`risk-${t.id}`" class="cdm-task cdm-task--risk">
                    <div class="cdm-task__top">
                      <strong>{{ t.name }}</strong>
                      <em class="tag--status-delayed">需关注</em>
                    </div>
                    <p class="cdm-task__desc">{{ t.riskReason || t.description }}</p>
                    <div class="cdm-task__meta">
                      <span>当前处理状态：{{ t.handleStatus || '跟进中' }}</span>
                      <span>责任人：{{ t.leadDept }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="cdm-section">
                <h3>任务过程管理 <small>（{{ filteredPlanTasks.length }}）</small></h3>
                <div class="cdm-cards">
                  <div v-for="t in filteredPlanTasks" :key="t.id" class="cdm-task">
                    <div class="cdm-task__top">
                      <strong>
                        <small v-if="t.categoryLabel" class="cdm-task__cat">{{ t.categoryLabel }}</small>
                        {{ t.name }}
                      </strong>
                      <em :class="`tag--${t.statusClass}`">{{ t.statusLabel }}</em>
                    </div>
                    <div class="cdm-task__bar"><i :style="{ width: t.progress + '%' }" /></div>
                    <div class="cdm-plan-grid">
                      <div><span>年度目标值</span><strong>{{ t.target ?? '—' }}{{ t.unit }}</strong></div>
                      <div><span>当前完成值</span><strong>{{ t.actual ?? '—' }}{{ t.unit }}</strong></div>
                      <div><span>完成率</span><strong>{{ t.progress }}%</strong></div>
                      <div><span>责任人</span><strong>{{ t.leadDept }}</strong></div>
                      <div><span>计划完成时间</span><strong>{{ t.deadline }}</strong></div>
                      <div><span>当前里程碑</span><strong>{{ t.milestone || t.milestones.find((m) => !m.done)?.label || '—' }}</strong></div>
                    </div>
                    <div v-if="t.materials?.length" class="cdm-task__meta">
                      <span>支撑材料：{{ t.materials.join(' · ') }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- 高潜 · 单维度 -->
            <template v-else-if="state.kind === 'high-potential' && hpModule">
              <p class="cdm-desc">{{ hpModule.desc }}</p>
              <div v-if="hpModule.stats?.length" class="cdm-stat-row">
                <div v-for="s in hpModule.stats" :key="s.label" class="cdm-stat">
                  <span>{{ s.label }}</span><strong>{{ s.value }}<small v-if="s.unit">{{ s.unit }}</small></strong>
                </div>
              </div>
              <div v-if="hpModule.highlights?.length" class="cdm-stat-row">
                <div v-for="s in hpModule.highlights" :key="s.label" class="cdm-stat cdm-stat--blue">
                  <span>{{ s.label }}</span><strong>{{ s.value }}<small v-if="s.unit">{{ s.unit }}</small></strong>
                </div>
              </div>
              <div v-if="hpModule.tags?.length" class="cdm-tags">
                <span v-for="tag in hpModule.tags" :key="tag">{{ tag }}</span>
              </div>
              <div v-if="hpModule.timeline?.length" class="cdm-section">
                <h3>近期动态</h3>
                <ul class="cdm-timeline">
                  <li v-for="it in hpModule.timeline" :key="`${it.date}-${it.title}`">
                    <span>{{ it.date }}</span><strong>{{ it.title }}</strong><em>{{ it.level }}</em>
                  </li>
                </ul>
              </div>
              <div v-if="hpModule.aiRecommend?.length" class="cdm-section">
                <h3>AI 培养建议</h3>
                <ul class="cdm-bullets"><li v-for="x in hpModule.aiRecommend" :key="x">{{ x }}</li></ul>
              </div>
              <div v-if="hpModule.events?.length" class="cdm-section">
                <h3>典型事迹</h3>
                <ul class="cdm-bullets"><li v-for="x in hpModule.events" :key="x">{{ x }}</li></ul>
              </div>
            </template>

            <!-- 高潜 · 总览 -->
            <template v-else-if="state.kind === 'high-potential-overview' && hpOverview">
              <div class="cdm-stat-row">
                <div class="cdm-stat"><span>高潜学生总数</span><strong>{{ hpOverview.summary.total }}<small>人</small></strong></div>
                <div class="cdm-stat cdm-stat--green"><span>本学期变化</span><strong>{{ hpOverview.summary.change }}</strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>高潜覆盖率</span><strong>{{ hpOverview.summary.coverage }}</strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>活跃度</span><strong>{{ hpOverview.summary.activeRate }}</strong></div>
              </div>
              <div v-if="hpOverview.summary.kpis?.length" class="cdm-stat-row">
                <div v-for="k in hpOverview.summary.kpis" :key="k.label" class="cdm-stat">
                  <span>{{ k.label }}</span><strong>{{ k.value }}<small v-if="k.unit">{{ k.unit }}</small></strong>
                </div>
              </div>
              <div class="cdm-section">
                <h3>各维度分布</h3>
                <div class="cdm-cards cdm-cards--3">
                  <div v-for="m in hpOverview.modules" :key="m.id" class="cdm-hp-card">
                    <span class="cdm-hp-card__icon"><DashIcon :kind="moduleIcon[m.id] || 'potential'" :size="20" /></span>
                    <strong class="cdm-hp-card__title">{{ m.title }}</strong>
                    <span class="cdm-hp-card__metric">{{ m.cardMetric.value }}<small v-if="m.cardMetric.unit">{{ m.cardMetric.unit }}</small></span>
                    <span class="cdm-hp-card__label">{{ m.cardMetric.label }}</span>
                    <p class="cdm-hp-card__desc">{{ m.desc }}</p>
                  </div>
                </div>
              </div>
            </template>

            <!-- 预警概览（名单见下方花名册） -->
            <template v-else-if="state.kind === 'warning' && warning">
              <div class="cdm-stat-row">
                <div class="cdm-stat cdm-stat--orange"><span>{{ warning.label }}人数</span><strong>{{ rosterTotal }}<small>人</small></strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>重点关注名单</span><strong>{{ baseRoster.length }}<small>人</small></strong></div>
              </div>
            </template>

            <!-- 教学课程明细 -->
            <template v-else-if="state.kind === 'teaching' && teaching">
              <table class="cdm-table">
                <thead>
                  <tr><th>课程名称</th><th>级别</th><th>负责人</th><th>学时</th><th>选课人数</th><th>状态</th></tr>
                </thead>
                <tbody>
                  <tr v-for="c in teaching.courses" :key="c.name">
                    <td>{{ c.name }}</td>
                    <td><em class="cdm-badge">{{ c.level }}</em></td>
                    <td>{{ c.leader }}</td>
                    <td>{{ c.hours }}</td>
                    <td>{{ c.students }}</td>
                    <td>{{ c.status }}</td>
                  </tr>
                </tbody>
              </table>
            </template>

            <!-- 科研平台明细 -->
            <template v-else-if="state.kind === 'research' && research">
              <div v-for="cat in research.categories" :key="cat.category" class="cdm-section">
                <h3>{{ cat.category }}</h3>
                <table class="cdm-table">
                  <thead>
                    <tr><th>平台/团队名称</th><th>级别</th><th>负责人</th><th>成员数</th><th>成立时间</th></tr>
                  </thead>
                  <tbody>
                    <tr v-for="it in cat.items" :key="it.name">
                      <td>{{ it.name }}</td>
                      <td><em class="cdm-badge">{{ it.level }}</em></td>
                      <td>{{ it.leader }}</td>
                      <td>{{ it.members }}</td>
                      <td>{{ it.foundedAt }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </template>

            <!-- 就业详情 -->
            <template v-else-if="state.kind === 'employment' && employment">
              <div class="cdm-stat-row">
                <div v-for="o in employment.overview" :key="o.label" class="cdm-stat">
                  <span>{{ o.label }}</span><strong>{{ o.value }}<small v-if="o.unit">{{ o.unit }}</small></strong>
                </div>
              </div>
              <div class="cdm-section">
                <h3>就业去向分布</h3>
                <div class="cdm-cards cdm-cards--3">
                  <div v-for="d in employment.byDirection" :key="d.name" class="cdm-dir">
                    <div class="cdm-dir__top"><strong>{{ d.name }}</strong><em>{{ d.percent }}%</em></div>
                    <div class="cdm-dir__count">{{ d.count }} 人</div>
                    <p>{{ d.note }}</p>
                  </div>
                </div>
              </div>
              <div class="cdm-section">
                <h3>主要就业单位</h3>
                <table class="cdm-table">
                  <thead><tr><th>单位名称</th><th>行业</th><th>录用人数</th><th>平均起薪</th></tr></thead>
                  <tbody>
                    <tr v-for="e in employment.topEmployers" :key="e.name">
                      <td>{{ e.name }}</td><td>{{ e.industry }}</td><td>{{ e.count }}</td><td>{{ e.avgSalary }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="cdm-section">
                <h3>各专业就业情况</h3>
                <table class="cdm-table">
                  <thead><tr><th>专业</th><th>就业率</th><th>毕业人数</th><th>主要去向</th></tr></thead>
                  <tbody>
                    <tr v-for="m in employment.byMajor" :key="m.major">
                      <td>{{ m.major }}</td><td>{{ m.rate }}%</td><td>{{ m.headcount }}</td><td>{{ m.topDirection }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- 毕业生就业名单（具体到人，可筛选） -->
              <div class="cdm-section cdm-roster">
                <div class="cdm-roster__head">
                  <h3>毕业生就业名单<em>（重点样本 {{ empRows.length }} / 共 1,286 人）</em></h3>
                  <div class="cdm-filters">
                    <input
                      v-model="empFilterText"
                      class="cdm-filter-input"
                      type="text"
                      placeholder="搜索 姓名 / 学号 / 班级 / 专业 / 单位"
                    />
                    <select v-model="empFilterDirection" class="cdm-filter-select">
                      <option value="">全部去向</option>
                      <option v-for="c in empDirectionOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <select v-model="empFilterRegion" class="cdm-filter-select">
                      <option value="">全部地区</option>
                      <option v-for="c in empRegionOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <select v-model="empFilterClass" class="cdm-filter-select">
                      <option value="">全部班级</option>
                      <option v-for="c in empClassOptions" :key="c" :value="c">{{ c }}</option>
                    </select>
                    <button type="button" class="cdm-filter-reset" @click="resetFilters">重置</button>
                  </div>
                </div>
                <div class="cdm-table-scroll">
                  <table class="cdm-table cdm-roster-table">
                    <thead>
                      <tr>
                        <th class="col-idx">序号</th>
                        <th>姓名</th>
                        <th>性别</th>
                        <th>学号</th>
                        <th>班级</th>
                        <th>专业</th>
                        <th>辅导员</th>
                        <th>就业去向</th>
                        <th>地区</th>
                        <th>就业单位</th>
                        <th>岗位</th>
                        <th>起薪</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(s, i) in empRows" :key="s.id">
                        <td class="col-idx">{{ i + 1 }}</td>
                        <td class="cell-name cell-link" @click="goToStudentProfile(s.studentId)">{{ s.name }}</td>
                        <td>{{ s.gender }}</td>
                        <td class="cell-sid cell-link" @click="goToStudentProfile(s.studentId)">{{ s.studentId }}</td>
                        <td>{{ s.className }}</td>
                        <td>{{ s.major }}</td>
                        <td>{{ s.counselor }}</td>
                        <td><em class="cdm-badge">{{ s.direction }}</em></td>
                        <td>{{ s.region }}</td>
                        <td>{{ s.unit }}</td>
                        <td>{{ s.position }}</td>
                        <td class="cell-gpa">{{ s.salary }}</td>
                      </tr>
                      <tr v-if="!empRows.length">
                        <td :colspan="12" class="cdm-roster-empty">无匹配学生</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </template>

            <!-- 入口/出口桑基图 -->
            <template v-else-if="state.kind === 'student-flow' && flowSankey">
              <div class="cdm-stat-row">
                <div class="cdm-stat"><span>招生总数</span><strong>{{ flowSankey.summary.entranceTotal }}<small>人</small></strong></div>
                <div class="cdm-stat cdm-stat--green"><span>录取均分</span><strong>{{ flowSankey.summary.avgEntranceScore }}</strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>毕业生数</span><strong>{{ flowSankey.summary.graduateTotal }}<small>人</small></strong></div>
                <div class="cdm-stat cdm-stat--blue"><span>就业率</span><strong>{{ flowSankey.summary.employmentRate }}%</strong></div>
                <div class="cdm-stat cdm-stat--green"><span>升学率</span><strong>{{ flowSankey.summary.furtherRate }}%</strong></div>
              </div>
              <div class="cdm-flow-sankey">
                <StudentFlowSankeyChart
                  title="入口流向 · 生源地 → 录取专业"
                  :nodes="flowSankey.entrance.nodes"
                  :links="flowSankey.entrance.links"
                />
                <StudentFlowSankeyChart
                  title="出口流向 · 专业 → 毕业去向"
                  :nodes="flowSankey.outcome.nodes"
                  :links="flowSankey.outcome.links"
                />
              </div>
            </template>

            <!-- 教评指标详情 -->
            <template v-else-if="state.kind === 'student-evaluation' && evaluationDetail">
              <div class="cdm-stat-row">
                <div class="cdm-stat cdm-stat--blue">
                  <span>{{ evaluationDetail.label }}</span>
                  <strong>{{ evaluationDetail.score }}<small v-if="evaluationDetail.unit">{{ evaluationDetail.unit }}</small></strong>
                </div>
              </div>
              <p class="cdm-desc">{{ evaluationDetail.description }}</p>
              <div class="cdm-section">
                <h3>指标趋势</h3>
                <div class="cdm-chart-box">
                  <ChartContainer :option="evaluationTrendOption" />
                </div>
              </div>
              <div v-if="evaluationDetail.highlights.length" class="cdm-stat-row">
                <div v-for="h in evaluationDetail.highlights" :key="h.label" class="cdm-stat">
                  <span>{{ h.label }}</span><strong>{{ h.value }}</strong>
                </div>
              </div>
            </template>

            <!-- 人才培养专题 -->
            <template v-else-if="state.kind === 'student-dev-detail' && studentDevDetail">
              <StudentDevDetailContent :data="studentDevDetail" />
            </template>

            <!-- 标杆成果专题 -->
            <template v-else-if="state.kind === 'benchmark-detail' && benchmarkDetail">
              <BenchmarkDetailContent :data="benchmarkDetail" :initial-filter="state.id" />
            </template>

            <!-- 教师专题分析 -->
            <template v-else-if="state.kind === 'teacher-detail' && teacherDetail">
              <TeacherDetailContent :data="teacherDetail" />
            </template>

            <!-- 学科概况专题 -->
            <template v-else-if="state.kind === 'discipline-detail' && disciplineDetail">
              <DisciplineDetailContent :data="disciplineDetail" />
            </template>

            <template v-else-if="state.kind === 'enrollment-employment' && enrollmentEmploymentDetail">
              <EnrollmentEmploymentDetailContent
                :data="enrollmentEmploymentDetail"
                :focus="state.id"
              />
            </template>

            <div v-else-if="!loading && state.kind !== 'high-potential' && state.kind !== 'high-potential-overview' && state.kind !== 'warning'" class="cdm-loading">暂无数据</div>

            <!-- 学生名单花名册（高潜维度 / 高潜总览 / 预警通用） -->
            <div v-if="showRoster && !loading" class="cdm-section cdm-roster">
              <div class="cdm-roster__head">
                <h3>{{ rosterTitle }}<em>（重点样本 {{ rosterRows.length }} / 共 {{ rosterTotal }} 人）</em></h3>
                <div class="cdm-filters">
                  <input
                    v-model="filterText"
                    class="cdm-filter-input"
                    type="text"
                    placeholder="搜索 姓名 / 学号 / 班级 / 专业 / 辅导员 / 宿舍 / 电话"
                  />
                  <select v-model="filterMajor" class="cdm-filter-select">
                    <option value="">全部专业</option>
                    <option v-for="c in majorOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select v-model="filterClass" class="cdm-filter-select">
                    <option value="">全部班级</option>
                    <option v-for="c in classOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select v-model="filterGrade" class="cdm-filter-select">
                    <option value="">全部年级</option>
                    <option v-for="c in gradeOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select v-model="filterCounselor" class="cdm-filter-select">
                    <option value="">全部辅导员</option>
                    <option v-for="c in counselorOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <select v-if="isWarning" v-model="filterLevel" class="cdm-filter-select">
                    <option value="">全部等级</option>
                    <option v-for="c in levelOptions" :key="c" :value="c">{{ c }}</option>
                  </select>
                  <button type="button" class="cdm-filter-reset" @click="resetFilters">重置</button>
                </div>
              </div>

              <div class="cdm-table-scroll">
                <table class="cdm-table cdm-roster-table">
                  <thead>
                    <tr>
                      <th class="col-idx">序号</th>
                      <th>姓名</th>
                      <th>性别</th>
                      <th>学号</th>
                      <th>班级</th>
                      <th>专业</th>
                      <th>年级</th>
                      <th>政治面貌</th>
                      <th>辅导员</th>
                      <template v-if="isWarning">
                        <th>预警原因</th>
                        <th>等级</th>
                      </template>
                      <template v-else>
                        <th>GPA</th>
                        <th>亮点</th>
                      </template>
                      <th>联系电话</th>
                      <th class="col-dorm">宿舍号 / 同宿舍关注</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(s, i) in rosterRows" :key="s.id">
                      <td class="col-idx">{{ i + 1 }}</td>
                      <td class="cell-name cell-link" @click="goToStudentProfile(s.studentId)">{{ s.name }}</td>
                      <td>{{ s.gender }}</td>
                      <td class="cell-sid cell-link" @click="goToStudentProfile(s.studentId)">{{ s.studentId }}</td>
                      <td>{{ s.className }}</td>
                      <td>{{ s.major }}</td>
                      <td>{{ s.grade }}</td>
                      <td>{{ s.political }}</td>
                      <td>{{ s.counselor }}</td>
                      <template v-if="isWarning">
                        <td>{{ s.warnReason }}</td>
                        <td><em class="cdm-level" :class="warningLevelClass(s.warnLevel || '')">{{ s.warnLevel }}</em></td>
                      </template>
                      <template v-else>
                        <td class="cell-gpa">{{ s.gpa.toFixed(2) }}</td>
                        <td>{{ s.highlight }}</td>
                      </template>
                      <td class="cell-phone">{{ s.phone }}</td>
                      <td class="col-dorm">
                        <span class="cdm-dorm">{{ s.dorm }}</span>
                        <span
                          v-for="d in s.dormmates"
                          :key="d.name"
                          class="cdm-dormmate"
                          :class="d.kind === '预警' ? 'is-warn' : 'is-hp'"
                        >{{ d.name }}·{{ d.kind }}</span>
                      </td>
                    </tr>
                    <tr v-if="!rosterRows.length">
                      <td :colspan="13" class="cdm-roster-empty">无匹配学生</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.cdm-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: rgba(1, 8, 24, 0.62);
  backdrop-filter: blur(3px);
}

.cdm-panel {
  width: 80vw;
  height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 14px;
  border: 1px solid rgba(0, 242, 255, 0.4);
  background: linear-gradient(160deg, rgba(6, 26, 60, 0.98), rgba(2, 12, 32, 0.98));
  box-shadow: 0 0 60px rgba(0, 140, 255, 0.35), inset 0 0 40px rgba(0, 100, 200, 0.12);
  overflow: hidden;
}

.cdm-head {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 22px;
  border-bottom: 1px solid rgba(0, 242, 255, 0.2);
  background: linear-gradient(90deg, rgba(0, 90, 180, 0.28), rgba(0, 40, 90, 0.1));

  &__icon {
    display: grid;
    place-items: center;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    border: 1px solid rgba(0, 242, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);
  }

  &__text {
    flex: 1;
    min-width: 0;

    h2 {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin: 0;
      font-size: 24px;
      font-weight: 800;
      color: #eaf7ff;
      letter-spacing: 0.04em;
    }

    span {
      font-size: 24px;
      color: #8ec8e8;
    }
  }
}

.cdm-close {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.25);
  background: rgba(0, 60, 120, 0.3);
  color: #bfeaff;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #fff;
    border-color: rgba(0, 242, 255, 0.6);
    background: rgba(0, 120, 220, 0.4);
  }
}

.cdm-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 22px;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 200, 255, 0.35) transparent;
}

.cdm-loading {
  padding: 40px;
  text-align: center;
  color: #8ec8e8;
  font-size: 24px;
}

.cdm-desc {
  margin: 0 0 16px;
  font-size: 24px;
  line-height: 1.7;
  color: #c6dcf0;
}

.cdm-stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.cdm-stat {
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.16);
  background: rgba(0, 60, 120, 0.18);

  span {
    display: block;
    margin-bottom: 6px;
    font-size: 24px;
    color: #8ec8e8;
  }

  strong {
    font-size: 30px;
    font-weight: 900;
    color: #5cecff;

    small {
      margin-left: 3px;
      font-size: 24px;
      color: #7fdfff;
    }
  }

  &--green strong { color: #6effc2; }
  &--blue strong { color: #66d9ff; }
  &--orange strong { color: #ffb27a; }
}

.cdm-section {
  margin-bottom: 22px;

  h3 {
    margin: 0 0 12px;
    padding-left: 10px;
    font-size: 24px;
    font-weight: 800;
    color: #b8ecff;
    border-left: 3px solid #00e5ff;

    small {
      margin-left: 8px;
      color: #7eb8d8;
      font-size: 0.85em;
      font-weight: 600;
    }
  }
}

.cdm-plan-filters {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
  gap: 10px 12px;
  margin-bottom: 4px;
  align-items: end;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;

    span {
      color: #8ec8e8;
      font-size: 20px;
      font-weight: 600;
    }

    select {
      width: 100%;
      min-height: 40px;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid rgba(0, 200, 255, 0.28);
      background: rgba(2, 24, 54, 0.85);
      color: #eaf7ff;
      font-size: 20px;
    }
  }

  &__reset {
    min-height: 40px;
    padding: 0 16px;
    border-radius: 6px;
    border: 1px solid rgba(0, 229, 255, 0.35);
    background: rgba(0, 70, 130, 0.35);
    color: #9fe8ff;
    font-size: 20px;
    font-weight: 700;
    cursor: pointer;
  }
}

.cdm-plan-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 12px;
  margin: 10px 0;

  div {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 50, 100, 0.22);

    span {
      color: #8ec8e8;
      font-size: 18px;
      font-weight: 600;
      line-height: 1.35;
    }

    strong {
      color: #eaf7ff;
      font-size: 22px;
      font-weight: 700;
      line-height: 1.35;
      word-break: break-word;
    }
  }
}

.cdm-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  &--3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.cdm-task {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.16);
  background: rgba(3, 20, 46, 0.7);

  &--risk {
    border-color: rgba(255, 140, 80, 0.35);
    background: rgba(60, 28, 12, 0.45);
  }

  &__cat {
    display: inline-block;
    margin-right: 8px;
    padding: 1px 8px;
    border-radius: 999px;
    border: 1px solid rgba(0, 200, 255, 0.35);
    background: rgba(0, 90, 160, 0.28);
    color: #9fe8ff;
    font-size: 16px;
    font-weight: 700;
    vertical-align: middle;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    strong { font-size: 24px; font-weight: 800; color: #eaf7ff; }
  }

  &__desc {
    margin: 0 0 10px;
    font-size: 24px;
    line-height: 1.6;
    color: #9fb6d2;
  }

  &__bar {
    position: relative;
    height: 8px;
    border-radius: 999px;
    background: rgba(7, 55, 128, 0.65);
    overflow: hidden;
    margin-bottom: 8px;

    i {
      position: absolute;
      inset: 0 auto 0 0;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #0d71ff, #00f2ff, #63ffe1);
      box-shadow: 0 0 10px rgba(0, 242, 255, 0.5);
    }
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-size: 24px;
    color: #8ec8e8;
    margin-bottom: 8px;
  }

  &__pct {
    margin-left: auto;
    color: #7ff6ff;
    font-weight: 800;
  }
}

.cdm-milestones {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;

  li {
    font-size: 24px;
    color: #8298b4;

    &.done { color: #6effc2; }
  }
}

.tag--status-completed { color: #9dffd4; background: rgba(30,180,120,0.25); border: 1px solid rgba(46,230,168,0.4); }
.tag--status-ongoing { color: #8ef6ff; background: rgba(0,120,220,0.28); border: 1px solid rgba(0,200,255,0.35); }
.tag--status-delayed { color: #ffd0b8; background: rgba(200,80,40,0.28); border: 1px solid rgba(255,140,80,0.45); }
.cdm-task__top em {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 24px;
  font-weight: 700;
  font-style: normal;
}

.cdm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;

  span {
    padding: 5px 12px;
    border-radius: 999px;
    font-size: 24px;
    color: #55dfff;
    border: 1px solid rgba(0, 184, 255, 0.25);
    background: rgba(0, 184, 255, 0.08);
  }
}

.cdm-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: grid;
    grid-template-columns: 90px 1fr auto;
    gap: 12px;
    align-items: center;
    padding: 10px 14px;
    border-radius: 8px;
    background: rgba(3, 20, 46, 0.7);
    font-size: 24px;

    span { color: #8ec8e8; }
    strong { color: #eaf7ff; font-weight: 700; }
    em { color: #f4c84f; font-style: normal; }
  }
}

.cdm-bullets {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    position: relative;
    padding-left: 16px;
    font-size: 24px;
    line-height: 1.6;
    color: #c6dcf0;

    &::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #00e5ff;
    }
  }
}

.cdm-hp-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.2);
  background: linear-gradient(160deg, rgba(0, 80, 160, 0.24), rgba(2, 14, 40, 0.85));

  &__icon {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid rgba(0, 242, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);
    margin-bottom: 4px;
  }

  &__title { font-size: 24px; font-weight: 800; color: #dff7ff; }
  &__metric {
    font-size: 26px; font-weight: 900; color: #fff;
    small { margin-left: 2px; font-size: 24px; color: #7fdfff; }
  }
  &__label { font-size: 24px; color: #8ec8e8; }
  &__desc { margin: 6px 0 0; font-size: 24px; line-height: 1.55; color: #93abc6; }
}

.cdm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 24px;

  thead th {
    padding: 10px 14px;
    text-align: left;
    font-weight: 700;
    color: #9fd6f5;
    background: rgba(0, 90, 180, 0.22);
    border-bottom: 1px solid rgba(0, 242, 255, 0.25);
    white-space: nowrap;
  }

  tbody td {
    padding: 10px 14px;
    color: #d6e6f5;
    border-bottom: 1px solid rgba(0, 150, 255, 0.1);
  }

  tbody tr:hover td {
    background: rgba(0, 120, 220, 0.12);
  }
}

.cdm-badge {
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 24px;
  font-style: normal;
  color: #7fe0ff;
  border: 1px solid rgba(0, 200, 255, 0.3);
  background: rgba(0, 120, 220, 0.18);
}

.cdm-level {
  padding: 2px 12px;
  border-radius: 999px;
  font-size: 24px;
  font-style: normal;
  font-weight: 700;

  &.lv-red { color: #ff9b9b; background: rgba(220, 60, 60, 0.22); border: 1px solid rgba(255, 90, 90, 0.4); }
  &.lv-orange { color: #ffc19a; background: rgba(220, 120, 40, 0.22); border: 1px solid rgba(255, 150, 80, 0.4); }
  &.lv-yellow { color: #ffe08a; background: rgba(200, 170, 40, 0.2); border: 1px solid rgba(255, 210, 90, 0.4); }
  &.lv-blue { color: #8ef6ff; background: rgba(0, 120, 220, 0.22); border: 1px solid rgba(0, 200, 255, 0.35); }
}

.cdm-dir {
  padding: 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 242, 255, 0.16);
  background: rgba(3, 20, 46, 0.7);

  &__top {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 4px;

    strong { font-size: 24px; font-weight: 800; color: #eaf7ff; }
    em { font-size: 24px; font-weight: 900; font-style: normal; color: #5cecff; }
  }

  &__count { font-size: 24px; color: #7fdfff; margin-bottom: 6px; }

  p { margin: 0; font-size: 24px; line-height: 1.55; color: #93abc6; }
}

/* 学生名单花名册 */
.cdm-roster__head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;

  h3 {
    margin: 0;
    padding-left: 10px;
    font-size: 24px;
    font-weight: 800;
    color: #b8ecff;
    border-left: 3px solid #00e5ff;

    em {
      margin-left: 6px;
      font-style: normal;
      font-size: 24px;
      font-weight: 600;
      color: #7fa9c8;
    }
  }
}

.cdm-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cdm-filter-input,
.cdm-filter-select {
  height: 32px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.28);
  background: rgba(2, 18, 44, 0.9);
  color: #dff2ff;
  font-size: 24px;
  outline: none;

  &:focus {
    border-color: rgba(0, 242, 255, 0.7);
    box-shadow: 0 0 0 2px rgba(0, 180, 255, 0.18);
  }
}

.cdm-filter-input {
  width: 260px;
  max-width: 46vw;

  &::placeholder { color: #6c8aa6; }
}

.cdm-filter-select option {
  background: #02122c;
  color: #dff2ff;
}

.cdm-filter-reset {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid rgba(0, 200, 255, 0.28);
  background: rgba(0, 90, 180, 0.22);
  color: #bfeaff;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.18s;

  &:hover { border-color: rgba(0, 242, 255, 0.6); background: rgba(0, 120, 220, 0.34); }
}

.cdm-table-scroll {
  width: 100%;
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 200, 255, 0.35) transparent;
}

.cdm-roster-table {
  font-size: 24px;

  th, td { white-space: nowrap; }
  .col-idx { width: 52px; text-align: center; }
  td.col-idx { text-align: center; color: #7fa9c8; }
  .cell-name { font-weight: 700; color: #eaf7ff; }
  .cell-sid { font-family: var(--college-font-number); color: #a9c6de; }
  .cell-link {
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 2px;

    &:hover {
      color: #7fe9ff;
    }
  }
  .cell-phone { font-family: var(--college-font-number); color: #a9c6de; }
  .cell-gpa { font-family: var(--college-font-number); font-weight: 700; color: #6effc2; }
  .col-dorm { min-width: 200px; white-space: normal; }
}

.cdm-dorm {
  display: inline-block;
  margin-right: 6px;
  font-weight: 600;
  color: #cfe6f7;
}

.cdm-dormmate {
  display: inline-block;
  margin: 2px 4px 2px 0;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 24px;
  white-space: nowrap;

  &.is-hp { color: #8ef6c8; background: rgba(30, 180, 120, 0.18); border: 1px solid rgba(46, 230, 168, 0.35); }
  &.is-warn { color: #ffc19a; background: rgba(220, 120, 40, 0.18); border: 1px solid rgba(255, 150, 80, 0.38); }
}

.cdm-roster-empty {
  padding: 24px !important;
  text-align: center;
  color: #7fa9c8 !important;
}

/* 过渡动画 */
.cdm-fade-enter-active,
.cdm-fade-leave-active {
  transition: opacity 0.22s ease;
}
.cdm-fade-enter-from,
.cdm-fade-leave-to {
  opacity: 0;
}
.cdm-fade-enter-active .cdm-panel,
.cdm-fade-leave-active .cdm-panel {
  transition: transform 0.24s ease;
}
.cdm-fade-enter-from .cdm-panel,
.cdm-fade-leave-to .cdm-panel {
  transform: scale(0.94) translateY(10px);
}

.cdm-flow-sankey {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 360px;
}

.cdm-chart-box {
  height: 240px;
}

@media (max-width: 1100px) {
  .cdm-flow-sankey {
    grid-template-columns: 1fr;
  }
}
</style>
