<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import { ROUTES } from '@/constants/routes'
import type {
  AiAssistantVM,
  AiPortraitVM,
  CareerDevVM,
  CompetitionVM,
  EmploymentVM,
  GrowthOverviewVM,
  HighlightItemVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'

const props = defineProps<{
  assistant: AiAssistantVM
  portrait: AiPortraitVM
  employment: EmploymentVM
  competition?: CompetitionVM
  highlights?: HighlightItemVM[]
  profile?: PersonalInfoVM
  careerDev?: CareerDevVM
  quality?: QualityVM
  growthOverview?: GrowthOverviewVM
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

type TabId = 'panorama' | 'risk' | 'coach' | 'chance' | 'path'

const tabs: Array<{ id: TabId; label: string; tip: string }> = [
  { id: 'panorama', label: '全景研判', tip: '总体描述 + 优势/关注两端词云。' },
  { id: 'risk', label: '风险雷达', tip: '需优先跟进的风险与预警事项。角标=本页展示条数（无风险显示 0）。' },
  { id: 'coach', label: '育人智策', tip: '辅导员本周/本月可执行的育人任务。角标=本页展示条数。' },
  { id: 'chance', label: '机会雷达', tip: '竞赛、实习、活动等近期可把握的机会。角标=本页展示条数。' },
  { id: 'path', label: '发展规划', tip: '考研 / 考公 / 就业适配度进度条，点击展开说明。' },
]

const activeTab = ref<TabId>('panorama')
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
  const firstAward = props.competition?.highlights?.find((h) => h.label && !h.label.includes('暂无'))?.label
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
        `英语与专业课基础支撑升学路径；竞赛/科研 ${awards + research} 项${firstAward ? `（含「${firstAward}」）` : ''}。` +
        (dest.includes('考研') ? '当前画像与学术型发展路径高度契合。' : '可作为备选升学路径持续补齐材料。'),
    },
    {
      id: 'public' as PlanId,
      label: '考公适配度',
      score: publicScore,
      detail:
        (cadre ? `学生干部任职经历 ${cadre} 项，` : '干部经历待补充，') +
        `志愿服务累计 ${volunteer || 0}+ 小时，组织协调与服务意识可迁移。` +
        (overallPct ? `综测 ${overallPct}。` : '') +
        '公共科目基础尚待评估。',
    },
    {
      id: 'job' as PlanId,
      label: '就业适配度',
      score: jobScore,
      detail:
        (awards ? `竞赛获奖 ${awards} 项${firstAward ? `，代表「${firstAward}」` : ''}，工程实践能力突出。` : '竞赛经历待积累，') +
        `岗位准备度 ${jobReady.toFixed(0)}。当前画像与互联网/软件开发岗位要求匹配度较高。`,
    },
  ].sort((a, b) => b.score - a.score)
})

const expandedPlanId = ref<PlanId | null>(null)

watch(
  developmentPlans,
  (plans) => {
    if (!expandedPlanId.value && plans[0]) expandedPlanId.value = plans[0].id
  },
  { immediate: true },
)

function togglePlan(id: PlanId) {
  expandedPlanId.value = expandedPlanId.value === id ? null : id
}

const opportunities = computed(() => {
  const raw = props.portrait.opportunities?.length
    ? props.portrait.opportunities
    : props.portrait.pushes
        .filter((p) => p.type !== 'warn')
        .slice(0, CHANCE_VISIBLE)
        .map((p) => ({ time: p.time, text: p.text, action: '参考资料' }))
  return raw.map((item) => ({
    ...item,
    text: item.text,
  }))
})

const visibleOpportunities = computed(() => opportunities.value.slice(0, CHANCE_VISIBLE))

const coachTasks = ref([
  { key: 'week', title: '本周优先', badge: '待办', detail: '', status: 'todo' as 'todo' | 'hold' | 'done' },
  { key: 'month', title: '本月重点', badge: '跟进', detail: '', status: 'todo' as 'todo' | 'hold' | 'done' },
])

