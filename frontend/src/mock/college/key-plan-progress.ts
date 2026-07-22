export type PlanProgressStatus = 'completed' | 'ongoing' | 'attention'

/** 重点规划一级大类 */
export type PlanGroupCategory =
  | 'discipline'
  | 'faculty'
  | 'teaching'
  | 'research'
  | 'talent'
  | 'ai'
  | 'party'

export interface KeyPlanMetricItem {
  id: string
  name: string
  /** 所属一级大类 */
  category: PlanGroupCategory
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
  followUp?: Array<{ date: string; content: string }>
}

export interface KeyPlanGroup {
  id: PlanGroupCategory
  /** 分组主标题，如「学科建设」 */
  title: string
  /** 分组副标题/定位，如「学院发展根基」 */
  subtitle: string
  /** 默认是否展开 */
  defaultExpanded?: boolean
  metrics: KeyPlanMetricItem[]
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
  /** 一级大类分组（界面折叠/展开） */
  groups: KeyPlanGroup[]
  /** 扁平任务列表（由 groups 展开，便于详情/筛选复用） */
  metrics: KeyPlanMetricItem[]
}

export const PLAN_GROUP_LABELS: Record<PlanGroupCategory, string> = {
  discipline: '学科建设',
  faculty: '师资队伍建设',
  teaching: '教学建设',
  research: '科研建设',
  talent: '人才培养',
  ai: '广财AI智教专项改革',
  party: '党建与综合办学保障',
}

const groupDiscipline: KeyPlanGroup = {
  id: 'discipline',
  title: '学科建设',
  subtitle: '学院发展根基',
  defaultExpanded: true,
  metrics: [
    {
      id: 'd1',
      name: '博士点申报与获批',
      category: 'discipline',
      taskType: '学位点建设',
      projectLevel: '国家级',
      majorDirection: '学科建设',
      target: '1',
      actual: '0',
      unit: '个',
      progress: 62,
      status: 'ongoing',
      owner: '学科办·张衡',
      deadline: '2025-12-31',
      milestone: '论证材料三轮修订完成，专家预审推进中',
      materials: ['论证报告', '支撑条件清单', '预审意见汇总'],
      followUp: [
        { date: '2025-08-20', content: '学科建设专班完成论证报告三轮修订' },
        { date: '2025-10-15', content: '组织校外专家预审，形成修改清单并落实' },
      ],
    },
    {
      id: 'd2',
      name: '硕士点建设阶段性工作',
      category: 'discipline',
      taskType: '学位点建设',
      projectLevel: '校级',
      majorDirection: '学科建设',
      target: '2',
      actual: '1',
      unit: '项',
      progress: 75,
      status: 'ongoing',
      owner: '研究生办·刘畅',
      deadline: '2025-11-30',
      milestone: '培养方案修订已完成，师资与课程对照表待终审',
      materials: ['培养方案', '课程对照表'],
    },
  ],
}

