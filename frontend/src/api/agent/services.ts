import client from '@/api/client'
import { createService, isMockMode } from '@/api/createService'
import { unwrapApiData } from '@/api/unwrap'
import { mockAgentAnalyze, mockAgentChatReply } from '@/mock/agent/key-tasks-analysis'
import type {
  AgentAnalyzeRequestDTO,
  AgentAnalyzeResponseDTO,
  AgentChatChunkDTO,
  AgentChatRequestDTO,
} from '@/types/agent/api'
import type { AgentAnalysisVM } from '@/types/agent/view'

export function isAgentEnabled() {
  if (isMockMode()) return true
  return import.meta.env.VITE_ENABLE_AGENT === 'true'
}

function toVM(dto: AgentAnalyzeResponseDTO, degraded?: boolean, degradeReason?: string): AgentAnalysisVM {
  return {
    insights: dto.insights,
    actions: dto.actions,
    sessionId: dto.sessionId,
    traceId: dto.traceId,
    source: dto.source,
    degraded,
    degradeReason,
    headline: dto.headline,
    dataFingerprint: dto.dataFingerprint,
    filters: dto.filters,
    sections: dto.sections,
    generatedAt: dto.generatedAt,
  }
}

const analyzeService = createService<AgentAnalyzeRequestDTO, AgentAnalyzeResponseDTO>({
  mock: (req) => mockAgentAnalyze(req),
  fetch: async (req) => {
    const res = await client.post<import('@/types/common').ApiResponse<AgentAnalyzeResponseDTO>>(
      '/agent/analyze',
      req,
    )
    return unwrapApiData(res)
  },
})

export async function analyzePage(req: AgentAnalyzeRequestDTO): Promise<AgentAnalysisVM> {
  if (!isAgentEnabled() && !isMockMode()) {
    const fallback = mockAgentAnalyze(req)
    return toVM({ ...fallback, source: 'rule' }, true, 'Agent 未启用')
  }

  try {
    const dto = await analyzeService(req)
    return toVM(dto)
  } catch (e: unknown) {
    const fallback = mockAgentAnalyze(req)
    return toVM(
      { ...fallback, source: 'rule' },
      true,
      e instanceof Error ? e.message : 'Agent 分析失败，已降级为规则洞察',
    )
  }
}

/** SSE 追问；Mock 模式模拟逐字输出 */
export async function chatFollowUp(
  req: AgentChatRequestDTO,
  onChunk: (chunk: AgentChatChunkDTO) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (isMockMode() || !isAgentEnabled()) {
    const text = mockAgentChatReply(req)
    for (const ch of text) {
      if (signal?.aborted) return
      onChunk({ type: 'token', content: ch })
      await new Promise((r) => setTimeout(r, 12))
    }
    onChunk({ type: 'done', traceId: `mock-chat-${Date.now()}` })
    return
  }

  const base = import.meta.env.VITE_API_BASE || '/api/v1'
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${base}/agent/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(req),
    signal,
  })

  if (!res.ok || !res.body) {
    throw new Error(`追问失败 (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const part of parts) {
      const line = part
        .split('\n')
        .find((l) => l.startsWith('data:'))
      if (!line) continue
      const raw = line.slice(5).trim()
      if (!raw || raw === '[DONE]') {
        onChunk({ type: 'done' })
        continue
      }
      try {
        const chunk = JSON.parse(raw) as AgentChatChunkDTO
        onChunk(chunk)
      } catch {
        onChunk({ type: 'token', content: raw })
      }
    }
  }
  onChunk({ type: 'done' })
}

export const agentService = {
  analyzePage,
  chatFollowUp,
  isAgentEnabled,
}
