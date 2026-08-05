import type { StudentDashboardVM } from '@/types/student/view'
import type { ExcelSheet } from '@/utils/exportExcel'
import type { HonorGroup } from '@/components/student/subpages/_shared/qualityMock'
import type { AidProfile } from '@/components/student/subpages/_shared/qualityMock'
import type { GpaDetailVM } from '@/components/student/subpages/_shared/gpa-data/types'
import type { CreditProgressVM } from '@/components/student/subpages/_shared/credit-data/types'
import type { FailDetailVM } from '@/components/student/subpages/_shared/fail-data/types'

/** 将驾驶舱 VM 拆成多个工作表，供总览页导出。 */
export function dashboardToExcelSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '基本信息',
      headers: ['字段', '值'],
      rows: [
        ['姓名', d.profile.name],
        ['学号', d.profile.studentId],
        ['性别', d.profile.gender],
        ['学院', d.profile.college],
        ['专业', d.profile.major],
        ['班级', d.profile.className],
        ['年级', d.profile.grade],
        ['辅导员', d.profile.counselor],
        ['宿舍', d.profile.dormitory],
        ['政治面貌', d.profile.politicalStatus],
        ['高潜标签', (d.profile.highPotentialTags || []).join('、')],
      ],
    },
    {
      name: '学业指标',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['专排', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['院排', `${d.academic.departmentRank}/${d.academic.departmentTotal}`],
        ['已修学分', d.creditProgress.earned],
        ['应修学分', d.creditProgress.required],
        ['综合指数', d.growthOverview.growthIndex],
        ['素养得分', d.growthOverview.qualityScore],
      ],
    },
    {
      name: '奖学金',
      headers: ['学年', '奖学金名称'],
      rows: (d.scholarships || []).map((s) => [s.year, s.name]),
    },
    {
      name: '预警关注',
      headers: ['类别', '等级', '说明'],
      rows: (d.attention || []).map((a) => [a.category, a.levelLabel || a.level, a.label]),
    },
    {
      name: '竞赛获奖',
      headers: ['名称', '明细'],
      rows: (d.competition?.highlights || []).map((h) => [h.label, h.detail || '']),
    },
  ]
}

function highestLevelOf(d: StudentDashboardVM, pattern: RegExp): string {
  const hit = d.attention.find((item) => pattern.test(`${item.category}${item.label}`))
  return hit?.levelLabel || hit?.level || '正常'
}

/**
 * 导出「简易谈心简报」：单表简明版。
 * 内容：学籍 + 三类预警结论 + 近期动态 + 帮扶记录摘要。
 */
export function dashboardToBriefSheets(d: StudentDashboardVM): ExcelSheet[] {
  const psychological = d.profile.mentalLevel || highestLevelOf(d, /心理|健康|体测/)
  const academic = highestLevelOf(d, /学业|课程|挂科|GPA|补考/) || '正常'
  const employment = highestLevelOf(d, /就业|实习|职业/) || '正常'

  const dynamics = (d.profile.recentDynamics || []).map((x) => [x.time, x.text])
  const supports = (d.supportRecords || []).map((s) => [s.date, s.person, s.content])

  const rows: Array<Array<string | number | null | undefined>> = [
    ['学籍', `姓名：${d.profile.name}　学号：${d.profile.studentId}　性别：${d.profile.gender || ''}`],
    ['学籍', `学院：${d.profile.college || ''}　专业：${d.profile.major || ''}　班级：${d.profile.className || ''}　年级：${d.profile.grade || ''}`],
    ['学籍', `辅导员：${d.profile.counselor || '—'}　班主任：${d.profile.mentor || '—'}　电话：${d.profile.phone || '—'}`],
    ['学籍', `学籍状态：${d.profile.onCampusStatus || '在校'}　困难认定：${d.profile.economicHardship ? '已认定' : '未认定'}　心理分级：${d.profile.mentalLevel || '正常'}　成长趋势：${({ positive: '正向上升', negative: '负向波动', stable: '总体平稳' } as const)[d.profile.growthTrend ?? 'stable']}`],
    ['心理预警', psychological],
    ['学业预警', academic],
    ['就业预警', employment],
    ['近期动态', `共 ${dynamics.length} 条${dynamics.length ? '，详见下方明细' : '，暂无记录'}`],
    ['帮扶记录', `共 ${supports.length} 条${supports.length ? '，详见下方明细' : '，暂无记录'}`],
  ]

  if (dynamics.length) {
    rows.push(['近期动态明细', '——'])
    dynamics.forEach(([time, text]) => rows.push(['', `${time}　${text}`]))
  }
  if (supports.length) {
    rows.push(['帮扶记录明细', '——'])
    supports.forEach(([date, person, content]) => rows.push(['', `${date}　${person}：${content}`]))
  }

  return [
    {
      name: '简易谈心简报',
      headers: ['板块', '内容'],
      rows,
    },
  ]
}

