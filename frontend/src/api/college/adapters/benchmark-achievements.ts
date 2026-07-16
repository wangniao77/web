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
    subtitle: dto.subtitle,
    milestones: dto.milestones.map((m) => ({ ...m })),
    facultyLeaders: {
      ...dto.facultyLeaders,
      roster: dto.facultyLeaders.roster.map((r) => ({ ...r })),
    },
    keyProjects: { ...dto.keyProjects },
    topPapers: {
      ...dto.topPapers,
      journals: [...dto.topPapers.journals],
    },
    competitions: { ...dto.competitions },
    gallery: dto.gallery.map((g) => ({ ...g })),
    summary: { ...dto.summary },
    highlights: dto.highlights.map((h) => ({ ...h })),
    byCategory: dto.byCategory.map((c) => ({ ...c })),
  }
}

export function adaptBenchmarkAchievementsDetail(
  dto: BenchmarkAchievementsDetailDTO,
): BenchmarkAchievementsDetailVM {
  return {
    ...adaptBenchmarkAchievements(dto),
    byLevel: dto.byLevel.map((l) => ({ ...l })),
    achievements: dto.achievements.map((a) => ({ ...a })),
  }
}
