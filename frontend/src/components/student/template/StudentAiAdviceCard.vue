<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import { ROUTES } from '@/constants/routes'
import type {
  AcademicDevVM,
  AiAssistantVM,
  AiPortraitVM,
  CareerDevVM,
  CompetitionVM,
  EmploymentVM,
  GrowthOverviewVM,
  HighlightItemVM,
  InternshipVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'

const props = defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
  employment: EmploymentVM
  academic?: AcademicDevVM
  competition?: CompetitionVM
  highlights?: HighlightItemVM[]
  profile?: PersonalInfoVM
  careerDev?: CareerDevVM
  quality?: QualityVM
  growthOverview?: GrowthOverviewVM
  internship?: InternshipVM
}>()

defineEmits<{ open: [id: string] }>()
const router = useRouter()
const route = useRoute()

function goGrowthPath() {
  const studentId = route.query.studentId as string | undefined
  router.push({ path: ROUTES.student.growthPath, query: studentId ? { studentId } : undefined })
}

function goAiPortrait() {
  const studentId = route.query.studentId as string | undefined
  router.push({ path: ROUTES.student.aiPortrait, query: studentId ? { studentId } : undefined })
}

type PageId = 'judge' | 'action'

const pages: Array<{ id: PageId; label: string; tip: string }> = [
  { id: 'judge', label: '全景研判', tip: '全景研判 + 发展规划。' },
  {
    id: 'action',
    label: '育人智策',
    tip: '风险雷达 + 育人智策 + 机会雷达。角标：红=重要，黄=一般，绿=好的。',
  },
]

const activePage = ref<PageId>('judge')
const AUTOPLAY_INTERVAL = 9000
let autoplayTimer: ReturnType<typeof setInterval> | null = null

/** 一级面板最多展示条数，角标与列表保持一致 */
const RISK_VISIBLE = 2
const CHANCE_VISIBLE = 3

const riskItems = computed(() =>
  props.portrait.pushes.filter((p) => {
    if (p.type !== 'warn' && !/风险|不足|挂科|不及格/.test(p.text)) return false
    if (/无.*预警|无明显|暂无风险|当前无学业/.test(p.text)) return false
    return true
  }),
)

const visibleRiskItems = computed(() => riskItems.value.slice(0, RISK_VISIBLE))

const strengthTags = computed(() =>
  props.portrait.strengthTags?.length
    ? props.portrait.strengthTags
    : props.portrait.portraitTags.filter((t) => /高潜|优势|稳定|正向/.test(t)).slice(0, 3).concat(
      props.portrait.portraitTags.filter((t) => !/高潜|优势|稳定|正向|待|不足/.test(t)).slice(0, 1),
    ).slice(0, 3),
)

const focusTags = computed(() =>
  props.portrait.focusTags?.length
    ? props.portrait.focusTags
    : props.portrait.portraitTags.filter((t) => /待|不足|短板|关注/.test(t)).concat(['实践经历不足']).slice(0, 3),
)

/** 深色底上的扁平多色（无霓虹） */
const CLOUD_COLORS = [
  '#6ec8ff', '#5ad1c4', '#7aa8ff', '#ff9f5a', '#ff7b72',
  '#c084fc', '#f472b6', '#4ade80', '#fbbf24', '#38bdf8',
  '#a78bfa', '#fb7185', '#2dd4bf', '#86efac', '#f59e0b',
]

function shortTag(text: string) {
  const t = text
    .replace(/高潜/g, '')
    .replace(/待完善|待补充|待接入/g, '待补')
    .replace(/方向潜能[：:]?/g, '')
    .replace(/工程师/g, '')
    .trim()
  if (!t) return text.slice(0, 4)
  if (t.length <= 6) return t
  return t.slice(0, 6)
}

function hashHue(text: string, i: number) {
  let h = i * 19
  for (let k = 0; k < text.length; k++) h += text.charCodeAt(k) * (k + 3)
  return CLOUD_COLORS[Math.abs(h) % CLOUD_COLORS.length]!
}

type CloudSeed = { text: string; kind: 'good' | 'warn'; weight: number; size: number }

