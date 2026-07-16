/**
 * 学生端挂科详情 · DTO → VM 转换
 */
import type {
  FailCourseDTO,
  FailCourseVM,
  FailDetailDTO,
  FailDetailVM,
  FailOverviewVM,
  FailSemesterGroupVM,
} from './types'

export const FAIL_CATEGORY_LABEL: Record<string, string> = {
  general: '通识必修',
  'major-base': '专业基础',
  'major-core': '专业核心',
  elective: '专业选修',
  humanity: '人文社科',
  art: '艺术体育',
  practice: '实践环节',
}

const SEVERITY = [
  { max: 40, label: '严重', color: '#f87171' },
  { max: 50, label: '较重', color: '#fb923c' },
  { max: 56, label: '临界', color: '#facc15' },
  { max: 60, label: '擦边', color: '#94a3b8' },
]

function getSeverity(score: number) {
  for (const s of SEVERITY) {
    if (score <= s.max) return s.label
  }
  return '擦边'
}

function adaptCourse(dto: FailCourseDTO): FailCourseVM {
  const gap = Math.round((dto.classAvg - dto.score) * 10) / 10
  let gapLabel = '略低于'
  if (gap >= 20) gapLabel = '大幅落后于'
  else if (gap >= 10) gapLabel = '明显低于'

  return {
    ...dto,
    gapFromAvg: gap,
    gapLabel,
    severityLabel: getSeverity(dto.score),
    categoryLabel: FAIL_CATEGORY_LABEL[dto.category] ?? dto.category,
  }
}

function buildOverview(courses: FailCourseVM[]): FailOverviewVM {
  const semesters = new Set(courses.map((c) => c.semester))
  const avgScore = courses.length > 0
    ? Math.round((courses.reduce((s, c) => s + c.score, 0) / courses.length) * 10) / 10
    : 0

  // 找最集中的挂科类别
  const catCount: Record<string, number> = {}
  for (const c of courses) {
    catCount[c.categoryLabel] = (catCount[c.categoryLabel] || 0) + 1
  }
  let mostCat = '—'
  let mostNum = 0
  for (const [k, v] of Object.entries(catCount)) {
    if (v > mostNum) { mostCat = k; mostNum = v }
  }

  return {
    totalFailed: courses.length,
    affectedSemesters: semesters.size,
    avgFailScore: avgScore,
    mostProblemCategory: mostCat,
    studentIssueCount: courses.filter((c) => c.riskLevel === 'student').length,
    courseIssueCount: courses.filter((c) => c.riskLevel === 'course').length,
    mixedIssueCount: courses.filter((c) => c.riskLevel === 'mixed').length,
  }
}

function buildSemesterGroups(courses: FailCourseVM[]): FailSemesterGroupVM[] {
  const map = new Map<number, FailCourseVM[]>()
  for (const c of courses) {
    const list = map.get(c.semesterIndex) || []
    list.push(c)
    map.set(c.semesterIndex, list)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([, list]) => ({
      semester: list[0].semester,
      semesterIndex: list[0].semesterIndex,
      courses: list.sort((a, b) => a.score - b.score),
      totalScore: list.reduce((s, c) => s + c.score, 0),
      avgScore: Math.round((list.reduce((s, c) => s + c.score, 0) / list.length) * 10) / 10,
    }))
}

export function adaptFailDetail(dto: FailDetailDTO): FailDetailVM {
  const courses = dto.courses.map(adaptCourse)
  const semesterList = Array.from(new Set(courses.map((c) => c.semester)))

  return {
    overview: buildOverview(courses),
    semesters: buildSemesterGroups(courses),
    courses,
    studentSide: courses.filter((c) => c.riskLevel === 'student'),
    courseSide: courses.filter((c) => c.riskLevel === 'course'),
    semesterList,
  }
}
