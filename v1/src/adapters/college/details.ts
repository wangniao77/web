import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/types/api/college/details'
import type { HighPotentialOverviewDTO } from '@/types/api/college/high-potential'
import type { WarningCategoryType } from '@/types/api/college/high-potential'
import type {
  EmploymentDetailVM,
  HighPotentialOverviewVM,
  KeyTasksDetailVM,
  ResearchPlatformsDetailVM,
  TeachingCoursesDetailVM,
  WarningDetailVM,
} from '@/types/view/college/details'

const statusMap = {
  ongoing: { label: '进行中', class: 'status-ongoing' },
  completed: { label: '已完成', class: 'status-completed' },
  delayed: { label: '滞后', class: 'status-delayed' },
} as const

export function adaptHighPotentialOverview(dto: HighPotentialOverviewDTO): HighPotentialOverviewVM {
  return {
    summary: dto.summary,
    modules: dto.modules.map((module) => ({ ...module })),
  }
}

export function adaptKeyTasksDetail(dto: KeyTasksDetailDTO): KeyTasksDetailVM {
  return {
    summary: dto.summary,
    tasks: dto.tasks.map((task) => ({
      ...task,
      statusLabel: statusMap[task.status].label,
      statusClass: statusMap[task.status].class,
    })),
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
