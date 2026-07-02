export interface UniversityHubDTO {
  developmentIndex: number
  maxScore: number
  kpis: Array<{
    label: string
    value: number | string
    unit?: string
    trend?: { direction: 'up' | 'down' | 'flat'; value: number }
  }>
}

export interface CollegeRankingItemDTO {
  rank: number
  collegeName: string
  score: number
  trend: number
}

export interface UniversityOverviewDTO {
  hub: UniversityHubDTO
  collegeRanking: CollegeRankingItemDTO[]
  warningSummary: Array<{ label: string; count: number }>
}