/* ════════════════════════════════════════════════════════════════
 * 各二级页面专属导出（根据页面自身数据生成不同工作表）
 * ════════════════════════════════════════════════════════════════ */

/** 基础信息台账：学籍基本信息 + 核心标签画像 */
export function dashboardToBasicSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '基本信息',
      headers: ['字段', '值'],
      rows: [
        ['姓名', d.profile.name],
        ['学号', d.profile.studentId],
        ['性别', d.profile.gender],
        ['学院', d.profile.college],
        ['专业', d.profile.major],
        ['班级', d.profile.className],
        ['年级', d.profile.grade],
        ['辅导员', d.profile.counselor],
        ['班主任', d.profile.mentor],
        ['宿舍', d.profile.dormitory],
        ['电话', d.profile.phone],
        ['政治面貌', d.profile.politicalStatus],
        ['学籍状态', d.profile.onCampusStatus],
        ['困难认定', d.profile.economicHardship ? '已认定' : '未认定'],
        ['心理分级', d.profile.mentalLevel],
        ['成长趋势', ({ positive: '正向上升', negative: '负向波动', stable: '总体平稳' } as const)[d.profile.growthTrend ?? 'stable']],
        ['高潜标签', (d.profile.highPotentialTags || []).join('、')],
        ['监护人', d.profile.guardianName],
        ['监护人电话', d.profile.guardianPhone],
        ['家庭情况', d.profile.familySituation],
        ['家庭成员', (d.profile.familyMembers || []).join('、')],
      ],
    },
    {
      name: '核心画像',
      headers: ['维度', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['专排', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['综测排名', `${d.growthOverview.overallRank}/${d.growthOverview.overallTotal}`],
        ['综合指数', d.growthOverview.growthIndex],
        ['素养得分', d.growthOverview.qualityScore],
        ['竞赛获奖', d.competition.awardCount],
        ['科研成果', d.competition.researchCount],
        ['志愿服务时长', d.quality.volunteerHours],
        ['社会实践', d.quality.socialPractices],
        ['班干部职务', (d.quality.cadreRoles || []).join('、')],
      ],
    },
  ]
}

/** 学业预警详情：全部预警记录 + 挂科课程 + 学业指标 + 帮扶记录 */
export function dashboardToAcademicWarningSheets(d: StudentDashboardVM): ExcelSheet[] {
  const academicAttentions = (d.attention || []).filter((a) =>
    /学业|课程|挂科|GPA|补考|成绩/.test(`${a.category}${a.label}`),
  )
  return [
    {
      name: '学业预警记录',
      headers: ['类别', '等级', '说明'],
      rows: academicAttentions.length
        ? academicAttentions.map((a) => [a.category, a.levelLabel || a.level, a.label])
        : [['—', '—', '暂无学业预警记录']],
    },
    {
      name: '挂科课程',
      headers: ['课程名称', '成绩', '是否必修'],
      rows: (d.failedCritical || []).map((c) => [c.name, c.score, c.required ? '必修' : '选修']),
    },
    {
      name: '学业指标',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['专排', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['院排', `${d.academic.departmentRank}/${d.academic.departmentTotal}`],
        ['课程完成率', `${d.academic.courseCompletionRate}%`],
        ['优秀课程数', d.academic.excellentCourses],
        ['总课程数', d.academic.totalCourses],
        ['已修学分', d.creditProgress.earned],
        ['应修学分', d.creditProgress.required],
      ],
    },
    {
      name: '学业帮扶记录',
      headers: ['日期', '谈话人', '内容'],
      rows: (d.academic.supportRecords || []).map((s) => [s.date, s.person, s.content]),
    },
  ]
}

