export interface StudentAwardVM {
  name: string
  level: string
  date?: string
}

export interface PersonalInfoVM {
  name: string
  gender?: string
  studentId: string
  college: string
  major: string
  grade: string
  className: string
  mentor: string
  counselor: string
  dormitory: string
  motto: string
  mottoSub?: string
  avatarUrl?: string
  awards: StudentAwardVM[]
  politicalStatus?: string
  phone?: string
  address?: string
  onCampusStatus?: string
  /** 高潜类型标签，如：学术高潜、竞赛高潜、干部奉献高潜 等 */
  highPotentialTags?: string[]
  economicHardship?: boolean
  mentalLevel?: string
  mentalLevelCode?: 'low' | 'medium' | 'high'
  growthTrend?: 'positive' | 'negative' | 'stable'
  thesisAdvisor?: string
  thesisStatus?: string
  /** 四六级分数（学情护航/档案展示） */
  cet4Score?: number
  cet6Score?: number
  /** 近期伴随式动态（旷课/获奖/晚归等） */
  recentDynamics?: Array<{ time: string; text: string; kind: 'award' | 'warn' | 'info' }>
  /** 班干部职务（班长/团支书等），用于姓名旁展示 */
  classCadreRole?: string
  familySituation?: string
  familyMembers?: string[]
  difficultyDetail?: string
  guardianName?: string
  guardianPhone?: string
}

export interface GrowthPortraitVM {
  indicators: Array<{ name: string; max: number }>
  personal: number[]
  gradeAvg: number[]
}

export interface AiAssistantVM {
  title: string
  mascotUrl?: string
  recommendedDirection: string
  matchBasis: string[]
  shortTermSuggestions: string[]
  longTermSuggestions: string[]
}

/** 同年级 GPA 排名邻域（前 N / 后 N） */
export interface RankNeighborVM {
  name: string
  gpa: number
  rank: number
  studentId?: string
}

export interface GrowthOverviewVM {
  growthIndex: number
  growthLevel: string
  /** 年级 GPA 排名（dense rank） */
  overallRank: number
  overallTotal: number
  overallPercent: string
  academicRank: number
  academicTotal: number
  academicPercent: string
  qualityScore: number
  qualityLevel: string
  /** GPA 环比变化（正=上升） */
  gpaDelta?: number
  /** 年级名次变化：负=名次前进（变好） */
  gradeRankDelta?: number
  /** 该生之前（成绩更好）的同学 */
  neighborsAhead?: RankNeighborVM[]
  /** 该生之后（成绩稍弱）的同学 */
  neighborsBehind?: RankNeighborVM[]
}

export interface HighlightItemVM {
  id: string
  label: string
  date?: string
}

export interface AttentionItemVM {
  id: string
  label: string
  category: string
  level: 'low' | 'medium' | 'high'
  levelLabel: string
}

export interface CourseGradeVM {
  name: string
  score: number
  rank: number
}

export interface AcademicDevVM {
  gpa: number
  classRank: number
  classTotal: number
  departmentRank: number
  departmentTotal: number
  majorRank: number
  majorTotal: number
  physicalTestScore: number
  semesters: string[]
  gpaValues: number[]
  classRankValues: number[]
  departmentRankValues: number[]
  majorRankValues: number[]
  physicalTestValues: number[]
  courseGrades: CourseGradeVM[]
  courseCompletionRate: number
  excellentCourses: number
  totalCourses: number
  yearlyGoals: Array<{ year: string; goal: string; percent: number }>
  currentCourses: Array<{ name: string; credit: number; type: string }>
  failedElective: FailedCourseVM[]
  /** 学业帮扶 / 谈心谈话记录（预警干预台账） */
  supportRecords?: Array<{ date: string; person: string; content: string }>
}

export interface CompetitionVM {
  awardCount: number
  researchCount: number
  innovationCount: number
  highlights: Array<{ label: string; detail?: string }>
}

export interface DisciplineRecordVM {
  id: string
  /** 处分日期 */
  date: string
  /** 处分类型：警告 / 严重警告 / 记过 / 留校察看 等 */
  type: string
  /** 事由简述 */
  reason: string
  /** 在册 / 已解除 */
  status?: string
}

