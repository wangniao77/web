import type {
  DisciplineBenchmarkDTO,
  DisciplineDimensionScoreDTO,
  DisciplineMajorProfileDTO,
  DisciplineMajorRankDTO,
  DisciplineOverviewDetailDTO,
  DisciplineOverviewDTO,
} from '@/types/college/api/discipline-overview'

export type DisciplineDimensionScoreVM = DisciplineDimensionScoreDTO
export type DisciplineMajorRankVM = DisciplineMajorRankDTO
export type DisciplineMajorProfileVM = DisciplineMajorProfileDTO
export type DisciplineBenchmarkVM = DisciplineBenchmarkDTO

export interface DisciplineOverviewVM {
  majors: DisciplineMajorRankVM[]
  ranking: DisciplineOverviewDTO['ranking']
  trend: DisciplineOverviewDTO['trend']
  dimensions: DisciplineDimensionScoreVM[]
  radarConclusion: string
}

export interface DisciplineOverviewDetailVM {
  majors: DisciplineMajorRankVM[]
  ranking: DisciplineOverviewDTO['ranking']
  trend: DisciplineOverviewDTO['trend']
  dimensions: DisciplineDimensionScoreVM[]
  radarConclusion: string
  majorRankings: DisciplineOverviewDetailDTO['majorRankings']
  gradeHistory: DisciplineOverviewDetailDTO['gradeHistory']
  rankTrends: DisciplineOverviewDetailDTO['rankTrends']
  provincialComparison: DisciplineOverviewDetailDTO['provincialComparison']
  financeAheadSchools: DisciplineOverviewDetailDTO['financeAheadSchools']
  rankingSystems: DisciplineOverviewDetailDTO['rankingSystems']
  yearlyDetails: DisciplineOverviewDetailDTO['yearlyDetails']
  dimensionBreakdown: DisciplineOverviewDetailDTO['dimensionBreakdown']
  strengths: DisciplineOverviewDetailDTO['strengths']
  weaknesses: DisciplineOverviewDetailDTO['weaknesses']
  benchmarkComparison: DisciplineOverviewDetailDTO['benchmarkComparison']
  suggestions: DisciplineOverviewDetailDTO['suggestions']
  majorProfiles: DisciplineMajorProfileVM[]
  peerBenchmarks: DisciplineBenchmarkVM[]
  benchmarkNote: string
}
