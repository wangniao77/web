/**
 * 学生端挂科详情 · 共享类型定义
 */

export type FailRiskLevel = 'student' | 'course' | 'mixed'

export interface FailCourseDTO {
  id: string
  name: string
  semester: string
  semesterIndex: number
  score: number               // 学生得分
  credit: number
  category: string
  teacher: string
  /** 班级平均分 */
  classAvg: number
  /** 班级挂科率 0-100 */
  classFailRate: number
  /** 班级人数 */
  classTotal: number
  /** 班级挂科人数 */
  classFailCount: number
  /** 是否必修 */
  required: boolean
  /** 归因方向：student=学生个人原因，course=课程整体难度高，mixed=兼有 */
  riskLevel: FailRiskLevel
  /** 简要分析文本 */
  analysis: string
}

export interface FailDetailDTO {
  studentId: string
  studentName: string
  major: string
  grade: string
  /** 全部挂科课程 */
  courses: FailCourseDTO[]
}

/* ── ViewModel ── */

export interface FailCourseVM extends FailCourseDTO {
  /** 与班级均分差距 */
  gapFromAvg: number
  /** 差距方向：below=低于均分，extremely=大幅低于 */
  gapLabel: string
  /** 挂科严重程度标签 */
  severityLabel: string
  /** 课程类别中文 */
  categoryLabel: string
}

export interface FailSemesterGroupVM {
  semester: string
  semesterIndex: number
  courses: FailCourseVM[]
  /** 学期挂科总分 */
  totalScore: number
  /** 学期平均挂科分 */
  avgScore: number
}

export interface FailOverviewVM {
  totalFailed: number
  affectedSemesters: number
  avgFailScore: number
  mostProblemCategory: string
  /** 学生侧问题课程数 */
  studentIssueCount: number
  /** 课程侧问题课程数 */
  courseIssueCount: number
  /** 混合问题课程数 */
  mixedIssueCount: number
}

export interface FailDetailVM {
  overview: FailOverviewVM
  semesters: FailSemesterGroupVM[]
  courses: FailCourseVM[]
  /** 学生个人原因挂科 */
  studentSide: FailCourseVM[]
  /** 课程普遍偏难挂科 */
  courseSide: FailCourseVM[]
  /** 所有学期列表 */
  semesterList: string[]
}
