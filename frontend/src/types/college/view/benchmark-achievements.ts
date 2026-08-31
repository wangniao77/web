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

/** 一级优势/劣势页的一行 */
export interface BenchmarkSwotRowVM {
  key: BenchmarkPillarKey
  label: string
  metricLabel: string
  metricValue: string | number
  metricUnit?: string
  text: string
  empty: boolean
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
