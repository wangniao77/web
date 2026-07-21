import type { TrendInfo } from '@/types/common'

export type FacultyHealthLevel = '优' | '中' | '紧' | '警'

export type FacultyMetricKey =
  | 'phd'
  | 'senior'
  | 'headcount'
  | 'load'
  | 'warning'
  | 'stuTeacher'

export type FacultyMetricTone = 'ok' | 'warn' | 'risk' | 'up' | 'down'

export interface FacultyHealthDTO {
  score: number
  structure: FacultyHealthLevel
  load: FacultyHealthLevel
  risk: FacultyHealthLevel
}

export interface FacultyMetricDTO {
  key: FacultyMetricKey
  label: string
  value: number
  unit: string
  /** 管理含义，如「距目标还差2pp」「缺编7人」 */
  meaning: string
  tone?: FacultyMetricTone
  target?: number
  yoyChange?: number
}

export interface TeacherAnalyticsDTO {
  /** L1 健康度总览 */
  health: FacultyHealthDTO
  /** L1 指标+目标差距卡 */
  metrics: FacultyMetricDTO[]
  /** L1 诊断结论 */
  insights: string[]
  summary: {
    /** 专任教师 */
    totalTeachers: number
    phdRatio: number
    /** 高级职称占比 */
    seniorTitleRatio: number
    /** 平均学年课时 */
    avgTeachingHours: number
    /** 教师标兵 */
    modelTeacherCount: number
    warningCount: number
    publicService: {
      count: number
      hours: number
    }
    /** 高层次人才 */
    highLevelTalentCount: number
    /** 生师比 */
    studentTeacherRatio: string
    /** 兼容旧字段 */
    excellentCount: number
  }
  titleStructure: Array<{ title: string; count: number }>
  profile: {
    teaching: number
    research: number
    socialService: number
  }
  groups: {
    excellent: { count: number; ratio: number; momChange: number }
    warning: { count: number; ratio: number; momChange: number }
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
    score: number
    unit?: string
    trend?: TrendInfo
  }>
  majorComparison: Array<{
    major: string
    /** 专任教师人数 */
    headcount: number
    phdRatio: number
    /** 高级职称占比 */
    seniorRatio: number
    /** 平均课时 */
    avgHours: number
    /** 生师比 */
    studentTeacherRatio: string
    /** 核心课程支撑率（有稳定教学团队的课程占比） */
    coreCourseSupportRate: number
    /** 青年教师（35岁以下）比例 */
    youngTeacherRatio: number
    /** 高层次人才数 */
    highTalentCount: number
    /** 近五年新增教师 */
    newTeachers5yr: number
    /** 专业支撑综合指数 0-100 */
    supportIndex: number
    /** 专业支撑详细建议（怎么做） */
    suggestions: string[]
  }>
  excellentSamples: Array<{ name: string; title: string; major: string }>
  /** 教学投入 */
  teachingInvestment: {
    avgHours: number
    /** 最高课时 */
    maxTeacher: { name: string; title: string; major: string; hours: number }
    /** 最低课时 */
    minTeacher: { name: string; title: string; major: string; hours: number }
    /** 每位教师的课程及课时 */
    teacherCourses: Array<{
      name: string
      title: string
      major: string
      totalHours: number
      courses: Array<{ name: string; hours: number; studentCount: number; semester: string }>
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
      courses: Array<{ name: string; hours: number }>
      reason: string
    }>
  }
  /** 能力建设 */
  capacityBuilding: {
    /** 近5年新增博士 */
    newPhds: Array<{ year: string; count: number }>
    newPhdTotal: number
    newPhdIntroduced: number
    newPhdDeveloped: number
    newPhdPeople: Array<{ name: string; title: string; source: 'introduced' | 'developed'; year: string }>
    /** 近5年新增教授/副教授 */
    newProfessors: Array<{ year: string; count: number }>
    newProfessorTotal: number
    newProfessorIntroduced: number
    newProfessorDeveloped: number
    newProfessorPeople: Array<{ name: string; title: string; source: 'introduced' | 'developed'; year: string }>
    /** 新增高层次人才 */
    newTalents: Array<{
      name: string
      title: string
      talentType: string
      year: string
      source: 'introduced' | 'developed'
    }>
    newTalentTotal: number
    newTalentIntroduced: number
    newTalentDeveloped: number
    /** 培训次数 */
    trainingCount: number
    trainingByType: Array<{ type: string; count: number; participants: number }>
    /** 访学人数 */
    visitingScholars: Array<{ name: string; title: string; destination: string; duration: string; year: string }>
    visitingTotal: number
    /** 各指标规划数（目标值） */
    plans: {
      newPhd: number
      newProfessor: number
      newTalent: number
      training: number
      visiting: number
    }
    /** 青年教师导师制覆盖率 */
    mentorshipCoverage: number
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
      avgTeaching: number
      avgResearch: number
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
        studentEvalScore: number
        teachingAwards: string[]
      }
      researchDetail: {
        papers: number
        projects: number
        funding: number
        researchAwards: string[]
      }
    }>
  }
  /** 预警中心 */
  warningCenter: {
    summary: {
      totalWarnings: number
      redCount: number
      yellowCount: number
      blueCount: number
    }
    categories: Array<{
      id: string
      label: string
      level: 'red' | 'yellow' | 'blue'
      count: number
      description: string
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
