import type { TrendInfo } from '@/types/common'

/** 缺源占位：后端无数据时返回该字面量 */
export type MissingMark = '**'
export type FacultyNum = number | MissingMark

export type FacultyHealthLevel = '优' | '中' | '紧' | '警'

export type FacultyMetricKey =
  | 'ratio'
  | 'doctor'
  | 'title'
  | 'course'
  | 'research'
  | 'new'

export type FacultySupportGrade = 'A' | 'B' | 'C' | 'D' | 'E'

export type FacultyMetricTone = 'ok' | 'warn' | 'risk' | 'up' | 'down'

export interface FacultyHealthDTO {
  score: number
  structure: FacultyHealthLevel
  load: FacultyHealthLevel
  risk: FacultyHealthLevel
}

export interface FacultySupportDimensionDTO {
  key: FacultyMetricKey
  label: string
  raw: FacultyNum
  unit: string
  score: FacultyNum
  meaning: string
  tone?: FacultyMetricTone
  incomplete?: boolean
}

export interface FacultySupportIndexDTO {
  score: number
  grade: FacultySupportGrade
  gradeLabel: string
  stars: number
  strengths: string[]
  weaknesses: string[]
  formula: string
  dimensions: FacultySupportDimensionDTO[]
  targets?: {
    stuTeacher: number
    phdRatio: number
    seniorRatio: number
    researchProjects: number
    researchPapers: number
    researchFunding: number
    newPhd: number
    newTalent: number
    newSenior: number
  }
}

export interface FacultyWarningSummaryDTO {
  totalWarnings: FacultyNum
  redCount: FacultyNum
  yellowCount: FacultyNum
  blueCount: FacultyNum
}

export interface FacultyMetricDTO {
  key: FacultyMetricKey
  label: string
  value: FacultyNum
  unit: string
  /** 管理含义，如「距目标还差2pp」「缺编7人」 */
  meaning: string
  tone?: FacultyMetricTone
  target?: number
  yoyChange?: number
  incomplete?: boolean
}

export interface TeacherAnalyticsDTO {
  /** 当前分析学期，如 2025-2026-2 */
  term: string
  /** 请求的学期（无数据时可能与 term 不同） */
  requestedTerm?: string
  /** 请求学期无数据时是否回退到最新有数据学期 */
  termFallback?: boolean
  /** 库中有课时数据的学期列表（新→旧） */
  availableTerms: string[]
  /** 学期标准课时 */
  standardHours: number
  /** 学期超负荷阈值 */
  overloadHours: number
  /** 兼容旧字段：由 PSI 映射 */
  health: FacultyHealthDTO
  /** 专业支撑指数 */
  supportIndex: FacultySupportIndexDTO
  /** 预警条数摘要（首页底栏） */
  warningSummary?: FacultyWarningSummaryDTO
  /** L1 六维 PSI 卡 */
  metrics: FacultyMetricDTO[]
  /** L1 诊断结论 */
  insights: string[]
  summary: {
    /** 专任教师 */
    totalTeachers: FacultyNum
    phdRatio: FacultyNum
    /** 高级职称占比 */
    seniorTitleRatio: FacultyNum
    /** 平均学期课时 */
    avgTeachingHours: FacultyNum
    /** 教师标兵 */
    modelTeacherCount: FacultyNum
    warningCount: FacultyNum
    publicService: {
      count: FacultyNum
      hours: FacultyNum
    }
    /** 高层次人才 */
    highLevelTalentCount: FacultyNum
    /** 生师比 */
    studentTeacherRatio: string
    /** 兼容旧字段 */
    excellentCount: FacultyNum
  }
  titleStructure: Array<{ title: string; count: number }>
  profile: {
    teaching: FacultyNum
    research: FacultyNum
    socialService: FacultyNum
  }
  groups: {
    excellent: { count: FacultyNum; ratio: FacultyNum; momChange: FacultyNum }
    warning: { count: FacultyNum; ratio: FacultyNum; momChange: FacultyNum }
  }
  highlights: Array<{ label: string; value: string }>
}

