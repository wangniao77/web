import type {
  DevQualityDimension,
  EvaluationIndicatorKey,
  StudentDevDetailDTO,
  StudentDevQualityDTO,
  StudentEvaluationDetailDTO,
  StudentFlowSankeyDTO,
} from '@/types/college/api/student-dev-quality'

const byMajor = [
  { name: '计算机科学与技术', count: 142 },
  { name: '软件工程', count: 118 },
  { name: '人工智能', count: 96 },
  { name: '大数据管理与应用', count: 78 },
  { name: '金融科技', count: 52 },
]

const byGrade = [
  { name: '2021级', count: 128 },
  { name: '2022级', count: 136 },
  { name: '2023级', count: 124 },
  { name: '2024级', count: 98 },
]

const byCourse = [
  { name: '数据结构', count: 86 },
  { name: '机器学习', count: 72 },
  { name: '软件工程', count: 68 },
  { name: '数据库系统', count: 64 },
  { name: 'Python程序设计', count: 58 },
]

const courseDistribution = [
  { course: '数据结构', count: 86 },
  { course: '机器学习', count: 72 },
  { course: '软件工程', count: 68 },
  { course: '数据库系统', count: 64 },
  { course: 'Python程序设计', count: 58 },
  { course: '算法设计', count: 52 },
]

const evaluationIndicators: StudentDevQualityDTO['evaluationIndicators'] = [
  { key: 'academic', label: '学业成绩', score: 88.6, unit: '分', trend: { direction: 'up', value: 2.1, unit: '分' } },
  { key: 'courseCompletion', label: '课程完成情况', score: 91.2, unit: '%', trend: { direction: 'up', value: 1.4, unit: '%' } },
  { key: 'comprehensive', label: '综合素质表现', score: 86.4, unit: '分', trend: { direction: 'up', value: 1.8, unit: '分' } },
  { key: 'innovation', label: '创新创业成果', score: 78.5, unit: '分', trend: { direction: 'up', value: 3.2, unit: '分' } },
  { key: 'competition', label: '学科竞赛情况', score: 82.3, unit: '分', trend: { direction: 'up', value: 4.6, unit: '分' } },
  { key: 'employment', label: '就业与升学情况', score: 85.7, unit: '分', trend: { direction: 'up', value: 0.8, unit: '分' } },
  { key: 'academicRisk', label: '学业风险情况', score: 92.1, unit: '分', trend: { direction: 'up', value: 1.2, unit: '分' } },
  { key: 'development', label: '学生发展', score: 87.9, unit: '分', trend: { direction: 'up', value: 2.0, unit: '分' } },
]

const dimensionMap: Record<DevQualityDimension, Array<{ name: string; count: number }>> = {
  major: byMajor,
  grade: byGrade,
  course: byCourse,
}

const undergradGpaByGrade: StudentDevQualityDTO['undergradGpaByGrade'] = [
  {
    gradeKey: '2021',
    gradeLabel: '2021级',
    majors: [
      { key: 'cs', label: '计算机科学与技术', shortName: '计科', gpa: 3.48 },
      { key: 'se', label: '软件工程', shortName: '软工', gpa: 3.41 },
      { key: 'ai', label: '人工智能', shortName: '人工智能', gpa: 3.36 },
    ],
  },
  {
    gradeKey: '2022',
    gradeLabel: '2022级',
    majors: [
      { key: 'cs', label: '计算机科学与技术', shortName: '计科', gpa: 3.44 },
      { key: 'se', label: '软件工程', shortName: '软工', gpa: 3.37 },
      { key: 'ai', label: '人工智能', shortName: '人工智能', gpa: 3.31 },
    ],
  },
  {
    gradeKey: '2023',
    gradeLabel: '2023级',
    majors: [
      { key: 'cs', label: '计算机科学与技术', shortName: '计科', gpa: 3.40 },
      { key: 'se', label: '软件工程', shortName: '软工', gpa: 3.33 },
      { key: 'ai', label: '人工智能', shortName: '人工智能', gpa: 3.26 },
    ],
  },
  {
    gradeKey: '2024',
    gradeLabel: '2024级',
    majors: [
      { key: 'cs', label: '计算机科学与技术', shortName: '计科', gpa: 3.36 },
      { key: 'se', label: '软件工程', shortName: '软工', gpa: 3.29 },
      { key: 'ai', label: '人工智能', shortName: '人工智能', gpa: 3.22 },
    ],
  },
]