/** 就业预警详情：就业/实习类预警 + 就业竞争力 + 职业发展意向 */
export function dashboardToEmploymentWarningSheets(d: StudentDashboardVM): ExcelSheet[] {
  const employmentAttentions = (d.attention || []).filter((a) =>
    /就业|实习|职业|去向/.test(`${a.category}${a.label}`),
  )
  return [
    {
      name: '就业预警记录',
      headers: ['类别', '等级', '说明'],
      rows: employmentAttentions.length
        ? employmentAttentions.map((a) => [a.category, a.levelLabel || a.level, a.label])
        : [['—', '—', '暂无就业预警记录']],
    },
    {
      name: '就业竞争力',
      headers: ['指标', '值'],
      rows: [
        ['就业准备度', `${d.employment.jobReadiness}`],
        ['证书准备度', `${d.employment.certificateReadiness}`],
        ['职业方向', (d.employment.careerDirections || []).join('、')],
        ['实习数量', d.internship.internshipCount],
        ['项目数量', d.internship.projectCount],
        ['证书数量', d.internship.certificateCount],
      ],
    },
    {
      name: '职业发展意向',
      headers: ['字段', '值'],
      rows: [
        ['就业去向', d.careerDev.employmentDestination],
        ['目标城市', d.careerDev.targetCity || '—'],
        ['期望薪资', d.careerDev.expectedSalary || '—'],
        ['简历状态', d.careerDev.resumeStatus || '—'],
        ['对标高校', (d.careerDev.targetUniversities || []).join('、') || '—'],
        ['对标企业', (d.careerDev.targetCompanies || []).join('、') || '—'],
      ],
    },
  ]
}

/** 心理预警详情：心理分级 + 心理成长/干预记录 + 四维相关支撑数据 */
export function dashboardToPsyWarningSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '心理预警概况',
      headers: ['指标', '值'],
      rows: [
        ['心理分级', d.profile.mentalLevel || '正常'],
        ['心理等级码', d.profile.mentalLevelCode || '—'],
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['挂科课程数', (d.failedCritical || []).length],
        ['就业去向', d.careerDev.employmentDestination || '—'],
        ['简历状态', d.careerDev.resumeStatus || '—'],
      ],
    },
    {
      name: '心理干预记录',
      headers: ['日期', '谈话人', '内容', '等级'],
      rows: (d.mentalGrowth?.records || []).map((r) => [r.date, r.person, r.content, r.level]),
    },
    {
      name: '预警关注',
      headers: ['类别', '等级', '说明'],
      rows: (d.attention || []).map((a) => [a.category, a.levelLabel || a.level, a.label]),
    },
  ]
}

