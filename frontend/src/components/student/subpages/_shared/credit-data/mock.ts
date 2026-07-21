/**
 * 学生端"学分完成率"系列页面 · Mock 数据
 *
 * 培养方案（4 大类）+ 学生实际修读 + 自动派生（达成率 / 缺口提醒）
 */
import type {
  CategoryProgressDTO,
  CreditProgressDTO,
  PlanCategory,
  PlanCourseDTO,
} from './types'

/* ── 4 个培养方案类别 ────────────────────────────────────── */
const categoryRequirements: Array<{
  id: PlanCategory
  name: string
  requiredCredits: number
}> = [
  { id: 'general',    name: '公共基础课', requiredCredits: 30 },
  { id: 'major-base', name: '学科基础课', requiredCredits: 35 },
  { id: 'major-core', name: '专业核心课', requiredCredits: 40 },
  { id: 'elective',   name: '专业选修课', requiredCredits: 20 },
]

/* ── 培养方案课程列表 ───────────────────────────────────── */
const planCourses: PlanCourseDTO[] = [
  // ── 公共基础课（30 学分） ─────────────────
  { id: 'p01', name: '思想道德修养',     category: 'general', categoryLabel: '公共基础课', credit: 2, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 92, actualSemester: '2022秋' },
  { id: 'p02', name: '大学英语 I',       category: 'general', categoryLabel: '公共基础课', credit: 4, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 79, actualSemester: '2022秋' },
  { id: 'p03', name: '体育 I',           category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 76, actualSemester: '2022秋' },
  { id: 'p04', name: '军事理论',         category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 85, actualSemester: '2022秋' },
  { id: 'p05', name: '新生研讨课',       category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: false, status: 'completed',  score: 94, actualSemester: '2022秋' },
  { id: 'p06', name: '中国近现代史纲要', category: 'general', categoryLabel: '公共基础课', credit: 2, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 90, actualSemester: '2023春' },
  { id: 'p07', name: '大学英语 II',      category: 'general', categoryLabel: '公共基础课', credit: 4, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 81, actualSemester: '2023春' },
  { id: 'p08', name: '体育 II',          category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 82, actualSemester: '2023春' },
  { id: 'p09', name: '毛泽东思想概论',   category: 'general', categoryLabel: '公共基础课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 87, actualSemester: '2023秋' },
  { id: 'p10', name: '体育 III',         category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 80, actualSemester: '2023秋' },
  { id: 'p11', name: '马克思主义原理',   category: 'general', categoryLabel: '公共基础课', credit: 3, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 85, actualSemester: '2024春' },
  { id: 'p12', name: '体育 IV',          category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 82, actualSemester: '2024春' },
  { id: 'p13', name: '形势与政策',       category: 'general', categoryLabel: '公共基础课', credit: 2, recommendedSemester: 5, recommendedSemesterLabel: '大三上', required: true,  status: 'not-started' },
  { id: 'p14', name: '大学生心理健康',   category: 'general', categoryLabel: '公共基础课', credit: 2, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'not-started' }, // 漏修！缺口
  { id: 'p15', name: '职业生涯规划',     category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'not-started' }, // 漏修
  { id: 'p16', name: '就业指导',         category: 'general', categoryLabel: '公共基础课', credit: 1, recommendedSemester: 7, recommendedSemesterLabel: '大四上', required: true,  status: 'not-started' },

  // ── 学科基础课（35 学分） ─────────────────
  { id: 'p20', name: '高等数学 A',     category: 'major-base', categoryLabel: '学科基础课', credit: 5, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 88, actualSemester: '2022秋' },
  { id: 'p21', name: 'C 语言程序设计', category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 84, actualSemester: '2022秋' },
  { id: 'p22', name: '大学物理 B',     category: 'major-base', categoryLabel: '学科基础课', credit: 4, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 82, actualSemester: '2022秋' },
  { id: 'p23', name: '计算机科学导论', category: 'major-base', categoryLabel: '学科基础课', credit: 2, recommendedSemester: 1, recommendedSemesterLabel: '大一上', required: true,  status: 'completed',  score: 89, actualSemester: '2022秋' },
  { id: 'p24', name: '线性代数',       category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 86, actualSemester: '2023春' },
  { id: 'p25', name: '离散数学',       category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 78, actualSemester: '2023春' },
  { id: 'p26', name: '数据结构',       category: 'major-base', categoryLabel: '学科基础课', credit: 4, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 62, actualSemester: '2023春' }, // 低分预警
  { id: 'p27', name: '计算机网络',     category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: true,  status: 'completed',  score: 89, actualSemester: '2023春' },
  { id: 'p28', name: '工程制图',       category: 'major-base', categoryLabel: '学科基础课', credit: 2, recommendedSemester: 2, recommendedSemesterLabel: '大一下', required: false, status: 'completed',  score: 74, actualSemester: '2023春' },
  { id: 'p29', name: '概率论与数理统计', category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 78, actualSemester: '2023秋' },
  { id: 'p30', name: '复变函数',       category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'not-started' },
  { id: 'p31', name: 'Python 程序设计', category: 'major-base', categoryLabel: '学科基础课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 92, actualSemester: '2023秋' },

  // ── 专业核心课（40 学分） ─────────────────
  { id: 'p40', name: '数据库原理',     category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 84, actualSemester: '2023秋' },
  { id: 'p41', name: '操作系统',       category: 'major-core', categoryLabel: '专业核心课', credit: 4, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 73, actualSemester: '2023秋' },
  { id: 'p42', name: '软件工程导论',   category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: true,  status: 'completed',  score: 86, actualSemester: '2023秋' },
  { id: 'p43', name: '机器学习',       category: 'major-core', categoryLabel: '专业核心课', credit: 4, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 95, actualSemester: '2024春' },
  { id: 'p44', name: '数据分析导论',   category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 90, actualSemester: '2024春' },
  { id: 'p45', name: '人工智能导论',   category: 'major-core', categoryLabel: '专业核心课', credit: 2, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 91, actualSemester: '2024春' },
  { id: 'p46', name: '自然语言处理',   category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: true,  status: 'completed',  score: 89, actualSemester: '2024春' },
  { id: 'p47', name: '算法设计与分析', category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 5, recommendedSemesterLabel: '大三上', required: true,  status: 'not-started' },
  { id: 'p48', name: '深度学习',       category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 5, recommendedSemesterLabel: '大三上', required: true,  status: 'in-progress', score: 72, actualSemester: '2024春' }, // 跨学期
  { id: 'p49', name: '计算机视觉',     category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 6, recommendedSemesterLabel: '大三下', required: true,  status: 'not-started' },
  { id: 'p50', name: '模式识别',       category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 6, recommendedSemesterLabel: '大三下', required: true,  status: 'not-started' },
  { id: 'p51', name: '智能系统设计',   category: 'major-core', categoryLabel: '专业核心课', credit: 3, recommendedSemester: 7, recommendedSemesterLabel: '大四上', required: true,  status: 'not-started' },
  { id: 'p52', name: '毕业实习',       category: 'major-core', categoryLabel: '专业核心课', credit: 4, recommendedSemester: 7, recommendedSemesterLabel: '大四上', required: true,  status: 'not-started' },

  // ── 专业选修课（20 学分） ─────────────────
  { id: 'p60', name: '数据科学导论',   category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 3, recommendedSemesterLabel: '大二上', required: false, status: 'completed',  score: 88, actualSemester: '2023秋' },
  { id: 'p61', name: 'Web 开发技术',   category: 'elective', categoryLabel: '专业选修课', credit: 3, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: false, status: 'completed',  score: 88, actualSemester: '2024春' },
  { id: 'p62', name: '云计算与大数据', category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: false, status: 'completed',  score: 83, actualSemester: '2024春' },
  { id: 'p63', name: '深度学习应用',   category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 4, recommendedSemesterLabel: '大二下', required: false, status: 'completed',  score: 72, actualSemester: '2024春' },
  { id: 'p64', name: '移动应用开发',   category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 5, recommendedSemesterLabel: '大三上', required: false, status: 'not-started' },
  { id: 'p65', name: '嵌入式系统',     category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 5, recommendedSemesterLabel: '大三上', required: false, status: 'not-started' },
  { id: 'p66', name: '信息安全',       category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 6, recommendedSemesterLabel: '大三下', required: false, status: 'not-started' },
  { id: 'p67', name: '区块链技术',     category: 'elective', categoryLabel: '专业选修课', credit: 2, recommendedSemester: 7, recommendedSemesterLabel: '大四上', required: false, status: 'not-started' },
]

/* ── 派生：类别进度 ─────────────────────────────────────── */
function buildCategoryProgress(): CategoryProgressDTO[] {
  return categoryRequirements.map((req) => {
    const list = planCourses.filter((c) => c.category === req.id)
    const earnedCredits = list
      .filter((c) => c.status === 'completed' || c.status === 'in-progress')
      .reduce((s, c) => s + c.credit, 0)

    const completedCourseCount = list.filter((c) => c.status === 'completed').length
    const requiredCourseCount = list.filter((c) => c.required).length
    const remainingCourseCount = list.filter(
      (c) => c.required && c.status === 'not-started',
    ).length

    const remainingCredits = Math.max(0, req.requiredCredits - earnedCredits)
    const progress = req.requiredCredits > 0
      ? Math.min(100, (earnedCredits / req.requiredCredits) * 100)
      : 0

    let status: CategoryProgressDTO['status'] = 'in-progress'
    if (remainingCredits === 0 && remainingCourseCount === 0) {
      status = 'complete'
    } else if (earnedCredits === 0) {
      status = 'incomplete'
    }

    return {
      id: req.id,
      name: req.name,
      requiredCredits: req.requiredCredits,
      earnedCredits,
      remainingCredits,
      progress: Math.round(progress * 10) / 10,
      status,
      requiredCourseCount,
      completedCourseCount,
      remainingCourseCount,
    }
  })
}

/* ── 派生：缺口提醒（自动生成） ─────────────────────────── */
function buildGaps(categories: CategoryProgressDTO[]): import('./types').GapItemDTO[] {
  const gaps: import('./types').GapItemDTO[] = []

  for (const cat of categories) {
    // 学分缺口
    if (cat.remainingCredits > 0) {
      const severity: 'high' | 'medium' | 'low'
        = cat.progress < 50 ? 'high'
        : cat.progress < 80 ? 'medium'
        : 'low'

      const notStartedRequired = planCourses.filter(
        (c) => c.category === cat.id && c.required && c.status === 'not-started',
      )
      const relatedCourses = notStartedRequired.slice(0, 4).map((c) => c.name)

      const suggestionMap: Record<PlanCategory, string> = {
        general:      '重点关注通识必修，建议在公共课表空闲学期补修',
        'major-base': '学科基础关乎后续专业课学习，建议尽早补齐',
        'major-core': '专业核心直接影响毕业资格，需要重点跟进',
        elective:     '建议结合兴趣方向选修，避免毕业前临时凑学分',
      }

      gaps.push({
        categoryId: cat.id,
        categoryName: cat.name,
        type: 'credits',
        severity,
        remaining: cat.remainingCredits,
        description: `还需修 ${cat.remainingCredits} 学分（已修 ${cat.earnedCredits} / 应修 ${cat.requiredCredits}）`,
        suggestion: suggestionMap[cat.id],
        relatedCourses: relatedCourses.length ? relatedCourses : undefined,
      })
    }

    // 必修课漏修提醒
    if (cat.remainingCourseCount > 0 && cat.remainingCredits === 0) {
      const notStartedRequired = planCourses.filter(
        (c) => c.category === cat.id && c.required && c.status === 'not-started',
      )
      gaps.push({
        categoryId: cat.id,
        categoryName: cat.name,
        type: 'courses',
        severity: 'medium',
        remaining: cat.remainingCourseCount,
        description: `${cat.remainingCourseCount} 门必修课尚未修读`,
        suggestion: '学分已通过其他课程凑够，但建议补修以下必修课以满足培养方案',
        relatedCourses: notStartedRequired.slice(0, 4).map((c) => c.name),
      })
    }
  }

  // 不及格课程
  const failedCourses = planCourses.filter((c) => c.status === 'failed')
  if (failedCourses.length > 0) {
    gaps.push({
      categoryId: failedCourses[0].category,
      categoryName: '不及格预警',
      type: 'courses',
      severity: 'high',
      remaining: failedCourses.length,
      description: `${failedCourses.length} 门课程不及格，需要补考或重修`,
      suggestion: '建议安排任课教师辅导，并跟踪补考结果',
      relatedCourses: failedCourses.map((c) => c.name),
    })
  }

  return gaps
}

/* ── 组装最终 DTO ───────────────────────────────────────── */
const categories = buildCategoryProgress()
const gaps = buildGaps(categories)

export const mockCreditProgress: CreditProgressDTO = {
  summary: {
    studentId: '2023001234',
    studentName: '张同学',
    major: '人工智能',
    grade: '2023级',
    trainingPlanName: '软件工程专业本科教学计划',
    totalRequiredCredits: categoryRequirements.reduce((s, c) => s + c.requiredCredits, 0),
    totalEarnedCredits: categories.reduce((s, c) => s + c.earnedCredits, 0),
    countedGpaCredits: planCourses
      .filter((c) => c.status === 'completed')
      .reduce((s, c) => s + c.credit, 0),
    overallProgress: 0,
    categories,
    gaps,
  },
  courses: planCourses,
}