const groupFaculty: KeyPlanGroup = {
  id: 'faculty',
  title: '师资队伍建设',
  subtitle: '学院发展命脉',
  defaultExpanded: true,
  metrics: [
    {
      id: 'f1',
      name: '高层次人才引育',
      category: 'faculty',
      taskType: '人才引育',
      projectLevel: '校级及以上',
      majorDirection: '师资建设',
      target: '4',
      actual: '2',
      unit: '人',
      progress: 50,
      status: 'ongoing',
      owner: '人事办·陈远',
      deadline: '2025-12-31',
      milestone: '已签约 2 人，另 2 人进入谈引阶段',
      materials: ['引进计划', '谈引纪要'],
    },
    {
      id: 'f2',
      name: '青年教师成长',
      category: 'faculty',
      taskType: '教师发展',
      projectLevel: '院级',
      majorDirection: '师资建设',
      target: '12',
      actual: '9',
      unit: '人',
      progress: 75,
      status: 'ongoing',
      owner: '教师发展中心·唐可',
      deadline: '2025-12-15',
      milestone: '导师结对与阶段性考核完成 9/12',
      materials: ['结对名单', '阶段考核表'],
    },
    {
      id: 'f3',
      name: '教学科研团队建设',
      category: 'faculty',
      taskType: '团队建设',
      projectLevel: '院级',
      majorDirection: '师资建设',
      target: '5',
      actual: '4',
      unit: '个',
      progress: 80,
      status: 'ongoing',
      owner: '科研办·周明',
      deadline: '2025-12-31',
      milestone: '4 个团队完成组建与年度目标分解',
      materials: ['团队组建方案', '年度任务书'],
    },
    {
      id: 'f4',
      name: '教师能力体系提升',
      category: 'faculty',
      taskType: '能力提升',
      projectLevel: '院级',
      majorDirection: '师资建设',
      target: '8',
      actual: '8',
      unit: '场',
      progress: 100,
      status: 'completed',
      owner: '教学办·苏青',
      deadline: '2025-10-31',
      milestone: '教学能力工作坊与科研方法培训全部办结',
      materials: ['培训纪要', '签到与反馈'],
    },
    {
      id: 'f5',
      name: '职称晋升与发展支撑',
      category: 'faculty',
      taskType: '职称发展',
      projectLevel: '校级',
      majorDirection: '师资建设',
      target: '6',
      actual: '3',
      unit: '人',
      progress: 50,
      status: 'ongoing',
      owner: '人事办·何予',
      deadline: '2025-11-30',
      milestone: '材料预审完成，校评委会待排期',
      materials: ['申报材料包', '预审意见'],
    },
    {
      id: 'f6',
      name: '双师型（企业）师资建设',
      category: 'faculty',
      taskType: '双师建设',
      projectLevel: '院级',
      majorDirection: '产教融合',
      target: '10',
      actual: '4',
      unit: '人',
      progress: 40,
      status: 'attention',
      owner: '产学研办·赵航',
      deadline: '2025-12-15',
      milestone: '企业兼职教师聘任进度偏慢',
      materials: ['企业师资库', '聘任协议草稿'],
      riskReason: '合作企业排期冲突，兼职教师到岗与认定滞后',
      handleStatus: '已增开两家意向企业洽谈',
      followUp: [
        { date: '2025-09-10', content: '成立产教融合专班，约谈 2 家意向企业' },
        { date: '2025-10-20', content: '与腾讯云达成兼职教师聘任意向，待签约' },
        { date: '2025-11-15', content: '补充 1 家本地企业资源，缓解到岗滞后' },
      ],
    },
    {
      id: 'f7',
      name: '师资考核与激励机制优化',
      category: 'faculty',
      taskType: '考核激励',
      projectLevel: '院级',
      majorDirection: '师资建设',
      target: '1',
      actual: '1',
      unit: '套',
      progress: 100,
      status: 'completed',
      owner: '院办·林晚',
      deadline: '2025-06-30',
      milestone: '新考核办法与激励细则已发布试行',
      materials: ['考核办法', '激励细则'],
    },
  ],
}