/** 智能育航·深度分析（AI 画像）：能力画像 + 行动建议 + 岗位匹配 */
export function dashboardToAiPortraitSheets(d: StudentDashboardVM): ExcelSheet[] {
  const p = d.aiPortrait
  return [
    {
      name: 'AI 画像概况',
      headers: ['字段', '值'],
      rows: [
        ['总体研判', p.summary],
        ['画像标签', (p.portraitTags || []).join('、')],
        ['优势标签', (p.strengthTags || []).join('、')],
        ['关注标签', (p.focusTags || []).join('、')],
        ['GPA', d.academic.gpa],
        ['专业排名', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['就业准备度', d.employment.jobReadiness],
        ['素养得分', d.growthOverview.qualityScore],
        ['竞赛获奖', d.competition.awardCount],
        ['证书数量', d.internship.certificateCount],
      ],
    },
    {
      name: '岗位匹配',
      headers: ['岗位', '匹配度', '城市', '薪资'],
      rows: (p.jobMatches || []).map((j) => [j.role, `${j.match}%`, j.city || '—', j.salary || '—']),
    },
    {
      name: '行动建议',
      headers: ['类型', '时间', '内容'],
      rows: (p.pushes || []).map((x) => [x.type, x.time, x.text]),
    },
    {
      name: '辅导任务',
      headers: ['任务', '详情', '优先级', '状态'],
      rows: (p.coachingTasks || []).map((t) => [t.title, t.detail, t.priority, t.status || '—']),
    },
  ]
}

/** 学情轨迹护航详情（academic-detail）：课程成绩 + 学期趋势 + 能力维度 */
export function dashboardToAcademicDetailSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '课程成绩',
      headers: ['课程名称', '成绩', '排名'],
      rows: (d.academic.courseGrades || []).map((c) => [c.name, c.score, c.rank]),
    },
    {
      name: '学期GPA趋势',
      headers: ['学期', 'GPA'],
      rows: (d.academic.gpaTrend?.values || []).map((v, i) => [d.academic.gpaTrend!.semesters[i] ?? `第${i + 1}学期`, v]),
    },
    {
      name: '学期排名趋势',
      headers: ['学期', '班级排名', '专业排名', '年级排名'],
      rows: (d.academic.classRankTrend?.values || []).map((_, i) => [
        d.academic.classRankTrend!.semesters[i] ?? `第${i + 1}学期`,
        d.academic.classRankTrend!.values[i],
        d.academic.majorRankTrend?.values[i] ?? '—',
        d.academic.departmentRankTrend?.values[i] ?? '—',
      ]),
    },
    {
      name: '学业指标',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['班排', `${d.academic.classRank}/${d.academic.classTotal}`],
        ['专排', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['院排', `${d.academic.departmentRank}/${d.academic.departmentTotal}`],
        ['课程完成率', `${d.academic.courseCompletionRate}%`],
        ['体测成绩', d.academic.physicalTestScore],
      ],
    },
  ]
}

/** 成长路径完整方案：阶段总览 + 成长记录 + 时间轴 */
export function dashboardToGrowthPathSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '阶段总览',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['综测排名', `${d.growthOverview.overallRank}/${d.growthOverview.overallTotal}`],
        ['综合指数', d.growthOverview.growthIndex],
        ['素养得分', d.growthOverview.qualityScore],
        ['竞赛获奖', d.competition.awardCount],
        ['科研成果', d.competition.researchCount],
        ['奖学金', (d.scholarships || []).length],
      ],
    },
    {
      name: '高光时刻',
      headers: ['标签', '日期'],
      rows: (d.highlights || []).map((h) => [h.label, h.date || '—']),
    },
    {
      name: '成长时间轴',
      headers: ['学期', '阶段', '五育', '里程碑'],
      rows: (d.timeline || []).map((t) => [
        t.term,
        t.label,
        `德${t.wuyu.de} 智${t.wuyu.zhi} 体${t.wuyu.ti} 美${t.wuyu.mei} 劳${t.wuyu.lao}`,
        t.milestone || '—',
      ]),
    },
    {
      name: '学年鉴定',
      headers: ['学年', '得分', '等级'],
      rows: (d.annualAssessments || []).map((a) => [a.year, a.score, a.level]),
    },
  ]
}

