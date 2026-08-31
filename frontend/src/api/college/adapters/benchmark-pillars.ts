import type {
  AchievementCategory,
  BenchmarkAchievementItemDTO,
  BenchmarkAchievementsDTO,
  BenchmarkFeaturedDTO,
  BenchmarkPillarDTO,
  BenchmarkPillarKey,
  FeaturedSectionKey,
} from '@/types/college/api/benchmark-achievements'
import type {
  BenchmarkPillarEvidenceVM,
  BenchmarkSwotRowVM,
} from '@/types/college/view/benchmark-achievements'

export type BenchmarkSwotSide = 'strengths' | 'weaknesses'

/** 优势页用「证明强」的指标，劣势页用「暴露弱」的指标 */
const SWOT_METRIC_LABELS: Record<BenchmarkSwotSide, Record<BenchmarkPillarKey, string[]>> = {
  strengths: {
    research: ['一区论文', '科研成果'],
    teaching: ['教学成果', '年度荣誉'],
    talent: ['名师头雁', '竞赛国奖'],
    discipline: ['平台成果'],
    party: ['党建相关成果'],
  },
  weaknesses: {
    research: ['国家级课题', '一区论文'],
    teaching: ['教学成果'],
    talent: ['金奖 / 特等', '竞赛国奖'],
    discipline: ['平台成果'],
    party: ['党建相关成果'],
  },
}

function pickSwotMetric(pillar: BenchmarkPillarDTO, side: BenchmarkSwotSide) {
  for (const label of SWOT_METRIC_LABELS[side][pillar.key]) {
    const hit = pillar.metrics.find((item) => item.label === label)
    if (hit) return hit
  }
  return pillar.metrics[0]
}

/** 一级两页轮播：五大板块各一行 */
export function buildSwotRows(
  pillars: BenchmarkPillarDTO[],
  side: BenchmarkSwotSide,
): BenchmarkSwotRowVM[] {
  const map = new Map(pillars.map((item) => [item.key, item]))
  return BENCHMARK_PILLAR_META.flatMap((meta) => {
    const pillar = map.get(meta.key)
    if (!pillar) return []
    const metric = pickSwotMetric(pillar, side)
    const lines = side === 'strengths' ? pillar.strengths : pillar.weaknesses
    return [
      {
        key: meta.key,
        label: meta.label,
        metricLabel: metric?.label ?? '—',
        metricValue: metric?.value ?? '—',
        metricUnit: metric?.unit,
        text:
          lines[0] ??
          (side === 'strengths' ? '暂无足够数据研判优势' : '暂无突出短板'),
        empty: lines.length === 0,
      },
    ]
  })
}

export const BENCHMARK_PILLAR_META: Array<{ key: BenchmarkPillarKey; label: string }> = [
  { key: 'research', label: '科研' },
  { key: 'teaching', label: '教学' },
  { key: 'talent', label: '人才培养' },
  { key: 'discipline', label: '学科建设' },
  { key: 'party', label: '党建' },
]

/** 九大专题 → 五大板块；社会服务不单列，仅党建关键词可进入党建 */
export const FEATURED_TO_PILLAR: Partial<Record<FeaturedSectionKey, BenchmarkPillarKey>> = {
  topic: 'research',
  output: 'research',
  paper: 'research',
  award: 'teaching',
  talent: 'talent',
  competition: 'talent',
  platform: 'discipline',
  collective: 'party',
}

const CATEGORY_TO_PILLAR: Record<AchievementCategory, BenchmarkPillarKey | null> = {
  research: 'research',
  teaching: 'teaching',
  competition: 'talent',
  faculty: 'talent',
  platform: 'discipline',
  social: null,
}

const PARTY_RE = /党建|思政|支部|五四红旗|先进班集体|样板支部|党员|主题党日/

