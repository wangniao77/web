import type {
  KeyTaskDTO,
  OverviewHubDTO,
  ResearchOverviewDTO,
  StudentOverviewDTO,
  TeachingOverviewDTO,
  WarningOverviewDTO,
} from '@/types/college/api'

export const mockOverviewHub: OverviewHubDTO = {
  developmentIndex: 87.6,
  maxScore: 100,
  starLevel: 5,
  kpis: [
    { key: 'teachers', label: '教师人数', value: 186, unit: '人', trend: { direction: 'up', value: 3.2, unit: '%' } },
    { key: 'studentRatio', label: '生师比', value: '18.2:1', trend: { direction: 'down', value: 0.6 } },
    { key: 'courses', label: '本学期课程门数', value: 186, unit: '门', trend: { direction: 'up', value: 8 } },
    { key: 'topPapers', label: '近五年顶刊论文', value: 48, unit: '篇', trend: { direction: 'up', value: 12 } },
    { key: 'projects', label: '项目', value: 126, unit: '项', trend: { direction: 'up', value: 9.4, unit: '%' } },
    { key: 'patents', label: '专利', value: 64, unit: '项', trend: { direction: 'up', value: 7 } },
    { key: 'platforms', label: '省级平台', value: 8, unit: '个', trend: { direction: 'up', value: 2 } },
    { key: 'teams', label: '团队', value: 15, unit: '个', trend: { direction: 'up', value: 3 } },
  ],
}

export const mockKeyTasks: KeyTaskDTO[] = [
  { id: '1', name: '双一流建设', progress: 92, status: 'ongoing' },
  { id: '2', name: '专业认证', progress: 78, status: 'ongoing' },
  { id: '3', name: '师资队伍建设', progress: 65, status: 'ongoing' },
  { id: '4', name: '科研平台建设', progress: 58, status: 'ongoing' },
  { id: '5', name: '学科竞赛组织', progress: 85, status: 'ongoing' },
  { id: '6', name: '学生工作重点项目', progress: 45, status: 'delayed' },
  { id: '7', name: '就业率提升工程', progress: 88, status: 'ongoing' },
  { id: '8', name: '就业攻坚任务', progress: 100, status: 'completed' },
]

export const mockStudentOverview: StudentOverviewDTO = {
  metrics: [
    { key: 'satisfaction', label: '学生就业满意度', value: 94.6, unit: '%', trend: { direction: 'up', value: 2.1, unit: '%' } },
    { key: 'employment', label: '就业率', value: 79.2, unit: '%', trend: { direction: 'up', value: 0.5, unit: '%' } },
    { key: 'further', label: '升学率', value: 18.6, unit: '%', trend: { direction: 'up', value: 1.2, unit: '%' } },
    { key: 'awards', label: '获奖数', value: 156, unit: '项', trend: { direction: 'up', value: 12 } },
  ],
  employmentDirection: [
    { name: '升学深造', value: 28 },
    { name: '企业就业', value: 52 },
    { name: '公务员', value: 8 },
    { name: '自主创业', value: 6 },
    { name: '其他', value: 6 },
  ],
  employmentRegions: [
    { name: '广州', value: 42 },
    { name: '深圳', value: 23 },
    { name: '珠三角其他', value: 15 },
    { name: '北京/上海', value: 9 },
    { name: '省外其他', value: 7 },
    { name: '境外', value: 4 },
  ],
  qualityDevelopment: [
    { name: '思想政治', value: 92 },
    { name: '学业发展', value: 86 },
    { name: '创新创业', value: 78 },
    { name: '文体活动', value: 84 },
    { name: '社会实践', value: 76 },
  ],
  warnings: { academic: 23, fundingRate: 8.5 },
}

export const mockTeachingOverview: TeachingOverviewDTO = {
  metrics: [
    { label: '开课门数', value: 186, unit: '门' },
    { label: '优质课程', value: 42, unit: '门' },
    { label: '实践教学', value: 88.6, unit: '%' },
  ],
  evaluationTrend: {
    years: ['2021', '2022', '2023', '2024', '2025'],
    values: [88.2, 89.5, 90.8, 91.6, 92.3],
  },
  courseConstruction: [
    { name: '国家级一流', value: 4 },
    { name: '省级一流', value: 12 },
    { name: '校级精品', value: 26 },
    { name: '在线课程', value: 18 },
    { name: '实践基地', value: 14 },
  ],
}

export const mockResearchOverview: ResearchOverviewDTO = {
  metrics: [
    { label: '纵向经费', value: 860, unit: '万', trend: { direction: 'up', value: 12, unit: '%' } },
    { label: '横向经费', value: 420, unit: '万', trend: { direction: 'up', value: 8, unit: '%' } },
    { label: '论文发表', value: 186, unit: '篇', trend: { direction: 'up', value: 15, unit: '%' } },
    { label: '专利授权', value: 42, unit: '项', trend: { direction: 'up', value: 6, unit: '%' } },
  ],
  fundingTrend: {
    years: ['2021', '2022', '2023', '2024', '2025'],
    series: [
      { name: '纵向经费', data: [420, 520, 680, 820, 960] },
      { name: '横向经费', data: [380, 450, 520, 680, 780] },
    ],
  },
  platforms: [
    { name: '省级及以上平台', count: 5 },
    { name: '校级科研团队', count: 12 },
    { name: '产学研基地', count: 8 },
    { name: '创新实验室', count: 6 },
  ],
}

export const mockWarningOverview: WarningOverviewDTO = {
  categories: [
    { type: 'academic', label: '学业预警', count: 32, momChange: 6 },
    { type: 'psychological', label: '心理预警', count: 18, momChange: 2 },
    { type: 'employment', label: '就业预警', count: 24, momChange: -3 },
    { type: 'credit', label: '第二课堂学分预警', count: 46, momChange: 5 },
  ],
  trend: {
    months: ['12月', '1月', '2月', '3月', '4月', '5月'],
    series: [
      { name: '心理', data: [22, 21, 20, 19, 18, 17] },
      { name: '就业', data: [28, 27, 26, 25, 24, 22] },
    ],
  },
  creditCompletion: {
    threshold: 60,
    categories: ['思想引领', '创新创业', '志愿公益', '实践实习', '文体艺术', '技能培训', '菁英成长'],
    junior: [93, 46, 84, 77, 70, 44, 32],
    senior: [96, 55, 79, 88, 60, 48, 35],
  },
}