const groupTeaching: KeyPlanGroup = {
  id: 'teaching',
  title: '教学建设',
  subtitle: '学院发展支撑',
  defaultExpanded: false,
  metrics: [
    {
      id: 't1',
      name: '实习实践与学科竞赛',
      category: 'teaching',
      taskType: '实习实践',
      projectLevel: '院级',
      majorDirection: '产教融合',
      target: '120',
      actual: '86',
      unit: '项',
      progress: 72,
      status: 'ongoing',
      owner: '学工办·吴桐',
      deadline: '2025-12-20',
      milestone: '学科竞赛获奖 86 项，新增校企实习基地 4 个',
      materials: ['竞赛获奖清单', '实习基地协议'],
    },
    {
      id: 't2',
      name: '教学资源与教材建设',
      category: 'teaching',
      taskType: '资源教材',
      projectLevel: '校级',
      majorDirection: '教学资源',
      target: '15',
      actual: '9',
      unit: '部',
      progress: 60,
      status: 'ongoing',
      owner: '教学办·沈砚',
      deadline: '2025-12-31',
      milestone: '规划教材立项 9/15，数字化教学资源库建设中',
      materials: ['教材立项表', '资源库目录'],
    },
    {
      id: 't3',
      name: '教学改革与成果培育',
      category: 'teaching',
      taskType: '教改成果',
      projectLevel: '省级',
      majorDirection: '教学改革',
      target: '6',
      actual: '3',
      unit: '项',
      progress: 50,
      status: 'attention',
      owner: '教研办·程朗',
      deadline: '2025-11-30',
      milestone: '教改项目结题 3 项，教学成果奖培育待加强',
      materials: ['教改结题报告'],
      riskReason: '教学成果奖培育进度滞后，高水平奖项储备不足',
      handleStatus: '已组建成果凝练专班，对接往届获奖团队',
      followUp: [
        { date: '2025-09-05', content: '组建教学成果凝练专班，梳理近三年获奖' },
        { date: '2025-10-18', content: '对接上届省级教学成果奖团队，启动培育' },
        { date: '2025-11-12', content: '确定 2 项重点培育成果，责任到人' },
      ],
    },
    {
      id: 't4',
      name: '一流课程与思政课程',
      category: 'teaching',
      taskType: '课程建设',
      projectLevel: '国家级',
      majorDirection: '课程建设',
      target: '10',
      actual: '10',
      unit: '门',
      progress: 100,
      status: 'completed',
      owner: '教学办·苏青',
      deadline: '2025-10-31',
      milestone: '国家级/省级一流课程与课程思政示范课全部立项',
      materials: ['一流课程名单', '思政课程清单'],
    },
  ],
}

const groupResearch: KeyPlanGroup = {
  id: 'research',
  title: '科研建设',
  subtitle: '学院发展载体',
  defaultExpanded: false,
  metrics: [
    {
      id: 'r1',
      name: '国家级科研项目立项',
      category: 'research',
      taskType: '科研项目',
      projectLevel: '国家级',
      majorDirection: '科研立项',
      target: '26',
      actual: '18',
      unit: '项',
      progress: 69,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: '新增国家级项目 18 项，在报项目陆续进入评审',
      materials: ['项目合同'],
      followUp: [
        { date: '2025-09-01', content: '科研专项专班梳理国家级项目储备库' },
        { date: '2025-10-22', content: '推动在报项目进入评审环节' },
      ],
    },
    {
      id: 'r2',
      name: '省部级科研项目立项',
      category: 'research',
      taskType: '科研项目',
      projectLevel: '省部级',
      majorDirection: '科研立项',
      target: '121',
      actual: '96',
      unit: '项',
      progress: 79,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: '新增省部级项目 96 项，储备库持续扩充',
      materials: ['立项通知'],
    },
    {
      id: 'r3',
      name: 'C类以上科研论文',
      category: 'research',
      taskType: '科研成果',
      projectLevel: '国家级',
      majorDirection: '科研产出',
      target: '120',
      actual: '82',
      unit: '篇',
      progress: 68,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: 'C类以上论文 82 篇，含 SCI 一区 52 篇',
      materials: ['论文清单'],
    },
    {
      id: 'r4',
      name: '中文C类以上科研论文',
      category: 'research',
      taskType: '科研成果',
      projectLevel: '省部级',
      majorDirection: '科研产出',
      target: '33',
      actual: '21',
      unit: '篇',
      progress: 64,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: '中文权威论文 21 篇，含《中国科学》高水平论文',
      materials: ['论文清单'],
    },
    {
      id: 'r5',
      name: '智库与决策咨询报告',
      category: 'research',
      taskType: '决策咨询',
      projectLevel: '省部级',
      majorDirection: '决策咨询',
      target: '12',
      actual: '7',
      unit: '篇',
      progress: 58,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: '决策咨询报告 7 篇，2 篇获省级部门采纳',
      materials: ['采纳证明'],
    },
    {
      id: 'r6',
      name: '横向课题到账经费',
      category: 'research',
      taskType: '科研经费',
      projectLevel: '国家级',
      majorDirection: '科研经费',
      target: '2000',
      actual: '1280',
      unit: '万元',
      progress: 64,
      status: 'ongoing',
      owner: '科研办·罗衡',
      deadline: '2025-12-31',
      milestone: '横向到账 1280 万元，企业合作持续拓展',
      materials: ['到账凭证'],
    },
  ],
}

