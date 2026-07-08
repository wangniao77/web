import type { RiskLevel } from '@/constants/university/risk'
import { RISK_LEVEL_MAP, TASK_STATUS_TO_RISK } from '@/constants/university/risk'
import {
  EVENT_CATEGORY_LABELS,
  EVENT_STATUS_LABELS,
} from '@/constants/university/labels'
import { NEWS_TAG_LABELS } from '@/constants/university/datav-theme'
import type {
  BenchmarkSummaryDTO,
  FacultySummaryDTO,
  KeyTaskDTO,
  RiskWarningSummaryDTO,
  SchoolEventDTO,
  SchoolPostureDTO,
  TeachingSummaryDTO,
  UniversityOverviewDTO,
} from '@/types/university/api'
import type {
  BenchmarkSummaryVM,
  FacultySummaryVM,
  KeyTaskVM,
  RiskWarningSummaryVM,
  SchoolEventVM,
  SchoolPostureVM,
  TeachingSummaryVM,
  UniversityDashboardVM,
} from '@/types/university/view'
import type {
  AcademicRiskDetailVM,
  DisciplineDetailVM,
  EmploymentDetailVM,
  EventsDetailVM,
  KeyTasksDetailVM,
  MetricsDetailVM,
  NewsDetailVM,
  ResearchDetailVM,
} from '@/types/university/view/details'
import type {
  AcademicRiskDetailDTO,
  DisciplineDetailDTO,
  EmploymentDetailDTO,
  EventsDetailDTO,
  KeyTasksDetailDTO,
  MetricsDetailDTO,
  NewsDetailDTO,
  ResearchDetailDTO,
} from '@/types/university/api/details'
import { adaptUniversityModules } from '@/api/university/adapters/modules'
import { formatTrend } from '@/utils/trend'

const taskStatusMap = {
  ongoing: { label: '推进中', class: 'status-ongoing' },
  completed: { label: '已完成', class: 'status-completed' },
  attention: { label: '需关注', class: 'status-attention' },
  overdue: { label: '已逾期', class: 'status-overdue' },
} as const

function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1)
    return unit ? `${formatted}${unit}` : formatted
  }
  return unit ? `${value}${unit}` : String(value)
}

function formatChangeLabel(change: number): string {
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '—'
}

function adaptRisk(riskLevel: RiskLevel) {
  const meta = RISK_LEVEL_MAP[riskLevel]
  return { riskLevel, riskLabel: meta.label, riskClass: meta.class }
}

export function adaptKeyTasks(dto: KeyTaskDTO[]): KeyTaskVM[] {
  return dto.map((task) => {
    const status = taskStatusMap[task.status]
    const risk = adaptRisk(task.riskLevel ?? TASK_STATUS_TO_RISK[task.status] ?? 'ongoing')
    return {
      id: task.id,
      name: task.name,
      progress: task.progress,
      plannedNode: task.plannedNode,
      department: task.department,
      currentIssue: task.currentIssue,
      nextAction: task.nextAction,
      rectifyDeadline: task.rectifyDeadline,
      statusLabel: status.label,
      statusClass: status.class,
      ...risk,
    }
  })
}

export function adaptEvents(dto: SchoolEventDTO[]): SchoolEventVM[] {
  return dto.map((item) => ({
    id: item.id,
    category: item.category,
    categoryLabel: EVENT_CATEGORY_LABELS[item.category],
    title: item.title,
    date: item.date,
    status: item.status,
    statusLabel: EVENT_STATUS_LABELS[item.status],
    needsAttention: item.needsAttention,
    progressNote: item.progressNote,
    nextStep: item.nextStep,
    isAchievement: item.isAchievement,
  }))
}

const defaultSchoolPosture: SchoolPostureDTO = {
  enrolledStudents: 0,
  collegeCount: 0,
  majorCount: 0,
  disciplineCount: 0,
  facultyCount: 0,
  researchPlatforms: 0,
  enrollment: 0,
  graduation: 0,
  developmentIndex: 0,
}

const defaultBenchmark: BenchmarkSummaryDTO = {
  nationalRank: 0,
  provincialRank: 0,
  financeRank: 0,
  gapVsPeers: [],
  attribution: [],
}

const defaultTeaching: TeachingSummaryDTO = {
  admissionQuality: 0,
  courseCount: 0,
  teachingEval: 0,
  academicDev: 0,
  gradRate: 0,
  degreeRate: 0,
}

const defaultFaculty: FacultySummaryDTO = {
  total: 0,
  fullTime: 0,
  highLevelTalent: 0,
  phdRatio: 0,
  professorRatio: 0,
  youngFaculty: 0,
}

const defaultRiskWarning: RiskWarningSummaryDTO = {
  academic: 0,
  employment: 0,
  taskOverdue: 0,
  indicatorMiss: 0,
  fundingSlow: 0,
  crossDept: [],
}

