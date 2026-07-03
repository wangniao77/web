import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  NewsDetailDTO,
} from '@/domains/university/types/api/details'

export const mockKeyTasksDetail: KeyTasksDetailDTO = {
  summary: { total: 8, completed: 2, ongoing: 4, attention: 2 },
  tasks: [
    {
      id: '1',
      name: '双一流建设攻坚',
      description: '推进学科评估与平台建设，提升整体办学水平。',
      progress: 78,
      status: 'ongoing',
      leadDept: '发展规划处',
      deadline: '2026-12',
      milestones: [
        { label: '学科评估材料提交', done: true },
        { label: '平台验收', done: false },
        { label: '年度评估', done: false },
      ],
    },
    {
      id: '2',
      name: '专业认证全覆盖',
      description: '推动国家级、省级专业认证，提升专业建设质量。',
      progress: 92,
      status: 'completed',
      leadDept: '教务处',
      deadline: '2026-06',
      milestones: [
        { label: '认证方案制定', done: true },
        { label: '现场考查', done: true },
        { label: '认证结论', done: true },
      ],
    },
    {
      id: '3',
      name: '智慧校园二期建设',
      description: '升级数据中心、统一门户与移动端服务。',
      progress: 65,
      status: 'ongoing',
      leadDept: '信息中心',
      deadline: '2026-10',
      milestones: [
        { label: '需求调研', done: true },
        { label: '系统开发', done: false },
        { label: '上线运行', done: false },
      ],
    },
    {
      id: '4',
      name: '高层次人才引育',
      description: '引进领军人才，完善青年人才培育机制。',
      progress: 58,
      status: 'attention',
      leadDept: '人事处',
      deadline: '2026-08',
      milestones: [
        { label: '引才计划发布', done: true },
        { label: '首批到岗', done: false },
        { label: '考核评估', done: false },
      ],
    },
    {
      id: '5',
      name: '产教融合示范基地',
      description: '与龙头企业共建实习实训与联合培养基地。',
      progress: 85,
      status: 'ongoing',
      leadDept: '就业指导中心',
      deadline: '2026-09',
      milestones: [
        { label: '协议签署', done: true },
        { label: '基地挂牌', done: true },
        { label: '年度评估', done: false },
      ],
    },
    {
      id: '6',
      name: '国际化办学提升',
      description: '拓展海外合作院校，提升学生国际交流比例。',
      progress: 72,
      status: 'ongoing',
      leadDept: '国际交流处',
      deadline: '2026-11',
      milestones: [
        { label: '合作院校签约', done: true },
        { label: '交换项目启动', done: false },
      ],
    },
    {
      id: '7',
      name: '绿色校园达标工程',
      description: '推进节能改造与绿色校园标准达标。',
      progress: 96,
      status: 'completed',
      leadDept: '后勤处',
      deadline: '2026-05',
      milestones: [
        { label: '节能改造', done: true },
        { label: '达标验收', done: true },
      ],
    },
    {
      id: '8',
      name: '内部治理体系优化',
      description: '完善制度体系，提升决策执行与监督效能。',
      progress: 45,
      status: 'attention',
      leadDept: '党政办公室',
      deadline: '2026-12',
      milestones: [
        { label: '制度梳理', done: true },
        { label: '流程再造', done: false },
        { label: '效能评估', done: false },
      ],
    },
  ],
}

export const mockEmploymentDetail: EmploymentDetailDTO = {
  overview: [
    { label: '就业率', value: 94.2, unit: '%' },
    { label: '升学率', value: 28.6, unit: '%' },
    { label: '考研率', value: 17.3, unit: '%' },
    { label: '出国率', value: 8.9, unit: '%' },
    { label: '签约率', value: 86.5, unit: '%' },
    { label: '平均起薪', value: 7850, unit: '元' },
  ],
  trend: [
    { term: '2023-1', rate: 91.2, furtherRate: 24.1 },
    { term: '2023-2', rate: 91.8, furtherRate: 25.0 },
    { term: '2024-1', rate: 92.5, furtherRate: 26.2 },
    { term: '2024-2', rate: 93.1, furtherRate: 27.1 },
    { term: '2025-1', rate: 93.6, furtherRate: 27.8 },
    { term: '2025-2', rate: 94.2, furtherRate: 28.6 },
  ],
  distribution: [
    { name: '粤港澳大湾区', value: 62.1 },
    { name: '广东省内其他', value: 18.4 },
    { name: '省外', value: 12.3 },
    { name: '境外', value: 7.2 },
  ],
  byCollege: [
    { collegeName: '金融学院', employmentRate: 96.8, furtherRate: 32.1 },
    { collegeName: '会计学院', employmentRate: 95.6, furtherRate: 28.5 },
    { collegeName: '经济学院', employmentRate: 94.2, furtherRate: 26.8 },
    { collegeName: '大数据与人工智能学院', employmentRate: 96.1, furtherRate: 35.2 },
    { collegeName: '法学院', employmentRate: 91.5, furtherRate: 22.4 },
    { collegeName: '人文与传播学院', employmentRate: 90.8, furtherRate: 18.6 },
  ],
}