export interface QualityVM {
  cadreRoles: string[]
  volunteerHours: number
  socialPractices: number
  softSkills: Array<{ name: string; score: number }>
  /** 纪律惩戒 / 处分记录（综合素养荣誉与纪律台账） */
  disciplineRecords: DisciplineRecordVM[]
}

export interface InternshipVM {
  internshipCount: number
  projectCount: number
  certificateCount: number
  items: Array<{ name: string; type: string }>
}

export interface HealthVM {
  healthScore: number
  mentalHealth: number
  exerciseHabit: string
  summary30d: {
    totalMinutes: number
    frequency: number
    calories: number
  }
}

/** 就业去向类型（取消「待确认 / 发展中」） */
export type EmploymentDestinationType =
  | '考研备考'
  | '考公备考'
  | '企业就业'
  | '自主创业'
  | '暂缓就业'
  | '待实习'
  | '在岗实习'

export interface JobMatchVM {
  role: string
  match: number
  city?: string
  salary?: string
  requirements?: string
  reason?: string
}

export interface EmploymentVM {
  jobReadiness: number
  certificateReadiness: number
  careerDirections: string[]
  developmentPath: {
    short: string
    medium: string
    long: string
  }
}

export interface StudentFooterVM {
  motto: string
  growthDays: number
  goalCompletionRate: number
  milestoneCount: number
  totalAwards: number
}

export interface CreditProgressVM {
  earned: number
  required: number
  secondClassroomEarned: number
  secondClassroomRequired: number
  earnedPercent: number
  secondPercent: number
  /** 必修 / 选修 / 通识学分分桶（学情护航三段进度条） */
  buckets?: Array<{ label: string; earned: number; required: number }>
  /** 第二课堂七项进度 0–100 */
  secondClassroomItems?: Array<{ label: string; percent: number }>
}

export interface FailedCourseVM {
  name: string
  score: number
  required: boolean
}

export interface TimelineTermVM {
  term: string
  label: string
  wuyu: { de: number; zhi: number; ti: number; mei: number; lao: number }
  milestone?: string
}

export interface AiPortraitVM {
  summary: string
  portraitTags: string[]
  /** 优势 / 关注标签（智能育航全景研判用） */
  strengthTags?: string[]
  focusTags?: string[]
  pushes: Array<{ time: string; text: string; type: 'warn' | 'info' | 'success' }>
  jobMatches: JobMatchVM[]
  opportunities?: Array<{ time: string; text: string; action?: string }>
  coachingTasks?: Array<{ title: string; detail: string; priority: string; status?: string }>
}

export interface CareerDevVM {
  practiceBases: string[]
  internshipBases: string[]
  /** @deprecated 使用 employmentDestination */
  employmentIntention: string
  employmentDestination: EmploymentDestinationType
  targetCity?: string
  expectedSalary?: string
  resumeStatus?: string
  projectExperiences?: string[]
  militaryNote?: string
  /** 对标升学高校（挖掘推荐，待填报覆盖） */
  targetUniversities?: string[]
  /** 对标就业大厂 / 名企 */
  targetCompanies?: string[]
}

export interface MentalGrowthVM {
  supportStatus: string
  records: Array<{ date: string; person: string; content: string; level: string }>
}

export interface AnnualAssessmentVM {
  year: string
  score: number
  level: string
}

export interface StudentDashboardVM {
  profile: PersonalInfoVM
  growthPortrait: GrowthPortraitVM
  aiAssistant: AiAssistantVM
  growthOverview: GrowthOverviewVM
  highlights: HighlightItemVM[]
  attention: AttentionItemVM[]
  academic: AcademicDevVM
  competition: CompetitionVM
  quality: QualityVM
  internship: InternshipVM
  health: HealthVM
  employment: EmploymentVM
  footer: StudentFooterVM
  creditProgress: CreditProgressVM
  failedCritical: FailedCourseVM[]
  timeline: TimelineTermVM[]
  aiPortrait: AiPortraitVM
  scholarships: Array<{ name: string; year: string }>
  annualAssessments: AnnualAssessmentVM[]
  careerDev: CareerDevVM
  mentalGrowth: MentalGrowthVM
}
