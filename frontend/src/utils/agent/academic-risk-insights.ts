import type { AgentAnalysisVM } from '@/types/agent/view'
import type { WarningDetailVM, WarningRecordVM } from '@/types/college/view/details'

export interface AcademicRiskSnapshot {
  warningType?: string
  summary: {
    students?: number
    warned: number
    warnRate?: number
    avgGpa?: number | null
    cet4PassRate?: number
    cet6PassRate?: number
    byType?: Record<string, number>
    byLevel?: Record<string, number>
  }
  byGrade?: Array<{
    grade: string
    students: number
    warned: number
    warnRate: number
    avgGpa?: number | null
  }>
  byMajor?: Array<{
    major: string
    students: number
    warned: number
    high?: number
    warnRate: number
  }>
  topRiskMajors?: Array<{
    major: string
    warned: number
    high?: number
    warnRate: number
  }>
}

/** 从预警花名册本地聚合成无姓名快照（Mock / 降级） */
export function aggregateWarningRecords(detail: WarningDetailVM): AcademicRiskSnapshot {
  const byGrade = new Map<string, { students: Set<string>; warned: number }>()
  const byMajor = new Map<string, { students: Set<string>; warned: number; high: number }>()

  for (const row of detail.records) {
    const grade = row.grade || '未知'
    const major = row.major || '未知专业'
    if (!byGrade.has(grade)) byGrade.set(grade, { students: new Set(), warned: 0 })
    if (!byMajor.has(major)) byMajor.set(major, { students: new Set(), warned: 0, high: 0 })
    const g = byGrade.get(grade)!
    const m = byMajor.get(major)!
    g.students.add(row.studentId)
    m.students.add(row.studentId)
    g.warned += 1
    m.warned += 1
    if (row.level === 'high') m.high += 1
  }

  const uniqueStudents = new Set(detail.records.map((r: WarningRecordVM) => r.studentId))
  const warned = uniqueStudents.size
  const grades = [...byGrade.entries()].map(([grade, v]) => {
    const students = v.students.size
    return {
      grade,
      students,
      warned: v.warned,
      warnRate: students ? Math.round((v.warned / students) * 1000) / 10 : 0,
    }
  })
  const majors = [...byMajor.entries()]
    .map(([major, v]) => {
      const students = v.students.size
      return {
        major,
        students,
        warned: v.warned,
        high: v.high,
        warnRate: students ? Math.round((v.warned / students) * 1000) / 10 : 0,
      }
    })
    .sort((a, b) => b.warnRate - a.warnRate)

  return {
    warningType: detail.type,
    summary: {
      students: warned,
      warned,
      warnRate: 100,
      byLevel: detail.records.reduce<Record<string, number>>((acc, r) => {
        acc[r.level] = (acc[r.level] || 0) + 1
        return acc
      }, {}),
    },
    byGrade: grades,
    byMajor: majors.slice(0, 12),
    topRiskMajors: majors.filter((m) => m.warned > 0).slice(0, 5),
  }
}

export function buildAcademicRiskRuleAnalysis(
  snapshot: AcademicRiskSnapshot,
  sessionId = `rule-risk-${Date.now()}`,
): AgentAnalysisVM {
  const summary = snapshot.summary
  const grades = snapshot.byGrade || []
  const top = snapshot.topRiskMajors || []
  const warned = summary.warned || 0
  const rate = summary.warnRate ?? 0
  const high = summary.byLevel?.high || 0
  const worst = grades.length
    ? [...grades].sort((a, b) => b.warnRate - a.warnRate)[0]
    : null
  const topMajor = top[0]

  return {
    insights: [
      {
        title: '预警覆盖面',
        detail: `当前类别命中 ${warned} 人；高风险 ${high} 人次；预警率口径 ${rate}%。`,
        tone: rate >= 15 || high > 0 ? 'warn' : 'info',
      },
      {
        title: '年级风险分布',
        detail: worst
          ? `预警较集中年级为 ${worst.grade}（预警人次 ${worst.warned}，相对占比 ${worst.warnRate}%）。`
          : '暂无年级分布数据。',
        tone: worst && worst.warnRate >= 20 ? 'warn' : 'info',
      },
      {
        title: '专业集中度',
        detail: topMajor
          ? `风险较集中专业「${topMajor.major}」：预警 ${topMajor.warned} 人、高风险 ${topMajor.high || 0} 人。`
          : '各专业预警较分散，可维持常规学业辅导节奏。',
        tone: topMajor && topMajor.warnRate >= 20 ? 'warn' : 'good',
      },
    ],
    actions: [
      '对预警率最高年级召开学业专题会，明确辅导员与班主任双周跟进',
      '针对高风险专业开设补考/重修辅导清单',
      '把高风险学生纳入学院学业帮扶台账（仅院内流转，不对外点名）',
    ],
    sessionId,
    traceId: `rule-${sessionId}`,
    source: 'rule',
  }
}
