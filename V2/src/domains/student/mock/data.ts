import type { StudentDashboardDTO } from '@/domains/student/types/api'

export const mockStudentDashboard: StudentDashboardDTO = {
  profile: {
    name: '张同学',
    studentId: '2023XXXX',
    college: '大数据与人工智能学院',
    major: '人工智能',
    grade: '2023级',
    className: '人工智能2301班',
    mentor: '李老师',
    counselor: '王老师',
    dormitory: '宿舍楼A栋 301',
    motto: '持续学习，勇于探索',
    mottoSub: '未来可期，步履不停',
    avatarUrl: '/student/avatar.png',
  },
  growthPortrait: {
    dimensions: [
      { name: '学业能力', personal: 92.6, gradeAvg: 71.5 },
      { name: '专业创新', personal: 89.7, gradeAvg: 67.8 },
      { name: '实践能力', personal: 88.1, gradeAvg: 65.4 },
      { name: '身心素质', personal: 85.3, gradeAvg: 72.6 },
      { name: '组织协调', personal: 83.4, gradeAvg: 69.2 },
    ],
  },
  aiAssistant: {
    title: '财宝成长助手 AI',
    mascotUrl: '/student/mascot.png',
    recommendedDirection: 'AI 应用开发工程师',
    matchBasis: ['GPA 3.72 高于专业均值', '2 项 AI 相关竞赛获奖', 'Python / 机器学习证书 3 项'],
    shortTermSuggestions: [
      '补充 1 段企业实习经历，提升实践能力评分',
      '关注《数据结构》补考，消除学业预警',
    ],
    longTermSuggestions: [
      '持续深耕 AI 算法与工程化能力',
      '参与 1 项科研或创新创业项目',
      '考取云计算 / 大数据相关认证',
    ],
  },
  growthOverview: {
    growthIndex: 86.5,
    growthLevel: '优秀',
    overallRank: 18,
    overallTotal: 620,
    academicRank: 15,
    academicTotal: 620,
    qualityScore: 89.2,
    qualityLevel: '良好+',
  },
  highlights: [
    { id: '1', label: '全国大学生数学建模竞赛省一等奖', date: '2024-09' },
    { id: '2', label: 'ACM 程序设计竞赛校赛金奖', date: '2024-05' },
    { id: '3', label: '国家励志奖学金', date: '2023-11' },
    { id: '4', label: '校级优秀学生干部', date: '2024-06' },
    { id: '5', label: 'Python 数据分析高级证书', date: '2024-03' },
  ],
  attention: [
    { id: '1', label: '《数据结构》课程成绩 62 分，存在学业预警风险', category: '学业预警', level: 'high' },
    { id: '2', label: '尚无企业实习经历，实践能力维度偏低', category: '实践提醒', level: 'medium' },
    { id: '3', label: '本学期体测 1000 米未达标', category: '健康提醒', level: 'low' },
  ],
  academic: {
    gpa: 3.72,
    classRank: 2,
    classTotal: 45,
    departmentRank: 15,
    departmentTotal: 620,
    gpaTrend: {
      semesters: ['2022秋', '2023春', '2023秋', '2024春'],
      values: [3.45, 3.58, 3.65, 3.72],
    },
    classRankTrend: {
      semesters: ['2022秋', '2023春', '2023秋', '2024春'],
      values: [8, 5, 3, 2],
    },
    departmentRankTrend: {
      semesters: ['2022秋', '2023春', '2023秋', '2024春'],
      values: [45, 32, 22, 15],
    },
    courseGrades: [
      { name: '机器学习', score: 95 },
      { name: 'Python 程序设计', score: 92 },
      { name: '数据分析导论', score: 90 },
      { name: '高等数学 A', score: 88 },
      { name: '线性代数', score: 86 },
      { name: '数据库原理', score: 84 },
      { name: '概率论与数理统计', score: 78 },
      { name: '数据结构', score: 62 },
    ],
    courseCompletionRate: 98,
    excellentCourses: 11,
    totalCourses: 38,
  },
  competition: {
    awardCount: 8,
    researchCount: 2,
    innovationCount: 3,
    highlights: [
      { label: '数学建模省一等奖', detail: '2024.09' },
      { label: 'ACM 校赛金奖', detail: '2024.05' },
      { label: '创新创业训练计划立项', detail: '2023.12' },
    ],
  },
  quality: {
    cadreRoles: ['班长', '学习委员'],
    volunteerHours: 128,
    socialPractices: 3,
    softSkills: [
      { name: '思想素养', score: 92 },
      { name: '社会责任', score: 88 },
      { name: '创新意识', score: 90 },
      { name: '沟通能力', score: 85 },
      { name: '团队协作', score: 91 },
    ],
  },
  internship: {
    internshipCount: 0,
    projectCount: 2,
    certificateCount: 5,
    items: [
      { name: 'AI 算法模型竞赛', type: '项目' },
      { name: '校园数据可视化平台', type: '项目' },
      { name: 'Python 数据分析高级', type: '证书' },
      { name: '机器学习工程师', type: '证书' },
    ],
  },
  health: {
    healthScore: 84,
    mentalHealth: 88,
    exerciseHabit: '规律',
    summary30d: {
      totalMinutes: 900,
      frequency: 18,
      calories: 2150,
    },
  },
  employment: {
    jobReadiness: 74,
    certificateReadiness: 68,
    careerDirections: ['AI 应用开发', '数据分析师', '算法工程师'],
    developmentPath: {
      short: '补修数据结构，完成 1 段实习',
      medium: '参与科研/竞赛，考取行业认证',
      long: 'AI 工程师 / 数据科学家职业路径',
    },
  },
  footer: {
    motto: '每一次努力，都是成长的足迹 —— 张同学',
    growthDays: 678,
    goalCompletionRate: 82,
    milestoneCount: 12,
    totalAwards: 24,
  },
}

/** @deprecated use mockStudentDashboard */
export const mockStudentProfile = mockStudentDashboard.profile
