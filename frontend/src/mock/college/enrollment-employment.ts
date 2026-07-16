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
  },
}
