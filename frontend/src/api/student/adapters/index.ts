import type { StudentDashboardDTO } from '@/types/student/api'
import type {
  AttentionItemVM,
  CareerDevVM,
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
      gpaDelta: go.gpaDelta,
      gradeRankDelta: go.gradeRankDelta,
      neighborsAhead: go.neighborsAhead ?? [],
      neighborsBehind: go.neighborsBehind ?? [],
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
      supportRecords: dto.academic.supportRecords ?? [],
    },
    competition: { ...dto.competition },
    quality: {
      ...dto.quality,
      disciplineRecords: dto.quality.disciplineRecords ?? [],
    },
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
      buckets: dto.creditProgress?.buckets,
      secondClassroomItems: dto.creditProgress?.secondClassroomItems,
    },
    failedCritical: dto.failedCritical ?? [],
    timeline: dto.timeline ?? [],
    aiPortrait: {
      summary: dto.aiPortrait?.summary ?? '',
      portraitTags: dto.aiPortrait?.portraitTags ?? [],
      strengthTags: dto.aiPortrait?.strengthTags ?? [],
      focusTags: dto.aiPortrait?.focusTags ?? [],
      pushes: (dto.aiPortrait?.pushes ?? []).map((p) => ({
        ...p,
        type: p.type ?? 'info',
      })),
      jobMatches: (dto.aiPortrait?.jobMatches ?? []).map((job) => ({
        role: job.role,
        match: job.match,
        city: job.city,
        salary: job.salary,
        requirements: job.requirements,
        reason: job.reason,
      })),
      opportunities: dto.aiPortrait?.opportunities,
      coachingTasks: dto.aiPortrait?.coachingTasks,
    },
    scholarships: dto.scholarships ?? [],
    annualAssessments: dto.annualAssessments ?? [],
    careerDev: {
      practiceBases: dto.careerDev?.practiceBases ?? [],
      internshipBases: dto.careerDev?.internshipBases ?? [],
      employmentIntention: dto.careerDev?.employmentDestination ?? dto.careerDev?.employmentIntention ?? '待实习',
      employmentDestination:
        (dto.careerDev?.employmentDestination as CareerDevVM['employmentDestination']) ||
        (['考研备考', '考公备考', '企业就业', '自主创业', '暂缓就业', '待实习', '在岗实习'].includes(
          dto.careerDev?.employmentIntention ?? '',
        )
          ? (dto.careerDev!.employmentIntention as CareerDevVM['employmentDestination'])
          : '待实习'),
      targetCity: dto.careerDev?.targetCity ?? '未填报',
      expectedSalary: dto.careerDev?.expectedSalary ?? '未填报',
      resumeStatus: dto.careerDev?.resumeStatus ?? '未完善',
      projectExperiences: dto.careerDev?.projectExperiences ?? [],
      militaryNote: dto.careerDev?.militaryNote,
      targetUniversities: dto.careerDev?.targetUniversities ?? [],
      targetCompanies: dto.careerDev?.targetCompanies ?? [],
    },
    mentalGrowth: {
      supportStatus: dto.mentalGrowth?.supportStatus ?? '',
      records: dto.mentalGrowth?.records ?? [],
    },
  }
}
