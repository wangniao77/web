/**
 * 学生端 GPA 详情 · 共享 DTO → VM 转换
 */
import type {
  CourseRecordDTO,
  CourseRecordVM,
  GpaDetailDTO,
  GpaDetailVM,
  GpaOverviewDTO,
  GpaOverviewVM,
  SemesterSummaryDTO,
  SemesterSummaryVM,
} from './types'
import {
  CATEGORY_LABEL,
  LEVEL_LABEL,
  round2,
  scoreToGpa,
  scoreToLevel,
} from './utils'

function adaptOverview(dto: GpaOverviewDTO): GpaOverviewVM {
  const completionRate = dto.totalCredits > 0
    ? round2((dto.earnedCredits / dto.totalCredits) * 100)
    : 0

  let level: GpaOverviewVM['level'] = 'good'
  let levelLabel = '良好'
  if (dto.cumulativeGpa >= 3.7) {
    level = 'excellent'
    levelLabel = '优秀'
  } else if (dto.cumulativeGpa >= 3.0) {
    level = 'good'
    levelLabel = '良好'
  } else if (dto.cumulativeGpa >= 2.0) {
    level = 'medium'
    levelLabel = '中等'
  } else {
    level = 'pass'
    levelLabel = '及格'
  }

  return {
    ...dto,
    completionRate,
    level,
    levelLabel,
    majorRankLabel: `前 ${(100 - dto.majorRankPercent).toFixed(1)}%`,
    classRankLabel: `${dto.classRank}/${dto.classTotal}`,
  }
}

function adaptCourse(dto: CourseRecordDTO): CourseRecordVM {
  const level = scoreToLevel(dto.score)
  return {
    ...dto,
    gpaPoint: scoreToGpa(dto.score),
    weightedPoint: round2(scoreToGpa(dto.score) * dto.credit),
    level,
    levelLabel: LEVEL_LABEL[level],
    categoryLabel: CATEGORY_LABEL[dto.category],
    warning: dto.score < 75,
  }
}

function adaptSemester(dto: SemesterSummaryDTO): SemesterSummaryVM {
  return {
    ...dto,
    excellentRate: dto.totalCourses > 0
      ? round2((dto.excellentCourses / dto.totalCourses) * 100)
      : 0,
  }
}

export function adaptGpaDetail(dto: GpaDetailDTO): GpaDetailVM {
  const courses = dto.courses.map(adaptCourse)
  const semesterList = Array.from(new Set(courses.map((c) => c.semester)))
    .sort((a, b) => {
      const ai = courses.find((c) => c.semester === a)?.semesterIndex ?? 0
      const bi = courses.find((c) => c.semester === b)?.semesterIndex ?? 0
      return ai - bi
    })

  const excellentCourses = [...courses]
    .filter((c) => c.score >= 90 && c.counted)
    .sort((a, b) => b.score - a.score)

  const warningCourses = [...courses]
    .filter((c) => c.score < 75 && c.counted)
    .sort((a, b) => a.score - b.score)

  return {
    overview: adaptOverview(dto.overview),
    semesters: dto.semesters.map(adaptSemester),
    categoryStats: dto.categoryStats,
    courses,
    semesterList,
    excellentCourses,
    warningCourses,
  }
}
