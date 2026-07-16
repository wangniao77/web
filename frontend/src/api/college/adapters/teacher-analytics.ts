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
  }
}
