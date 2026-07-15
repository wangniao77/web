import type {
  DevQualityDimension,
  EvaluationIndicatorKey,
  SankeyLinkDTO,
  SankeyNodeDTO,
  StudentDevDetailDTO,
} from '@/types/college/api/student-dev-quality'
import type { TrendInfo } from '@/types/common'

export type { DevQualityDimension, EvaluationIndicatorKey }

export interface StudentDevQualityVM {
  dimension: DevQualityDimension
  enrolledUndergrad: number
  enrolledGraduate: number
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
  growthValue: {
    score: number
    level: string
    trend: TrendInfo
  }
  developmentIndex: number
  highPotential: {
    total: number
    ratio: number
    ratioTrend: TrendInfo
    structure: Array<{ key: string; label: string; count: number }>
    byDimension: Array<{ name: string; count: number }>
    courseDistribution: Array<{ course: string; count: number }>
    trend: { months: string[]; counts: number[]; developmentIndices: number[] }
  }
  groups: {
    excellent: { count: number; momChange: number }
    academicWarning: { count: number; momChange: number }
  }
  warningBreakdown: Array<{
    key: 'academic' | 'credit' | 'psychological'
    label: string
    count: number
  }>
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

export interface StudentFlowSankeyVM {
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

export interface StudentEvaluationDetailVM {
  key: EvaluationIndicatorKey
  label: string
  score: number
  unit?: string
  description: string
  trend: { months: string[]; values: number[] }
  highlights: Array<{ label: string; value: string }>
}

export type StudentDevDetailVM = StudentDevDetailDTO
