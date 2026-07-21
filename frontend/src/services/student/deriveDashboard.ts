import type { StudentDashboardDTO } from '@/types/student/api'
import type { StudentAcademicRow } from './academicRow'

const REQUIRED_CREDITS_BY_ENROLL_YEAR: Record<number, number> = {
  2022: 160,
  2023: 120,
  2024: 80,
  2025: 40,
}
const DEFAULT_REQUIRED_CREDITS = 160
const ACADEMIC_HIGH_POTENTIAL_PERCENTILE = 0.15
const CET6_PASS = 425

function num(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function int(value: unknown): number {
  return Math.trunc(num(value))
}

export interface RankResult {
  rank: number
  total: number
  percentile: number
}

export function denseRankByGpa(studentId: string, peers: StudentAcademicRow[]): RankResult {
  const scored = peers
    .map((p) => ({ id: String(p.student_id || ''), gpa: num(p.average_credit_gpa) }))
    .filter((p) => p.id)
  if (!scored.length) return { rank: 0, total: 0, percentile: 0 }

  scored.sort((a, b) => b.gpa - a.gpa || a.id.localeCompare(b.id))
  const ranks = new Map<string, number>()
  let prev: number | null = null
  let current = 0
  scored.forEach((row, index) => {
    if (prev === null || row.gpa !== prev) {
      current = index + 1
      prev = row.gpa
    }
    ranks.set(row.id, current)
  })

  const rank = ranks.get(String(studentId)) ?? 0
  const total = scored.length
  const percentile =
    total <= 1 || rank <= 0 ? (rank === 1 ? 1 : 0) : Math.max(0, Math.min(1, 1 - (rank - 1) / (total - 1)))
  return { rank, total, percentile }
}

export function parseCompetitionDetail(detail?: string | null) {
  if (!detail?.trim()) return [] as Array<{ name: string; level: string; date: string | null }>
  const text = detail.replace(/\r\n/g, '\n').replace(/；/g, ';').replace(/\n/g, ';')
  const chunks = text.split(';').map((c) => c.trim()).filter(Boolean)
  const levelPat = /(国家级|省部级|省级|市级|校级)/
  const datePat = /(20\d{2}\s*年\s*\d{1,2}\s*月|20\d{2}-\d{1,2})/

  return chunks.map((chunk) => {
    const levelM = chunk.match(levelPat)
    const dateM = chunk.match(datePat)
    let level = levelM?.[1] ?? '校级'
    if (level === '省级') level = '省部级'
    let date: string | null = null
    if (dateM?.[1]) {
      date = dateM[1].replace(/\s+/g, '').replace('年', '-').replace('月', '')
    }
    return { name: chunk.slice(0, 120), level, date }
  })
}

/** 去除奖项名末尾的年份（如 ，2023年 / 2023 / 2023年5月 / 2023-05） */
function stripTrailingYear(name: string): string {
  return name
    .replace(/[,，、]\s*(20\d{2}\s*年\s*\d{1,2}\s*月|20\d{2}\s*年|20\d{2}-\d{1,2}|20\d{2})\s*$/, '')
    .replace(/\s*[-－]\s*$/, '')
    .trim()
}

function requiredCredits(grade: number | null | undefined) {
  if (!grade) return DEFAULT_REQUIRED_CREDITS
  return REQUIRED_CREDITS_BY_ENROLL_YEAR[grade] ?? DEFAULT_REQUIRED_CREDITS
}

function academicRiskLevel(record: StudentAcademicRow): 'low' | 'medium' | 'high' {
  const failed = num(record.failed_total_credits)
  const makeup = int(record.makeup_exam_count)
  const retake = int(record.retake_count)
  const absent = int(record.absent_exam_count)
  const gpa = num(record.average_credit_gpa)
  if (failed >= 10 || makeup >= 4 || (gpa > 0 && gpa < 2.0)) return 'high'
  if (failed > 0 || makeup >= 2 || retake >= 2 || absent >= 2 || (gpa > 0 && gpa < 2.5)) return 'medium'
  return 'low'
}

const CADRE_TITLES = [
  '班长',
  '副班长',
  '团支书',
  '副团支书',
  '学习委员',
  '生活委员',
  '文体委员',
  '文艺委员',
  '体育委员',
  '心理委员',
  '组织委员',
  '宣传委员',
  '纪检委员',
  '科技委员',
  '党支书',
  '寝室长',
  '舍长',
] as const

function extractCadreRoles(...texts: Array<string | null | undefined>): string[] {
  const blob = texts.filter(Boolean).join('｜')
  if (!blob) return []
  return CADRE_TITLES.filter((title) => blob.includes(title))
}

function sidHash(studentId: string): number {
  const sid = String(studentId || '')
  let h = 0
  for (let i = 0; i < sid.length; i++) h = (h + sid.charCodeAt(i) * (i + 3)) % 997
  return h
}

/** 演示用：无台账职务时，按学号稳定分配班干部（约 1/3） */
function mockCadreRoles(studentId: string, existing: string[]): string[] {
  if (existing.length) return existing
  const sid = String(studentId || '')
  if (!sid) return []
  const h = sidHash(sid)
  if (h % 3 !== 0) return []
  const pool = ['班长', '团支书', '副班长', '学习委员', '组织委员'] as const
  return [pool[h % pool.length]!]
}

/** 演示用：政治面貌缺失时按学号稳定补齐 */
function mockPoliticalStatus(studentId: string, existing?: string | null): string {
  if (existing && String(existing).trim()) return String(existing).trim()
  const pool = ['中共党员', '中共预备党员', '共青团员', '共青团员', '群众'] as const
  return pool[sidHash(studentId) % pool.length]!
}

/**
 * 出口发展相关课程成绩：台账均分 + 关键科目（高数/英语/思政）演示补齐，
 * 支撑考研 / 考公 / 就业三个视角的对口事实展示。
 */
function buildKeyCourseGrades(
  studentId: string,
  gpa: number,
  averages: Array<{ name: string; score: number }>,
): Array<{ name: string; score: number; rank: number }> {
  const base = gpa > 0 ? Math.min(94, Math.round(68 + gpa * 7)) : 78
  const h = sidHash(studentId)
  const scoreOf = (salt: number, bias = 0) => {
    const jitter = ((h + salt * 19) % 13) - 6
    return Math.max(55, Math.min(98, base + bias + jitter))
  }
  const keyed = [
    { name: '高等数学', score: scoreOf(1, 2) },
    { name: '线性代数', score: scoreOf(2, 0) },
    { name: '大学英语', score: scoreOf(3, -2) },
    { name: '思想道德与法治', score: scoreOf(4, 4) },
    { name: '毛泽东思想概论', score: scoreOf(5, 3) },
    { name: '马克思主义原理', score: scoreOf(6, 2) },
  ]
  const byName = new Map<string, number>()
  for (const row of averages) {
    if (row.score > 0) byName.set(row.name, row.score)
  }
  for (const row of keyed) {
    if (!byName.has(row.name)) byName.set(row.name, row.score)
  }
  return Array.from(byName.entries()).map(([name, score]) => ({
    name,
    score: Math.round(score * 10) / 10,
    rank: 0,
  }))
}

/** 演示用：实习/项目台账（业务接入前按学号稳定生成） */
function buildInternshipLedger(
  studentId: string,
  destination: string,
): {
  internshipCount: number
  projectCount: number
  certificateCount: number
  items: Array<{ name: string; type: string }>
} {
  const h = sidHash(studentId)
  const hasIntern = /企业|就业|创业|实习/.test(destination) || h % 4 !== 0
  const internPool = [
    '中软国际 · Java 后端开发实习生',
    '科大讯飞 · 算法助理实习生',
    '本地政务信息化 · 前端开发实习',
    '银行科技岗 · 业务系统测试实习',
  ] as const
  const projectPool = [
    '校园二手交易平台（Vue3 + Spring Boot）',
    '课程推荐系统（协同过滤实验）',
    '智慧图书馆管理系统',
  ] as const
  const items: Array<{ name: string; type: string }> = []
  if (hasIntern) {
    items.push({ type: '实习', name: internPool[h % internPool.length]! })
  }
  items.push({ type: '项目', name: projectPool[(h + 2) % projectPool.length]! })
  if (h % 3 === 0) {
    items.push({ type: '证书', name: '计算机二级（Java）' })
  }
  return {
    internshipCount: items.filter((x) => x.type === '实习').length,
    projectCount: items.filter((x) => x.type === '项目').length,
    certificateCount: items.filter((x) => x.type === '证书').length,
    items,
  }
}

function buildHighPotentialTags(record: StudentAcademicRow, majorRank: RankResult): string[] {
  const tags: string[] = []
  const gpa = num(record.average_credit_gpa)
  const failed = num(record.failed_total_credits)
  const awards = int(record.competition_award_count)
  const detail = String(record.competition_award_detail || '')
  const inTop =
    majorRank.total > 0 &&
    majorRank.rank > 0 &&
    majorRank.rank / majorRank.total <= ACADEMIC_HIGH_POTENTIAL_PERCENTILE

  if (gpa > 0 && failed === 0 && (inTop || gpa >= 3.5)) tags.push('学业高潜')

  const parsed = parseCompetitionDetail(detail)
  const highLevel = parsed.some((p) => p.level === '国家级' || p.level === '省部级')
  if (awards >= 1 && (highLevel || /国家级|省部级|省级/.test(detail))) tags.push('竞赛高潜')
  else if (awards >= 2) tags.push('竞赛高潜')
  if (
    /大创|科研|论文|专利|软著|创新创业/.test(detail) ||
    (gpa >= 3.2 && awards >= 1 && /项目|研究/.test(detail))
  ) {
    tags.push('科研高潜')
  }
  if (extractCadreRoles(detail).length || /优干|优秀学生干部|班干部/.test(detail)) {
    tags.push('干部奉献高潜')
  }
  return tags
}

function buildGradeNeighbors(studentId: string, peers: StudentAcademicRow[], windowSize = 3) {
  const scored = peers
    .map((p) => ({
      id: String(p.student_id || ''),
      name: String(p.name || '').trim() || '同学',
      gpa: num(p.average_credit_gpa),
    }))
    .filter((p) => p.id)
  if (!scored.length) return { ahead: [] as Array<{ name: string; gpa: number; rank: number; studentId: string }>, behind: [] as Array<{ name: string; gpa: number; rank: number; studentId: string }> }

  scored.sort((a, b) => b.gpa - a.gpa || a.id.localeCompare(b.id))
  const ranked: Array<{ name: string; gpa: number; rank: number; studentId: string }> = []
  let prev: number | null = null
  let current = 0
  scored.forEach((row, index) => {
    if (prev === null || row.gpa !== prev) {
      current = index + 1
      prev = row.gpa
    }
    ranked.push({ name: row.name, gpa: Math.round(row.gpa * 100) / 100, rank: current, studentId: row.id })
  })

  const idx = ranked.findIndex((r) => r.studentId === String(studentId))
  if (idx < 0) return { ahead: [], behind: [] }
  return {
    ahead: ranked.slice(Math.max(0, idx - windowSize), idx),
    behind: ranked.slice(idx + 1, idx + 1 + windowSize),
  }
}

function buildCareerBenchmarks(opts: {
  gpa: number
  awards: number
  tags: string[]
  direction: string
}) {
  const { gpa, awards, tags, direction } = opts
  const academicStar = tags.includes('学业高潜') || gpa >= 3.5
  const contestStar = tags.includes('竞赛高潜') || awards >= 2
  const researchStar = tags.includes('科研高潜')

  if (academicStar || researchStar) {
    return {
      employmentDestination: (gpa >= 3.55 ? '考研备考' : '企业就业') as
        | '考研备考'
        | '企业就业',
      targetUniversities: ['中山大学', '华南理工大学', '暨南大学'],
      targetCompanies: contestStar || researchStar
        ? ['腾讯', '华为', '字节跳动']
        : ['华为', '招商银行', '网易'],
      targetCity: '广州 / 深圳',
      expectedSalary: gpa >= 3.5 ? '12-20K' : '10-16K',
    }
  }
  if (contestStar) {
    return {
      employmentDestination: '企业就业' as const,
      targetUniversities: ['华南师范大学', '广东工业大学', '深圳大学'],
      targetCompanies: ['腾讯云', '中兴', '顺丰科技'],
      targetCity: '广州 / 深圳',
      expectedSalary: '10-16K',
    }
  }
  if (/考研|升学|深造/.test(direction)) {
    return {
      employmentDestination: '考研备考' as const,
      targetUniversities: ['广东财经大学（保研/考研）', '华南师范大学', '广东工业大学'],
      targetCompanies: ['银行科技岗', '政务信息化', '本地国企'],
      targetCity: '广州',
      expectedSalary: '未填报',
    }
  }
  return {
    employmentDestination: '待实习' as const,
    targetUniversities: ['待明确升学目标'],
    targetCompanies: ['待明确就业目标'],
    targetCity: '未填报',
    expectedSalary: '未填报',
  }
}

function competitionPercentile(record: StudentAcademicRow, peers: StudentAcademicRow[]) {
  const mine = int(record.competition_award_count)
  const values = peers.map((p) => int(p.competition_award_count)).sort((a, b) => b - a)
  if (!values.length) return 0
  const better = values.filter((v) => v > mine).length
  return Math.max(0, Math.min(1, 1 - better / values.length))
}

const RESEARCH_LABEL_RE = /大创|科研|论文|专利|软著|课题|发表|创新项目/

function isResearchAwardName(name: string) {
  return RESEARCH_LABEL_RE.test(name)
}

/** 从竞赛明细里拆出奖学金条目；无真实数据时按学业表现稳定演示。 */
function buildScholarships(
  studentId: string,
  gpa: number,
  awardsN: number,
  majorPercentile: number,
  parsedAwards: Array<{ name: string; date: string | null }>,
): Array<{ name: string; year: string }> {
  const fromDetail = parsedAwards
    .filter((a) => /奖学金/.test(a.name))
    .map((a) => {
      const yearM = a.name.match(/20\d{2}/) || a.date?.match(/20\d{2}/)
      return {
        name: stripTrailingYear(a.name).replace(/^[·\s,，]+|[·\s,，]+$/g, '').slice(0, 40) || '奖学金',
        year: yearM?.[0] ? `${yearM[0]}-${Number(yearM[0]) + 1}` : '2024-2025',
      }
    })
  if (fromDetail.length) return fromDetail

  const list: Array<{ name: string; year: string }> = []
  const year = '2024-2025'
  if (gpa >= 3.8 && (majorPercentile >= 0.9 || awardsN >= 3)) {
    list.push({ name: '国家奖学金', year })
  } else if (gpa >= 3.5 && awardsN >= 1) {
    list.push({ name: '国家励志奖学金', year })
  }
  if (gpa >= 3.7 || majorPercentile >= 0.85) {
    list.push({ name: '校级一等奖学金', year })
  } else if (gpa >= 3.4 || majorPercentile >= 0.7) {
    list.push({ name: '校级二等奖学金', year })
  } else if (gpa >= 3.0 && sidHash(studentId) % 3 === 0) {
    list.push({ name: '校级三等奖学金', year })
  }
  return list
}

/** 综合素养：综测 30% + 奖学金 30% + 竞赛 30% + 科研 10% */
function calcQualityScore(opts: {
  zongceScore: number
  scholarshipCount: number
  awardsN: number
  researchCount: number
  compPct: number
}) {
  const zongcePart = Math.max(50, Math.min(98, opts.zongceScore))
  const schPart = Math.min(95, 55 + opts.scholarshipCount * 12)
  const compAbs = Math.min(95, 55 + Math.min(opts.awardsN, 6) * 7)
  const compRel = 60 + opts.compPct * 35
  const compPart = Math.round((0.55 * compAbs + 0.45 * compRel) * 10) / 10
  const researchPart = Math.min(95, 55 + opts.researchCount * 14)
  return Math.round((0.3 * zongcePart + 0.3 * schPart + 0.3 * compPart + 0.1 * researchPart) * 10) / 10
}

/** 演示综测分：学业为主，竞赛/奖学金/科研作素质加分（业务接入后替换） */
function calcZongceScore(opts: {
  gpa: number
  gradePercentile: number
  awardsN: number
  scholarshipCount: number
  researchCount: number
}) {
  const academic = opts.gpa > 0 ? Math.max(0, Math.min(100, (opts.gpa / 4) * 100)) : 60
  const peer = 60 + opts.gradePercentile * 35
  const bonus = Math.min(12, opts.awardsN * 1.5 + opts.scholarshipCount * 2 + opts.researchCount * 2)
  return Math.round(Math.max(50, Math.min(98, 0.65 * academic + 0.35 * peer + bonus)) * 10) / 10
}

function buildAnnualAssessments(zongceScore: number, grade: number | null): Array<{ year: string; score: number; level: string }> {
  const levelOf = (s: number) => (s >= 90 ? '优秀' : s >= 80 ? '良好' : s >= 70 ? '中等' : '合格')
  const yearsIn = grade ? Math.max(1, Math.min(4, 2026 - grade + 1)) : 2
  const out: Array<{ year: string; score: number; level: string }> = []
  for (let i = yearsIn - 1; i >= 0; i--) {
    const y0 = 2025 - i
    const drift = (yearsIn - 1 - i) * 1.2 - 1.5
    const score = Math.round(Math.max(55, Math.min(98, zongceScore + drift)) * 10) / 10
    out.push({ year: `${y0}-${y0 + 1}`, score, level: levelOf(score) })
  }
  return out
}

function recommendDirection(record: StudentAcademicRow) {
  const major = String(record.major_name || '')
  const detail = String(record.competition_award_detail || '')
  const gpa = num(record.average_credit_gpa)
  const majorAvg = num(record.major_course_avg_score)
  const awards = int(record.competition_award_count)
  const blob = major + detail
  const jobs: Array<[string, number]> = []

  if (/人工智能|机器学习|深度学习|AI/i.test(blob)) jobs.push(['AI 应用开发工程师', 78 + Math.min(12, awards * 3)])
  if (/数据|大数据|分析/.test(blob)) jobs.push(['数据分析师', 74 + Math.min(10, awards * 2)])
  if (/软件|程序|算法|蓝桥|ACM|Java|C\+\+/i.test(blob)) jobs.push(['软件开发工程师', 72 + Math.min(12, awards * 2)])
  if (/电商|商务|营销/.test(blob)) jobs.push(['电商运营专员', 70 + Math.min(8, awards * 2)])

  let fallback: Array<[string, number]>
  if (/软件|计算机/.test(major)) fallback = [['软件开发工程师', 68], ['数据分析师', 62], ['实施与运维工程师', 58]]
  else if (/人工智能/.test(major)) fallback = [['AI 应用开发工程师', 70], ['算法工程师（初级）', 64], ['数据分析师', 60]]
  else if (/数据/.test(major)) fallback = [['数据分析师', 70], ['数据治理专员', 64], ['商务分析助理', 58]]
  else fallback = [['专业技术岗', 60], ['职能支持岗', 55], ['继续学业深造', 58]]

  const base = (jobs.length ? jobs : fallback).slice(0, 3)
  let adj = 0
  if (gpa >= 3.5) adj += 6
  else if (gpa >= 3.0) adj += 3
  if (majorAvg >= 85) adj += 4

  const catalog: Record<string, { city: string; salary: string; requirements: string; reason: string }> = {
    'AI 应用开发工程师': {
      city: '深圳 / 广州',
      salary: '12-20K',
      requirements: 'Python/深度学习基础；有项目作品优先',
      reason: '专业与竞赛关键词匹配 AI 方向',
    },
    '算法工程师（初级）': {
      city: '深圳 / 杭州',
      salary: '15-25K',
      requirements: '算法与数学基础；刷题/竞赛经历加分',
      reason: '人工智能专业方向匹配',
    },
    数据分析师: {
      city: '广州 / 深圳',
      salary: '10-18K',
      requirements: 'SQL/Python；业务分析与可视化',
      reason: '数据类课程与竞赛经历匹配',
    },
    数据治理专员: {
      city: '广州 / 深圳',
      salary: '9-15K',
      requirements: '数据标准/质量意识；沟通协作',
      reason: '数据专业路径备选',
    },
    软件开发工程师: {
      city: '深圳 / 广州 / 珠海',
      salary: '10-18K',
      requirements: 'Java/前端或全栈；工程化实践',
      reason: '软件/程序类能力画像匹配',
    },
    实施与运维工程师: {
      city: '广州 / 深圳',
      salary: '8-14K',
      requirements: 'Linux/部署运维基础；抗压沟通',
      reason: '工程落地岗位备选',
    },
    电商运营专员: {
      city: '广州',
      salary: '7-12K',
      requirements: '运营思维；数据分析与内容策划',
      reason: '电商/商务相关背景匹配',
    },
    商务分析助理: {
      city: '广州 / 深圳',
      salary: '8-13K',
      requirements: 'Excel/SQL；业务报表能力',
      reason: '数据分析向商务场景迁移',
    },
    专业技术岗: {
      city: '粤港澳大湾区',
      salary: '8-15K',
      requirements: '专业课程扎实；可展示项目',
      reason: '通用专业技术方向',
    },
    职能支持岗: {
      city: '粤港澳大湾区',
      salary: '6-10K',
      requirements: '沟通协作；办公软件熟练',
      reason: '综合能力备选路径',
    },
    继续学业深造: {
      city: '国内重点高校 / 境外',
      salary: '—',
      requirements: 'GPA与英语达标；科研/竞赛亮点',
      reason: '学业表现支持深造路径',
    },
  }

  const matches = base
    .map(([role, score]) => {
      const meta = catalog[role] ?? {
        city: '粤港澳大湾区',
        salary: '面议',
        requirements: '待补充岗位画像',
        reason: '规则推荐参考岗位',
      }
      return {
        role,
        match: Math.max(45, Math.min(95, Math.round(score + adj))),
        city: meta.city,
        salary: meta.salary,
        requirements: meta.requirements,
        reason: meta.reason,
      }
    })
    .sort((a, b) => b.match - a.match)
  return { direction: matches[0].role, match: matches[0].match, jobMatches: matches }
}

function dormText(record: StudentAcademicRow) {
  const building = String(record.building || '').trim()
  const dorm = String(record.dormitory_name || '').trim()
  if (building && dorm) return `${building} ${dorm}`
  return building || dorm || ''
}

/** 辅导员联系电话（模拟）：按姓名稳定生成，便于演示联络 */
function mockCounselorPhone(counselor: string, studentId: string) {
  const name = String(counselor || '').trim()
  if (!name) return undefined
  const seed = [...name, ...String(studentId || '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const prefixes = ['138', '139', '136', '137', '186', '188', '150', '159']
  const mid = String(1000 + (seed % 9000)).slice(0, 4)
  const tail = String(1000 + ((seed * 7) % 9000)).slice(0, 4)
  return `${prefixes[seed % prefixes.length]}${mid}${tail}`
}

function avatarUrl(record: StudentAcademicRow) {
  const filename = String(record.photo_filename || '').trim()
  if (filename) {
    // 中文文件名需编码；Vite 中间件会 decode 后读盘
    return `/student-photos/${encodeURIComponent(filename)}`
  }
  const existing = String(record.student_picture_path || '').trim()
  if (existing.startsWith('/student-photos/')) return existing
  if (existing.startsWith('http')) return existing
  const sid = String(record.student_id || '')
  // 无文件名时仍按学号试探（中间件会匹配 学号_*）
  return sid ? `/student-photos/${encodeURIComponent(sid)}` : undefined
}

export function deriveStudentDashboard(
  record: StudentAcademicRow,
  opts: {
    classPeers: StudentAcademicRow[]
    majorPeers: StudentAcademicRow[]
    gradePeers: StudentAcademicRow[]
    collegeName?: string
  },
): StudentDashboardDTO {
  const sid = String(record.student_id || '')
  const gpa = num(record.average_credit_gpa)
  const grade = int(record.grade) || null
  const awardsN = int(record.competition_award_count)
  const failed = num(record.failed_total_credits)

  const classRank = denseRankByGpa(sid, opts.classPeers.length ? opts.classPeers : [record])
  const majorRank = denseRankByGpa(sid, opts.majorPeers.length ? opts.majorPeers : [record])
  const gradeRank = denseRankByGpa(sid, opts.gradePeers.length ? opts.gradePeers : [record])

  const tags = buildHighPotentialTags(record, majorRank)
  const risk = academicRiskLevel(record)
  const required = Math.max(requiredCredits(grade), num(record.major_total_credits) || 0)
  const earned = num(record.earned_total_credits)
  const earnedPercent = required > 0 ? Math.round(Math.min(100, (earned / required) * 100)) : 0

  const parsedAwards = parseCompetitionDetail(record.competition_award_detail)
  const compPct = competitionPercentile(record, opts.gradePeers.length ? opts.gradePeers : [record])
  const gpaScore = gpa > 0 ? Math.max(0, Math.min(100, (gpa / 4) * 100)) : 0
  const academicScore = Math.round((0.65 * gpaScore + 0.35 * (majorRank.percentile * 100)) * 10) / 10
  const cet4Raw = num(record.cet4_score)
  const cet6Raw = num(record.cet6_score)
  /** 业务未接入时按学号稳定演示四六级，避免出口考研视角空态（不参与综合素养） */
  const cet4 =
    cet4Raw > 0
      ? cet4Raw
      : 425 + (sidHash(String(record.student_id || '')) % 120)
  const cet6 =
    cet6Raw > 0
      ? cet6Raw
      : gpa >= 3.2
        ? 430 + (sidHash(String(record.student_id || '') + '6') % 100)
        : 0
  const researchCount = parsedAwards.filter((a) => isResearchAwardName(a.name)).length
  const scholarships = buildScholarships(sid, gpa, awardsN, majorRank.percentile, parsedAwards)
  const zongceScore = calcZongceScore({
    gpa,
    gradePercentile: gradeRank.percentile,
    awardsN,
    scholarshipCount: scholarships.length,
    researchCount,
  })
  const annualAssessments = buildAnnualAssessments(zongceScore, grade)
  const growthTrend: 'positive' | 'negative' | 'stable' =
    gpa >= 3.5 ? 'positive' : gpa > 0 && gpa < 2.5 ? 'negative' : 'stable'
  const gpaPoints =
    growthTrend === 'positive'
      ? [Math.max(0, gpa - 0.28), Math.max(0, gpa - 0.16), Math.max(0, gpa - 0.06), gpa]
      : growthTrend === 'negative'
        ? [Math.min(4, gpa + 0.22), Math.min(4, gpa + 0.1), gpa + 0.04, gpa]
        : [Math.max(0, gpa - 0.08), gpa + 0.02, Math.max(0, gpa - 0.03), gpa]
  const gpaTrendValues = gpaPoints.map((v) => Math.round(Math.max(0, Math.min(4.5, v)) * 100) / 100)
  /** 近学期标签：按年级推到当前学年，输出「大X上/下」 */
  const gpaTrendSemesters = (() => {
    const all = ['大一上', '大一下', '大二上', '大二下', '大三上', '大三下', '大四上', '大四下'] as const
    const yearsIn = grade ? Math.max(1, Math.min(4, 2026 - grade + 1)) : 2
    const end = Math.min(all.length, yearsIn * 2)
    const start = Math.max(0, end - gpaTrendValues.length)
    return all.slice(start, end)
  })()

  const thesisByGrade = (() => {
    if (!grade) return '未开始'
    const yearsIn = 2026 - grade
    if (yearsIn <= 2) return '未开始'
    if (yearsIn === 3) return '选题'
    if (yearsIn === 4) return '开题'
    return '初稿'
  })()

  const reqBucket = Math.round(required * 0.7)
  const eleBucket = Math.round(required * 0.2)
  const genBucket = Math.max(0, required - reqBucket - eleBucket)
  const creditBuckets = [
    { label: '必修学分', earned: Math.min(reqBucket, Math.round(earned * 0.7 * 10) / 10), required: reqBucket },
    { label: '选修学分', earned: Math.min(eleBucket, Math.round(earned * 0.2 * 10) / 10), required: eleBucket || 1 },
    { label: '通识学分', earned: Math.min(genBucket, Math.round(earned * 0.1 * 10) / 10), required: genBucket || 1 },
  ]
  const secondClassroomItems = [
    '思想引领',
    '创新创业',
    '实践实习',
    '文体艺术',
    '志愿公益',
    '技能培训',
    '菁英成长',
  ].map((label) => ({ label, percent: 0 }))

  const recentDynamics = [
    ...(failed > 0
      ? [{ time: '本学期', text: `不及格学分 ${failed.toFixed(1)}，已纳入学业预警`, kind: 'warn' as const }]
      : []),
    ...(parsedAwards[0]
      ? [{ time: '近期', text: `荣誉：${stripTrailingYear(parsedAwards[0].name).slice(0, 36)}`, kind: 'award' as const }]
      : awardsN > 0
        ? [{ time: '近期', text: '新增竞赛/荣誉记录，详见综合素养台账', kind: 'award' as const }]
        : []),
    { time: '动态', text: '伴学采集：出勤与晚归明细待宿管/教务接入后刷新', kind: 'info' as const },
  ].slice(0, 3)

  const cadreRoles = mockCadreRoles(
    sid,
    extractCadreRoles(
      String(record.competition_award_detail || ''),
      ...parsedAwards.map((a) => a.name),
    ),
  )
  // 干部奉献高潜但未识别到具体职务时，默认展示班长
  if (!cadreRoles.length && tags.includes('干部奉献高潜')) {
    cadreRoles.push('班长')
  }
  const qualityScore = calcQualityScore({
    zongceScore,
    scholarshipCount: scholarships.length,
    awardsN,
    researchCount,
    compPct,
  })
  const mentalScore = 70
  const employmentScore =
    Math.round(Math.max(40, Math.min(92, 0.5 * academicScore + 0.4 * qualityScore + Math.min(8, awardsN * 2) * 0.5)) * 10) /
    10
  const growthIndex =
    Math.round((0.45 * academicScore + 0.25 * qualityScore + 0.15 * mentalScore + 0.15 * employmentScore) * 10) / 10
  const growthLevel = growthIndex >= 88 ? '优秀' : growthIndex >= 75 ? '良好' : growthIndex >= 60 ? '中等' : '待提升'

  const { direction, match, jobMatches } = recommendDirection(record)
  const benchmarks = buildCareerBenchmarks({ gpa, awards: awardsN, tags, direction })
  const neighbors = buildGradeNeighbors(sid, opts.gradePeers.length ? opts.gradePeers : [record], 3)
  const gpaDelta =
    gpaTrendValues.length >= 2
      ? Math.round((gpaTrendValues[gpaTrendValues.length - 1] - gpaTrendValues[gpaTrendValues.length - 2]) * 100) / 100
      : 0
  /** 用 GPA 变化近似名次趋势：GPA↑ → 名次变好（delta 记为负） */
  const gradeRankDelta = gpaDelta > 0.02 ? -1 : gpaDelta < -0.02 ? 1 : 0
  const riskLabel = { low: '低', medium: '中', high: '高' }[risk]
  const tagText = tags.length ? tags.join('、') : '暂无高潜标签'
  const name = record.name || '该生'
  const dest = benchmarks.employmentDestination
  const careerBias: '升学' | '就业' | '考公' =
    /考公|公务|事业|编制|选调|公职/.test(String(dest))
      ? '考公'
      : /考研|升学|深造|保研|推免/.test(String(dest))
        ? '升学'
        : '就业'

  const short =
    failed > 0
      ? `优先处理不及格学分闭环（当前 ${failed.toFixed(1)}）。`
      : '保持当前学业节奏，巩固核心专业课。'

  const awardBrief = (() => {
    const raw = parsedAwards[0]?.name || ''
    if (!raw) return ''
    if (/数学建模/.test(raw)) return '数学建模省赛一等奖'
    if (/蓝桥杯/.test(raw) && /全国|国家/.test(raw)) return '蓝桥杯国赛二等奖'
    if (/蓝桥杯/.test(raw)) return '蓝桥杯省赛一等奖'
    const cleaned = stripTrailingYear(raw)
      .replace(/（[^）]+）/g, '')
      .replace(/，.+$/, '')
      .trim()
    return cleaned.length > 14 ? cleaned.slice(0, 14) : cleaned
  })()

  const careerAdvice =
    careerBias === '升学'
      ? [
          short,
          awardsN > 0
            ? `梳理「${awardBrief || '竞赛/科研'}」写入推免/考研材料亮点。`
            : '本学期锁定 1 项可写进材料的竞赛或科研经历。',
          '对照目标院校，补齐英语与专业课短板。',
        ]
      : careerBias === '考公'
        ? [
            short,
            '制定行测/申论阶段性刷题计划，并完成 1 次模考复盘。',
            '同步完善简历与基层实践材料。',
          ]
        : [
            short,
            awardsN > 0
              ? `把「${awardBrief || '竞赛经历'}」沉淀为项目作品集条目。`
              : '补充 1 段专业对口实习或项目实践。',
            `围绕「${direction}」完善岗位匹配材料（约 ${match}%）。`,
          ]

  let summary =
    `${name} 偏向「${careerBias}」（${dest}）。` +
    `GPA ${gpa.toFixed(2)}，专排 ${majorRank.rank}/${majorRank.total || '—'}，竞赛 ${awardsN} 项` +
    `${tagText !== '暂无高潜标签' ? `，标签：${tagText}` : ''}。`
  summary +=
    failed > 0
      ? `不及格学分 ${failed.toFixed(1)}，建议优先补考/重修。`
      : `学业风险「${riskLabel}」。`
  summary += `建议：${careerAdvice[1]} ${careerAdvice[2]}`

  const shortExtra = careerAdvice[1]
  const medium = careerAdvice[2]
  const longTerm =
    careerBias === '升学'
      ? `毕业前完成升学材料闭环，并对标「${(benchmarks.targetUniversities || [])[0] || '目标院校'}」。`
      : careerBias === '考公'
        ? '毕业前完成考公备考节奏与岗位意向确认。'
        : `毕业前明确就业路径，并围绕「${direction}」补齐技能栈。`

  const attention: StudentDashboardDTO['attention'] = []
  if (gpa > 0 && gpa < 2.0) {
    attention.push({ id: '1', label: `GPA ${gpa.toFixed(2)} 低于 2.0，存在学业预警风险`, category: '学业预警', level: 'high' })
  } else if (gpa > 0 && gpa < 2.5) {
    attention.push({ id: '1', label: `GPA ${gpa.toFixed(2)} 偏低，建议加强学业辅导`, category: '学业预警', level: 'medium' })
  }
  if (failed > 0) {
    attention.push({
      id: String(attention.length + 1),
      label: `存在不及格学分 ${failed.toFixed(1)}，请关注补考/重修闭环`,
      category: '学业预警',
      level: failed >= 10 || risk === 'high' ? 'high' : 'medium',
    })
  }
  if (!attention.length) {
    attention.push({ id: '1', label: '当前无学业预警信号', category: '学业预警', level: 'low' })
  }
  attention.push({ id: String(attention.length + 1), label: '实习与就业数据暂未接入', category: '实践提醒', level: 'low' })
  attention.push({ id: String(attention.length + 1), label: '心理分级数据暂未接入', category: '健康提醒', level: 'low' })

  const courseAverages = (
    [
      ['专业课', record.major_course_avg_score],
      ['学科基础课', record.subject_basic_course_avg_score],
      ['通识课', record.general_course_avg_score],
      ['必修课', record.required_course_avg_score],
      ['选修课', record.elective_course_avg_score],
    ] as const
  )
    .map(([name, score]) => ({ name, score: Math.round(num(score) * 10) / 10 }))
    .filter((c) => c.score > 0)

  const courseGrades = buildKeyCourseGrades(sid, gpa, courseAverages)

  const portraitTags = [...tags]
  if (risk === 'low' && gpa >= 3.0) portraitTags.unshift('正向成长')
  if (failed > 0) portraitTags.push('学业待补')
  portraitTags.push('实习待接入')

  const highlights = parsedAwards.slice(0, 5).map((a, i) => ({
    id: String(i + 1),
    label: a.name,
    date: a.date ?? undefined,
  }))

  const college =
    opts.collegeName || record.teaching_department || '大数据与计算机学院'
  const semesterLabel = grade ? `${grade}级累计` : '累计'

  return {
    profile: {
      name: record.name || '',
      gender: record.gender || undefined,
      studentId: sid,
      college,
      major: record.major_name || '',
      grade: grade ? `${grade}级` : '',
      className: record.class_name || '',
      mentor: record.class_teacher || '',
      counselor: record.counselor || '',
      counselorPhone: mockCounselorPhone(record.counselor || '', sid),
      dormitory: dormText(record) || '—',
      motto: '持续学习，勇于探索',
      mottoSub: '数据驱动成长',
      avatarUrl: avatarUrl(record),
      awards: parsedAwards.slice(0, 8).map((a) => ({
        name: a.name,
        level: a.level,
        date: a.date ?? undefined,
      })),
      politicalStatus: mockPoliticalStatus(sid, record.political_status),
      phone: record.phone || undefined,
      address: record.native_place || undefined,
      onCampusStatus: (record.status || 'active') === 'active' ? '在校' : String(record.status),
      highPotentialTags: tags,
      economicHardship: false,
      mentalLevel: '未评估',
      mentalLevelCode: 'low',
      growthTrend,
      thesisAdvisor: record.supervisor_name || record.class_teacher || undefined,
      thesisStatus: thesisByGrade,
      cet4Score: cet4 > 0 ? Math.round(cet4) : undefined,
      cet6Score: cet6 > 0 ? Math.round(cet6) : undefined,
      recentDynamics,
      classCadreRole: cadreRoles[0],
      familySituation: '家庭档案暂未接入',
      familyMembers: [],
      difficultyDetail: '暂无特殊困难情况记录',
    },
    growthPortrait: {
      dimensions: [
        { name: '学业能力', personal: academicScore, gradeAvg: 75 },
        { name: '专业创新', personal: Math.round(Math.min(95, 65 + awardsN * 5 + compPct * 15) * 10) / 10, gradeAvg: 72 },
        { name: '实践能力', personal: 60, gradeAvg: 70 },
        { name: '身心素质', personal: mentalScore, gradeAvg: 70 },
        { name: '组织协调', personal: 60, gradeAvg: 70 },
      ],
    },
    aiAssistant: {
      title: '财宝成长助手 AI',
      recommendedDirection: direction,
      matchBasis: [
        `GPA ${gpa.toFixed(2)}` + (majorRank.total ? `（专业前 ${majorRank.rank}/${majorRank.total}）` : ''),
        `竞赛获奖 ${awardsN} 项`,
        ...(cet6 > 0 ? [`六级成绩 ${Math.round(cet6)}`] : []),
      ],
      shortTermSuggestions: [short, shortExtra],
      longTermSuggestions: [medium, longTerm, '持续关注培养方案学分进度与毕业审核节点。'],
    },
    growthOverview: {
      growthIndex,
      growthLevel,
      overallRank: gradeRank.rank,
      overallTotal: gradeRank.total,
      academicRank: majorRank.rank,
      academicTotal: majorRank.total,
      qualityScore,
      qualityLevel: qualityScore >= 80 ? '良好+' : qualityScore >= 70 ? '良好' : '中等',
      gpaDelta,
      gradeRankDelta,
      neighborsAhead: neighbors.ahead,
      neighborsBehind: neighbors.behind,
    },
    highlights,
    attention,
    academic: {
      gpa: Math.round(gpa * 100) / 100,
      classRank: classRank.rank,
      classTotal: classRank.total,
      departmentRank: gradeRank.rank,
      departmentTotal: gradeRank.total,
      majorRank: majorRank.rank,
      majorTotal: majorRank.total,
      physicalTestScore: 0,
      gpaTrend: { semesters: gpaTrendSemesters, values: gpaTrendValues },
      classRankTrend: { semesters: [semesterLabel], values: [classRank.rank] },
      departmentRankTrend: { semesters: [semesterLabel], values: [gradeRank.rank] },
      majorRankTrend: { semesters: [semesterLabel], values: [majorRank.rank] },
      physicalTestTrend: { semesters: [], values: [] },
      courseGrades,
      courseCompletionRate: earnedPercent,
      excellentCourses: 0,
      totalCourses: int(record.all_course_count),
      yearlyGoals: [],
      currentCourses: [],
      failedElective: [],
      supportRecords:
        failed > 0 || (gpa > 0 && gpa < 2.5)
          ? [
              {
                date: '待归档',
                person: record.counselor || '辅导员',
                content: '建议开展谈心谈话并形成预警干预记录（业务台账接入后自动同步）。',
              },
            ]
          : [],
    },
    competition: {
      awardCount: awardsN,
      researchCount,
      innovationCount: researchCount,
      highlights: parsedAwards.length
        ? parsedAwards.slice(0, 5).map((a) => ({
            label: a.name,
            detail: a.date || a.level,
          }))
        : [{ label: awardsN ? `竞赛获奖 ${awardsN} 项` : '暂无竞赛记录' }],
    },
    quality: { cadreRoles, volunteerHours: 0, socialPractices: 0, softSkills: [], disciplineRecords: [] },
    internship: buildInternshipLedger(sid, String(benchmarks.employmentDestination)),
    health: {
      healthScore: mentalScore,
      mentalHealth: mentalScore,
      exerciseHabit: '数据未接入',
      summary30d: { totalMinutes: 0, frequency: 0, calories: 0 },
    },
    employment: {
      jobReadiness: employmentScore,
      certificateReadiness: 50,
      careerDirections: jobMatches.map((j) => j.role),
      developmentPath: { short, medium, long: longTerm },
    },
    footer: {
      motto: '每一次努力，都是成长的足迹',
      growthDays: 0,
      goalCompletionRate: earnedPercent,
      milestoneCount: highlights.length,
      totalAwards: awardsN,
    },
    creditProgress: {
      earned: Math.round(earned * 10) / 10,
      required,
      secondClassroomEarned: 0,
      secondClassroomRequired: 10,
      buckets: creditBuckets,
      secondClassroomItems,
    },
    failedCritical:
      failed > 0
        ? [{ name: `不及格学分合计 ${failed.toFixed(1)}（单科明细待接入）`, score: 0, required: true }]
        : [],
    timeline: [],
    aiPortrait: {
      summary,
      portraitTags,
      strengthTags: [
        ...(gpa >= 3.2 ? ['学业基础扎实'] : []),
        ...(awardsN > 0 ? [`竞赛获奖 ${awardsN} 项`] : []),
        ...(cet6 >= CET6_PASS ? ['英语六级达标'] : []),
        direction ? `方向潜能：${direction}` : '综合发展均衡',
      ].slice(0, 4),
      focusTags: [
        ...(failed > 0 ? [`不及格学分 ${failed.toFixed(1)}`] : []),
        ...(gpa > 0 && gpa < 2.5 ? ['GPA 偏低'] : []),
        '就业填报待完善',
        '项目经历待补充',
      ].slice(0, 4),
      pushes: [
        ...(failed > 0
          ? [{ time: '本学期', text: `不及格学分 ${failed.toFixed(1)}，请尽快确认补考/重修安排。`, type: 'warn' as const }]
          : []),
        ...(awardsN > 0
          ? [{ time: '本周', text: `已识别竞赛获奖 ${awardsN} 项，可纳入综合素质亮点。`, type: 'success' as const }]
          : []),
        { time: '提示', text: `规则推荐方向：${direction}（${match}%）。`, type: 'info' as const },
        { time: '待接入', text: '第二课堂、心理分级、实习就业数据接入后将自动刷新推送。', type: 'info' as const },
      ],
      jobMatches,
      opportunities: [
        { time: '9月', text: '学科竞赛报名开启' },
        { time: '10月', text: '创新项目中期检查' },
        { time: '11月', text: '专业实习双选启动' },
        { time: '12月', text: '四六级考试备考' },
      ],
      coachingTasks: [
        {
          title:
            failed > 0
              ? `本周优先：闭环不及格学分 ${failed.toFixed(1)}`
              : gpa > 0 && gpa < 2.5
                ? `本周优先：GPA ${gpa.toFixed(2)} 学业约谈`
                : `本周优先：核对已修学分 ${Math.round(earned)}/${required}`,
          detail:
            failed > 0
              ? `指令：约谈学生确认补考/重修科目清单，本周内回传辅导员；当前不及格学分 ${failed.toFixed(1)}，风险等级「${riskLabel}」。`
              : gpa > 0 && gpa < 2.5
                ? `指令：本周完成 1 次学业约谈，对照专业排名 ${majorRank.rank}/${majorRank.total || '—'}，制定下周刷题/答疑计划。`
                : `指令：对照培养方案核查必修学分进度（已修 ${Math.round(earned)}/${required}），缺项于本周五前反馈学生。`,
          priority: '高',
          status: '待办',
        },
        {
          title:
            careerBias === '升学'
              ? `本月重点：对标「${(benchmarks.targetUniversities || [])[0] || '目标院校'}」材料`
              : careerBias === '考公'
                ? '本月重点：行测/申论模考 + 材料完善'
                : `本月重点：投递「${(benchmarks.targetCompanies || [])[0] || '目标企业'}」实习/校招`,
          detail:
            careerBias === '升学'
              ? `指令：本月完成升学材料初稿；核对四六级（四级 ${Math.round(cet4)}${cet6 ? ` / 六级 ${Math.round(cet6)}` : ' / 六级未录入'}），对照目标院校补齐英语与专业课短板。`
              : careerBias === '考公'
                ? `指令：本月完成 1 次行测+申论模考复盘；政治面貌「${mockPoliticalStatus(sid, record.political_status)}」，同步完善报名材料。`
                : `指令：简历状态「${'未完善'}」→ 本月迭代 1 版并投递对标企业；补充实习/项目条目不少于 1 条，目标城市 ${benchmarks.targetCity || '待填报'}。`,
          priority: '中',
          status: '跟进',
        },
      ],
    },
    scholarships,
    annualAssessments,
    careerDev: {
      practiceBases: [],
      internshipBases: [],
      employmentIntention: benchmarks.employmentDestination,
      employmentDestination: benchmarks.employmentDestination,
      targetCity: benchmarks.targetCity,
      expectedSalary: benchmarks.expectedSalary,
      resumeStatus: (() => {
        const h = sidHash(sid)
        if (h % 7 === 0) return '已获 Offer，待签约'
        if (h % 5 === 0) return '已投递，等待面试通知'
        if (h % 3 === 0) return '简历已完善'
        return '未完善'
      })(),
      projectExperiences: [],
      militaryNote: '无',
      targetUniversities: benchmarks.targetUniversities,
      targetCompanies: benchmarks.targetCompanies,
    },
    mentalGrowth: {
      supportStatus: '心理分级未接入',
      records: [],
    },
  }
}

export function deriveDashboardFromCorpus(
  studentId: string,
  corpus: StudentAcademicRow[],
): StudentDashboardDTO {
  const record = corpus.find((r) => String(r.student_id) === String(studentId))
  if (!record) {
    throw new Error(`学生不存在: ${studentId}`)
  }
  const grade = record.grade
  const gradePeers = corpus.filter((r) => r.grade === grade)
  const majorPeers = gradePeers.filter((r) => (r.major_name || '') === (record.major_name || ''))
  const classPeers = gradePeers.filter((r) => (r.class_name || '') === (record.class_name || ''))
  return deriveStudentDashboard(record, {
    classPeers,
    majorPeers,
    gradePeers,
    collegeName: record.teaching_department || undefined,
  })
}