/** 无重叠排布：加大字号 + 显式间距，宁可少词也不叠 */
function packCloudWords(seeds: CloudSeed[]) {
  const VW = 480
  const VH = 200
  const cx = VW * 0.5
  const cy = VH * 0.52
  const GAP_X = 10
  const GAP_Y = 8
  const placed: Array<{
    text: string
    kind: 'good' | 'warn'
    x: number
    y: number
    size: number
    w: number
    h: number
  }> = []

  const estimateW = (text: string, size: number) => text.length * size * 1.02
  const estimateH = (size: number) => size * 1.2
  const overlaps = (a: { x: number; y: number; w: number; h: number }, b: typeof a) =>
    Math.abs(a.x - b.x) < (a.w + b.w) * 0.5 + GAP_X
    && Math.abs(a.y - b.y) < (a.h + b.h) * 0.5 + GAP_Y

  const sorted = [...seeds].sort((a, b) => b.weight - a.weight || b.size - a.size)

  for (const item of sorted) {
    const w = estimateW(item.text, item.size)
    const h = estimateH(item.size)
    let best: { x: number; y: number } | null = null

    for (let step = 0; step < 720; step++) {
      const t = step * 0.42
      const r = 0.7 * t
      const ang = t * 0.88
      const x = cx + Math.cos(ang) * r
      const y = cy + Math.sin(ang) * r * 0.72
      if (x < w * 0.5 + 6 || x > VW - w * 0.5 - 6) continue
      if (y < h * 0.5 + 18 || y > VH - h * 0.5 - 6) continue
      const cand = { x, y, w, h }
      if (placed.some((p) => overlaps(cand, p))) continue
      best = { x, y }
      break
    }

    if (!best) continue
    placed.push({ text: item.text, kind: item.kind, x: best.x, y: best.y, size: item.size, w, h })
  }

  return placed.map((p, i) => ({
    text: p.text,
    kind: p.kind,
    style: {
      left: `${(p.x / VW) * 100}%`,
      top: `${(p.y / VH) * 100}%`,
      fontSize: `${p.size}px`,
      color: hashHue(p.text, i),
      transform: 'translate(-50%, -50%)',
    },
  }))
}

/** 优势/关注词云：大字、无重叠、深色底 */
const cloudWords = computed(() => {
  const seen = new Set<string>()
  const seed: CloudSeed[] = []
  const push = (text: string, kind: 'good' | 'warn', weight: number, size: number) => {
    const t = shortTag(text)
    if (!t || seen.has(t)) return
    seen.add(t)
    seed.push({ text: t, kind, weight, size })
  }

  strengthTags.value.forEach((t, i) => push(t, 'good', 5 - i, i === 0 ? 26 : 20))
  focusTags.value.forEach((t, i) => push(t, 'warn', 4 - i, 18))
  props.portrait.portraitTags.slice(0, 4).forEach((t) => {
    push(t, /待|不足|短板|关注/.test(t) ? 'warn' : 'good', 3, 17)
  })
  ;(props.competition?.highlights ?? [])
    .filter((h) => h.label && !h.label.includes('暂无'))
    .slice(0, 2)
    .forEach((h) => push(h.label.replace(/全国大学生|全国/g, '').slice(0, 6), 'good', 2, 16))

  const fillers = ['学业', '竞赛', '实践', '成长', '英语', '项目', '优秀', '正向', '稳定', '进取']
  fillers.forEach((f, i) => {
    if (seed.length >= 14) return
    push(f, i % 4 === 0 ? 'warn' : 'good', 1, 15)
  })

  return packCloudWords(seed)
})

const summaryText = computed(() => props.portrait.summary || '暂无全景研判摘要')

const dualEnds = computed(() => {
  const good = strengthTags.value.slice(0, 2).join('、') || '综合表现稳健'
  const weak = focusTags.value.slice(0, 2).join('、') || '暂无明显短板'
  return { good, weak }
})

type PlanId = 'postgraduate' | 'public' | 'job'

