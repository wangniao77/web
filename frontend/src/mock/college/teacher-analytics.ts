import type {
  TeacherAnalyticsDetailDTO,
  TeacherAnalyticsDTO,
} from '@/types/college/api/teacher-analytics'

const titleStructure: TeacherAnalyticsDTO['titleStructure'] = [
  { title: '教授', count: 38 },
  { title: '副教授', count: 62 },
  { title: '讲师', count: 86 },
]

const totalTeachers = titleStructure.reduce((sum, item) => sum + item.count, 0)
const seniorCount = (titleStructure[0]?.count ?? 0) + (titleStructure[1]?.count ?? 0)
const seniorTitleRatio = Number(((seniorCount / totalTeachers) * 100).toFixed(1))

const base: TeacherAnalyticsDTO = {
  health: {
    score: 82,
    structure: '优',
    load: '紧',
    risk: '中',
  },
  metrics: [
    {
      key: 'phd',
      label: '博士占比',
      value: 78.5,
      unit: '%',
      meaning: '目标80%，还差1.5pp',
      tone: 'warn',
      target: 80,
      yoyChange: 6,
    },
    {
      key: 'senior',
      label: '高级职称',
      value: seniorTitleRatio,
      unit: '%',
      meaning: '同比↑4pp',
      tone: 'up',
      yoyChange: 4,
    },
    {
      key: 'headcount',
      label: '队伍规模',
      value: totalTeachers,
      unit: '人',
      meaning: '缺编7人',
      tone: 'warn',
      target: totalTeachers + 7,
    },
    {
      key: 'load',
      label: '教学负荷',
      value: 246,
      unit: '学时',
      meaning: '超负荷教师18人',
      tone: 'risk',
    },
    {
      key: 'warning',
      label: '预警态势',
      value: 8,
      unit: '人',
      meaning: '同比↑3人 · 科研/教学',
      tone: 'risk',
      yoyChange: 3,
    },
    {
      key: 'stuTeacher',
      label: '生师比',
      value: 17.2,
      unit: ':1',
      meaning: '目标≤16，偏紧',
      tone: 'warn',
      target: 16,
    },
  ],
  insights: [
    '软件工程专业高级职称占比偏低，建议重点引进/晋升',
    '青年教师比例较高，但副教授储备不足',
    'AI专业平均课时超过学院均值28%，负荷偏紧',
    '未来三年预计退休教师9人，需提前布局接替',
  ],
  summary: {
    totalTeachers,
    phdRatio: 78.5,
    seniorTitleRatio,
    avgTeachingHours: 246,
    modelTeacherCount: 12,
    warningCount: 8,
    publicService: {
      count: 156,
      hours: 1280,
    },
    excellentCount: 42,
  },
  titleStructure,
  profile: {
    teaching: 86.4,
    research: 82.8,
    socialService: 79.6,
  },
  groups: {
    excellent: { count: 42, ratio: 22.6, momChange: 5 },
    warning: { count: 8, ratio: 4.3, momChange: 3 },
  },
  highlights: [
    { label: '高层次人才', value: '12人' },
    { label: '省级以上项目', value: '28项' },
    { label: '教学成果奖', value: '6项' },
  ],
}

export const mockTeacherAnalytics: TeacherAnalyticsDTO = base

