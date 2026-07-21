<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import DashIcon from '@/components/college/DashIcon.vue'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import type {
  AcademicDevVM,
  CompetitionVM,
  CreditProgressVM,
  FailedCourseVM,
  GrowthOverviewVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'

const props = defineProps<{
  academic: AcademicDevVM
  credit: CreditProgressVM
  failedCritical: FailedCourseVM[]
  growthOverview: GrowthOverviewVM
  competition: CompetitionVM
  quality: QualityVM
  scholarships: Array<{ name: string; year: string }>
  profile: PersonalInfoVM
}>()

defineEmits<{ open: [id: string] }>()

const router = useRouter()

const creditBuckets = computed(() => {
  if (props.credit.buckets?.length) return props.credit.buckets
  const required = props.credit.required || 160
  const earned = props.credit.earned || 0
  return [
    { label: '必修学分', earned: Math.round(earned * 0.7 * 10) / 10, required: Math.round(required * 0.7) },
    { label: '选修学分', earned: Math.round(earned * 0.2 * 10) / 10, required: Math.round(required * 0.2) },
    { label: '通识学分', earned: Math.round(earned * 0.1 * 10) / 10, required: Math.max(1, Math.round(required * 0.1)) },
  ]
})

const failCount = computed(() => props.failedCritical.length)
const failTone = computed(() => {
  if (failCount.value >= 3) return 'high'
  if (failCount.value > 0) return 'medium'
  return 'low'
})

const failNames = computed(() =>
  props.failedCritical.map((c) => c.name).filter(Boolean).slice(0, 2).join('、'),
)

const academicRisk = computed(() => {
  const gpa = props.academic.gpa
  const rank = props.academic.majorRank || 0
  const total = props.academic.majorTotal || 0
  const rankPct = total > 0 && rank > 0 ? rank / total : 0
  const isDownstream = total > 0 && rankPct >= 0.7
  const gpaLow = gpa > 0 && gpa < 2.5
  const gpaVeryLow = gpa > 0 && gpa < 2.0
  const values = props.academic.gpaValues ?? []
  const prev = values.length >= 2 ? values[values.length - 2]! : gpa
  const curr = values.length ? values[values.length - 1]! : gpa
  const gpaDrop = Math.round((curr - prev) * 100) / 100

  const sources: string[] = []
  if (failCount.value > 0) {
    sources.push(
      failNames.value
        ? `挂科 ${failCount.value} 门（${failNames.value}${failCount.value > 2 ? '等' : ''}）`
        : `挂科 ${failCount.value} 门`,
    )
  }
  if (gpaVeryLow) sources.push(`GPA ${gpa.toFixed(2)} 显著偏低`)
  else if (gpaLow) sources.push(`GPA ${gpa.toFixed(2)} 偏低`)
  if (isDownstream) sources.push(`专业排名下游 ${rank}/${total}`)
  if (gpaDrop < -0.05) sources.push(`GPA 较上学期下降 ${Math.abs(gpaDrop).toFixed(2)}`)

  let label = '低风险'
  let level: 'low' | 'medium' | 'high' = 'low'
  if (failCount.value >= 3 || gpaVeryLow) {
    label = '高风险'
    level = 'high'
  } else if (failCount.value > 0 || gpaLow || isDownstream) {
    label = '中风险'
    level = 'medium'
  }

  const tip =
    sources.length > 0
      ? `${label}来源：${sources.join('；')}`
      : `${label}：暂无挂科，GPA 与排名处于安全区间，保持常规考核节奏即可`

  return { label, level, tip, sources }
})

const gpaDelta = computed(() => {
  const values = props.academic.gpaValues ?? []
  const current = values[values.length - 1] ?? props.academic.gpa
  const previous = values[values.length - 2] ?? current
  return Math.round((current - previous) * 100) / 100
})

/** GPA 折线：横轴按学期均分，不再压成大一～大四四档 */
const academicSpark = computed(() => {
  const gpaValues = props.academic.gpaValues?.length ? props.academic.gpaValues : [props.academic.gpa]
  const labels = (props.academic.semesters?.length
    ? props.academic.semesters.slice(-gpaValues.length)
    : gpaValues.map((_, i) => `第${i + 1}学期`)
  ).map((s) => String(s).replace(/学期$/, ''))

  const gpaMinRaw = Math.min(...gpaValues)
  const gpaMaxRaw = Math.max(...gpaValues)
  const gpaPad = Math.max(0.05, (gpaMaxRaw - gpaMinRaw) * 0.18)
  const gpaMin = Math.max(0, Math.floor((gpaMinRaw - gpaPad) * 10) / 10)
  const gpaMax = Math.min(5, Math.ceil((gpaMaxRaw + gpaPad) * 10) / 10)
  const gpaSpan = Math.max(0.1, gpaMax - gpaMin)

  const rank = props.academic.majorRank || 1
  const total = Math.max(1, props.academic.majorTotal || 100)
  const rankScore = Math.max(5, Math.round((1 - (rank - 1) / total) * 100))
  const rankValues = gpaValues.map((_, i) => {
    const wobble = (i - (gpaValues.length - 1)) * 2
    return Math.max(5, Math.min(100, rankScore + wobble))
  })
  const rankMin = Math.min(...rankValues)
  const rankMax = Math.max(...rankValues)
  const rankSpan = Math.max(1, rankMax - rankMin)

  const width = 220
  const height = 92
  const pad = { top: 8, right: 8, bottom: 20, left: 28 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const n = Math.max(1, gpaValues.length - 1)

  const xAt = (index: number) =>
    gpaValues.length <= 1
      ? pad.left + plotW / 2
      : pad.left + (index / n) * plotW
  const yGpa = (value: number) => pad.top + plotH - ((value - gpaMin) / gpaSpan) * plotH
  const yRank = (value: number) => pad.top + plotH - ((value - rankMin) / rankSpan) * plotH

  const gpaDots = gpaValues.map((value, index) => ({ x: xAt(index), y: yGpa(value) }))
  const rankDots = rankValues.map((value, index) => ({ x: xAt(index), y: yRank(value) }))
  const gpaPoints = gpaDots.map((p) => `${p.x},${p.y}`).join(' ')
  const rankPoints = rankDots.map((p) => `${p.x},${p.y}`).join(' ')

  const yTicks = [0, 0.5, 1].map((t) => {
    const value = gpaMin + gpaSpan * (1 - t)
    return {
      y: pad.top + plotH * t,
      label: value.toFixed(1),
    }
  })

  const xTicks = labels.map((label, index) => ({
    x: xAt(index),
    label,
  }))

  return {
    width,
    height,
    pad,
    plotBottom: pad.top + plotH,
    plotLeft: pad.left,
    plotRight: pad.left + plotW,
    yTicks,
    xTicks,
    gpaDots,
    rankDots,
    gpaPoints,
    rankPoints,
    gpa: gpaValues[gpaValues.length - 1],
    rank,
    total,
  }
})

const showGraduation = computed(() => {
  const grade = props.profile.grade || ''
  return /大三|大四|研|毕业|3|4|三|四/.test(grade)
})

const thesisSteps = ['选题', '开题', '初稿', '答辩'] as const
const thesisIndex = computed(() => {
  const status = props.profile.thesisStatus || '未开始'
  const idx = thesisSteps.findIndex((s) => status.includes(s))
  return idx
})

const graduationRisk = computed(() => {
  if (failCount.value >= 3) {
    return { label: '高风险', level: 'high', tip: '挂科较多，毕业延期风险较高，需尽快闭环未完成项。' }
  }
  if (failCount.value > 0) {
    return { label: '需关注', level: 'medium', tip: '存在未闭环任务或挂科，需关注毕业审核进度。' }
  }
  return { label: '正常', level: 'low', tip: '毕业审核进度总体正常，继续按节点推进即可。' }
})

const thesisStage = computed(() => {
  if (thesisIndex.value >= 0) return thesisSteps[thesisIndex.value]
  return props.profile.thesisStatus || '未开始'
})

const scholarshipCount = computed(() => props.scholarships.length)
const disciplineRecords = computed(() => props.quality.disciplineRecords ?? [])
const disciplineCount = computed(() => disciplineRecords.value.length)
const latestDiscipline = computed(() => disciplineRecords.value[0] ?? null)
const rewardCount = computed(() => {
  const fromSch = scholarshipCount.value
  const fromAwards = props.profile.awards?.length ?? 0
  const fromComp = props.competition.awardCount || 0
  return Math.max(fromSch + fromAwards, fromComp, fromSch)
})
const overallTopPercent = computed(() => {
  const total = props.growthOverview.overallTotal || 1
  return ((props.growthOverview.overallRank / total) * 100).toFixed(1)
})
const overallRankText = computed(() => {
  const rank = props.growthOverview.overallRank
  const total = props.growthOverview.overallTotal || '—'
  return `${rank} / ${total}`
})

const isResearchLabel = (text: string) => /大创|科研|论文|专利|软著|课题|项目|发表/.test(text)
const isCompetitionLabel = (text: string) => /竞赛|比赛|大赛|杯|挑战|创新赛|创业赛/.test(text)
const isPracticeLabel = (text: string) => /志愿|实践|服务|支教|社区|公益|社会活动/.test(text)
const isArtLabel = (text: string) => /体育|文艺|艺术|文化|书画|歌唱|舞蹈|运动会|篮球|足球|排球|羽毛球|乒乓球|游泳|田径|音乐|乐器|摄影|演讲|主持|辩论|棋|才艺/.test(text)
const isCollectiveLabel = (text: string) => /集体|团队|班级|宿舍|寝室|支部|小组/.test(text)
const isCertLabel = (text: string) => /证书|资格|认证|英语|计算机|普通话|驾照|CET|雅思|托福|等级|软考|会计|司法|教师资格|建造师|医师|护士|驾驶证|四六级|NCRE|PMP|CFA|CPA/.test(text)
const isHonorTitleLabel = (text: string) => /荣誉|称号|标兵|模范|三好|优秀|先进|杰出|拔尖/.test(text)

/* ─────────── 荣誉成果分类联动（左侧 8 分类 + 右侧成果列表） ─────────── */

interface HonorCat {
  key: string
  label: string
  count: number
  items: string[]
}

/** 从 awards 按优先级提取，避免一条记录同时落入多个分类 */
function classifyAwards() {
  const awards = props.profile.awards ?? []
  const comp: string[] = []
  const research: string[] = []
  const honor: string[] = []
  const practice: string[] = []
  const art: string[] = []
  const collective: string[] = []
  const cert: string[] = []
  const other: string[] = []

  for (const a of awards) {
    const text = a.name
    const line = a.level ? `${a.name} · ${a.level}` : a.name
    if (isCompetitionLabel(text)) { comp.push(line); continue }
    if (isResearchLabel(text)) { research.push(line); continue }
    if (isCertLabel(text)) { cert.push(line); continue }
    if (isCollectiveLabel(text)) { collective.push(line); continue }
    if (isArtLabel(text)) { art.push(line); continue }
    if (isPracticeLabel(text)) { practice.push(line); continue }
    if (isHonorTitleLabel(text)) { honor.push(line); continue }
    other.push(line)
  }
  return { comp, research, honor, practice, art, collective, cert, other }
}

const honorCats = computed<HonorCat[]>(() => {
  const classified = classifyAwards()

  // 1. 学科竞赛（最多展示 5 项）
  const compItems: string[] = [...classified.comp]
  for (const h of props.competition.highlights) {
    if (!h.label || h.label.includes('暂无')) continue
    const full = h.detail ? `${h.label}（${h.detail}）` : h.label
    if (!isResearchLabel(full)) compItems.push(full)
  }
  const compItemsDedup = [...new Set(compItems)].slice(0, 5)

  // 2. 科研成果
  const researchItems: string[] = [...classified.research]
  for (const h of props.competition.highlights) {
    if (!h.label || h.label.includes('暂无')) continue
    const full = h.detail ? `${h.label}（${h.detail}）` : h.label
    if (isResearchLabel(full)) researchItems.push(full)
  }
  if (!researchItems.length && props.competition.researchCount) {
    researchItems.push(`科研相关 ${props.competition.researchCount} 项`)
  }

  // 3. 荣誉称号（未归类的其他奖项也放这里兜底）
  const honorItems: string[] = [...classified.honor, ...classified.other]

  // 4. 奖学金
  const scholarshipItems: string[] = props.scholarships.map((s) => `${s.year} · ${s.name}`)

  // 5. 社会实践与志愿服务
  const practiceItems: string[] = [...classified.practice]
  if (props.quality.volunteerHours) {
    practiceItems.unshift(`累计志愿服务 ${props.quality.volunteerHours} 小时`)
  }
  if (props.quality.socialPractices) {
    practiceItems.unshift(`社会实践 ${props.quality.socialPractices} 次`)
  }

  // 6. 文体艺术
  const artItems: string[] = [...classified.art]

  // 7. 集体荣誉
  const collectiveItems: string[] = [...classified.collective]

  // 8. 技能证书
  const certItems: string[] = [...classified.cert]

  const cats: HonorCat[] = [
    { key: 'competition', label: '学科竞赛', count: Math.max(compItemsDedup.length, props.competition.awardCount || 0), items: compItemsDedup },
    { key: 'research', label: '科研成果', count: Math.max([...new Set(researchItems)].length, props.competition.researchCount || 0), items: [...new Set(researchItems)] },
    { key: 'honor', label: '荣誉称号', count: [...new Set(honorItems)].length, items: [...new Set(honorItems)] },
    { key: 'scholarship', label: '奖学金', count: scholarshipItems.length, items: scholarshipItems },
    { key: 'practice', label: '社会实践与志愿服务', count: [...new Set(practiceItems)].length, items: [...new Set(practiceItems)] },
    { key: 'art', label: '文体艺术', count: [...new Set(artItems)].length, items: [...new Set(artItems)] },
    { key: 'collective', label: '集体荣誉', count: [...new Set(collectiveItems)].length, items: [...new Set(collectiveItems)] },
    { key: 'cert', label: '技能证书', count: [...new Set(certItems)].length, items: [...new Set(certItems)] },
  ]
  // 固定展示全部 8 个分类，没有数据的分类在右侧显示“暂无记录”
  return cats
})

const activeHonorCat = ref<string>('')
watch(
  honorCats,
  (cats) => {
    if (cats.length && !cats.find((c) => c.key === activeHonorCat.value)) {
      activeHonorCat.value = cats[0]!.key
    }
  },
  { immediate: true },
)

const activeHonorItems = computed(() => {
  const cat = honorCats.value.find((c) => c.key === activeHonorCat.value)
  return cat?.items.length ? cat.items : ['暂无记录']
})

const activeHonorCatLabel = computed(() => {
  const cat = honorCats.value.find((c) => c.key === activeHonorCat.value)
  return cat?.label ?? ''
})

/* 右侧成果列表自动滚动 */
const honorScrollRef = ref<HTMLElement | null>(null)
const honorHovering = ref(false)
let honorScrollTimer: ReturnType<typeof setInterval> | null = null

function startHonorScroll() {
  stopHonorScroll()
  honorScrollTimer = setInterval(() => {
    if (honorHovering.value || !honorScrollRef.value) return
    const el = honorScrollRef.value
    el.scrollTop += 1
    if (el.scrollTop >= el.scrollHeight - el.clientHeight - 2) {
      el.scrollTop = 0
    }
  }, 55)
}
function stopHonorScroll() {
  if (honorScrollTimer) { clearInterval(honorScrollTimer); honorScrollTimer = null }
}

onMounted(startHonorScroll)
onBeforeUnmount(stopHonorScroll)

function goQualityLedger(anchor?: 'reward' | 'discipline') {
  router.push({
    path: ROUTES.student.comprehensiveLedger,
    query: {
      studentId: props.profile.studentId,
      ...(anchor ? { focus: anchor } : {}),
    },
  })
}
function goGpaDetail() {
  router.push(ROUTES.student.gpaDetail)
}

function goFailDetail() {
  router.push(ROUTES.student.failDetail)
}

function goCreditProgress() {
  router.push(ROUTES.student.creditProgress)
}


</script>

<template>
  <StudentTplCard
    icon="map"
    title="学生发展概览"
    tip="学情轨迹、综合素养与智能育航三大板块一览。"
    hide-header
    class="stu-kanban-wrap"
  >
    <div class="dev-board">
      <!-- 学情轨迹 -->
      <article class="development-card development-card--academic">
        <header class="development-card__head">
          <span class="development-card__icon" aria-hidden="true">
            <DashIcon kind="academic" :size="20" />
          </span>
          <div>
            <StuHint tip="盯 GPA、挂科与学分进度，判断是否需要学业干预。">
              <h4>学情轨迹护航</h4>
            </StuHint>
          </div>
          <StuHint :tip="academicRisk.tip" :delay="280">
            <span class="development-status" :class="`development-status--${academicRisk.level}`">{{ academicRisk.label }}</span>
          </StuHint>
        </header>

        <div class="academic-body">
          <StuHint tip="GPA 按学期走势（实线）与专业排名走势（虚线）；点击查看学业详情。" class="academic-spark-wrap clickable-card" @click="goGpaDetail">
            <div class="academic-spark-card">
              <div class="academic-spark-card__head">
                <span>学情折线</span>
                <strong>GPA {{ academicSpark.gpa.toFixed(2) }}{{ gpaDelta >= 0 ? ' ↑' : ' ↓' }}</strong>
              </div>
              <svg
                class="academic-spark"
                :viewBox="`0 0 ${academicSpark.width} ${academicSpark.height}`"
                preserveAspectRatio="none"
                role="img"
                aria-label="GPA与专业排名走势"
              >
                <g class="academic-spark__grid">
                  <line
                    v-for="tick in academicSpark.yTicks"
                    :key="`yg-${tick.y}`"
                    :x1="academicSpark.plotLeft"
                    :x2="academicSpark.plotRight"
                    :y1="tick.y"
                    :y2="tick.y"
                  />
                </g>
                <g class="academic-spark__axis">
                  <line
                    :x1="academicSpark.plotLeft"
                    :x2="academicSpark.plotLeft"
                    :y1="academicSpark.pad.top"
                    :y2="academicSpark.plotBottom"
                  />
                  <line
                    :x1="academicSpark.plotLeft"
                    :x2="academicSpark.plotRight"
                    :y1="academicSpark.plotBottom"
                    :y2="academicSpark.plotBottom"
                  />
                </g>
                <g class="academic-spark__ylabels">
                  <text
                    v-for="tick in academicSpark.yTicks"
                    :key="`yl-${tick.label}`"
                    :x="academicSpark.plotLeft - 4"
                    :y="tick.y + 3"
                    text-anchor="end"
                  >{{ tick.label }}</text>
                </g>
                <polyline :points="academicSpark.gpaPoints" class="academic-spark__gpa" fill="none" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                <polyline :points="academicSpark.rankPoints" class="academic-spark__rank" fill="none" stroke-width="2" stroke-dasharray="4 3" stroke-linecap="round" stroke-linejoin="round" />
                <g class="academic-spark__dots academic-spark__dots--gpa">
                  <circle v-for="(dot, idx) in academicSpark.gpaDots" :key="`g-${idx}`" :cx="dot.x" :cy="dot.y" r="2.4" />
                </g>
                <g class="academic-spark__dots academic-spark__dots--rank">
                  <circle v-for="(dot, idx) in academicSpark.rankDots" :key="`r-${idx}`" :cx="dot.x" :cy="dot.y" r="2.2" />
                </g>
                <g class="academic-spark__xlabels">
                  <text
                    v-for="(tick, idx) in academicSpark.xTicks"
                    :key="`xl-${idx}-${tick.label}`"
                    :x="tick.x"
                    :y="academicSpark.height - 4"
                    text-anchor="middle"
                  >{{ tick.label }}</text>
                </g>
              </svg>
              <div class="academic-spark-card__legend">
                <em>实线 GPA</em>
                <em>虚线 专业排名</em>
                <em>专业排名 {{ academic.majorRank }}/{{ academic.majorTotal || '—' }}</em>
              </div>
            </div>
          </StuHint>

          <div class="credit-bars clickable-card" @click="goCreditProgress">
            <div class="credit-bars__header">学分完成率</div>
            <div class="credit-bars__grid">
              <StuHint
                v-for="bucket in creditBuckets"
                :key="bucket.label"
                block
                :tip="`${bucket.label}：已获 ${bucket.earned} / 应修 ${bucket.required}`"
              >
                <div class="credit-bars__row">
                  <span>{{ bucket.label.replace('学分', '') }}</span>
                  <i>
                    <b
                      :style="{ width: `${Math.min(100, Math.round((bucket.earned / Math.max(1, bucket.required)) * 100))}%` }"
                    />
                  </i>
                  <em>{{ bucket.earned }}/{{ bucket.required }}</em>
                </div>
              </StuHint>
            </div>
            <div class="credit-bars__total">
              合计 {{ credit.earned }}/{{ credit.required }}（{{ credit.earnedPercent }}%）
            </div>
          </div>

          <div class="academic-kpis" v-if="failCount">
            <StuHint
              :tip="failNames ? `挂科课程：${failNames}` : '存在挂科课程。'"
              block
            >
              <button
                type="button"
                class="fail-chip"
                :class="`fail-chip--${failTone}`"
                @click="goFailDetail"
              >
                挂科 {{ failCount }} 门
              </button>
            </StuHint>
          </div>

          <div v-if="showGraduation" class="academic-graduation-brief">
            <StuHint :tip="graduationRisk.tip">
              <div class="graduation-brief-item">
                <span>毕业审核</span>
                <strong :class="`is-${graduationRisk.level}`">{{ graduationRisk.label }}</strong>
              </div>
            </StuHint>
            <StuHint tip="一级页面仅展示当前毕设阶段，论文节点与审核任务进入二级页面查看。">
              <div class="graduation-brief-item">
                <span>毕设阶段</span>
                <strong>{{ thesisStage }}</strong>
              </div>
            </StuHint>
            <button type="button" class="graduation-brief-btn" @click="router.push({ path: ROUTES.student.graduationAudit, query: { studentId: profile.studentId } })">
              查看审核 ›
            </button>
          </div>
        </div>

        <button type="button" class="development-card__action" @click="router.push({ path: ROUTES.student.academicDetail, query: { studentId: profile.studentId } })">
          查看学情详情 <span aria-hidden="true">›</span>
        </button>
      </article>

      <!-- 综合素养 -->
      <article class="development-card development-card--quality">
        <header class="development-card__head">
          <span class="development-card__icon" aria-hidden="true">
            <DashIcon kind="trophy" :size="20" stroke="#e8c878" />
          </span>
          <div>
            <StuHint tip="综合素养荣誉与纪律台账：奖学金、竞赛、志愿等。">
              <h4>综合素养台账</h4>
            </StuHint>
          </div>
          <div class="quality-head-tags">
            <StuHint tip="奖项记录入口；无记录也可进入二级台账查看。">
              <button type="button" class="q-reward-tag" @click="goQualityLedger('reward')">
                奖项{{ rewardCount }}
              </button>
            </StuHint>
            <StuHint :tip="latestDiscipline ? `${latestDiscipline.type} · ${latestDiscipline.reason}` : '处分记录入口；无记录也可进入二级台账。'">
              <button type="button" class="q-disc-tag" @click="goQualityLedger('discipline')">
                处分{{ disciplineCount }}
              </button>
            </StuHint>
          </div>
        </header>

        <div class="quality-body">
          <div class="development-metrics development-metrics--quality">
            <StuHint tip="综合测评在同年级/范围内的位次，分子是名次，分母是总人数（完整显示）。" block>
              <div class="q-metric q-metric--inline q-metric--rank">
                <span>综测排名</span>
                <div class="q-metric__right">
                  <strong class="q-metric__rank">{{ overallRankText }}</strong>
                  <em>前 {{ overallTopPercent }}%</em>
                </div>
              </div>
            </StuHint>
            <StuHint tip="已获得的奖学金次数与代表条目。" block>
              <div class="q-metric q-metric--inline">
                <span>奖学金</span>
                <div class="q-metric__right">
                  <strong>{{ scholarshipCount }}<small>项</small></strong>
                  <em>{{ scholarships[0]?.name || '暂无获奖' }}</em>
                </div>
              </div>
            </StuHint>
            <StuHint tip="学科竞赛获奖与科研分开统计。" block>
              <div class="q-metric q-metric--inline">
                <span>获奖</span>
                <div class="q-metric__right">
                  <strong>{{ competition.awardCount }}<small>项</small></strong>
                  <em>科研 {{ competition.researchCount }} 项</em>
                </div>
              </div>
            </StuHint>
          </div>

          <!-- 荣誉成果：左侧 8 分类 + 右侧成果列表（自动滚动） -->
          <div class="honor-split">
            <div class="honor-nav">
              <div
                v-for="cat in honorCats"
                :key="cat.key"
                class="honor-nav__item"
                :class="{ 'is-active': activeHonorCat === cat.key }"
                @click="activeHonorCat = cat.key"
              >
                <span class="honor-nav__label">{{ cat.label }}</span>
                <strong class="honor-nav__count">{{ cat.count }}</strong>
              </div>
            </div>
            <div
              ref="honorScrollRef"
              class="honor-list"
              @mouseenter="honorHovering = true"
              @mouseleave="honorHovering = false"
            >
              <div
                v-for="(item, idx) in activeHonorItems"
                :key="`${activeHonorCat}-${idx}`"
                class="honor-list__item"
              >
                <span class="honor-list__cat">{{ activeHonorCatLabel }}</span>
                <span class="honor-list__name">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>

        <button type="button" class="development-card__action" @click="goQualityLedger()">
          查看台账详情 <span aria-hidden="true">›</span>
        </button>
      </article>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">

.dev-board {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-columns: 1.15fr 1.05fr;
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 16px;
  padding: 2px 6px 6px;
}

.development-card {
  --card-accent: #1ed6ff;
  --fs: 19px;
  --fs-sm: 17px;
  --fs-label: 16px;
  --fs-title: 20px;
  --fs-num: 24px;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 8px;
  padding: 10px 14px 10px 14px;
  overflow: hidden;
  font-size: var(--fs);
  line-height: 1.4;
  border: 1px solid color-mix(in srgb, var(--card-accent) 34%, transparent);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 10%, transparent), transparent 42%),
    linear-gradient(160deg, rgba(6, 40, 78, 0.88), rgba(0, 16, 38, 0.9));
  box-shadow:
    inset 0 0 28px rgba(0, 90, 160, 0.12),
    inset 0 1px 0 rgba(180, 230, 255, 0.1);
  transition: transform 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 32px rgba(0, 100, 180, 0.16),
      0 10px 28px rgba(0, 0, 0, 0.28),
      0 0 18px color-mix(in srgb, var(--card-accent) 16%, transparent);
  }

  &--quality { --card-accent: #e8c878; }
  &--career { --card-accent: #43e7af; }
}

.development-card--career {
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 8px;
}

.development-card__head {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 11px;
  flex: 0 0 auto;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(104, 200, 255, 0.12);

  h4 {
    margin: 0;
    color: #eef9ff;
    font-size: var(--fs-title);
    font-weight: 700;
    letter-spacing: 0.03em;
  }
}

.development-card__icon {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--card-accent) 40%, transparent);
  border-radius: 2px;
  background: color-mix(in srgb, var(--card-accent) 12%, transparent);
  color: var(--card-accent);
  box-shadow: inset 0 0 12px color-mix(in srgb, var(--card-accent) 10%, transparent);
}

