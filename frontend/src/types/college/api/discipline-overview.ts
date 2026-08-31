import type { TrendInfo } from '@/types/common'

/** 缺源占位：后端无数据时返回该字面量 */
export type MissingMark = '**'
export type DisciplineNum = number | MissingMark

export type SoftDimensionKey = 'school' | 'discipline' | 'source' | 'employment' | 'program'

export interface SoftDimensionDTO {
  key: SoftDimensionKey
  label: string
  score: DisciplineNum
  peerAverage: DisciplineNum
}

export interface DisciplineMajorRankDTO {
  name: string
  /** 所属系部 */
  department?: string | null
  grade: string
  nationalRank: DisciplineNum
  yoyChange: DisciplineNum
  provincialRank: DisciplineNum
  financePeerRank: DisciplineNum
  /** 办学年限 */
  foundedYears: DisciplineNum
  /** 专业认证/评级说明 */
  accreditation: string
  /** 建设类型：一流本科 / 特色专业 / 无 */
  constructionType: string
  /** 年度招生计划 */
  enrollmentPlan: DisciplineNum
  /** 在校学生数 */
  studentCount: DisciplineNum
  /** 学制 */
  educationYears: DisciplineNum
  /** 培养定位（精简） */
  orientation: string
  /** 年度建设重点（一级快览） */
  priority: string
  /** 专任教师 */
  teachers: DisciplineNum
  /** 博士占比 % */
  phdRatio: DisciplineNum
  /** 省级及以上人才数 */
  talentCount: DisciplineNum
  /** 近五年高水平论文 */
  papers: DisciplineNum
  /** 近五年省部级及以上纵向项目 */
  projects: DisciplineNum
  /** 授权专利/软著 */
  patents: DisciplineNum
  /** 录取平均分 */
  avgScore: DisciplineNum
  /** 第一志愿报考率 % */
  firstChoiceRate: DisciplineNum
  /** 去向落实率 % */
  employmentRate: DisciplineNum
  /** 国内升学占比 % */
  furtherStudyRate: DisciplineNum
  /** 软科专业排名五维得分（L1 细粒度诊断） */
  softDimensions: SoftDimensionDTO[]
  /** 对比院校本专业全国排名（含本校）- 综合/省内对标 */
  peerSchools: Array<{
    school: string
    rank: DisciplineNum
    isSelf?: boolean
  }>
  /** 财经院校本专业全国排名（含本校） */
  financePeerSchools: Array<{
    school: string
    rank: DisciplineNum
    isSelf?: boolean
  }>
  /** 本专业全国名次多年趋势（有快照的年份） */
  rankTrend?: {
    years: string[]
    ranks: number[]
  }
}

export interface DisciplineDimensionScoreDTO {
  key: string
  label: string
  score: DisciplineNum
  peerAverage: DisciplineNum
}

export interface DisciplineMajorProfileDTO {
  name: string
  /** 所属系部 */
  department?: string | null
  grade: string
  foundedYears: DisciplineNum
  accreditation: string
  constructionType: string
  softRank: DisciplineNum
  officialRank: DisciplineNum
  enrollmentPlan: DisciplineNum
  studentCount: DisciplineNum
  gradeDistribution: Array<{ grade: string; count: number }>
  educationYears: DisciplineNum
  orientation: string
  directions: string[]
  faculty: {
    total: DisciplineNum
    professor: DisciplineNum
    associate: DisciplineNum
    lecturer: DisciplineNum
    phdCount: DisciplineNum
    phdRatio: DisciplineNum
    talentCount: DisciplineNum
    teachingMasters: DisciplineNum
    courseLeaders: string
    researchTeams: string
  }
  outcomes: {
    papers: DisciplineNum
    representativePapers: string[]
    verticalProjects: DisciplineNum
    horizontalProjects: DisciplineNum
    keyProjects: string[]
    patents: DisciplineNum
    softwares: DisciplineNum
    eliteCourses: DisciplineNum
    reformProjects: DisciplineNum
    teachingAwards: DisciplineNum
    teachingTeams: DisciplineNum
    textbooks: DisciplineNum
    platforms: DisciplineNum
    practiceBases: DisciplineNum
    achievementItems?: DisciplineNum
  }
  enrollment: {
    avgScore: DisciplineNum
    minScore: DisciplineNum
    avgRank: DisciplineNum
    firstChoiceRate: DisciplineNum
    provinceInRatio: DisciplineNum
    maleRatio: DisciplineNum
    freshmanBasis: string
  }
  cultivation: {
    graduationRate: DisciplineNum
    degreeRate: DisciplineNum
    avgGpa: DisciplineNum
    competitionAwards: DisciplineNum
    innovationProjects: DisciplineNum
    employmentRate: DisciplineNum
    furtherStudyRate: DisciplineNum
    qualityJobRatio: DisciplineNum
    topIndustries: string[]
    topRegions: string[]
  }
  judgment: {
    trendSummary: string
    strengths: string[]
    weaknesses: string[]
    priorities: string[]
    dataNote: string
  }
  /** 软科五维细分（与一级专业卡同源） */
  softDimensions?: SoftDimensionDTO[]
}

export interface DisciplineBenchmarkDTO {
  school: string
  majorType: string
  eliteProgram: string
  sourceScore: string
  employmentNote: string
  gapNote: string
}

export interface DisciplineOverviewDTO {
  majors: DisciplineMajorRankDTO[]
  /** @deprecated 兼容旧汇总字段，优先使用 majors */
  ranking: {
    current: DisciplineNum
    yoyChange: DisciplineNum
    provincial: DisciplineNum
    peer: DisciplineNum
  }
  trend: {
    years: string[]
    ranks: DisciplineNum[]
    peerAvgRanks: DisciplineNum[]
    conclusion: string
  }
  dimensions: DisciplineDimensionScoreDTO[]
  radarConclusion: string
}

export interface DisciplineOverviewDetailDTO extends DisciplineOverviewDTO {
  majorRankings: Array<{
    major: string
    grade: string
    currentRank: DisciplineNum
    yoyChange: DisciplineNum
    provincialRank: DisciplineNum
    peerRank: DisciplineNum
    financePeerRank: DisciplineNum
  }>
  gradeHistory: Array<{
    major: string
    years: string[]
    grades: string[]
  }>
  rankTrends: Array<{
    major: string
    years: string[]
    nationalRanks: DisciplineNum[]
  }>
  provincialComparison: Array<{
    school: string
    rank: DisciplineNum
    isSelf?: boolean
  }>
  financeAheadSchools: Array<{
    school: string
    rank: DisciplineNum
  }>
  rankingSystems: Array<{ system: string; rank: DisciplineNum; change: DisciplineNum }>
  yearlyDetails: Array<{ year: string; rank: DisciplineNum; note?: string }>
  dimensionBreakdown: Array<{
    dimension: string
    items: Array<{ name: string; score: DisciplineNum }>
  }>
  strengths: string[]
  weaknesses: string[]
  benchmarkComparison: Array<{ school: string; rank: DisciplineNum; gap: DisciplineNum }>
  suggestions: string[]
  /** 单专业全景详情 */
  majorProfiles: DisciplineMajorProfileDTO[]
  /** 横向对标（公开信息宏观对比） */
  peerBenchmarks: DisciplineBenchmarkDTO[]
  benchmarkNote: string
}

/** @deprecated 保留导出以免旧引用报错；趋势结构未再单独使用 */
export type DisciplineTrendInfo = TrendInfo
