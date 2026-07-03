import type { HighPotentialOverviewDTO } from '@/types/api/college/high-potential'

export const mockHighPotentialOverview: HighPotentialOverviewDTO = {
  summary: {
    total: 486,
    change: '+186人',
    coverage: '68.5%',
    activeRate: '92.4%',
    trend: {
      months: ['9月', '10月', '11月', '12月', '1月', '2月'],
      counts: [312, 328, 356, 398, 442, 486],
    },
    kpis: [
      { label: '四六级高分率', value: '76.8', unit: '%' },
      { label: '学分完成优秀', value: '89.2', unit: '%' },
      { label: '竞赛参与率', value: '68.5', unit: '%' },
      { label: '优质实习率', value: '54.3', unit: '%' },
    ],
  },
  modules: [
    {
      id: 'academic',
      title: '学业高潜',
      desc: 'GPA 排名曲线、优势课程高亮；四六级高分、学分完成度优秀、排名靠前均为高潜标签。',
      tags: ['四六级高分', '学分完成度优秀', '排名靠前', '绩点持续上升', '专业前10%'],
      stats: [
        { label: 'GPA≥3.5', value: '312', unit: '人' },
        { label: '六级≥500', value: '186', unit: '人' },
        { label: '无挂科记录', value: '428', unit: '人' },
      ],
      cardMetric: { label: 'GPA≥3.5', value: '312', unit: '人' },
    },
    {
      id: 'competition',
      title: '竞赛高潜',
      desc: '学科竞赛、论文发表、科研项目与科研训练成果时序展示。',
      timeline: [
        { date: '2025-05', title: '全国大学生数学建模竞赛', level: '国家二等奖' },
        { date: '2025-04', title: '「互联网+」创新创业大赛', level: '省级金奖' },
        { date: '2025-03', title: 'ACM程序设计竞赛', level: '省级一等奖' },
        { date: '2024-12', title: '大学生创新创业训练计划', level: '国家级立项' },
      ],
      aiRecommend: [
        '推荐参加「挑战杯」课外学术科技竞赛',
        '匹配导师科研项目：智能金融风控',
        '建议申报大学生创新训练计划（国家级）',
      ],
      stats: [
        { label: '省级以上获奖', value: '128', unit: '人次' },
        { label: '论文/专利', value: '46', unit: '项' },
      ],
      cardMetric: { label: '省级以上获奖', value: '128', unit: '人次' },
    },
    {
      id: 'leadership',
      title: '干部奉献高潜',
      desc: '学生干部、大型活动组织、长期志愿服务与重大社会服务经历。',
      highlights: [
        { label: '学生干部', value: '128', unit: '人' },
        { label: '大型活动组织', value: '36', unit: '场' },
        { label: '校级荣誉', value: '52', unit: '人次' },
        { label: '志愿服务', value: '8,620', unit: '小时' },
      ],
      events: ['学院科技文化节总策划 12 人', '迎新晚会执行统筹 28 人', '社区志愿服务骨干 45 人'],
      cardMetric: { label: '学生干部', value: '128', unit: '人' },
    },
    {
      id: 'rural',
      title: '三下乡实践高潜',
      desc: '三下乡、乡村振兴、社会调研与普法宣传等实践经历，展示学生知行合一与服务社会能力。',
      highlights: [
        { label: '实践队伍', value: '24', unit: '支' },
        { label: '覆盖乡镇', value: '18', unit: '个' },
        { label: '服务村民', value: '3,200+', unit: '人' },
      ],
      cardMetric: { label: '实践队伍', value: '24', unit: '支' },
    },
    {
      id: 'internship',
      title: '实习项目高潜',
      desc: '优质实习、校企重点项目、专利证书、代码/系统开发成果与深度参与导师项目均为高潜成果。',
      highlights: [
        { label: '名企实习', value: '86', unit: '人' },
        { label: '科研助理', value: '68', unit: '人' },
        { label: '实习优秀率', value: '91.2', unit: '%' },
      ],
      cardMetric: { label: '优质实习', value: '86', unit: '人' },
    },
    {
      id: 'career',
      title: '就业升学高潜',
      desc: '升学深造、名企就业、公务员与创新创业等发展路径，展示高潜学生出口质量与发展后劲。',
      highlights: [
        { label: '升学深造', value: '360', unit: '人' },
        { label: '名企 offer', value: '128', unit: '人' },
        { label: '选调/公考', value: '24', unit: '人' },
      ],
      cardMetric: { label: '名企就业', value: '52', unit: '%' },
    },
  ],
}
