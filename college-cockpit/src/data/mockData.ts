import type { IconKind } from '../components/DashIcon';

export type { IconKind };

export interface NameValue {
  readonly name: string;
  readonly value: number;
}

export interface MetricItem {
  readonly label: string;
  readonly value: string;
  readonly unit?: string;
  readonly iconKind: IconKind;
  readonly tone?: 'cyan' | 'blue' | 'amber' | 'red' | 'pink' | 'green';
}

export interface FlowStepItem {
  readonly label: string;
  readonly value: string;
  readonly iconKind: IconKind;
}

export type TaskStatus = 'completed' | 'in-progress' | 'attention';

export interface TaskProgressItem {
  readonly id: string;
  readonly name: string;
  readonly percent: number;
  readonly status: TaskStatus;
  readonly iconKind: IconKind;
  readonly leadDept: string;
  readonly deadline: string;
  readonly description: string;
  readonly milestones: readonly { readonly label: string; readonly done: boolean }[];
}

export interface NewsItem {
  readonly title: string;
  readonly date: string;
  readonly tag: string;
}

export const dashboardData = {
  header: {
    university: '广东财经大学',
    school: '大数据与人工智能学院',
    motto: '厚德 励学 笃行 拓新',
    title: '大数据与人工智能学院发展与治理驾驶舱',
    navTabs: ['看全局', '抓重点', '强治理', '促发展', '提效能'],
    date: '2025-05-26',
    time: '20:30:18',
    weather: { temp: '22°C', desc: '多云' },
    statusCards: [
      { label: '2025-2026学年', value: '第一学期', iconKind: 'calendar' as const },
      { label: '数据更新时间', value: '2025-05-26 09:30', iconKind: 'clock' as const },
      { label: '数据接入状态', value: '正常', iconKind: 'status' as const }
    ]
  },
  footerNav: [
    { label: '院情总览', iconKind: 'home' as const, active: true },
    { label: '重点任务', iconKind: 'task' as const },
    { label: '教学运行', iconKind: 'academic' as const },
    { label: '学生发展', iconKind: 'students' as const },
    { label: '科研创新', iconKind: 'research' as const },
    { label: '师资队伍', iconKind: 'faculty' as const },
    { label: '预警监测', iconKind: 'warning' as const },
    { label: '高潜发展', iconKind: 'potential' as const },
    { label: '设置管理', iconKind: 'settings' as const }
  ],
  overview: {
    index: '87.6',
    indexLabel: '学院综合发展指数',
    metrics: [
      { label: '在校学生数', value: '5,680', unit: '人', trend: '↑2.4%', iconKind: 'students' as const, position: 'tl' },
      { label: '教职工数', value: '268', unit: '人', trend: '↑1.8%', iconKind: 'faculty' as const, position: 'ml' },
      { label: '高潜人数变化', value: '+186', unit: '人', trend: '较上学期 ↑12.4%', iconKind: 'potential' as const, position: 'bl' },
      { label: '学科排名', value: '3/18', trend: '↑2位', iconKind: 'ranking' as const, position: 'tr' },
      { label: '师生满意度', value: '92.3', unit: '%', trend: '↑3.1%', iconKind: 'satisfaction' as const, position: 'mr' },
      { label: '竞赛覆盖率', value: '68.5', unit: '%', trend: '↑5.8%', iconKind: 'trophy' as const, position: 'br' }
    ]
  },
  tasks: {
    title: '年度重点任务推进',
    items: [
      {
        id: 'double-first-class',
        name: '双一流建设',
        percent: 92,
        status: 'in-progress',
        iconKind: 'research',
        leadDept: '学科建设办公室',
        deadline: '2025-12-31',
        description: '围绕学科评估指标，推进一流学科与一流专业建设，完善建设方案与年度考核机制。',
        milestones: [
          { label: '建设方案定稿', done: true },
          { label: '中期评估完成', done: true },
          { label: '年度目标验收', done: false }
        ]
      },
      {
        id: 'accreditation',
        name: '专业认证',
        percent: 78,
        status: 'in-progress',
        iconKind: 'academic',
        leadDept: '教学办',
        deadline: '2025-11-30',
        description: '推进计算机科学与技术、软件工程等专业工程教育认证，补齐课程与实践环节短板。',
        milestones: [
          { label: '自评报告提交', done: true },
          { label: '专家进校考察', done: false },
          { label: '认证结论发布', done: false }
        ]
      },
      {
        id: 'faculty',
        name: '师资队伍建设',
        percent: 65,
        status: 'in-progress',
        iconKind: 'faculty',
        leadDept: '人事秘书',
        deadline: '2025-12-15',
        description: '引进高层次人才，优化青年教师培养与导师制，提升博士占比与科研产出。',
        milestones: [
          { label: '引才计划落地', done: true },
          { label: '青年导师全覆盖', done: false },
          { label: '年度考核达标', done: false }
        ]
      },
      {
        id: 'research-platform',
        name: '科研平台建设',
        percent: 58,
        status: 'in-progress',
        iconKind: 'innovation',
        leadDept: '科研办',
        deadline: '2026-03-31',
        description: '建设大数据与人工智能交叉创新平台，完善实验室设备与产学研合作机制。',
        milestones: [
          { label: '平台立项批复', done: true },
          { label: '设备采购到位', done: false },
          { label: '首批项目入驻', done: false }
        ]
      },
      {
        id: 'competition',
        name: '学科竞赛组织',
        percent: 85,
        status: 'in-progress',
        iconKind: 'trophy',
        leadDept: '学工办',
        deadline: '2025-10-31',
        description: '组织 ACM、数学建模、创新创业等赛事，扩大参赛覆盖面与获奖层次。',
        milestones: [
          { label: '竞赛梯队组建', done: true },
          { label: '省赛获奖目标', done: true },
          { label: '国赛冲刺准备', done: false }
        ]
      },
      {
        id: 'student-work',
        name: '学生工作重点项目',
        percent: 45,
        status: 'attention',
        iconKind: 'students',
        leadDept: '学工办',
        deadline: '2025-09-30',
        description: '心理健康、资助帮扶与学风建设等重点项目推进滞后，需加强督办与资源投入。',
        milestones: [
          { label: '心理预警机制', done: true },
          { label: '学风督查全覆盖', done: false },
          { label: '重点群体帮扶', done: false }
        ]
      },
      {
        id: 'employment',
        name: '就业率提升工程',
        percent: 88,
        status: 'in-progress',
        iconKind: 'placement',
        leadDept: '就业指导中心',
        deadline: '2025-12-31',
        description: '拓展名企实习与校招渠道，强化就业指导与简历面试辅导，提升签约质量。',
        milestones: [
          { label: '名企专场招聘', done: true },
          { label: '实习基地签约', done: true },
          { label: '就业率达标', done: false }
        ]
      },
      {
        id: 'employment-campaign',
        name: '就业攻坚任务',
        percent: 100,
        status: 'completed',
        iconKind: 'complete',
        leadDept: '就业指导中心',
        deadline: '2025-06-30',
        description: '2025 届困难群体就业帮扶专项行动已全面完成，实现一人一策精准帮扶。',
        milestones: [
          { label: '困难群体摸排', done: true },
          { label: '一人一策制定', done: true },
          { label: '全部落实去向', done: true }
        ]
      }
    ] as TaskProgressItem[],
    summary: {
      total: 8,
      completed: { count: 1, percent: 12 },
      inProgress: { count: 6, percent: 75 },
      attention: { count: 1, percent: 13 }
    }
  },
  studentWork: {
    title: '学生就业与前景',
    kpis: [
      { label: '学生就业满意度', value: '94.6', unit: '%', iconKind: 'satisfaction' as const },
      { label: '就业率', value: '79.2', unit: '%', iconKind: 'placement' as const }
    ],
    employmentDist: [
      { name: '升学深造', value: 28 },
      { name: '企业就业', value: 52 },
      { name: '公务员', value: 8 },
      { name: '自主创业', value: 6 },
      { name: '其他', value: 6 }
    ],
    employmentRegions: [
      { name: '广州', value: 42 },
      { name: '深圳', value: 23 },
      { name: '珠三角其他', value: 15 },
      { name: '北京/上海', value: 9 },
      { name: '省外其他', value: 7 },
      { name: '境外', value: 4 }
    ],
    qualityDev: [
      { name: '思想政治', value: 92 },
      { name: '学业发展', value: 86 },
      { name: '创新创业', value: 78 },
      { name: '文体活动', value: 84 },
      { name: '社会实践', value: 76 }
    ],
    employmentDetail: {
      overview: [
        { label: '毕业生总数', value: '1,286', unit: '人' },
        { label: '已落实去向', value: '1,018', unit: '人' },
        { label: '就业率', value: '79.2', unit: '%' },
        { label: '平均起薪', value: '8,650', unit: '元/月' }
      ],
      byDirection: [
        { name: '升学深造', count: 360, percent: 28, note: '双一流高校 42 人 · 境外深造 18 人' },
        { name: '企业就业', count: 669, percent: 52, note: '互联网/金融科技为主，名企占比 31%' },
        { name: '公务员', count: 103, percent: 8, note: '选调生 24 人 · 事业单位 46 人' },
        { name: '自主创业', count: 77, percent: 6, note: '数字经济、电商领域为主' },
        { name: '其他', count: 77, percent: 6, note: '灵活就业与暂缓就业' }
      ],
      topEmployers: [
        { name: '腾讯科技', industry: '互联网', count: 18, avgSalary: '11,200 元/月' },
        { name: '华为技术', industry: 'ICT', count: 15, avgSalary: '12,500 元/月' },
        { name: '招商银行', industry: '金融', count: 12, avgSalary: '9,800 元/月' },
        { name: '字节跳动', industry: '互联网', count: 10, avgSalary: '13,000 元/月' },
        { name: '中国平安', industry: '金融科技', count: 9, avgSalary: '9,200 元/月' },
        { name: '广发证券', industry: '证券', count: 8, avgSalary: '10,500 元/月' }
      ],
      byMajor: [
        { major: '计算机科学与技术', rate: '86.4', headcount: 268, topDirection: '企业就业' },
        { major: '软件工程', rate: '84.1', headcount: 245, topDirection: '企业就业' },
        { major: '人工智能', rate: '82.7', headcount: 156, topDirection: '升学深造' },
        { major: '大数据管理与应用', rate: '80.3', headcount: 198, topDirection: '企业就业' },
        { major: '金融科技', rate: '78.9', headcount: 142, topDirection: '企业就业' },
        { major: '电子商务', rate: '75.6', headcount: 165, topDirection: '自主创业' }
      ]
    }
  },
  highPotential: {
    title: '高潜学生发展画像',
    summary: {
      total: 486,
      change: '+186人',
      coverage: '68.5%',
      activeRate: '92.4%',
      trend: {
        months: ['9月', '10月', '11月', '12月', '1月', '2月'],
        counts: [312, 328, 356, 398, 442, 486]
      },
      kpis: [
        { label: '四六级高分率', value: '76.8', unit: '%' },
        { label: '学分完成优秀', value: '89.2', unit: '%' },
        { label: '竞赛参与率', value: '68.5', unit: '%' },
        { label: '优质实习率', value: '54.3', unit: '%' }
      ]
    },
    left: [
      {
        id: 'academic',
        title: '学业高潜',
        iconKind: 'academic' as const,
        desc: 'GPA 排名曲线、优势课程高亮；四六级高分、学分完成度优秀、排名靠前均为高潜标签。',
        tags: ['四六级高分', '学分完成度优秀', '排名靠前', '绩点持续上升', '专业前10%'],
        gpaTrend: {
          terms: ['2023-1', '2023-2', '2024-1', '2024-2', '2025-1'],
          ranks: [22, 18, 14, 11, 8]
        },
        highlightCourses: ['数据结构', '机器学习', 'Python程序设计', '数据库原理', '深度学习'],
        stats: [
          { label: 'GPA≥3.5', value: '312', unit: '人' },
          { label: '六级≥500', value: '186', unit: '人' },
          { label: '无挂科记录', value: '428', unit: '人' }
        ],
        cardMetric: { label: 'GPA≥3.5', value: '312', unit: '人' }
      },
      {
        id: 'competition',
        title: '竞赛高潜',
        iconKind: 'trophy' as const,
        desc: '学科竞赛、论文发表、科研项目与科研训练成果时序展示；AI 推荐适配竞赛与科研项目。',
        timeline: [
          { date: '2025-05', title: '全国大学生数学建模竞赛', level: '国家二等奖' },
          { date: '2025-04', title: '「互联网+」创新创业大赛', level: '省级金奖' },
          { date: '2025-03', title: 'ACM程序设计竞赛', level: '省级一等奖' },
          { date: '2024-12', title: '大学生创新创业训练计划', level: '国家级立项' },
          { date: '2024-11', title: '蓝桥杯程序设计', level: '国家三等奖' },
          { date: '2024-09', title: 'SCI论文发表', level: '学生一作' }
        ],
        aiRecommend: [
          '推荐参加「挑战杯」课外学术科技竞赛',
          '匹配导师科研项目：智能金融风控',
          '建议申报大学生创新训练计划（国家级）',
          '推荐加入学院 AI 创新实验室'
        ],
        stats: [
          { label: '省级以上获奖', value: '128', unit: '人次' },
          { label: '论文/专利', value: '46', unit: '项' }
        ],
        cardMetric: { label: '省级以上获奖', value: '128', unit: '人次' }
      },
      {
        id: 'leadership',
        title: '干部奉献高潜',
        iconKind: 'community' as const,
        desc: '学生干部、大型活动组织、长期志愿服务与重大社会服务经历，体现综合素养与奉献精神。',
        highlights: [
          { label: '学生干部', value: '128', unit: '人' },
          { label: '大型活动组织', value: '36', unit: '场' },
          { label: '校级荣誉', value: '52', unit: '人次' },
          { label: '志愿服务', value: '8,620', unit: '小时' }
        ],
        events: [
          '学院科技文化节总策划 12 人',
          '迎新晚会执行统筹 28 人',
          '校友论坛志愿服务 86 人',
          '校园开放日讲解员 45 人'
        ],
        cardMetric: { label: '学生干部', value: '128', unit: '人' }
      }
    ],
    right: [
      {
        id: 'rural',
        title: '三下乡实践高潜',
        iconKind: 'event' as const,
        desc: '三下乡、乡村振兴、社会调研与普法宣传等实践经历，展示学生知行合一与服务社会能力。',
        highlights: [
          { label: '实践队伍', value: '24', unit: '支' },
          { label: '覆盖乡镇', value: '18', unit: '个' },
          { label: '服务村民', value: '3,200+', unit: '人' },
          { label: '调研报告', value: '36', unit: '篇' }
        ],
        teams: [
          { name: '智慧农业调研队', place: '梅州大埔', result: '省级优秀团队' },
          { name: '金融普法宣讲团', place: '清远阳山', result: '校级一等奖' },
          { name: '数字乡村服务队', place: '河源和平', result: '优秀实践报告' },
          { name: '电商助农实践队', place: '湛江雷州', result: '媒体报道 3 次' }
        ],
        cardMetric: { label: '实践队伍', value: '24', unit: '支' }
      },
      {
        id: 'internship',
        title: '实习项目高潜',
        iconKind: 'briefcase' as const,
        desc: '优质实习、校企重点项目、专利证书、代码/系统开发成果与深度参与导师项目均为高潜成果。',
        achievements: [
          { title: '头部企业实习', detail: '腾讯、华为、字节等优质岗位 86 人', iconKind: 'briefcase' as const },
          { title: '校企重点项目', detail: '金融科技联合实验室 12 项', iconKind: 'link' as const },
          { title: '专利与证书', detail: '软著 18 项 · 职业资格证 64 本', iconKind: 'award' as const },
          { title: '系统开发成果', detail: '上线项目 23 个 · 代码仓库星标 1.2k', iconKind: 'innovation' as const },
          { title: '导师科研项目', detail: '深度参与省级以上项目 34 人', iconKind: 'research' as const }
        ],
        cardMetric: { label: '优质实习', value: '86', unit: '人' }
      },
      {
        id: 'career',
        title: '就业升学高潜',
        iconKind: 'placement' as const,
        desc: '升学深造、名企就业、公务员与创新创业等发展路径，展示高潜学生出口质量与发展后劲。',
        paths: [
          { label: '升学深造', value: '28', unit: '%', detail: '双一流高校 42 人' },
          { label: '名企就业', value: '52', unit: '%', detail: '互联网/金融头部 68 人' },
          { label: '公务员', value: '8', unit: '%', detail: '国考省考录用 12 人' },
          { label: '创新创业', value: '6', unit: '%', detail: '注册项目 8 个' }
        ],
        spotlight: [
          '2025届保研至中山大学、华南理工 18 人',
          '斩获腾讯 SP offer 6 人、华为天才少年面试 2 人',
          '「互联网+」省赛金奖团队已注册公司 2 家'
        ],
        cardMetric: { label: '名企就业', value: '52', unit: '%' }
      }
    ]
  },
  teaching: {
    title: '教学质量与运行',
    kpis: [
      { label: '开课门数', value: '186', iconKind: 'course' as const },
      { label: '优质课程', value: '42', iconKind: 'award' as const },
      { label: '实践教学', value: '88.6', unit: '%', iconKind: 'practice' as const }
    ],
    excellenceTrend: {
      years: ['2021', '2022', '2023', '2024', '2025'],
      rates: [82.4, 85.1, 87.6, 89.3, 91.2]
    },
    courseConstruction: [
      { name: '国家级一流', value: 4 },
      { name: '省级一流', value: 12 },
      { name: '校级精品', value: 26 },
      { name: '在线课程', value: 18 },
      { name: '实践基地', value: 14 }
    ],
    courseDetails: [
      {
        category: '国家级一流',
        courses: [
          { name: '数据结构与算法', code: 'CS2011', teacher: '张明华', major: '计算机科学与技术', approvedAt: '2023-09' },
          { name: '机器学习导论', code: 'AI3012', teacher: '李婉清', major: '人工智能', approvedAt: '2024-06' },
          { name: '数据库系统原理', code: 'CS3010', teacher: '王建国', major: '软件工程', approvedAt: '2022-12' },
          { name: '金融科技概论', code: 'FT2008', teacher: '陈晓峰', major: '金融科技', approvedAt: '2024-03' }
        ]
      },
      {
        category: '省级一流',
        courses: [
          { name: 'Python 程序设计', code: 'CS1005', teacher: '刘洋', major: '计算机科学与技术', approvedAt: '2023-05' },
          { name: '大数据技术基础', code: 'BD2015', teacher: '赵敏', major: '大数据管理与应用', approvedAt: '2023-11' },
          { name: '软件工程导论', code: 'SE2001', teacher: '周海涛', major: '软件工程', approvedAt: '2022-08' },
          { name: '电子商务运营', code: 'EC2018', teacher: '孙丽', major: '电子商务', approvedAt: '2024-01' }
        ]
      },
      {
        category: '校级精品',
        courses: [
          { name: '线性代数', code: 'MA1002', teacher: '吴国栋', major: '全院公共', approvedAt: '2021-09' },
          { name: '计算机网络', code: 'CS3020', teacher: '郑凯', major: '计算机科学与技术', approvedAt: '2023-03' },
          { name: '深度学习实践', code: 'AI4021', teacher: '黄思远', major: '人工智能', approvedAt: '2024-09' }
        ]
      },
      {
        category: '在线课程',
        courses: [
          { name: '人工智能伦理', code: 'AI1050', teacher: '林晓彤', major: '人工智能', approvedAt: '2024-05' },
          { name: '商业数据分析', code: 'BA2033', teacher: '何志鹏', major: '电子商务', approvedAt: '2023-12' },
          { name: '云计算基础', code: 'CS3055', teacher: '马俊杰', major: '软件工程', approvedAt: '2024-02' }
        ]
      },
      {
        category: '实践基地',
        courses: [
          { name: '广财-腾讯联合实训基地', code: 'LAB-TX01', teacher: '校企共建', major: '软件工程', approvedAt: '2023-10' },
          { name: '华为 ICT 学院实践中心', code: 'LAB-HW02', teacher: '校企共建', major: '计算机科学与技术', approvedAt: '2022-11' },
          { name: '金融大数据实验室', code: 'LAB-FD03', teacher: '学院自建', major: '金融科技', approvedAt: '2024-04' }
        ]
      }
    ]
  },
  research: {
    title: '科研创新与团队平台',
    kpis: [
      { label: '纵向经费', value: '860', unit: '万', iconKind: 'funding' as const, trend: '+12%' },
      { label: '横向经费', value: '420', unit: '万', iconKind: 'contract' as const, trend: '+8%' },
      { label: '论文发表', value: '186', unit: '篇', iconKind: 'research' as const, trend: '+15%' },
      { label: '专利授权', value: '42', unit: '项', iconKind: 'innovation' as const, trend: '+6%' }
    ],
    fundingTrend: {
      years: ['2021', '2022', '2023', '2024', '2025'],
      vertical: [520, 620, 710, 780, 860],
      horizontal: [280, 320, 360, 390, 420]
    },
    platforms: [
      { name: '省级及以上平台', value: 5 },
      { name: '校级科研团队', value: 12 },
      { name: '产学研基地', value: 8 },
      { name: '创新实验室', value: 6 }
    ],
    platformDetails: [
      {
        category: '省级及以上平台',
        items: [
          { name: '广东省金融大数据重点实验室', level: '省重点实验室', leader: '张明华', members: 18, foundedAt: '2021-06' },
          { name: '人工智能与智能金融工程中心', level: '省工程技术中心', leader: '李婉清', members: 15, foundedAt: '2022-09' },
          { name: '数字经济协同创新中心', level: '省协同创新中心', leader: '王建国', members: 22, foundedAt: '2023-03' },
          { name: '大数据治理与安全研究院', level: '省级研究院', leader: '陈晓峰', members: 16, foundedAt: '2023-11' },
          { name: '智能风控联合实验室', level: '省部共建', leader: '刘洋', members: 12, foundedAt: '2024-05' }
        ]
      },
      {
        category: '校级科研团队',
        items: [
          { name: '机器学习理论团队', level: '校级A类', leader: '赵敏', members: 9, foundedAt: '2020-09' },
          { name: '自然语言处理团队', level: '校级A类', leader: '周海涛', members: 8, foundedAt: '2021-03' },
          { name: '计算机视觉团队', level: '校级B类', leader: '孙丽', members: 7, foundedAt: '2021-09' },
          { name: '区块链与安全团队', level: '校级B类', leader: '郑凯', members: 6, foundedAt: '2022-06' }
        ]
      },
      {
        category: '产学研基地',
        items: [
          { name: '广财-腾讯云计算联合基地', level: '校企共建', leader: '黄思远', members: 20, foundedAt: '2022-04' },
          { name: '华为昇腾人工智能基地', level: '校企共建', leader: '林晓彤', members: 14, foundedAt: '2023-07' },
          { name: '金融科技产业实训基地', level: '产教融合', leader: '何志鹏', members: 11, foundedAt: '2024-01' }
        ]
      },
      {
        category: '创新实验室',
        items: [
          { name: 'AI 创新创业实验室', level: '学生创新平台', leader: '马俊杰', members: 25, foundedAt: '2022-10' },
          { name: '大数据分析实验室', level: '教学科研平台', leader: '吴国栋', members: 18, foundedAt: '2023-05' },
          { name: '智能硬件与物联网实验室', level: '交叉创新平台', leader: '徐天宇', members: 13, foundedAt: '2024-03' }
        ]
      }
    ]
  },
  warning: {
    title: '预警与风险监测',
    indicators: [
      {
        id: 'academic',
        label: '学业预警',
        value: '32',
        unit: '人',
        delta: '较上月 ↑6人',
        deltaTrend: 'up' as const,
        tone: 'red' as const,
        iconKind: 'failRate' as const,
        desc: '挂科、学分不足、GPA 连续下滑等学业风险学生名单'
      },
      {
        id: 'mental',
        label: '心理预警',
        value: '18',
        unit: '人',
        delta: '较上月 ↑2人',
        deltaTrend: 'up' as const,
        tone: 'amber' as const,
        iconKind: 'mental' as const,
        desc: '心理测评异常、情绪波动、需重点关注学生名单'
      },
      {
        id: 'employment',
        label: '就业预警',
        value: '24',
        unit: '人',
        delta: '较上月 ↓3人',
        deltaTrend: 'down' as const,
        tone: 'cyan' as const,
        iconKind: 'jobSupport' as const,
        desc: '未落实去向、签约率低、求职进度滞后学生名单'
      },
      {
        id: 'credit',
        label: '第二课堂学分预警',
        value: '46',
        unit: '人',
        delta: '较上月 ↑5人',
        deltaTrend: 'up' as const,
        tone: 'gold' as const,
        iconKind: 'credit' as const,
        desc: '第二课堂学分完成不足、临近毕业未达标学生名单'
      }
    ],
    records: {
      academic: [
        { name: '张浩然', studentId: '2022011042', major: '计算机科学与技术', grade: '2022级', issue: '本学期挂科 2 门，GPA 2.1', level: '高', updatedAt: '2025-05-24' },
        { name: '李思琪', studentId: '2023012088', major: '软件工程', grade: '2023级', issue: '学分完成率 78%，低于年级均值', level: '中', updatedAt: '2025-05-23' },
        { name: '王梓轩', studentId: '2022011567', major: '人工智能', grade: '2022级', issue: '连续两学期 GPA 下滑', level: '高', updatedAt: '2025-05-22' },
        { name: '陈雨桐', studentId: '2023010345', major: '大数据管理与应用', grade: '2023级', issue: '重修课程 1 门未通过', level: '中', updatedAt: '2025-05-21' },
        { name: '刘子涵', studentId: '2022010891', major: '电子商务', grade: '2022级', issue: '缺考记录 1 次，学业预警触发', level: '高', updatedAt: '2025-05-20' },
        { name: '赵一鸣', studentId: '2023011776', major: '软件工程', grade: '2023级', issue: '核心课成绩低于 60 分', level: '中', updatedAt: '2025-05-19' }
      ],
      mental: [
        { name: '周晓彤', studentId: '2022012033', major: '计算机科学与技术', grade: '2022级', issue: '心理测评显示焦虑指数偏高', level: '高', updatedAt: '2025-05-25' },
        { name: '吴嘉怡', studentId: '2023010456', major: '人工智能', grade: '2023级', issue: '近两周情绪波动，辅导员已约谈', level: '中', updatedAt: '2025-05-24' },
        { name: '郑凯文', studentId: '2022011120', major: '软件工程', grade: '2022级', issue: '睡眠障碍自述，建议心理中心随访', level: '中', updatedAt: '2025-05-23' },
        { name: '孙艺菲', studentId: '2023011890', major: '金融科技', grade: '2023级', issue: '社交退缩倾向，班级上报关注', level: '低', updatedAt: '2025-05-22' }
      ],
      employment: [
        { name: '黄俊杰', studentId: '2021010567', major: '计算机科学与技术', grade: '2021级', issue: '尚未落实就业去向，简历投递不足', level: '高', updatedAt: '2025-05-25' },
        { name: '林佳慧', studentId: '2021011234', major: '软件工程', grade: '2021级', issue: '面试通过率低，需就业辅导', level: '中', updatedAt: '2025-05-24' },
        { name: '何志远', studentId: '2021010890', major: '人工智能', grade: '2021级', issue: '考研失利后未启动求职', level: '高', updatedAt: '2025-05-23' },
        { name: '马晓雯', studentId: '2021011456', major: '电子商务', grade: '2021级', issue: '签约单位资质待核验', level: '中', updatedAt: '2025-05-22' },
        { name: '徐天宇', studentId: '2021011678', major: '大数据管理与应用', grade: '2021级', issue: '实习经历不足，竞争力偏弱', level: '中', updatedAt: '2025-05-21' }
      ],
      credit: [
        { name: '陈俊宇', studentId: '2021010233', major: '计算机科学与技术', grade: '2021级', issue: '第二课堂学分完成 6/10，创新创业类缺口', level: '高', updatedAt: '2025-05-25' },
        { name: '林嘉欣', studentId: '2021011045', major: '软件工程', grade: '2021级', issue: '菁英成长与技能培训类学分未达标', level: '高', updatedAt: '2025-05-24' },
        { name: '黄伟诚', studentId: '2022010678', major: '人工智能', grade: '2022级', issue: '志愿公益类学分不足，临近毕业预警', level: '中', updatedAt: '2025-05-23' },
        { name: '吴梦洁', studentId: '2022011290', major: '大数据管理与应用', grade: '2022级', issue: '文体艺术类学分缺 1.5 分', level: '中', updatedAt: '2025-05-22' },
        { name: '郑浩然', studentId: '2021011567', major: '电子商务', grade: '2021级', issue: '实践实习类学分未录入', level: '中', updatedAt: '2025-05-21' },
        { name: '刘思远', studentId: '2022010912', major: '金融科技', grade: '2022级', issue: '第二课堂总学分完成 5/10', level: '低', updatedAt: '2025-05-20' }
      ]
    },
    trend: {
      months: ['12月', '1月', '2月', '3月', '4月', '5月'],
      mental: [22, 21, 20, 19, 18, 17],
      employment: [28, 27, 26, 25, 24, 22]
    },
    creditCompletion: {
      threshold: 60,
      categories: ['思想引领', '创新创业', '志愿公益', '实践实习', '文体艺术', '技能培训', '菁英成长'],
      junior: [93, 46, 84, 77, 70, 44, 32],
      senior: [96, 55, 79, 88, 60, 48, 35]
    }
  },
  academics: {
    gpaDistribution: [
      { name: '<2.0', value: 132 },
      { name: '2.0-2.5', value: 268 },
      { name: '2.5-3.0', value: 724 },
      { name: '3.0-3.5', value: 1482 },
      { name: '3.5-4.0', value: 1556 },
      { name: '4.0-4.5', value: 902 },
      { name: '4.5-5.0', value: 616 }
    ],
    warningTrend: {
      quarters: ['2024-2', '2024-3', '2024-4', '2025-1'],
      warningPeople: [720, 508, 432, 356],
      warningRate: [6.8, 4.6, 3.6, 2.8]
    },
    failRates: [
      { name: '计算机科学与技术', value: 6.8 },
      { name: '软件工程', value: 7.5 },
      { name: '人工智能', value: 6.1 },
      { name: '大数据管理与应用', value: 4.9 },
      { name: '电子商务', value: 3.8 }
    ],
    indicators: [
      { label: '挂科率', value: '6.8', unit: '%', iconKind: 'failRate' as const },
      { label: '重修率', value: '3.2', unit: '%', iconKind: 'retake' as const },
      { label: '学分完成率', value: '91.4', unit: '%', iconKind: 'credit' as const }
    ]
  },
  studentMap: {
    legend: ['> 500', '300 - 499', '200 - 299', '100 - 199', '50 - 99', '10 - 49', '< 10'],
    provinces: [
      { name: '广东省', value: 4120 },
      { name: '湖南省', value: 386 },
      { name: '广西壮族自治区', value: 312 },
      { name: '江西省', value: 248 },
      { name: '河南省', value: 186 }
    ],
    scatterPoints: [
      { name: '广州', coord: [113.23, 23.16] as const, value: 4120 },
      { name: '长沙', coord: [112.94, 28.23] as const, value: 386 },
      { name: '南宁', coord: [108.37, 22.82] as const, value: 312 },
      { name: '南昌', coord: [115.89, 28.68] as const, value: 248 },
      { name: '郑州', coord: [113.65, 34.76] as const, value: 186 }
    ],
    majorRanking: [
      { name: '计算机科学与技术', value: 886 },
      { name: '计算机科学与技术（创新实验班）', value: 823 },
      { name: '软件工程', value: 762 },
      { name: '人工智能', value: 698 },
      { name: '大数据管理与应用', value: 532 },
      { name: '大数据管理与应用（数据治理）', value: 421 },
      { name: '电子商务', value: 365 },
      { name: '信息管理与信息系统', value: 312 },
      { name: '金融科技', value: 268 },
      { name: '数字经济', value: 214 }
    ],
    stats: [
      { label: '在校学生数', value: '5,680', iconKind: 'students' as const },
      { label: '男生占比', value: '56.2', unit: '%', iconKind: 'male' as const },
      { label: '女生占比', value: '43.8', unit: '%', iconKind: 'female' as const, tone: 'pink' as const },
      { label: '本学年新增数据量', value: '1,256,890', iconKind: 'database' as const },
      { label: '数据覆盖率', value: '98.7', unit: '%', iconKind: 'coverage' as const }
    ]
  }
} as const;

export type HighPotentialModuleId =
  | (typeof dashboardData.highPotential.left)[number]['id']
  | (typeof dashboardData.highPotential.right)[number]['id'];

export const highPotentialModules = [
  ...dashboardData.highPotential.left,
  ...dashboardData.highPotential.right
] as const;

export function getHighPotentialModule(id: HighPotentialModuleId) {
  return highPotentialModules.find((m) => m.id === id);
}

export type KeyTaskId = (typeof dashboardData.tasks.items)[number]['id'];

export function getKeyTask(id: KeyTaskId) {
  return dashboardData.tasks.items.find((item) => item.id === id);
}

export type WarningCategoryId = (typeof dashboardData.warning.indicators)[number]['id'];

export type WarningRecord = (typeof dashboardData.warning.records)[WarningCategoryId][number];

export function getWarningCategory(id: WarningCategoryId) {
  return dashboardData.warning.indicators.find((item) => item.id === id);
}

export function getWarningRecords(id: WarningCategoryId): readonly WarningRecord[] {
  return dashboardData.warning.records[id];
}