/** 毕业审核与毕设进度：毕业条件 + 学分 + 毕设 + 风险 */
export function dashboardToGraduationSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '毕业条件进度',
      headers: ['条件', '值'],
      rows: [
        ['毕业状态', d.profile.onCampusStatus || '在校'],
        ['已修学分', d.creditProgress.earned],
        ['应修学分', d.creditProgress.required],
        ['学分完成率', `${d.creditProgress.earnedPercent}%`],
        ['第二课堂已修', d.creditProgress.secondClassroomEarned],
        ['第二课堂应修', d.creditProgress.secondClassroomRequired],
        ['GPA', d.academic.gpa],
        ['挂科课程数', (d.failedCritical || []).length],
      ],
    },
    {
      name: '学分分类进度',
      headers: ['类别', '已修', '应修', '完成率'],
      rows: (d.creditProgress.buckets || []).map((b) => [b.label, b.earned, b.required, `${Math.round((b.earned / b.required) * 100)}%`]),
    },
    {
      name: '毕设进度',
      headers: ['字段', '值'],
      rows: [
        ['毕设题目', d.profile.thesisAdvisor ? '已分配导师' : '未分配'],
        ['导师', d.profile.thesisAdvisor || '—'],
        ['毕设状态', d.profile.thesisStatus || '—'],
        ['班主任', d.profile.mentor || '—'],
      ],
    },
    {
      name: '风险与建议',
      headers: ['类别', '等级', '说明'],
      rows: (d.attention || []).map((a) => [a.category, a.levelLabel || a.level, a.label]),
    },
  ]
}

/** 职业发展：竞争力画像 + 就业去向 + 实习项目 */
export function dashboardToCareerSheets(d: StudentDashboardVM): ExcelSheet[] {
  return [
    {
      name: '就业竞争力',
      headers: ['指标', '值'],
      rows: [
        ['GPA', d.academic.gpa],
        ['专业排名', `${d.academic.majorRank}/${d.academic.majorTotal}`],
        ['就业准备度', d.employment.jobReadiness],
        ['证书准备度', d.employment.certificateReadiness],
        ['职业方向', (d.employment.careerDirections || []).join('、')],
        ['实习数量', d.internship.internshipCount],
        ['项目数量', d.internship.projectCount],
        ['证书数量', d.internship.certificateCount],
      ],
    },
    {
      name: '就业去向',
      headers: ['字段', '值'],
      rows: [
        ['就业去向', d.careerDev.employmentDestination],
        ['目标城市', d.careerDev.targetCity || '—'],
        ['期望薪资', d.careerDev.expectedSalary || '—'],
        ['简历状态', d.careerDev.resumeStatus || '—'],
        ['对标高校', (d.careerDev.targetUniversities || []).join('、') || '—'],
        ['对标企业', (d.careerDev.targetCompanies || []).join('、') || '—'],
      ],
    },
    {
      name: '实习与项目',
      headers: ['名称', '类型'],
      rows: (d.internship.items || []).map((it) => [it.name, it.type]),
    },
  ]
}

/** 综合素养台账：荣誉成果（来自 dashboard）+ 纪律处分记录（来自 dashboard） */
export function dashboardToComprehensiveSheets(d: StudentDashboardVM): ExcelSheet[] {
  const sheets: ExcelSheet[] = [
    {
      name: '荣誉与奖学金',
      headers: ['学年', '奖学金名称'],
      rows: (d.scholarships || []).length
        ? (d.scholarships || []).map((s) => [s.year, s.name])
        : [['—', '暂无奖学金记录']],
    },
    {
      name: '竞赛获奖',
      headers: ['名称', '明细'],
      rows: (d.competition?.highlights || []).length
        ? (d.competition?.highlights || []).map((h) => [h.label, h.detail || ''])
        : [['—', '暂无竞赛获奖']],
    },
    {
      name: '纪律处分记录',
      headers: ['处分类型', '事由', '日期', '状态'],
      rows: (d.quality.disciplineRecords || []).length
        ? (d.quality.disciplineRecords || []).map((r) => [r.type, r.reason, r.date, r.status || '—'])
        : [['—', '暂无纪律处分记录', '—', '—']],
    },
    {
      name: '综合素养指标',
      headers: ['指标', '值'],
      rows: [
        ['志愿服务时长', d.quality.volunteerHours],
        ['社会实践', d.quality.socialPractices],
        ['班干部职务', (d.quality.cadreRoles || []).join('、') || '—'],
        ['素养得分', d.growthOverview.qualityScore],
        ['纪律风险等级', d.quality.disciplineRecords?.length ? '有记录' : '正常'],
      ],
    },
  ]
  return sheets
}

