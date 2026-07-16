import type { RiskLevel } from '@/constants/university/risk'
import type { EventCategory, EventStatus } from '@/types/university/api'

export interface KeyTaskDetailItemVM {
  id: string
  name: string
  description: string
  progress: number
  statusLabel: string
  statusClass: string
  riskLevel: RiskLevel
  riskLabel: string
  riskClass: string
  leadDept: string
  deadline: string
  milestones: Array<{ label: string; done: boolean }>
}

export interface KeyTasksDetailVM {
  summary: {
    total: number
    completed: number
    ongoing: number
    attention: number
    overdue?: number
  }
  tasks: KeyTaskDetailItemVM[]
}

export interface EmploymentDetailVM {
  overview: Array<{ label: string; value: string; unit?: string }>
  trend: Array<{ term: string; rate: number; furtherRate: number }>
  distribution: Array<{ name: string; value: number }>
  byCollege: Array<{
    collegeName: string
    employmentRate: number
    furtherRate: number
  }>
  destinationStructure: Array<{ name: string; value: number }>
  industryShare: Array<{ name: string; value: number }>
  salaryDistribution: Array<{ range: string; count: number }>
  salaryCoverage: number
}

export interface NewsDetailItemVM {
  id: string
  tag: string
  tagLabel: string
  title: string
  summary: string
  content: string
  date: string
  source?: string
}

export interface NewsDetailVM {
  items: NewsDetailItemVM[]
}

export interface ResearchDetailVM {
  projects: Array<{ name: string; level: string; count: number; funding: number }>
  papers: Array<{ type: string; count: number; trend: number }>
  platforms: Array<{ name: string; level: string; college: string }>
  phdIndicators: Array<{
    name: string
    target: number
    current: number
    gap: number
    dept: string
    deadline: string
  }>
  collegeRanking: Array<{ collegeName: string; projects: number; funding: number; papers: number }>
  fundingTrend: Array<{ year: string; value: number }>
}

export interface DisciplineDetailVM {
  disciplines: Array<{
    name: string
    currentRank: number
    previousRank: number
    change: number
    changeLabel: string
    percentile: number
    targetRank: number
    gap: number
    benchmarkSchool?: string
    trend: Array<{ year: string; rank: number }>
  }>
}

export interface EventsDetailVM {
  items: Array<{
    id: string
    category: EventCategory
    categoryLabel: string
    title: string
    summary: string
    date: string
    status: EventStatus
    statusLabel: string
    needsAttention: boolean
    leadDept: string
    nextAction?: string
  }>
}

export interface AcademicRiskDetailVM {
  summary: {
    expectedDelayCount: number
    delayRateChange: number
    warningCount: number
    intervenedCount: number
    riskResolvedRate: number
    highRiskCollegeCount: number
  }
  trend: Array<{ month: string; warning: number; delay: number }>
  riskTypes: Array<{ type: string; count: number }>
  collegeDistribution: Array<{ collegeName: string; warningCount: number; delayCount: number }>
  interventionProgress: Array<{ month: string; intervened: number; resolved: number }>
}

export interface MetricsDetailVM {
  sections: Array<{
    title: string
    items: Array<{ name: string; definition: string; source: string; formula?: string }>
  }>
}
