export interface StudentAwardDTO {
  name: string
  level: string
  date?: string
}

export interface StudentProfileDTO {
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
  awards: StudentAwardDTO[]
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
  cet4Score?: number
  cet6Score?: number
  recentDynamics?: Array<{ time: string; text: string; kind: 'award' | 'warn' | 'info' }>
  classCadreRole?: string
  familySituation?: string
  familyMembers?: string[]
  difficultyDetail?: string
  guardianName?: string
  guardianPhone?: string
}

export interface CreditProgressDTO {
  earned: number
  required: number
  secondClassroomEarned: number
  secondClassroomRequired: number
  buckets?: Array<{ label: string; earned: number; required: number }>
  secondClassroomItems?: Array<{ label: string; percent: number }>
}

export interface FailedCourseDTO {
  name: string
  score: number
  required: boolean
}

export interface TimelineTermDTO {
  term: string
  label: string
  wuyu: { de: number; zhi: number; ti: number; mei: number; lao: number }
  milestone?: string
}

export interface AiPortraitDTO {
  summary: string
  portraitTags: string[]
  strengthTags?: string[]
  focusTags?: string[]
  pushes: Array<{ time: string; text: string; type?: 'warn' | 'info' | 'success' }>
  jobMatches: Array<{
    role: string
    match: number
    city?: string
    salary?: string
    requirements?: string
    reason?: string
  }>
  opportunities?: Array<{ time: string; text: string; action?: string }>
  coachingTasks?: Array<{ title: string; detail: string; priority: string; status?: string }>
}

export interface GrowthPortraitDTO {
  dimensions: Array<{
    name: string
    personal: number
    gradeAvg: number
  }>
}

export interface AiAssistantDTO {
  title: string
  mascotUrl?: string
  recommendedDirection: string
  matchBasis: string[]
  shortTermSuggestions: string[]
  longTermSuggestions: string[]
}

export interface RankNeighborDTO {
  name: string
  gpa: number
  rank: number
  studentId?: string
}

export interface GrowthOverviewDTO {
  growthIndex: number
  growthLevel: string
  overallRank: number
  overallTotal: number
  academicRank: number
  academicTotal: number
  qualityScore: number
  qualityLevel: string
  gpaDelta?: number
  gradeRankDelta?: number
  neighborsAhead?: RankNeighborDTO[]
  neighborsBehind?: RankNeighborDTO[]
}

export interface HighlightItemDTO {
  id: string
  label: string
  date?: string
}

export interface AttentionItemDTO {
  id: string
  label: string
  category: string
  level: 'low' | 'medium' | 'high'
}

export interface CourseGradeDTO {
  name: string
  score: number
}

export interface AcademicDevDTO {
  gpa: number
  classRank: number
  classTotal: number
  departmentRank: number
  departmentTotal: number
  majorRank: number
  majorTotal: number
  physicalTestScore: number
  gpaTrend: { semesters: string[]; values: number[] }
  classRankTrend: { semesters: string[]; values: number[] }
  departmentRankTrend: { semesters: string[]; values: number[] }
  majorRankTrend: { semesters: string[]; values: number[] }
  physicalTestTrend: { semesters: string[]; values: number[] }
  courseGrades: CourseGradeDTO[]
  courseCompletionRate: number
  excellentCourses: number
  totalCourses: number
  yearlyGoals?: Array<{ year: string; goal: string; percent: number }>
  currentCourses?: Array<{ name: string; credit: number; type: string }>
  failedElective?: FailedCourseDTO[]
  supportRecords?: Array<{ date: string; person: string; content: string }>
}

export interface CompetitionDTO {
  awardCount: number
  researchCount: number
  innovationCount: number
  highlights: Array<{ label: string; detail?: string }>
}

export interface DisciplineRecordDTO {
  id: string
  date: string
  type: string
  reason: string
  status?: string
}

export interface QualityDTO {
  cadreRoles: string[]
  volunteerHours: number
  socialPractices: number
  softSkills: Array<{ name: string; score: number }>
  disciplineRecords?: DisciplineRecordDTO[]
}

export interface InternshipDTO {
  internshipCount: number
  projectCount: number
  certificateCount: number
  items: Array<{ name: string; type: string }>
}

export interface HealthDTO {
  healthScore: number
  mentalHealth: number
  exerciseHabit: string
  summary30d: {
    totalMinutes: number
    frequency: number
    calories: number
  }
}

export interface EmploymentDTO {
  jobReadiness: number
  certificateReadiness: number
  careerDirections: string[]
  developmentPath: {
    short: string
    medium: string
    long: string
  }
}

export interface StudentFooterDTO {
  motto: string
  growthDays: number
  goalCompletionRate: number
  milestoneCount: number
  totalAwards: number
}

export interface StudentDashboardDTO {
  profile: StudentProfileDTO
  growthPortrait: GrowthPortraitDTO
  aiAssistant: AiAssistantDTO
  growthOverview: GrowthOverviewDTO
  highlights: HighlightItemDTO[]
  attention: AttentionItemDTO[]
  academic: AcademicDevDTO
  competition: CompetitionDTO
  quality: QualityDTO
  internship: InternshipDTO
  health: HealthDTO
  employment: EmploymentDTO
  footer: StudentFooterDTO
  creditProgress?: CreditProgressDTO
  failedCritical?: FailedCourseDTO[]
  timeline?: TimelineTermDTO[]
  aiPortrait?: AiPortraitDTO
  scholarships?: Array<{ name: string; year: string }>
  annualAssessments?: Array<{ year: string; score: number; level: string }>
  careerDev?: {
    practiceBases: string[]
    internshipBases: string[]
    /** @deprecated 使用 employmentDestination */
    employmentIntention: string
    employmentDestination?:
      | '考研备考'
      | '考公备考'
      | '企业就业'
      | '自主创业'
      | '暂缓就业'
      | '待实习'
      | '在岗实习'
    targetCity?: string
    expectedSalary?: string
    resumeStatus?: string
    projectExperiences?: string[]
    militaryNote?: string
    targetUniversities?: string[]
    targetCompanies?: string[]
  }
  mentalGrowth?: {
    supportStatus: string
    records: Array<{ date: string; person: string; content: string; level: string }>
  }
}
