import type { NewsTag } from '@/domains/university/types/api'

export interface KeyTaskDetailItemVM {
  id: string
  name: string
  description: string
  progress: number
  statusLabel: string
  statusClass: string
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
}

export interface NewsDetailItemVM {
  id: string
  tag: NewsTag
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
