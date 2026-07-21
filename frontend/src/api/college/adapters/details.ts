import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/types/college/api/details'
import type { HighPotentialOverviewDTO } from '@/types/college/api/high-potential'
import type { WarningCategoryType } from '@/types/college/api/high-potential'
import type {
  EmploymentDetailVM,
  HighPotentialOverviewVM,
  KeyTasksDetailVM,
  ResearchPlatformsDetailVM,
  TeachingCoursesDetailVM,
  WarningDetailVM,
} from '@/types/college/view/details'

const statusMap = {
  ongoing: { label: '进行中', class: 'status-ongoing' },
  completed: { label: '已完成', class: 'status-completed' },
  delayed: { label: '滞后', class: 'status-delayed' },
  attention: { label: '需关注', class: 'status-delayed' },
  overdue: { label: '逾期', class: 'status-delayed' },
} as const

function resolveTaskStatus(status: string) {
  return statusMap[status as keyof typeof statusMap] ?? statusMap.ongoing
}

export function adaptHighPotentialOverview(dto: HighPotentialOverviewDTO): HighPotentialOverviewVM {
  return {
    summary: dto.summary,
    modules: dto.modules.map((module) => ({ ...module })),
  }
}

export function adaptKeyTasksDetail(dto: KeyTasksDetailDTO): KeyTasksDetailVM {
  const owners = dto.tasks.map((t) => t.leadDept)
  const defaults = {
    years: dto.year ? [dto.year] : ['2025'],
    domains: ['全部', '科研', '教学'],
    taskTypes: ['全部'],
    owners: ['全部', ...Array.from(new Set(owners))],
    projectLevels: ['全部'],
    majorDirections: ['全部'],
    statuses: ['全部', '已完成', '推进中', '需关注'],
  }

  return {
    summary: {
      ...dto.summary,
      completionRate:
        dto.summary.completionRate ??
        (dto.summary.total
          ? Math.round((dto.summary.completed / dto.summary.total) * 100)
          : 0),
    },
    year: dto.year ?? '2025',
    filterOptions: dto.filterOptions ?? defaults,
    tasks: dto.tasks.map((task) => {
      const status = resolveTaskStatus(task.status)
      return {
        ...task,
        statusLabel:
          task.status === 'delayed'
            ? '需关注'
            : task.status === 'completed'
              ? '已完成'
              : '推进中',
        statusClass: status.class,
        categoryLabel:
          task.category === 'research' ? '科研' : task.category === 'teaching' ? '教学' : undefined,
      }
    }),
  }
}

export function adaptWarningDetail(dto: WarningDetailDTO): WarningDetailVM {
  return { ...dto }
}

export function adaptTeachingCoursesDetail(dto: TeachingCoursesDetailDTO): TeachingCoursesDetailVM {
  return { courses: dto.courses.map((course) => ({ ...course })) }
}

export function adaptResearchPlatformsDetail(dto: ResearchPlatformsDetailDTO): ResearchPlatformsDetailVM {
  return {
    categories: dto.categories.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    })),
  }
}

export function adaptEmploymentDetail(dto: EmploymentDetailDTO): EmploymentDetailVM {
  return {
    overview: dto.overview.map((item) => ({ ...item })),
    byDirection: dto.byDirection.map((item) => ({ ...item })),
    topEmployers: dto.topEmployers.map((item) => ({ ...item })),
    byMajor: dto.byMajor.map((item) => ({ ...item })),
  }
}

export function isWarningCategoryType(value: string): value is WarningCategoryType {
  return ['academic', 'psychological', 'employment', 'credit'].includes(value)
}
