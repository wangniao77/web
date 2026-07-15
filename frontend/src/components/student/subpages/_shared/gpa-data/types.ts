/**
 * 学生端 GPA 详情 · 共享类型定义
 *
 * 由 gpa-detail 和 gpa-semester 两个二级页面共用。
 */

export type CourseCategory =
  | 'general'    // 通识必修
  | 'major-base'  // 专业基础
  | 'major-core'  // 专业核心
  | 'elective'    // 专业选修
  | 'humanity'    // 人文社科
  | 'art'         // 艺术体育
  | 'practice'    // 实践环节

export type GradeLevel = 'excellent' | 'good' | 'medium' | 'pass' | 'fail'

/** 原始 DTO（与后端字段保持一致） */
export interface CourseRecordDTO {
  id: string
  name: string
  semester: string          // 学期，如 "2024春"
  semesterIndex: number     // 排序用：1, 2, 3...
  score: number             // 百分制分数
  credit: number            // 学分
  category: CourseCategory
  /** 是否计入 GPA（部分实践/体测课可能不计入） */
  counted: boolean
  /** 是否为重修课程 */
  retake?: boolean
}

export interface SemesterSummaryDTO {
  semester: string
  semesterIndex: number
  gpa: number               // 学期 GPA
  averageScore: number      // 学期加权平均分
  totalCredits: number      // 学期获得学分
  totalCourses: number      // 学期修读课程数
  excellentCourses: number  // 学期优秀课程数（>=90）
  failCourses: number       // 学期不及格课程数
}

export interface CategoryStatDTO {
  category: CourseCategory
  categoryLabel: string
  gpa: number               // 类别 GPA
  averageScore: number      // 类别平均分
  courseCount: number
  creditCount: number
}

export interface GpaOverviewDTO {
  studentId: string
  studentName: string
  major: string
  grade: string
  /** 累计 GPA（4.0 制） */
  cumulativeGpa: number
  /** 加权平均分（百分制） */
  weightedAverage: number
  /** 已修学分 */
  earnedCredits: number
  /** 总学分（应修） */
  totalCredits: number
  /** 优秀课程数（>=90） */
  excellentCount: number
  /** 良好课程数（80-89） */
  goodCount: number
  /** 中等课程数（70-79） */
  mediumCount: number
  /** 及格课程数（60-69） */
  passCount: number
  /** 不及格课程数（<60） */
  failCount: number
  /** 预警课程数（<75，给"待提升"用） */
  warningCount: number
  /** 在专业内排名（百分位 0-100，越大越好） */
  majorRankPercent: number
  /** 同专业人数 */
  majorTotal: number
  /** 班级排名 */
  classRank: number
  classTotal: number
}

export interface GpaDetailDTO {
  overview: GpaOverviewDTO
  semesters: SemesterSummaryDTO[]
  categoryStats: CategoryStatDTO[]
  courses: CourseRecordDTO[]
}

/* ── ViewModel（在 DTO 之上加工，供组件直接消费） ──────────── */

export interface GpaOverviewVM extends GpaOverviewDTO {
  completionRate: number    // 已修/总学分
  level: GradeLevel          // 整体水平（基于累计 GPA）
  levelLabel: string
  majorRankLabel: string
  classRankLabel: string
}

export interface CourseRecordVM extends CourseRecordDTO {
  /** 4.0 制绩点（不含加权，仅按分数折算） */
  gpaPoint: number
  /** 加权贡献：绩点 × 学分 */
  weightedPoint: number
  /** 等级 */
  level: GradeLevel
  levelLabel: string
  categoryLabel: string
  /** 是否预警 */
  warning: boolean
}

export interface SemesterSummaryVM extends SemesterSummaryDTO {
  excellentRate: number
}

export interface GpaDetailVM {
  overview: GpaOverviewVM
  semesters: SemesterSummaryVM[]
  categoryStats: CategoryStatDTO[]
  courses: CourseRecordVM[]
  /** 全部学期（按索引升序） */
  semesterList: string[]
  /** 优秀课程 Top */
  excellentCourses: CourseRecordVM[]
  /** 待提升课程 */
  warningCourses: CourseRecordVM[]
}
