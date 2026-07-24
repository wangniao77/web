export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface FilterParams {
  academicYear?: string
  semester?: '1' | '2'
}

export interface CollegeScope extends FilterParams {
  collegeId?: string
  /** 就业分析：签约届次年份 */
  year?: string
  /** 就业分析：专业名（全部专业可不传） */
  major?: string
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