export function mockStudentDevQuality(dimension: DevQualityDimension = 'major'): StudentDevQualityDTO {
  return {
    dimension,
    enrolledUndergrad: 4862,
    enrolledGraduate: 818,
    employmentRate: 79.2,
    employmentRateByYear: {
      years: ['2022', '2023', '2024', '2025', '2026'],
      rates: [74.6, 76.1, 77.8, 78.5, 79.2],
    },
    outcomesPreview: [
      { key: 'employment', label: '就业', count: 1368, ratio: 63.4 },
      { key: 'civilService', label: '考公', count: 186, ratio: 8.6 },
      { key: 'furtherStudy', label: '升学', count: 650, ratio: 30.1 },
    ],
    growthValue: {
      score: 78.6,
      level: '良好',
      trend: { direction: 'up', value: 2.4 },
    },
    undergradGpaByGrade,
    developmentIndex: 78.6,
    highPotential: {
      total: 486,
      ratio: 68.5,
      ratioTrend: { direction: 'up', value: 3.2, unit: '%' },
      structure: [
        { key: 'competition', label: '竞赛高潜', count: 156, flux: 18 },
        { key: 'academic', label: '学业高潜', count: 238, flux: -6 },
        { key: 'research', label: '科研创新', count: 126, flux: 12 },
        { key: 'practice', label: '实践高潜', count: 184, flux: 9 },
      ],
      byDimension: dimensionMap[dimension],
      courseDistribution,
      trend: {
        months: ['9月', '10月', '11月', '12月', '1月', '2月'],
        counts: [312, 328, 356, 398, 442, 486],
        developmentIndices: [72.4, 73.6, 74.8, 76.2, 77.4, 78.6],
      },
    },
    groups: {
      excellent: { count: 128, momChange: 12 },
      academicWarning: { count: 23, momChange: -3 },
    },
    warningBreakdown: [
      { key: 'academic', label: '学业预警', count: 12 },
      { key: 'credit', label: '学分预警', count: 7 },
      { key: 'psychological', label: '心理预警', count: 4 },
    ],
    evaluationIndicators,
  }
}

export const mockStudentFlowSankey: StudentFlowSankeyDTO = {
  entrance: {
    nodes: [
      { name: '广东省内' },
      { name: '省外生源' },
      { name: '港澳台' },
      { name: '计算机科学与技术' },
      { name: '软件工程' },
      { name: '人工智能' },
      { name: '大数据管理与应用' },
      { name: '金融科技' },
    ],
    links: [
      { source: '广东省内', target: '计算机科学与技术', value: 420 },
      { source: '广东省内', target: '软件工程', value: 380 },
      { source: '广东省内', target: '人工智能', value: 310 },
      { source: '广东省内', target: '大数据管理与应用', value: 260 },
      { source: '广东省内', target: '金融科技', value: 180 },
      { source: '省外生源', target: '计算机科学与技术', value: 180 },
      { source: '省外生源', target: '软件工程', value: 160 },
      { source: '省外生源', target: '人工智能', value: 140 },
      { source: '省外生源', target: '大数据管理与应用', value: 120 },
      { source: '省外生源', target: '金融科技', value: 90 },
      { source: '港澳台', target: '计算机科学与技术', value: 24 },
      { source: '港澳台', target: '软件工程', value: 18 },
      { source: '港澳台', target: '人工智能', value: 16 },
    ],
  },
  outcome: {
    nodes: [
      { name: '计算机科学与技术' },
      { name: '软件工程' },
      { name: '人工智能' },
      { name: '大数据管理与应用' },
      { name: '金融科技' },
      { name: '升学深造' },
      { name: '名企就业' },
      { name: '公务员' },
      { name: '自主创业' },
      { name: '待就业' },
    ],
    links: [
      { source: '计算机科学与技术', target: '升学深造', value: 168 },
      { source: '计算机科学与技术', target: '名企就业', value: 312 },
      { source: '计算机科学与技术', target: '公务员', value: 42 },
      { source: '计算机科学与技术', target: '自主创业', value: 28 },
      { source: '软件工程', target: '升学深造', value: 142 },
      { source: '软件工程', target: '名企就业', value: 286 },
      { source: '软件工程', target: '公务员', value: 36 },
      { source: '软件工程', target: '自主创业', value: 22 },
      { source: '人工智能', target: '升学深造', value: 156 },
      { source: '人工智能', target: '名企就业', value: 248 },
      { source: '人工智能', target: '公务员', value: 28 },
      { source: '人工智能', target: '自主创业', value: 18 },
      { source: '大数据管理与应用', target: '升学深造', value: 98 },
      { source: '大数据管理与应用', target: '名企就业', value: 186 },
      { source: '大数据管理与应用', target: '公务员', value: 32 },
      { source: '大数据管理与应用', target: '待就业', value: 24 },
      { source: '金融科技', target: '升学深造', value: 86 },
      { source: '金融科技', target: '名企就业', value: 142 },
      { source: '金融科技', target: '公务员', value: 48 },
      { source: '金融科技', target: '待就业', value: 18 },
    ],
  },
  outcomeDrillSamples: {
    '软件工程→升学深造': [
      {
        name: '示例学生',
        studentId: '2022001001',
        major: '软件工程',
        className: '软工2201',
        detail: '境内升学 · 示例高校',
        salary: null,
        tag: '升学深造',
      },
    ],
  },
  summary: {
    entranceTotal: 2846,
    graduateTotal: 2156,
    avgEntranceScore: 570.4,
    employmentRate: 79.2,
    firstChoiceRate: 91.8,
    furtherRate: 18.6,
    topEntranceRegions: [
      { name: '广东省内', value: 1550 },
      { name: '省外生源', value: 690 },
      { name: '港澳台', value: 58 },
    ].map((item) => ({ name: item.name, count: item.value })),
    topOutcomes: [
      { name: '名企就业', count: 1174 },
      { name: '升学深造', count: 650 },
      { name: '公务员', count: 186 },
    ],
  },
}

