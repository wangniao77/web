import type { StudentDashboardDTO } from '@/types/student/api'

/**
 * @deprecated 手写演示数据已停用。
 * Mock 模式改为：academicRecords.json + deriveStudentDashboard 规则计算。
 * 见 `@/services/student` 与 `api/student/services`。
 */
export const mockStudentDashboard: StudentDashboardDTO = {
  profile: {
    name: '（已改为成绩表派生）',
    studentId: '22251102220',
    college: '',
    major: '',
    grade: '',
    className: '',
    mentor: '',
    counselor: '',
    dormitory: '',
    motto: '',
    awards: [],
  },
  growthPortrait: { dimensions: [] },
  aiAssistant: {
    title: '',
    recommendedDirection: '',
    matchBasis: [],
    shortTermSuggestions: [],
    longTermSuggestions: [],
  },
  growthOverview: {
    growthIndex: 0,
    growthLevel: '',
    overallRank: 0,
    overallTotal: 0,
    academicRank: 0,
    academicTotal: 0,
    qualityScore: 0,
    qualityLevel: '',
  },
  highlights: [],
  attention: [],
  academic: {
    gpa: 0,
    classRank: 0,
    classTotal: 0,
    departmentRank: 0,
    departmentTotal: 0,
    majorRank: 0,
    majorTotal: 0,
    physicalTestScore: 0,
    gpaTrend: { semesters: [], values: [] },
    classRankTrend: { semesters: [], values: [] },
    departmentRankTrend: { semesters: [], values: [] },
    majorRankTrend: { semesters: [], values: [] },
    physicalTestTrend: { semesters: [], values: [] },
    courseGrades: [],
    courseCompletionRate: 0,
    excellentCourses: 0,
    totalCourses: 0,
  },
  competition: { awardCount: 0, researchCount: 0, innovationCount: 0, highlights: [] },
  quality: { cadreRoles: [], volunteerHours: 0, socialPractices: 0, softSkills: [] },
  internship: { internshipCount: 0, projectCount: 0, certificateCount: 0, items: [] },
  health: {
    healthScore: 70,
    mentalHealth: 70,
    exerciseHabit: '数据未接入',
    summary30d: { totalMinutes: 0, frequency: 0, calories: 0 },
  },
  employment: {
    jobReadiness: 0,
    certificateReadiness: 0,
    careerDirections: [],
    developmentPath: { short: '', medium: '', long: '' },
  },
  footer: {
    motto: '',
    growthDays: 0,
    goalCompletionRate: 0,
    milestoneCount: 0,
    totalAwards: 0,
  },
}

/** @deprecated use derive from academicRecords */
export const mockStudentProfile = mockStudentDashboard.profile
