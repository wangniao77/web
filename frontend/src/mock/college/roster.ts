import type { HighPotentialModuleId, WarningCategoryType } from '@/types/college/api/high-potential'

/**
 * 学生花名册（mock）。
 * 汇总"高潜"、"预警"、"就业"三类被关注学生，供详情弹窗按维度/类别展示具体人员名单。
 * 后续接入真实数据时，只需替换本文件的数据与查询函数实现即可。
 */
export interface RosterStudent {
  id: string
  name: string
  gender: '男' | '女'
  studentId: string
  className: string
  major: string
  grade: string
  counselor: string
  dorm: string
  gpa: number
  political: string
  phone: string
  /** 命中的高潜维度 */
  hp: HighPotentialModuleId[]
  /** 命中的预警类别 */
  warnings: WarningCategoryType[]
  /** 高潜亮点（用于高潜名单展示） */
  highlight: string
  /** 预警原因（命中预警时展示） */
  warnReason?: string
  /** 预警等级 */
  warnLevel?: string
}

type RawRosterStudent = Omit<RosterStudent, 'political' | 'phone'>

export interface DormmateTag {
  name: string
  kind: '高潜' | '预警'
}

const rawRoster: RawRosterStudent[] = [
  // ===== 学业高潜 =====
  { id: 's01', name: '林昭华', gender: '男', studentId: '2021001012', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 3.92, hp: ['academic'], warnings: [], highlight: 'GPA 专业第1 · 六级612' },
  { id: 's02', name: '陈奕帆', gender: '男', studentId: '2021001045', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 3.81, hp: ['academic', 'competition'], warnings: [], highlight: 'GPA 专业第3 · 蓝桥杯国一' },
  { id: 's03', name: '苏婉清', gender: '女', studentId: '2021002007', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '荷园14-301', gpa: 3.88, hp: ['academic'], warnings: [], highlight: '连续4学期专业前5% · 六级589' },
  { id: 's04', name: '黄梓睿', gender: '男', studentId: '2022001033', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-201', gpa: 3.76, hp: ['academic'], warnings: [], highlight: 'GPA≥3.5 · 无挂科' },
  { id: 's05', name: '周思彤', gender: '女', studentId: '2022003018', className: '人工智能2201', major: '人工智能', grade: '2022级', counselor: '陈静', dorm: '荷园14-302', gpa: 3.79, hp: ['academic'], warnings: [], highlight: '专业前10% · 四级638' },
  { id: 's06', name: '吴俊杰', gender: '男', studentId: '2021004021', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '砺学9-501', gpa: 3.72, hp: ['academic', 'internship'], warnings: [], highlight: 'GPA≥3.5 · 华为实习' },
  { id: 's07', name: '何雨萱', gender: '女', studentId: '2021002056', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '荷园14-301', gpa: 3.69, hp: ['academic'], warnings: [], highlight: '绩点持续上升 · 校奖学金' },
  { id: 's08', name: '郑浩然', gender: '男', studentId: '2022001067', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-201', gpa: 3.65, hp: ['academic'], warnings: [], highlight: 'GPA≥3.5 · 六级534' },
  { id: 's09', name: '罗欣妍', gender: '女', studentId: '2021005009', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 3.63, hp: ['academic'], warnings: [], highlight: '专业前10% · 无挂科' },
  { id: 's10', name: '高晨曦', gender: '男', studentId: '2022004012', className: '大数据2201', major: '大数据管理与应用', grade: '2022级', counselor: '刘伟', dorm: '明理6-403', gpa: 3.58, hp: ['academic'], warnings: [], highlight: 'GPA≥3.5 · 数模校赛一等' },

  // ===== 竞赛高潜 =====
  { id: 's11', name: '李政道', gender: '男', studentId: '2021001088', className: '计科2102', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-402', gpa: 3.55, hp: ['competition'], warnings: [], highlight: '数学建模国二 · ACM省一' },
  { id: 's12', name: '张沐宸', gender: '男', studentId: '2021003025', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '明理6-405', gpa: 3.48, hp: ['competition', 'internship'], warnings: [], highlight: '互联网+省金 · 字节实习' },
  { id: 's13', name: '王梓萌', gender: '女', studentId: '2022002041', className: '软工2201', major: '软件工程', grade: '2022级', counselor: '李强', dorm: '荷园14-302', gpa: 3.51, hp: ['competition'], warnings: [], highlight: '挑战杯省一 · 发明专利1项' },
  { id: 's14', name: '刘子恒', gender: '男', studentId: '2021003077', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '明理6-405', gpa: 3.42, hp: ['competition'], warnings: [], highlight: 'Kaggle 前2% · 论文1篇' },
  { id: 's15', name: '许静宜', gender: '女', studentId: '2022004055', className: '大数据2201', major: '大数据管理与应用', grade: '2022级', counselor: '刘伟', dorm: '荷园14-305', gpa: 3.6, hp: ['competition'], warnings: [], highlight: '大创国家级立项' },
  { id: 's16', name: '邓皓轩', gender: '男', studentId: '2021001099', className: '计科2102', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-402', gpa: 3.38, hp: ['competition'], warnings: [], highlight: '蓝桥杯省一 · GPLT团体奖' },

  // ===== 干部奉献高潜 =====
  { id: 's17', name: '范文博', gender: '男', studentId: '2021002088', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '砺学9-502', gpa: 3.35, hp: ['leadership'], warnings: [], highlight: '院学生会主席 · 科技节总策划' },
  { id: 's18', name: '曾雅琪', gender: '女', studentId: '2021005033', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 3.4, hp: ['leadership'], warnings: [], highlight: '迎新晚会统筹 · 志愿520h' },
  { id: 's19', name: '彭宇航', gender: '男', studentId: '2022001091', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-202', gpa: 3.28, hp: ['leadership'], warnings: [], highlight: '班长 · 校级优干' },
  { id: 's20', name: '唐梦洁', gender: '女', studentId: '2021004066', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '荷园14-301', gpa: 3.22, hp: ['leadership'], warnings: [], highlight: '青协会长 · 社区服务骨干' },
  { id: 's21', name: '田佳彤', gender: '女', studentId: '2022003052', className: '人工智能2201', major: '人工智能', grade: '2022级', counselor: '陈静', dorm: '荷园14-302', gpa: 3.31, hp: ['leadership'], warnings: [], highlight: '团支书 · 大型活动组织×3' },
  { id: 's22', name: '孔祥瑞', gender: '男', studentId: '2021001120', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 3.18, hp: ['leadership'], warnings: [], highlight: '党支部委员 · 志愿680h' },

  // ===== 双百工程高潜（原三下乡） =====
  { id: 's23', name: '赵嘉怡', gender: '女', studentId: '2021002101', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '荷园14-301', gpa: 3.25, hp: ['rural'], warnings: [], highlight: '双百工程队长 · 乡村振兴调研' },
  { id: 's24', name: '冯立诚', gender: '男', studentId: '2022004071', className: '大数据2201', major: '大数据管理与应用', grade: '2022级', counselor: '刘伟', dorm: '明理6-403', gpa: 3.15, hp: ['rural'], warnings: [], highlight: '双百工程 · 普法宣传骨干' },
  { id: 's25', name: '蒋雨欣', gender: '女', studentId: '2021005044', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 3.33, hp: ['rural'], warnings: [], highlight: '双百工程 · 社会调研报告获奖' },
  { id: 's26', name: '韩子墨', gender: '男', studentId: '2022002078', className: '软工2201', major: '软件工程', grade: '2022级', counselor: '李强', dorm: '砺学9-503', gpa: 3.09, hp: ['rural'], warnings: [], highlight: '双百工程 · 支教服务20天' },
  { id: 's27', name: '袁诗涵', gender: '女', studentId: '2021003099', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '荷园14-302', gpa: 3.44, hp: ['rural', 'leadership'], warnings: [], highlight: '双百工程 · 省级重点实践团队' },
  { id: 's28', name: '于慷', gender: '男', studentId: '2022001103', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-202', gpa: 3.02, hp: ['rural'], warnings: [], highlight: '双百工程 · 乡镇覆盖3个' },

  // ===== 实习项目高潜 =====
  { id: 's29', name: '崔宇轩', gender: '男', studentId: '2021001133', className: '计科2102', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '砺学9-501', gpa: 3.47, hp: ['internship'], warnings: [], highlight: '腾讯优质实习 · 系统开发' },
  { id: 's30', name: '潘思远', gender: '男', studentId: '2021003111', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '明理6-405', gpa: 3.36, hp: ['internship'], warnings: [], highlight: '华为昇腾项目 · 专利1项' },
  { id: 's31', name: '董欣悦', gender: '女', studentId: '2021004088', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '荷园14-301', gpa: 3.29, hp: ['internship'], warnings: [], highlight: '招商银行数据实习' },
  { id: 's32', name: '萧景铄', gender: '男', studentId: '2021002133', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '砺学9-502', gpa: 3.41, hp: ['internship'], warnings: [], highlight: '科研助理 · 代码开源800★' },
  { id: 's33', name: '汪一诺', gender: '女', studentId: '2022004099', className: '大数据2201', major: '大数据管理与应用', grade: '2022级', counselor: '刘伟', dorm: '明理6-403', gpa: 3.24, hp: ['internship'], warnings: [], highlight: '字节数据分析实习' },

  // ===== 就业升学高潜 =====
  { id: 's34', name: '孟宪章', gender: '男', studentId: '2021001155', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 3.7, hp: ['career', 'academic'], warnings: [], highlight: '保研中山大学' },
  { id: 's35', name: '钟灵毓', gender: '女', studentId: '2021002155', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '荷园14-301', gpa: 3.52, hp: ['career'], warnings: [], highlight: '腾讯 SP offer' },
  { id: 's36', name: '石清晏', gender: '男', studentId: '2021005066', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 3.46, hp: ['career'], warnings: [], highlight: '选调生拟录用' },
  { id: 's37', name: '严思齐', gender: '男', studentId: '2021003133', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '明理6-405', gpa: 3.58, hp: ['career'], warnings: [], highlight: '出国深造 · 港科大 offer' },
  { id: 's38', name: '龚俊熙', gender: '男', studentId: '2021004111', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '砺学9-501', gpa: 3.39, hp: ['career'], warnings: [], highlight: '华为 offer · 年薪28w' },

  // ===== 预警学生（部分与高潜同宿舍，形成关联） =====
  // 学业预警
  { id: 'w01', name: '张景行', gender: '男', studentId: '2021001001', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 1.82, hp: [], warnings: ['academic'], highlight: '', warnReason: '连续两学期 GPA 低于 2.0', warnLevel: '红色' },
  { id: 'w02', name: '李慕白', gender: '男', studentId: '2022002033', className: '软工2201', major: '软件工程', grade: '2022级', counselor: '李强', dorm: '砺学9-503', gpa: 2.05, hp: [], warnings: ['academic', 'credit'], highlight: '', warnReason: '挂科3门，学分不足', warnLevel: '橙色' },
  { id: 'w03', name: '王浩宇', gender: '男', studentId: '2021001188', className: '计科2102', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-402', gpa: 2.18, hp: [], warnings: ['academic'], highlight: '', warnReason: 'GPA 连续下滑', warnLevel: '黄色' },
  { id: 'w04', name: '陈子谦', gender: '男', studentId: '2022001200', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-201', gpa: 1.95, hp: [], warnings: ['academic'], highlight: '', warnReason: '必修课不及格2门', warnLevel: '橙色' },
  { id: 'w05', name: '林晓风', gender: '男', studentId: '2021004200', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '砺学9-501', gpa: 2.1, hp: [], warnings: ['academic'], highlight: '', warnReason: '学业进度预警', warnLevel: '黄色' },
  { id: 'w06', name: '赵启明', gender: '男', studentId: '2021002200', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '砺学9-502', gpa: 1.88, hp: [], warnings: ['academic', 'employment'], highlight: '', warnReason: '重修课程累计5门', warnLevel: '红色' },

  // 心理预警
  { id: 'w07', name: '陈雨墨', gender: '女', studentId: '2022003012', className: '人工智能2201', major: '人工智能', grade: '2022级', counselor: '陈静', dorm: '荷园14-302', gpa: 2.9, hp: [], warnings: ['psychological'], highlight: '', warnReason: '近期情绪波动，需持续关注', warnLevel: '橙色' },
  { id: 'w08', name: '刘若曦', gender: '女', studentId: '2022002056', className: '软工2201', major: '软件工程', grade: '2022级', counselor: '李强', dorm: '荷园14-302', gpa: 2.75, hp: [], warnings: ['psychological'], highlight: '', warnReason: '睡眠与作息异常', warnLevel: '黄色' },
  { id: 'w09', name: '周慕云', gender: '女', studentId: '2021005099', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 2.6, hp: [], warnings: ['psychological'], highlight: '', warnReason: '人际适应困难', warnLevel: '橙色' },
  { id: 'w10', name: '吴承宇', gender: '男', studentId: '2022001220', className: '计科2201', major: '计算机科学与技术', grade: '2022级', counselor: '王芳', dorm: '明理7-202', gpa: 2.82, hp: [], warnings: ['psychological'], highlight: '', warnReason: '压力测评偏高', warnLevel: '黄色' },

  // 就业预警
  { id: 'w11', name: '郑思远', gender: '男', studentId: '2021001240', className: '计科2102', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '砺学9-501', gpa: 2.7, hp: [], warnings: ['employment'], highlight: '', warnReason: '毕业前未落实就业去向', warnLevel: '红色' },
  { id: 'w12', name: '孙曼宁', gender: '女', studentId: '2021002240', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '砺学9-502', gpa: 2.85, hp: [], warnings: ['employment'], highlight: '', warnReason: '实习中断，就业意向不明确', warnLevel: '橙色' },
  { id: 'w13', name: '马嘉树', gender: '男', studentId: '2021005111', className: '金融科技2101', major: '金融科技', grade: '2021级', counselor: '赵磊', dorm: '荷园14-305', gpa: 2.65, hp: [], warnings: ['employment'], highlight: '', warnReason: '简历投递少，缺乏面试', warnLevel: '橙色' },
  { id: 'w14', name: '钱多福', gender: '男', studentId: '2021004240', className: '大数据2101', major: '大数据管理与应用', grade: '2021级', counselor: '刘伟', dorm: '砺学9-501', gpa: 2.55, hp: [], warnings: ['employment'], highlight: '', warnReason: '就业期望与能力错配', warnLevel: '黄色' },
  { id: 'w15', name: '卫昭', gender: '男', studentId: '2021003240', className: '人工智能2101', major: '人工智能', grade: '2021级', counselor: '陈静', dorm: '明理6-405', gpa: 2.78, hp: [], warnings: ['employment'], highlight: '', warnReason: '缓就业，需重点帮扶', warnLevel: '橙色' },

  // 第二课堂学分预警
  { id: 'w16', name: '陈俊宇', gender: '男', studentId: '2021010233', className: '计科2101', major: '计算机科学与技术', grade: '2021级', counselor: '王芳', dorm: '明理6-401', gpa: 2.95, hp: [], warnings: ['credit'], highlight: '', warnReason: '第二课堂 6/10，创新创业类缺口', warnLevel: '红色' },
  { id: 'w17', name: '林嘉欣', gender: '女', studentId: '2021011045', className: '软工2101', major: '软件工程', grade: '2021级', counselor: '李强', dorm: '荷园14-301', gpa: 3.05, hp: [], warnings: ['credit'], highlight: '', warnReason: '菁英成长与技能培训类未达标', warnLevel: '橙色' },
  { id: 'w18', name: '吴梦洁', gender: '女', studentId: '2022011290', className: '大数据2201', major: '大数据管理与应用', grade: '2022级', counselor: '刘伟', dorm: '明理6-403', gpa: 3.12, hp: [], warnings: ['credit'], highlight: '', warnReason: '文体艺术类学分缺 1.5 分', warnLevel: '黄色' },
  { id: 'w19', name: '徐若寒', gender: '女', studentId: '2022011300', className: '软工2201', major: '软件工程', grade: '2022级', counselor: '李强', dorm: '砺学9-503', gpa: 2.88, hp: [], warnings: ['credit'], highlight: '', warnReason: '志愿公益类学分不足', warnLevel: '橙色' },
  { id: 'w20', name: '朱云开', gender: '男', studentId: '2022011311', className: '人工智能2201', major: '人工智能', grade: '2022级', counselor: '陈静', dorm: '荷园14-302', gpa: 3.0, hp: [], warnings: ['credit'], highlight: '', warnReason: '思想引领类学分缺口', warnLevel: '黄色' },
]

function buildPhone(studentId: string, i: number) {
  const tail = studentId.replace(/\D/g, '').slice(-4).padStart(4, '0')
  const prefixes = ['138', '139', '135', '186', '188', '150', '159', '182']
  return `${prefixes[i % prefixes.length]}****${tail}`
}

function buildPolitical(grade: string, i: number) {
  if (grade === '2021级') {
    const pool = ['中共党员', '中共预备党员', '共青团员', '共青团员']
    return pool[i % pool.length]
  }
  const pool = ['中共预备党员', '共青团员', '共青团员', '群众']
  return pool[i % pool.length]
}

export const rosterStudents: RosterStudent[] = rawRoster.map((s, i) => ({
  ...s,
  political: buildPolitical(s.grade, i),
  phone: buildPhone(s.studentId, i),
}))

const HP_TOTAL = 486
const WARN_TOTAL: Record<WarningCategoryType, number> = {
  academic: 32,
  psychological: 18,
  employment: 24,
  credit: 46,
}

/** 高潜名单：不传 dimension 返回全部高潜学生（去重） */
export function getHpRoster(dimension?: HighPotentialModuleId): RosterStudent[] {
  return rosterStudents.filter((s) =>
    dimension ? s.hp.includes(dimension) : s.hp.length > 0,
  )
}

/** 预警名单：按预警类别筛选 */
export function getWarningRoster(type: WarningCategoryType): RosterStudent[] {
  return rosterStudents.filter((s) => s.warnings.includes(type))
}

/** 同宿舍的其他被关注学生（高潜/预警），用于宿舍号列联动展示 */
export function getDormmates(dorm: string, excludeId: string): DormmateTag[] {
  return rosterStudents
    .filter((s) => s.dorm === dorm && s.id !== excludeId)
    .map((s) => ({ name: s.name, kind: s.hp.length ? '高潜' : '预警' }))
}

/** 名单展示总人数（真实规模，名单为其中的重点样本） */
export function getRosterTotal(kind: 'hp', dimension?: HighPotentialModuleId): number
export function getRosterTotal(kind: 'warning', type: WarningCategoryType): number
export function getRosterTotal(
  kind: 'hp' | 'warning',
  key?: HighPotentialModuleId | WarningCategoryType,
): number {
  if (kind === 'warning') return WARN_TOTAL[key as WarningCategoryType] ?? 0
  return HP_TOTAL
}

// ===== 就业毕业生名单 =====
export type EmploymentDirection = '升学深造' | '企业就业' | '公务员' | '自主创业' | '其他'
export type EmploymentRegion = '广州' | '深圳' | '珠三角其他' | '北京/上海' | '省外其他' | '境外'

export interface EmploymentStudent {
  id: string
  name: string
  gender: '男' | '女'
  studentId: string
  className: string
  major: string
  counselor: string
  direction: EmploymentDirection
  region: EmploymentRegion
  unit: string
  position: string
  salary: string
}

export const employmentStudents: EmploymentStudent[] = [
  // 升学深造
  { id: 'e01', name: '孟宪章', gender: '男', studentId: '2021001155', className: '计科2101', major: '计算机科学与技术', counselor: '王芳', direction: '升学深造', region: '广州', unit: '中山大学', position: '学术硕士', salary: '—' },
  { id: 'e02', name: '严思齐', gender: '男', studentId: '2021003133', className: '人工智能2101', major: '人工智能', counselor: '陈静', direction: '升学深造', region: '境外', unit: '香港科技大学', position: '研究型硕士', salary: '—' },
  { id: 'e03', name: '苏婉清', gender: '女', studentId: '2021002007', className: '软工2101', major: '软件工程', counselor: '李强', direction: '升学深造', region: '北京/上海', unit: '上海交通大学', position: '专业硕士', salary: '—' },
  { id: 'e04', name: '林昭华', gender: '男', studentId: '2021001012', className: '计科2101', major: '计算机科学与技术', counselor: '王芳', direction: '升学深造', region: '广州', unit: '华南理工大学', position: '学术硕士', salary: '—' },
  { id: 'e05', name: '罗欣妍', gender: '女', studentId: '2021005009', className: '金融科技2101', major: '金融科技', counselor: '赵磊', direction: '升学深造', region: '境外', unit: '新加坡国立大学', position: '授课型硕士', salary: '—' },

  // 企业就业
  { id: 'e06', name: '钟灵毓', gender: '女', studentId: '2021002155', className: '软工2101', major: '软件工程', counselor: '李强', direction: '企业就业', region: '深圳', unit: '腾讯科技', position: '后端开发工程师', salary: '25.2k×16' },
  { id: 'e07', name: '龚俊熙', gender: '男', studentId: '2021004111', className: '大数据2101', major: '大数据管理与应用', counselor: '刘伟', direction: '企业就业', region: '深圳', unit: '华为技术', position: '数据工程师', salary: '23.5k×15' },
  { id: 'e08', name: '崔宇轩', gender: '男', studentId: '2021001133', className: '计科2102', major: '计算机科学与技术', counselor: '王芳', direction: '企业就业', region: '深圳', unit: '大疆创新', position: '嵌入式工程师', salary: '22.0k×14' },
  { id: 'e09', name: '张沐宸', gender: '男', studentId: '2021003025', className: '人工智能2101', major: '人工智能', counselor: '陈静', direction: '企业就业', region: '北京/上海', unit: '字节跳动', position: '算法工程师', salary: '28.0k×16' },
  { id: 'e10', name: '萧景铄', gender: '男', studentId: '2021002133', className: '软工2101', major: '软件工程', counselor: '李强', direction: '企业就业', region: '广州', unit: '网易（广州）', position: '游戏开发工程师', salary: '20.0k×15' },
  { id: 'e11', name: '董欣悦', gender: '女', studentId: '2021004088', className: '大数据2101', major: '大数据管理与应用', counselor: '刘伟', direction: '企业就业', region: '广州', unit: '广发证券', position: '数据分析师', salary: '16.5k×16' },
  { id: 'e12', name: '潘思远', gender: '男', studentId: '2021003111', className: '人工智能2101', major: '人工智能', counselor: '陈静', direction: '企业就业', region: '珠三角其他', unit: 'OPPO（东莞）', position: 'AI 算法工程师', salary: '21.0k×14' },
  { id: 'e13', name: '何雨萱', gender: '女', studentId: '2021002056', className: '软工2101', major: '软件工程', counselor: '李强', direction: '企业就业', region: '广州', unit: '唯品会', position: '前端工程师', salary: '17.0k×14' },
  { id: 'e14', name: '吴俊杰', gender: '男', studentId: '2021004021', className: '大数据2101', major: '大数据管理与应用', counselor: '刘伟', direction: '企业就业', region: '深圳', unit: '招商银行信息技术部', position: '数据开发', salary: '19.0k×16' },
  { id: 'e15', name: '陈奕帆', gender: '男', studentId: '2021001045', className: '计科2101', major: '计算机科学与技术', counselor: '王芳', direction: '企业就业', region: '北京/上海', unit: '美团', position: '后端开发工程师', salary: '26.0k×15' },
  { id: 'e16', name: '李政道', gender: '男', studentId: '2021001088', className: '计科2102', major: '计算机科学与技术', counselor: '王芳', direction: '企业就业', region: '珠三角其他', unit: '美的集团（佛山）', position: '软件工程师', salary: '18.0k×14' },
  { id: 'e17', name: '刘子恒', gender: '男', studentId: '2021003077', className: '人工智能2101', major: '人工智能', counselor: '陈静', direction: '企业就业', region: '深圳', unit: '平安科技', position: '机器学习工程师', salary: '22.0k×14' },
  { id: 'e18', name: '曾雅琪', gender: '女', studentId: '2021005033', className: '金融科技2101', major: '金融科技', counselor: '赵磊', direction: '企业就业', region: '广州', unit: '中国移动广东', position: '数据产品经理', salary: '15.0k×16' },
  { id: 'e19', name: '邓皓轩', gender: '男', studentId: '2021001099', className: '计科2102', major: '计算机科学与技术', counselor: '王芳', direction: '企业就业', region: '珠三角其他', unit: 'vivo（东莞）', position: '测试开发工程师', salary: '17.5k×14' },
  { id: 'e20', name: '唐梦洁', gender: '女', studentId: '2021004066', className: '大数据2101', major: '大数据管理与应用', counselor: '刘伟', direction: '企业就业', region: '广州', unit: '三七互娱', position: '数据运营', salary: '14.0k×14' },

  // 公务员
  { id: 'e21', name: '石清晏', gender: '男', studentId: '2021005066', className: '金融科技2101', major: '金融科技', counselor: '赵磊', direction: '公务员', region: '广州', unit: '广东省委组织部（选调生）', position: '选调生', salary: '—' },
  { id: 'e22', name: '范文博', gender: '男', studentId: '2021002088', className: '软工2101', major: '软件工程', counselor: '李强', direction: '公务员', region: '广州', unit: '广州市税务局', position: '公务员', salary: '—' },

  // 自主创业
  { id: 'e23', name: '孔祥瑞', gender: '男', studentId: '2021001120', className: '计科2101', major: '计算机科学与技术', counselor: '王芳', direction: '自主创业', region: '广州', unit: '广州小微科技（自主创业）', position: '联合创始人', salary: '—' },
  { id: 'e24', name: '蒋雨欣', gender: '女', studentId: '2021005044', className: '金融科技2101', major: '金融科技', counselor: '赵磊', direction: '自主创业', region: '珠三角其他', unit: '跨境电商工作室', position: '主理人', salary: '—' },

  // 其他
  { id: 'e25', name: '赵启明', gender: '男', studentId: '2021002200', className: '软工2101', major: '软件工程', counselor: '李强', direction: '其他', region: '省外其他', unit: '灵活就业（自由开发者）', position: '独立开发', salary: '—' },
  { id: 'e26', name: '郑思远', gender: '男', studentId: '2021001240', className: '计科2102', major: '计算机科学与技术', counselor: '王芳', direction: '其他', region: '省外其他', unit: '暂缓就业（备考中）', position: '—', salary: '—' },
]

export function getEmploymentRoster(): EmploymentStudent[] {
  return employmentStudents
}
