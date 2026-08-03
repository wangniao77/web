import type { FacultyNum, MissingMark } from '@/types/college/api/teacher-analytics'

export const MISSING_MARK: MissingMark = '**'

export function isMissingMark(v: unknown): v is MissingMark {
  return v === '**' || v === null || v === undefined || v === ''
}

/** 师资数值展示：缺源统一为 ** */
export function fmtFacultyNum(v: FacultyNum | string | null | undefined, suffix = ''): string {
  if (isMissingMark(v)) return MISSING_MARK
  return `${v}${suffix}`
}

export function facultyNumOrZero(v: FacultyNum | null | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return 0
}