export const mockNewsDetail: NewsDetailDTO = {
  items: [
    {
      id: 'n1',
      tag: 'important',
      title: '学校召开2026年度工作部署会',
      summary: '部署年度重点任务，强调高质量发展与治理效能提升。',
      content:
        '6月20日，学校召开2026年度工作部署会。会议总结上半年工作成效，部署下半年重点任务，要求各单位围绕双一流建设、专业认证、智慧校园等重点工作，强化协同推进与督查考核。',
      date: '2026-06-20',
      source: '党委宣传部',
    },
    {
      id: 'n2',
      tag: 'headline',
      title: '我校获批3项国家级一流本科专业建设点',
      summary: '金融、会计、大数据相关专业入选国家级一流本科专业建设点。',
      content:
        '教育部公布最新国家级一流本科专业建设点名单，我校金融学、会计学、数据科学与大数据技术3个专业成功入选，标志专业建设迈上新台阶。',
      date: '2026-06-18',
      source: '教务处',
    },
    {
      id: 'n3',
      tag: 'notice',
      title: '关于2026届毕业生离校手续办理的通知',
      summary: '请各学院组织毕业生按时完成离校手续与档案转递。',
      content:
        '2026届毕业生离校手续办理时间为6月22日至7月5日。请各学院组织毕业生完成图书馆还书、宿舍退宿、费用结算等流程，确保档案按时转递。',
      date: '2026-06-15',
      source: '学生处',
    },
    {
      id: 'n4',
      tag: 'headline',
      title: '广财与多家金融机构签署战略合作协议',
      summary: '深化产教融合，共建实习就业与联合培养基地。',
      content:
        '学校与多家金融机构签署战略合作协议，将在实习就业、联合培养、科研合作等方面开展深度合作，为学生提供更多优质实践与就业机会。',
      date: '2026-06-12',
      source: '就业指导中心',
    },
    {
      id: 'n5',
      tag: 'notice',
      title: '2026年暑期校园开放与维修安排公告',
      summary: '部分教学楼将进行设施升级，请师生注意通行安排。',
      content:
        '暑期期间学校将对部分教学楼进行设施升级与维修。请师生留意封闭区域公告，合理安排通行路线。',
      date: '2026-06-08',
      source: '后勤处',
    },
    {
      id: 'n6',
      tag: 'important',
      title: '学校开展校园安全专项排查行动',
      summary: '全面排查消防、实验室与宿舍安全隐患，确保校园平稳。',
      content:
        '学校组织开展校园安全专项排查，重点检查消防、实验室危化品、宿舍用电等安全隐患，建立台账并限期整改，确保校园安全稳定。',
      date: '2026-06-05',
      source: '保卫处',
    },
    {
      id: 'n7',
      tag: 'headline',
      title: '我校学子在全国大学生数学建模竞赛中获佳绩',
      summary: '获全国一等奖2项、二等奖5项，创历史最好成绩。',
      content:
        '在刚刚结束的全国大学生数学建模竞赛中，我校学子表现优异，获全国一等奖2项、二等奖5项，创历史最好成绩，展现良好创新实践能力。',
      date: '2026-06-02',
      source: '团委',
    },
    {
      id: 'n8',
      tag: 'notice',
      title: '2026年暑假图书馆开放时间安排',
      summary: '图书馆暑期实行分区域开放，请师生提前查阅时间表。',
      content:
        '图书馆2026年暑假期间实行分区域开放，主馆周一至周五8:00-22:00开放，周末9:00-17:00开放，电子资源24小时访问。',
      date: '2026-05-28',
      source: '图书馆',
    },
  ],
}
