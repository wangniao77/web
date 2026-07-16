export type AchievementCategory =
  | 'teaching'
  | 'research'
  | 'competition'
  | 'platform'
  | 'faculty'
  | 'social'

export interface BenchmarkAchievementItemDTO {
  id: string
  title: string
  category: AchievementCategory
  categoryLabel: string
  level: string
  date: string
  leader?: string
}

export interface BenchmarkAchievementsDTO {
  summary: {
    annualHonors: number
    competitionAwards: number
    researchOutputs: number
    nationalProvincial: number
    /** 平台成果 */
    platformOutputs: number
    /** 师资成果 */
    facultyAchievements: number
  }
  highlights: BenchmarkAchievementItemDTO[]
  byCategory: Array<{
    category: AchievementCategory
    label: string
    count: number
  }>
}

export interface BenchmarkAchievementsDetailDTO extends BenchmarkAchievementsDTO {
  byLevel: Array<{ level: string; count: number }>
  achievements: BenchmarkAchievementItemDTO[]
}
