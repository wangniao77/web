import type { KeyTaskStatus, NewsTag } from '@/domains/university/types/api'

export interface KeyTaskDetailItemDTO {
  id: string
  name: string
  description: string
  progress: number
  status: KeyTaskStatus
  leadDept: string
  deadline: string
  milestones: Array<{ label: string; done: boolean }>
}

export interface KeyTasksDetailDTO {
  summary: {
    total: number
    completed: number
    ongoing: number
    attention: number
  }
  tasks: KeyTaskDetailItemDTO[]
}

export interface EmploymentDetailDTO {
  overview: Array<{ label: string; value: number | string; unit?: string }>
  trend: Array<{ term: string; rate: number; furtherRate: number }>
  distribution: Array<{ name: string; value: number }>
  byCollege: Array<{
    collegeName: string
    employmentRate: number
    furtherRate: number
  }>
}

export interface NewsDetailDTO {
  items: Array<{
    id: string
    tag: NewsTag
    title: string
    summary: string
    content: string
    date: string
    source?: string
  }>
}
