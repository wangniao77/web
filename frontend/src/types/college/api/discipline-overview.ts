export type SoftDimensionKey = 'school' | 'discipline' | 'source' | 'employment' | 'program'

export interface SoftDimensionDTO {
  key: SoftDimensionKey
  label: string
  score: number
  peerAverage: number
}

export interface DisciplineMajorRankDTO {
  name: string
  grade: string
  nationalRank: number
  yoyChange: number
  provincialRank: number
  financePeerRank: number
  /** 办学年限 */
  foundedYears: number
  /** 专业认证/评级说明 */
  accreditation: string
  /** 建设类型：一流本科 / 特色专业 / 无 */
  constructionType: string
  /** 年度招生计划 */
  enrollmentPlan: number
  /** 在校学生数 */
  studentCount: number
  /** 学制 */
  educationYears: number
  /** 培养定位（精简） */
  orientation: string
  /** 年度建设重点（一级快览） */
  priority: string
  /** 专任教师 */
  teachers: number
  /** 博士占比 % */
  phdRatio: number
  /** 省级及以上人才数 */
  talentCount: number
  /** 近五年高水平论文 */
  papers: number
  /** 近五年省部级及以上纵向项目 */
  projects: number
  /** 授权专利/软著 */
  patents: number
  /** 录取平均分 */
  avgScore: number
  /** 第一志愿报考率 % */
  firstChoiceRate: number
  /** 去向落实率 % */
  employmentRate: number
  /** 国内升学占比 % */
  furtherStudyRate: number
  /** 软科专业排名五维得分（L1 细粒度诊断） */
  softDimensions: SoftDimensionDTO[]
  /** 对比院校本专业全国排名（含本校）- 综合/省内对标 */
  peerSchools: Array<{
    school: string
    rank: number
    isSelf?: boolean
  }>
  /** 财经院校本专业全国排名（含本校） */
  financePeerSchools: Array<{
    school: string
    rank: number
    isSelf?: boolean
  }>
}

export interface DisciplineDimensionScoreDTO {
  key: string
  label: string
  score: number
  peerAverage: number
}

export interface DisciplineMajorProfileDTO {
  name: string
  grade: string
  foundedYears: number
  accreditation: string
  constructionType: string
  softRank: number
  officialRank: number
  enrollmentPlan: number
  studentCount: number
  gradeDistribution: Array<{ grade: string; count: number }>
  educationYears: number
  orientation: string
  directions: string[]
  faculty: {
    total: number
    professor: number
    associate: number
    lecturer: number
    phdCount: number
    phdRatio: number
    talentCount: number
    teachingMasters: number
    courseLeaders: string
    researchTeams: string
  }
  outcomes: {
    papers: number
    representativePapers: string[]
    verticalProjects: number
    horizontalProjects: number
    keyProjects: string[]
    patents: number
    softwares: number
    eliteCourses: number
    reformProjects: number
    teachingAwards: number
    teachingTeams: number
    textbooks: number
    platforms: number
    practiceBases: number
  }
  enrollment: {
    avgScore: number
    minScore: number
    avgRank: number
    firstChoiceRate: number
    provinceInRatio: number
    maleRatio: number
    freshmanBasis: string
  }
  cultivation: {
    graduationRate: number
    degreeRate: number
    avgGpa: number
    competitionAwards: number
    innovationProjects: number
    employmentRate: number
    furtherStudyRate: number
    qualityJobRatio: number
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
    current: number
    yoyChange: number
    provincial: number
    peer: number
  }
  trend: {
    years: string[]
    ranks: number[]
    peerAvgRanks: number[]
    conclusion: string
  }
  dimensions: DisciplineDimensionScoreDTO[]
  radarConclusion: string
}

export interface DisciplineOverviewDetailDTO extends DisciplineOverviewDTO {
  majorRankings: Array<{
    major: string
    grade: string
    currentRank: number
    yoyChange: number
    provincialRank: number
    peerRank: number
    financePeerRank: number
  }>
  gradeHistory: Array<{
    major: string
    years: string[]
    grades: string[]
  }>
  rankTrends: Array<{
    major: string
    years: string[]
    nationalRanks: number[]
  }>
  provincialComparison: Array<{
    school: string
    rank: number
    isSelf?: boolean
  }>
  financeAheadSchools: Array<{
    school: string
    rank: number
  }>
  rankingSystems: Array<{ system: string; rank: number; change: number }>
  yearlyDetails: Array<{ year: string; rank: number; note?: string }>
  dimensionBreakdown: Array<{
    dimension: string
    items: Array<{ name: string; score: number }>
  }>
  strengths: string[]
  weaknesses: string[]
  benchmarkComparison: Array<{ school: string; rank: number; gap: number }>
  suggestions: string[]
  /** 单专业全景详情 */
  majorProfiles: DisciplineMajorProfileDTO[]
  /** 横向对标（公开信息宏观对比） */
  peerBenchmarks: DisciplineBenchmarkDTO[]
  benchmarkNote: string
}
