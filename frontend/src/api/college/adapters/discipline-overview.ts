import type {
  DisciplineOverviewDetailDTO,
  DisciplineOverviewDTO,
} from '@/types/college/api/discipline-overview'
import type {
  DisciplineOverviewDetailVM,
  DisciplineOverviewVM,
} from '@/types/college/view/discipline-overview'

export function adaptDisciplineOverview(dto: DisciplineOverviewDTO): DisciplineOverviewVM {
  return {
    majors: dto.majors,
    ranking: dto.ranking,
    trend: dto.trend,
    dimensions: dto.dimensions,
    radarConclusion: dto.radarConclusion,
  }
}

export function adaptDisciplineOverviewDetail(
  dto: DisciplineOverviewDetailDTO,
): DisciplineOverviewDetailVM {
  return {
    majors: dto.majors,
    ranking: dto.ranking,
    trend: dto.trend,
    dimensions: dto.dimensions,
    radarConclusion: dto.radarConclusion,
    majorRankings: dto.majorRankings,
    gradeHistory: dto.gradeHistory,
    rankTrends: dto.rankTrends,
    provincialComparison: dto.provincialComparison,
    financeAheadSchools: dto.financeAheadSchools,
    rankingSystems: dto.rankingSystems,
    yearlyDetails: dto.yearlyDetails,
    dimensionBreakdown: dto.dimensionBreakdown,
    strengths: dto.strengths,
    weaknesses: dto.weaknesses,
    benchmarkComparison: dto.benchmarkComparison,
    suggestions: dto.suggestions,
    majorProfiles: dto.majorProfiles ?? [],
    peerBenchmarks: dto.peerBenchmarks ?? [],
    benchmarkNote: dto.benchmarkNote ?? '',
  }
}
