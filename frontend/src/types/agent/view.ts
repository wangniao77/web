import type { AgentInsightTone } from '@/types/agent/api'

export interface AgentEvidenceVM {
  source: 'db' | 'openviking' | 'web'
  label: string
  value: string
  ref?: string
}

export interface AgentInsightVM {
  title: string
  detail: string
  tone: AgentInsightTone
  evidence?: AgentEvidenceVM[]
}

export interface AgentReportSectionVM {
  title: string
  bullets: string[]
}

export interface AgentAnalysisVM {
  insights: AgentInsightVM[]
  actions: string[]
  sessionId: string
  traceId: string
  source: 'agent' | 'rule' | 'mock'
  degraded?: boolean
  degradeReason?: string
  headline?: string
  dataFingerprint?: string
  filters?: Record<string, unknown>
  sections?: AgentReportSectionVM[]
  generatedAt?: string
}

export interface AgentChatMessageVM {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}
