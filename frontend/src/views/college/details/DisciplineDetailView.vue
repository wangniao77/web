<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import DisciplineAiBriefPanel from '@/components/college/modules/discipline/DisciplineAiBriefPanel.vue'
import AgentFollowUpChat from '@/components/ai/AgentFollowUpChat.vue'
import { disciplineService } from '@/api/college/services/discipline'
import { useScope } from '@/composables/useScope'
import { useAgentAnalysis } from '@/composables/useAgentAnalysis'
import type { AgentAnalyzeContextDTO } from '@/types/agent/api'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineOverviewDetailVM } from '@/types/college/view/discipline-overview'
import type { DisciplineNum, SoftDimensionDTO } from '@/types/college/api/discipline-overview'
import { fmtFacultyNum, isMissingMark } from '@/utils/facultyDisplay'
import {
  attachDisciplineEvidence,
  buildDisciplineOverviewRuleAnalysis,
  buildDisciplineOverviewSnapshot,
} from '@/utils/agent/discipline-overview-insights'
import type { EChartsOption } from 'echarts'

const route = useRoute()
const router = useRouter()
const { collegeScope } = useScope()

const data = ref<DisciplineOverviewDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

type TabKey = 'overview' | 'profile' | 'benchmark' | 'insights'
const TAB_KEYS: TabKey[] = ['overview', 'profile', 'benchmark', 'insights']

const currentTab = ref<TabKey>('overview')
const tabBarRef = ref<HTMLElement | null>(null)
const activeSection = ref('')
const activeMajor = ref('')
const profileSection = ref<'basic' | 'faculty' | 'outcomes' | 'enrollment' | 'cultivation' | 'judgment'>('basic')

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function switchTab(tab: TabKey, options?: { major?: string; replaceQuery?: boolean }) {
  currentTab.value = tab
  activeSection.value = ''
  if (options?.major) activeMajor.value = options.major
  if (options?.replaceQuery !== false) {
    const query: Record<string, string> = { tab }
    if (activeMajor.value) query.major = activeMajor.value
    router.replace({ path: ROUTES.college.disciplineDetail, query })
  }
  nextTick(() => {
    getDetailScroller()?.scrollTo({ top: 0, behavior: 'auto' })
  })
}

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  const scroller = getDetailScroller()
  if (!el || !scroller) return
  const targetTop =
    scroller.scrollTop +
    el.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top -
    8
  scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
}

function formatChange(change: DisciplineNum | undefined) {
  if (isMissingMark(change) || typeof change !== 'number') return '**'
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '→'
}

function fmtNum(v: DisciplineNum | string | null | undefined) {
  return fmtFacultyNum(v as never)
}

function rankOrInf(v: DisciplineNum | undefined, missingAs = Infinity) {
  if (typeof v === 'number' && Number.isFinite(v)) return v
  return missingAs
}

function shortMajor(name: string) {
  if (name.includes('计算机')) return '计科'
  if (name.includes('软件')) return '软工'
  if (name.includes('人工')) return '人工智能'
  return name
}

const profile = computed(() =>
  data.value?.majorProfiles.find((p) => p.name === activeMajor.value) ?? null,
)

type MajorProfile = NonNullable<DisciplineOverviewDetailVM['majorProfiles'][number]>
type DimStatus = 'best' | 'mid' | 'worst'

function numOrZero(v: DisciplineNum | undefined): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

function rankOf(value: number, values: number[]): DimStatus {
  if (!values.some((v) => v > 0)) return 'mid'
  const sorted = [...values].sort((a, b) => b - a)
  const idx = sorted.indexOf(value)
  if (idx === 0) return 'best'
  if (idx === sorted.length - 1) return 'worst'
  return 'mid'
}

const STATUS_LABEL: Record<DimStatus, string> = {
  best: '🟢 优势',
  mid: '🟡 持平',
  worst: '🔴 劣势',
}

type DimRow = {
  key: string
  icon: string
  format: string
  status: DimStatus
  why: string
}

const analysisGrade = computed(() => {
  const g = profile.value?.grade
  return g && !isMissingMark(g) ? String(g) : ''
})

const dimensionRowsForMajor = computed<DimRow[]>(() => {
  const profiles = data.value?.majorProfiles
  const p = profile.value
  if (!profiles || !p) return []
  const others = profiles.filter((x) => x.name !== p.name).map((x) => x.name)

  const configs: {
    key: string
    icon: string
    value: (x: MajorProfile) => number
    format: (x: MajorProfile) => string
    why: (x: MajorProfile, status: DimStatus, others: string[]) => string
  }[] = [
    {
      key: '课程质量',
      icon: '📚',
      value: (x) => numOrZero(x.outcomes.eliteCourses),
      format: (x) =>
        `${fmtNum(x.outcomes.eliteCourses)} 门一流课程 · 教学获奖 ${fmtNum(x.outcomes.teachingAwards)} 项 · 教改 ${fmtNum(x.outcomes.reformProjects)} 项`,
      why: (x, s, o) => {
        if (s === 'best')
          return `「${x.name}」建成一流课程 ${fmtNum(x.outcomes.eliteCourses)} 门（居全院之首），教学获奖 ${fmtNum(x.outcomes.teachingAwards)} 项、教改立项 ${fmtNum(x.outcomes.reformProjects)} 项同步领先，课程体系成熟，是核心优势维度。`
        if (s === 'worst')
          return `「${x.name}」仅 ${fmtNum(x.outcomes.eliteCourses)} 门一流课程，明显少于 ${o.join('、')}，金课建设与教改投入不足，是主要短板。`
        return `「${x.name}」一流课程 ${fmtNum(x.outcomes.eliteCourses)} 门、教学获奖 ${fmtNum(x.outcomes.teachingAwards)} 项，处于院系中游，需向头部专业看齐。`
      },
    },
    {
      key: '教师评价',
      icon: '👨‍🏫',
      value: (x) => numOrZero(x.faculty.phdRatio),
      format: (x) =>
        `博士占比 ${fmtNum(x.faculty.phdRatio)}% · 专任 ${fmtNum(x.faculty.total)} 人 · 省级人才 ${fmtNum(x.faculty.talentCount)} 人 · 名师 ${fmtNum(x.faculty.teachingMasters)} 人`,
      why: (x, s, o) => {
        if (s === 'best')
          return `「${x.name}」博士占比 ${fmtNum(x.faculty.phdRatio)}%、专任 ${fmtNum(x.faculty.total)} 人、省级人才 ${fmtNum(x.faculty.talentCount)} 人、教学名师 ${fmtNum(x.faculty.teachingMasters)} 人，高水平师资厚实、评价高，是优势维度。`
        if (s === 'worst')
          return `「${x.name}」博士占比仅 ${fmtNum(x.faculty.phdRatio)}%，低于 ${o.join('、')}，省级人才 ${fmtNum(x.faculty.talentCount)} 人、教学名师 ${fmtNum(x.faculty.teachingMasters)} 人偏少，高水平师资支撑不足，拖累培养与科研，是短板。`
        return `「${x.name}」博士占比 ${fmtNum(x.faculty.phdRatio)}%、师资规模 ${fmtNum(x.faculty.total)} 人，表现居中，可借人才引育补强。`
      },
    },
    {
      key: '学生情况',
      icon: '🎓',
      value: (x) => numOrZero(x.enrollment.firstChoiceRate),
      format: (x) =>
        `第一志愿率 ${fmtNum(x.enrollment.firstChoiceRate)}% · 录取均分 ${fmtNum(x.enrollment.avgScore)} · 落实率 ${fmtNum(x.cultivation.employmentRate)}%`,
      why: (x, s, o) => {
        if (s === 'best')
          return `「${x.name}」第一志愿率 ${fmtNum(x.enrollment.firstChoiceRate)}%、录取均分 ${fmtNum(x.enrollment.avgScore)}，生源吸引力居首，配合毕业落实率 ${fmtNum(x.cultivation.employmentRate)}% 出口俱佳，学生竞争力是优势。`
        if (s === 'worst')
          return `「${x.name}」第一志愿率 ${fmtNum(x.enrollment.firstChoiceRate)}%、落实率 ${fmtNum(x.cultivation.employmentRate)}%，弱于 ${o.join('、')}，生源质量与就业竞争力偏弱，是短板。`
        return `「${x.name}」第一志愿率 ${fmtNum(x.enrollment.firstChoiceRate)}%、落实率 ${fmtNum(x.cultivation.employmentRate)}%，表现居中，仍有提升空间。`
      },
    },
    {
      key: '培养成效',
      icon: '🌱',
      value: (x) => numOrZero(x.cultivation.competitionAwards),
      format: (x) =>
        `竞赛获奖 ${fmtNum(x.cultivation.competitionAwards)} 项 · 大创 ${fmtNum(x.cultivation.innovationProjects)} 项 · 升学率 ${fmtNum(x.cultivation.furtherStudyRate)}%`,
      why: (x, s, o) => {
        if (s === 'best')
          return `「${x.name}」学科竞赛获奖 ${fmtNum(x.cultivation.competitionAwards)} 项、大创 ${fmtNum(x.cultivation.innovationProjects)} 项、升学率 ${fmtNum(x.cultivation.furtherStudyRate)}%，育人成果厚度居首，是优势维度。`
        if (s === 'worst')
          return `「${x.name}」竞赛获奖 ${fmtNum(x.cultivation.competitionAwards)} 项、大创 ${fmtNum(x.cultivation.innovationProjects)} 项、升学率 ${fmtNum(x.cultivation.furtherStudyRate)}%，少于 ${o.join('、')}，育人成果厚度不足，是短板。`
        return `「${x.name}」竞赛获奖 ${fmtNum(x.cultivation.competitionAwards)} 项、升学率 ${fmtNum(x.cultivation.furtherStudyRate)}%，处于中游。`
      },
    },
    {
      key: '科研成果',
      icon: '🔬',
      value: (x) => numOrZero(x.outcomes.papers),
      format: (x) =>
        `高水平论文 ${fmtNum(x.outcomes.papers)} 篇 · 纵向项目 ${fmtNum(x.outcomes.verticalProjects)} 项`,
      why: (x, s, o) => {
        if (s === 'best')
          return `「${x.name}」近五年高水平论文 ${fmtNum(x.outcomes.papers)} 篇、纵向项目 ${fmtNum(x.outcomes.verticalProjects)} 项，科研增量居首，反哺教学明显，是优势维度。`
        if (s === 'worst')
          return `「${x.name}」论文 ${fmtNum(x.outcomes.papers)} 篇、纵向 ${fmtNum(x.outcomes.verticalProjects)} 项，落后于 ${o.join('、')}，缺乏标志性科研增量，是短板。`
        return `「${x.name}」论文 ${fmtNum(x.outcomes.papers)} 篇、纵向 ${fmtNum(x.outcomes.verticalProjects)} 项，居于中游。`
      },
    },
  ]

  return configs.map((c) => {
    const status = rankOf(
      c.value(p),
      profiles.map((x) => c.value(x)),
    )
    return {
      key: c.key,
      icon: c.icon,
      format: c.format(p),
      status,
      why: c.why(p, status, others),
    }
  })
})

