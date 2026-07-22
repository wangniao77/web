/**
 * 学生端"学分完成率"系列页面 · DTO → VM 转换
 */
import type {
  CategoryProgressDTO,
  CreditProgressDTO,
  CreditProgressVM,
} from './types'

function adaptCategoryProgress(c: CategoryProgressDTO): CategoryProgressDTO & {
  earnedText: string
  remainingText: string
  progressText: string
  isComplete: boolean
} {
  return {
    ...c,
    earnedText: `${c.earnedCredits}`,
    remainingText: c.remainingCredits > 0 ? `还差 ${c.remainingCredits}` : '已达成',
    progressText: `${c.progress.toFixed(1)}%`,
    isComplete: c.remainingCredits === 0 && c.remainingCourseCount === 0,
  }
}

export function adaptCreditProgress(dto: CreditProgressDTO): CreditProgressVM {
  const totalRequired = dto.summary.totalRequiredCredits
  const totalEarned = dto.summary.totalEarnedCredits
  const overallProgress = totalRequired > 0
    ? Math.min(100, (totalEarned / totalRequired) * 100)
    : 0

  return {
    summary: {
      ...dto.summary,
      overallProgress: Math.round(overallProgress * 10) / 10,
      categories: dto.summary.categories.map(adaptCategoryProgress),
    },
    courses: dto.courses,
    hasGaps: dto.summary.gaps.length > 0,
  }
}