/** 角标 = 面板实际展示条数（育人智策为本周+本月两条） */
const tabBadges = computed<Record<TabId, number | null>>(() => ({
  panorama: null,
  risk: visibleRiskItems.value.length,
  coach: coachTasks.value.length || null,
  chance: visibleOpportunities.value.length || null,
  path: null,
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

function setCoachStatus(key: string, status: 'hold' | 'done') {
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
    const idx = tabs.findIndex((t) => t.id === activeTab.value)
    activeTab.value = tabs[(idx + 1) % tabs.length].id
  }, AUTOPLAY_INTERVAL)
}

function selectTab(id: TabId) {
  activeTab.value = id
  startAutoplay()
}

watch(
  () => riskItems.value.length,
  (n) => {
    if (n > 0 && activeTab.value === 'panorama') activeTab.value = 'risk'
  },
  { immediate: true },
)

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
</script>

<template>
  <StudentTplCard
    icon="innovation"
    title="智能育航"
    tip="AI 综合学业与画像，给出研判、风险、机会与成长建议，用于精准育人。"
    class="stu-tpl__ai"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <template #header-extra>
      <button type="button" class="stu-tpl__detail-link" @click="goAiPortrait">
        查看详情 ›
      </button>
    </template>
    <div class="navi">
      <div class="navi__tabs" role="tablist" aria-label="智能育航功能">
        <StuHint v-for="tab in tabs" :key="tab.id" :tip="tab.tip">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === tab.id"
            :class="{ active: activeTab === tab.id }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
            <i
              v-if="tabBadges[tab.id] !== null && tabBadges[tab.id] !== undefined"
              :class="{ 'is-zero': tabBadges[tab.id] === 0 }"
              :title="'本页展示条数'"
            >{{ tabBadges[tab.id] }}</i>
          </button>
        </StuHint>
      </div>

      <div class="navi__panel">
        <!-- 全景研判：总体描述 + 两端 + 词云；不再展示岗位匹配 -->
        <section v-if="activeTab === 'panorama'" class="navi-card navi-card--panorama">
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
                :key="`${word.kind}-${word.text}-${idx}`"
                class="navi-cloud__word"
                :style="word.style"
                :title="word.kind === 'good' ? '优势侧' : '关注侧'"
              >{{ word.text }}</span>
            </div>
          </div>
        </section>

        <!-- 风险雷达 -->
        <section v-else-if="activeTab === 'risk'" class="navi-card">
          <div class="navi-risk-zero" v-if="!visibleRiskItems.length">
            <strong>0</strong>
            <span>当前无明显风险事项</span>
          </div>
          <article v-for="(item, idx) in visibleRiskItems" :key="idx" class="navi-risk">
            <header>
              <strong>{{ item.time }}</strong>
              <StuHint :tip="item.type === 'warn' ? '优先：建议尽快处理。' : '提醒：需关注，可择机跟进。'">
                <span>{{ item.type === 'warn' ? '优先' : '提醒' }}</span>
              </StuHint>
            </header>
            <p>{{ item.text }}</p>
          </article>
        </section>

        <!-- 育人智策 -->
        <section v-else-if="activeTab === 'coach'" class="navi-card">
          <article v-for="task in coachTasks" :key="task.key" class="navi-task" :class="`is-${task.status}`">
            <header><strong>{{ task.title }}</strong><span>{{ task.status === 'done' ? '已完成' : task.status === 'hold' ? '已暂缓' : task.badge }}</span></header>
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

        <!-- 机会雷达 -->
        <section v-else-if="activeTab === 'chance'" class="navi-card navi-card--chance">
          <div class="navi-timeline" role="list" aria-label="近期机会时间轴">
            <div class="navi-timeline__track" aria-hidden="true" />
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
                  <StuHint
                    v-if="idx % 2 === 0"
                    block
                    tip="近期可关注的竞赛、实习或活动机会。"
                  >
                    <div class="navi-timeline__body">
                      <p class="navi-timeline__text">{{ item.text }}</p>
                      <span v-if="item.action" class="navi-timeline__tag">{{ item.action }}</span>
                    </div>
                  </StuHint>
                </div>

                <div class="navi-timeline__axis" aria-hidden="true">
                  <span class="navi-timeline__dot" />
                </div>
                <time class="navi-timeline__time">{{ item.time }}</time>

                <div class="navi-timeline__slot navi-timeline__slot--bottom">
                  <StuHint
                    v-if="idx % 2 === 1"
                    block
                    tip="近期可关注的竞赛、实习或活动机会。"
                  >
                    <div class="navi-timeline__body">
                      <p class="navi-timeline__text">{{ item.text }}</p>
                      <span v-if="item.action" class="navi-timeline__tag">{{ item.action }}</span>
                    </div>
                  </StuHint>
                </div>
              </article>
            </div>
          </div>
        </section>

        <!-- 发展规划：考研/考公/就业三进度条，文字可折叠 -->
        <section v-else class="navi-card navi-card--plans">
          <div
            v-for="plan in developmentPlans"
            :key="plan.id"
            class="navi-plan"
            :class="{ 'is-open': expandedPlanId === plan.id }"
          >
            <button type="button" class="navi-plan__head" @click="togglePlan(plan.id)">
              <span>{{ plan.label }}</span>
              <i><em :style="{ width: `${plan.score}%` }" /></i>
              <b>{{ plan.score }}%</b>
            </button>
            <p v-if="expandedPlanId === plan.id" class="navi-plan__detail">{{ plan.detail }}</p>
          </div>
          <StuHint tip="打开完整发展规划与更多建议。" block>
            <button type="button" class="navi-more" @click="goGrowthPath">完整方案 ›</button>
          </StuHint>
        </section>
      </div>
    </div>
  </StudentTplCard>
</template>

<style scoped lang="scss">
/* 统一字阶：正文 19 / 辅文 17 / 标签 16；摘要 18 且不滚动不省略 */
.navi {
  --fs: 19px;
  --fs-sm: 17px;
  --fs-label: 16px;
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

.navi__tabs {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  overflow: visible;

  :deep(.stu-hint) {
    min-width: 0;
    display: block;
  }

  button {
    width: 100%;
    min-height: 38px;
    padding: 7px 9px;
    border: 1px solid rgba(120, 200, 255, 0.22);
    border-radius: 4px;
    background: rgba(0, 40, 80, 0.35);
    color: #9ec9e6;
    font-size: var(--fs-sm);
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;

    &.active {
      border-color: rgba(0, 220, 255, 0.55);
      background: rgba(0, 90, 150, 0.45);
      color: #e8f7ff;
    }

    i {
      margin-left: 4px;
      padding: 0 5px;
      border-radius: 8px;
      background: rgba(255, 120, 80, 0.25);
      color: #ffb4a0;
      font-style: normal;
      font-size: var(--fs-label);

      &.is-zero {
        background: rgba(85, 233, 149, 0.2);
        color: #7ef0a8;
      }
    }
  }
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

  :deep(.stu-hint--block) {
    display: block;
    max-width: none;
  }
}

.navi-card__summary {
  margin: 0;
  color: #d8eeff;
  font-size: 15px;
  line-height: 1.45;
  white-space: normal;
  word-break: break-word;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.navi-ends {
  display: grid;
  gap: 4px;

  p {
    margin: 0;
    display: grid;
    grid-template-columns: 52px minmax(0, 1fr);
    gap: 6px;
    align-items: baseline;
    font-size: 14px;
  }

  em {
    font-style: normal;
    font-weight: 800;
    color: #8eb8d8;
  }

  span {
    color: #d8eeff;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    span { color: #f0b27a; font-size: var(--fs-label); font-weight: 700; }
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
  padding: 4px 2px;
  overflow: hidden;
}

.navi-timeline__track {
  position: absolute;
  top: 50%;
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
  grid-template-rows: minmax(0, 1fr) 12px auto minmax(0, 1fr);
  align-items: stretch;

  :deep(.stu-hint--block) {
    width: 100%;
    min-width: 0;
    height: 100%;
    display: flex;
  }
}

.navi-timeline__slot {
  min-height: 0;
  display: flex;

  &--top {
    grid-row: 1;
    align-items: flex-end;
    padding-bottom: 8px;
  }

  &--bottom {
    grid-row: 4;
    align-items: flex-start;
    padding-top: 8px;
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
  gap: 6px;
  padding: 8px;
  border: 1px solid rgba(30, 214, 255, 0.18);
  border-radius: 6px;
  background:
    linear-gradient(160deg, rgba(0, 90, 150, 0.22), transparent 62%),
    rgba(0, 40, 78, 0.42);
}

.navi-timeline__text {
  margin: 0;
  flex: 1;
  min-height: 0;
  color: #d8eeff;
  font-size: 16px;
  line-height: 1.48;
  text-align: left;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
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
  gap: 8px;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.navi-plan {
  flex: 0 0 auto;
  padding: 8px 10px;
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
  grid-template-columns: 88px minmax(0, 1fr) 44px;
  gap: 8px;
  align-items: center;
  padding: 0;
  border: none;
  background: transparent;
  color: #eaf6ff;
  cursor: pointer;
  text-align: left;

  span {
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
  }

  i {
    display: block;
    height: 8px;
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
    font-size: 15px;
    font-weight: 800;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.navi-plan__detail {
  margin: 8px 0 0;
  color: #cfe6f8;
  font-size: 14px;
  line-height: 1.45;
  max-height: 72px;
  overflow: auto;
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

.stu-tpl__detail-link {
  padding: 4px 12px;
  border: 1px solid rgba(0, 200, 255, 0.35);
  border-radius: 14px;
  background: rgba(0, 100, 180, 0.22);
  color: #55dfff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s, box-shadow 0.2s;

  &:hover {
    background: rgba(0, 130, 220, 0.32);
    box-shadow: 0 0 10px rgba(0, 200, 255, 0.25);
  }
}
</style>