const advantageCount = computed(
  () => dimensionRowsForMajor.value.filter((r) => r.status === 'best').length,
)
const weaknessCount = computed(
  () => dimensionRowsForMajor.value.filter((r) => r.status === 'worst').length,
)
const midCount = computed(
  () => dimensionRowsForMajor.value.filter((r) => r.status === 'mid').length,
)

const leadMajor = computed(() => {
  const list = (data.value?.majorRankings ?? []).filter(
    (m) => typeof m.currentRank === 'number',
  )
  if (!list.length) {
    const majors = data.value?.majors ?? []
    if (!majors.length) return null
    const top = [...majors].sort(
      (a, b) => rankOrInf(b.studentCount, -Infinity) - rankOrInf(a.studentCount, -Infinity),
    )[0]
    return {
      major: top.name,
      grade: top.grade,
      currentRank: top.nationalRank,
      yoyChange: top.yoyChange,
      provincialRank: top.provincialRank,
      peerRank: top.financePeerRank,
      financePeerRank: top.financePeerRank,
    }
  }
  return [...list].sort((a, b) => Number(a.currentRank) - Number(b.currentRank))[0]
})

const worstMajor = computed(() => {
  const list = (data.value?.majorRankings ?? []).filter(
    (m) => typeof m.currentRank === 'number',
  )
  if (!list.length) return null
  return [...list].sort((a, b) => Number(b.currentRank) - Number(a.currentRank))[0]
})

function profileOf(major?: string) {
  if (!major || !data.value) return null
  return data.value.majorProfiles.find((p) => p.name === major) ?? null
}

const bestProfile = computed(() => profileOf(leadMajor.value?.major))
const worstProfile = computed(() => profileOf(worstMajor.value?.major))

const bestReasons = computed<string[]>(() => bestProfile.value?.judgment.strengths ?? [])
const worstReasons = computed<string[]>(() => worstProfile.value?.judgment.weaknesses ?? [])

const judgmentAnalysis = computed(() => {
  if (!leadMajor.value) return data.value?.benchmarkNote || ''
  if (!worstMajor.value || worstMajor.value.major === leadMajor.value.major) {
    return bestProfile.value?.judgment.trendSummary
      || data.value?.radarConclusion
      || ''
  }
  const leadRank = leadMajor.value.currentRank
  const worstRank = worstMajor.value.currentRank
  if (typeof leadRank !== 'number' || typeof worstRank !== 'number') {
    return (
      bestProfile.value?.judgment.trendSummary
      || '排名缺源，当前仅可按在校生规模与就业出口做研判。'
    )
  }
  const gap = worstRank - leadRank
  const bestTrend = bestProfile.value?.judgment.trendSummary ?? ''
  const worstPrio = worstProfile.value?.judgment.priorities ?? []
  const lead = leadMajor.value
  const worst = worstMajor.value
  return `${bestTrend}。${lead.major} 与 ${worst.major} 全国排名相差约 ${gap} 位，呈明显梯队分布；建议以 ${lead.major} 为标杆，把增量资源向 ${worst.major} 倾斜，优先落实：${worstPrio.join('、')}。`
})

function majorCardOf(name?: string) {
  if (!name || !data.value) return null
  return data.value.majors.find((m) => m.name === name) ?? null
}

function softDimsOf(name?: string): SoftDimensionDTO[] {
  if (!name) return []
  const fromProfile = data.value?.majorProfiles.find((p) => p.name === name)?.softDimensions
  if (fromProfile?.length) return fromProfile
  return majorCardOf(name)?.softDimensions ?? []
}

const disciplineSnapshot = computed(() => {
  if (!data.value) return null
  return buildDisciplineOverviewSnapshot({
    ranking: data.value.ranking,
    dimensions: data.value.dimensions,
    radarConclusion: data.value.radarConclusion,
    majors: data.value.majors.map((m) => ({
      name: m.name,
      grade: m.grade,
      nationalRank: m.nationalRank,
      yoyChange: m.yoyChange,
      provincialRank: m.provincialRank,
      financePeerRank: m.financePeerRank,
      studentCount: m.studentCount,
      employmentRate: m.employmentRate,
      avgScore: m.avgScore,
      softDimensions: m.softDimensions,
    })),
  })
})

const agentEnabled = computed(() => currentTab.value === 'overview' || currentTab.value === 'insights')

const agentContext = computed<AgentAnalyzeContextDTO | null>(() => {
  if (!disciplineSnapshot.value) return null
  return {
    scope: 'college',
    page: 'college-discipline-overview',
    collegeId: collegeScope.value.collegeId,
    summarySnapshot: disciplineSnapshot.value as unknown as Record<string, unknown>,
  }
})

const {
  analysis: agentAnalysis,
  loading: agentLoading,
  error: agentError,
  sessionId: agentSessionId,
  refresh: refreshAgentAnalysis,
  run: runAgentAnalysis,
} = useAgentAnalysis(agentContext, { enabled: agentEnabled, auto: true, force: true })

const displayAnalysis = computed(() => {
  const snap = disciplineSnapshot.value
  const raw =
    agentAnalysis.value ?? (snap ? buildDisciplineOverviewRuleAnalysis(snap) : null)
  if (!raw || !snap) return raw
  return attachDisciplineEvidence(raw, snap)
})

type MetricGroup = {
  key: string
  icon: string
  title: string
  status: DimStatus
  summary: string
  items: Array<{ label: string; value: string }>
}