const evaluationDetails: Record<EvaluationIndicatorKey, StudentEvaluationDetailDTO> = {
  academic: {
    key: 'academic',
    label: '学业成绩',
    score: 88.6,
    unit: '分',
    description: '结合平均绩点、挂科率、核心课程成绩等，反映学生学业整体水平。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [84.2, 85.6, 86.8, 87.4, 88.1, 88.6] },
    highlights: [
      { label: 'GPA≥3.5', value: '312人' },
      { label: '专业前10%', value: '186人' },
      { label: '无挂科率', value: '92.4%' },
    ],
  },
  courseCompletion: {
    key: 'courseCompletion',
    label: '课程完成情况',
    score: 91.2,
    unit: '%',
    description: '统计学分完成度、必修课达标率、实践环节完成情况。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [88.5, 89.2, 89.8, 90.4, 90.8, 91.2] },
    highlights: [
      { label: '学分完成率', value: '91.2%' },
      { label: '实践环节达标', value: '94.6%' },
      { label: '延期毕业', value: '12人' },
    ],
  },
  comprehensive: {
    key: 'comprehensive',
    label: '综合素质表现',
    score: 86.4,
    unit: '分',
    description: '涵盖德智体美劳综合评价、志愿服务与社会实践参与情况。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [82.1, 83.4, 84.2, 85.0, 85.8, 86.4] },
    highlights: [
      { label: '志愿服务时长', value: '8,620小时' },
      { label: '校级荣誉', value: '52人次' },
      { label: '社会实践参与', value: '76.8%' },
    ],
  },
  innovation: {
    key: 'innovation',
    label: '创新创业成果',
    score: 78.5,
    unit: '分',
    description: '统计创新创业项目立项、专利、创业实践等成果。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [72.4, 74.1, 75.6, 76.8, 77.6, 78.5] },
    highlights: [
      { label: '创新项目立项', value: '46项' },
      { label: '专利/软著', value: '28项' },
      { label: '创业团队', value: '12支' },
    ],
  },
  competition: {
    key: 'competition',
    label: '学科竞赛情况',
    score: 82.3,
    unit: '分',
    description: '反映学科竞赛参与率、获奖层次与覆盖面。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [76.2, 78.4, 79.6, 80.8, 81.5, 82.3] },
    highlights: [
      { label: '省级以上获奖', value: '128人次' },
      { label: '竞赛参与率', value: '68.5%' },
      { label: '国家级奖项', value: '18项' },
    ],
  },
  employment: {
    key: 'employment',
    label: '就业与升学情况',
    score: 85.7,
    unit: '分',
    description: '统计就业率、升学率、对口就业比例等出口质量指标。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [81.2, 82.6, 83.8, 84.6, 85.2, 85.7] },
    highlights: [
      { label: '就业率', value: '79.2%' },
      { label: '升学率', value: '18.6%' },
      { label: '对口就业', value: '86.4%' },
    ],
  },
  academicRisk: {
    key: 'academicRisk',
    label: '学业风险情况',
    score: 92.1,
    unit: '分',
    description: '学业风险越低得分越高，综合挂科、学分不足、预警解除率等。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [88.4, 89.2, 90.1, 90.8, 91.5, 92.1] },
    highlights: [
      { label: '学业预警', value: '23人' },
      { label: '解除预警', value: '18人' },
      { label: '挂科率', value: '3.2%' },
    ],
  },
  development: {
    key: 'development',
    label: '学生发展',
    score: 87.9,
    unit: '分',
    description: '综合学生成长轨迹、发展性评价与个性化培养成效。',
    trend: { months: ['9月', '10月', '11月', '12月', '1月', '2月'], values: [83.6, 84.8, 85.6, 86.4, 87.2, 87.9] },
    highlights: [
      { label: '个性化培养方案', value: '486人' },
      { label: '导师覆盖', value: '96.8%' },
      { label: '发展性评价完成', value: '94.2%' },
    ],
  },
}