const developmentPlans = computed(() => {
  const awards = props.competition?.awardCount ?? 0
  const research = props.competition?.researchCount ?? 0
  const volunteer = props.quality?.volunteerHours ?? 0
  const cadre = props.quality?.cadreRoles?.length ?? 0
  const jobReady = props.employment.jobReadiness || 60
  const rawAward = props.competition?.highlights?.find((h) => h.label && !h.label.includes('暂无'))?.label || ''
  const awardShort = (() => {
    if (!rawAward) return ''
    if (/数学建模/.test(rawAward)) return '数学建模省赛一等奖'
    if (/蓝桥杯/.test(rawAward) && /全国|国家/.test(rawAward)) return '蓝桥杯国赛二等奖'
    if (/蓝桥杯/.test(rawAward)) return '蓝桥杯省赛一等奖'
    const cleaned = rawAward.replace(/（[^）]+）/g, '').replace(/，.+$/, '').trim()
    return cleaned.length > 14 ? cleaned.slice(0, 14) : cleaned
  })()
  const overallPct = props.growthOverview?.overallPercent || ''
  const dest = props.careerDev?.employmentDestination || ''

  const postScore = Math.max(45, Math.min(95, Math.round(58 + awards * 4 + research * 6 + (dest.includes('考研') ? 12 : 0))))
  const publicScore = Math.max(40, Math.min(92, Math.round(50 + cadre * 8 + Math.min(20, volunteer / 6) + (/考公|公务/.test(dest) ? 12 : 0))))
  const jobScore = Math.max(50, Math.min(96, Math.round(jobReady + awards * 2)))

  return [
    {
      id: 'postgraduate' as PlanId,
      label: '考研适配度',
      score: postScore,
      detail:
        `英语与专业课基础支撑升学；竞赛/科研 ${awards + research} 项` +
        `${awardShort ? `（含「${awardShort}」）` : ''}。` +
        (dest.includes('考研') ? '与学术型路径高度契合。' : '可作为备选升学路径持续补齐材料。'),
    },
    {
      id: 'public' as PlanId,
      label: '考公适配度',
      score: publicScore,
      detail:
        (cadre ? `学生干部经历 ${cadre} 项，` : '干部经历待补充，') +
        `志愿服务 ${volunteer || 0}+ 小时，组织与服务意识可迁移。` +
        (overallPct ? `综测 ${overallPct}。` : '') +
        '公共科目基础尚待评估。',
    },
    {
      id: 'job' as PlanId,
      label: '就业适配度',
      score: jobScore,
      detail:
        (awards
          ? `竞赛获奖 ${awards} 项${awardShort ? `，代表「${awardShort}」` : ''}，工程实践突出。`
          : '竞赛经历待积累，') +
        `岗位准备度 ${jobReady.toFixed(0)}%。与互联网/软件开发岗位匹配度较高。`,
    },
  ].sort((a, b) => b.score - a.score)
})

/** 三档规划均展开，占满下方空间且不折叠省略 */
const expandedPlanId = ref<PlanId | 'all'>('all')

watch(
  developmentPlans,
  () => {
    expandedPlanId.value = 'all'
  },
  { immediate: true },
)

function togglePlan(id: PlanId) {
  expandedPlanId.value = expandedPlanId.value === id ? 'all' : id
}

function isPlanOpen(id: PlanId) {
  return expandedPlanId.value === 'all' || expandedPlanId.value === id
}

const opportunities = computed(() => {
  const raw = props.portrait.opportunities?.length
    ? props.portrait.opportunities
    : props.portrait.pushes
        .filter((p) => p.type !== 'warn')
        .slice(0, CHANCE_VISIBLE)
        .map((p) => ({ time: p.time, text: p.text }))
  return raw.map((item) => ({
    ...item,
    text: item.text,
  }))
})

const visibleOpportunities = computed(() => opportunities.value.slice(0, CHANCE_VISIBLE))

type Tone = 'important' | 'normal' | 'good'
type CoachStatus = 'todo' | 'hold' | 'done'

const coachTasks = ref([
  { key: 'week', title: '本周优先', badge: '待办', detail: '', status: 'todo' as CoachStatus },
  { key: 'month', title: '本月重点', badge: '跟进', detail: '', status: 'todo' as CoachStatus },
])

/** 统一色标：红=重要 / 黄=一般 / 绿=好的 */
function toneOfPriority(priority: string, status?: CoachStatus): Tone {
  if (status === 'done') return 'good'
  if (status === 'hold') return 'normal'
  const p = priority || ''
  if (/高|待办|优先|重要|warn/i.test(p)) return 'important'
  if (/低|好|机会|完成|正向/.test(p)) return 'good'
  if (/中|跟进|一般|提醒/.test(p)) return 'normal'
  return 'important'
}

function toneLabel(tone: Tone) {
  return tone === 'important' ? '重要' : tone === 'good' ? '好的' : '一般'
}

function riskTone(item: { type?: string }): Tone {
  return item.type === 'warn' ? 'important' : 'normal'
}

const coachToneCounts = computed(() => {
  const counts = { important: 0, normal: 0, good: 0 }
  for (const t of coachTasks.value) {
    counts[toneOfPriority(t.badge, t.status)] += 1
  }
  return counts
})

const riskToneCounts = computed(() => {
  const counts = { important: 0, normal: 0, good: 0 }
  for (const item of visibleRiskItems.value) {
    counts[riskTone(item)] += 1
  }
  return counts
})

const chanceToneCounts = computed(() => ({
  important: 0,
  normal: 0,
  good: visibleOpportunities.value.length,
}))



