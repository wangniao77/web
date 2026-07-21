import type {
  BenchmarkAchievementsDetailDTO,
  BenchmarkAchievementsDTO,
  BenchmarkFeaturedDTO,
} from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkAchievementsDetailVM,
  BenchmarkAchievementsVM,
  BenchmarkFeaturedVM,
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
    categoryPanels: dto.categoryPanels.map((p) => ({ ...p })),
  }
}

export function adaptBenchmarkFeatured(dto: BenchmarkFeaturedDTO): BenchmarkFeaturedVM {
  return {
    overview: dto.overview.map((m) => ({ ...m })),
    categoryDistribution: dto.categoryDistribution.map((x) => ({ ...x })),
    levelDistribution: dto.levelDistribution.map((x) => ({ ...x })),
    sections: dto.sections.map((s) => ({
      ...s,
      metrics: s.metrics.map((m) => ({ ...m })),
      items: s.items.map((it) => ({ ...it })),
      chart: s.chart
        ? { title: s.chart.title, items: s.chart.items.map((c) => ({ ...c })) }
        : undefined,
    })),
  }
}
