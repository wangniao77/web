import type {
  EmploymentDetailDTO,
  ResearchPlatformsDetailDTO,
  TeachingCoursesDetailDTO,
  WarningDetailDTO,
} from '@/types/college/api/details'

export { mockKeyTasksDetail } from '@/mock/college/key-tasks-detail'

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
  credit: {
    type: 'credit',
    label: '第二课堂学分预警',
    records: [
      { name: '陈俊宇', studentId: '2021010233', major: '计算机科学与技术', grade: '2021级', reason: '第二课堂学分完成 6/10，创新创业类缺口', level: '红色' },
      { name: '林嘉欣', studentId: '2021011045', major: '软件工程', grade: '2021级', reason: '菁英成长与技能培训类学分未达标', level: '橙色' },
      { name: '吴梦洁', studentId: '2022011290', major: '大数据管理与应用', grade: '2022级', reason: '文体艺术类学分缺 1.5 分', level: '黄色' },
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