watch(
  () => [props.assistant.shortTermSuggestions[0], props.assistant.longTermSuggestions[0], props.portrait.coachingTasks],
  () => {
    const tasks = props.portrait.coachingTasks
    coachTasks.value = [
      {
        key: 'week',
        title: tasks?.[0]?.title || '本周优先：开展毕业学分核查',
        badge: tasks?.[0]?.priority || '待办',
        detail: tasks?.[0]?.detail || props.assistant.shortTermSuggestions[0] || '建议辅导员与学生核对培养方案',
        status: 'todo',
      },
      {
        key: 'month',
        title: tasks?.[1]?.title || '本月重点：补充专业实践成果',
        badge: tasks?.[1]?.priority || '跟进',
        detail: tasks?.[1]?.detail || props.assistant.longTermSuggestions[0] || '建议参加1项竞赛或创新项目',
        status: 'todo',
      },
    ]
  },
  { immediate: true },
)

function setCoachStatus(key: string, status: CoachStatus) {
  const hit = coachTasks.value.find((t) => t.key === key)
  if (hit) hit.status = status
}

function stopAutoplay() {
  if (autoplayTimer) clearInterval(autoplayTimer)
  autoplayTimer = null
}

function startAutoplay() {
  stopAutoplay()
  autoplayTimer = setInterval(() => {
    activePage.value = activePage.value === 'judge' ? 'action' : 'judge'
  }, AUTOPLAY_INTERVAL)
}

