/**
 * 学生端 GPA 详情 · 共享工具函数
 */
import type { CourseCategory, GradeLevel } from './types'

/**
 * 百分制 → 4.0 制绩点（标准 4.0 算法）
 * 90+ → 4.0 | 85-89 → 3.7 | 82-84 → 3.3 | 78-81 → 3.0
 * 75-77 → 2.7 | 72-74 → 2.3 | 68-71 → 2.0 | 64-67 → 1.5
 * 60-63 → 1.0 | <60  → 0
 */
export function scoreToGpa(score: number): number {
  if (score >= 90) return 4.0
  if (score >= 85) return 3.7
  if (score >= 82) return 3.3
  if (score >= 78) return 3.0
  if (score >= 75) return 2.7
  if (score >= 72) return 2.3
  if (score >= 68) return 2.0
  if (score >= 64) return 1.5
  if (score >= 60) return 1.0
  return 0
}

export function scoreToLevel(score: number): GradeLevel {
  if (score >= 90) return 'excellent'
  if (score >= 80) return 'good'
  if (score >= 70) return 'medium'
  if (score >= 60) return 'pass'
  return 'fail'
}

export const LEVEL_LABEL: Record<GradeLevel, string> = {
  excellent: '优秀',
  good: '良好',
  medium: '中等',
  pass: '及格',
  fail: '不及格',
}

export const LEVEL_SHORT_LABEL: Record<GradeLevel, string> = {
  excellent: '优',
  good: '良',
  medium: '中',
  pass: '及',
  fail: '差',
}

export const CATEGORY_LABEL: Record<CourseCategory, string> = {
  general:    '通识必修',
  'major-base': '专业基础',
  'major-core': '专业核心',
  elective:   '专业选修',
  humanity:   '人文社科',
  art:        '艺术体育',
  practice:   '实践环节',
}

export const CATEGORY_COLOR: Record<CourseCategory, string> = {
  general:    '#66d9ff',
  'major-base': '#00b8ff',
  'major-core': '#00e5ff',
  elective:   '#8b5cf6',
  humanity:   '#f0c040',
  art:        '#fb923c',
  practice:   '#34d399',
}

/** 数字精度：保留 1 位 */
export function round1(n: number): number {
  return Math.round(n * 10) / 10
}

/** 数字精度：保留 2 位 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}
