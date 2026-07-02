import type { StudentDashboardDTO } from '@/types/api/student'
import type {
  AttentionItemVM,
  StudentDashboardVM,
} from '@/types/view/student'

const levelLabels = {
  low: '低',
  medium: '中',
  high: '高',
} as const

function formatPercent(rank: number, total: number): string {
  const pct = ((rank / total) * 100).toFixed(1)
  return `Top ${pct}%`
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
      semesters: dto.academic.gpaTrend.semesters,
      gpaValues: dto.academic.gpaTrend.values,
      classRankValues: dto.academic.classRankTrend.values,
      departmentRankValues: dto.academic.departmentRankTrend.values,
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
    },
    competition: { ...dto.competition },
    quality: { ...dto.quality },
    internship: { ...dto.internship },
    health: { ...dto.health },
    employment: { ...dto.employment },
    footer: { ...dto.footer },
  }
}