function selectPage(id: PageId) {
  activePage.value = id
  startAutoplay()
}

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <StudentTplCard
    icon="innovation"
    title="智能育航"
    tip="两页切换：全景研判（含发展规划）/ 育人智策（含风险与机会）。"
    class="stu-tpl__ai"
  >
    <div class="navi" @mouseenter="stopAutoplay" @mouseleave="startAutoplay">
      <div class="navi__top">
        <div class="navi__dots" role="tablist" aria-label="切换全景研判 / 育人智策">
          <button
            v-for="p in pages"
            :key="p.id"
            type="button"
            class="navi__dot"
            :class="{ 'is-active': activePage === p.id }"
            :title="p.label"
            :aria-label="p.label"
            @click="selectPage(p.id)"
          ></button>
        </div>
        <button type="button" class="navi__detail-btn" @click="goAiPortrait">查看详情 ›</button>
      </div>

      <div class="navi__panel">
        <!-- 第1页：全景研判 + 发展规划 -->
        <div v-if="activePage === 'judge'" class="navi-page navi-page--judge">
          <h4 class="navi-page-title">
            <span>全景研判</span>
          </h4>
          <section class="navi-card navi-card--panorama">
            <div class="navi-card__summary-wrap">
              <StuHint tip="全景总体描述，兼顾优势与短板两端。" block>
                <p class="navi-card__summary">{{ summaryText }}</p>
              </StuHint>
            </div>
            <div class="navi-ends">
              <p><em>优势端</em><span>{{ dualEnds.good }}</span></p>
              <p><em>关注端</em><span>{{ dualEnds.weak }}</span></p>
            </div>
            <div class="navi-cloud" aria-label="优势与关注词云">
              <strong class="navi-cloud__title">云词条</strong>
              <div class="navi-cloud__stage">
                <span
                  v-for="(word, idx) in cloudWords"
                  :key="word.kind + '-' + word.text + '-' + idx"
                  class="navi-cloud__word"
                  :style="word.style"
                  :title="word.kind === 'good' ? '优势侧' : '关注侧'"
                >{{ word.text }}</span>
              </div>
            </div>
          </section>

          <section class="navi-card navi-card--plans">
            <h5 class="navi-sec-title">
              <span>发展规划</span>
            </h5>
            <div
              v-for="plan in developmentPlans"
              :key="plan.id"
              class="navi-plan"
              :class="{ 'is-open': isPlanOpen(plan.id) }"
            >
              <button type="button" class="navi-plan__head" @click="togglePlan(plan.id)">
                <span>{{ plan.label }}</span>
                <i><em :style="{ width: plan.score + '%' }"></em></i>
                <b>{{ plan.score }}%</b>
              </button>
              <p v-if="isPlanOpen(plan.id)" class="navi-plan__detail">{{ plan.detail }}</p>
            </div>
            <StuHint tip="打开完整发展规划与更多建议。" block>
              <button type="button" class="navi-more" @click="goGrowthPath">完整方案 ›</button>
            </StuHint>
          </section>
        </div>

        <!-- 第2页：育人智策 + 风险雷达 + 机会雷达 -->
        <div v-else class="navi-page navi-page--action">
          <h4 class="navi-page-title">
            <span>育人智策</span>
            <span class="navi-sec-badges">
              <i class="is-normal" :title="'一般 ' + coachToneCounts.normal">{{ coachToneCounts.normal }}</i>
              <i class="is-important" :title="'重要 ' + coachToneCounts.important">{{ coachToneCounts.important }}</i>
              <i class="is-good" :title="'好的 ' + coachToneCounts.good">{{ coachToneCounts.good }}</i>
            </span>
          </h4>

          <section class="navi-card">
            <article v-for="task in coachTasks" :key="task.key" class="navi-task" :class="`is-${task.status}`">
              <header>
                <strong>{{ task.title }}</strong>
                <span
                  class="navi-tone-tag"
                  :class="`is-${toneOfPriority(task.badge, task.status)}`"
                >
                  {{
                    task.status === 'done'
                      ? '已完成'
                      : task.status === 'hold'
                        ? '已暂缓'
                        : toneLabel(toneOfPriority(task.badge, task.status))
                  }}
                </span>
              </header>
              <p>{{ task.detail }}</p>
              <div class="navi-task__actions">
                <StuHint tip="标记为暂缓跟进（当前仅前端暂存，未写入教务库）。">
                  <button type="button" @click="setCoachStatus(task.key, 'hold')">暂缓</button>
                </StuHint>
                <StuHint tip="标记为已完成（当前仅前端暂存，未写入教务库）。">
                  <button type="button" class="is-ok" @click="setCoachStatus(task.key, 'done')">完成</button>
                </StuHint>
              </div>
            </article>
          </section>

          <section class="navi-card">
            <h5 class="navi-sec-title">
              <span>风险雷达</span>
              <span class="navi-sec-badges">
                <i class="is-normal" :title="'一般 ' + riskToneCounts.normal">{{ riskToneCounts.normal }}</i>
                <i class="is-important" :title="'重要 ' + riskToneCounts.important">{{ riskToneCounts.important }}</i>
              </span>
            </h5>
            <div v-if="!visibleRiskItems.length" class="navi-risk-zero">
              <strong>0</strong>
              <span>当前无明显风险事项</span>
            </div>
            <article v-for="(item, idx) in visibleRiskItems" :key="idx" class="navi-risk">
              <header>
                <strong>{{ item.time }}</strong>
                <StuHint :tip="riskTone(item) === 'important' ? '重要：建议尽快处理。' : '一般：需关注，可择机跟进。'">
                  <span class="navi-tone-tag" :class="`is-${riskTone(item)}`">
                    {{ toneLabel(riskTone(item)) }}
                  </span>
                </StuHint>
              </header>
              <p>{{ item.text }}</p>
            </article>
          </section>

          <section class="navi-card navi-card--chance">
            <h5 class="navi-sec-title">
              <span>机会雷达</span>
              <span class="navi-sec-badges">
                <i class="is-good" :title="'好的 ' + chanceToneCounts.good">{{ chanceToneCounts.good }}</i>
              </span>
            </h5>
            <div class="navi-timeline" role="list" aria-label="近期机会时间轴">
              <div class="navi-timeline__track" aria-hidden="true"></div>
              <div class="navi-timeline__nodes">
                <article
                  v-for="(item, idx) in visibleOpportunities"
                  :key="idx"
                  class="navi-timeline__node"
                  :class="{
                    'is-current': idx === 0,
                    'is-above': idx % 2 === 0,
                    'is-below': idx % 2 === 1,
                  }"
                  role="listitem"
                >
                  <div class="navi-timeline__slot navi-timeline__slot--top">
                    <StuHint v-if="idx % 2 === 0" block tip="近期可关注的竞赛、实习或活动机会。">
                      <div class="navi-timeline__body">
                        <p class="navi-timeline__text">{{ item.text }}</p>
                      </div>
                    </StuHint>
                  </div>
                  <div class="navi-timeline__axis" aria-hidden="true">
                    <span class="navi-timeline__dot"></span>
                  </div>
                  <time class="navi-timeline__time">{{ item.time }}</time>
                  <div class="navi-timeline__slot navi-timeline__slot--bottom">
                    <StuHint v-if="idx % 2 === 1" block tip="近期可关注的竞赛、实习或活动机会。">
                      <div class="navi-timeline__body">
                        <p class="navi-timeline__text">{{ item.text }}</p>
                      </div>
                    </StuHint>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
