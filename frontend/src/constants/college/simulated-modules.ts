/**
 * 学院大屏中尚未对接后端、当前展示 mock 数据的模块。
 * 对接完成后从列表中移除对应 id 即可隐藏「模拟数据」标签。
 */
export const COLLEGE_SIMULATED_MODULE_IDS = [
  'key-tasks',
  'benchmark-achievements',
  'professional-support',
  'faculty-atlas',
  'teacher-analytics',
  'discipline-overview',
] as const

/** 预警模块内尚未对接的预警类别（type 字段） */
export const COLLEGE_SIMULATED_WARNING_TYPES = [
  'psychological',
] as const

export type CollegeSimulatedModuleId = (typeof COLLEGE_SIMULATED_MODULE_IDS)[number]
export type CollegeSimulatedWarningType = (typeof COLLEGE_SIMULATED_WARNING_TYPES)[number]

const simulatedModuleSet = new Set<string>(COLLEGE_SIMULATED_MODULE_IDS)
const simulatedWarningSet = new Set<string>(COLLEGE_SIMULATED_WARNING_TYPES)

export function isCollegeSimulatedModule(
  id: string | null | undefined,
): id is CollegeSimulatedModuleId {
  return !!id && simulatedModuleSet.has(id)
}

export function isCollegeSimulatedWarning(
  type: string | null | undefined,
): type is CollegeSimulatedWarningType {
  return !!type && simulatedWarningSet.has(type)
}

const simulatedDetailKindSet = new Set<string>([
  'benchmark-detail',
  'teacher-detail',
  'discipline-detail',
])

export function isCollegeSimulatedDetailKind(kind: string | null | undefined): boolean {
  return !!kind && (simulatedDetailKindSet.has(kind) || simulatedModuleSet.has(kind))
}

export const COLLEGE_SIMULATED_DATA_HINT =
  '接口尚未对接，当前为模拟演示数据，非真实业务数据'

/** 图表 / 数字示意色：缺源 mock 必须使用此红色 */
export const COLLEGE_MOCK_DATA_COLOR = '#ff4d4f'
export const COLLEGE_MOCK_CHART_COLORS = [
  '#ff4d4f',
  '#ff7875',
  '#cf1322',
  '#a8071a',
  '#ff9c6e',
  '#ff85c0',
] as const
