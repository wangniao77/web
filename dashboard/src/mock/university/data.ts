import type { UniversityOverviewDTO } from '@/types/api/university'

export const mockUniversityOverview: UniversityOverviewDTO = {
  hub: {
    developmentIndex: 82.4,
    maxScore: 100,
    kpis: [
      { label: '在校生总数', value: 28600, unit: '人', trend: { direction: 'up', value: 2.8 } },
      { label: '教职工数', value: 1680, unit: '人', trend: { direction: 'up', value: 1.2 } },
      { label: '学院数量', value: 18, unit: '个' },
      { label: '国家级专业', value: 12, unit: '个', trend: { direction: 'up', value: 2 } },
      { label: '综合满意度', value: 89.6, unit: '%', trend: { direction: 'up', value: 1.5 } },
      { label: '就业总体率', value: 95.2, unit: '%', trend: { direction: 'up', value: 0.8 } },
    ],
  },
  collegeRanking: [
    { rank: 1, collegeName: '金融学院', score: 89.2, trend: 1.2 },
    { rank: 2, collegeName: '大数据与人工智能学院', score: 87.6, trend: 2.1 },
    { rank: 3, collegeName: '会计学院', score: 86.8, trend: 0.8 },
    { rank: 4, collegeName: '经济学院', score: 85.3, trend: -0.3 },
    { rank: 5, collegeName: '法学院', score: 84.1, trend: 0.5 },
    { rank: 6, collegeName: '人文学院', score: 82.6, trend: 0.2 },
  ],
  warningSummary: [
    { label: '学业预警', count: 186 },
    { label: '心理预警', count: 52 },
    { label: '就业预警', count: 98 },
    { label: '资助预警', count: 76 },
  ],
}