const profileMetricGroups = computed<MetricGroup[]>(() => {
  const p = profile.value
  const all = data.value?.majorProfiles
  if (!p || !all?.length) return []
  const dims = softDimsOf(p.name)
  const others = all.filter((x) => x.name !== p.name).map((x) => x.name)

  const dimLead = [...dims]
    .filter((d) => typeof d.score === 'number' && typeof d.peerAverage === 'number')
    .sort((a, b) => Number(b.score) - Number(b.peerAverage) - (Number(a.score) - Number(a.peerAverage)))[0]
  const dimWeak = [...dims]
    .filter((d) => typeof d.score === 'number' && typeof d.peerAverage === 'number')
    .sort((a, b) => Number(a.score) - Number(a.peerAverage) - (Number(b.score) - Number(b.peerAverage)))[0]
  const dimAvg = dims.filter((d) => typeof d.score === 'number')
  const dimScore = dimAvg.length
    ? dimAvg.reduce((s, d) => s + Number(d.score), 0) / dimAvg.length
    : 0
  const dimStatus = rankOf(
    dimScore,
    all.map((x) => {
      const xs = softDimsOf(x.name).filter((d) => typeof d.score === 'number')
      return xs.length ? xs.reduce((s, d) => s + Number(d.score), 0) / xs.length : 0
    }),
  )

  const facultyStatus = rankOf(
    numOrZero(p.faculty.phdRatio),
    all.map((x) => numOrZero(x.faculty.phdRatio)),
  )
  const outcomeStatus = rankOf(
    numOrZero(p.outcomes.eliteCourses) + numOrZero(p.outcomes.papers),
    all.map((x) => numOrZero(x.outcomes.eliteCourses) + numOrZero(x.outcomes.papers)),
  )
  const enrollStatus = rankOf(
    numOrZero(p.enrollment.firstChoiceRate) || numOrZero(p.enrollment.avgScore),
    all.map((x) => numOrZero(x.enrollment.firstChoiceRate) || numOrZero(x.enrollment.avgScore)),
  )
  const cultStatus = rankOf(
    numOrZero(p.cultivation.employmentRate) + numOrZero(p.cultivation.furtherStudyRate),
    all.map((x) => numOrZero(x.cultivation.employmentRate) + numOrZero(x.cultivation.furtherStudyRate)),
  )

  const why = (status: DimStatus, good: string, mid: string, bad: string) =>
    status === 'best' ? good : status === 'worst' ? bad : mid

  return [
    {
      key: 'soft',
      icon: '📡',
      title: '软科五维',
      status: dimStatus,
      summary: dims.length
        ? `${dimLead ? `相对对标最强是${dimLead.label}（${fmtNum(dimLead.score)} / ${fmtNum(dimLead.peerAverage)}）` : '五维可观测'}${
            dimWeak ? `；最紧是${dimWeak.label}（${fmtNum(dimWeak.score)} / ${fmtNum(dimWeak.peerAverage)}）` : ''
          }`
        : '缺软科五维明细，待导入排名快照。',
      items: dims.length
        ? dims.map((d) => ({
            label: d.label,
            value: `${fmtNum(d.score)} / 对标 ${fmtNum(d.peerAverage)}`,
          }))
        : [{ label: '五维', value: '**' }],
    },
    {
      key: 'faculty',
      icon: '👨‍🏫',
      title: '师资结构',
      status: facultyStatus,
      summary: why(
        facultyStatus,
        `博士占比 ${fmtNum(p.faculty.phdRatio)}%、专任 ${fmtNum(p.faculty.total)} 人，院内领先。`,
        `博士占比 ${fmtNum(p.faculty.phdRatio)}%，居于 ${others.join('、') || '其他专业'} 之间。`,
        `博士占比 ${fmtNum(p.faculty.phdRatio)}%，低于 ${others.join('、')}，高水平师资偏薄。`,
      ),
      items: [
        { label: '专任', value: `${fmtNum(p.faculty.total)} 人` },
        { label: '正高 / 副高', value: `${fmtNum(p.faculty.professor)} / ${fmtNum(p.faculty.associate)}` },
        { label: '博士占比', value: `${fmtNum(p.faculty.phdRatio)}%` },
        { label: '省级人才', value: `${fmtNum(p.faculty.talentCount)} 人` },
        { label: '教学名师', value: `${fmtNum(p.faculty.teachingMasters)} 人` },
      ],
    },
    {
      key: 'outcomes',
      icon: '🏆',
      title: '教学与成果',
      status: outcomeStatus,
      summary: why(
        outcomeStatus,
        `一流课程 ${fmtNum(p.outcomes.eliteCourses)} 门、论文 ${fmtNum(p.outcomes.papers)} 篇，成果厚度居首。`,
        `一流课程 ${fmtNum(p.outcomes.eliteCourses)} 门、论文 ${fmtNum(p.outcomes.papers)} 篇，处于中游。`,
        `一流课程 ${fmtNum(p.outcomes.eliteCourses)} 门、论文 ${fmtNum(p.outcomes.papers)} 篇，少于 ${others.join('、')}。`,
      ),
      items: [
        { label: '一流课程', value: `${fmtNum(p.outcomes.eliteCourses)} 门` },
        { label: '教改 / 获奖', value: `${fmtNum(p.outcomes.reformProjects)} / ${fmtNum(p.outcomes.teachingAwards)}` },
        { label: '高水平论文', value: `${fmtNum(p.outcomes.papers)} 篇` },
        { label: '纵向项目', value: `${fmtNum(p.outcomes.verticalProjects)} 项` },
        { label: '专利 / 软著', value: `${fmtNum(p.outcomes.patents)} / ${fmtNum(p.outcomes.softwares)}` },
      ],
    },
    {
      key: 'enrollment',
      icon: '📝',
      title: '生源入口',
      status: enrollStatus,
      summary: why(
        enrollStatus,
        `第一志愿率 ${fmtNum(p.enrollment.firstChoiceRate)}%、均分 ${fmtNum(p.enrollment.avgScore)}，吸引力居首。`,
        `第一志愿率 ${fmtNum(p.enrollment.firstChoiceRate)}%、均分 ${fmtNum(p.enrollment.avgScore)}，表现居中。`,
        `第一志愿率 ${fmtNum(p.enrollment.firstChoiceRate)}%、均分 ${fmtNum(p.enrollment.avgScore)}，弱于 ${others.join('、')}。`,
      ),
      items: [
        { label: '录取均分', value: `${fmtNum(p.enrollment.avgScore)}` },
        { label: '最低分', value: `${fmtNum(p.enrollment.minScore)}` },
        { label: '第一志愿率', value: `${fmtNum(p.enrollment.firstChoiceRate)}%` },
        { label: '省内生源', value: `${fmtNum(p.enrollment.provinceInRatio)}%` },
        { label: '在校生', value: `${fmtNum(p.studentCount)} 人` },
      ],
    },
    {
      key: 'cultivation',
      icon: '🌱',
      title: '育人出口',
      status: cultStatus,
      summary: why(
        cultStatus,
        `落实率 ${fmtNum(p.cultivation.employmentRate)}%、升学 ${fmtNum(p.cultivation.furtherStudyRate)}%，出口质量领先。`,
        `落实率 ${fmtNum(p.cultivation.employmentRate)}%、升学 ${fmtNum(p.cultivation.furtherStudyRate)}%，居于中游。`,
        `落实率 ${fmtNum(p.cultivation.employmentRate)}%、升学 ${fmtNum(p.cultivation.furtherStudyRate)}%，弱于 ${others.join('、')}。`,
      ),
      items: [
        { label: '落实率', value: `${fmtNum(p.cultivation.employmentRate)}%` },
        { label: '升学率', value: `${fmtNum(p.cultivation.furtherStudyRate)}%` },
        { label: '优质就业', value: `${fmtNum(p.cultivation.qualityJobRatio)}%` },
        { label: '竞赛获奖', value: `${fmtNum(p.cultivation.competitionAwards)} 项` },
        { label: '大创立项', value: `${fmtNum(p.cultivation.innovationProjects)} 项` },
      ],
    },
  ]
})

const benchMajor = computed(() => majorCardOf(activeMajor.value) ?? data.value?.majors[0] ?? null)

const benchPeers = computed(() =>
  (benchMajor.value?.peerSchools ?? []).filter((p) => typeof p.rank === 'number'),
)

const benchFinance = computed(() => {
  const list = (benchMajor.value?.financePeerSchools ?? []).filter((p) => typeof p.rank === 'number')
  const sorted = [...list].sort((a, b) => Number(a.rank) - Number(b.rank))
  const selfIdx = sorted.findIndex((p) => p.isSelf)
  if (selfIdx < 0) return sorted.slice(0, 8)
  const start = Math.max(0, selfIdx - 3)
  const end = Math.min(sorted.length, selfIdx + 4)
  return sorted.slice(start, end)
})