export function mockStudentEvaluationDetail(key: EvaluationIndicatorKey): StudentEvaluationDetailDTO {
  return evaluationDetails[key]
}

export function mockStudentDevDetail(): StudentDevDetailDTO {
  return {
    summary: {
      enrolledUndergrad: 4862,
      enrolledGraduate: 818,
      employmentRate: 79.2,
      highPotential: 486,
      warning: 23,
    },
    outcomes: [
      { key: 'employment', label: '就业', count: 1368, ratio: 63.4 },
      { key: 'civilService', label: '考公', count: 186, ratio: 8.6 },
      { key: 'furtherStudy', label: '升学', count: 650, ratio: 30.1 },
    ],
    salaryByMajor: {
      years: ['2022', '2023', '2024', '2025', '2026'],
      series: [
        { name: '计算机科学与技术', data: [9.8, 10.6, 11.4, 12.2, 13.1] },
        { name: '软件工程', data: [9.5, 10.2, 11.0, 11.8, 12.6] },
        { name: '人工智能', data: [10.2, 11.1, 12.0, 13.2, 14.5] },
        { name: '大数据管理与应用', data: [8.6, 9.2, 9.8, 10.5, 11.2] },
      ],
    },
    gaokaoScores: [
      { major: '计算机科学与技术', avgScore: 578, minScore: 562, maxScore: 628 },
      { major: '软件工程', avgScore: 572, minScore: 556, maxScore: 618 },
      { major: '人工智能', avgScore: 585, minScore: 568, maxScore: 635 },
      { major: '大数据管理与应用', avgScore: 564, minScore: 548, maxScore: 602 },
      { major: '金融科技', avgScore: 568, minScore: 552, maxScore: 610 },
    ],
    highPotentialBreakdown: {
      byMajor: byMajor,
      byGrade: byGrade,
      byType: [
        { name: '学业卓越', count: 168 },
        { name: '竞赛创新', count: 142 },
        { name: '领导实践', count: 96 },
        { name: '实习就业', count: 80 },
      ],
    },
    warningBreakdown: {
      byType: [
        { name: '学业预警', count: 23 },
        { name: '学分预警', count: 12 },
        { name: '心理关注', count: 8 },
        { name: '就业困难', count: 6 },
      ],
      byMajor: [
        { name: '计算机科学与技术', count: 7 },
        { name: '软件工程', count: 5 },
        { name: '人工智能', count: 4 },
        { name: '大数据管理与应用', count: 4 },
        { name: '金融科技', count: 3 },
      ],
      byGrade: [
        { name: '2021级', count: 4 },
        { name: '2022级', count: 6 },
        { name: '2023级', count: 8 },
        { name: '2024级', count: 5 },
      ],
    },
    undergradDistribution: {
      byMajor: [
        { name: '计算机科学与技术', count: 1860 },
        { name: '软件工程', count: 1520 },
        { name: '人工智能', count: 1482 },
      ],
      byGrade: [
        { name: '2022级', count: 1158 },
        { name: '2023级', count: 1206 },
        { name: '2024级', count: 1240 },
        { name: '2025级', count: 1258 },
      ],
    },
  }
}
