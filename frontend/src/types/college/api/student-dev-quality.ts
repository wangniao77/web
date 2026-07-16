import type { TrendInfo } from '@/types/common'

export type DevQualityDimension = 'major' | 'grade' | 'course'

export type EvaluationIndicatorKey =
  | 'academic'
  | 'courseCompletion'
  | 'comprehensive'
  | 'innovation'
  | 'competition'
  | 'employment'
  | 'academicRisk'
  | 'development'

export interface SankeyNodeDTO {
  name: string
}

export interface SankeyLinkDTO {
  source: string
  target: string
  value: number
}

/** 一级页概览：人才培养画像 KPI + 高潜结构 + 成长增值 + 成果转化 */
export interface StudentDevQualityDTO {
  dimension: DevQualityDimension
  enrolledUndergrad: number
  enrolledGraduate: number
  /** @deprecated 就业指标已迁出总览画像，详情页仍可能使用 */
  employmentRate: number
  employmentRateByYear: {
    years: string[]
    rates: number[]
  }
  outcomesPreview: Array<{
    key: 'employment' | 'civilService' | 'furtherStudy'
    label: string
    count: number
    ratio: number
  }>
  /** 成长增值指数（画像主指标） */
  growthValue: {
    score: number
    level: string
    trend: TrendInfo
  }
  /** 兼容旧字段，同步自 growthValue.score */
  developmentIndex: number
  highPotential: {
    total: number
    ratio: number
    ratioTrend: TrendInfo
    /** 高潜结构（竞赛/学业/科研/实践等） */
    structure: Array<{ key: string; label: string; count: number }>
    byDimension: Array<{ name: string; count: number }>
    courseDistribution: Array<{ course: string; count: number }>
    trend: { months: string[]; counts: number[]; developmentIndices: number[] }
  }
  groups: {
    excellent: { count: number; momChange: number }
    academicWarning: { count: number; momChange: number }
  }
  /** 预警细分：学业 / 学分 / 心理 */
  warningBreakdown: Array<{
    key: 'academic' | 'credit' | 'psychological'
    label: string
    count: number
  }>
  /** 底部成果转化率 */
  outcomeConversion: Array<{
    key: 'research' | 'competition' | 'practice'
    label: string
    rate: number
  }>
  evaluationIndicators: Array<{
    key: EvaluationIndicatorKey
    label: string
    score: number
    unit?: string
    trend?: TrendInfo
  }>
}

export interface StudentFlowSankeyDTO {
  entrance: { nodes: SankeyNodeDTO[]; links: SankeyLinkDTO[] }
  outcome: { nodes: SankeyNodeDTO[]; links: SankeyLinkDTO[] }
  summary: {
    entranceTotal: number
    graduateTotal: number
    avgEntranceScore: number
    employmentRate: number
    firstChoiceRate: number
    furtherRate: number
    topEntranceRegions: Array<{ name: string; count: number }>
    topOutcomes: Array<{ name: string; count: number }>
  }
}

export interface StudentEvaluationDetailDTO {
  key: EvaluationIndicatorKey
  label: string
  score: number
  unit?: string
  description: string
  trend: { months: string[]; values: number[] }
  highlights: Array<{ label: string; value: string }>
}

/** 二级专题页 */
export interface StudentDevDetailDTO {
  summary: {
    enrolledUndergrad: number
    enrolledGraduate: number
    employmentRate: number
    highPotential: number
    warning: number
  }
  outcomes: Array<{
    key: 'employment' | 'civilService' | 'furtherStudy'
    label: string
    count: number
    ratio: number
  }>
  salaryByMajor: {
    years: string[]
    series: Array<{ name: string; data: number[] }>
  }
  gaokaoScores: Array<{
    major: string
    avgScore: number
    minScore: number
    maxScore: number
  }>
  highPotentialBreakdown: {
    byMajor: Array<{ name: string; count: number }>
    byGrade: Array<{ name: string; count: number }>
    byType: Array<{ name: string; count: number }>
  }
  warningBreakdown: {
    byType: Array<{ name: string; count: number }>
    byMajor: Array<{ name: string; count: number }>
    byGrade: Array<{ name: string; count: number }>
  }
}

export interface StudentDevQualityScope {
  collegeId?: string
  academicYear?: string
  semester?: '1' | '2'
  dimension?: DevQualityDimension
}