function adaptSchoolPosture(dto: SchoolPostureDTO): SchoolPostureVM {
  return {
    ...dto,
    enrolledStudentsLabel: dto.enrolledStudents.toLocaleString(),
    developmentIndexLabel: `${dto.developmentIndex.toFixed(1)}`,
    metrics: [
      { label: '在校生', value: dto.enrolledStudents.toLocaleString(), unit: '人' },
      { label: '学院', value: String(dto.collegeCount), unit: '个' },
      { label: '专业', value: String(dto.majorCount), unit: '个' },
      { label: '学科', value: String(dto.disciplineCount), unit: '个' },
      { label: '师资', value: String(dto.facultyCount), unit: '人' },
      { label: '科研平台', value: String(dto.researchPlatforms), unit: '个' },
    ],
  }
}

function adaptBenchmark(dto: BenchmarkSummaryDTO): BenchmarkSummaryVM {
  return {
    ...dto,
    gapVsPeers: dto.gapVsPeers.map((item) => ({
      ...item,
      gapLabel: item.gap >= 0 ? `+${item.gap}` : String(item.gap),
    })),
  }
}

function adaptTeaching(dto: TeachingSummaryDTO): TeachingSummaryVM {
  return {
    ...dto,
    metrics: [
      { label: '招生质量', value: dto.admissionQuality.toFixed(1), unit: '分' },
      { label: '课程建设', value: String(dto.courseCount), unit: '门' },
      { label: '教学评价', value: dto.teachingEval.toFixed(2), unit: '分' },
      { label: '学业发展', value: `${dto.academicDev.toFixed(1)}%` },
      { label: '毕业率', value: `${dto.gradRate.toFixed(1)}%` },
      { label: '学位授予率', value: `${dto.degreeRate.toFixed(1)}%` },
    ],
  }
}

function adaptFaculty(dto: FacultySummaryDTO): FacultySummaryVM {
  return {
    ...dto,
    metrics: [
      { label: '教师总量', value: String(dto.total), unit: '人' },
      { label: '专任教师', value: String(dto.fullTime), unit: '人' },
      { label: '高层次人才', value: String(dto.highLevelTalent), unit: '人' },
      { label: '博士教师比例', value: `${dto.phdRatio.toFixed(1)}%` },
      { label: '教授比例', value: `${dto.professorRatio.toFixed(1)}%` },
      { label: '青年教师', value: String(dto.youngFaculty), unit: '人' },
    ],
  }
}

function adaptRiskWarning(dto: RiskWarningSummaryDTO): RiskWarningSummaryVM {
  return { ...dto }
}

export function adaptUniversityOverview(dto: UniversityOverviewDTO): UniversityDashboardVM {
  const modules = adaptUniversityModules(dto.modules)
  const gap = dto.goalOverview?.progressGap ?? 0
  const legacy = buildLegacyFromDto(dto, gap)
  return { meta: dto.meta, modules, ...legacy }
}

