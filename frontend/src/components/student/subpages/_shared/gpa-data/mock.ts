/**
 * 学生端 GPA 详情 · 共享 Mock 数据
 *
 * 由 gpa-detail 和 gpa-semester 两个二级页面共用。
 * 所有派生数据（学期汇总 / 类别统计 / 总览）均由 courses 自动计算。
 */
import type {
  CategoryStatDTO,
  CourseRecordDTO,
  GpaDetailDTO,
  GpaOverviewDTO,
  SemesterSummaryDTO,
} from './types'
import { CATEGORY_LABEL, round1, round2, scoreToGpa } from './utils'

const semesters = [
  { label: '2022秋', index: 1 },
  { label: '2023春', index: 2 },
  { label: '2023秋', index: 3 },
  { label: '2024春', index: 4 },
]

/* ── 4 学期 40 门课程明细 ───────────────────────────────── */
const courses: CourseRecordDTO[] = [
  // ── 2022秋（大一上，9 门）───────────────────────────
  { id: 'c01', name: '高等数学 A',       semester: '2022秋', semesterIndex: 1, score: 88, credit: 5, category: 'general',    counted: true  },
  { id: 'c02', name: 'C 语言程序设计',   semester: '2022秋', semesterIndex: 1, score: 84, credit: 3, category: 'major-base', counted: true  },
  { id: 'c03', name: '大学英语 I',       semester: '2022秋', semesterIndex: 1, score: 79, credit: 4, category: 'humanity',   counted: true  },
  { id: 'c04', name: '思想道德修养',     semester: '2022秋', semesterIndex: 1, score: 92, credit: 2, category: 'humanity',   counted: true  },
  { id: 'c05', name: '体育 I',           semester: '2022秋', semesterIndex: 1, score: 76, credit: 1, category: 'art',        counted: true  },
  { id: 'c06', name: '军事理论',         semester: '2022秋', semesterIndex: 1, score: 85, credit: 1, category: 'general',    counted: true  },
  { id: 'c07', name: '计算机科学导论',   semester: '2022秋', semesterIndex: 1, score: 89, credit: 2, category: 'major-base', counted: true  },
  { id: 'c08', name: '大学物理 B',       semester: '2022秋', semesterIndex: 1, score: 82, credit: 4, category: 'general',    counted: true  },
  { id: 'c09', name: '新生研讨课',       semester: '2022秋', semesterIndex: 1, score: 94, credit: 1, category: 'general',    counted: true  },

  // ── 2023春（大一下，10 门）──────────────────────────
  { id: 'c10', name: '线性代数',         semester: '2023春', semesterIndex: 2, score: 86, credit: 3, category: 'general',    counted: true  },
  { id: 'c11', name: '大学英语 II',      semester: '2023春', semesterIndex: 2, score: 81, credit: 4, category: 'humanity',   counted: true  },
  { id: 'c12', name: '数据结构',         semester: '2023春', semesterIndex: 2, score: 62, credit: 4, category: 'major-core', counted: true  },
  { id: 'c13', name: '计算机网络',       semester: '2023春', semesterIndex: 2, score: 89, credit: 3, category: 'major-base', counted: true  },
  { id: 'c14', name: '体育 II',          semester: '2023春', semesterIndex: 2, score: 82, credit: 1, category: 'art',        counted: true  },
  { id: 'c15', name: '中国近现代史纲要', semester: '2023春', semesterIndex: 2, score: 90, credit: 2, category: 'humanity',   counted: true  },
  { id: 'c16', name: '认识实习',         semester: '2023春', semesterIndex: 2, score: 95, credit: 1, category: 'practice',   counted: false },
  { id: 'c17', name: '离散数学',         semester: '2023春', semesterIndex: 2, score: 78, credit: 3, category: 'major-base', counted: true  },
  { id: 'c18', name: '工程制图',         semester: '2023春', semesterIndex: 2, score: 74, credit: 2, category: 'major-base', counted: true  },
  { id: 'c19', name: '大学物理实验',     semester: '2023春', semesterIndex: 2, score: 87, credit: 1, category: 'practice',   counted: false },

  // ── 2023秋（大二上，10 门）──────────────────────────
  { id: 'c20', name: '概率论与数理统计', semester: '2023秋', semesterIndex: 3, score: 78, credit: 3, category: 'general',    counted: true  },
  { id: 'c21', name: '数据库原理',       semester: '2023秋', semesterIndex: 3, score: 84, credit: 3, category: 'major-core', counted: true  },
  { id: 'c22', name: '操作系统',         semester: '2023秋', semesterIndex: 3, score: 73, credit: 4, category: 'major-core', counted: true  },
  { id: 'c23', name: 'Python 程序设计',  semester: '2023秋', semesterIndex: 3, score: 92, credit: 3, category: 'major-base', counted: true  },
  { id: 'c24', name: '毛泽东思想概论',   semester: '2023秋', semesterIndex: 3, score: 87, credit: 3, category: 'humanity',   counted: true  },
  { id: 'c25', name: '体育 III',         semester: '2023秋', semesterIndex: 3, score: 80, credit: 1, category: 'art',        counted: true  },
  { id: 'c26', name: '创新创业基础',     semester: '2023秋', semesterIndex: 3, score: 90, credit: 1, category: 'general',    counted: true  },
  { id: 'c27', name: '软件工程导论',     semester: '2023秋', semesterIndex: 3, score: 86, credit: 3, category: 'major-core', counted: true  },
  { id: 'c28', name: '数据科学导论',     semester: '2023秋', semesterIndex: 3, score: 88, credit: 2, category: 'elective',   counted: true  },
  { id: 'c29', name: '算法竞赛实践',     semester: '2023秋', semesterIndex: 3, score: 94, credit: 2, category: 'practice',   counted: false },

  // ── 2024春（大二下，11 门）──────────────────────────
  { id: 'c30', name: '机器学习',         semester: '2024春', semesterIndex: 4, score: 95, credit: 4, category: 'major-core', counted: true  },
  { id: 'c31', name: '数据分析导论',     semester: '2024春', semesterIndex: 4, score: 90, credit: 3, category: 'major-core', counted: true  },
  { id: 'c32', name: 'Web 开发技术',     semester: '2024春', semesterIndex: 4, score: 88, credit: 3, category: 'elective',   counted: true  },
  { id: 'c33', name: '人工智能导论',     semester: '2024春', semesterIndex: 4, score: 91, credit: 2, category: 'major-base', counted: true  },
  { id: 'c34', name: '马克思主义原理',   semester: '2024春', semesterIndex: 4, score: 85, credit: 3, category: 'humanity',   counted: true  },
  { id: 'c35', name: '体育 IV',          semester: '2024春', semesterIndex: 4, score: 82, credit: 1, category: 'art',        counted: true  },
  { id: 'c36', name: '课程设计',         semester: '2024春', semesterIndex: 4, score: 93, credit: 2, category: 'practice',   counted: false },
  { id: 'c37', name: '深度学习应用',     semester: '2024春', semesterIndex: 4, score: 72, credit: 2, category: 'elective',   counted: true  },
  { id: 'c38', name: '自然语言处理',     semester: '2024春', semesterIndex: 4, score: 89, credit: 3, category: 'major-core', counted: true  },
  { id: 'c39', name: '云计算与大数据',   semester: '2024春', semesterIndex: 4, score: 83, credit: 2, category: 'elective',   counted: true  },
  { id: 'c40', name: '专业实习',         semester: '2024春', semesterIndex: 4, score: 91, credit: 4, category: 'practice',   counted: false },
]