/** 奖惩助贷详情：荣誉成果分组 + 纪律处分 + 资助帮扶（独立 mock 数据） */
export function rewardAidToSheets(
  honorGroupsData: HonorGroup[],
  disciplinaryData: ReadonlyArray<Record<string, unknown>>,
  aid: AidProfile,
): ExcelSheet[] {
  const sheets: ExcelSheet[] = []
  for (const g of honorGroupsData) {
    const subs: HonorGroup[] = g.sub ? g.sub : [g]
    for (const s of subs) {
      const rows = (s.rows || []).map((r) =>
        (s.columns || []).map((c) => (c.evidence ? `[佐证]${r[c.key]}` : `${r[c.key]}${c.suffix || ''}`)),
      )
      sheets.push({
        name: (g.sub ? `${g.label}·${s.label}` : g.label).slice(0, 31),
        headers: (s.columns || []).map((c) => c.label),
        rows,
      })
    }
  }
  sheets.push({
    name: '纪律处分',
    headers: ['处分类型', '事由', '文号', '单位', '日期', '期限', '状态', '整改要求'],
      rows: disciplinaryData.length
        ? disciplinaryData.map((r) => [
            String(r.type ?? '—'),
            String(r.reason ?? '—'),
            String(r.docNumber ?? '—'),
            String(r.unit ?? '—'),
            String(r.date ?? '—'),
            String(r.period ?? '—'),
            String(r.status ?? '—'),
            String(r.requirement ?? '—'),
          ])
        : [['—', '暂无处分记录', '—', '—', '—', '—', '—', '—']],
  })
  sheets.push({
    name: '资助帮扶',
    headers: ['字段', '值'],
    rows: [
      ['困难认定等级', aid.difficultyLevel],
      ['资助状态', aid.statusText],
      ['资助类型', aid.aidTypes.map((t) => `${t.on ? '' : '（未享受）'}${t.name}`).join('、')],
      ['资助历史', aid.history.map((h) => `${h.date} ${h.text}${h.amount && h.amount !== '—' ? `（${h.amount}）` : ''}`).join('；')],
    ],
  })
  return sheets
}

/** GPA 详情（独立 gpa-detail 数据） */
export function gpaDetailToSheets(g: GpaDetailVM): ExcelSheet[] {
  return [
    {
      name: 'GPA概览',
      headers: ['指标', '值'],
      rows: [
        ['累计GPA', g.overview.cumulativeGpa],
        ['加权平均分', g.overview.weightedAverage],
        ['已修学分', g.overview.earnedCredits],
        ['应修学分', g.overview.totalCredits],
        ['优秀课程数', g.overview.excellentCount],
        ['及格课程数', g.overview.passCount],
        ['不及格课程数', g.overview.failCount],
        ['专业排名百分位', `${g.overview.majorRankPercent}%`],
        ['专业平均GPA', g.overview.majorAvgGpa],
        ['班级排名', `${g.overview.classRank}/${g.overview.classTotal}`],
      ],
    },
    {
      name: '学期GPA',
      headers: ['学期', 'GPA', '加权平均分', '获得学分', '课程数', '优秀数', '不及格数'],
      rows: g.semesters.map((s) => [s.semester, s.gpa, s.averageScore, s.totalCredits, s.totalCourses, s.excellentCourses, s.failCourses]),
    },
    {
      name: '课程分类统计',
      headers: ['类别', 'GPA', '平均分', '课程数', '学分数'],
      rows: g.categoryStats.map((c) => [c.categoryLabel, c.gpa, c.averageScore, c.courseCount, c.creditCount]),
    },
    {
      name: '全部课程',
      headers: ['课程名称', '学期', '分数', '学分', '类别', '等级', '是否计入GPA', '是否重修'],
      rows: g.courses.map((c) => [c.name, c.semester, c.score, c.credit, c.categoryLabel, c.levelLabel, c.counted ? '是' : '否', c.retake ? '是' : '否']),
    },
  ]
}

