import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  StudentDevQualityDTO,
  StudentDevDetailDTO,
  StudentFlowSankeyDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
  BenchmarkAchievementsDTO,
  BenchmarkAchievementsDetailDTO,
  BenchmarkFeaturedDTO,
  TeacherAnalyticsDTO,
  TeacherAnalyticsDetailDTO,
  DisciplineOverviewDTO,
  DisciplineOverviewDetailDTO,
  EnrollmentEmploymentOverviewDTO,
  EnrollmentEmploymentDetailDTO,
} from '@/types/college/api'
import type { CollegeScope } from '@/types/common'
import type { ApiResponse } from '@/types/common'
import client from '@/api/client'

export const collegeApi = {
  getHub: (params?: CollegeScope) =>
    client.get<ApiResponse<OverviewHubDTO>>('/college/overview/hub', { params }),
  getKeyTasks: (params?: CollegeScope) =>
    client.get<ApiResponse<KeyTaskDTO[]>>('/college/tasks/annual-progress', { params }),
  getStudentOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<StudentOverviewDTO>>('/college/students/overview', { params }),
  getTeachingOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<TeachingOverviewDTO>>('/college/teaching/overview', { params }),
  getResearchOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<ResearchOverviewDTO>>('/college/research/overview', { params }),
  getWarningOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<WarningOverviewDTO>>('/college/warnings/overview', { params }),
  getStudentDevQuality: (params?: CollegeScope & { dimension?: string }) =>
    client.get<ApiResponse<StudentDevQualityDTO>>('/college/students/dev-quality', { params }),
  getStudentDevDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<StudentDevDetailDTO>>('/college/students/dev-quality/detail', { params }),
  getStudentFlowSankey: (params?: CollegeScope) =>
    client.get<ApiResponse<StudentFlowSankeyDTO>>('/college/students/flow-sankey', { params }),
  getBenchmarkAchievements: (params?: CollegeScope) =>
    client.get<ApiResponse<BenchmarkAchievementsDTO>>('/college/benchmark/achievements', { params }),
  getBenchmarkAchievementsDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<BenchmarkAchievementsDetailDTO>>('/college/benchmark/achievements/detail', { params }),
  getBenchmarkFeatured: (params?: CollegeScope) =>
    client.get<ApiResponse<BenchmarkFeaturedDTO>>('/college/benchmark/achievements/featured', { params }),
  getTeacherAnalytics: (params?: CollegeScope) =>
    client.get<ApiResponse<TeacherAnalyticsDTO>>('/college/faculty/analytics', { params }),
  getTeacherAnalyticsDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<TeacherAnalyticsDetailDTO>>('/college/faculty/analytics/detail', { params }),
  getDisciplineOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<DisciplineOverviewDTO>>('/college/discipline/overview', { params }),
  getDisciplineOverviewDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<DisciplineOverviewDetailDTO>>('/college/discipline/overview/detail', { params }),
  getEnrollmentEmploymentOverview: (params?: CollegeScope) =>
    client.get<ApiResponse<EnrollmentEmploymentOverviewDTO>>('/college/enrollment-employment/overview', { params }),
  getEnrollmentEmploymentDetail: (params?: CollegeScope) =>
    client.get<ApiResponse<EnrollmentEmploymentDetailDTO>>('/college/enrollment-employment/detail', { params }),
  getEnrollmentEmploymentAnalysisReport: (params?: CollegeScope) =>
    client.get<ApiResponse<import('@/types/college/api/employment-analysis').EmploymentAnalysisReportResponseDTO>>(
      '/college/enrollment-employment/analysis-report',
      { params },
    ),
}