export interface TeacherAnalyticsDetailDTO extends TeacherAnalyticsDTO {
  structure: {
    age: Array<{ label: string; count: number; ratio: number }>
    education: Array<{ label: string; count: number; ratio: number }>
    title: Array<{ label: string; count: number; ratio: number }>
    academicOrigin: Array<{ label: string; count: number; ratio: number }>
    /** 梯队结构 */
    echelon: Array<{ label: string; count: number; ratio: number; description: string }>
    /** 近5年退休人数预测 */
    retirementForecast: Array<{ year: number; count: number }>
    /** 临近退休人员与课程接续 */
    retiringTeachers: Array<{
      name: string
      title: string
      major: string
      /** 预计退休年份 */
      retireYear: number
      /** 承担的核心课程 */
      courses: Array<{ name: string; semester: string; studentCount: number }>
      /** 是否为核心课程 / 高负荷，需重点接续 */
      critical: boolean
    }>
    /** 专业方向分布 */
    majorDirection: Array<{ label: string; count: number; ratio: number }>
  }
  teachingHoursDetail: Array<{
    name: string
    title: string
    major: string
    hours: number
  }>
  modelTeachers: Array<{
    name: string
    title: string
    major: string
    year: string
    highlight: string
  }>
  warningSamples: Array<{
    name: string
    title: string
    major: string
    reason: string
    type: string
    status: string
  }>
  publicServiceAnalysis: {
    byTeacher: Array<{ name: string; count: number; hours: number }>
    byType: Array<{ type: string; count: number; hours: number }>
    byMonth: Array<{ month: string; count: number; hours: number }>
  }
  assessmentIndicators: Array<{
    key: string
    label: string
    score: FacultyNum
    unit?: string
    trend?: TrendInfo
  }>
  majorComparison: Array<{
    major: string
    /** 系部（与 major 同口径时可并存） */
    department?: string
    /** 专任教师人数 */
    headcount: number
    phdRatio: number
    /** 高级职称占比 */
    seniorRatio: number
    /** 平均课时 */
    avgHours: FacultyNum
    /** 生师比 */
    studentTeacherRatio: string
    /** 核心课程支撑率（有稳定教学团队的课程占比） */
    coreCourseSupportRate: FacultyNum
    /** 青年教师（35岁以下）比例 */
    youngTeacherRatio: FacultyNum
    /** 高层次人才数 */
    highTalentCount: FacultyNum
    /** 近五年新增教师 */
    newTeachers5yr: number
    /** 专业支撑综合指数 0-100 */
    supportIndex: number
    /** 六维 S_* 得分 */
    scores?: {
      ratio?: FacultyNum
      doctor?: FacultyNum
      title?: FacultyNum
      course?: FacultyNum
      research?: FacultyNum
      new?: FacultyNum
    }
    incompleteFlags?: string[]
    /** 专业支撑详细建议（怎么做） */
    suggestions: string[]
  }>
  filters?: {
    departments?: string[]
    selectedDepartment?: string | null
  }
  excellentSamples: Array<{ name: string; title: string; major: string; department?: string }>
  /** 教学投入（单学期口径） */
  teachingInvestment: {
    term: string
    standardHours: number
    overloadHours: number
    avgHours: FacultyNum
    /** 最高课时 */
    maxTeacher: { name: string; title: string; major: string; department?: string; hours: number }
    /** 最低课时 */
    minTeacher: { name: string; title: string; major: string; department?: string; hours: number }
    /** 每位教师的课程及课时 */
    teacherCourses: Array<{
      name: string
      title: string
      major: string
      totalHours: number
      courses: Array<{ name: string; hours: number; studentCount: number; semester: string; className?: string }>
    }>
    /** 课时分布 */
    hourDistribution: Array<{ range: string; count: number; ratio: number }>
    /** 超课时教师名单 */
    overloadedTeachers: Array<{
      name: string
      title: string
      major: string
      totalHours: number
      /** 超出基准的学时数 */
      overloadAmount: number
      courses: Array<{ name: string; hours: number; className?: string }>
      reason: string
    }>
  }
  /** 能力建设 */
  capacityBuilding: {
    /** 近5年新增博士 */
    newPhds: Array<{ year: string; count: number }>
    newPhdTotal: FacultyNum
    newPhdIntroduced: FacultyNum
    newPhdDeveloped: FacultyNum
    newPhdPeople: Array<{ name: string; title: string; source: 'introduced' | 'developed'; year: string }>
    /** 近5年新增教授/副教授 */
    newProfessors: Array<{ year: string; count: number }>
    newProfessorTotal: FacultyNum
    newProfessorIntroduced: FacultyNum
    newProfessorDeveloped: FacultyNum
    newProfessorPeople: Array<{ name: string; title: string; source: 'introduced' | 'developed'; year: string }>
    /** 新增高层次人才 */
    newTalents: Array<{
      name: string
      title: string
      talentType: string
      year: string
      source: 'introduced' | 'developed'
    }>
    newTalentTotal: FacultyNum
    newTalentIntroduced: FacultyNum
    newTalentDeveloped: FacultyNum
    /** 培训次数 */
    trainingCount: FacultyNum
    trainingByType: Array<{ type: string; count: number; participants: number }>
    /** 访学人数 */
    visitingScholars: Array<{ name: string; title: string; destination: string; duration: string; year: string }>
    visitingTotal: FacultyNum
    /** 各指标规划数（目标值） */
    plans: {
      newPhd: FacultyNum
      newProfessor: FacultyNum
      newTalent: FacultyNum
      training: FacultyNum
      visiting: FacultyNum
    }
    /** 青年教师导师制覆盖率 */
    mentorshipCoverage: FacultyNum
    mentorshipDetail: Array<{ label: string; count: number; ratio: number }>
    /** 年度能力建设趋势 */
    yearlyTrend: Array<{ year: string; newPhd: number; newProfessor: number; newTalent: number; training: number; visiting: number }>
  }
  /** 绩效分析 */
  performanceAnalysis: {
    summary: {
      researchOutstanding: number
      teachingOutstanding: number
      dualExcellent: number
      needsImprovement: number
      avgTeaching: FacultyNum
      avgResearch: FacultyNum
    }
    teachers: Array<{
      name: string
      title: string
      major: string
      teachingScore: number
      researchScore: number
      category: 'research-outstanding' | 'teaching-outstanding' | 'dual-excellent' | 'needs-improvement'
      teachingDetail: {
        avgHours: number
        courseCount: number
        studentEvalScore: FacultyNum
        teachingAwards: string[]
      }
      researchDetail: {
        papers: number
        projects: number
        funding: FacultyNum
        researchAwards: string[]
      }
    }>
  }
  /** 预警中心 */
  warningCenter: {
    summary: FacultyWarningSummaryDTO
    categories: Array<{
      id: string
      label: string
      level: 'red' | 'yellow' | 'blue'
      count: number
      description: string
      sourceNote?: string
      teachers: Array<{
        name: string
        title: string
        major: string
        /** 原始预警描述（保留） */
        detail: string
        status: '新发现' | '已约谈' | '跟踪中'
        /** 风险指数 0-100 */
        riskIndex: number
        /** 风险指数等级，决定指数徽标配色 */
        riskLevel: 'red' | 'yellow' | 'blue'
        /** 自动生成的风险原因（为什么预警） */
        reasons: string[]
        /** 建议措施（怎么解决） */
        suggestions: string[]
        /** 闭环管理 */
        closedLoop: {
          /** 整改期（月） */
          rectifyMonths: number
          /** 当前处置结果：风险加重 / 不变 / 减轻 / 解除 */
          outcome: '风险加重' | '不变' | '减轻' | '解除'
          /** 下次评价时间说明 */
          nextEvaluation: string
        }
      }>
    }>
  }
}
