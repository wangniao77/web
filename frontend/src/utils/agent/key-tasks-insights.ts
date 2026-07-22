import type { AgentAnalysisVM } from '@/types/agent/view'
import type { KeyTaskDetailVM, KeyTasksDetailVM } from '@/types/college/view/details'

/** 规则洞察：Mock / Agent 失败时的降级逻辑（与历史「深度挖掘」一致） */
export function buildKeyTasksRuleAnalysis(
  data: KeyTasksDetailVM,
  sessionId = `rule-${Date.now()}`,
): AgentAnalysisVM {
  const { summary } = data
  const researchTasks = data.tasks.filter((t) => t.category === 'research')
  const teachingTasks = data.tasks.filter((t) => t.category === 'teaching')
  const riskTasks = data.tasks.filter(
    (t) => t.statusClass === 'delayed' || t.statusLabel?.includes('关注') || t.statusLabel?.includes('滞后'),
  )

  const attentionShare = summary.total ? Math.round((summary.delayed / summary.total) * 100) : 0
  const researchAvg = avgProgress(researchTasks)
  const teachingAvg = avgProgress(teachingTasks)
  const lowProgress = [...data.tasks].sort((a, b) => a.progress - b.progress).slice(0, 2)

  return {
    insights: [
      {
        title: '总体完成节奏可控',
        detail: `年度完成率 ${summary.completionRate}%，已完成 ${summary.completed} 项、推进中 ${summary.ongoing} 项；主体任务按节点推进。`,
        tone: 'good',
      },
      {
        title: '风险仍集中在少数任务',
        detail: `需关注 ${summary.delayed} 项，占比约 ${attentionShare}%。${
          riskTasks[0] ? `当前最紧的是「${riskTasks[0].name}」。` : ''
        }`,
        tone: 'warn',
      },
      {
        title: '科研与教学进度差可拆解',
        detail: `科研均进度 ${researchAvg}%、教学均进度 ${teachingAvg}%，差距 ${Math.abs(researchAvg - teachingAvg)} 个百分点；低进度任务：${
          lowProgress.map((t) => t.name).join('、') || '暂无'
        }。`,
        tone: 'info',
      },
    ],
    actions: [
      '对「需关注」任务建立双周督导清单，明确责任人与补救节点',
      '把低进度科研任务与学院科研例会绑定，提前预审材料',
      '教学竞赛类任务提前锁定参赛教师课表，避免报名窗口冲突',
    ],
    sessionId,
    traceId: `rule-${sessionId}`,
    source: 'rule',
  }
}

function avgProgress(tasks: KeyTaskDetailVM[]) {
  if (!tasks.length) return 0
  return Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length)
}
