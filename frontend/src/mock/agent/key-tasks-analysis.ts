import type { AgentAnalyzeRequestDTO, AgentAnalyzeResponseDTO, AgentChatRequestDTO } from '@/types/agent/api'
import {
  buildAcademicRiskRuleAnalysis,
  type AcademicRiskSnapshot,
} from '@/utils/agent/academic-risk-insights'
import { mockEmploymentAnalysisReport } from '@/utils/agent/employment-insights'
import {
  buildBenchmarkSwotRuleAnalysis,
  isBenchmarkSwotSnapshot,
} from '@/utils/agent/benchmark-swot-insights'
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

  if (page === 'graduate-cultivation' || page === 'graduate' || page === 'student-dev-graduate') {
    const gradCount =
      snapshot && typeof snapshot === 'object' && 'graduateCount' in snapshot
        ? Number((snapshot as { graduateCount?: number }).graduateCount || 418)
        : 418
    return {
      insights: [
        {
          title: '研究生规模与层次结构',
          detail: `Mock：在籍研究生约 ${gradCount} 人，可支撑科研育人观察，建议继续看专业与导师覆盖。`,
          tone: 'good',
          evidence: [{ source: 'db', label: '研究生人数', value: `${gradCount}人` }],
        },
        {
          title: '专业集中度需分层培养',
          detail: 'Mock：研究生专业结构相对集中，建议差异化课程与导师资源配置。',
          tone: 'info',
          evidence: [{ source: 'db', label: '专业数', value: '示意' }],
        },
        {
          title: '科研育人与导师覆盖',
          detail: 'Mock：论文/课题参与与导师覆盖仍有提升空间，建议打通开题中期与成果台账。',
          tone: 'warn',
          evidence: [{ source: 'db', label: '科研参与率', value: '示意' }],
        },
      ],
      actions: [
        '补齐研究生导师与专业方向字段',
        '把论文/课题台账与研究生学号对齐',
        '对高集中专业制定分层培养计划',
      ],
      sessionId,
      traceId: `mock-grad-${Date.now()}`,
      source: 'mock',
      headline: `研究生 ${gradCount} 人 · Mock 培养分析`,
      sections: [
        { title: '规模结构', bullets: [`研究生 ${gradCount} 人`, '占比示意'] },
        { title: '科研育人', bullets: ['论文/课题覆盖示意', '导师覆盖示意'] },
      ],
      generatedAt: new Date().toISOString(),
    }
  }

  if (page === 'college-benchmark-swot' || isBenchmarkSwotSnapshot(snapshot)) {
    if (isBenchmarkSwotSnapshot(snapshot)) {
      const vm = buildBenchmarkSwotRuleAnalysis(snapshot, sessionId)
      return {
        insights: vm.insights,
        actions: vm.actions,
        sessionId: vm.sessionId,
        traceId: `mock-${vm.traceId}`,
        source: 'mock',
        headline: vm.headline,
      }
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
  if (page === 'college-benchmark-swot') {
    return `（Mock）已结合精品成果对标快照理解：「${req.message}」。可从达标项、缺口项与还差数量继续追问，不要改写事实数字。`
  }
  if (page === 'graduate-cultivation' || page === 'graduate') {
    return `（Mock）已结合研究生培养快照理解：「${req.message}」。可从规模占比、专业集中、导师覆盖与科研参与继续追问。`
  }
  return `（Mock）已结合「${page}」上下文理解：「${req.message}」。建议先核对低进度任务责任人与补救节点。`
}
