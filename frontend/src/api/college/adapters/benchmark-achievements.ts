import type {
  BenchmarkAchievementsDetailDTO,
  BenchmarkAchievementsDTO,
} from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkAchievementsDetailVM,
  BenchmarkAchievementsVM,
} from '@/types/college/view/benchmark-achievements'

export function adaptBenchmarkAchievements(dto: BenchmarkAchievementsDTO): BenchmarkAchievementsVM {
  return {
    summary: dto.summary,
    highlights: dto.highlights,
    byCategory: dto.byCategory,
  }
}

export function adaptBenchmarkAchievementsDetail(
  dto: BenchmarkAchievementsDetailDTO,
): BenchmarkAchievementsDetailVM {
  return {
    summary: dto.summary,
    highlights: dto.highlights,
    byCategory: dto.byCategory,
    byLevel: dto.byLevel,
    achievements: dto.achievements,
  }
}
