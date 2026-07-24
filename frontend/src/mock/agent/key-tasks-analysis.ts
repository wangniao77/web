import type { AgentAnalyzeRequestDTO, AgentAnalyzeResponseDTO, AgentChatRequestDTO } from '@/types/agent/api'
import {
  buildAcademicRiskRuleAnalysis,
  type AcademicRiskSnapshot,
} from '@/utils/agent/academic-risk-insights'
import { mockEmploymentAnalysisReport } from '@/utils/agent/employment-insights'
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
  const page = req.context.page

  if (page === 'enrollment-employment' || page === 'employment') {
    const report = mockEmploymentAnalysisReport(
      (req.context.filters?.year as string) ||
        (snapshot && typeof snapshot === 'object' && 'year' in snapshot
          ? String((snapshot as { year?: string }).year || '2026')
          : '2026'),
    )
    return {
      insights: report.insights,
      actions: report.actions,
      sessionId,
      traceId: `mock-emp-${Date.now()}`,
      source: 'mock',
      headline: report.headline,
      dataFingerprint: report.dataFingerprint,
      filters: report.filters as Record<string, unknown>,
      sections: report.sections,
      generatedAt: report.generatedAt,
    }
  }

  if (page === 'academic-risk' || page === 'warning' || isAcademicRiskSnapshot(snapshot)) {
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
  if (page === 'enrollment-employment' || page === 'employment') {
    return `（Mock）已结合就业分析快照理解：「${req.message}」。可从落实率、高质量六类、专业差距与待就业四方面继续追问。`
  }
  return `（Mock）已结合「${page}」上下文理解：「${req.message}」。建议先核对低进度任务责任人与补救节点。`
}
