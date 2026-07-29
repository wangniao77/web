/**
 * 综合素养 / 奖惩助贷 共享模拟数据
 *
 * 该模块集中存放荣誉成果、纪律处分、奖学金与资助帮扶的 mock 数据，
 * 供「综合素养台账」与「奖惩助贷详情」两个二级页面复用，避免数据重复定义。
 */

/* ─────────── 类型定义 ─────────── */

export interface HonorColumn {
  key: string
  label: string
  /** 佐证材料列：渲染为下载链接 */
  evidence?: boolean
  /** 数值后缀，如「元」「小时」 */
  suffix?: string
}

export interface HonorSub {
  key: string
  label: string
  columns: HonorColumn[]
  rows: Record<string, string>[]
}

export interface HonorGroup {
  key: string
  label: string
  sub?: HonorSub[]
  columns?: HonorColumn[]
  rows?: Record<string, string>[]
}

/* ─────────── 荣誉成果 mock data ─────────── */

const competitionRecords = [
  {
    name: '全国大学生数学建模竞赛',
    level: '国家级',
    awardLevel: '一等奖',
    type: '学科类',
    track: '大数据方向',
    role: '队长',
    members: '张三、李四、王五',
    organizer: '中国工业与应用数学学会',
    date: '2024-09',
    advisor: '陈教授',
    evidence: '获奖证书.pdf',
  },
  {
    name: '中国国际“互联网+”大学生创新创业大赛',
    level: '省级',
    awardLevel: '金奖',
    type: '双创类',
    track: '人工智能方向',
    role: '第二参加人',
    members: '赵六、张三、孙七',
    organizer: '广东省教育厅',
    date: '2024-06',
    advisor: '李教授',
    evidence: '获奖证书.pdf',
  },
]

const researchProjects = [
  {
    name: '基于深度学习的金融时序预测模型研究',
    number: '2024A001',
    source: '国家级大创',
    level: '国家级',
    role: '项目主持人',
    status: '在研',
    startDate: '2024-03',
    endDate: '—',
    advisor: '王教授',
    members: '张三（负责人）、李四、王五',
    evidence: '立项通知书.pdf',
  },
]

const researchPapers = [
  {
    title: '基于Transformer的时间序列预测方法综述',
    venue: '《计算机学报》',
    venueLevel: 'CCF A类',
    index: 'SCI收录',
    authorOrder: '第一作者',
    date: '2024-05',
    doi: '10.1234/abc123',
    advisor: '陈教授',
    coAuthors: '张三（广工）、李四（清华）',
    evidence: '论文全文.pdf',
  },
]

const patents = [
  {
    name: '一种基于AI的图像识别系统',
    type: '软件著作权',
    applyNumber: '2024SR123456',
    patentNumber: '—',
    authDate: '2024-08-15',
    inventorOrder: '第一发明人',
    owner: '广东工业大学',
    advisor: '刘教授',
    evidence: '登记证书.pdf',
  },
]

const otherAchievements = [
  {
    type: '会议报告',
    name: '深度学习在金融风控中的应用',
    eventName: 'IEEE 国际数据科学会议',
    eventLevel: '国际会议',
    platform: '会议论文集',
    authorOrder: '第一完成人',
    form: '口头报告',
    date: '2024-11',
    evidence: '会议议程.pdf',
  },
]

const honorTitles = [
  {
    name: '2024-2025学年三好学生',
    grantor: '学校',
    level: '校级',
    period: '2024-2025学年第一学期',
    date: '2024-09-10',
    certNumber: '—',
    evidence: '荣誉证书.pdf',
  },
]

const scholarshipRecords = [
  {
    name: '国家励志奖学金',
    level: '国家级',
    year: '2024-2025学年',
    date: '2024-10-15',
    grantor: '教育部',
    amount: '5000',
    certNumber: '—',
    evidence: '获奖证书.pdf',
  },
]

const practiceRecords = [
  {
    name: '暑期三下乡社会实践优秀团队',
    type: '社会实践',
    organizer: '校团委',
    level: '校级',
    hours: '120',
    location: '乡村',
    period: '2024-07-01 至 2024-07-15',
    role: '负责人',
    summary: '大数据调研、AI公益服务',
    evidence: '实践证明.pdf',
  },
]

const artRecords = [
  {
    name: '校运动会男子100米冠军',
    level: '校级',
    award: '第1名',
    date: '2024-05',
    organizer: '体育部',
    evidence: '获奖证书.pdf',
  },
]