function buildLegacyFromDto(dto: UniversityOverviewDTO, gap: number) {
  const goalOverview = dto.goalOverview ?? {
    totalTasks: 0, completedTasks: 0, inProgressTasks: 0, riskTasks: 0, overdueTasks: 0,
    monthlyCompleted: 0, completionRate: 0, plannedProgress: 0, progressGap: 0, formula: '', dimensions: [],
  }
  return {
    goalOverview: {
      ...goalOverview,
      progressGapLabel: gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`,
      dimensions: (goalOverview.dimensions ?? []).map((dim) => ({
        ...dim,
        completionLabel: `${dim.completion.toFixed(1)}%`,
        trendLabel: formatTrend(dim.trend) ?? undefined,
        ...adaptRisk(dim.riskLevel),
      })),
    },
    schoolPosture: adaptSchoolPosture(dto.schoolPosture ?? defaultSchoolPosture),
    benchmark: adaptBenchmark(dto.benchmark ?? defaultBenchmark),
    research: adaptResearchLegacy(dto.research),
    keyTasks: adaptKeyTasks(dto.keyTasks ?? []),
    disciplines: adaptDisciplinesLegacy(dto.disciplines),
    teaching: adaptTeaching(dto.teaching ?? defaultTeaching),
    employment: adaptEmploymentLegacy(dto.employment),
    faculty: adaptFaculty(dto.faculty ?? defaultFaculty),
    riskWarning: adaptRiskWarning(dto.riskWarning ?? defaultRiskWarning),
    events: adaptEvents(dto.events ?? []),
    academicRisk: {
      ...(dto.academicRisk ?? { expectedDelayCount: 0, delayRateChange: 0, warningCount: 0, intervenedCount: 0, riskResolvedRate: 0, highRiskCollegeCount: 0 }),
      delayRateChangeLabel: formatChangeLabel(dto.academicRisk?.delayRateChange ?? 0),
      riskResolvedLabel: `${(dto.academicRisk?.riskResolvedRate ?? 0).toFixed(1)}%`,
    },
  }
}

function adaptResearchLegacy(dto: UniversityOverviewDTO['research']) {
  if (!dto) return { metrics: [], phdSupportRate: 0, phdSupportLabel: '0%', phdHasGap: false, topContributors: [], fundingTrend: [] }
  return {
    metrics: [
      { label: '国家级项目', value: String(dto.nationalProjects), unit: '项' },
      { label: '省部级项目', value: String(dto.provincialProjects), unit: '项' },
      { label: '高水平论文', value: String(dto.highLevelPapers), unit: '篇' },
      { label: '科研到账', value: dto.researchFunding.toFixed(2), unit: '亿元' },
    ],
    phdSupportRate: dto.phdSupportRate,
    phdSupportLabel: `${dto.phdSupportRate.toFixed(1)}%`,
    phdHasGap: dto.phdHasGap,
    phdGapHint: dto.phdGapHint,
    topContributors: dto.topContributors.map((item) => ({ name: item.name, value: item.value.toFixed(1) })),
    fundingTrend: dto.fundingTrend,
  }
}

function adaptDisciplinesLegacy(dto: UniversityOverviewDTO['disciplines']) {
  if (!dto) return { risingCount: 0, stableCount: 0, fallingCount: 0, focusCount: 0, topRisers: [], topFallers: [], yearlyTrend: [], terrainCategories: [], terrainLayers: [] }
  return {
    ...dto,
    topRisers: dto.topRisers.map((item) => ({ name: item.name, currentRank: item.currentRank, change: item.change, changeLabel: formatChangeLabel(item.change) })),
    topFallers: dto.topFallers.map((item) => ({ name: item.name, currentRank: item.currentRank, change: item.change, changeLabel: formatChangeLabel(item.change) })),
    terrainCategories: dto.competitiveness.categories,
    terrainLayers: [
      { name: '上升学科', data: dto.competitiveness.rising, color: '#37e0a4' },
      { name: '持平学科', data: dto.competitiveness.stable, color: '#4b8dff' },
      { name: '下降学科', data: dto.competitiveness.falling, color: '#ffb057' },
    ],
  }
}

function adaptEmploymentLegacy(dto: UniversityOverviewDTO['employment']) {
  if (!dto) return { metrics: [], trend: [], destinationStructure: [], industryShare: [] }
  return {
    metrics: [
      { label: '去向落实率', value: `${dto.placementRate}%` },
      { label: '升学率', value: `${dto.furtherStudyRate}%` },
      { label: '高质量就业率', value: `${dto.highQualityRate}%` },
    ],
    trend: dto.trend,
    destinationStructure: dto.destinationStructure,
    industryShare: dto.industryShare,
  }
}

export function adaptKeyTasksDetail(dto: KeyTasksDetailDTO): KeyTasksDetailVM {
  return {
    summary: dto.summary,
    tasks: dto.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      description: task.description,
      progress: task.progress,
      statusLabel: taskStatusMap[task.status].label,
      statusClass: taskStatusMap[task.status].class,
      leadDept: task.leadDept,
      deadline: task.deadline,
      milestones: task.milestones,
      ...adaptRisk(task.riskLevel ?? TASK_STATUS_TO_RISK[task.status] ?? 'ongoing'),
    })),
  }
}

export function adaptEmploymentDetail(dto: EmploymentDetailDTO): EmploymentDetailVM {
  return {
    overview: dto.overview.map((item) => ({
      label: item.label,
      value: formatValue(item.value, item.unit),
      unit: item.unit,
    })),
    trend: dto.trend,
    distribution: dto.distribution,
    byCollege: dto.byCollege,
    destinationStructure: dto.destinationStructure ?? [],
    industryShare: dto.industryShare ?? [],
    salaryDistribution: dto.salaryDistribution ?? [],
    salaryCoverage: dto.salaryCoverage ?? 0,
  }
}

export function adaptNewsDetail(dto: NewsDetailDTO): NewsDetailVM {
  return {
    items: dto.items.map((item) => ({
      id: item.id,
      tag: item.tag,
      tagLabel: NEWS_TAG_LABELS[item.tag] ?? item.tag,
      title: item.title,
      summary: item.summary,
      content: item.content,
      date: item.date,
      source: item.source,
    })),
  }
}

export function adaptResearchDetail(dto: ResearchDetailDTO): ResearchDetailVM {
  return { ...dto }
}

export function adaptDisciplineDetail(dto: DisciplineDetailDTO): DisciplineDetailVM {
  return {
    disciplines: dto.disciplines.map((d) => ({
      ...d,
      changeLabel: formatChangeLabel(d.change),
    })),
  }
}

export function adaptEventsDetail(dto: EventsDetailDTO): EventsDetailVM {
  return {
    items: dto.items.map((item) => ({
      ...item,
      categoryLabel: EVENT_CATEGORY_LABELS[item.category],
      statusLabel: EVENT_STATUS_LABELS[item.status],
    })),
  }
}

export function adaptAcademicRiskDetail(dto: AcademicRiskDetailDTO): AcademicRiskDetailVM {
  return { ...dto }
}

export function adaptMetricsDetail(dto: MetricsDetailDTO): MetricsDetailVM {
  return { ...dto }
}

export type { UniversityScope } from '@/types/common'
