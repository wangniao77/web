import type {
  TeacherAnalyticsDetailDTO,
  TeacherAnalyticsDTO,
} from '@/types/college/api/teacher-analytics'
import type {
  TeacherAnalyticsDetailVM,
  TeacherAnalyticsVM,
} from '@/types/college/view/teacher-analytics'

export function adaptTeacherAnalytics(dto: TeacherAnalyticsDTO): TeacherAnalyticsVM {
  return {
    summary: dto.summary,
    titleStructure: dto.titleStructure,
    profile: dto.profile,
    groups: dto.groups,
    highlights: dto.highlights,
  }
}

export function adaptTeacherAnalyticsDetail(
  dto: TeacherAnalyticsDetailDTO,
): TeacherAnalyticsDetailVM {
  return {
    summary: dto.summary,
    titleStructure: dto.titleStructure,
    profile: dto.profile,
    groups: dto.groups,
    highlights: dto.highlights,
    structure: dto.structure,
    teachingHoursDetail: dto.teachingHoursDetail,
    modelTeachers: dto.modelTeachers,
    warningSamples: dto.warningSamples,
    publicServiceAnalysis: dto.publicServiceAnalysis,
    assessmentIndicators: dto.assessmentIndicators,
    majorComparison: dto.majorComparison,
    excellentSamples: dto.excellentSamples,
  }
}