const OLD_FILTER_TO_PILLAR: Record<string, BenchmarkPillarKey> = {
  teaching: 'teaching',
  research: 'research',
  competition: 'talent',
  faculty: 'talent',
  platform: 'discipline',
  social: 'party',
}

export function isPartyText(text?: string): boolean {
  return !!text && PARTY_RE.test(text)
}

/** 单条成果归属哪个板块；党建关键词优先 */
export function resolveItemPillar(item: {
  title: string
  category: AchievementCategory
  categoryLabel?: string
}): BenchmarkPillarKey | null {
  if (isPartyText(item.title) || isPartyText(item.categoryLabel)) return 'party'
  return CATEGORY_TO_PILLAR[item.category] ?? null
}

export function resolvePillarFromQuery(query: {
  pillar?: unknown
  filter?: unknown
}): BenchmarkPillarKey {
  const raw = typeof query.pillar === 'string' ? query.pillar : ''
  if (BENCHMARK_PILLAR_META.some((p) => p.key === raw)) return raw as BenchmarkPillarKey
  const filter = typeof query.filter === 'string' ? query.filter : ''
  return OLD_FILTER_TO_PILLAR[filter] ?? 'research'
}

function catCount(dto: BenchmarkAchievementsDTO, category: AchievementCategory): number {
  return dto.byCategory.find((c) => c.category === category)?.count ?? 0
}

function clonePillar(pillar: BenchmarkPillarDTO): BenchmarkPillarDTO {
  return {
    key: pillar.key,
    label: pillar.label,
    metrics: pillar.metrics.map((m) => ({ ...m })),
    strengths: [...pillar.strengths],
    weaknesses: [...pillar.weaknesses],
    adoptionReasons: [...pillar.adoptionReasons],
    actions: [...pillar.actions],
    nextPlans: [...pillar.nextPlans],
  }
}

function collectPartyHits(dto: BenchmarkAchievementsDTO): BenchmarkAchievementItemDTO[] {
  const seen = new Set<string>()
  const hits: BenchmarkAchievementItemDTO[] = []
  for (const item of [...dto.gallery, ...dto.highlights]) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    if (isPartyText(item.title) || isPartyText(item.categoryLabel)) hits.push(item)
  }
  return hits
}

function fallbackLine(lines: string[], empty: string): string[] {
  return lines.length ? lines.slice(0, 2) : [empty]
}

