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

export interface GrowthOverviewVM {
  growthIndex: number
  growthLevel: string
  overallRank: number
  overallTotal: number
  overallPercent: string
  academicRank: number
  academicTotal: number
  academicPercent: string
  qualityScore: number
  qualityLevel: string
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
}

export interface CompetitionVM {
  awardCount: number
  researchCount: number
  innovationCount: number
  highlights: Array<{ label: string; detail?: string }>
}

export interface QualityVM {
  cadreRoles: string[]
  volunteerHours: number
  socialPractices: number
  softSkills: Array<{ name: string; score: number }>
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
  pushes: Array<{ time: string; text: string; type: 'warn' | 'info' | 'success' }>
  jobMatches: Array<{ role: string; match: number }>
}

export interface CareerDevVM {
  practiceBases: string[]
  internshipBases: string[]
  employmentIntention: string
  militaryNote?: string
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
