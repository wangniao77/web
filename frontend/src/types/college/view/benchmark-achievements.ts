import type {
  AchievementCategory,
  BenchmarkAchievementItemDTO,
  BenchmarkAchievementsDetailDTO,
  BenchmarkAchievementsDTO,
  BenchmarkCompetitionsDTO,
  BenchmarkFacultyLeaderDTO,
  BenchmarkKeyProjectsDTO,
  BenchmarkMilestoneDTO,
  BenchmarkSummaryDTO,
  BenchmarkTopPapersDTO,
} from '@/types/college/api/benchmark-achievements'

export type BenchmarkAchievementItemVM = BenchmarkAchievementItemDTO
export type BenchmarkMilestoneVM = BenchmarkMilestoneDTO
export type BenchmarkFacultyLeaderVM = BenchmarkFacultyLeaderDTO
export type BenchmarkKeyProjectsVM = BenchmarkKeyProjectsDTO
export type BenchmarkTopPapersVM = BenchmarkTopPapersDTO
export type BenchmarkCompetitionsVM = BenchmarkCompetitionsDTO

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
  byLevel: BenchmarkAchievementsDetailDTO['byLevel']
  achievements: BenchmarkAchievementItemVM[]
}

export type { AchievementCategory }
