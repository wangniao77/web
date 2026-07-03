import type {
  EmploymentDetailDTO,
  KeyTasksDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/domains/college/types/api/details'

export const mockKeyTasksDetail: KeyTasksDetailDTO = {
  summary: { total: 8, completed: 1, ongoing: 6, delayed: 1 },
  tasks: [
    {
      id: '1',
      name: '高水平学科建设',
      progress: 85,
      status: 'ongoing',
      leadDept: '学科建设办公室',
      deadline: '2025-12-31',
      description: '围绕学科评估指标，推进一流学科与一流专业建设。',
      milestones: [
        { label: '建设方案定稿', done: true },
        { label: '中期评估完成', done: true },
        { label: '年度目标验收', done: false },
      ],
    },
    {
      id: '2',
      name: '国家级一流专业建设',
      progress: 92,
      status: 'ongoing',
      leadDept: '教学办',
      deadline: '2025-11-30',
      description: '推进计算机科学与技术、软件工程等专业工程教育认证。',
      milestones: [
        { label: '自评报告提交', done: true },
        { label: '专家进校考察', done: false },
        { label: '认证结论发布', done: false },
      ],
    },
    {
      id: '3',
      name: '博士点申报筹备',
      progress: 68,
      status: 'ongoing',
      leadDept: '科研办',
      deadline: '2026-03-31',
      description: '完善博士点申报材料与学科方向布局。',
      milestones: [
        { label: '材料初稿完成', done: true },
        { label: '校内评审', done: false },
        { label: '正式申报', done: false },
      ],
    },
    {
      id: '4',
      name: '产教融合示范基地',
      progress: 95,
      status: 'completed',
      leadDept: '校企合作办',
      deadline: '2025-06-30',
      description: '建设产教融合示范基地，拓展实习就业渠道。',
      milestones: [
        { label: '基地签约', done: true },
        { label: '首批项目落地', done: true },
        { label: '年度验收', done: true },
      ],
    },
    {
      id: '5',
      name: '国际交流合作拓展',
      progress: 78,
      status: 'ongoing',
      leadDept: '国际交流办',
      deadline: '2025-12-15',
      description: '拓展海外合作院校与联合培养项目。',
      milestones: [
        { label: '合作备忘录', done: true },
        { label: '交换生项目', done: false },
        { label: '联合科研', done: false },
      ],
    },
    {
      id: '6',
      name: '智慧教学平台升级',
      progress: 88,
      status: 'ongoing',
      leadDept: '信息中心',
      deadline: '2025-10-31',
      description: '升级智慧教学平台，完善在线课程与评教系统。',
      milestones: [
        { label: '平台选型', done: true },
        { label: '数据迁移', done: true },
        { label: '全面上线', done: false },
      ],
    },
    {
      id: '7',
      name: '学生工作重点项目',
      progress: 45,
      status: 'delayed',
      leadDept: '学工办',
      deadline: '2025-09-30',
      description: '心理健康、资助帮扶与学风建设等重点项目推进滞后。',
      milestones: [
        { label: '心理预警机制', done: true },
        { label: '学风督查全覆盖', done: false },
        { label: '重点群体帮扶', done: false },
      ],
    },
    {
      id: '8',
      name: '就业率提升工程',
      progress: 88,
      status: 'ongoing',
      leadDept: '就业指导中心',
      deadline: '2025-12-31',
      description: '拓展名企实习与校招渠道，提升签约质量。',
      milestones: [
        { label: '名企专场招聘', done: true },
        { label: '实习基地签约', done: true },
        { label: '就业率达标', done: false },
      ],
    },
  ],
}

export const mockWarningDetails: Record<string, WarningDetailDTO> = {
  academic: {
    type: 'academic',
    label: '学业预警',
    records: [
      { name: '张同学', studentId: '2021001001', major: '计算机科学与技术', grade: '2021级', reason: '连续两学期 GPA 低于 2.0', level: '红色' },
      { name: '李同学', studentId: '2022002033', major: '软件工程', grade: '2022级', reason: '挂科 3 门，学分不足', level: '橙色' },
      { name: '王同学', studentId: '2021001088', major: '人工智能', grade: '2021级', reason: 'GPA 连续下滑', level: '黄色' },
    ],
  },
  psychological: {
    type: 'psychological',
    label: '心理预警',
    records: [
      { name: '陈同学', studentId: '2023003012', major: '大数据管理与应用', grade: '2023级', reason: '近期情绪波动，需关注', level: '橙色' },
      { name: '刘同学', studentId: '2022002056', major: '金融科技', grade: '2022级', reason: '睡眠与作息异常', level: '黄色' },
    ],
  },
  employment: {
    type: 'employment',
    label: '就业预警',
    records: [
      { name: '赵同学', studentId: '2021001120', major: '电子商务', grade: '2021级', reason: '毕业前未落实就业去向', level: '红色' },
      { name: '周同学', studentId: '2021001155', major: '计算机科学与技术', grade: '2021级', reason: '实习中断，就业意向不明确', level: '橙色' },
    ],
  },
  funding: {
    type: 'funding',
    label: '资助预警',
    records: [
      { name: '吴同学', studentId: '2023003088', major: '软件工程', grade: '2023级', reason: '家庭经济状况变化，需复核', level: '黄色' },
      { name: '郑同学', studentId: '2022002099', major: '人工智能', grade: '2022级', reason: '资助材料待补充', level: '黄色' },
    ],
  },
}

export const mockTeachingCoursesDetail: TeachingCoursesDetailDTO = {
  courses: [
    { name: '数据结构', level: '国家级一流', leader: '张明华', hours: 64, students: 186, status: '运行中' },
    { name: '机器学习', level: '省级一流', leader: '李婉清', hours: 48, students: 128, status: '运行中' },
    { name: 'Python程序设计', level: '校级精品', leader: '王建国', hours: 48, students: 245, status: '运行中' },
    { name: '数据库原理', level: '校级精品', leader: '陈晓峰', hours: 56, students: 198, status: '运行中' },
    { name: '深度学习', level: '省级在线', leader: '刘洋', hours: 32, students: 96, status: '运行中' },
    { name: '软件工程', level: '校级一流', leader: '赵敏', hours: 48, students: 168, status: '运行中' },
  ],
}

export const mockResearchPlatformsDetail: ResearchPlatformsDetailDTO = {
  categories: [
    {
      category: '省级及以上平台',
      items: [
        { name: '广东省金融大数据重点实验室', level: '省重点实验室', leader: '张明华', members: 18, foundedAt: '2021-06' },
        { name: '人工智能与智能金融工程中心', level: '省工程技术中心', leader: '李婉清', members: 15, foundedAt: '2022-09' },
        { name: '数字经济协同创新中心', level: '省协同创新中心', leader: '王建国', members: 22, foundedAt: '2023-03' },
      ],
    },
    {
      category: '校级科研团队',
      items: [
        { name: '机器学习理论团队', level: '校级A类', leader: '赵敏', members: 9, foundedAt: '2020-09' },
        { name: '自然语言处理团队', level: '校级A类', leader: '周海涛', members: 8, foundedAt: '2021-03' },
        { name: '计算机视觉团队', level: '校级B类', leader: '孙丽', members: 7, foundedAt: '2021-09' },
      ],
    },
    {
      category: '产学研基地',
      items: [
        { name: '广财-腾讯云计算联合基地', level: '校企共建', leader: '黄思远', members: 20, foundedAt: '2022-04' },
        { name: '华为昇腾人工智能基地', level: '校企共建', leader: '林晓彤', members: 14, foundedAt: '2023-07' },
      ],
    },
  ],
}

export const mockEmploymentDetail: EmploymentDetailDTO = {
  overview: [
    { label: '毕业生总数', value: '1,286', unit: '人' },
    { label: '已落实去向', value: '1,018', unit: '人' },
    { label: '就业率', value: '79.2', unit: '%' },
    { label: '平均起薪', value: '8,650', unit: '元/月' },
  ],
  byDirection: [
    { name: '升学深造', count: 360, percent: 28, note: '双一流高校 42 人 · 境外深造 18 人' },
    { name: '企业就业', count: 669, percent: 52, note: '互联网/金融科技为主，名企占比 31%' },
    { name: '公务员', count: 103, percent: 8, note: '选调生 24 人 · 事业单位 46 人' },
    { name: '自主创业', count: 77, percent: 6, note: '数字经济、电商领域为主' },
    { name: '其他', count: 77, percent: 6, note: '灵活就业与暂缓就业' },
  ],
  topEmployers: [
    { name: '腾讯科技', industry: '互联网', count: 18, avgSalary: '11,200 元/月' },
    { name: '华为技术', industry: 'ICT', count: 15, avgSalary: '12,500 元/月' },
    { name: '招商银行', industry: '金融', count: 12, avgSalary: '9,800 元/月' },
    { name: '字节跳动', industry: '互联网', count: 10, avgSalary: '13,000 元/月' },
  ],
  byMajor: [
    { major: '计算机科学与技术', rate: '86.4', headcount: 268, topDirection: '企业就业' },
    { major: '软件工程', rate: '84.1', headcount: 245, topDirection: '企业就业' },
    { major: '人工智能', rate: '82.7', headcount: 156, topDirection: '升学深造' },
    { major: '大数据管理与应用', rate: '80.3', headcount: 198, topDirection: '企业就业' },
  ],
}
