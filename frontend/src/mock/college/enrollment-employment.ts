import type {
  EnrollmentEmploymentDetailDTO,
  EnrollmentEmploymentOverviewDTO,
} from '@/types/college/api/enrollment-employment'

const overview: EnrollmentEmploymentOverviewDTO = {
  enrolledCount: 1286,
  sourceQualityIndex: 86.4,
  placementRate: 94.8,
  highQualityEmploymentRate: 61.3,
  entranceTrend: {
    conclusion: '生源质量指数连续三年提升',
    years: ['2024', '2025', '2026'],
    values: [82.1, 84.5, 86.4],
  },
  exitTrend: {
    conclusion: '高质量就业率连续三年提升',
    years: ['2024', '2025', '2026'],
    values: [53.6, 57.2, 61.3],
  },
  flowPreview: {
    title: '专业 → 毕业去向流向',
    nodes: [
      { name: '计算机' },
      { name: '软件工程' },
      { name: '人工智能' },
      { name: '大厂就业' },
      { name: '国内升学' },
      { name: '出国' },
      { name: '考公' },
      { name: '其他就业' },
    ],
    links: [
      { source: '计算机', target: '大厂就业', value: 86 },
      { source: '计算机', target: '国内升学', value: 112 },
      { source: '计算机', target: '出国', value: 28 },
      { source: '计算机', target: '考公', value: 42 },
      { source: '计算机', target: '其他就业', value: 148 },
      { source: '软件工程', target: '大厂就业', value: 64 },
      { source: '软件工程', target: '国内升学', value: 86 },
      { source: '软件工程', target: '出国', value: 18 },
      { source: '软件工程', target: '考公', value: 48 },
      { source: '软件工程', target: '其他就业', value: 136 },
      { source: '人工智能', target: '大厂就业', value: 36 },
      { source: '人工智能', target: '国内升学', value: 50 },
      { source: '人工智能', target: '出国', value: 16 },
      { source: '人工智能', target: '考公', value: 32 },
      { source: '人工智能', target: '其他就业', value: 98 },
    ],
  },
}

export const mockEnrollmentEmploymentOverview: EnrollmentEmploymentOverviewDTO = overview