const groupTalent: KeyPlanGroup = {
  id: 'talent',
  title: '人才培养',
  subtitle: '学院建设使命',
  defaultExpanded: false,
  metrics: [
    {
      id: 'tl1',
      name: '拔尖创新人才培养',
      category: 'talent',
      taskType: '培养模式',
      projectLevel: '校级',
      majorDirection: '拔尖培养',
      target: '300',
      actual: '186',
      unit: '人',
      progress: 62,
      status: 'ongoing',
      owner: '教务办·韩雪',
      deadline: '2025-12-20',
      milestone: '实验班招生 186 人，校企联合培养落地',
      materials: ['培养方案'],
    },
    {
      id: 'tl2',
      name: '学位点与专业建设',
      category: 'talent',
      taskType: '专业建设',
      projectLevel: '省部级',
      majorDirection: '学科专业',
      target: '5',
      actual: '3',
      unit: '个',
      progress: 60,
      status: 'ongoing',
      owner: '教务办·韩雪',
      deadline: '2025-12-31',
      milestone: '新增专业学位点 1 个，专业评估通过 2 个',
      materials: ['专业评估表'],
    },
    {
      id: 'tl3',
      name: '学生双创与就业质量',
      category: 'talent',
      taskType: '就业创业',
      projectLevel: '院级',
      majorDirection: '就业质量',
      target: '95',
      actual: '91',
      unit: '%',
      progress: 96,
      status: 'completed',
      owner: '学工办·吴桐',
      deadline: '2025-11-30',
      milestone: '毕业去向落实率 91%，超目标进度',
      materials: ['就业质量报告'],
    },
  ],
}

const groupAi: KeyPlanGroup = {
  id: 'ai',
  title: '广财AI智教专项改革',
  subtitle: '学院数字化攻坚任务',
  defaultExpanded: false,
  metrics: [
    {
      id: 'a1',
      name: 'AI 课程与智能助教',
      category: 'ai',
      taskType: 'AI课程',
      projectLevel: '校级',
      majorDirection: '智能教学',
      target: '20',
      actual: '12',
      unit: '门',
      progress: 60,
      status: 'ongoing',
      owner: '教学办·苏青',
      deadline: '2025-12-31',
      milestone: 'AI 赋能课程 12 门上线，智能助教覆盖 8 个专业',
      materials: ['AI课程清单'],
    },
    {
      id: 'a2',
      name: '教学数据中台建设',
      category: 'ai',
      taskType: '数据平台',
      projectLevel: '校级',
      majorDirection: '数字基建',
      target: '1',
      actual: '1',
      unit: '套',
      progress: 100,
      status: 'completed',
      owner: '信息中心·江岚',
      deadline: '2025-10-31',
      milestone: '教学数据中台一期建成并投入使用',
      materials: ['平台验收单'],
    },
    {
      id: 'a3',
      name: '教师AI教学能力培训',
      category: 'ai',
      taskType: '师资培训',
      projectLevel: '院级',
      majorDirection: '数字素养',
      target: '120',
      actual: '74',
      unit: '人',
      progress: 62,
      status: 'ongoing',
      owner: '教师发展中心·柳青',
      deadline: '2025-12-15',
      milestone: '完成 AI 教学培训 74 人次',
      materials: ['培训签到表'],
      followUp: [
        { date: '2025-09-12', content: 'AI 教学能力专班制定培训计划' },
        { date: '2025-10-30', content: '完成首期 40 人次培训，满意度 92%' },
      ],
    },
  ],
}

