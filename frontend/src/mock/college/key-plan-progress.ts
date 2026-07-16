export type PlanProgressStatus = 'completed' | 'ongoing' | 'attention'

export interface KeyPlanMetricItem {
  id: string
  name: string
  category: 'research' | 'teaching'
  taskType: string
  projectLevel: string
  majorDirection: string
  target: string
  actual: string
  unit: string
  progress: number
  status: PlanProgressStatus
  owner: string
  deadline: string
  milestone: string
  materials: string[]
  riskReason?: string
  handleStatus?: string
}

export interface KeyPlanProgressData {
  year: string
  overview: {
    total: number
    completed: number
    ongoing: number
    attention: number
    completionRate: number
  }
  metrics: KeyPlanMetricItem[]
}

export const mockKeyPlanProgress: KeyPlanProgressData = {
  year: '2025',
  overview: {
    total: 11,
    completed: 3,
    ongoing: 6,
    attention: 2,
    completionRate: 68,
  },
  metrics: [
    {
      id: 'r1',
      name: '国家两金项目',
      category: 'research',
      taskType: '纵向科研',
      projectLevel: '国家级',
      majorDirection: '智能科学',
      target: '2',
      actual: '1',
      unit: '项',
      progress: 50,
      status: 'ongoing',
      owner: '科研办·周明',
      deadline: '2025-12-31',
      milestone: '国自然面上已立项 1 项，重点在审',
      materials: ['立项通知书', '研究方案'],
    },
    {
      id: 'r2',
      name: '教育部项目',
      category: 'research',
      taskType: '纵向科研',
      projectLevel: '部级',
      majorDirection: '交叉学科',
      target: '3',
      actual: '2',
      unit: '项',
      progress: 67,
      status: 'ongoing',
      owner: '科研办·陈岚',
      deadline: '2025-11-30',
      milestone: '人文社科项目推进中期检查',
      materials: ['中期报告'],
    },
    {
      id: 'r3',
      name: '省级项目',
      category: 'research',
      taskType: '纵向科研',
      projectLevel: '省级',
      majorDirection: '金融科技',
      target: '8',
      actual: '7',
      unit: '项',
      progress: 88,
      status: 'ongoing',
      owner: '科研办·李希',
      deadline: '2025-12-15',
      milestone: '待结题 1 项材料复核',
      materials: ['结题材料清单'],
    },
    {
      id: 'r4',
      name: 'C类以上学术论文',
      category: 'research',
      taskType: '科研成果',
      projectLevel: '期刊',
      majorDirection: '全院',
      target: '36',
      actual: '28',
      unit: '篇',
      progress: 78,
      status: 'ongoing',
      owner: '科研办·王沁',
      deadline: '2025-12-31',
      milestone: '已录用 6 篇待见刊',
      materials: ['录用函汇总'],
    },
    {
      id: 'r5',
      name: '横向项目到账经费',
      category: 'research',
      taskType: '横向科研',
      projectLevel: '横向',
      majorDirection: '产学研',
      target: '400',
      actual: '420',
      unit: '万',
      progress: 100,
      status: 'completed',
      owner: '科研办·赵航',
      deadline: '2025-12-31',
      milestone: '年度到账目标已达成',
      materials: ['到账凭证', '合同台账'],
    },
    {
      id: 'r6',
      name: '决策咨询报告',
      category: 'research',
      taskType: '智库服务',
      projectLevel: '省级及以上',
      majorDirection: '政策研究',
      target: '6',
      actual: '3',
      unit: '篇',
      progress: 50,
      status: 'attention',
      owner: '智库中心·许然',
      deadline: '2025-10-31',
      milestone: '2 篇待省级采纳反馈',
      materials: ['报送回执'],
      riskReason: '采纳周期拉长，距截止不足两个月',
      handleStatus: '加急推进中',
    },
    {
      id: 'r7',
      name: '知识产权',
      category: 'research',
      taskType: '知识产权',
      projectLevel: '专利/软著',
      majorDirection: '全院',
      target: '18',
      actual: '14',
      unit: '项',
      progress: 78,
      status: 'ongoing',
      owner: '科研办·韩雨',
      deadline: '2025-12-31',
      milestone: '4 项进入实审',
      materials: ['受理通知书'],
    },
    {
      id: 't1',
      name: '教学成果奖',
      category: 'teaching',
      taskType: '教学获奖',
      projectLevel: '省级及以上',
      majorDirection: '教育教学',
      target: '2',
      actual: '1',
      unit: '项',
      progress: 50,
      status: 'ongoing',
      owner: '教学办·苏青',
      deadline: '2025-09-30',
      milestone: '校级推荐完成，省级在评',
      materials: ['推荐材料包'],
    },
    {
      id: 't2',
      name: '省级教研教改项目',
      category: 'teaching',
      taskType: '教改项目',
      projectLevel: '省级',
      majorDirection: '课程建设',
      target: '5',
      actual: '5',
      unit: '项',
      progress: 100,
      status: 'completed',
      owner: '教学办·林晚',
      deadline: '2025-06-30',
      milestone: '全部立项并开题',
      materials: ['立项文件'],
    },
    {
      id: 't3',
      name: '教学竞赛',
      category: 'teaching',
      taskType: '教学竞赛',
      projectLevel: '省级及以上',
      majorDirection: '教师发展',
      target: '6',
      actual: '2',
      unit: '项',
      progress: 33,
      status: 'attention',
      owner: '教师发展中心·唐可',
      deadline: '2025-11-15',
      milestone: '院赛选拔完成，省赛名额待定',
      materials: ['选拔结果'],
      riskReason: '参赛教师时间冲突，省赛报名滞后',
      handleStatus: '已协调课时与辅导安排',
    },
    {
      id: 't4',
      name: '教研论文',
      category: 'teaching',
      taskType: '教研成果',
      projectLevel: '核心期刊',
      majorDirection: '教育教学',
      target: '12',
      actual: '12',
      unit: '篇',
      progress: 100,
      status: 'completed',
      owner: '教学办·何予',
      deadline: '2025-12-31',
      milestone: '年度发表目标已完成',
      materials: ['发表证明'],
    },
  ],
}

export function researchMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return data.metrics.filter((m) => m.category === 'research')
}

export function teachingMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return data.metrics.filter((m) => m.category === 'teaching')
}

export function attentionRisks(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return data.metrics.filter((m) => m.status === 'attention')
}
