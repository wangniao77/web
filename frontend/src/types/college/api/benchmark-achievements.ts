export type AchievementCategory =
  | 'teaching'
  | 'research'
  | 'competition'
  | 'platform'
  | 'faculty'
  | 'social'

export type MilestoneBadge =
  | '历史突破'
  | '平台跃升'
  | '育人高光'
  | '年度里程碑'
  | '标志性成果'
  | '荣誉称号'

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
  /** 关联负责人，如荣誉称号获得者 */
  leader?: string
}

export interface BenchmarkFacultyLeaderDTO {
  total: number
  national: number
  provincial: number
  /** 博导人数 */
  doctoralSupervisors?: number
  /** ESI 高被引学者人数 */
  esiHighCited?: number
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
  /** 中科院一区论文数 */
  firstTierCount?: number
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
  /** 成果总览底部的分项透视面板（按钮切换） */
  categoryPanels: BenchmarkDetailPanel[]
}

/** 分项面板中的单条指标 */
export interface BenchmarkPanelMetric {
  label: string
  value: string | number
  unit?: string
  /** 是否为重点突出指标（高亮显示） */
  highlight?: boolean
}

/** 成果总览底部的分项透视面板，如「攻坚・课题」「科研产出」等 */
export interface BenchmarkDetailPanel {
  key: string
  /** 板块命名，如 攻坚·课题 */
  name: string
  icon: string
  desc: string
  metrics: BenchmarkPanelMetric[]
  /** 重点备注，如牵头单位、特等奖清单等 */
  highlights?: string[]
}

/** 精品成果集萃 · 九大板块专题透视（二级页「分项成果透视」） */
export type FeaturedSectionKey =
  | 'topic'
  | 'output'
  | 'paper'
  | 'award'
  | 'talent'
  | 'platform'
  | 'competition'
  | 'collective'
  | 'service'

/** 概览 / 面板中的单条指标 */
export interface FeaturedMetric {
  label: string
  value: string | number
  unit?: string
  /** 配色基调：highlight 青 / gold 金 / green 绿 / default 默认 */
  tone?: 'default' | 'highlight' | 'gold' | 'green'
  /** 是否强调（重点指标，额外高亮） */
  emphasis?: boolean
}

/** 分类型明细表中的一行 */
export interface FeaturedItem {
  name: string
  category?: string
  level?: string
  org?: string
  leader?: string
  date?: string
  note?: string
}

/** 板块专属的柱状图数据 */
export interface FeaturedChart {
  title: string
  items: Array<{ label: string; value: number }>
}

/** 九大板块中的一个专题 */
export interface FeaturedSection {
  key: FeaturedSectionKey
  /** 板块名，如 攻坚·课题 */
  name: string
  /** 数据来源说明，如 源自「攻坚课题」板块 */
  origin: string
  desc: string
  metrics: FeaturedMetric[]
  /** 一句话重点 */
  highlight?: string
  chart?: FeaturedChart
  items: FeaturedItem[]
}

/** 精品成果集萃专题透视 DTO */
export interface BenchmarkFeaturedDTO {
  overview: FeaturedMetric[]
  categoryDistribution: Array<{ label: string; count: number }>
  levelDistribution: Array<{ label: string; count: number }>
  sections: FeaturedSection[]
}
