export interface StudentProfileDTO {
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

export interface GrowthOverviewDTO {
  growthIndex: number
  growthLevel: string
  overallRank: number
  overallTotal: number
  academicRank: number
  academicTotal: number
  qualityScore: number
  qualityLevel: string
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
  gpaTrend: { semesters: string[]; values: number[] }
  classRankTrend: { semesters: string[]; values: number[] }
  departmentRankTrend: { semesters: string[]; values: number[] }
  courseGrades: CourseGradeDTO[]
  courseCompletionRate: number
  excellentCourses: number
  totalCourses: number
}

export interface CompetitionDTO {
  awardCount: number
  researchCount: number
  innovationCount: number
  highlights: Array<{ label: string; detail?: string }>
}

export interface QualityDTO {
  cadreRoles: string[]
  volunteerHours: number
  socialPractices: number
  softSkills: Array<{ name: string; score: number }>
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
}
