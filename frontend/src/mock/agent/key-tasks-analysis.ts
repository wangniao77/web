import type { AgentAnalyzeRequestDTO, AgentAnalyzeResponseDTO, AgentChatRequestDTO } from '@/types/agent/api'
import {
  buildAcademicRiskRuleAnalysis,
  type AcademicRiskSnapshot,
} from '@/utils/agent/academic-risk-insights'
import { buildKeyTasksRuleAnalysis } from '@/utils/agent/key-tasks-insights'
import type { KeyTasksDetailVM } from '@/types/college/view/details'

function isAcademicRiskSnapshot(snapshot: unknown): snapshot is AcademicRiskSnapshot {
  if (!snapshot || typeof snapshot !== 'object') return false
  const s = snapshot as AcademicRiskSnapshot
  return Boolean(s.summary && (s.byGrade || s.topRiskMajors || typeof s.summary.warned === 'number'))
}

/** Mock analyze：按页面快照形状分发 */
export function mockAgentAnalyze(req: AgentAnalyzeRequestDTO): AgentAnalyzeResponseDTO {
  const sessionId = req.sessionId || `mock-session-${Date.now()}`
  const snapshot = req.context.summarySnapshot

  if (
    req.context.page === 'academic-risk' ||
    req.context.page === 'warning' ||
    isAcademicRiskSnapshot(snapshot)
  ) {
    if (isAcademicRiskSnapshot(snapshot)) {
      const vm = buildAcademicRiskRuleAnalysis(snapshot, sessionId)
      return {
        insights: vm.insights,
        actions: vm.actions,
        sessionId: vm.sessionId,
        traceId: `mock-${vm.traceId}`,
        source: 'mock',
      }
    }
  }

  if (snapshot && typeof snapshot === 'object' && Array.isArray((snapshot as KeyTasksDetailVM).tasks)) {
    const vm = buildKeyTasksRuleAnalysis(snapshot as KeyTasksDetailVM, sessionId)
    return {
      insights: vm.insights,
      actions: vm.actions,
      sessionId: vm.sessionId,
      traceId: `mock-${vm.traceId}`,
      source: 'mock',
    }
  }

  return {
    insights: [
      {
        title: '总体完成节奏可控',
        detail: 'Mock：年度任务主体按节点推进，完成率处于可控区间。',
        tone: 'good',
      },
      {
        title: '风险仍集中在少数任务',
        detail: 'Mock：需关注任务集中在低进度科研项，建议双周督导。',
        tone: 'warn',
      },
      {
        title: '科研与教学进度差可拆解',
        detail: 'Mock：科研与教学均进度存在差距，可按责任人拆解补救。',
        tone: 'info',
      },
    ],
    actions: [
      '对「需关注」任务建立双周督导清单',
      '低进度科研任务绑定学院科研例会',
      '教学竞赛类任务提前锁定参赛课表',
    ],
    sessionId,
    traceId: `mock-trace-${Date.now()}`,
    source: 'mock',
  }
}

export function mockAgentChatReply(req: AgentChatRequestDTO): string {
  const page = req.context.page
  if (page === 'academic-risk' || page === 'warning') {
    return `（Mock）已结合「${page}」学业风险聚合理解：「${req.message}」。建议先看预警率最高的年级与专业，安排辅导员双周跟进，不对外点名。`
  }
  return `（Mock）已结合「${page}」页面上下文理解你的问题：「${req.message}」。建议先核对需关注任务的责任人与下一里程碑节点，再安排双周督导。`
}
