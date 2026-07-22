import type { AgentInsightTone } from '@/types/agent/api'

export interface AgentInsightVM {
  title: string
  detail: string
  tone: AgentInsightTone
}

export interface AgentAnalysisVM {
  insights: AgentInsightVM[]
  actions: string[]
  sessionId: string
  traceId: string
  source: 'agent' | 'rule' | 'mock'
  degraded?: boolean
  degradeReason?: string
}

export interface AgentChatMessageVM {
  id: string
  role: 'user' | 'assistant'
  content: string
  pending?: boolean
}
