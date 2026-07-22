import type {
  TeacherAnalyticsDetailDTO,
  TeacherAnalyticsDTO,
} from '@/types/college/api/teacher-analytics'
import type {
  TeacherAnalyticsDetailVM,
  TeacherAnalyticsVM,
} from '@/types/college/view/teacher-analytics'

function adaptBase(dto: TeacherAnalyticsDTO): TeacherAnalyticsVM {
  return {
    health: { ...dto.health },
    metrics: dto.metrics.map((m) => ({ ...m })),
    insights: [...dto.insights],
    summary: {
      ...dto.summary,
      publicService: { ...dto.summary.publicService },
    },
    titleStructure: dto.titleStructure.map((t) => ({ ...t })),
    profile: { ...dto.profile },
    groups: {
      excellent: { ...dto.groups.excellent },
      warning: { ...dto.groups.warning },
    },
    highlights: dto.highlights.map((h) => ({ ...h })),
  }
}

export function adaptTeacherAnalytics(dto: TeacherAnalyticsDTO): TeacherAnalyticsVM {
  return adaptBase(dto)
}

export function adaptTeacherAnalyticsDetail(
  dto: TeacherAnalyticsDetailDTO,
): TeacherAnalyticsDetailVM {
  return {
    ...adaptBase(dto),
    structure: {
      age: dto.structure.age.map((i) => ({ ...i })),
      education: dto.structure.education.map((i) => ({ ...i })),
      title: dto.structure.title.map((i) => ({ ...i })),
      academicOrigin: dto.structure.academicOrigin.map((i) => ({ ...i })),
      echelon: dto.structure.echelon.map((i) => ({ ...i })),
      retirementForecast: dto.structure.retirementForecast.map((i) => ({ ...i })),
      retiringTeachers: dto.structure.retiringTeachers.map((t) => ({
        ...t,
        courses: t.courses.map((c) => ({ ...c })),
      })),
      majorDirection: dto.structure.majorDirection.map((i) => ({ ...i })),
    },
    teachingHoursDetail: dto.teachingHoursDetail.map((i) => ({ ...i })),
    modelTeachers: dto.modelTeachers.map((i) => ({ ...i })),
    warningSamples: dto.warningSamples.map((i) => ({ ...i })),
    publicServiceAnalysis: {
      byTeacher: dto.publicServiceAnalysis.byTeacher.map((i) => ({ ...i })),
      byType: dto.publicServiceAnalysis.byType.map((i) => ({ ...i })),
      byMonth: dto.publicServiceAnalysis.byMonth.map((i) => ({ ...i })),
    },
    assessmentIndicators: dto.assessmentIndicators.map((i) => ({
      ...i,
      trend: i.trend ? { ...i.trend } : undefined,
    })),
    majorComparison: dto.majorComparison.map((i) => ({ ...i })),
    excellentSamples: dto.excellentSamples.map((i) => ({ ...i })),
    teachingInvestment: {
      ...dto.teachingInvestment,
      maxTeacher: { ...dto.teachingInvestment.maxTeacher },
      minTeacher: { ...dto.teachingInvestment.minTeacher },
      teacherCourses: dto.teachingInvestment.teacherCourses.map((t) => ({
        ...t,
        courses: t.courses.map((c) => ({ ...c })),
      })),
      hourDistribution: dto.teachingInvestment.hourDistribution.map((i) => ({ ...i })),
      overloadedTeachers: dto.teachingInvestment.overloadedTeachers.map((i) => ({
        ...i,
        courses: i.courses.map((c) => ({ ...c })),
      })),
    },
    capacityBuilding: {
      ...dto.capacityBuilding,
      newPhds: dto.capacityBuilding.newPhds.map((i) => ({ ...i })),
      newProfessors: dto.capacityBuilding.newProfessors.map((i) => ({ ...i })),
      newTalents: dto.capacityBuilding.newTalents.map((i) => ({ ...i })),
      trainingByType: dto.capacityBuilding.trainingByType.map((i) => ({ ...i })),
      visitingScholars: dto.capacityBuilding.visitingScholars.map((i) => ({ ...i })),
      mentorshipDetail: dto.capacityBuilding.mentorshipDetail.map((i) => ({ ...i })),
      yearlyTrend: dto.capacityBuilding.yearlyTrend.map((i) => ({ ...i })),
    },
    performanceAnalysis: {
      summary: { ...dto.performanceAnalysis.summary },
      teachers: dto.performanceAnalysis.teachers.map((t) => ({
        ...t,
        teachingDetail: {
          ...t.teachingDetail,
          teachingAwards: [...t.teachingDetail.teachingAwards],
        },
        researchDetail: {
          ...t.researchDetail,
          researchAwards: [...t.researchDetail.researchAwards],
        },
      })),
    },
    warningCenter: {
      summary: { ...dto.warningCenter.summary },
      categories: dto.warningCenter.categories.map((c) => ({
        ...c,
        teachers: c.teachers.map((t) => ({ ...t })),
      })),
    },
  }
}