const overviewMetricRows = computed(() => {
  const majors = data.value?.majors ?? []
  if (!majors.length) return []
  const rows: Array<{
    key: string
    label: string
    lead: string
    cells: Array<{ major: string; value: string }>
  }> = [
    {
      key: 'rank',
      label: '全国排名',
      lead: '',
      cells: majors.map((m) => ({ major: m.name, value: `第${fmtNum(m.nationalRank)}` })),
    },
    {
      key: 'yoy',
      label: '较上年',
      lead: '',
      cells: majors.map((m) => ({ major: m.name, value: formatChange(m.yoyChange) })),
    },
    {
      key: 'prov',
      label: '省内位次',
      lead: '',
      cells: majors.map((m) => ({ major: m.name, value: `第${fmtNum(m.provincialRank)}` })),
    },
    {
      key: 'fin',
      label: '财经类位次',
      lead: '',
      cells: majors.map((m) => ({ major: m.name, value: `第${fmtNum(m.financePeerRank)}` })),
    },
    {
      key: 'emp',
      label: '去向落实率',
      lead: '',
      cells: majors.map((m) => ({ major: m.name, value: `${fmtNum(m.employmentRate)}%` })),
    },
  ]
  return rows.map((row) => ({
    ...row,
    lead: row.cells[0] ? shortMajor(row.cells[0].major) : '',
  }))
})

const dimKeys: Array<{ key: SoftDimensionDTO['key']; label: string }> = [
  { key: 'school', label: '学校条件' },
  { key: 'discipline', label: '学科支撑' },
  { key: 'source', label: '专业生源' },
  { key: 'employment', label: '专业就业' },
  { key: 'program', label: '专业条件' },
]

const dimCompareRows = computed(() => {
  const majors = data.value?.majors ?? []
  return dimKeys.map((dim) => ({
    ...dim,
    cells: majors.map((m) => {
      const hit = m.softDimensions?.find((d) => d.key === dim.key)
      const score = typeof hit?.score === 'number' ? hit.score : null
      const peer = typeof hit?.peerAverage === 'number' ? hit.peerAverage : null
      return {
        major: m.name,
        score,
        peer,
        gap: score != null && peer != null ? Number((score - peer).toFixed(1)) : null,
      }
    }),
  }))
})

// 学科等级 → 数值映射（用于折线图纵轴；数值越大代表等级越高）
const GRADE_SCORE: Record<string, number> = {
  'A+': 95, A: 90, 'A-': 85,
  'B+': 80, B: 75, 'B-': 70,
  'C+': 65, C: 60, 'C-': 55,
  'D+': 50, D: 45, 'D-': 40,
}
const SCORE_GRADE: Record<number, string> = Object.fromEntries(
  Object.entries(GRADE_SCORE).map(([g, s]) => [s, g]),
)
function gradeScore(g: string): number {
  return GRADE_SCORE[g] ?? 60
}

// 专业等级历年变化：每个专业一条折线
const gradeHistoryOptions = computed<EChartsOption[]>(() => {
  if (!data.value) return []
  return data.value.gradeHistory.map((item) => {
    const scores = item.grades.map((g) => gradeScore(g))
    return {
      grid: { top: 28, right: 14, bottom: 26, left: 36 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(2,14,38,0.94)',
        borderColor: 'rgba(0,242,255,0.5)',
        textStyle: { color: '#f4fbff', fontSize: 14 },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params
          const idx = p.dataIndex as number
          return `${item.major}<br/>${item.years[idx]}：${item.grades[idx]} 级`
        },
      },
      xAxis: {
        type: 'category',
        data: item.years,
        boundaryGap: false,
        axisLabel: { ...AXIS_LABEL, fontSize: 12 },
        axisLine: { lineStyle: { color: 'rgba(0,200,255,0.25)' } },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        min: 35,
        max: 100,
        interval: 5,
        axisLabel: {
          ...AXIS_LABEL,
          fontSize: 12,
          formatter: (v: number) => SCORE_GRADE[v] ?? '',
        },
        splitLine: { lineStyle: { color: 'rgba(0,200,255,0.08)' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 9,
          data: scores,
          lineStyle: { width: 3, color: '#22d3ee' },
          itemStyle: { color: '#22d3ee' },
          label: {
            show: true,
            position: 'top',
            color: '#ffd56a',
            fontSize: 12,
            formatter: (p: any) => item.grades[p.dataIndex as number],
          },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34,211,238,0.35)' },
                { offset: 1, color: 'rgba(34,211,238,0.02)' },
              ],
            },
          },
        },
      ],
    } as EChartsOption
  })
})

const nationalTrendOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const trends = data.value.rankTrends
  const years = Array.from(new Set(trends.flatMap((t) => t.years))).sort()
  const colors = ['#39e6ff', '#ffd56a', '#63ffe1']

  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(2,14,38,0.94)',
      borderColor: 'rgba(0,242,255,0.5)',
      textStyle: { color: '#f4fbff', fontSize: 18 },
    },
    xAxis: { type: 'category', data: years, axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' } },
    yAxis: {
      type: 'value',
      inverse: true,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '第{value}' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: trends.map((item, index) => ({
      name: shortMajor(item.major),
      type: 'line' as const,
      smooth: true,
      data: years.map((year) => {
        const i = item.years.indexOf(year)
        return i >= 0 ? item.nationalRanks[i] : null
      }),
      lineStyle: { width: 2, color: colors[index % colors.length] },
      itemStyle: { color: colors[index % colors.length] },
    })),
  }
})

const dimCompareRadarOption = computed<EChartsOption>(() => {
  const majors = data.value?.majors ?? []
  if (!majors.length) return {}
  const colors = ['#39e6ff', '#ffd56a', '#63ffe1', '#ff8a65', '#a78bfa']
  return {
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2,14,38,0.94)',
      borderColor: 'rgba(0,242,255,0.5)',
      textStyle: { color: '#f4fbff', fontSize: 16 },
    },
    radar: {
      center: ['50%', '58%'],
      radius: '68%',
      indicator: dimKeys.map((d) => ({ name: d.label, max: 100 })),
      axisName: { color: '#c6e6ff', fontSize: 14, fontWeight: 700 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.12)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(57,230,255,0.18)' } },
    },
    series: [
      {
        type: 'radar',
        data: majors.map((m, index) => ({
          name: shortMajor(m.name),
          value: dimKeys.map((d) => {
            const hit = m.softDimensions?.find((x) => x.key === d.key)
            return typeof hit?.score === 'number' ? hit.score : 0
          }),
          lineStyle: { width: 2, color: colors[index % colors.length] },
          itemStyle: { color: colors[index % colors.length] },
          areaStyle: { color: colors[index % colors.length], opacity: 0.12 },
        })),
      },
    ],
  }
})