/* ── 派生：学期汇总 ──────────────────────────────────────── */
function summarizeSemester(semesterIndex: number, label: string): SemesterSummaryDTO {
  const list = courses.filter((c) => c.semesterIndex === semesterIndex && c.counted)
  const credits = list.reduce((s, c) => s + c.credit, 0)
  const avgScore = credits > 0
    ? list.reduce((s, c) => s + c.score * c.credit, 0) / credits
    : 0
  const gpa = credits > 0
    ? list.reduce((s, c) => s + scoreToGpa(c.score) * c.credit, 0) / credits
    : 0
  return {
    semester: label,
    semesterIndex,
    gpa: round2(gpa),
    averageScore: round1(avgScore),
    totalCredits: credits,
    totalCourses: list.length,
    excellentCourses: list.filter((c) => c.score >= 90).length,
    failCourses: list.filter((c) => c.score < 60).length,
  }
}

/* ── 派生：类别统计（由 courses 实时计算）────────────────── */
function buildCategoryStats(): CategoryStatDTO[] {
  const counted = courses.filter((c) => c.counted)
  const byCategory = new Map<string, { credits: number; weightedScore: number; weightedGpa: number; courseCount: number; creditCount: number }>()

  for (const c of counted) {
    if (!byCategory.has(c.category)) {
      byCategory.set(c.category, { credits: 0, weightedScore: 0, weightedGpa: 0, courseCount: 0, creditCount: 0 })
    }
    const stat = byCategory.get(c.category)!
    stat.credits += c.credit
    stat.weightedScore += c.score * c.credit
    stat.weightedGpa += scoreToGpa(c.score) * c.credit
    stat.courseCount += 1
    stat.creditCount += c.credit
  }

  return Array.from(byCategory.entries()).map(([cat, s]) => ({
    category: cat as CategoryStatDTO['category'],
    categoryLabel: CATEGORY_LABEL[cat as keyof typeof CATEGORY_LABEL] ?? cat,
    gpa: s.credits > 0 ? round2(s.weightedGpa / s.credits) : 0,
    averageScore: s.credits > 0 ? round1(s.weightedScore / s.credits) : 0,
    courseCount: s.courseCount,
    creditCount: s.creditCount,
  }))
}

