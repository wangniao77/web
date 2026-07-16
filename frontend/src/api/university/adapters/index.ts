import type { RiskLevel } from '@/constants/university/risk'
import { RISK_LEVEL_MAP, TASK_STATUS_TO_RISK } from '@/constants/university/risk'
import {
  EVENT_CATEGORY_LABELS,
  EVENT_STATUS_LABELS,
} from '@/constants/university/labels'
import { NEWS_TAG_LABELS } from '@/constants/university/datav-theme'
import type {
  KeyTaskDTO,
  SchoolEventDTO,
  UniversityOverviewDTO,
} from '@/types/university/api'
import type {
  KeyTaskVM,
  SchoolEventVM,
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
  }))
}

export function adaptUniversityOverview(dto: UniversityOverviewDTO): UniversityDashboardVM {
  const gap = dto.goalOverview.progressGap
  return {
    meta: dto.meta,
    goalOverview: {
      ...dto.goalOverview,
      progressGapLabel: gap >= 0 ? `+${gap.toFixed(1)}%` : `${gap.toFixed(1)}%`,
      dimensions: dto.goalOverview.dimensions.map((dim) => ({
        ...dim,
        completionLabel: `${dim.completion.toFixed(1)}%`,
        trendLabel: formatTrend(dim.trend) ?? undefined,
        ...adaptRisk(dim.riskLevel),
      })),
    },
    research: {
      metrics: [
        { label: '国家级项目', value: String(dto.research.nationalProjects), unit: '项' },
        { label: '省部级项目', value: String(dto.research.provincialProjects), unit: '项' },
        { label: '高水平论文', value: String(dto.research.highLevelPapers), unit: '篇' },
        { label: '科研到账', value: dto.research.researchFunding.toFixed(2), unit: '亿元' },
      ],
      phdSupportRate: dto.research.phdSupportRate,
      phdSupportLabel: `${dto.research.phdSupportRate.toFixed(1)}%`,
      phdHasGap: dto.research.phdHasGap,
      phdGapHint: dto.research.phdGapHint,
      topContributors: dto.research.topContributors.map((item) => ({
        name: item.name,
        value: item.value.toFixed(1),
      })),
      fundingTrend: dto.research.fundingTrend,
    },
    keyTasks: adaptKeyTasks(dto.keyTasks),
    disciplines: {
      ...dto.disciplines,
      topRisers: dto.disciplines.topRisers.map((item) => ({
        name: item.name,
        currentRank: item.currentRank,
        change: item.change,
        changeLabel: formatChangeLabel(item.change),
      })),
      topFallers: dto.disciplines.topFallers.map((item) => ({
        name: item.name,
        currentRank: item.currentRank,
        change: item.change,
        changeLabel: formatChangeLabel(item.change),
      })),
      terrainCategories: dto.disciplines.competitiveness.categories,
      terrainLayers: [
        { name: '上升学科', data: dto.disciplines.competitiveness.rising, color: '#37e0a4' },
        { name: '持平学科', data: dto.disciplines.competitiveness.stable, color: '#4b8dff' },
        { name: '下降学科', data: dto.disciplines.competitiveness.falling, color: '#ffb057' },
      ],
    },
    employment: {
      metrics: [
        {
          label: '去向落实率',
          value: `${dto.employment.placementRate}%`,
          trend: { direction: 'up', value: 1.2, unit: '%' },
          trendLabel: '↑1.2%',
        },
        {
          label: '全省排名',
          value: `第 ${dto.employment.provinceRank} 名`,
          trend: { direction: 'up', value: dto.employment.provinceRankChange },
          trendLabel: `↑${dto.employment.provinceRankChange}`,
        },
        {
          label: '升学率',
          value: `${dto.employment.furtherStudyRate}%`,
          trend: { direction: 'up', value: 2.1, unit: '%' },
          trendLabel: '↑2.1%',
        },
        {
          label: '高质量就业率',
          value: `${dto.employment.highQualityRate}%`,
        },
        {
          label: '重点企业就业',
          value: String(dto.employment.keyEnterpriseCount),
          unit: '人',
        },
        {
          label: '年薪50万+',
          value: String(dto.employment.highSalaryCount),
          hint: `薪酬覆盖率 ${dto.employment.salaryCoverage}%`,
        },
      ],
      trend: dto.employment.trend,
      destinationStructure: dto.employment.destinationStructure,
      industryShare: dto.employment.industryShare,
    },
    events: adaptEvents(dto.events),
    academicRisk: {
      ...dto.academicRisk,
      delayRateChangeLabel: formatChangeLabel(dto.academicRisk.delayRateChange),
      riskResolvedLabel: `${dto.academicRisk.riskResolvedRate.toFixed(1)}%`,
    },
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