const provincialBarOption = computed<EChartsOption>(() => {
  const source = benchPeers.value.length
    ? benchPeers.value
    : (data.value?.provincialComparison ?? [])
  if (!source.length) return {}
  const items = [...source].reverse()
  return {
    grid: { left: 8, right: 40, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value',
      inverse: false,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '第{value}' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => String(i.school).replace('大学', '')),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 16 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barWidth: 14,
      data: items.map((i) => ({
        value: i.rank,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i.isSelf
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ffd56a' }, { offset: 1, color: '#f0a020' }] }
            : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1a8cff' }, { offset: 1, color: '#5cecff' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '第{c}' },
    }],
  }
})

function applyRouteQuery() {
  const tab = String(route.query.tab ?? '')
  if (TAB_KEYS.includes(tab as TabKey)) currentTab.value = tab as TabKey
  const major = String(route.query.major ?? '')
  if (major && data.value?.majorProfiles.some((p) => p.name === major)) {
    activeMajor.value = major
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    data.value = await disciplineService.fetchDisciplineDetail(collegeScope.value)
    activeMajor.value =
      String(route.query.major ?? '') ||
      data.value.majorProfiles[0]?.name ||
      data.value.majors[0]?.name ||
      ''
    applyRouteQuery()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

watch(() => route.query, () => applyRouteQuery())

watch(activeMajor, (name) => {
  if (!name || currentTab.value !== 'profile') return
  router.replace({
    path: ROUTES.college.disciplineDetail,
    query: { tab: 'profile', major: name },
  })
})
</script>

<template>
  <CollegeDetailLayout module="专业发展全景">
    <template #nav>
      <div ref="tabBarRef" class="tab-bar tab-bar--header">
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'overview' }" @click="switchTab('overview')">📋 专业总览</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'profile' }" @click="switchTab('profile')">🎓 单专业全景</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'benchmark' }" @click="switchTab('benchmark')">📊 趋势对标</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'insights' }" @click="switchTab('insights')">🔍 深度挖掘</button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <template v-else-if="data">
      <!-- ===================== 专业总览 ===================== -->
      <template v-if="currentTab === 'overview'">
        <DisciplineAiBriefPanel
          :data="displayAnalysis"
          :snapshot="disciplineSnapshot"
          :loading="agentLoading"
          :error="agentError"
          @refresh="refreshAgentAnalysis"
          @retry="() => runAgentAnalysis(false)"
        />

        <div class="resource-summary resource-summary--4">
          <div
            v-for="item in data.majorRankings"
            :key="item.major"
            class="resource-summary__card"
            @click="switchTab('profile', { major: item.major })"
          >
            <span class="resource-summary__icon">{{ fmtNum(item.grade) }}</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">{{ shortMajor(item.major) }}</span>
              <strong class="resource-summary__value">第{{ fmtNum(item.currentRank) }}<small>名</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('grade-history')">
            <span class="resource-summary__icon">📈</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">上行专业</span>
              <strong class="resource-summary__value resource-summary__value--ok">
                {{ data.majorRankings.filter((m) => typeof m.yoyChange === 'number' && m.yoyChange > 0).length }}<small>个</small>
              </strong>
            </div>
          </div>
        </div>

        <section id="major-table" class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📋</span>
            {{ data.majorRankings.length }} 个本科专业总览
            <em class="resource-section__hint">点击卡片进入单专业全景</em>
          </h2>
          <p class="resource-section__desc">从等级、全国排名、省内与财经类位置一眼看清学院专业矩阵格局。</p>
          <div class="major-cards">
            <button
              v-for="item in data.majorRankings"
              :key="`card-${item.major}`"
              type="button"
              class="major-card"
              @click="switchTab('profile', { major: item.major })"
            >
              <header>
                <strong>{{ item.major }}</strong>
                <em>{{ isMissingMark(item.grade) ? '**' : `${item.grade}级` }}</em>
              </header>
              <div class="major-card__grid">
                <div><span>全国</span><b>第{{ fmtNum(item.currentRank) }}</b></div>
                <div><span>较上年</span><b>{{ formatChange(item.yoyChange) }}</b></div>
                <div><span>省内</span><b>第{{ item.provincialRank }}</b></div>
                <div><span>财经类</span><b>第{{ item.financePeerRank }}</b></div>
              </div>
            </button>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📡</span>
            评价指标细分 · {{ data.dimensions.length ? '软科五维' : '排名与办学指标' }}
            <em class="resource-section__hint">{{ data.dimensions.length ? '学院均值 vs 对标，并落到各专业' : '五维缺源时先用排名与落实率拆到专业' }}</em>
          </h2>
          <p class="resource-section__desc">总览页的 AI 分析直接读取下方排名与五维细分，弱维会落到具体专业。</p>
          <div v-if="data.dimensions.length" class="soft-dim-grid">
            <article v-for="dim in data.dimensions" :key="dim.key" class="soft-dim-card">
              <header>
                <strong>{{ dim.label }}</strong>
                <em :class="typeof dim.score === 'number' && typeof dim.peerAverage === 'number' && dim.score >= dim.peerAverage ? 'is-up' : 'is-down'">
                  {{ typeof dim.score === 'number' && typeof dim.peerAverage === 'number'
                    ? `${dim.score >= dim.peerAverage ? '+' : ''}${(Number(dim.score) - Number(dim.peerAverage)).toFixed(1)}`
                    : '**' }}
                </em>
              </header>
              <div class="soft-dim-card__nums">
                <span>本院 <b>{{ fmtNum(dim.score) }}</b></span>
                <span>对标 <b>{{ fmtNum(dim.peerAverage) }}</b></span>
              </div>
              <ul>
                <li v-for="m in data.majors" :key="`${dim.key}-${m.name}`">
                  <span>{{ shortMajor(m.name) }}</span>
                  <b>{{ fmtNum(m.softDimensions?.find((d) => d.key === dim.key)?.score) }}</b>
                </li>
              </ul>
            </article>
          </div>
          <div v-else class="soft-dim-grid">
            <article v-for="row in overviewMetricRows" :key="row.key" class="soft-dim-card">
              <header>
                <strong>{{ row.label }}</strong>
                <em class="is-up">{{ row.lead }}</em>
              </header>
              <ul>
                <li v-for="cell in row.cells" :key="`${row.key}-${cell.major}`">
                  <span>{{ shortMajor(cell.major) }}</span>
                  <b>{{ cell.value }}</b>
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section id="grade-history" class="resource-section" :class="{ 'resource-section--active': activeSection === 'grade-history' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🏅</span>专业等级历年变化</h2>
          <div class="grade-history">
            <article v-for="(item, idx) in data.gradeHistory" :key="item.major" class="grade-history__card">
              <h3>{{ item.major }}</h3>
              <div class="grade-history__chart">
                <ChartContainer :option="gradeHistoryOptions[idx]" />
              </div>
            </article>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">💡</span>研判快览</h2>
          <div class="resource-card">
            <div class="resource-card__insight resource-card__insight--large">
              <span class="resource-card__insight-icon">💡</span>
              <p>{{ data.radarConclusion }}</p>
            </div>
            <div class="judgment-bestworst">
              <div class="judgment-pick judgment-pick--best">
                <h4>🏆 最佳专业 · {{ leadMajor?.major }}</h4>
                <p class="judgment-pick__rank">
                  全国第 {{ fmtNum(leadMajor?.currentRank) }} 名 · {{ isMissingMark(leadMajor?.grade) ? '**' : `${leadMajor?.grade} 级` }} · 较上年 {{ formatChange(leadMajor?.yoyChange) }}
                </p>
                <p class="judgment-pick__why"><b>为什么最好：</b>{{ bestReasons.join('；') }}</p>
              </div>
              <div class="judgment-pick judgment-pick--worst">
                <h4>⚠️ 待提升专业 · {{ worstMajor?.major }}</h4>
                <p class="judgment-pick__rank">
                  全国第 {{ fmtNum(worstMajor?.currentRank) }} 名 · {{ isMissingMark(worstMajor?.grade) ? '**' : `${worstMajor?.grade} 级` }} · 较上年 {{ formatChange(worstMajor?.yoyChange) }}
                </p>
                <p class="judgment-pick__why"><b>为什么最差：</b>{{ worstReasons.join('；') }}</p>
              </div>
            </div>
            <p class="judgment-analysis">{{ judgmentAnalysis }}</p>
            <div class="inline-actions">
              <button type="button" class="inline-link" @click="switchTab('benchmark')">查看趋势对标</button>
              <button type="button" class="inline-link" @click="switchTab('insights')">进入深度挖掘</button>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 单专业全景 ===================== -->
      <template v-else-if="currentTab === 'profile'">
        <div class="dim-tabs">
          <button
            v-for="item in data.majorProfiles"
            :key="item.name"
            type="button"
            class="dim-tab"
            :class="{ 'dim-tab--active': activeMajor === item.name }"
            @click="activeMajor = item.name"
          >
            {{ item.name }}
          </button>
        </div>

        <template v-if="profile">
          <div class="profile-hero">
            <div>
              <h2>{{ profile.name }} <em>{{ isMissingMark(profile.grade) ? '**' : `${profile.grade}级` }}</em></h2>
              <p>
                <template v-if="profile.department">系部：{{ profile.department }} · </template>
                {{ profile.orientation }}
              </p>
            </div>
            <div class="profile-hero__meta">
              <span v-if="profile.department">{{ profile.department }}</span>
              <span>全国第 {{ profile.officialRank }}</span>
              <span>软科第 {{ profile.softRank }}</span>
              <span>在校 {{ fmtNum(profile.studentCount) }} 人</span>
            </div>
          </div>

          <section class="resource-section">
            <h2 class="resource-section__title">
              <span class="resource-section__title-icon">🧩</span>
              细分指标归纳
              <em class="resource-section__hint">院内横向对比后给出优势 / 持平 / 劣势</em>
            </h2>
            <div class="metric-groups">
              <article
                v-for="group in profileMetricGroups"
                :key="group.key"
                class="metric-group"
                :class="`metric-group--${group.status}`"
              >
                <header>
                  <h3>{{ group.icon }} {{ group.title }}</h3>
                  <span class="analysis-tag" :class="`analysis-tag--${group.status}`">{{ STATUS_LABEL[group.status] }}</span>
                </header>
                <p>{{ group.summary }}</p>
                <ul>
                  <li v-for="item in group.items" :key="item.label">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                  </li>
                </ul>
              </article>
            </div>
          </section>

          <div class="dim-tabs dim-tabs--sub">
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'basic' }" @click="profileSection = 'basic'">基础概况</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'faculty' }" @click="profileSection = 'faculty'">师资</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'outcomes' }" @click="profileSection = 'outcomes'">成果</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'enrollment' }" @click="profileSection = 'enrollment'">生源</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'cultivation' }" @click="profileSection = 'cultivation'">育人</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': profileSection === 'judgment' }" @click="profileSection = 'judgment'">研判</button>
          </div>

          <section v-if="profileSection === 'basic'" class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🏫</span>基础概况</h2>
            <ul class="kv-grid">
              <li><span>所属系部</span><strong>{{ profile.department || '**' }}</strong></li>
              <li><span>办学年限</span><strong>{{ profile.foundedYears }} 年</strong></li>
              <li><span>认证 / 评级</span><strong>{{ profile.accreditation }}</strong></li>
              <li><span>建设类型</span><strong>{{ profile.constructionType }}</strong></li>
              <li><span>官方 / 软科</span><strong>第{{ profile.officialRank }} / 第{{ profile.softRank }}</strong></li>
              <li><span>年度招生</span><strong>{{ profile.enrollmentPlan }} 人</strong></li>
              <li><span>在校生</span><strong>{{ fmtNum(profile.studentCount) }} 人</strong></li>
              <li><span>学制</span><strong>{{ profile.educationYears }} 年</strong></li>
              <li><span>核心方向</span><strong>{{ profile.directions.join(' · ') }}</strong></li>
            </ul>
          </section>

          <section v-else-if="profileSection === 'faculty'" class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">👨‍🏫</span>师资概况</h2>
            <ul class="kv-grid">
              <li><span>专任教师</span><strong>{{ profile.faculty.total }} 人</strong></li>
              <li><span>职称结构</span><strong>正高 {{ profile.faculty.professor }} / 副高 {{ profile.faculty.associate }} / 讲师 {{ profile.faculty.lecturer }}</strong></li>
              <li><span>博士学历</span><strong>{{ profile.faculty.phdCount }} 人（{{ profile.faculty.phdRatio }}%）</strong></li>
              <li><span>省级及以上人才</span><strong>{{ profile.faculty.talentCount }} 人</strong></li>
              <li><span>教学名师</span><strong>{{ profile.faculty.teachingMasters }} 人</strong></li>
              <li><span>课程负责人</span><strong>{{ profile.faculty.courseLeaders }}</strong></li>
              <li><span>教研团队</span><strong>{{ profile.faculty.researchTeams }}</strong></li>
            </ul>
          </section>

          <section v-else-if="profileSection === 'outcomes'" class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🏆</span>近五年核心成果</h2>
            <ul class="kv-grid">
              <li><span>高水平论文</span><strong>{{ profile.outcomes.papers }} 篇</strong></li>
              <li><span>省部级及以上纵向</span><strong>{{ profile.outcomes.verticalProjects }} 项</strong></li>
              <li><span>校级 / 横向</span><strong>{{ profile.outcomes.horizontalProjects }} 项</strong></li>
              <li><span>专利 / 软著</span><strong>{{ profile.outcomes.patents }} / {{ profile.outcomes.softwares }}</strong></li>
              <li><span>一流课程</span><strong>{{ profile.outcomes.eliteCourses }} 门</strong></li>
              <li><span>教改 / 成果奖</span><strong>{{ profile.outcomes.reformProjects }} / {{ profile.outcomes.teachingAwards }}</strong></li>
              <li><span>平台 / 实训基地</span><strong>{{ profile.outcomes.platforms }} / {{ profile.outcomes.practiceBases }}</strong></li>
              <li><span>代表成果</span><strong>{{ profile.outcomes.representativePapers[0] || profile.outcomes.keyProjects[0] || '—' }}</strong></li>
            </ul>
          </section>

          <section v-else-if="profileSection === 'enrollment'" class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📝</span>生源质量</h2>
            <ul class="kv-grid">
              <li><span>录取均分 / 最低分</span><strong>{{ profile.enrollment.avgScore }} / {{ profile.enrollment.minScore }}</strong></li>
              <li><span>平均录取位次</span><strong>{{ profile.enrollment.avgRank }}</strong></li>
              <li><span>第一志愿率</span><strong>{{ profile.enrollment.firstChoiceRate }}%</strong></li>
              <li><span>省内生源占比</span><strong>{{ profile.enrollment.provinceInRatio }}%</strong></li>
              <li><span>男生比例</span><strong>{{ profile.enrollment.maleRatio }}%</strong></li>
              <li><span>学业基础</span><strong>{{ profile.enrollment.freshmanBasis }}</strong></li>
            </ul>
          </section>

          <section v-else-if="profileSection === 'cultivation'" class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🌱</span>人才培养成果</h2>
            <ul class="kv-grid">
              <li><span>毕业率 / 学位率</span><strong>{{ profile.cultivation.graduationRate }}% / {{ profile.cultivation.degreeRate }}%</strong></li>
              <li><span>平均绩点</span><strong>{{ profile.cultivation.avgGpa }}</strong></li>
              <li><span>学科竞赛获奖</span><strong>{{ profile.cultivation.competitionAwards }} 项</strong></li>
              <li><span>大创 / 科创立项</span><strong>{{ profile.cultivation.innovationProjects }} 项</strong></li>
              <li><span>去向落实率</span><strong>{{ fmtNum(profile.cultivation.employmentRate) }}%</strong></li>
              <li><span>升学 / 优质就业</span><strong>{{ profile.cultivation.furtherStudyRate }}% / {{ profile.cultivation.qualityJobRatio }}%</strong></li>
              <li><span>主要行业</span><strong>{{ profile.cultivation.topIndustries.join(' · ') }}</strong></li>
              <li><span>主要地区</span><strong>{{ profile.cultivation.topRegions.join(' · ') }}</strong></li>
            </ul>
          </section>

          <section v-else class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🧭</span>综合研判</h2>
            <div class="resource-card">
              <div class="resource-card__insight resource-card__insight--large">
                <span class="resource-card__insight-icon">💡</span>
                <p>{{ profile.judgment.trendSummary }}</p>
              </div>
              <ul class="bullet-blocks">
                <li><span>核心优势</span><strong>{{ profile.judgment.strengths.join('；') }}</strong></li>
                <li><span>短板</span><strong>{{ profile.judgment.weaknesses.join('；') }}</strong></li>
                <li><span>年度建设重点</span><strong>{{ profile.judgment.priorities.join('；') }}</strong></li>
                <li><span>数据备注</span><strong>{{ profile.judgment.dataNote }}</strong></li>
              </ul>
            </div>
          </section>
        </template>
      </template>

      <!-- ===================== 趋势对标 ===================== -->
      <template v-else-if="currentTab === 'benchmark'">
        <div class="dim-tabs">
          <button
            v-for="item in data.majors"
            :key="`bench-${item.name}`"
            type="button"
            class="dim-tab"
            :class="{ 'dim-tab--active': activeMajor === item.name }"
            @click="activeMajor = item.name"
          >
            {{ item.name }}
          </button>
        </div>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📉</span>全国排名近年趋势</h2>
          <p class="resource-section__desc">排名越低越好（图中纵轴已反转）。折线覆盖全部本科专业，便于看梯队演化。</p>
          <div class="resource-card">
            <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="nationalTrendOption" /></div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">⚖️</span>
            评价指标对比 · {{ benchMajor?.name || '分专业' }}
            <em class="resource-section__hint">软科五维拆到专业，含本院 vs 对标</em>
          </h2>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>各专业五维雷达</h3>
              <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="dimCompareRadarOption" /></div>
            </div>
            <div class="resource-card">
              <h3>五维得分对照表</h3>
              <div class="table-wrap">
                <table class="detail-table">
                  <thead>
                    <tr>
                      <th>维度</th>
                      <th v-for="m in data.majors" :key="`th-${m.name}`">{{ shortMajor(m.name) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in dimCompareRows" :key="row.key">
                      <td>{{ row.label }}</td>
                      <td
                        v-for="cell in row.cells"
                        :key="`${row.key}-${cell.major}`"
                        :class="{
                          'cell-best': cell.gap != null && cell.gap >= 3,
                          'cell-weak': cell.gap != null && cell.gap < 0,
                          'cell-active': cell.major === activeMajor,
                        }"
                      >
                        <b>{{ cell.score ?? '**' }}</b>
                        <small v-if="cell.gap != null">{{ cell.gap > 0 ? `+${cell.gap}` : cell.gap }}</small>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">🗺️</span>
            {{ benchMajor?.name || '本专业' }} · 省内 / 财经对标
          </h2>
          <p class="resource-section__desc">对标名单随上方专业切换，不再只用学院默认专业。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>综合院校全国位次</h3>
              <div v-if="benchPeers.length" class="resource-card__chart"><ChartContainer :option="provincialBarOption" /></div>
              <p v-else class="resource-section__desc">该专业暂无综合对标院校名单。</p>
            </div>
            <div class="resource-card">
              <h3>财经类院校全国位次</h3>
              <ul v-if="benchFinance.length" class="rank-list">
                <li
                  v-for="item in benchFinance"
                  :key="item.school"
                  :class="{ 'is-self': item.isSelf }"
                >
                  <span>{{ item.school }}</span>
                  <strong>第{{ item.rank }}名</strong>
                </li>
              </ul>
              <p v-else class="resource-section__desc">该专业暂无财经类对标名单。</p>
            </div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🏛️</span>横向对标评估</h2>
          <p class="resource-section__desc">{{ data.benchmarkNote }}</p>
          <div class="table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>对标院校</th>
                  <th>公开资质</th>
                  <th>一流建设</th>
                  <th>生源 / 就业</th>
                  <th>定性差异</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in data.peerBenchmarks" :key="item.school">
                  <td>{{ item.school }}</td>
                  <td>{{ item.majorType }}</td>
                  <td>{{ item.eliteProgram }}</td>
                  <td>{{ item.sourceScore }}；{{ item.employmentNote }}</td>
                  <td>{{ item.gapNote }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- ===================== 深度挖掘 ===================== -->
      <template v-else-if="currentTab === 'insights'">
        <section class="resource-section">
          <DisciplineAiBriefPanel
            :data="displayAnalysis"
            :snapshot="disciplineSnapshot"
            :loading="agentLoading"
            :error="agentError"
            @refresh="refreshAgentAnalysis"
            @retry="() => runAgentAnalysis(false)"
          />
          <AgentFollowUpChat
            v-if="agentContext"
            :session-id="agentSessionId"
            :context="agentContext"
            :disabled="agentLoading"
            hint="可追问某专业为何回落、哪一维最弱、对标校差在哪里。"
            placeholder="例如：计科排名落后主要卡在哪一维？"
          />
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">⚖️</span>
            单专业优势 · 劣势剖析
            <em class="resource-section__hint">切换专业，按维度拆解优势来源与短板所在</em>
          </h2>
          <p class="resource-section__desc">从课程质量、教师评价、学生情况、培养成效、科研成果五个维度，剖析所选专业的优势维度与劣势维度（与本院其他专业横向对比）。</p>

          <div class="dim-tabs">
            <button
              v-for="item in data.majorProfiles"
              :key="item.name"
              type="button"
              class="dim-tab"
              :class="{ 'dim-tab--active': activeMajor === item.name }"
              @click="activeMajor = item.name"
            >
              {{ item.name }}
            </button>
          </div>

          <div v-if="profile" class="analysis-hero">
            <h3>{{ profile.name }} <em v-if="analysisGrade">{{ analysisGrade }}</em></h3>
            <div class="analysis-summary">
              <span class="analysis-badge analysis-badge--best">🟢 优势维度 {{ advantageCount }}</span>
              <span class="analysis-badge analysis-badge--mid">🟡 持平 {{ midCount }}</span>
              <span class="analysis-badge analysis-badge--worst">🔴 劣势维度 {{ weaknessCount }}</span>
            </div>
          </div>

          <div class="table-wrap">
            <table class="detail-table analysis-table">
              <thead>
                <tr>
                  <th>剖析维度</th>
                  <th>关键指标</th>
                  <th>研判</th>
                  <th>为什么优势 / 为什么差</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in dimensionRowsForMajor" :key="row.key">
                  <td class="analysis-dim">
                    <span class="analysis-line">
                      <span class="analysis-dim__icon" aria-hidden="true">{{ row.icon }}</span>
                      {{ row.key }}
                    </span>
                  </td>
                  <td class="analysis-value">
                    <span class="analysis-line">{{ row.format }}</span>
                  </td>
                  <td class="analysis-status">
                    <span class="analysis-tag" :class="`analysis-tag--${row.status}`">{{ STATUS_LABEL[row.status] }}</span>
                  </td>
                  <td class="analysis-why">
                    <p class="analysis-why__text">{{ row.why }}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="resource-section">
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>优势研判</h3>
              <ol class="action-list">
                <li v-for="item in data.strengths" :key="item">{{ item }}</li>
              </ol>
            </div>
            <div class="resource-card">
              <h3>短板与风险</h3>
              <ol class="action-list">
                <li v-for="item in data.weaknesses" :key="item">{{ item }}</li>
              </ol>
            </div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">✅</span>建议动作</h2>
          <div class="resource-card">
            <ol class="action-list">
              <li v-for="item in data.suggestions" :key="item">{{ item }}</li>
            </ol>
          </div>
        </section>
      </template>
    </template>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
.detail-placeholder {
  display: grid;
  min-height: 220px;
  place-items: center;
  color: rgba(184, 236, 255, 0.72);
  font-size: 24px;
}

.detail-error { color: #ffb4a2; }

.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  overflow: hidden;
  width: fit-content;
  max-width: 100%;
  flex-wrap: wrap;

  &--header {
    margin-bottom: 0;
    flex-wrap: nowrap;
    background: rgba(0, 40, 90, 0.35);
  }
}

.tab-btn {
  padding: 10px 22px;
  border: none;
  border-right: 1px solid rgba(0, 242, 255, 0.12);
  background: rgba(0, 60, 120, 0.18);
  color: #8ec8e8;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;
  white-space: nowrap;

  &:last-child { border-right: none; }
  &:hover { background: rgba(0, 90, 160, 0.28); color: #b8ecff; }

  &--active {
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
    color: #eaf7ff;
    box-shadow: inset 0 0 18px rgba(0, 200, 255, 0.15);
  }
}

.resource-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;

  &--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  &--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(0, 200, 255, 0.16);
    background: linear-gradient(135deg, rgba(0, 70, 140, 0.28), rgba(2, 20, 48, 0.55));
    cursor: pointer;
    transition: transform 0.18s, border-color 0.18s;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(0, 242, 255, 0.4);
    }
  }

  &__icon {
    display: grid;
    place-items: center;
    min-width: 42px;
    height: 42px;
    border-radius: 8px;
    background: rgba(0, 120, 200, 0.25);
    color: #ffd56a;
    font-size: 20px;
    font-weight: 900;
  }

  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__label { font-size: 18px; color: #8ec8e8; font-weight: 600; }
  &__value {
    font-size: 32px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    small { font-size: 18px; margin-left: 2px; color: #7fdfff; }
    &--ok { color: #6effc2; }
  }
}

.resource-section {
  margin-bottom: 22px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0, 180, 255, 0.12);
  background: rgba(2, 18, 48, 0.35);

  &--active {
    border-color: rgba(0, 242, 255, 0.35);
    box-shadow: 0 0 24px rgba(0, 140, 220, 0.18);
  }

  &__title {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin: 0 0 8px;
    font-size: 24px;
    font-weight: 800;
    color: #eaf7ff;
  }

  &__title-icon { font-size: 24px; }
  &__hint {
    margin-left: auto;
    font-size: 18px;
    font-style: normal;
    font-weight: 600;
    color: #7fdfff;
    opacity: 0.85;
  }
  &__desc {
    margin: 0 0 16px;
    font-size: 20px;
    line-height: 1.7;
    color: #9fb6d2;
  }
  &__grid {
    display: grid;
    gap: 14px;
    &--2 { grid-template-columns: 1fr 1fr; }
  }
}

.resource-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.18);

  h3 {
    margin: 0 0 12px;
    font-size: 22px;
    font-weight: 700;
    color: #b8ecff;
  }

  &__chart {
    height: 280px;
    &--lg { height: 360px; }
  }

  &__insight {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(0, 120, 200, 0.12);
    border: 1px solid rgba(0, 200, 255, 0.16);

    p { margin: 0; font-size: 20px; line-height: 1.6; color: #c6dcf0; }
    &-icon { font-size: 22px; flex-shrink: 0; }
    &--large { padding: 16px; }
  }
}

.major-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.major-card {
  padding: 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s;

  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
    transform: translateY(-1px);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;

    strong { font-size: 20px; color: #eaf7ff; }
    em {
      font-style: normal;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 800;
      color: #ffd56a;
      background: rgba(200, 150, 40, 0.2);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;

    div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      span { font-size: 15px; color: #8eaec8; }
      b { font-size: 20px; color: #5cecff; font-weight: 800; }
    }
  }
}

.grade-history {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;

  &__card {
    padding: 14px;
    border-radius: 10px;
    border: 1px solid rgba(0, 200, 255, 0.14);
    background: rgba(0, 40, 90, 0.18);

    h3 {
      margin: 0 0 12px;
      font-size: 18px;
      color: #b8ecff;
    }
  }

  &__chart {
    height: 190px;
  }
}

.dim-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;

  &--sub { margin-top: -4px; }
}

.dim-tab {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.22);
  background: rgba(0, 40, 90, 0.3);
  color: #9ecae8;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;

  &--active {
    color: #eaf7ff;
    border-color: rgba(0, 242, 255, 0.5);
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
  }
}

.profile-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-end;
  margin-bottom: 14px;
  padding: 16px 18px;
  border-radius: 12px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: linear-gradient(100deg, rgba(0, 100, 180, 0.28), rgba(2, 18, 48, 0.5));

  h2 {
    margin: 0 0 6px;
    font-size: 28px;
    color: #eaf7ff;

    em {
      margin-left: 8px;
      font-style: normal;
      font-size: 18px;
      color: #ffd56a;
    }
  }

  p {
    margin: 0;
    font-size: 18px;
    color: #9fb6d2;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    span {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 700;
      color: #9fe8ff;
      background: rgba(0, 100, 180, 0.28);
      border: 1px solid rgba(0, 200, 255, 0.2);
    }
  }
}

