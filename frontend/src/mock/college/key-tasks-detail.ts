import type { KeyTasksDetailDTO } from '@/types/college/api/details'
import {
  mockKeyPlanProgress,
  PLAN_GROUP_LABELS,
  type PlanGroupCategory,
} from '@/mock/college/key-plan-progress'

const statusToDto = {
  completed: 'completed',
  ongoing: 'ongoing',
  attention: 'delayed',
} as const

function buildTasksFromPlan(): KeyTasksDetailDTO['tasks'] {
  return mockKeyPlanProgress.groups.flatMap((group) =>
    group.metrics.map((item) => ({
      id: item.id,
      name: item.name,
      progress: item.progress,
      status: statusToDto[item.status],
      leadDept: item.owner,
      deadline: item.deadline,
      description: `${group.title} · ${group.subtitle} · ${item.taskType} · ${item.projectLevel}`,
      milestones: [
        { label: item.milestone, done: item.status === 'completed' },
        { label: '支撑材料齐全', done: (item.materials?.length ?? 0) > 0 },
        { label: '年度验收', done: item.status === 'completed' },
      ],
      category: item.category,
      groupId: group.id,
      groupTitle: group.title,
      groupSubtitle: group.subtitle,
      taskType: item.taskType,
      projectLevel: item.projectLevel,
      majorDirection: item.majorDirection,
      target: item.target,
      actual: item.actual,
      unit: item.unit,
      milestone: item.milestone,
      materials: item.materials,
      riskReason: item.riskReason,
      handleStatus: item.handleStatus,
      followUp: item.followUp,
    })),
  )
}

const domainLabels = mockKeyPlanProgress.groups.map((g) => g.title)

export const mockKeyTasksDetail: KeyTasksDetailDTO = {
  summary: {
    total: mockKeyPlanProgress.overview.total,
    completed: mockKeyPlanProgress.overview.completed,
    ongoing: mockKeyPlanProgress.overview.ongoing,
    delayed: mockKeyPlanProgress.overview.attention,
    completionRate: mockKeyPlanProgress.overview.completionRate,
  },
  year: mockKeyPlanProgress.year,
  tasks: buildTasksFromPlan(),
  filterOptions: {
    years: ['全部', '2025', '2024', '2023'],
    domains: ['全部', ...domainLabels],
    taskTypes: [
      '全部',
      ...Array.from(new Set(mockKeyPlanProgress.metrics.map((m) => m.taskType))),
    ],
    owners: [
      '全部',
      ...Array.from(new Set(mockKeyPlanProgress.metrics.map((m) => m.owner))),
    ],
    projectLevels: [
      '全部',
      ...Array.from(new Set(mockKeyPlanProgress.metrics.map((m) => m.projectLevel))),
    ],
    majorDirections: [
      '全部',
      ...Array.from(new Set(mockKeyPlanProgress.metrics.map((m) => m.majorDirection))),
    ],
    statuses: ['全部', '已完成', '推进中', '需关注'],
  },
}

export function resolveGroupCategory(label: string): PlanGroupCategory | null {
  const entry = Object.entries(PLAN_GROUP_LABELS).find(([, v]) => v === label)
  return (entry?.[0] as PlanGroupCategory | undefined) ?? null
}
