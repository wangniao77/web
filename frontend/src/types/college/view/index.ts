import type { TrendInfo } from '@/types/common'
import type { KpiKey } from '@/types/college/api'
import type { IconKind } from '@/components/college/DashIcon.vue'
import type { ScoreTone } from '@/utils/scoreTone'

export type CoreOrbitPosition = 'tl' | 'ml' | 'bl' | 'tr' | 'mr' | 'br'

export interface OverviewHubKpiDetailVM {
  label: string
  value: string
  /** 悬停说明（新手友好） */
  tip?: string
}

export interface OverviewHubKpiVM {
  key?: KpiKey
  label: string
  value: string
  /** 主分旁环比标记，如 ↑0.6（绿色小号展示） */
  valueDelta?: string
  trend?: TrendInfo
  icon?: IconKind
  position?: CoreOrbitPosition
  /** 学生舱：指标下方细节（GPA、证书等） */
  details?: OverviewHubKpiDetailVM[]
  /** 等级文案（如身心状态不用分数时） */
  levelText?: string
  /** 分数/等级配色：risk 红 / warn 黄 / good 蓝 */
  scoreTone?: ScoreTone
  /** 模块悬停说明（新手友好） */
  tip?: string
}

export interface OverviewHubVM {
  developmentIndex: number
  maxScore: number
  starLevel: number
  kpis: OverviewHubKpiVM[]
  /** 综合发展指数环比说明，如「↑0.6」 */
  centerDelta?: string
  /** 学生舱：中心星级改为年级排名文案，如「年级排名 12/120」 */
  centerRankText?: string
  /** 学生舱：中心悬浮前后三（示意名单） */
  rankPeers?: {
    top: Array<{ name: string; rank: number }>
    bottom: Array<{ name: string; rank: number }>
    tip?: string
  }
}

export interface KeyTaskVM {
  id: string
  name: string
  progress: number
  statusLabel: string
  statusClass: string
}

export interface StudentOverviewVM {
  metrics: Array<{ label: string; value: string; trend?: TrendInfo }>
  employmentDirection: Array<{ name: string; value: number }>
  employmentRegions: Array<{ name: string; value: number }>
  qualityDevelopment: Array<{ name: string; value: number }>
  warnings: { academic: number; fundingRate: string }
}

export interface TeachingOverviewVM {
  metrics: Array<{ label: string; value: string }>
  evaluationTrend: { years: string[]; values: number[] }
  courseConstruction: Array<{ name: string; value: number }>
}

export interface ResearchOverviewVM {
  metrics: Array<{ label: string; value: string; trend?: TrendInfo }>
  fundingTrend: {
    years: string[]
    series: Array<{ name: string; data: number[] }>
  }
  platforms: Array<{ name: string; count: number }>
}

export interface WarningOverviewVM {
  categories: Array<{
    label: string
    count: number
    momChange: number
    type: string
  }>
  trend: {
    months: string[]
    series: Array<{ name: string; data: number[] }>
  }
  creditCompletion: {
    threshold: number
    categories: string[]
    junior: number[]
    senior: number[]
  }
}