/* 统一字阶：正文加大，占满模块高度，禁止省略截断 */
.navi {
  --fs: 20px;
  --fs-sm: 18px;
  --fs-label: 17px;
  --fs-title: 22px;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 2px 6px 6px;
  font-size: var(--fs);
  line-height: 1.5;
  color: #d8eeff;
}

.navi__badges,
.navi-sec-badges {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  vertical-align: middle;
}

.navi__badges i,
.navi-tone-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  padding: 0 5px;
  border-radius: 4px;
  font-style: normal;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.35;

  &.is-important,
  &.is-red {
    background: transparent;
    color: #ff6b6b;
  }

  &.is-normal,
  &.is-yellow,
  &.is-risk {
    background: rgba(40, 50, 70, 0.95);
    color: #facc15;
  }

  &.is-good,
  &.is-green {
    background: transparent;
    color: #43e7af;
  }
}

/* 标题旁的角标数字：仅放大字号，颜色与斜体保持原样 */
.navi-sec-badges i {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  padding: 1px 8px;
  border-radius: 5px;
  font-style: normal;
  font-size: var(--fs-title);
  font-weight: 800;
  line-height: 1.25;

  &.is-important,
  &.is-red {
    background: transparent;
    color: #ff6b6b;
  }

  &.is-normal,
  &.is-yellow,
  &.is-risk {
    background: rgba(40, 50, 70, 0.95);
    color: #facc15;
  }

  &.is-good,
  &.is-green {
    background: transparent;
    color: #43e7af;
  }
}

.navi-tone-tag {
  padding: 1px 7px;
  font-size: 12px;
  letter-spacing: 0.04em;
}

