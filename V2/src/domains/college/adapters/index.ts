import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
} from '@/domains/college/types/api'
import type {
  KeyTaskVM,
  OverviewHubVM,
  ResearchOverviewVM,
  StudentOverviewVM,
  TeachingOverviewVM,
  WarningOverviewVM,
} from '@/domains/college/types/view'

const statusMap = {
  ongoing: { label: '进行中', class: 'status-ongoing' },
  completed: { label: '已完成', class: 'status-completed' },
  delayed: { label: '滞后', class: 'status-delayed' },
} as const

function formatValue(value: number | string, unit?: string): string {
  if (typeof value === 'number') {
    const formatted = Number.isInteger(value) ? String(value) : value.toFixed(1)
    return unit ? `${formatted}${unit}` : formatted
  }
  return unit ? `${value}${unit}` : String(value)
}

export function adaptOverviewHub(dto: OverviewHubDTO): OverviewHubVM {
  return {
    developmentIndex: dto.developmentIndex,
    maxScore: dto.maxScore,
    starLevel: dto.starLevel,
    kpis: dto.kpis.map((kpi) => ({
      key: kpi.key,
      label: kpi.label,
      value: formatValue(kpi.value, kpi.unit),
      trend: kpi.trend,
    })),
  }
}

export function adaptKeyTasks(dto: KeyTaskDTO[]): KeyTaskVM[] {
  return dto.map((task) => ({
    id: task.id,
    name: task.name,
    progress: task.progress,
    statusLabel: statusMap[task.status].label,
    statusClass: statusMap[task.status].class,
  }))
}

export function adaptStudentOverview(dto: StudentOverviewDTO): StudentOverviewVM {
  return {
    metrics: dto.metrics.map((m) => ({
      label: m.label,
      value: formatValue(m.value, m.unit),
      trend: m.trend,
    })),
    employmentDirection: dto.employmentDirection,
    employmentRegions: dto.employmentRegions,
    qualityDevelopment: dto.qualityDevelopment,
    warnings: {
      academic: dto.warnings.academic,
      fundingRate: `${dto.warnings.fundingRate}%`,
    },
  }
}

export function adaptTeachingOverview(dto: TeachingOverviewDTO): TeachingOverviewVM {
  return {
    metrics: dto.metrics.map((m) => ({
      label: m.label,
      value: formatValue(m.value, m.unit),
    })),
    evaluationTrend: dto.evaluationTrend,
    courseConstruction: dto.courseConstruction,
  }
}

export function adaptResearchOverview(dto: ResearchOverviewDTO): ResearchOverviewVM {
  return {
    metrics: dto.metrics.map((m) => ({
      label: m.label,
      value: formatValue(m.value, m.unit),
      trend: m.trend,
    })),
    fundingTrend: dto.fundingTrend,
    platforms: dto.platforms,
  }
}

export function adaptWarningOverview(dto: WarningOverviewDTO): WarningOverviewVM {
  return {
    categories: dto.categories.map((c) => ({
      label: c.label,
      count: c.count,
      momChange: c.momChange,
      type: c.type,
    })),
    trend: dto.trend,
    creditCompletion: dto.creditCompletion,
  }
}
