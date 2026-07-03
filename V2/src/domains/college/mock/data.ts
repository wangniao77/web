import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
} from '@/domains/college/types/api'

export const mockOverviewHub: OverviewHubDTO = {
  developmentIndex: 87.6,
  maxScore: 100,
  starLevel: 5,
  kpis: [
    { key: 'students', label: '在校生总数', value: 5680, unit: '人', trend: { direction: 'up', value: 3.2, unit: '%' } },
    { key: 'faculty', label: '教职工数', value: 268, unit: '人', trend: { direction: 'up', value: 1.5, unit: '%' } },
    { key: 'funding', label: '生均经费', value: 3.286, unit: '万元', trend: { direction: 'up', value: 8.6, unit: '%' } },
    { key: 'ranking', label: '学科排名', value: '3/18', trend: { direction: 'up', value: 1 } },
    { key: 'satisfaction', label: '学生满意度', value: 92.3, unit: '%', trend: { direction: 'up', value: 2.1, unit: '%' } },
    { key: 'influence', label: '社会影响力', value: '优秀', trend: { direction: 'flat', value: 0 } },
  ],
}

export const mockKeyTasks: KeyTaskDTO[] = [
  { id: '1', name: '高水平学科建设', progress: 85, status: 'ongoing' },
  { id: '2', name: '国家级一流专业建设', progress: 92, status: 'ongoing' },
  { id: '3', name: '博士点申报筹备', progress: 68, status: 'ongoing' },
  { id: '4', name: '产教融合示范基地', progress: 95, status: 'completed' },
  { id: '5', name: '国际交流合作拓展', progress: 78, status: 'ongoing' },
  { id: '6', name: '智慧教学平台升级', progress: 88, status: 'ongoing' },
]

export const mockStudentOverview: StudentOverviewDTO = {
  metrics: [
    { key: 'satisfaction', label: '满意度', value: 92.3, unit: '%', trend: { direction: 'up', value: 2.1, unit: '%' } },
    { key: 'further', label: '升学率', value: 18.6, unit: '%', trend: { direction: 'up', value: 1.2, unit: '%' } },
    { key: 'awards', label: '获奖数', value: 156, unit: '项', trend: { direction: 'up', value: 12 } },
    { key: 'employment', label: '就业率', value: 96.8, unit: '%', trend: { direction: 'up', value: 0.5, unit: '%' } },
  ],
  employmentDirection: [
    { name: '签约就业', value: 72 },
    { name: '升学深造', value: 18 },
    { name: '灵活就业', value: 6 },
    { name: '其他', value: 4 },
  ],
  qualityDevelopment: [
    { name: '思想政治', value: 92 },
    { name: '创新创业', value: 85 },
    { name: '志愿服务', value: 78 },
    { name: '文体活动', value: 88 },
    { name: '社会实践', value: 82 },
  ],
  warnings: { academic: 23, fundingRate: 8.5 },
}

export const mockTeachingOverview: TeachingOverviewDTO = {
  metrics: [
    { label: '开课总数', value: 186, unit: '门' },
    { label: '开班次数', value: 342, unit: '次' },
    { label: '评教率', value: 98.2, unit: '%' },
    { label: '教学事故', value: 0, unit: '起' },
  ],
  evaluationTrend: {
    years: ['2021', '2022', '2023', '2024', '2025'],
    values: [88.2, 89.5, 90.8, 91.6, 92.3],
  },
  courseConstruction: [
    { name: '国家级', value: 3 },
    { name: '省级', value: 8 },
    { name: '校级', value: 15 },
    { name: '教材', value: 12 },
    { name: '在线课程', value: 22 },
  ],
}

export const mockResearchOverview: ResearchOverviewDTO = {
  metrics: [
    { label: '科研项目', value: 86, unit: '项', trend: { direction: 'up', value: 12 } },
    { label: '科研经费', value: 2860, unit: '万', trend: { direction: 'up', value: 18.5, unit: '%' } },
    { label: '论文发表', value: 128, unit: '篇', trend: { direction: 'up', value: 8 } },
    { label: '专利授权', value: 32, unit: '项', trend: { direction: 'up', value: 5 } },
    { label: '成果转化', value: 8, unit: '项', trend: { direction: 'up', value: 2 } },
  ],
  fundingTrend: {
    years: ['2021', '2022', '2023', '2024', '2025'],
    series: [
      { name: '纵向经费', data: [420, 520, 680, 820, 960] },
      { name: '横向经费', data: [380, 450, 520, 680, 780] },
    ],
  },
  platforms: [
    { name: '省部级平台', count: 5 },
    { name: '校级平台', count: 8 },
    { name: '创新团队', count: 6 },
    { name: '产学研基地', count: 12 },
  ],
}

export const mockWarningOverview: WarningOverviewDTO = {
  categories: [
    { type: 'academic', label: '学业预警', count: 23, momChange: 2 },
    { type: 'psychological', label: '心理预警', count: 8, momChange: -1 },
    { type: 'employment', label: '就业预警', count: 15, momChange: 3 },
    { type: 'funding', label: '资助预警', count: 12, momChange: 0 },
  ],
  trend: {
    months: ['12月', '1月', '2月', '3月', '4月', '5月'],
    series: [
      { name: '学业', data: [18, 20, 19, 21, 22, 23] },
      { name: '心理', data: [6, 7, 8, 7, 9, 8] },
      { name: '就业', data: [10, 11, 12, 13, 14, 15] },
      { name: '资助', data: [11, 12, 11, 12, 12, 12] },
    ],
  },
}
