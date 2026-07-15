import type { StudentDashboardDTO } from '@/types/student/api'
import type {
  AttentionItemVM,
  StudentDashboardVM,
} from '@/types/student/view'

const levelLabels = {
  low: '低',
  medium: '中',
  high: '高',
} as const

function formatPercent(rank: number, total: number): string {
  if (!total || !rank) return '—'
  const pct = ((rank / total) * 100).toFixed(1)
  return `Top ${pct}%`
}

const emptyHealth = {
  healthScore: 70,
  mentalHealth: 70,
  exerciseHabit: '数据未接入',
  summary30d: { totalMinutes: 0, frequency: 0, calories: 0 },
}

export function adaptAttentionItem(item: StudentDashboardDTO['attention'][0]): AttentionItemVM {
  return {
    ...item,
    levelLabel: levelLabels[item.level],
  }
}

export function adaptStudentDashboard(dto: StudentDashboardDTO): StudentDashboardVM {
  const { growthOverview: go, growthPortrait: gp } = dto

  return {
    profile: { ...dto.profile },
    growthPortrait: {
      indicators: gp.dimensions.map((d) => ({ name: d.name, max: 100 })),
      personal: gp.dimensions.map((d) => d.personal),
      gradeAvg: gp.dimensions.map((d) => d.gradeAvg),
    },
    aiAssistant: { ...dto.aiAssistant },
    growthOverview: {
      growthIndex: go.growthIndex,
      growthLevel: go.growthLevel,
      overallRank: go.overallRank,
      overallTotal: go.overallTotal,
      overallPercent: formatPercent(go.overallRank, go.overallTotal),
      academicRank: go.academicRank,
      academicTotal: go.academicTotal,
      academicPercent: formatPercent(go.academicRank, go.academicTotal),
      qualityScore: go.qualityScore,
      qualityLevel: go.qualityLevel,
    },
    highlights: dto.highlights.map((h) => ({ ...h })),
    attention: dto.attention.map(adaptAttentionItem),
    academic: {
      gpa: dto.academic.gpa,
      classRank: dto.academic.classRank,
      classTotal: dto.academic.classTotal,
      departmentRank: dto.academic.departmentRank,
      departmentTotal: dto.academic.departmentTotal,
      majorRank: dto.academic.majorRank,
      majorTotal: dto.academic.majorTotal,
      physicalTestScore: dto.academic.physicalTestScore,
      semesters: dto.academic.gpaTrend.semesters,
      gpaValues: dto.academic.gpaTrend.values,
      classRankValues: dto.academic.classRankTrend.values,
      departmentRankValues: dto.academic.departmentRankTrend.values,
      majorRankValues: dto.academic.majorRankTrend.values,
      physicalTestValues: dto.academic.physicalTestTrend.values,
      courseGrades: [...dto.academic.courseGrades]
        .sort((a, b) => b.score - a.score)
        .map((course, index) => ({
          name: course.name,
          score: course.score,
          rank: index + 1,
        })),
      courseCompletionRate: dto.academic.courseCompletionRate,
      excellentCourses: dto.academic.excellentCourses,
      totalCourses: dto.academic.totalCourses,
      yearlyGoals: dto.academic.yearlyGoals ?? [],
      currentCourses: dto.academic.currentCourses ?? [],
      failedElective: dto.academic.failedElective ?? [],
    },
    competition: { ...dto.competition },
    quality: { ...dto.quality },
    internship: { ...dto.internship },
    health: { ...emptyHealth, ...(dto.health ?? {}) },
    employment: { ...dto.employment },
    footer: { ...dto.footer },
    creditProgress: {
      earned: dto.creditProgress?.earned ?? 0,
      required: dto.creditProgress?.required ?? 160,
      secondClassroomEarned: dto.creditProgress?.secondClassroomEarned ?? 0,
      secondClassroomRequired: dto.creditProgress?.secondClassroomRequired ?? 10,
      earnedPercent: dto.creditProgress
        ? Math.round((dto.creditProgress.earned / dto.creditProgress.required) * 100)
        : 0,
      secondPercent: dto.creditProgress
        ? Math.round((dto.creditProgress.secondClassroomEarned / dto.creditProgress.secondClassroomRequired) * 100)
        : 0,
    },
    failedCritical: dto.failedCritical ?? [],
    timeline: dto.timeline ?? [],
    aiPortrait: {
      summary: dto.aiPortrait?.summary ?? '',
      portraitTags: dto.aiPortrait?.portraitTags ?? [],
      pushes: (dto.aiPortrait?.pushes ?? []).map((p) => ({
        ...p,
        type: p.type ?? 'info',
      })),
      jobMatches: dto.aiPortrait?.jobMatches ?? [],
    },
    scholarships: dto.scholarships ?? [],
    annualAssessments: dto.annualAssessments ?? [],
    careerDev: {
      practiceBases: dto.careerDev?.practiceBases ?? [],
      internshipBases: dto.careerDev?.internshipBases ?? [],
      employmentIntention: dto.careerDev?.employmentIntention ?? '',
      militaryNote: dto.careerDev?.militaryNote,
    },
    mentalGrowth: {
      supportStatus: dto.mentalGrowth?.supportStatus ?? '',
      records: dto.mentalGrowth?.records ?? [],
    },
  }
}