function buildResearch(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO {
  const outputs = dto.summary.researchOutputs || catCount(dto, 'research')
  const national = dto.keyProjects.national
  const provincial = dto.keyProjects.provincial
  const firstTier = dto.topPapers.firstTierCount ?? 0
  const papers = dto.topPapers.count
  const funding = dto.keyProjects.fundingWan
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (national >= 8) strengths.push(`国家级课题 ${national} 项，科研攻坚有厚度`)
  if (firstTier >= 15) strengths.push(`中科院一区 ${firstTier} 篇，高能级论文可复制`)
  if (funding >= 1000) strengths.push(`到账经费 ${funding.toLocaleString('zh-CN')} 万元，项目承载力较强`)
  if (!strengths.length && outputs > 0) strengths.push(`科研成果 ${outputs} 项，具备持续产出`)

  if (national < 8 && provincial > national) {
    weaknesses.push('国家级课题偏少，省部级项目仍待跃迁')
  }
  if (papers > 50 && firstTier < 15) weaknesses.push('论文总量可观，一区占比仍需抬升')
  if (outputs === 0) weaknesses.push('科研标志性成果积累不足')
  if (!weaknesses.length) weaknesses.push('标志性重点专项与顶尖期刊仍有上行空间')

  return {
    key: 'research',
    label: '科研',
    metrics: [
      { label: '科研成果', value: outputs, unit: '项' },
      { label: '国家级课题', value: national, unit: '项' },
      { label: '省部级课题', value: provincial, unit: '项' },
      { label: '一区论文', value: firstTier, unit: '篇' },
      { label: '到账经费', value: Math.round(funding), unit: '万' },
    ],
    strengths: fallbackLine(strengths, '科研积累尚在起步'),
    weaknesses,
    adoptionReasons: [
      national >= 8
        ? `国家级课题已达 ${national} 项，说明团队具备冲高申报路径与材料复用基础`
        : `国家级课题仅 ${national} 项，现有优势更多来自省部级项目的数量堆积`,
      firstTier >= 15
        ? `一区论文 ${firstTier} 篇，高能级成果已被期刊体系验证，适合固化写作与投稿机制`
        : `一区论文 ${firstTier} 篇，高质量成果转化机制尚未闭环`,
    ],
    actions: [
      '对省部级在研项目组织冲国自然 / 重点专项工作坊，拆解可复用申报清单',
      '按方向组建一区论文攻关小组，明确目标期刊与节点日历',
    ],
    nextPlans: [
      '下一年度固化国省项目申报节点与材料模板',
      '把代表性顶刊成果升级为可复制的写作与合作清单',
    ],
  }
}

function buildTeaching(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO {
  const teaching = catCount(dto, 'teaching')
  const honors = dto.summary.annualHonors
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (teaching >= 8) strengths.push(`教学成果 ${teaching} 项，育人质量有抓手`)
  if (honors >= 10) strengths.push(`年度荣誉 ${honors} 项，示范效应明显`)
  if (!strengths.length && teaching > 0) strengths.push(`已有 ${teaching} 项教学成果可作申报样板`)

  if (teaching < 8) weaknesses.push('省级以上教学成果仍偏少，金课与教改厚度不足')
  if (teaching === 0) weaknesses.push('教学类标志性成果积累不足')
  if (!weaknesses.length) weaknesses.push('教学成果能级仍需向国家级跃迁')

  return {
    key: 'teaching',
    label: '教学',
    metrics: [
      { label: '教学成果', value: teaching, unit: '项' },
      { label: '年度荣誉', value: honors, unit: '项' },
    ],
    strengths: fallbackLine(strengths, '教学成果积累尚在起步'),
    weaknesses,
    adoptionReasons: [
      teaching >= 8
        ? `教学成果 ${teaching} 项，说明课程改革与团队协作已被奖项体系认可`
        : `教学成果仅 ${teaching} 项，现有荣誉尚未形成可复制的申报矩阵`,
      honors >= 10
        ? `年度荣誉 ${honors} 项，适合把「历史突破」拆成节点日历`
        : '年度荣誉偏散，缺少从课程到成果奖的闭环设计',
    ],
    actions: [
      '把省级教学成果拆成可复用的申报清单与课程建设节点',
      '一流课程、教改立项与教材建设交叉对照，补齐短板项',
    ],
    nextPlans: [
      '下一轮教学成果奖对标国家级，明确牵头团队与材料模板',
      '把标志性教学成果升级为可推广的课程包',
    ],
  }
}

function buildTalent(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO {
  const awards = dto.competitions.nationalAwards
  const gold = dto.competitions.goldOrSpecial
  const faculty = dto.facultyLeaders.total
  const nationalTalent = dto.facultyLeaders.national
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (gold >= 2) strengths.push(`竞赛金奖 / 特等 ${gold} 项，育人高光可复制`)
  if (faculty >= 3) strengths.push(`高层次人才 ${faculty} 人，头雁带动明显`)
  if (awards >= 5) strengths.push(`A 类国奖 ${awards} 项，竞赛矩阵已成型`)
  if (!strengths.length && (awards > 0 || faculty > 0)) {
    strengths.push('竞赛与师资已有单点突破，具备扩面基础')
  }

  if (awards < 5) weaknesses.push('A 类国奖厚度不足，高峰赛事覆盖偏窄')
  if (nationalTalent === 0 && faculty > 0) weaknesses.push('国家级人才仍待突破')
  if (!weaknesses.length) weaknesses.push('竞赛高光与课程、平台的交叉赋能还不够')

  return {
    key: 'talent',
    label: '人才培养',
    metrics: [
      { label: '竞赛国奖', value: awards, unit: '项' },
      { label: '金奖 / 特等', value: gold, unit: '项' },
      { label: '名师头雁', value: faculty, unit: '人' },
      { label: '国家级人才', value: nationalTalent, unit: '人' },
    ],
    strengths: fallbackLine(strengths, '人才培养标志性成果积累不足'),
    weaknesses,
    adoptionReasons: [
      gold >= 2
        ? `金奖 / 特等已达 ${gold} 项，说明竞赛辅导链路有效，可沉淀为训练营机制`
        : `金奖 / 特等仅 ${gold} 项，现有国奖更多来自个别团队而非体系化培养`,
      faculty >= 3
        ? `名师头雁 ${faculty} 人，适合以导师制把竞赛、科研与课程串成育人闭环`
        : '高层次人才数量有限，竞赛与课堂尚未形成稳定交叉赋能',
    ],
    actions: [
      '把金奖团队经验固化为竞赛训练营与指导教师清单',
      '竞赛、一流课程与平台建设交叉组队，形成育人闭环试点',
    ],
    nextPlans: [
      '下一赛季明确三大赛冲金指标与节点',
      '选择 1～2 个方向做「课程—竞赛—导师」闭环试点',
    ],
  }
}

function buildDiscipline(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO {
  const platforms = dto.summary.platformOutputs || catCount(dto, 'platform')
  const strengths: string[] = []
  const weaknesses: string[] = []

  if (platforms >= 5) strengths.push(`平台成果 ${platforms} 项，学科支撑较完整`)
  else if (platforms > 0) strengths.push(`已有 ${platforms} 个平台成果，可作为高峰学科支点`)

  if (platforms < 5) weaknesses.push('高能级平台数量仍偏少，学科高峰不够尖')
  if (platforms === 0) weaknesses.push('学科平台类成果积累不足')

  return {
    key: 'discipline',
    label: '学科建设',
    metrics: [{ label: '平台成果', value: platforms, unit: '项' }],
    strengths: fallbackLine(strengths, '学科平台积累尚在起步'),
    weaknesses,
    adoptionReasons: [
      platforms >= 5
        ? `平台成果 ${platforms} 项，说明实验室 / 工程中心已能承接科研与育人`
        : `平台成果仅 ${platforms} 项，学科高峰缺少稳定载体`,
      '平台层次决定申报上限，现有短板多来自省部级以上平台覆盖不足',
    ],
    actions: [
      '对照高峰学科 / 申博指标，列出平台缺口与申报窗口',
      '把已有平台与标志性课题、精品课程绑定，形成支撑证据链',
    ],
    nextPlans: [
      '下一年度排出 1 个重点平台冲高计划与材料节点',
      '对标省内同类学院，补齐平台层次短板',
    ],
  }
}

function buildPartyFromCount(count: number): BenchmarkPillarDTO {
  if (count === 0) {
    return {
      key: 'party',
      label: '党建',
      metrics: [{ label: '党建相关成果', value: 0, unit: '项' }],
      strengths: [],
      weaknesses: ['党建类标志性成果积累不足，尚未形成可展示的荣誉矩阵'],
      adoptionReasons: [
        '现有成果库未单列党建口径，支部荣誉与思政成果未进入精品成果主清单',
        '集体荣誉多归入教学 / 团学，驾驶舱中党建板块容易表现为空白',
      ],
      actions: [
        '明确党建成果认定口径（样板支部、思政项目、主题党日示范）并纳入成果库',
        '梳理近三年支部与团学荣誉，补录可展示条目',
      ],
      nextPlans: [
        '下一学期完成党建成果台账与精品成果映射',
        '选择 1 个样板支部做培育与认定试点',
      ],
    }
  }

  return {
    key: 'party',
    label: '党建',
    metrics: [{ label: '党建相关成果', value: count, unit: '项' }],
    strengths: [`已沉淀 ${count} 项集体 / 党建荣誉，组织育人有抓手`],
    weaknesses:
      count < 3
        ? ['党建荣誉能级仍偏低，样板支部 / 省级以上覆盖不足']
        : ['党建成果尚未与教学、科研、育人场景形成稳定联动'],
    adoptionReasons: [
      `已识别 ${count} 项支部 / 集体荣誉，说明组织育人有现成样板可复用`,
      '若只停留在荣誉罗列，难以支撑思政与事业发展双融合',
    ],
    actions: [
      '把样板支部经验拆成可复制的组织生活与育人清单',
      '党建成果与课程思政、社会服务交叉举证，避免单点展示',
    ],
    nextPlans: [
      '下一年度明确省级以上党建荣誉冲刺目标',
      '建立党建成果与五大板块的年度对照台账',
    ],
  }
}

function buildParty(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO {
  return buildPartyFromCount(collectPartyHits(dto).length)
}

/** 二级有专题清单后，用实际条数回填党建研判，避免「0 项 + 清单有数」 */
export function refinePartyPillar(
  pillar: BenchmarkPillarDTO,
  evidenceCount: number,
): BenchmarkPillarDTO {
  if (pillar.key !== 'party') return pillar
  const current = Number(pillar.metrics[0]?.value ?? 0)
  if (current === evidenceCount) return pillar
  return buildPartyFromCount(evidenceCount)
}

const BUILDERS: Record<BenchmarkPillarKey, (dto: BenchmarkAchievementsDTO) => BenchmarkPillarDTO> = {
  research: buildResearch,
  teaching: buildTeaching,
  talent: buildTalent,
  discipline: buildDiscipline,
  party: buildParty,
}

/** 优先用后端透传的 pillars，缺的板块用现有 KPI 派生补齐 */
export function deriveBenchmarkPillars(dto: BenchmarkAchievementsDTO): BenchmarkPillarDTO[] {
  const incoming = new Map((dto.pillars ?? []).map((p) => [p.key, clonePillar(p)]))
  return BENCHMARK_PILLAR_META.map((meta) => incoming.get(meta.key) ?? BUILDERS[meta.key](dto))
}

/** 二级清单：成果条目 + 对应专题表，按板块过滤 */
export function collectPillarEvidence(
  pillar: BenchmarkPillarKey,
  achievements: BenchmarkAchievementItemDTO[],
  featured?: BenchmarkFeaturedDTO | null,
): BenchmarkPillarEvidenceVM[] {
  const rows: BenchmarkPillarEvidenceVM[] = []
  const titles = new Set<string>()

  const push = (row: BenchmarkPillarEvidenceVM) => {
    const key = row.title.trim()
    if (!key || titles.has(key)) return
    titles.add(key)
    rows.push(row)
  }

  for (const item of achievements) {
    if (resolveItemPillar(item) !== pillar) continue
    push({
      id: item.id,
      title: item.title,
      categoryLabel: item.categoryLabel,
      level: item.level,
      date: item.date,
      leader: item.leader,
    })
  }

  if (featured) {
    for (const section of featured.sections) {
      const mapped = FEATURED_TO_PILLAR[section.key]
      for (const [index, item] of section.items.entries()) {
        const textHit = isPartyText(item.name) || isPartyText(item.category)
        // 党建只收关键词命中，避免集体荣誉专题里的竞赛/团队被误归
        if (pillar === 'party') {
          if (!textHit) continue
        } else if (mapped !== pillar || textHit) {
          continue
        }
        push({
          id: `${section.key}-${index}`,
          title: item.name,
          categoryLabel: item.category,
          level: item.level,
          date: item.date,
          leader: item.leader,
          source: section.name,
        })
      }
    }
  }

  return rows
}
