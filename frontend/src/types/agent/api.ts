/** Agent 分析 / 追问 API 契约 */

export type AgentInsightTone = 'good' | 'warn' | 'info'

export interface AgentInsightDTO {
  title: string
  detail: string
  tone: AgentInsightTone
}

export interface AgentAnalyzeContextDTO {
  scope: 'college' | 'university' | 'student'
  page: string
  collegeId?: string
  studentId?: string
  filters?: Record<string, string>
  /** 页面侧已加载的摘要快照，减少 Agent 二次拉数 */
  summarySnapshot?: Record<string, unknown>
}

export interface AgentAnalyzeRequestDTO {
  context: AgentAnalyzeContextDTO
  /** 续用已有会话；空则新建 */
  sessionId?: string
  refresh?: boolean
}

export interface AgentAnalyzeResponseDTO {
  insights: AgentInsightDTO[]
  actions: string[]
  sessionId: string
  traceId: string
  source: 'agent' | 'rule' | 'mock'
}

export interface AgentChatMessageDTO {
  role: 'user' | 'assistant'
  content: string
}

export interface AgentChatRequestDTO {
  sessionId: string
  message: string
  context: AgentAnalyzeContextDTO
}

export interface AgentChatChunkDTO {
  type: 'token' | 'done' | 'error'
  content?: string
  traceId?: string
  error?: string
}