.navi__panel {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.navi-card--panorama {
  height: 100%;
  min-height: 0;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  gap: 6px;
  align-content: start;
  overflow: hidden;
}

.navi-card__summary-wrap {
  min-height: 0;
  background: transparent;
  box-shadow: none;
  filter: none;

  :deep(.stu-hint--block) {
    display: block;
    max-width: none;
    background: transparent;
    box-shadow: none;
    filter: none;
  }
}

.navi-card__summary {
  margin: 0;
  padding: 0;
  color: #d8eeff;
  font-size: 19px;
  line-height: 1.58;
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  display: block;
  background: transparent;
  box-shadow: none;
  text-shadow: none;
  filter: none;
}

.navi-ends {
  display: grid;
  gap: 4px;
  background: transparent;
  box-shadow: none;
  filter: none;

  p {
    margin: 0;
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 8px;
    align-items: baseline;
    font-size: 18px;
  }

  em {
    font-style: normal;
    font-weight: 800;
    color: #8eb8d8;
  }

  span {
    color: #d8eeff;
    white-space: normal;
    word-break: break-word;
  }

  p:first-child em { color: #67e8a3; }
  p:last-child em { color: #facc15; }
}

.navi-cloud {
  position: relative;
  min-height: 0;
  padding: 4px 6px 6px;
  border: 1px solid rgba(100, 170, 220, 0.28);
  border-radius: 6px;
  background: linear-gradient(165deg, rgba(10, 42, 78, 0.92), rgba(4, 22, 48, 0.95));
  overflow: hidden;
}

.navi-cloud__title {
  position: absolute;
  top: 6px;
  left: 8px;
  z-index: 2;
  color: #9ec9e6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  pointer-events: none;
}

.navi-cloud__stage {
  position: relative;
  height: 168px;
  width: 100%;
  overflow: hidden;
}

.navi-cloud__word {
  position: absolute;
  z-index: 1;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  letter-spacing: 0.02em;
  text-shadow: none;
  filter: none;
  cursor: default;
  user-select: none;
  opacity: 1;

  &:hover {
    z-index: 3;
    filter: brightness(1.12);
  }
}

.navi-risk,
.navi-task {
  margin-bottom: 8px;
  padding: 10px 12px;
  border: 1px solid rgba(0, 180, 255, 0.14);
  border-radius: 6px;
  background: rgba(0, 40, 78, 0.35);

  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
    font-size: var(--fs);

    strong { color: #eaf6ff; }
    span:not(.navi-tone-tag) { color: #f0b27a; font-size: var(--fs-label); font-weight: 700; }
  }

  p {
    margin: 0;
    color: #cfe6f8;
    font-size: var(--fs);
    line-height: 1.5;
  }
}

.navi-risk-zero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 120px;
  border: 1px dashed rgba(85, 233, 149, 0.35);
  border-radius: 6px;
  background: rgba(20, 80, 60, 0.18);

  strong {
    color: #7ef0a8;
    font-size: 42px;
    line-height: 1;
    font-variant-numeric: tabular-nums;
  }

  span {
    color: #9ec9e6;
    font-size: var(--fs-sm);
    font-weight: 600;
  }
}

.navi-task__actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;

  :deep(.stu-hint) {
    display: inline-flex;
  }

  :deep(button),
  button {
    padding: 5px 12px;
    border: 1px solid rgba(120, 200, 255, 0.25);
    border-radius: 4px;
    background: rgba(0, 50, 90, 0.4);
    color: #9ec9e6;
    font-size: var(--fs-label);
    cursor: pointer;

    &.is-ok {
      border-color: rgba(55, 233, 145, 0.35);
      color: #67e8a3;
    }
  }
}

.navi-task.is-done { opacity: 0.72; border-color: rgba(55, 233, 145, 0.35); }
.navi-task.is-hold { opacity: 0.78; border-color: rgba(250, 204, 21, 0.3); }

.navi-card--chance {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.navi-timeline {
  position: relative;
  height: 100%;
  min-height: 0;
  padding: 0 2px 18px;
  overflow: hidden;
  /* 整体再上移，给下方卡片留出空间 */
  transform: translateY(-22px);
}

.navi-timeline__track {
  position: absolute;
  top: 42%;
  left: 10%;
  right: 10%;
  height: 2px;
  border-radius: 2px;
  transform: translateY(-50%);
  background: linear-gradient(
    90deg,
    rgba(30, 214, 255, 0.75) 0%,
    rgba(30, 214, 255, 0.35) 55%,
    rgba(30, 214, 255, 0.08) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.navi-timeline__nodes {
  position: relative;
  z-index: 1;
  height: 100%;
  min-height: 0;
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.navi-timeline__node {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1.25fr) 10px auto minmax(0, 0.75fr);
  align-items: stretch;

  :deep(.stu-hint--block) {
    width: 100%;
    min-width: 0;
    height: auto;
    display: flex;
  }
}

.navi-timeline__slot {
  min-height: 0;
  display: flex;

  &--top {
    grid-row: 1;
    align-items: flex-end;
    padding-bottom: 6px;
  }

  &--bottom {
    grid-row: 4;
    align-items: flex-start;
    padding-top: 6px;
  }
}

.navi-timeline__axis {
  grid-row: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 2;
}

.navi-timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(30, 214, 255, 0.45);
  background: rgba(0, 40, 80, 0.95);
  box-shadow: 0 0 0 2px rgba(0, 28, 58, 0.9);
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
}

.navi-timeline__node.is-current .navi-timeline__dot {
  border-color: #1ed6ff;
  background: #1ed6ff;
  box-shadow:
    0 0 0 2px rgba(0, 28, 58, 0.9),
    0 0 12px rgba(30, 214, 255, 0.55);
}

.navi-timeline__time {
  grid-row: 3;
  justify-self: center;
  margin-top: 4px;
  color: #7ff6ff;
  font-size: 18px;
  font-weight: 800;
  font-style: normal;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.navi-timeline__node.is-current .navi-timeline__time {
  color: #b8f4ff;
  text-shadow: 0 0 10px rgba(30, 214, 255, 0.35);
}

.navi-timeline__body {
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0;
  padding: 10px 12px;
  border: 1px solid rgba(30, 214, 255, 0.18);
  border-radius: 6px;
  background:
    linear-gradient(160deg, rgba(0, 90, 150, 0.22), transparent 62%),
    rgba(0, 40, 78, 0.42);
}

.navi-timeline__text {
  margin: 0;
  color: #d8eeff;
  font-size: 17px;
  line-height: 1.45;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  overflow: visible;
}

.navi-timeline__tag {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 3px;
  border: 1px solid rgba(0, 184, 255, 0.28);
  background: rgba(0, 184, 255, 0.12);
  color: #55dfff;
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.navi-timeline__node.is-current .navi-timeline__body {
  border-color: rgba(30, 214, 255, 0.42);
  background:
    linear-gradient(160deg, rgba(0, 120, 190, 0.32), transparent 65%),
    rgba(0, 52, 96, 0.52);
}

.navi-card--plans {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1 1 auto;
  min-height: 0;
  overflow: visible;
}

.navi-plan {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 10px 12px;
  border: 1px solid rgba(0, 180, 255, 0.16);
  border-radius: 6px;
  background: rgba(0, 40, 78, 0.35);

  &.is-open {
    border-color: rgba(0, 220, 255, 0.4);
  }
}

.navi-plan__head {
  width: 100%;
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr) 52px;
  gap: 10px;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #eaf6ff;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 18px;
    font-weight: 700;
    white-space: nowrap;
  }

  i {
    display: block;
    height: 10px;
    overflow: hidden;
    border-radius: 99px;
    background: rgba(80, 120, 160, 0.35);

    em {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1ed6ff, #43e7af);
    }
  }

  b {
    color: #7ff6ff;
    font-size: 18px;
    font-weight: 800;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.navi-plan__detail {
  margin: 10px 0 0;
  color: #d8eeff;
  font-size: 17px;
  line-height: 1.55;
  white-space: normal;
  word-break: break-word;
  overflow: visible;
  max-height: none;
}

.navi-more {
  margin-top: auto;
  width: 100%;
  padding: 9px;
  border: 1px solid rgba(120, 210, 255, 0.28);
  border-radius: 4px;
  background: rgba(0, 70, 120, 0.35);
  color: #8ee9ff;
  font-size: var(--fs-sm);
  font-weight: 700;
  cursor: pointer;
}

.navi__top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 22px;
}

.navi__dots {
  display: inline-flex;
  align-items: center;
  gap: 14px;
}

.navi__dot {
  width: 14px;
  height: 14px;
  padding: 0;
  border-radius: 50%;
  border: 2px solid rgba(120, 200, 255, 0.85);
  background: rgba(20, 78, 130, 0.85);
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(40, 120, 180, 0.95);
    border-color: #9fe9ff;
  }

  &.is-active {
    background: #7ff6ff;
    border-color: #7ff6ff;
    box-shadow: 0 0 12px rgba(30, 214, 255, 0.75);
    transform: scale(1.2);
  }
}

.navi__detail-btn {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  margin: 0;
  border: 0;
  background: transparent;
  color: #7ff6ff;
  font-size: 13px;
  cursor: pointer;
}

.navi-page-title {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  margin: 0;
  padding: 8px 14px;
  color: #d8eefc;
  font-size: var(--fs-title);
  font-weight: 800;
  letter-spacing: 0.08em;
  line-height: 1.2;
  border: 1px solid rgba(100, 180, 230, 0.42);
  border-radius: 4px;
  background:
    linear-gradient(90deg, rgba(0, 90, 150, 0.48), rgba(0, 45, 90, 0.32) 55%, rgba(0, 30, 65, 0.22)),
    rgba(0, 28, 58, 0.6);
  box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.12);
}

.development-card--ai {
  --card-accent: #7aa8ff;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
  padding: 10px 12px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--card-accent) 34%, transparent);
  clip-path: polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--card-accent) 10%, transparent), transparent 42%),
    linear-gradient(160deg, rgba(6, 40, 78, 0.88), rgba(0, 16, 38, 0.9));
}
.development-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.development-card__icon {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(120, 210, 255, 0.35);
  border-radius: 2px;
  background: linear-gradient(145deg, rgba(0, 120, 200, 0.28), rgba(0, 40, 80, 0.4));
}
.development-card__title-wrap {
  flex: 1;
  h4 { margin: 0; font-size: 18px; color: #e8f4ff; }
}
.development-card--ai .navi {
  min-height: 0;
}

.navi__tabs--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.navi-sec-title {
  box-sizing: border-box;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  margin: 0 0 8px;
  padding: 7px 12px;
  color: #d8eefc;
  font-size: var(--fs-sm);
  font-weight: 800;
  letter-spacing: 0.06em;
  line-height: 1.2;
  border: 1px solid rgba(100, 180, 230, 0.38);
  border-radius: 4px;
  font-size: var(--fs-title);
  background:
    linear-gradient(90deg, rgba(0, 90, 150, 0.42), rgba(0, 45, 90, 0.28) 55%, rgba(0, 30, 65, 0.18)),
    rgba(0, 28, 58, 0.55);
  box-shadow: inset 0 1px 0 rgba(160, 220, 255, 0.1);

  > span:first-child {
    min-width: 0;
  }

  .navi-sec-badges {
    margin-left: 0;
    flex-shrink: 0;
  }
}

.navi-page {
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-right: 2px;
  scrollbar-width: thin;
  scrollbar-color: rgba(90, 180, 240, 0.45) transparent;
}

.navi-page--judge {
  overflow: hidden;

  .navi-card--panorama {
    flex: 0 0 auto;
    height: auto;
    grid-template-rows: auto auto minmax(110px, 150px);
  }
  .navi-cloud__stage {
    height: 130px;
  }
  .navi-card--plans {
    flex: 1 1 auto;
    min-height: 0;
  }
}

</style>
