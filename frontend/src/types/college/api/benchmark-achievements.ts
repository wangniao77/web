export type AchievementCategory =
  | 'teaching'
  | 'research'
  | 'competition'
  | 'platform'
  | 'faculty'
  | 'social'

export type MilestoneBadge = '历史突破' | '平台跃升' | '育人高光'

export interface BenchmarkAchievementItemDTO {
  id: string
  title: string
  category: AchievementCategory
  categoryLabel: string
  level: string
  date: string
  leader?: string
}

export interface BenchmarkMilestoneDTO {
  id: string
  badge: MilestoneBadge
  title: string
  interpretation: string
  yearLabel?: string
}

export interface BenchmarkFacultyLeaderDTO {
  total: number
  national: number
  provincial: number
  roster: Array<{ name: string; honor: string }>
}

export interface BenchmarkKeyProjectsDTO {
  national: number
  provincial: number
  fundingWan: number
}

export interface BenchmarkTopPapersDTO {
  count: number
  citations: number
  journals: string[]
}

export interface BenchmarkCompetitionsDTO {
  /** 三大赛等 A 类赛事国奖总数 */
  nationalAwards: number
  /** 特等奖 / 金奖数量 */
  goldOrSpecial: number
}

/** 二级详情仍使用的汇总 KPI（兼容下钻页） */
export interface BenchmarkSummaryDTO {
  annualHonors: number
  competitionAwards: number
  researchOutputs: number
  nationalProvincial: number
  platformOutputs: number
  facultyAchievements: number
}

export interface BenchmarkAchievementsDTO {
  /** 眉题副文案 */
  subtitle: string
  milestones: BenchmarkMilestoneDTO[]
  facultyLeaders: BenchmarkFacultyLeaderDTO
  keyProjects: BenchmarkKeyProjectsDTO
  topPapers: BenchmarkTopPapersDTO
  competitions: BenchmarkCompetitionsDTO
  /** 数智成果长廊 */
  gallery: BenchmarkAchievementItemDTO[]
  /** 兼容旧字段：详情页 KPI / 分类 */
  summary: BenchmarkSummaryDTO
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
