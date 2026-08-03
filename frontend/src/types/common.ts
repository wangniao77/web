export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface FilterParams {
  academicYear?: string
  semester?: '1' | '2'
  /** 业务学期码，如 2025-2026-2；师资课时等按学期分析时优先使用 */
  term?: string
}

export interface CollegeScope extends FilterParams {
  collegeId?: string
  /** 就业分析：签约届次年份 */
  year?: string
  /** 就业分析：专业名（全部专业可不传） */
  major?: string
  /** 就业分析：学历（全部学历/本科/研究生） */
  educationLevel?: string
}

export interface StudentScope extends FilterParams {
  studentId?: string
}

export interface UniversityScope extends FilterParams {}

export type TrendDirection = 'up' | 'down' | 'flat'

export interface TrendInfo {
  direction: TrendDirection
  value: number
  unit?: string
}
