import generated from './key-plan-progress.generated.json'

export type PlanProgressStatus = 'completed' | 'ongoing' | 'attention'

/** 重点规划一级大类 */
export type PlanGroupCategory =
  | 'discipline'
  | 'faculty'
  | 'teaching'
  | 'research'
  | 'talent'
  | 'ai'
  | 'party'
  | (string & {})

export interface KeyPlanMetricItem {
  id: string
  name: string
  /** 所属一级大类 */
  category: PlanGroupCategory
  taskType: string
  projectLevel: string
  majorDirection: string
  target: string
  actual: string
  unit: string
  progress: number
  status: PlanProgressStatus
  owner: string
  deadline: string
  milestone: string
  materials: string[]
  riskReason?: string
  handleStatus?: string
  followUp?: Array<{ date: string; content: string }>
}

export interface KeyPlanGroup {
  id: PlanGroupCategory
  /** 分组主标题，如「学科建设」 */
  title: string
  /** 分组副标题/定位，如「学院发展根基」 */
  subtitle: string
  /** 默认是否展开 */
  defaultExpanded?: boolean
  metrics: KeyPlanMetricItem[]
}

export interface KeyPlanProgressData {
  year: string
  overview: {
    total: number
    completed: number
    ongoing: number
    attention: number
    completionRate: number
  }
  /** 一级大类分组（界面折叠/展开） */
  groups: KeyPlanGroup[]
  /** 扁平任务列表（由 groups 展开，便于详情/筛选复用） */
  metrics: KeyPlanMetricItem[]
  sourceFile?: string
}

export const PLAN_GROUP_LABELS: Record<string, string> = {
  discipline: '学科建设',
  faculty: '师资队伍建设',
  teaching: '教学建设',
  research: '科研建设',
  talent: '人才培养',
  ai: '广财AI智教专项改革',
  party: '党建与综合办学保障',
}

export const mockKeyPlanProgress = generated as unknown as KeyPlanProgressData

export function groupMetrics(
  category: PlanGroupCategory,
  data: KeyPlanProgressData = mockKeyPlanProgress,
) {
  return data.metrics.filter((m) => m.category === category)
}

/** @deprecated 使用 groupMetrics('discipline') */
export function researchMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return groupMetrics('discipline', data)
}

/** @deprecated 使用 groupMetrics('faculty') */
export function teachingMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return groupMetrics('faculty', data)
}

export function attentionRisks(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return data.metrics.filter((m) => m.status === 'attention')
}

export function groupSummary(group: KeyPlanGroup) {
  const total = group.metrics.length
  const completedCount = group.metrics.filter((m) => m.status === 'completed').length
  const attentionCount = group.metrics.filter((m) => m.status === 'attention').length
  const avgProgress = total
    ? Math.round(group.metrics.reduce((s, m) => s + m.progress, 0) / total)
    : 0
  return { total, completedCount, attentionCount, avgProgress }
}