.kv-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(0, 40, 90, 0.22);
    border: 1px solid rgba(0, 200, 255, 0.12);

    span { font-size: 17px; color: #8ec8e8; font-weight: 600; }
    strong { font-size: 18px; color: #eaf7ff; text-align: right; font-weight: 800; }
  }
}

.bullet-blocks {
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 40, 90, 0.2);

    span { font-size: 17px; color: #8ec8e8; font-weight: 700; }
    strong { font-size: 17px; color: #d7e8f8; font-weight: 600; line-height: 1.55; }
  }
}

.rank-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 40, 90, 0.22);

    span { font-size: 18px; color: #c6dcf0; }
    strong { font-size: 18px; color: #5cecff; font-weight: 800; }
  }
}

.table-wrap {
  overflow: auto;
  border-radius: 10px;
  border: 1px solid rgba(102, 217, 255, 0.12);
  background: rgba(2, 10, 30, 0.36);
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 17px;

  th, td {
    padding: 12px 14px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.09);
    text-align: left;
  }

  th {
    color: #a8f0ff;
    font-weight: 800;
    background: rgba(0, 80, 160, 0.2);
    white-space: nowrap;
  }

  td { color: rgba(230, 246, 255, 0.88); }
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.insight-card {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);

  h4 {
    margin: 0 0 10px;
    font-size: 20px;
    font-weight: 800;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 17px;
    line-height: 1.65;
    color: #9fb6d2;
  }

  &--good { border-color: rgba(110, 255, 194, 0.28); background: rgba(20, 80, 60, 0.22); }
  &--warn { border-color: rgba(255, 170, 60, 0.3); background: rgba(90, 50, 10, 0.25); }
  &--info { border-color: rgba(92, 236, 255, 0.28); }
}

