export interface StudentAwardVM {
  name: string
  level: string
  date?: string
}

export interface PersonalInfoVM {
  name: string
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
}
