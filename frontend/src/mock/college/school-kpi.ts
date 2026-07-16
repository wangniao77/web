export type SchoolKpiStatus = 'completed' | 'in-progress' | 'attention'

export interface SchoolKpiItem {
  id: string
  label: string
  target: string
  actual: string
  unit: string
  status: SchoolKpiStatus
}

export const mockSchoolKpis: SchoolKpiItem[] = [
  { id: 'paper', label: '论文发表', target: '15', actual: '15', unit: '篇', status: 'completed' },
  { id: 'vertical', label: '纵向经费', target: '800', actual: '860', unit: '万', status: 'completed' },
  { id: 'employment', label: '本科就业率', target: '85', actual: '79.2', unit: '%', status: 'attention' },
  { id: 'major-project', label: '三大项目', target: '3', actual: '2', unit: '项', status: 'in-progress' },
  { id: 'horizontal', label: '横向经费', target: '400', actual: '420', unit: '万', status: 'completed' },
  { id: 'further', label: '升学率', target: '20', actual: '18.6', unit: '%', status: 'in-progress' },
]

export interface EntranceScoreItem {
  major: string
  avgScore: number
  firstChoiceRate: number
}

export const mockEntranceScores: EntranceScoreItem[] = [
  { major: '计算机科学与技术', avgScore: 582, firstChoiceRate: 96.2 },
  { major: '软件工程', avgScore: 576, firstChoiceRate: 94.8 },
  { major: '人工智能', avgScore: 571, firstChoiceRate: 92.5 },
  { major: '大数据管理与应用', avgScore: 565, firstChoiceRate: 89.3 },
  { major: '金融科技', avgScore: 558, firstChoiceRate: 86.7 },
]
