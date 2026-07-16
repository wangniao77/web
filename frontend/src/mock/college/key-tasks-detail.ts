import type { KeyTasksDetailDTO } from '@/types/college/api/details'
import { mockKeyPlanProgress } from '@/mock/college/key-plan-progress'

const statusToDto = {
  completed: 'completed',
  ongoing: 'ongoing',
  attention: 'delayed',
} as const

function buildTasksFromPlan(): KeyTasksDetailDTO['tasks'] {
  return mockKeyPlanProgress.metrics.map((item) => ({
    id: item.id,
    name: item.name,
    progress: item.progress,
    status: statusToDto[item.status],
    leadDept: item.owner,
    deadline: item.deadline,
    description:
      item.category === 'research'
        ? `科研重点规划 · ${item.taskType} · ${item.projectLevel}`
        : `教学重点规划 · ${item.taskType} · ${item.projectLevel}`,
    milestones: [
      { label: item.milestone, done: item.status === 'completed' },
      { label: '支撑材料齐全', done: (item.materials?.length ?? 0) > 0 },
      { label: '年度验收', done: item.status === 'completed' },
    ],
    category: item.category,
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
  }))
}

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
    domains: ['全部', '科研', '教学'],
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