export const mockEnrollmentEmploymentDetail: EnrollmentEmploymentDetailDTO = {
  ...overview,
  filters: {
    years: ['2024', '2025', '2026'],
    majors: ['全部专业', '计算机科学与技术', '软件工程', '人工智能'],
  },
  admission: {
    scale: {
      enrolledCount: 1286,
      firstChoiceRate: 68.4,
    },
    quality: {
      sourceQualityIndex: 86.4,
      avgScore: 568,
      minScore: 542,
      avgRank: 28640,
      prevAvgScore: 561,
      prevMinScore: 535,
      prevAvgRank: 31280,
    },
    majorShare: [
      { major: '计算机科学与技术', count: 486, ratio: 37.8 },
      { major: '软件工程', count: 428, ratio: 33.3 },
      { major: '人工智能', count: 372, ratio: 28.9 },
    ],
    sourceStructure: {
      provinces: [
        { name: '广东', count: 812, ratio: 63.1 },
        { name: '湖南', count: 86, ratio: 6.7 },
        { name: '江西', count: 72, ratio: 5.6 },
        { name: '广西', count: 64, ratio: 5.0 },
        { name: '福建', count: 52, ratio: 4.0 },
        { name: '其他', count: 200, ratio: 15.6 },
      ],
      inOutProvince: { inProvince: 63.1, outProvince: 36.9 },
      gender: { male: 58.6, female: 41.4 },
    },
    yearlyTrend: {
      years: ['2022', '2023', '2024', '2025', '2026'],
      enrolled: [1120, 1186, 1224, 1258, 1286],
      qualityIndex: [78.6, 80.2, 82.1, 84.5, 86.4],
      firstChoiceRate: [61.2, 63.8, 65.4, 66.9, 68.4],
    },
    insights: [
      {
        title: '质量与规模同步抬升',
        detail: '近五年录取人数增长 14.8%，生源质量指数同步提升 7.8 分，说明扩招未稀释入口质量。',
        tone: 'good',
      },
      {
        title: '省内集中度偏高',
        detail: '广东生源占 63.1%，省外头部省份贡献不足 7%，跨省优质生源拓展仍有空间。',
        tone: 'warn',
      },
      {
        title: '一志愿与均分联动',
        detail: '一志愿率每提升 1 个百分点，录取均分约上移 1.2 分；计科专业贡献了主要增量。',
        tone: 'info',
      },
    ],
    actions: [
      '对湖南、江西、广西三省加大精准宣讲与夏令营投放',
      '人工智能专业试点“高分专项+二次确认”，稳住一志愿',
      '将生源质量指数纳入二级学院年度考核看板',
    ],
    drillSamples: {
      计算机科学与技术: [
        { name: '周启明', major: '计算机科学与技术', detail: '高考 628 · 省内理科 · 一志愿', tag: '高分样本' },
        { name: '林晓彤', major: '计算机科学与技术', detail: '高考 612 · 省外转入 · 一志愿', tag: '跨省优质' },
        { name: '何子昂', major: '计算机科学与技术', detail: '高考 598 · 竞赛生 · 二志愿', tag: '竞赛通道' },
      ],
      软件工程: [
        { name: '陈嘉怡', major: '软件工程', detail: '高考 618 · 省内 · 一志愿', tag: '高分样本' },
        { name: '黄俊杰', major: '软件工程', detail: '高考 586 · 省外 · 一志愿', tag: '跨省优质' },
      ],
      人工智能: [
        { name: '许子涵', major: '人工智能', detail: '高考 635 · 省内 · 一志愿', tag: '顶尖样本' },
        { name: '赵一诺', major: '人工智能', detail: '高考 602 · 省外 · 调剂确认', tag: '调剂转化' },
      ],
      广东: [
        { name: '吴浩然', major: '计算机科学与技术', detail: '珠三角 · 一志愿 · 均分 582', tag: '省内主体' },
        { name: '郑思琪', major: '软件工程', detail: '粤东 · 一志愿 · 均分 568', tag: '省内拓展' },
      ],
      湖南: [
        { name: '彭宇轩', major: '人工智能', detail: '长沙 · 一志愿 · 位次靠前', tag: '省外头部' },
      ],
      江西: [
        { name: '刘思远', major: '计算机科学与技术', detail: '南昌 · 一志愿 · 高分段', tag: '省外头部' },
      ],
    },
  },
  graduation: {
    exitQuality: {
      placementRate: 94.8,
      highQualityEmploymentRate: 61.3,
    },
    highQualityDest: [
      { key: 'big-tech', label: '大厂就业', count: 186, ratio: 18.4 },
      { key: 'domestic-grad', label: '国内升学', count: 248, ratio: 24.6 },
      { key: 'abroad', label: '出国', count: 62, ratio: 6.1 },
      { key: 'civil-service', label: '考公', count: 122, ratio: 12.1 },
    ],
    gradSchools: [
      { name: '中山大学', count: 28, ratio: 11.3 },
      { name: '华南理工大学', count: 24, ratio: 9.7 },
      { name: '哈尔滨工业大学（深圳）', count: 18, ratio: 7.3 },
      { name: '深圳大学', count: 16, ratio: 6.5 },
      { name: '暨南大学', count: 14, ratio: 5.6 },
      { name: '其他', count: 148, ratio: 59.6 },
    ],
    distribution: {
      industry: [
        { name: '互联网/软件', count: 386, ratio: 38.2 },
        { name: '金融/财会', count: 168, ratio: 16.6 },
        { name: '制造业', count: 142, ratio: 14.1 },
        { name: '教育科研', count: 98, ratio: 9.7 },
        { name: '机关事业', count: 86, ratio: 8.5 },
        { name: '其他', count: 130, ratio: 12.9 },
      ],
      region: [
        { name: '珠三角', count: 612, ratio: 60.6 },
        { name: '长三角', count: 126, ratio: 12.5 },
        { name: '京津冀', count: 68, ratio: 6.7 },
        { name: '粤东粤西粤北', count: 94, ratio: 9.3 },
        { name: '其他省市', count: 110, ratio: 10.9 },
      ],
      salary: [
        { name: '15万以上', count: 186, ratio: 18.4 },
        { name: '10-15万', count: 312, ratio: 30.9 },
        { name: '8-10万', count: 268, ratio: 26.5 },
        { name: '8万以下', count: 244, ratio: 24.2 },
      ],
    },
    majorCompare: [
      { major: '计算机科学与技术', placementRate: 95.6, highQualityRate: 64.2 },
      { major: '软件工程', placementRate: 94.8, highQualityRate: 61.8 },
      { major: '人工智能', placementRate: 93.5, highQualityRate: 57.4 },
    ],
    yearlyTrend: {
      years: ['2022', '2023', '2024', '2025', '2026'],
      placementRate: [91.2, 92.6, 93.4, 94.1, 94.8],
      highQualityRate: [48.2, 51.4, 53.6, 57.2, 61.3],
    },
    insights: [
      {
        title: '高质量就业连续三年上行',
        detail: '高质量就业率由 53.6% 升至 61.3%，升学与大厂贡献了约 70% 的增量。',
        tone: 'good',
      },
      {
        title: '行业结构偏互联网',
        detail: '互联网/软件占 38.2%，金融与制造合计 30.7%；建议拓宽金融科技、智能制造岗位池。',
        tone: 'warn',
      },
      {
        title: '专业差距可拆解',
        detail: '计科高质量就业率领先人工智能 6.8 个百分点，主要差在大厂与升学两端。',
        tone: 'info',
      },
    ],
    actions: [
      '针对人工智能专业增设“算法岗冲刺营 + 导师内推”',
      '与珠三角制造龙头共建暑期项目制实习',
      '把高质量去向结构纳入就业周报，按周追踪缺口',
    ],
    drillSamples: {
      '大厂就业': [
        { name: '钟灵毓', major: '软件工程', detail: '腾讯 · 后端开发 · 25.2k×16', tag: '大厂' },
        { name: '张沐宸', major: '人工智能', detail: '字节跳动 · 算法 · 28.0k×16', tag: '大厂' },
        { name: '龚俊熙', major: '大数据管理与应用', detail: '华为 · 数据工程 · 23.5k×15', tag: '大厂' },
      ],
      '国内升学': [
        { name: '孟宪章', major: '计算机科学与技术', detail: '中山大学 · 学术硕士', tag: '升学' },
        { name: '林昭华', major: '计算机科学与技术', detail: '华南理工大学 · 学术硕士', tag: '升学' },
        { name: '苏婉清', major: '软件工程', detail: '上海交通大学 · 专业硕士', tag: '升学' },
      ],
      '出国': [
        { name: '严思齐', major: '人工智能', detail: '香港科技大学 · 研究型硕士', tag: '出国' },
        { name: '罗欣妍', major: '金融科技', detail: '新加坡国立大学 · 授课型硕士', tag: '出国' },
      ],
      '考公': [
        { name: '石清晏', major: '金融科技', detail: '广东省委组织部 · 选调生', tag: '考公' },
        { name: '范文博', major: '软件工程', detail: '广州市税务局 · 公务员', tag: '考公' },
      ],
      '互联网/软件': [
        { name: '钟灵毓', major: '软件工程', detail: '腾讯 · 深圳 · 25.2k×16', tag: '互联网' },
        { name: '崔宇轩', major: '计算机科学与技术', detail: '大疆 · 深圳 · 22.0k×14', tag: '互联网' },
        { name: '何雨萱', major: '软件工程', detail: '唯品会 · 广州 · 17.0k×14', tag: '互联网' },
      ],
      '金融/财会': [
        { name: '董欣悦', major: '大数据管理与应用', detail: '广发证券 · 数据分析师', tag: '金融' },
        { name: '吴俊杰', major: '大数据管理与应用', detail: '招商银行信科 · 数据开发', tag: '金融' },
      ],
      '制造业': [
        { name: '李政道', major: '计算机科学与技术', detail: '美的集团 · 佛山 · 18.0k×14', tag: '制造' },
        { name: '邓皓轩', major: '计算机科学与技术', detail: 'vivo · 东莞 · 17.5k×14', tag: '制造' },
      ],
      '珠三角': [
        { name: '萧景铄', major: '软件工程', detail: '网易广州 · 游戏开发', tag: '珠三角' },
        { name: '潘思远', major: '人工智能', detail: 'OPPO 东莞 · AI 算法', tag: '珠三角' },
      ],
      '长三角': [
        { name: '苏婉清', major: '软件工程', detail: '上海交大 · 升学深造', tag: '长三角' },
      ],
      '15万以上': [
        { name: '张沐宸', major: '人工智能', detail: '字节跳动 · 年包约 44.8 万', tag: '高薪' },
        { name: '钟灵毓', major: '软件工程', detail: '腾讯 · 年包约 40.3 万', tag: '高薪' },
      ],
      '10-15万': [
        { name: '董欣悦', major: '大数据管理与应用', detail: '广发证券 · 年包约 26.4 万', tag: '中高薪' },
      ],
    },
  },
}
