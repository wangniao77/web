import type {
  AchievementCategory,
  BenchmarkAchievementItemDTO,
  BenchmarkAchievementsDetailDTO,
  BenchmarkAchievementsDTO,
  BenchmarkCompetitionsDTO,
  BenchmarkDetailPanel,
  BenchmarkFacultyLeaderDTO,
  BenchmarkFeaturedDTO,
  BenchmarkKeyProjectsDTO,
  BenchmarkMilestoneDTO,
  BenchmarkPillarDTO,
  BenchmarkPillarKey,
  BenchmarkSummaryDTO,
  BenchmarkTopPapersDTO,
} from '@/types/college/api/benchmark-achievements'

export type BenchmarkAchievementItemVM = BenchmarkAchievementItemDTO
export type BenchmarkMilestoneVM = BenchmarkMilestoneDTO
export type BenchmarkFacultyLeaderVM = BenchmarkFacultyLeaderDTO
export type BenchmarkKeyProjectsVM = BenchmarkKeyProjectsDTO
export type BenchmarkTopPapersVM = BenchmarkTopPapersDTO
export type BenchmarkCompetitionsVM = BenchmarkCompetitionsDTO
export type BenchmarkDetailPanelVM = BenchmarkDetailPanel
export type BenchmarkFeaturedVM = BenchmarkFeaturedDTO
export type BenchmarkPillarVM = BenchmarkPillarDTO

/** 一级数据页刊头主指标 */
export interface BenchmarkHeroKpiVM {
  key: string
  label: string
  value: number
  unit: string
}

/** 一级数据页五大板块索引 */
export interface BenchmarkDataCardVM {
  key: BenchmarkPillarKey
  label: string
  shortLabel: string
  metrics: Array<{ label: string; value: string | number; unit?: string }>
}

/** 对标项达标状态：达标 / 接近 / 缺口 / 无数据 */
export type BenchmarkGaugeStatus = 'met' | 'near' | 'gap' | 'empty'

/** 一级优势/劣势页：一条可对标的存量项 */
export interface BenchmarkGaugeItemVM {
  key: BenchmarkPillarKey
  label: string
  shortLabel: string
  metricLabel: string
  value: number
  target: number
  unit: string
  ratio: number
  status: BenchmarkGaugeStatus
  gap: number
  statusLabel: string
  fact: string
}

export interface BenchmarkSwotBoardVM {
  side: 'strengths' | 'weaknesses'
  items: BenchmarkGaugeItemVM[]
  summary: {
    met: number
    near: number
    gap: number
    empty: number
    totalGap: number
  }
  headline: string
}

/** 优势页：高光成果展陈 */
export interface BenchmarkShowcaseHighlightVM {
  id: string
  title: string
  pillar: BenchmarkPillarKey
  pillarLabel: string
  level?: string
}

export interface BenchmarkShowcaseVM {
  headline: string
  star: BenchmarkGaugeItemVM | null
  medals: BenchmarkGaugeItemVM[]
  highlights: BenchmarkShowcaseHighlightVM[]
}

/** 劣势页：按缺口排序的整改清单 */
export interface BenchmarkTriageVM {
  headline: string
  worst: BenchmarkGaugeItemVM | null
  rest: BenchmarkGaugeItemVM[]
}

/** 二级「本板块成果清单」行 */
export interface BenchmarkPillarEvidenceVM {
  id: string
  title: string
  categoryLabel?: string
  level?: string
  date?: string
  leader?: string
  source?: string
}

export interface BenchmarkAchievementsVM {
  subtitle: string
  milestones: BenchmarkMilestoneVM[]
  facultyLeaders: BenchmarkFacultyLeaderVM
  keyProjects: BenchmarkKeyProjectsVM
  topPapers: BenchmarkTopPapersVM
  competitions: BenchmarkCompetitionsVM
  gallery: BenchmarkAchievementItemVM[]
  summary: BenchmarkSummaryDTO
  highlights: BenchmarkAchievementItemVM[]
  byCategory: BenchmarkAchievementsDTO['byCategory']
  pillars: BenchmarkPillarVM[]
}

export interface BenchmarkAchievementsDetailVM {
  subtitle: string
  milestones: BenchmarkMilestoneVM[]
  facultyLeaders: BenchmarkFacultyLeaderVM
  keyProjects: BenchmarkKeyProjectsVM
  topPapers: BenchmarkTopPapersVM
  competitions: BenchmarkCompetitionsVM
  gallery: BenchmarkAchievementItemVM[]
  summary: BenchmarkSummaryDTO
  highlights: BenchmarkAchievementItemVM[]
  byCategory: BenchmarkAchievementsDTO['byCategory']
  pillars: BenchmarkPillarVM[]
  byLevel: BenchmarkAchievementsDetailDTO['byLevel']
  byDepartment?: BenchmarkAchievementsDetailDTO['byDepartment']
  filters?: BenchmarkAchievementsDetailDTO['filters']
  achievements: BenchmarkAchievementItemVM[]
  categoryPanels: BenchmarkDetailPanelVM[]
}

export type { AchievementCategory, BenchmarkPillarKey }