const collectiveRecords = [
  {
    name: '省级先进班集体',
    level: '省级',
    date: '2024-06',
    grantor: '广东省教育厅',
    members: '张三、李四、王五等30人',
    contribution: '班级骨干，贡献度20%',
    evidence: '获奖文件.pdf',
  },
]

const skillCertificates = [
  {
    name: '全国计算机等级考试三级（数据库技术）',
    issuer: '教育部考试中心',
    date: '2024-03',
    number: '—',
    evidence: '证书扫描件.pdf',
  },
]

export const honorGroups: HonorGroup[] = [
  {
    key: 'competition',
    label: '学科竞赛',
    columns: [
      { key: 'name', label: '竞赛名称' },
      { key: 'level', label: '竞赛级别' },
      { key: 'awardLevel', label: '获奖等级' },
      { key: 'type', label: '竞赛类型' },
      { key: 'track', label: '竞赛赛道' },
      { key: 'role', label: '参赛角色' },
      { key: 'members', label: '团队成员' },
      { key: 'organizer', label: '主办单位' },
      { key: 'date', label: '获奖时间' },
      { key: 'advisor', label: '指导教师' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: competitionRecords,
  },
  {
    key: 'research',
    label: '科研成果',
    sub: [
      {
        key: 'project',
        label: '项目',
        columns: [
          { key: 'name', label: '项目名称' },
          { key: 'number', label: '项目编号' },
          { key: 'source', label: '来源/类型' },
          { key: 'level', label: '项目级别' },
          { key: 'role', label: '担任角色' },
          { key: 'status', label: '项目状态' },
          { key: 'startDate', label: '立项时间' },
          { key: 'endDate', label: '结题时间' },
          { key: 'advisor', label: '指导教师' },
          { key: 'members', label: '项目成员' },
          { key: 'evidence', label: '佐证材料', evidence: true },
        ],
        rows: researchProjects,
      },
      {
        key: 'paper',
        label: '论文',
        columns: [
          { key: 'title', label: '论文题目' },
          { key: 'venue', label: '发表刊物/会议' },
          { key: 'venueLevel', label: '刊物/会议级别' },
          { key: 'index', label: '收录/检索' },
          { key: 'authorOrder', label: '作者排序' },
          { key: 'date', label: '发表时间' },
          { key: 'doi', label: 'DOI编号' },
          { key: 'advisor', label: '指导老师' },
          { key: 'coAuthors', label: '合作者' },
          { key: 'evidence', label: '佐证材料', evidence: true },
        ],
        rows: researchPapers,
      },
      {
        key: 'patent',
        label: '专利软著',
        columns: [
          { key: 'name', label: '知识产权名称' },
          { key: 'type', label: '知识产权类型' },
          { key: 'applyNumber', label: '申请/登记号' },
          { key: 'patentNumber', label: '专利号' },
          { key: 'authDate', label: '授权/登记时间' },
          { key: 'inventorOrder', label: '发明人/设计人排序' },
          { key: 'owner', label: '专利权人/著作权人' },
          { key: 'advisor', label: '指导老师' },
          { key: 'evidence', label: '佐证材料', evidence: true },
        ],
        rows: patents,
      },
      {
        key: 'other',
        label: '其他',
        columns: [
          { key: 'type', label: '成果类型' },
          { key: 'name', label: '成果名称' },
          { key: 'eventName', label: '会议/活动名称' },
          { key: 'eventLevel', label: '会议级别' },
          { key: 'platform', label: '成果发布平台' },
          { key: 'authorOrder', label: '完成人排序' },
          { key: 'form', label: '汇报形式' },
          { key: 'date', label: '成果时间' },
          { key: 'evidence', label: '佐证材料', evidence: true },
        ],
        rows: otherAchievements,
      },
    ],
  },
  {
    key: 'honor',
    label: '荣誉称号',
    columns: [
      { key: 'name', label: '荣誉称号名称' },
      { key: 'grantor', label: '授予单位' },
      { key: 'level', label: '荣誉等级' },
      { key: 'period', label: '授予学年/学期' },
      { key: 'date', label: '获得时间' },
      { key: 'certNumber', label: '证书编号' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: honorTitles,
  },
  {
    key: 'scholarship',
    label: '奖学金',
    columns: [
      { key: 'name', label: '奖学金名称' },
      { key: 'level', label: '奖学金等级' },
      { key: 'year', label: '获奖学年' },
      { key: 'date', label: '获奖时间' },
      { key: 'grantor', label: '颁奖单位' },
      { key: 'amount', label: '奖金金额', suffix: ' 元' },
      { key: 'certNumber', label: '证书编号' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: scholarshipRecords,
  },
  {
    key: 'practice',
    label: '社会实践与志愿服务',
    columns: [
      { key: 'name', label: '活动/荣誉名称' },
      { key: 'type', label: '实践类型' },
      { key: 'organizer', label: '组织单位' },
      { key: 'level', label: '活动级别' },
      { key: 'hours', label: '服务总时长', suffix: ' 小时' },
      { key: 'location', label: '服务地点' },
      { key: 'period', label: '活动时间' },
      { key: 'role', label: '担任角色' },
      { key: 'summary', label: '实践内容简述' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: practiceRecords,
  },
  {
    key: 'art',
    label: '文体艺术',
    columns: [
      { key: 'name', label: '荣誉名称' },
      { key: 'level', label: '活动级别' },
      { key: 'award', label: '获奖等级/名次' },
      { key: 'date', label: '活动时间' },
      { key: 'organizer', label: '组织单位' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: artRecords,
  },
  {
    key: 'collective',
    label: '集体荣誉',
    columns: [
      { key: 'name', label: '集体荣誉名称' },
      { key: 'level', label: '荣誉级别' },
      { key: 'date', label: '获奖时间' },
      { key: 'grantor', label: '授予单位' },
      { key: 'members', label: '成员名单' },
      { key: 'contribution', label: '个人贡献度' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: collectiveRecords,
  },
  {
    key: 'skill',
    label: '技能证书',
    columns: [
      { key: 'name', label: '证书名称' },
      { key: 'issuer', label: '发证机构' },
      { key: 'date', label: '获得时间' },
      { key: 'number', label: '证书编号' },
      { key: 'evidence', label: '佐证材料', evidence: true },
    ],
    rows: skillCertificates,
  },
]

/* ─────────── 纪律处分 mock data ─────────── */

export const disciplinaryRecords = [
  {
    type: '警告',
    reason: '考试作弊',
    docNumber: '校学〔2024〕001号',
    unit: '学生工作部',
    date: '2024-03-15',
    period: '6个月',
    status: '已解除',
    requirement: '认真反省，诚信考试',
    evidence: '处分决定书.pdf',
  },
]

export const criticismRecords = [
  {
    reason: '无故旷课累计10学时',
    scope: '学院通报',
    unit: '学院学工办',
    date: '2024-04-10',
    requirement: '限期补齐考勤',
    evidence: '通报文件.pdf',
  },
]

export const academicWarnings = [
  {
    type: '挂科过多预警',
    target: '高等数学、线性代数',
    count: '2',
    measure: '学业谈话、强制辅导',
    deduction: '—',
    date: '2024-07-01',
    recorder: '辅导员',
  },
]

export const integrityRecords = [
  {
    type: '图书馆借书超期',
    detail: '图书馆借书超期3个月未还',
    amount: '—',
    status: '已结清',
    result: '已归还图书',
    date: '2024-02-15',
    evidence: '图书馆罚单.pdf',
  },
]

/* ─────────── 资助帮扶 mock data（新增，供「奖惩助贷详情」使用） ─────────── */

export interface AidTypeItem {
  name: string
  on: boolean
}

export interface AidHistoryItem {
  date: string
  text: string
}

export interface AidProfile {
  /** 是否存在资助记录 */
  hasAid: boolean
  /** 当前资助状态文案 */
  statusText: string
  /** 状态等级：normal=绿 / warn=黄 */
  statusLevel: 'normal' | 'warn'
  /** 困难认定等级 */
  difficultyLevel: string
  /** 资助类型清单（on=false 表示未享受） */
  aidTypes: AidTypeItem[]
  /** 资助历史时间轴 */
  history: AidHistoryItem[]
}

export const aidProfile: AidProfile = {
  hasAid: true,
  statusText: '资助中',
  statusLevel: 'normal',
  difficultyLevel: '一般困难',
  aidTypes: [
    { name: '国家助学金', on: true },
    { name: '生源地信用贷款', on: true },
    { name: '勤工助学', on: true },
  ],
  history: [
    { date: '2025-09', text: '获得国家助学金（一等）' },
    { date: '2024-09', text: '完成家庭经济困难认定' },
    { date: '2024-03', text: '申请临时困难补助' },
  ],
}