.action-list {
  margin: 0;
  padding-left: 22px;
  color: #c6dcf0;
  font-size: 18px;
  line-height: 1.7;

  li + li { margin-top: 8px; }
}

.inline-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.inline-link {
  padding: 0;
  border: none;
  background: none;
  color: #5cecff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 3px;

  &:hover { color: #9fe8ff; }
}

.judgment-bestworst {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 12px;
}

.judgment-pick {
  border: 1px solid rgba(0, 200, 255, 0.18);
  border-radius: 10px;
  padding: 12px 14px;
  background: rgba(4, 18, 46, 0.5);

  h4 {
    margin: 0 0 6px;
    font-size: 18px;
    color: #f4fbff;
  }

  &__rank {
    margin: 0 0 6px;
    font-size: 15px;
    color: #9fe8ff;
  }

  &__why {
    margin: 0;
    font-size: 15px;
    line-height: 1.6;
    color: #cfe6ff;

    b { color: #f4fbff; }
  }

  &--best { border-left: 3px solid #34d399; }
  &--worst { border-left: 3px solid #fbbf24; }
}

.judgment-analysis {
  margin: 12px 0 0;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 15px;
  line-height: 1.7;
  color: #d7ecff;
  background: rgba(0, 200, 255, 0.06);
  border: 1px dashed rgba(0, 200, 255, 0.2);
}

.soft-dim-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}

.soft-dim-card {
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;

    strong { font-size: 16px; color: #eaf7ff; }
    em {
      font-style: normal;
      font-size: 15px;
      font-weight: 800;
      &.is-up { color: #6effc2; }
      &.is-down { color: #ff9a7a; }
    }
  }

  &__nums {
    display: flex;
    gap: 10px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #8ec8e8;
    b { color: #5cecff; font-size: 18px; }
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  li {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    color: #9fb6d2;
    b { color: #eaf7ff; font-weight: 800; }
  }
}

.metric-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-group {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.2);

  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;

    h3 { margin: 0; font-size: 18px; color: #eaf7ff; }
  }

  p {
    margin: 0 0 10px;
    font-size: 15px;
    line-height: 1.55;
    color: #cfe6ff;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    background: rgba(2, 14, 38, 0.35);

    span { font-size: 13px; color: #8ec8e8; }
    strong { font-size: 14px; color: #eaf7ff; }
  }

  &--best { border-color: rgba(110, 255, 194, 0.28); }
  &--worst { border-color: rgba(255, 154, 122, 0.3); }
}

.analysis-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;

  &--best { color: #6effc2; background: rgba(20, 80, 60, 0.4); border: 1px solid rgba(110, 255, 194, 0.45); }
  &--mid { color: #ffd56a; background: rgba(90, 70, 10, 0.35); border: 1px solid rgba(255, 213, 106, 0.45); }
  &--worst { color: #ff9a7a; background: rgba(90, 30, 10, 0.4); border: 1px solid rgba(255, 154, 122, 0.45); }
}

.cell-best { color: #6effc2 !important; }
.cell-weak { color: #ff9a7a !important; }
.cell-active { box-shadow: inset 0 0 0 1px rgba(0, 242, 255, 0.35); }

.rank-list li.is-self {
  color: #ffd56a;
  font-weight: 800;
}

.analysis-table {
  th,
  td {
    vertical-align: top;
  }

  th:nth-child(1) { width: 140px; }
  th:nth-child(2) { width: 38%; }
  th:nth-child(3) { width: 110px; text-align: center; }
  th:nth-child(4) { min-width: 340px; }

  .analysis-line {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    line-height: 1.35;
  }

  .analysis-dim {
    color: #b8ecff;
    font-weight: 700;
    white-space: nowrap;

    &__icon {
      flex-shrink: 0;
      font-size: 18px;
      line-height: 1;
    }
  }

  .analysis-value {
    color: #eaf7ff;
    font-weight: 600;
    white-space: nowrap;

    .analysis-line {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .analysis-status {
    text-align: center;
  }

  .analysis-why {
    color: #cfe6ff;
    min-width: 340px;

    &__text {
      margin: 0;
      min-height: 28px;
      line-height: 1.55;
    }
  }
}

.analysis-hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 2px 0 14px;

  h3 {
    margin: 0;
    font-size: 24px;
    color: #eaf7ff;

    em {
      margin-left: 8px;
      font-style: normal;
      font-size: 17px;
      color: #ffd56a;
    }
  }
}

.analysis-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.analysis-badge {
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 16px;
  font-weight: 800;

  &--best { color: #6effc2; background: rgba(20, 80, 60, 0.35); border: 1px solid rgba(110, 255, 194, 0.35); }
  &--mid { color: #ffd56a; background: rgba(90, 70, 10, 0.3); border: 1px solid rgba(255, 213, 106, 0.35); }
  &--worst { color: #ff9a7a; background: rgba(90, 30, 10, 0.35); border: 1px solid rgba(255, 154, 122, 0.35); }
}

@media (max-width: 1280px) {
  .resource-summary,
  .major-cards,
  .grade-history,
  .insight-grid,
  .soft-dim-grid,
  .metric-groups { grid-template-columns: 1fr; }
  .resource-section__grid--2,
  .kv-grid { grid-template-columns: 1fr; }
  .profile-hero { flex-direction: column; align-items: flex-start; }
  .judgment-bestworst { grid-template-columns: 1fr; }
}
</style>
