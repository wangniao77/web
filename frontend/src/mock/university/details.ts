import type {
  AcademicRiskDetailDTO,
  DisciplineDetailDTO,
  EmploymentDetailDTO,
  EventsDetailDTO,
  KeyTasksDetailDTO,
  MetricsDetailDTO,
  NewsDetailDTO,
  ResearchDetailDTO,
} from '@/types/university/api/details'

export const mockKeyTasksDetail: KeyTasksDetailDTO = {
  summary: { total: 8, completed: 2, ongoing: 4, attention: 1, overdue: 1 },
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
  destinationStructure: [
    { name: '企业就业', value: 58.4 },
    { name: '国内升学', value: 19.7 },
    { name: '机关事业', value: 12.6 },
    { name: '境外升学', value: 5.8 },
    { name: '其他', value: 3.5 },
  ],
  industryShare: [
    { name: '金融', value: 32.1 },
    { name: '信息技术', value: 18.6 },
    { name: '公共管理', value: 14.2 },
    { name: '制造业', value: 11.8 },
    { name: '其他', value: 23.3 },
  ],
  salaryDistribution: [
    { range: '10万以下', count: 412 },
    { range: '10-20万', count: 1864 },
    { range: '20-30万', count: 892 },
    { range: '30-50万', count: 486 },
    { range: '50万以上', count: 312 },
  ],
  salaryCoverage: 73.8,
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

export const mockResearchDetail: ResearchDetailDTO = {
  projects: [
    { name: '国家级重大项目', level: '国家级', count: 12, funding: 0.86 },
    { name: '省部级项目', level: '省部级', count: 47, funding: 0.62 },
    { name: '市厅级项目', level: '市厅级', count: 83, funding: 0.28 },
  ],
  papers: [
    { type: 'CSSCI/SSCI', count: 186, trend: 12.4 },
    { type: 'SCI/EI', count: 94, trend: 8.6 },
    { type: '顶级期刊', count: 23, trend: 15.2 },
  ],
  platforms: [
    { name: '粤港澳大湾区金融研究院', level: '省级', college: '金融学院' },
    { name: '数字经济与管理实验室', level: '省级', college: '经济学院' },
    { name: '智能财务研究中心', level: '校级', college: '会计学院' },
  ],
  phdIndicators: [
    { name: '高水平论文', target: 200, current: 176, gap: 24, dept: '科研处', deadline: '2026-12' },
    { name: '国家级项目', target: 15, current: 12, gap: 3, dept: '科研处', deadline: '2026-12' },
    { name: '博士学位教师占比', target: 65, current: 58.3, gap: 6.7, dept: '人事处', deadline: '2026-12' },
  ],
  collegeRanking: [
    { collegeName: '金融学院', projects: 18, funding: 0.62, papers: 52 },
    { collegeName: '会计学院', projects: 14, funding: 0.48, papers: 41 },
    { collegeName: '经济学院', projects: 12, funding: 0.41, papers: 38 },
    { collegeName: '大数据与人工智能学院', projects: 11, funding: 0.36, papers: 35 },
  ],
  fundingTrend: [
    { year: '2023', value: 1.82 },
    { year: '2024', value: 2.15 },
    { year: '2025', value: 2.47 },
  ],
}

export const mockDisciplineDetail: DisciplineDetailDTO = {
  disciplines: [
    { name: '应用经济学', currentRank: 28, previousRank: 35, change: 7, percentile: 12.4, targetRank: 25, gap: 3, benchmarkSchool: '暨南大学', trend: [{ year: '2023', rank: 38 }, { year: '2024', rank: 35 }, { year: '2025', rank: 28 }] },
    { name: '工商管理', currentRank: 42, previousRank: 48, change: 6, percentile: 18.6, targetRank: 40, gap: 2, benchmarkSchool: '华南理工大学', trend: [{ year: '2023', rank: 52 }, { year: '2024', rank: 48 }, { year: '2025', rank: 42 }] },
    { name: '统计学', currentRank: 31, previousRank: 36, change: 5, percentile: 14.2, targetRank: 28, gap: 3, trend: [{ year: '2023', rank: 41 }, { year: '2024', rank: 36 }, { year: '2025', rank: 31 }] },
    { name: '法学', currentRank: 58, previousRank: 52, change: -6, percentile: 28.4, targetRank: 50, gap: 8, trend: [{ year: '2023', rank: 49 }, { year: '2024', rank: 52 }, { year: '2025', rank: 58 }] },
    { name: '理论经济学', currentRank: 44, previousRank: 44, change: 0, percentile: 20.1, targetRank: 40, gap: 4, trend: [{ year: '2023', rank: 46 }, { year: '2024', rank: 44 }, { year: '2025', rank: 44 }] },
    { name: '马克思主义理论', currentRank: 45, previousRank: 41, change: -4, percentile: 21.3, targetRank: 38, gap: 7, trend: [{ year: '2023', rank: 39 }, { year: '2024', rank: 41 }, { year: '2025', rank: 45 }] },
    { name: '外国语言文学', currentRank: 71, previousRank: 66, change: -5, percentile: 35.8, targetRank: 60, gap: 11, trend: [{ year: '2023', rank: 62 }, { year: '2024', rank: 66 }, { year: '2025', rank: 71 }] },
    { name: '计算机科学与技术', currentRank: 53, previousRank: 56, change: 3, percentile: 24.6, targetRank: 48, gap: 5, trend: [{ year: '2023', rank: 61 }, { year: '2024', rank: 56 }, { year: '2025', rank: 53 }] },
    { name: '管理科学与工程', currentRank: 47, previousRank: 49, change: 2, percentile: 22.4, targetRank: 42, gap: 5, trend: [{ year: '2023', rank: 54 }, { year: '2024', rank: 49 }, { year: '2025', rank: 47 }] },
    { name: '公共管理', currentRank: 39, previousRank: 41, change: 2, percentile: 17.2, targetRank: 35, gap: 4, trend: [{ year: '2023', rank: 45 }, { year: '2024', rank: 41 }, { year: '2025', rank: 39 }] },
    { name: '新闻传播学', currentRank: 36, previousRank: 38, change: 2, percentile: 15.8, targetRank: 32, gap: 4, trend: [{ year: '2023', rank: 42 }, { year: '2024', rank: 38 }, { year: '2025', rank: 36 }] },
    { name: '数学', currentRank: 62, previousRank: 60, change: -2, percentile: 30.2, targetRank: 55, gap: 7, trend: [{ year: '2023', rank: 58 }, { year: '2024', rank: 60 }, { year: '2025', rank: 62 }] },
  ],
}

export const mockEventsDetail: EventsDetailDTO = {
  items: [
    { id: 'e1', category: 'teaching', title: '本科教育教学审核评估迎评推进会', summary: '梳理迎评材料清单，明确各学院整改节点。', date: '2026-07-01', status: 'ongoing', needsAttention: true, leadDept: '教务处', nextAction: '7月10日前完成材料初审' },
    { id: 'e2', category: 'research', title: '申博关键指标专项督导会', summary: '对照申博指标体系逐项排查短板。', date: '2026-06-28', status: 'ongoing', needsAttention: true, leadDept: '科研处', nextAction: '形成短板清单并报送校领导' },
    { id: 'e3', category: 'talent', title: '高层次人才引进季度评估', summary: '评估引才计划执行进度与到岗情况。', date: '2026-06-25', status: 'planned', needsAttention: false, leadDept: '人事处', nextAction: '发布三季度引才计划' },
    { id: 'e4', category: 'safety', title: '暑期校园安全专项排查', summary: '消防、实验室、宿舍安全隐患排查。', date: '2026-06-20', status: 'ongoing', needsAttention: false, leadDept: '保卫处', nextAction: '7月5日前完成整改验收' },
    { id: 'e5', category: 'international', title: '海外合作院校签约', summary: '与3所海外高校签署交换生协议。', date: '2026-06-15', status: 'completed', needsAttention: false, leadDept: '国际交流处' },
    { id: 'e6', category: 'service', title: '产教融合基地年度评估', summary: '评估12家共建基地运行成效。', date: '2026-06-10', status: 'completed', needsAttention: false, leadDept: '就业指导中心' },
  ],
}

export const mockAcademicRiskDetail: AcademicRiskDetailDTO = {
  summary: {
    expectedDelayCount: 127,
    delayRateChange: -1.2,
    warningCount: 486,
    intervenedCount: 312,
    riskResolvedRate: 64.2,
    highRiskCollegeCount: 3,
  },
  trend: [
    { month: '2026-01', warning: 512, delay: 142 },
    { month: '2026-02', warning: 498, delay: 138 },
    { month: '2026-03', warning: 476, delay: 134 },
    { month: '2026-04', warning: 462, delay: 131 },
    { month: '2026-05', warning: 448, delay: 129 },
    { month: '2026-06', warning: 486, delay: 127 },
  ],
  riskTypes: [
    { type: '学分不足', count: 186 },
    { type: '挂科预警', count: 142 },
    { type: '论文延期', count: 98 },
    { type: '实习未完成', count: 60 },
  ],
  collegeDistribution: [
    { collegeName: '信息学院', warningCount: 86, delayCount: 28 },
    { collegeName: '人文与传播学院', warningCount: 72, delayCount: 24 },
    { collegeName: '外国语学院', warningCount: 68, delayCount: 22 },
    { collegeName: '法学院', warningCount: 54, delayCount: 18 },
    { collegeName: '经济学院', warningCount: 48, delayCount: 14 },
  ],
  interventionProgress: [
    { month: '2026-03', intervened: 42, resolved: 28 },
    { month: '2026-04', intervened: 58, resolved: 36 },
    { month: '2026-05', intervened: 72, resolved: 48 },
    { month: '2026-06', intervened: 86, resolved: 56 },
  ],
}

export const mockMetricsDetail: MetricsDetailDTO = {
  sections: [
    {
      title: '年度目标达成度',
      items: [
        { name: '年度目标完成率', definition: '已完成年度重点任务数占年度任务总数的比例', source: '发展规划处任务管理系统', formula: '已完成任务数 ÷ 任务总数 × 100%' },
        { name: '计划进度差距', definition: '实际完成率与按时间节点折算的计划进度之差', source: '发展规划处', formula: '实际完成率 − 计划进度' },
      ],
    },
    {
      title: '就业与升学',
      items: [
        { name: '毕业去向落实率', definition: '已落实毕业去向的毕业生占毕业生总数的比例', source: '就业指导中心', formula: '落实人数 ÷ 毕业生总数 × 100%' },
        { name: '薪酬信息覆盖率', definition: '有薪酬样本数据的毕业生占落实就业人数的比例', source: '就业指导中心', formula: '有薪酬样本人数 ÷ 落实就业人数 × 100%' },
      ],
    },
    {
      title: '学业风险',
      items: [
        { name: '预计延毕人数', definition: '根据学业预警模型预测的本学年可能延毕学生汇总人数', source: '教务处学业预警系统', formula: '模型预测汇总（不含个人明细）' },
        { name: '风险解除率', definition: '经干预后解除学业预警的学生占预警学生总数的比例', source: '教务处', formula: '解除预警人数 ÷ 预警总人数 × 100%' },
      ],
    },
  ],
}