export const mockTeacherAnalyticsDetail: TeacherAnalyticsDetailDTO = {
  ...base,
  structure: {
    age: [
      { label: '35岁以下', count: 48, ratio: 25.8 },
      { label: '35-45岁', count: 72, ratio: 38.7 },
      { label: '46-55岁', count: 46, ratio: 24.7 },
      { label: '55岁以上', count: 20, ratio: 10.8 },
    ],
    education: [
      { label: '博士', count: 146, ratio: 78.5 },
      { label: '硕士', count: 36, ratio: 19.4 },
      { label: '学士及其他', count: 4, ratio: 2.1 },
    ],
    title: [
      { label: '教授', count: 38, ratio: 20.4 },
      { label: '副教授', count: 62, ratio: 33.3 },
      { label: '讲师', count: 86, ratio: 46.2 },
    ],
    academicOrigin: [
      { label: '海外高校', count: 28, ratio: 15.1 },
      { label: '双一流高校', count: 96, ratio: 51.6 },
      { label: '其他高校', count: 62, ratio: 33.3 },
    ],
  },
  teachingHoursDetail: [
    { name: '张教授', title: '教授', major: '计算机科学与技术', hours: 216 },
    { name: '李教授', title: '教授', major: '人工智能', hours: 198 },
    { name: '王老师', title: '副教授', major: '软件工程', hours: 268 },
    { name: '赵老师', title: '副教授', major: '计算机科学与技术', hours: 252 },
    { name: '陈老师', title: '讲师', major: '软件工程', hours: 286 },
    { name: '刘老师', title: '讲师', major: '人工智能', hours: 274 },
  ],
  modelTeachers: [
    { name: '张教授', title: '教授', major: '计算机科学与技术', year: '2026', highlight: '国家级一流课程负责人' },
    { name: '李教授', title: '教授', major: '人工智能', year: '2026', highlight: '省级教学名师' },
    { name: '王老师', title: '副教授', major: '软件工程', year: '2025', highlight: '产教融合突出贡献' },
    { name: '陈老师', title: '讲师', major: '软件工程', year: '2025', highlight: '青年教师教学竞赛一等奖' },
  ],
  warningSamples: [
    { name: '赵某', title: '讲师', major: '大数据管理与应用', reason: '科研考核未达标', type: '科研', status: '跟踪中' },
    { name: '钱某', title: '副教授', major: '金融科技', reason: '教学质量预警', type: '教学', status: '已谈话' },
    { name: '孙某', title: '讲师', major: '人工智能', reason: '课时完成率偏低', type: '教学', status: '已整改' },
  ],
  publicServiceAnalysis: {
    byTeacher: [
      { name: '张教授', count: 18, hours: 126 },
      { name: '李教授', count: 14, hours: 98 },
      { name: '王老师', count: 12, hours: 86 },
      { name: '陈老师', count: 10, hours: 72 },
    ],
    byType: [
      { type: '学术讲座', count: 48, hours: 192 },
      { type: '企业培训', count: 36, hours: 288 },
      { type: '政务咨询', count: 28, hours: 210 },
      { type: '社区服务', count: 44, hours: 590 },
    ],
    byMonth: [
      { month: '01', count: 8, hours: 62 },
      { month: '02', count: 6, hours: 48 },
      { month: '03', count: 14, hours: 110 },
      { month: '04', count: 16, hours: 128 },
      { month: '05', count: 18, hours: 146 },
      { month: '06', count: 12, hours: 98 },
    ],
  },
  assessmentIndicators: [
    { key: 'teaching', label: '教学质量', score: 88.2, unit: '分', trend: { direction: 'up', value: 1.6, unit: '分' } },
    { key: 'research', label: '科研产出', score: 84.5, unit: '分', trend: { direction: 'up', value: 2.3, unit: '分' } },
    { key: 'service', label: '社会服务', score: 81.3, unit: '分', trend: { direction: 'up', value: 0.8, unit: '分' } },
    { key: 'mentoring', label: '学生指导', score: 87.6, unit: '分', trend: { direction: 'up', value: 1.2, unit: '分' } },
    { key: 'innovation', label: '课程创新', score: 85.1, unit: '分', trend: { direction: 'flat', value: 0, unit: '分' } },
    { key: 'collaboration', label: '团队协作', score: 83.9, unit: '分', trend: { direction: 'up', value: 0.6, unit: '分' } },
  ],
  majorComparison: [
    { major: '计算机科学与技术', phdRatio: 82, excellentCount: 14 },
    { major: '软件工程', phdRatio: 76, excellentCount: 11 },
    { major: '人工智能', phdRatio: 88, excellentCount: 9 },
    { major: '大数据管理与应用', phdRatio: 72, excellentCount: 8 },
  ],
  excellentSamples: [
    { name: '张教授', title: '教授', major: '计算机科学与技术' },
    { name: '李教授', title: '教授', major: '人工智能' },
    { name: '王老师', title: '副教授', major: '软件工程' },
  ],
}
