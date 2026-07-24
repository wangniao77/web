/** 就业深度分析报告（缓存） */

import type { AgentInsightTone } from '@/types/agent/api'

export type EmploymentEvidenceSource = 'db' | 'openviking' | 'web'

export interface EmploymentAnalysisEvidence {
  source: EmploymentEvidenceSource
  label: string
  value: string
  ref?: string
}

export interface EmploymentAnalysisInsight {
  title: string
  detail: string
  tone: AgentInsightTone
  evidence?: EmploymentAnalysisEvidence[]
}

export interface EmploymentAnalysisSection {
  title: string
  bullets: string[]
}

export interface EmploymentAnalysisReportDTO {
  generatedAt?: string
  source?: 'agent' | 'rule' | 'mock'
  dataFingerprint?: string
  filters?: { year?: string | null; major?: string | null }
  headline?: string
  insights: EmploymentAnalysisInsight[]
  actions: string[]
  sections?: EmploymentAnalysisSection[]
  sessionId?: string
  traceId?: string
}

export interface EmploymentAnalysisReportResponseDTO {
  report: EmploymentAnalysisReportDTO | null
  stale: boolean
  dataFingerprint: string
  filters?: { year?: string | null; major?: string | null }
}