.development-status {
  padding: 4px 9px;
  border: 1px solid;
  border-radius: 2px;
  font-size: var(--fs-label);
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;

  &--low { border-color: rgba(74, 222, 128, 0.34); background: rgba(74, 222, 128, 0.1); color: #55e995; }
  &--medium { border-color: rgba(250, 204, 21, 0.36); background: rgba(250, 204, 21, 0.1); color: #facc15; }
  &--high { border-color: rgba(248, 91, 91, 0.42); background: rgba(248, 91, 91, 0.12); color: #ff7474; }
  &--blue { border-color: rgba(45, 206, 255, 0.34); background: rgba(45, 206, 255, 0.1); color: #65dfff; }
}

.development-card--quality .development-metrics,
.development-card--career .development-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(58px, auto));
  flex: 0 0 auto;
  gap: 8px;
  align-content: start;
  min-height: 0;

  :deep(.stu-hint) {
    min-width: 0;
    display: block;
    height: auto;
  }

  :deep(.stu-hint > div),
  > div {
    box-sizing: border-box;
    min-width: 0;
    min-height: 46px;
    height: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2px;
    padding: 4px 8px;
    border: 1px solid rgba(120, 200, 255, 0.16);
    border-radius: 3px;
    background: linear-gradient(160deg, rgba(0, 50, 95, 0.45), rgba(0, 28, 58, 0.5));
    box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.06);
  }

  :deep(.stu-hint > .q-metric.is-disc-alert),
  :deep(.stu-hint > div.is-disc-alert) {
    border-color: rgba(255, 140, 100, 0.4);
    background: linear-gradient(160deg, rgba(90, 36, 28, 0.5), rgba(28, 18, 40, 0.5));
  }

  span {
    display: block;
    color: #8ec2de;
    font-size: 17px;
    font-weight: 600;
    white-space: nowrap;
  }

  strong {
    display: block;
    overflow: visible;
    color: var(--card-accent);
    font-family: var(--student-font-number);
    font-size: 17px;
    line-height: 1.15;
    white-space: nowrap;

    small {
      color: #9fc2dd;
      font-family: var(--student-font-body);
      font-size: 16px;
    }

    &.is-safe { color: #55e995; font-family: var(--student-font-body); font-size: 16px; }
    &.is-text { color: #dff4ff; font-family: var(--student-font-body); font-size: 16px; }
    &.is-alert-num { color: #ff9b7a; }
  }

  em {
    display: block;
    overflow: hidden;
    color: #8fb7cd;
    font-size: 15px;
    font-style: normal;
    line-height: 1.3;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.development-card--quality .development-metrics.development-metrics--quality {
  grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto;
  align-items: stretch;
  height: auto;
  min-height: 0;

  :deep(.stu-hint) {
    min-width: 0;
    height: 100%;
  }

  :deep(.stu-hint > div),
  > div {
    box-sizing: border-box;
    min-height: 56px;
    height: 100%;
    gap: 0;
    padding: 6px 8px;
    overflow: hidden;
  }

  :deep(.stu-hint > .q-metric--inline),
  .q-metric--inline {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    column-gap: 6px;
    width: 100%;
    height: 100%;
    min-width: 0;
  }

  /* 综测排名：上下排布，数字完整不挤出格 */
  :deep(.stu-hint > .q-metric--rank),
  .q-metric--rank {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto;
    align-content: center;
    row-gap: 2px;

    > span {
      font-size: 15px;
    }

    .q-metric__right {
      align-items: flex-start;
      text-align: left;
    }

    .q-metric__rank {
      font-size: 20px !important;
      letter-spacing: 0;
    }

    em {
      font-size: 15px;
    }
  }

  .q-metric__right {
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    gap: 2px;
    text-align: right;
  }

  span {
    flex: none;
    margin: 0;
    font-size: 16px;
    line-height: 1.2;
    white-space: nowrap;
  }

  strong {
    display: block;
    margin: 0;
    max-width: 100%;
    overflow: hidden;
    font-size: 22px;
    line-height: 1.15;
    white-space: nowrap;
    text-overflow: clip;

    small {
      margin-left: 2px;
      font-size: 16px;
      font-weight: 700;
    }
  }

  .q-metric__rank {
    font-size: 20px !important;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
  }

  em {
    display: block;
    margin: 0;
    max-width: 100%;
    overflow: visible;
    font-size: 15px;
    line-height: 1.25;
    white-space: nowrap;
    text-overflow: clip;
  }
}

.quality-head-tags {
  display: flex;
  align-items: center;
  gap: 6px;
}

.q-disc-tag,
.q-reward-tag {
  padding: 3px 8px;
  border: 1px solid rgba(248, 113, 113, 0.42);
  border-radius: 2px;
  background: rgba(248, 113, 113, 0.12);
  color: #ffb4b4;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  cursor: pointer;
}

.q-reward-tag {
  border-color: rgba(85, 233, 149, 0.45);
  background: rgba(38, 120, 80, 0.22);
  color: #7ef0a8;
}

.development-metrics--pair {
  grid-template-rows: repeat(2, minmax(46px, auto));

  :deep(.stu-hint),
  :deep(.stu-hint > div) {
    height: auto;
    min-height: 46px;
  }
}

.quality-body {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  min-height: 0;
  overflow: hidden;
}

.quality-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;

  &--single {
    grid-template-columns: minmax(0, 1fr);
  }
}

.quality-panel {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  overflow: hidden;
  border: 1px solid rgba(232, 200, 120, 0.18);
  border-radius: 4px;
  background: rgba(0, 36, 68, 0.4);

  &.is-alert {
    border-color: rgba(255, 140, 100, 0.35);
    background: rgba(70, 30, 28, 0.35);
  }

  &--split {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 8px;
    align-items: stretch;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1 1 auto;
    min-height: 0;
    overflow: hidden;
  }

  li,
  p {
    margin: 0;
    flex: 0 0 auto;
    overflow: visible;
    color: #d2e8f5;
    font-size: 17px;
    line-height: 1.4;
    text-overflow: clip;
    white-space: normal;
    word-break: break-word;
  }

  &__sub {
    flex: 0 0 auto;
    margin-top: 0 !important;
    color: #8eb8d4 !important;
    white-space: nowrap !important;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.quality-panel__main {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;

  &--scroll {
    min-height: 0;
  }
}

.quality-panel__cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

.quality-panel__col-label {
  display: block;
  margin-bottom: 3px;
  color: #e8c878;
  font-size: 14px;
  font-style: normal;
  font-weight: 800;
}

.quality-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  span {
    color: #e8c878;
    font-size: 21px;
    font-weight: 800;
    letter-spacing: 0.04em;
  }

  strong {
    padding: 3px 8px;
    border: 1px solid rgba(232, 200, 120, 0.28);
    border-radius: 3px;
    background: rgba(232, 200, 120, 0.1);
    color: #ffe59d;
    font-size: 18px;
    white-space: nowrap;
  }
}

.quality-panel__tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px;
  border: 1px solid rgba(232, 200, 120, 0.28);
  border-radius: 4px;
  background: rgba(20, 40, 70, 0.45);

  button {
    margin: 0;
    padding: 3px 10px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: #c9b27a;
    font: inherit;
    font-size: 17px;
    font-weight: 800;
    letter-spacing: 0.04em;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-active {
      background: rgba(232, 200, 120, 0.22);
      color: #ffe59d;
    }

    &:hover:not(.is-active) {
      color: #ffe9b0;
    }
  }
}

.quality-panel__list {
  margin: 0 !important;
  padding: 0 !important;
  list-style: none !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 5px !important;
  max-height: 88px;
  overflow-x: hidden !important;
  overflow-y: auto !important;
  scrollbar-width: thin;

  &--single {
    flex: 1 1 auto;
    max-height: none;
    min-height: 0;
  }

  li {
    margin: 0 !important;
    flex: 0 0 auto !important;
    overflow: visible !important;
    color: #d2e8f5;
    font-size: 17px !important;
    line-height: 1.4 !important;
    white-space: normal !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    text-overflow: clip !important;
  }
}

.quality-panel__side {
  flex: 0 0 auto;
  align-self: stretch;
  width: 128px;
  min-width: 128px;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 6px;
  padding: 2px 6px 2px 10px;
  border-left: 1px dashed rgba(232, 200, 120, 0.22);
  color: #c5e4f6;
}

.quality-panel__side-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: baseline;
  gap: 6px;
  min-width: 0;

  em {
    color: #8eb8d4;
    font-size: 15px;
    font-style: normal;
    font-weight: 650;
    white-space: nowrap;
  }

  strong {
    overflow: visible;
    color: #ffe59d;
    font-size: 18px;
    font-weight: 800;
    text-align: right;
    text-overflow: clip;
    white-space: nowrap;
  }
}

.academic-body {
  display: grid;
  grid-template-columns: minmax(180px, 1.2fr) minmax(0, 0.95fr);
  grid-template-rows: minmax(120px, 1fr) auto;
  gap: 8px 10px;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
  align-items: stretch;
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
}

.academic-spark-wrap {
  display: grid;
  align-self: stretch;
  min-height: 0;
}

.academic-spark-card {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(72px, 1fr) auto;
  gap: 6px;
  padding: 10px 12px;
  border: 1px solid rgba(30, 214, 255, 0.28);
  border-radius: 4px;
  background: rgba(0, 36, 68, 0.42);
}

.academic-spark-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  span { color: #9ed8f5; font-size: 19px; font-weight: 800; }
  strong { color: #75f0ac; font-size: 21px; font-weight: 900; }
}

.academic-spark {
  width: 100%;
  height: 100%;
  min-height: 72px;
  display: block;
  overflow: visible;
}

.academic-spark__grid line {
  stroke: rgba(120, 190, 230, 0.16);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}

.academic-spark__axis line {
  stroke: rgba(150, 210, 240, 0.45);
  stroke-width: 1.2;
}

.academic-spark__ylabels text,
.academic-spark__xlabels text {
  fill: #8eb8d4;
  font-size: 9px;
  font-weight: 600;
}

.academic-spark__gpa { stroke: #55e995; }
.academic-spark__rank { stroke: #65dfff; }

.academic-spark__dots--gpa circle {
  fill: #b8ffdc;
  stroke: rgba(0, 40, 64, 0.85);
  stroke-width: 1;
}

.academic-spark__dots--rank circle {
  fill: #9ae8ff;
  stroke: rgba(0, 40, 64, 0.85);
  stroke-width: 1;
}

.academic-spark-card__legend {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;

  em {
    color: #8eb8d4;
    font-size: 15px;
    font-style: normal;
    font-weight: 600;
  }
}

.academic-gpa-wrap {
  display: grid;
  place-items: center;
  align-self: stretch;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(30, 214, 255, 0.14);
  border-radius: 4px;
  background:
    radial-gradient(circle at center, rgba(30, 214, 255, 0.1), transparent 62%),
    rgba(0, 35, 73, 0.24);
  gap: 2px;
}

.clickable-card,
.academic-gpa-wrap.clickable-card {
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;

  &:hover {
    border-color: rgba(0, 212, 255, 0.55);
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.14), inset 0 0 14px rgba(0, 212, 255, 0.06);
    background: rgba(0, 55, 105, 0.36);
  }
}

.gpa-gauge__label {
  color: #b8ecff;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-align: center;
  white-space: nowrap;
}

.credit-bars__header {
  flex-shrink: 0;
  color: #b8ecff;
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  margin-bottom: 2px;
}

.academic-kpis {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  min-width: 0;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: auto;
  }
}

.academic-top {
  display: none;
}

.academic-kpi {
  min-width: 0;
  overflow: hidden;
  padding: 9px 10px;
  border: 1px solid rgba(120, 200, 255, 0.16);
  border-radius: 3px;
  background: rgba(0, 36, 72, 0.4);

  span {
    display: block;
    color: #8eb8d8;
    font-size: 18px;
    font-weight: 600;
  }

  strong {
    display: block;
    margin-top: 2px;
    color: #e8f7ff;
    font-family: var(--student-font-number);
    font-size: 18px;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;

    &.up { color: #55e995; }
    &.down { color: #ff7474; }
  }
}

.gpa-gauge {
  position: relative;
  display: grid;
  place-items: center;
  margin: 0 auto;

  svg { width: 80px; height: 80px; transform: rotate(-90deg); }
  &__track { fill: none; stroke: rgba(80, 120, 160, 0.35); stroke-width: 6; }
  &__value {
    fill: none;
    stroke: #62dfff;
    stroke-width: 6;
    stroke-linecap: round;
  }

  &__text {
    position: absolute;
    inset: 0;
    display: grid;
    place-content: center;
    text-align: center;

    strong {
      color: #7ff6ff;
      font-family: var(--student-font-number);
      font-size: 16px;
      line-height: 1;
    }
    span { color: #8eb8d8; font-size: 16px; font-weight: 700; }
  }
}

.fail-chip {
  width: 100%;
  min-height: 42px;
  padding: 6px 8px;
  border: 1px solid;
  border-radius: 3px;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &--low { border-color: rgba(74, 222, 128, 0.35); background: rgba(74, 222, 128, 0.1); color: #55e995; }
  &--medium { border-color: rgba(250, 204, 21, 0.4); background: rgba(250, 204, 21, 0.12); color: #facc15; }
  &--high { border-color: rgba(248, 91, 91, 0.45); background: rgba(248, 91, 91, 0.14); color: #ff7474; }
}

.credit-bars {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 6px;
  min-height: 0;
  padding: 10px 12px 8px;
  overflow: hidden;
  border: 1px solid rgba(0, 190, 255, 0.12);
  border-radius: 4px;
  background: rgba(0, 35, 73, 0.28);

  :deep(.stu-hint--block) {
    display: block;
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }

  &__total {
    margin-top: 2px;
    padding-top: 3px;
    border-top: 1px dashed rgba(120, 190, 240, 0.18);
    color: #9ecae8;
    font-size: 20px;
    font-weight: 600;
  }

  &__row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;

    span { color: #9ecae8; font-size: 19px; font-weight: 700; text-align: center; }
    i {
      width: 100%;
      height: 8px;
      overflow: hidden;
      border-radius: 99px;
      background: rgba(0, 60, 100, 0.55);
      b {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #1ed6ff, #43e7af);
      }
    }
    em {
      color: #cfe6f8;
      font-size: 18px;
      font-style: normal;
      text-align: center;
      white-space: nowrap;
    }
  }

  @at-root .credit-bars__grid > :nth-child(1) .credit-bars__row i b { background: linear-gradient(90deg, #1ed6ff, #4cc9f0); }
  @at-root .credit-bars__grid > :nth-child(2) .credit-bars__row i b { background: linear-gradient(90deg, #43e7af, #67e8a3); }
  @at-root .credit-bars__grid > :nth-child(3) .credit-bars__row i b { background: linear-gradient(90deg, #e8c878, #facc15); }
}

.career-path-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  overflow: hidden;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: 100%;
  }
}

.career-tabs {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  padding: 2px;
  border: 1px solid rgba(67, 231, 175, 0.28);
  border-radius: 4px;
  background: rgba(0, 40, 60, 0.45);

  &--header {
    justify-self: end;
    flex: 0 0 auto;
  }

  button {
    min-width: 0;
    height: 28px;
    padding: 0 10px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: #8fbfc8;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    white-space: nowrap;
    transition: background 0.15s ease, color 0.15s ease;

    &.is-active {
      background: linear-gradient(180deg, rgba(30, 160, 130, 0.42), rgba(0, 70, 90, 0.4));
      color: #eafff7;
      box-shadow: inset 0 0 0 1px rgba(67, 231, 175, 0.45);
    }

    &:hover:not(.is-active) {
      color: #c8f5e8;
    }
  }
}

.development-card__head--career {
  grid-template-columns: 38px auto minmax(0, 1fr);

  .development-card__title-wrap {
    min-width: 0;
  }
}

.career-facts {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 4px;
  margin: 0;
  padding: 8px 10px;
  overflow: hidden;
  border: 1px solid rgba(67, 231, 175, 0.22);
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(34, 150, 125, 0.12), rgba(0, 42, 76, 0.36)),
    rgba(0, 35, 72, 0.42);
  color: #d9f7ee;
  text-align: left;
  cursor: pointer;
  box-shadow: inset 0 0 16px rgba(67, 231, 175, 0.06);

  &:hover {
    border-color: rgba(67, 231, 175, 0.4);
  }
}

.career-funnel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 6px 8px 4px;
  border: 1px solid rgba(67, 231, 175, 0.2);
  border-radius: 4px;
  background: rgba(0, 40, 72, 0.35);
}

.career-funnel__bar {
  height: 5px;
  border-radius: 999px;
  background: rgba(0, 60, 100, 0.55);
  overflow: hidden;

  i {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #20c997, #52e8bf);
    transition: width 0.35s ease;
  }
}

.career-funnel__steps {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 0;
    color: #7eb4d8;
    font-size: 12px;
    font-weight: 600;
    text-align: center;

    b {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 1px solid rgba(126, 180, 212, 0.45);
      background: rgba(0, 36, 68, 0.55);
      font-size: 11px;
      font-weight: 800;
      line-height: 1;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    &.is-done {
      color: #7ef0c0;

      b {
        border-color: rgba(67, 231, 175, 0.55);
        background: rgba(32, 150, 120, 0.45);
        color: #d8fff0;
      }
    }

    &.is-current {
      color: #e8fff6;

      b {
        border-color: rgba(82, 232, 191, 0.85);
        background: linear-gradient(135deg, rgba(32, 201, 151, 0.7), rgba(0, 120, 100, 0.55));
        color: #fff;
        box-shadow: 0 0 10px rgba(67, 231, 175, 0.35);
      }
    }
  }
}

.career-facts__row {
  display: grid;
  grid-template-columns: 82px minmax(0, 1fr);
  align-items: baseline;
  gap: 8px;
  min-width: 0;

  em {
    color: #8eb8d4;
    font-size: 16px;
    font-style: normal;
    font-weight: 650;
    white-space: nowrap;
  }

  strong {
    min-width: 0;
    overflow: hidden;
    color: #eefcff;
    font-size: 19px;
    font-weight: 750;
    text-align: right;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.career-path {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto auto;
  gap: 10px;
  padding: 18px 20px 16px;
  overflow: hidden;
  border: 1px solid rgba(67, 231, 175, 0.2);
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(34, 150, 125, 0.16), rgba(0, 42, 76, 0.38)),
    rgba(0, 35, 72, 0.42);
  color: #d9f7ee;
  text-align: left;
  cursor: pointer;
  box-shadow:
    inset 0 0 18px rgba(67, 231, 175, 0.08),
    inset 0 1px 0 rgba(160, 255, 230, 0.08);

  &::before {
    position: absolute;
    inset: 0 auto 0 0;
    width: 3px;
    background: linear-gradient(180deg, #43e7af, rgba(67, 231, 175, 0));
    content: '';
  }

  span {
    color: #7ff6ff;
    font-size: 20px;
    font-weight: 800;
  }

  strong {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: #eefcff;
    font-size: 20px;
    font-weight: 900;
    line-height: 1.28;
  }

  em {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: #9cc9de;
    font-size: 19px;
    font-weight: 700;
    font-style: normal;
    line-height: 1.35;
  }

  b {
    justify-self: start;
    padding: 3px 7px;
    border: 1px solid rgba(126, 240, 204, 0.24);
    border-radius: 3px;
    background: rgba(67, 231, 175, 0.1);
    color: #77efbd;
    font-size: 17px;
    line-height: 1;
    white-space: nowrap;
  }

  i {
    display: block;
    height: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0, 70, 95, 0.65);

    &::before {
      display: block;
      width: 78%;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #43e7af, #7ff6ff);
      box-shadow: 0 0 12px rgba(67, 231, 175, 0.45);
      content: '';
    }
  }

  &--single {
    min-height: 0;
  }

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  &.is-preferred {
    border-color: rgba(67, 231, 175, 0.55);
    background:
      radial-gradient(circle at 80% 0, rgba(67, 231, 175, 0.18), transparent 46%),
      linear-gradient(180deg, rgba(34, 150, 125, 0.26), rgba(0, 42, 76, 0.46));
    box-shadow:
      inset 0 0 24px rgba(67, 231, 175, 0.16),
      0 0 14px rgba(67, 231, 175, 0.12);

    b {
      border-color: rgba(250, 204, 21, 0.45);
      background: rgba(250, 204, 21, 0.12);
      color: #f7d66b;
    }
  }
}

.thesis-steps {
  padding: 8px;
  border: 1px solid rgba(0, 190, 255, 0.14);
  border-radius: 4px;
  background: rgba(0, 35, 73, 0.34);

  > span { color: #b6e4ff; font-size: 18px; font-weight: 700; }

  ol {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
    margin: 6px 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 7px 2px;
    border-radius: 3px;
    background: rgba(0, 50, 90, 0.45);
    color: #7aa4c0;
    font-size: 18px;
    font-weight: 700;
    text-align: center;

    &.done {
      background: rgba(30, 120, 200, 0.35);
      color: #7ff6ff;
      box-shadow: inset 0 0 0 1px rgba(100, 200, 255, 0.35);
    }

    &.current {
      background: rgba(30, 160, 255, 0.45);
      color: #eaf8ff;
    }
  }
}

.career-matches {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 0;
  padding: 5px 6px;
  overflow-x: hidden;
  border: 1px solid rgba(67, 231, 175, 0.12);
  border-radius: 5px;
  background: rgba(0, 50, 69, 0.25);
  -ms-overflow-style: none;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  &__label {
    flex: 1 1 100%;
    font-size: 16px;
    font-weight: 700;
    color: #b8ecff;
    letter-spacing: 0.04em;
    margin-bottom: 2px;
  }

  &__empty {
    flex: 1 1 100%;
    margin: 0;
    padding: 10px;
    color: #8fb7cd;
    font-size: 17px;
    font-weight: 600;
    text-align: center;
    line-height: 1.4;
  }

  :deep(.stu-hint) {
    min-width: 0;
    flex: 0 0 38%;
  }

  :deep(.stu-hint:only-child) {
    flex: 0 0 38%;
  }
}

.career-benchmark-block {
  flex: 0 0 55%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;

  p {
    margin: 0;
    display: flex;
    gap: 4px;
    align-items: baseline;
    font-size: 16px;
    line-height: 1.25;
    white-space: nowrap;
  }

  em {
    color: #43e7af;
    font-style: normal;
    font-weight: 700;
    font-size: 15px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  span {
    color: #c5e4f6;
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
  }
}

.quality-panel li {
  position: relative;
  min-width: 0;
  flex: 0 0 auto;
  padding: 1px 0 1px 12px;
  overflow: visible;
  font-size: 17px;
  line-height: 1.4;
  text-overflow: clip;
  white-space: normal;
  word-break: break-word;
}

.quality-panel li::before {
  position: absolute;
  top: 0.55em;
  left: 1px;
  width: 4px;
  height: 4px;
  transform: none;
  border-radius: 50%;
  background: #e8c878;
  box-shadow: 0 0 6px rgba(232, 200, 120, 0.55);
  content: '';
}

.quality-panel__more {
  flex: 0 0 auto;
  align-self: flex-start;
  margin: 2px 0 0 !important;
  padding: 2px 0 0 !important;
  border: 0;
  border-top: 1px dashed rgba(232, 200, 120, 0.2);
  background: transparent;
  color: #d8bd72 !important;
  font: inherit;
  font-size: 15px !important;
  font-weight: 700;
  line-height: 1.3 !important;
  white-space: nowrap !important;
  overflow: visible;
  text-overflow: clip;
  cursor: pointer;

  &:hover {
    color: #ffe59d !important;
  }
}

/* ─────────── 荣誉成果左右分栏（一级卡片内） ─────────── */
.honor-split {
  display: grid;
  grid-template-columns: 136px minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
  flex: 1 1 auto;
  overflow: hidden;
}

/* 左侧分类导航 */
.honor-nav {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 3px;
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  border-radius: 4px;
  border: 1px solid rgba(232, 200, 120, 0.16);
  background: rgba(0, 30, 60, 0.32);

  &::-webkit-scrollbar {
    display: none;
  }
}

.honor-nav__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 6px 7px;
  border-radius: 4px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    border-color: rgba(232, 200, 120, 0.28);
    background: rgba(232, 200, 120, 0.05);
  }

  &.is-active {
    border-color: rgba(232, 200, 120, 0.4);
    background: rgba(232, 200, 120, 0.1);
    box-shadow: 0 0 8px rgba(232, 200, 120, 0.1), inset 0 0 0 1px rgba(232, 200, 120, 0.16);
  }
}

.honor-nav__label {
  color: #b8d8ef;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;

  .honor-nav__item.is-active & { color: #f2faff; }
}

.honor-nav__count {
  flex-shrink: 0;
  min-width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(232, 200, 120, 0.16);
  color: #ffe59d;
  font-size: 13px;
  font-weight: 900;
  font-family: var(--student-font-number);

  .honor-nav__item.is-active & {
    background: rgba(232, 200, 120, 0.28);
    box-shadow: 0 0 6px rgba(232, 200, 120, 0.25);
  }
}

/* 右侧成果列表 */
.honor-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid rgba(232, 200, 120, 0.16);
  background: rgba(0, 36, 68, 0.35);
  max-height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  min-height: 0;

  &::-webkit-scrollbar {
    display: none;
  }

  &__item {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 7px 8px;
    border-bottom: 1px solid rgba(180, 210, 230, 0.1);
    transition: background 0.15s ease;

    &:last-child {
      border-bottom: 0;
    }

    &:hover {
      background: rgba(0, 70, 120, 0.2);
    }
  }

  &__cat {
    color: #8eb8d4;
    font-size: 13px;
    font-weight: 700;
    line-height: 1.3;
  }

  &__name {
    color: #e0f0ff;
    font-size: 15px;
    font-weight: 600;
    line-height: 1.45;
    word-break: break-word;
  }
}

.career-match-rich {
  flex: 0 0 38%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex-shrink: 0;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;

    span {
      overflow: hidden;
      color: #c5e4f6;
      font-size: 16px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    strong {
      color: #5ce8bd;
      font-family: var(--student-font-number);
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
    }
  }

  > i {
    height: 4px;
    overflow: hidden;
    border-radius: 999px;
    background: rgba(0, 69, 91, 0.68);

    b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #20c997, #52e8bf); }
  }

  small {
    display: flex;
    flex-wrap: nowrap;
    gap: 3px 6px;
    color: #8fb7cd;
    font-size: 15px;

    em {
      font-style: normal;
      padding: 1px 0;
      white-space: nowrap;
    }
  }
}

.academic-graduation-brief {
  grid-column: 1 / -1;
  min-width: 0;
  min-height: 28px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
  gap: 4px;

  .graduation-brief-item {
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1px;
    padding: 3px 6px;
    border: 1px solid rgba(120, 200, 255, 0.16);
    border-radius: 3px;
    background: linear-gradient(160deg, rgba(0, 50, 95, 0.45), rgba(0, 28, 58, 0.5));

    span {
      display: block;
      color: #8ec2de;
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }

    strong {
      display: block;
      overflow: hidden;
      color: #dff4ff;
      font-size: 15px;
      font-weight: 700;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-low { color: #55e995; }
      &.is-medium { color: #facc15; }
      &.is-high { color: #ff7474; }
    }
  }

  .graduation-brief-btn {
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 3px 8px;
    border: 1px solid rgba(0, 212, 255, 0.28);
    border-radius: 3px;
    background: linear-gradient(180deg, rgba(0, 90, 160, 0.32), rgba(0, 50, 100, 0.28));
    color: #8ee9ff;
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease;

    &:hover {
      border-color: rgba(0, 212, 255, 0.5);
      background: linear-gradient(180deg, rgba(0, 110, 190, 0.42), rgba(0, 60, 120, 0.38));
    }
  }
}

.graduation-progress {
  display: flex !important;
  align-items: center;
  gap: 7px;

  i {
    width: 9px;
    height: 9px;
    flex-shrink: 0;
    border-radius: 50%;
    background: currentColor;
    box-shadow: 0 0 9px currentColor;
  }

  &--low { color: #55e995 !important; }
  &--medium { color: #facc15 !important; }
  &--high { color: #ff7474 !important; }
}

.graduation-thesis {
  padding: 6px 8px !important;
}

.graduation-tasks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: 4px 6px;
  min-height: 0;
  overflow: hidden;

  :deep(.stu-hint--block) {
    min-width: 0;
    display: block;
    height: 100%;
  }

  :deep(.stu-hint > div),
  > div {
    display: grid;
    grid-template-columns: 10px 1fr auto;
    gap: 6px;
    align-items: center;
    height: 100%;
    padding: 4px 8px;
    border: 1px solid rgba(126, 184, 255, 0.16);
    border-radius: 4px;
    background: rgba(30, 50, 100, 0.28);
  }

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #7aa4c0;
  }

  span {
    overflow: hidden;
    color: #d8eeff;
    font-size: 18px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  em {
    color: #9ecae8;
    font-size: 17px;
    font-style: normal;
    white-space: nowrap;
  }

  .done {
    border-color: rgba(74, 222, 128, 0.28);
    i { background: #55e995; box-shadow: 0 0 8px rgba(85, 233, 149, 0.45); }
    span { color: #9ef0c2; }
  }
}

.development-insight {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 40px;
  padding: 6px 10px;
  border-left: 2px solid var(--card-accent);
  border-radius: 3px;
  background: color-mix(in srgb, var(--card-accent) 7%, rgba(0, 28, 60, 0.7));

  span {
    padding: 4px 9px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--card-accent) 12%, transparent);
    color: var(--card-accent);
    font-size: 20px;
    font-weight: 700;
    white-space: nowrap;
  }

  p {
    margin: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    color: #c2e0f0;
    font-size: 19px;
    font-weight: 500;
    line-height: 1.45;
  }
}

.development-card--career .development-insight p {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.development-card__action {
  width: 100%;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 0;
  flex: 0 0 auto;
  border: 1px solid color-mix(in srgb, var(--card-accent) 28%, transparent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--card-accent) 10%, transparent);
  color: color-mix(in srgb, var(--card-accent) 82%, white);
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 50%, transparent);
    background: color-mix(in srgb, var(--card-accent) 16%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .development-slide {
    transition: none;
  }
}
</style>
