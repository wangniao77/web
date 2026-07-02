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
}

export interface StudentScope extends FilterParams {
  studentId?: string
}

export type TrendDirection = 'up' | 'down' | 'flat'

export interface TrendInfo {
  direction: TrendDirection
  value: number
  unit?: string
}