/* ── 派生：总览（由 courses 实时计算）────────────────────── */
function buildOverview(): GpaOverviewDTO {
  const counted = courses.filter((c) => c.counted)
  const totalCredits = counted.reduce((s, c) => s + c.credit, 0)
  const weightedAvg = totalCredits > 0
    ? counted.reduce((s, c) => s + c.score * c.credit, 0) / totalCredits
    : 0
  const weightedGpa = totalCredits > 0
    ? counted.reduce((s, c) => s + scoreToGpa(c.score) * c.credit, 0) / totalCredits
    : 0

  return {
    studentId: '2023001234',
    studentName: '张同学',
    major: '人工智能',
    grade: '2023级',
    cumulativeGpa: round2(weightedGpa),
    weightedAverage: round1(weightedAvg),
    earnedCredits: totalCredits,
    totalCredits: 160,
    excellentCount: counted.filter((c) => c.score >= 90).length,
    goodCount:      counted.filter((c) => c.score >= 80 && c.score < 90).length,
    mediumCount:    counted.filter((c) => c.score >= 70 && c.score < 80).length,
    passCount:      counted.filter((c) => c.score >= 60 && c.score < 70).length,
    failCount:      counted.filter((c) => c.score < 60).length,
    warningCount:   counted.filter((c) => c.score < 75).length,
    majorRankPercent: 96.8,
    majorTotal: 86,
    classRank: 3,
    classTotal: 45,
  }
}

const semestersSummary: SemesterSummaryDTO[] =
  semesters.map((s) => summarizeSemester(s.index, s.label))

export const mockGpaDetail: GpaDetailDTO = {
  overview: buildOverview(),
  semesters: semestersSummary,
  categoryStats: buildCategoryStats(),
  courses,
}