/** 学分进度（独立 credit-data 数据） */
export function creditProgressToSheets(c: CreditProgressVM): ExcelSheet[] {
  return [
    {
      name: '学分总览',
      headers: ['指标', '值'],
      rows: [
        ['培养方案', c.summary.trainingPlanName],
        ['总应修学分', c.summary.totalRequiredCredits],
        ['已获学分', c.summary.totalEarnedCredits],
        ['计入GPA学分', c.summary.countedGpaCredits],
        ['总体进度', `${c.summary.overallProgress}%`],
        ['是否有缺口', c.hasGaps ? '是' : '否'],
      ],
    },
    {
      name: '分类进度',
      headers: ['类别', '应修', '已修', '剩余', '进度', '状态'],
      rows: c.summary.categories.map((cat) => [cat.name, cat.requiredCredits, cat.earnedCredits, cat.remainingCredits, `${cat.progress}%`, cat.status]),
    },
    {
      name: '培养方案课程',
      headers: ['课程名称', '类别', '学分', '必修', '状态', '分数', '实际学期'],
      rows: c.courses.map((co) => [co.name, co.categoryLabel, co.credit, co.required ? '是' : '否', co.status, co.score ?? '—', co.actualSemester || '—']),
    },
  ]
}

/** 挂科明细（独立 fail-data 数据） */
export function failDetailToSheets(f: FailDetailVM): ExcelSheet[] {
  return [
    {
      name: '挂科概览',
      headers: ['指标', '值'],
      rows: [
        ['挂科总数', f.overview.totalFailed],
        ['涉及学期数', f.overview.affectedSemesters],
        ['平均挂科分', f.overview.avgFailScore],
        ['最突出问题类别', f.overview.mostProblemCategory],
        ['学生侧问题数', f.overview.studentIssueCount],
        ['课程侧问题数', f.overview.courseIssueCount],
        ['混合问题数', f.overview.mixedIssueCount],
      ],
    },
    {
      name: '挂科课程',
      headers: ['课程名称', '学期', '分数', '学分', '类别', '班级均分', '班级挂科率', '归因', '分析'],
      rows: f.courses.map((c) => [c.name, c.semester, c.score, c.credit, c.categoryLabel, c.classAvg, `${c.classFailRate}%`, c.gapLabel, c.analysis]),
    },
  ]
}

/** 本学期课表（独立 mock 数据） */
export function semesterScheduleToSheets(
  schedule: Record<string, Partial<Record<string, Array<{ courseName: string; teacher: string; classroom: string; weeks: string }>>>>,
  weekDays: readonly string[],
  periods: ReadonlyArray<{ label: string }>,
): ExcelSheet[] {
  const rows: Array<Array<string>> = []
  for (const p of periods) {
    for (const day of weekDays) {
      const list = schedule[p.label]?.[day]
      if (list && list.length) {
        for (const c of list) {
          rows.push([p.label, day, c.courseName, c.teacher, c.classroom, c.weeks])
        }
      }
    }
  }
  return [
    {
      name: '本学期课表',
      headers: ['节次', '星期', '课程名称', '教师', '教室', '周次'],
      rows: rows.length ? rows : [['—', '—', '暂无课程', '—', '—', '—']],
    },
  ]
}
