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
  if (extractCadreRoles(detail).length || /优干|优秀学生干部|班干部/.test(detail)) {
    tags.push('干部奉献高潜')
  }
  return tags
}

function competitionPercentile(record: StudentAcademicRow, peers: StudentAcademicRow[]) {
  const mine = int(record.competition_award_count)
  const values = peers.map((p) => int(p.competition_award_count)).sort((a, b) => b - a)
  if (!values.length) return 0
  const better = values.filter((v) => v > mine).length
  return Math.max(0, Math.min(1, 1 - better / values.length))
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
  const cet4 = num(record.cet4_score)
  const cet6 = num(record.cet6_score)
  const cetPart = cet6 >= CET6_PASS ? 85 : cet6 > 0 ? 70 : cet4 > 0 ? 65 : 60
  const growthTrend: 'positive' | 'negative' | 'stable' =
    gpa >= 3.5 ? 'positive' : gpa > 0 && gpa < 2.5 ? 'negative' : 'stable'
  const gpaPoints =
    growthTrend === 'positive'
      ? [Math.max(0, gpa - 0.28), Math.max(0, gpa - 0.16), Math.max(0, gpa - 0.06), gpa]
      : growthTrend === 'negative'
        ? [Math.min(4, gpa + 0.22), Math.min(4, gpa + 0.1), gpa + 0.04, gpa]
        : [Math.max(0, gpa - 0.08), gpa + 0.02, Math.max(0, gpa - 0.03), gpa]
  const gpaTrendValues = gpaPoints.map((v) => Math.round(Math.max(0, Math.min(4.5, v)) * 100) / 100)
  const gpaTrendSemesters = ['大一', '大二上', '大二下', '近学期'].slice(-gpaTrendValues.length)

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
      ? [{ time: '本学期', text: `发现不及格学分 ${failed.toFixed(1)}，已纳入学业预警台账`, kind: 'warn' as const }]
      : []),
    ...(awardsN > 0
      ? [{ time: '近期', text: `新增竞赛/荣誉动态 ${awardsN} 项`, kind: 'award' as const }]
      : []),
    { time: '动态', text: '伴学采集：出勤与晚归明细待宿管/教务接入后刷新', kind: 'info' as const },
  ].slice(0, 3)

  const cadreRoles = extractCadreRoles(
    String(record.competition_award_detail || ''),
    ...parsedAwards.map((a) => a.name),
  )
  const qualityScore = Math.round((0.55 * (60 + compPct * 35) + 0.45 * cetPart) * 10) / 10
  const mentalScore = 70
  const employmentScore =
    Math.round(Math.max(40, Math.min(92, 0.5 * academicScore + 0.4 * qualityScore + Math.min(8, awardsN * 2) * 0.5)) * 10) /
    10
  const growthIndex =
    Math.round((0.45 * academicScore + 0.25 * qualityScore + 0.15 * mentalScore + 0.15 * employmentScore) * 10) / 10
  const growthLevel = growthIndex >= 88 ? '优秀' : growthIndex >= 75 ? '良好' : growthIndex >= 60 ? '中等' : '待提升'

  const { direction, match, jobMatches } = recommendDirection(record)
  const riskLabel = { low: '低', medium: '中', high: '高' }[risk]
  const tagText = tags.length ? tags.join('、') : '暂无高潜标签'
  const name = record.name || '该生'
  let summary =
    `${name}当前 GPA ${gpa.toFixed(2)}，班级第 ${classRank.rank}/${classRank.total || '—'}，` +
    `专业第 ${majorRank.rank}/${majorRank.total || '—'}；竞赛获奖 ${awardsN} 项，画像标签：${tagText}。`
  summary +=
    failed > 0
      ? `存在不及格学分 ${failed.toFixed(1)}，建议优先完成补考/重修闭环。`
      : `学业风险等级为「${riskLabel}」。`
  summary += `规则匹配建议优先关注「${direction}」（匹配度约 ${match}%）。当前就业去向类型记为「待实习」，意向城市/期望薪资/简历状态待学生填报后完善岗位匹配。`

  const short =
    failed > 0
      ? `优先处理不及格学分闭环（当前 ${failed.toFixed(1)}）。`
      : '保持当前学业节奏，巩固核心专业课。'
  const shortExtra = awardsN === 0 ? '可尝试报名 1 项学科竞赛积累作品。' : '梳理竞赛经历写入可展示履历要点。'
  const medium = '在数据接入前，建议自行补充企业实习或项目实践经历。'
  const longTerm = `毕业前明确升学或就业路径，并围绕「${direction}」补齐技能栈。`

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

  const courseGrades = (
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
      dormitory: dormText(record) || '—',
      motto: '持续学习，勇于探索',
      mottoSub: '数据驱动成长',
      avatarUrl: avatarUrl(record),
      awards: parsedAwards.slice(0, 8).map((a) => ({
        name: a.name,
        level: a.level,
        date: a.date ?? undefined,
      })),
      politicalStatus: record.political_status || undefined,
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
      researchCount: 0,
      innovationCount: 0,
      highlights: parsedAwards.length
        ? parsedAwards.slice(0, 5).map((a) => ({
            label: a.name.slice(0, 40),
            detail: a.date || a.level,
          }))
        : [{ label: awardsN ? `竞赛获奖 ${awardsN} 项` : '暂无竞赛记录' }],
    },
    quality: { cadreRoles, volunteerHours: 0, socialPractices: 0, softSkills: [], disciplineRecords: [] },
    internship: { internshipCount: 0, projectCount: 0, certificateCount: 0, items: [] },
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
        { time: '9月', text: '学科竞赛报名窗口开启，建议选定一项主赛准备', action: '参考资料' },
        { time: '10月', text: '校内创新项目中期检查，可对接导师申报科研助手', action: '参考资料' },
        { time: '11月', text: '推荐关注专业对口实习双选，完善项目作品集', action: '参考资料' },
        { time: '12月', text: 'CET-4 / CET-6 考试季，建议提前组队刷题', action: '参考资料' },
      ],
      coachingTasks: [
        {
          title: '本周优先：学业与学分核查',
          detail: short,
          priority: '高',
          status: '待办',
        },
        {
          title: '本月重点：补充专业实践',
          detail: medium,
          priority: '中',
          status: '跟进',
        },
      ],
    },
    scholarships: [],
    annualAssessments: [],
    careerDev: {
      practiceBases: [],
      internshipBases: [],
      employmentIntention: '待实习',
      employmentDestination: '待实习',
      targetCity: '未填报',
      expectedSalary: '未填报',
      resumeStatus: '未完善',
      projectExperiences: [],
      militaryNote: '无',
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