const groupParty: KeyPlanGroup = {
  id: 'party',
  title: '党建与综合办学保障',
  subtitle: '学院发展保障',
  defaultExpanded: false,
  metrics: [
    {
      id: 'p1',
      name: '党建品牌与组织建设',
      category: 'party',
      taskType: '党建',
      projectLevel: '院级',
      majorDirection: '党建引领',
      target: '10',
      actual: '7',
      unit: '项',
      progress: 70,
      status: 'ongoing',
      owner: '党办·钟毓',
      deadline: '2025-12-20',
      milestone: '党建品牌项目推进 7 项，样板支部建设稳步推进',
      materials: ['党建台账'],
    },
    {
      id: 'p2',
      name: '综合办学条件保障',
      category: 'party',
      taskType: '后勤保障',
      projectLevel: '院级',
      majorDirection: '办学保障',
      target: '15',
      actual: '11',
      unit: '项',
      progress: 73,
      status: 'ongoing',
      owner: '院办·古岩',
      deadline: '2025-12-31',
      milestone: '办学条件改善项目完成 11 项',
      materials: ['保障清单'],
    },
    {
      id: 'p3',
      name: '安全稳定与内部控制',
      category: 'party',
      taskType: '内控安全',
      projectLevel: '院级',
      majorDirection: '内控安全',
      target: '100',
      actual: '100',
      unit: '%',
      progress: 100,
      status: 'completed',
      owner: '院办·古岩',
      deadline: '2025-11-30',
      milestone: '安全内控年度核查全部通过',
      materials: ['内控报告'],
    },
  ],
}

const groups: KeyPlanGroup[] = [
  groupDiscipline,
  groupFaculty,
  groupTeaching,
  groupResearch,
  groupTalent,
  groupAi,
  groupParty,
]
const metrics = groups.flatMap((g) => g.metrics)

const completed = metrics.filter((m) => m.status === 'completed').length
const attention = metrics.filter((m) => m.status === 'attention').length
const ongoing = metrics.filter((m) => m.status === 'ongoing').length

export const mockKeyPlanProgress: KeyPlanProgressData = {
  year: '2025',
  overview: {
    total: metrics.length,
    completed,
    ongoing,
    attention,
    completionRate: Math.round(
      metrics.reduce((sum, m) => sum + m.progress, 0) / Math.max(metrics.length, 1),
    ),
  },
  groups,
  metrics,
}

export function groupMetrics(
  category: PlanGroupCategory,
  data: KeyPlanProgressData = mockKeyPlanProgress,
) {
  return data.metrics.filter((m) => m.category === category)
}

/** @deprecated 使用 groupMetrics('discipline') */
export function researchMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return groupMetrics('discipline', data)
}

/** @deprecated 使用 groupMetrics('faculty') */
export function teachingMetrics(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return groupMetrics('faculty', data)
}

export function attentionRisks(data: KeyPlanProgressData = mockKeyPlanProgress) {
  return data.metrics.filter((m) => m.status === 'attention')
}

export function groupSummary(group: KeyPlanGroup) {
  const total = group.metrics.length
  const completedCount = group.metrics.filter((m) => m.status === 'completed').length
  const attentionCount = group.metrics.filter((m) => m.status === 'attention').length
  const avgProgress = total
    ? Math.round(group.metrics.reduce((s, m) => s + m.progress, 0) / total)
    : 0
  return { total, completedCount, attentionCount, avgProgress }
}
