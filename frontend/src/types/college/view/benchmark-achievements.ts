import type {
  AchievementCategory,
  BenchmarkAchievementItemDTO,
  BenchmarkAchievementsDetailDTO,
  BenchmarkAchievementsDTO,
} from '@/types/college/api/benchmark-achievements'

export type BenchmarkAchievementItemVM = BenchmarkAchievementItemDTO

export interface BenchmarkAchievementsVM {
  summary: BenchmarkAchievementsDTO['summary']
  highlights: BenchmarkAchievementItemVM[]
  byCategory: BenchmarkAchievementsDTO['byCategory']
}

export interface BenchmarkAchievementsDetailVM {
  summary: BenchmarkAchievementsDTO['summary']
  highlights: BenchmarkAchievementItemVM[]
  byCategory: BenchmarkAchievementsDTO['byCategory']
  byLevel: BenchmarkAchievementsDetailDTO['byLevel']
  achievements: BenchmarkAchievementItemVM[]
}

export type { AchievementCategory }
