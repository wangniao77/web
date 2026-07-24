import type { EmploymentAnalysisReportDTO } from '@/types/college/api/employment-analysis'

/** 前端 Mock / Agent 降级用规则报告 */
export function mockEmploymentAnalysisReport(year = '2026'): EmploymentAnalysisReportDTO {
  return {
    generatedAt: new Date().toISOString(),
    source: 'mock',
    dataFingerprint: `mock|${year}`,
    filters: { year, major: null },
    headline: `${year}届出口质量整体较好，重点转向结构优化与专业均衡。`,
    insights: [
      {
        title: `${year}届落实率处于高位`,
        detail: `本届样本充足，毕业去向落实率与高质量率可支撑院级研判；待就业仍需分类帮扶。`,
        tone: 'good',
        evidence: [
          { source: 'db', label: `${year}届落实率`, value: '94.1%', ref: 'graduation.exitQuality.placementRate' },
          { source: 'db', label: `${year}届高质量率`, value: '29.2%', ref: 'graduation.exitQuality.highQualityEmploymentRate' },
        ],
      },
      {
        title: '专业高质量去向差距明显',
        detail: '部分专业高质量率领先，垫底专业落差超过 8 个百分点，宜开展针对性就业辅导。',
        tone: 'warn',
        evidence: [
          { source: 'db', label: '专业高质量落差', value: '≥8个百分点', ref: 'graduation.majorCompare' },
        ],
      },
      {
        title: '「其他就业」占比偏高，结构仍可细化',
        detail: '桑基中其他就业桶较大，建议按单位类型/行业继续拆解。',
        tone: 'warn',
        evidence: [
          { source: 'db', label: '其他就业占比', value: '偏高', ref: 'snapshot.otherEmploymentRate' },
        ],
      },
    ],
    actions: [
      '对高质量率偏低专业开展一对一就业摸排',
      '拆解「其他就业」桶：按单位类型/行业回填',
      '将待就业名单纳入周报，明确辅导员跟进节点',
    ],
    sections: [
      {
        title: '出口质量',
        bullets: ['落实率 94.1% · 高质量率 29.2%', '待就业需分类帮扶'],
      },
      {
        title: '专业差距',
        bullets: ['高质量率专业落差可观', '建议按专业制定辅导清单'],
      },
    ],
  }
}

export function mockEmploymentAnalysisReportResponse(
  year = '2026',
): import('@/types/college/api/employment-analysis').EmploymentAnalysisReportResponseDTO {
  const report = mockEmploymentAnalysisReport(year)
  return {
    report,
    stale: false,
    dataFingerprint: report.dataFingerprint || '',
    filters: report.filters,
  }
}
