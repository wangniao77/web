import type { UniversityScope } from '@/core/types/common'
import type {
  CollegeRankingItemDTO,
  KeyTaskDTO,
  NewsItemDTO,
  UniversityOverviewDTO,
} from '@/domains/university/types/api'
import {
  NEWS_TAG_LABELS,
  UNIVERSITY_KPI_LAYOUT,
} from '@/domains/university/constants/datav-theme'
import type {
  CollegeRankingItemVM,
  KeyTaskVM,
  NewsItemVM,
  UniversityDashboardVM,
} from '@/domains/university/types/view'
import type {
  EmploymentDetailVM,
  KeyTasksDetailVM,
  NewsDetailVM,
} from '@/domains/university/types/view/details'
import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  NewsDetailDTO,
} from '@/domains/university/types/api/details'

const taskStatusMap = {
  ongoing: { label: '推进中', class: 'status-ongoing' },
  completed: { label: '已完成', class: 'status-completed' },
  attention: { label: '需关注', class: 'status-delayed' },
} as const

function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1)
    return unit ? `${formatted}${unit}` : formatted
  }
  return unit ? `${value}${unit}` : String(value)
}

function formatTrendLabel(trend: number): string {
  if (trend > 0) return `+${trend}`
  if (trend < 0) return String(trend)
  return '0'
}

export function adaptKeyTasks(dto: KeyTaskDTO[]): KeyTaskVM[] {
  return dto.map((task) => ({
    id: task.id,
    name: task.name,
    progress: task.progress,
    statusLabel: taskStatusMap[task.status].label,
    statusClass: taskStatusMap[task.status].class,
  }))
}

export function adaptCollegeRanking(dto: CollegeRankingItemDTO[]): CollegeRankingItemVM[] {
  return dto.map((item) => ({
    ...item,
    trendLabel: formatTrendLabel(item.trend),
  }))
}

export function adaptNewsItems(dto: NewsItemDTO[]): NewsItemVM[] {
  return dto.map((item) => ({
    id: item.id,
    tag: item.tag,
    tagLabel: NEWS_TAG_LABELS[item.tag] ?? item.tag,
    title: item.title,
    summary: item.summary,
    date: item.date,
  }))
}

export function adaptUniversityOverview(dto: UniversityOverviewDTO): UniversityDashboardVM {
  return {
    hub: {
      developmentIndex: dto.hub.developmentIndex,
      maxScore: dto.hub.maxScore,
      levelLabel: dto.hub.levelLabel,
      yearDelta: dto.hub.yearDelta,
      kpis: dto.hub.kpis.map((kpi) => ({
        key: kpi.key,
        label: kpi.label,
        value: formatValue(kpi.value, kpi.unit),
        trend: kpi.trend,
        icon: UNIVERSITY_KPI_LAYOUT[kpi.key]?.icon ?? 'icon-star',
        position: UNIVERSITY_KPI_LAYOUT[kpi.key]?.position ?? 'tl',
      })),
    },
    collegeRanking: adaptCollegeRanking(dto.collegeRanking),
    rankingFormula: dto.rankingFormula,
    employmentQuality: {
      metrics: dto.employmentQuality.metrics.map((m) => ({
        label: m.label,
        value: formatValue(m.value, m.unit),
        trend: m.trend,
      })),
      trend: dto.employmentQuality.trend,
      distribution: dto.employmentQuality.distribution,
    },
    news: adaptNewsItems(dto.news),
    keyTasks: adaptKeyTasks(dto.keyTasks),
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

export type { UniversityScope }
