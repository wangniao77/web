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

export interface TaskProgressItem {
  readonly name: string;
  readonly percent: number;
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
      { name: '高水平师资队伍建设', percent: 85 },
      { name: '学科专业优化升级', percent: 72 },
      { name: '科研平台能级提升', percent: 68 },
      { name: '人才培养模式改革', percent: 91 },
      { name: '社会服务能力建设', percent: 76 }
    ] as TaskProgressItem[]
  },
  studentWork: {
    title: '学生工作与发展',
    kpis: [
      { label: '学生满意度', value: '94.6', unit: '%', iconKind: 'satisfaction' as const },
      { label: '就业率', value: '79.2', unit: '%', iconKind: 'placement' as const },
      { label: '创新创业', value: '86', unit: '%', iconKind: 'innovation' as const },
      { label: '体测达标', value: '88', unit: '%', iconKind: 'heart' as const }
    ],
    employmentDist: [
      { name: '升学深造', value: 28 },
      { name: '企业就业', value: 52 },
      { name: '公务员', value: 8 },
      { name: '自主创业', value: 6 },
      { name: '其他', value: 6 }
    ],
    qualityDev: [
      { name: '思想政治', value: 92 },
      { name: '学业发展', value: 86 },
      { name: '创新创业', value: 78 },
      { name: '文体活动', value: 84 },
      { name: '社会实践', value: 76 }
    ]
  },
  highPotential: {
    title: '高潜学生发展画像',
    summary: {
      total: 486,
      change: '+186人',
      trend: {
        months: ['9月', '10月', '11月', '12月', '1月', '2月'],
        counts: [312, 328, 356, 398, 442, 486]
      }
    },
    academic: {
      title: '学业高潜',
      desc: 'GPA 排名曲线、优势课程高亮展示；四六级高分、学分完成度优秀、排名靠前均属于高潜标签。',
      tags: ['四六级高分', '学分完成度优秀', '排名靠前', '绩点持续上升'],
      gpaTrend: {
        terms: ['2023-1', '2023-2', '2024-1', '2024-2', '2025-1'],
        ranks: [22, 18, 14, 11, 8]
      },
      highlightCourses: ['数据结构', '机器学习', 'Python程序设计', '数据库原理']
    },
    competition: {
      title: '竞赛高潜',
      desc: '已获各级学科竞赛、发表论文、参与教师科研项目、科研训练成果，系统时序展示高光竞赛经历；同时 AI 会推荐适配高潜学生的竞赛、科研项目。',
      timeline: [
        { date: '2025-05', title: '全国大学生数学建模竞赛', level: '国家二等奖' },
        { date: '2025-03', title: 'ACM程序设计竞赛', level: '省级一等奖' },
        { date: '2024-12', title: '大学生创新创业训练计划', level: '国家级立项' },
        { date: '2024-09', title: 'SCI论文发表', level: '学生一作' }
      ],
      aiRecommend: [
        '推荐参加「互联网+」创新创业大赛',
        '匹配导师科研项目：智能金融风控',
        '建议申报大学生创新训练计划'
      ]
    },
    leadership: {
      title: '干部奉献高潜',
      desc: '学生干部、大型活动组织、三下乡、长期志愿服务、重大社会服务经历作为综合素养亮点。',
      highlights: [
        { label: '学生干部', value: '128', unit: '人' },
        { label: '大型活动组织', value: '36', unit: '场' },
        { label: '三下乡实践', value: '24', unit: '支队伍' },
        { label: '志愿服务', value: '8,620', unit: '小时' }
      ]
    },
    internship: {
      title: '实习项目高潜',
      desc: '优质实习、校企重点项目、专利、资格证书、代码/系统开发成果、深度参与导师项目均为高潜成果。',
      achievements: [
        { title: '头部企业实习', detail: '腾讯、华为等优质岗位 86 人', iconKind: 'briefcase' as const },
        { title: '校企重点项目', detail: '金融科技联合实验室 12 项', iconKind: 'link' as const },
        { title: '专利与证书', detail: '软著 18 项 · 职业资格证 64 本', iconKind: 'award' as const },
        { title: '系统开发成果', detail: '上线项目 23 个 · 代码仓库星标 1.2k', iconKind: 'innovation' as const }
      ]
    }
  },
  teaching: {
    title: '教学质量与运行',
    kpis: [
      { label: '开课门数', value: '186', iconKind: 'course' as const },
      { label: '优质课程', value: '42', iconKind: 'award' as const },
      { label: '教学评价优', value: '91.2', unit: '%', iconKind: 'satisfaction' as const },
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
    ]
  },
  research: {
    title: '科研创新与团队平台',
    kpis: [
      { label: '纵向经费', value: '860', unit: '万', iconKind: 'funding' as const, trend: '+12%' },
      { label: '横向经费', value: '420', unit: '万', iconKind: 'contract' as const, trend: '+8%' },
      { label: '论文发表', value: '186', unit: '篇', iconKind: 'research' as const, trend: '+15%' },
      { label: '专利授权', value: '42', unit: '项', iconKind: 'innovation' as const, trend: '+6%' },
      { label: '科研项目', value: '68', unit: '项', iconKind: 'task' as const, trend: '+10%' }
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
    ]
  },
  warning: {
    title: '预警与风险监测',
    indicators: [
      { label: '学业预警', value: '32', unit: '人', delta: '较上月 ↑6人', tone: 'red' as const, iconKind: 'failRate' as const },
      { label: '心理预警', value: '18', unit: '人', delta: '较上月 ↑2人', tone: 'amber' as const, iconKind: 'mental' as const },
      { label: '就业预警', value: '24', unit: '人', delta: '较上月 ↓3人', tone: 'cyan' as const, iconKind: 'jobSupport' as const },
      { label: '科研经费预警', value: '5', unit: '项', delta: '较上月 ↑1项', tone: 'gold' as const, iconKind: 'research' as const }
    ],
    trend: {
      months: ['12月', '1月', '2月', '3月', '4月', '5月'],
      academic: [38, 35, 34, 33, 32, 30],
      mental: [22, 21, 20, 19, 18, 17],
      employment: [28, 27, 26, 25, 24, 22],
      research: [8, 7, 6, 6, 5, 4]
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
