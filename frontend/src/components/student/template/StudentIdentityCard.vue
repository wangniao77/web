<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import StudentPeerRosterModal from './StudentPeerRosterModal.vue'
import { listClassPeers, type StudentPeerItem } from '@/services/student/peers'
import type {
  AcademicDevVM,
  AttentionItemVM,
  CareerDevVM,
  HighlightItemVM,
  PersonalInfoVM,
} from '@/types/student/view'

const props = defineProps<{
  profile: PersonalInfoVM
  attention: AttentionItemVM[]
  careerDev: CareerDevVM
  academic?: AcademicDevVM
  highlights?: HighlightItemVM[]
  /** 班干部职务：班长 / 团支书 等，有则显示在姓名旁（取代原「在校」） */
  cadreRoles?: string[]
}>()

defineEmits<{ open: [id: string] }>()
const router = useRouter()
const avatarError = ref(false)

const peerOpen = ref(false)
const peerKind = ref<'class' | 'dorm' | null>(null)
const peerTitle = ref('')
const peerSubtitle = ref('')
const peers = ref<StudentPeerItem[]>([])
const peerLoading = ref(false)

type RiskLevel = 'low' | 'medium' | 'high'

const riskWeight: Record<RiskLevel, number> = { low: 1, medium: 2, high: 3 }
const riskText: Record<RiskLevel, string> = { low: '正常', medium: '需关注', high: '高危' }

function highestLevel(pattern: RegExp): RiskLevel {
  return props.attention
    .filter((item) => pattern.test(`${item.category}${item.label}`))
    .reduce<RiskLevel>((highest, item) => (
      riskWeight[item.level] > riskWeight[highest] ? item.level : highest
    ), 'low')
}

function detailFor(pattern: RegExp, fallback: string) {
  const hit = props.attention.find((item) => pattern.test(`${item.category}${item.label}`))
  return hit?.label || fallback
}

const warningCards = computed(() => {
  const psychological = props.profile.mentalLevelCode ?? highestLevel(/心理|健康|体测/)
  const academic = highestLevel(/学业|课程|挂科|GPA|补考/)
  const employment = highestLevel(/就业|实习|职业/)

  return [
    {
      label: '心理预警',
      short: '心理',
      level: psychological,
      conclusion: props.profile.mentalLevel || riskText[psychological],
      tip: `心理关注侧风险（绿=正常，黄=需关注，红=高危）。点击进入二级台账。${detailFor(/心理|健康|体测/, '')}`,
    },
    {
      label: '学业预警',
      short: '学业',
      level: academic,
      conclusion: riskText[academic],
      tip: `挂科、GPA 等学业风险（绿=正常，黄=需关注，红=高危）。点击进入二级台账。${detailFor(/学业|课程|挂科|GPA|补考/, academic === 'low' ? '无挂科' : '')}`,
    },
    {
      label: '就业预警',
      short: '就业',
      level: employment,
      conclusion: riskText[employment],
      tip: `实习就业准备风险（绿=正常，黄=需关注，红=高危）。点击进入二级台账。${detailFor(/就业|实习|职业/, employment === 'low' ? '暂无高危' : '')}`,
    },
  ]
})

const avatarRisk = computed<RiskLevel>(() =>
  warningCards.value.reduce<RiskLevel>(
    (highest, item) => (riskWeight[item.level] > riskWeight[highest] ? item.level : highest),
    'low',
  ),
)

/** 姓名旁职务：班长 / 团支书等，有则展示 */
const cadreTitles = computed(() => {
  const roles = (props.cadreRoles ?? []).map((r) => r.trim()).filter(Boolean)
  if (roles.length) return roles.slice(0, 2)
  const one = props.profile.classCadreRole?.trim()
  return one ? [one] : []
})

const highPotentialTags = computed(() => {
  const fromProfile = props.profile.highPotentialTags?.filter(Boolean) ?? []
  if (fromProfile.length) return fromProfile
  return props.attention
    .map((item) => item.label)
    .filter((label) => /高潜/.test(label))
})

/** 干部 + 高潜：并排展示在姓名旁 */
const hasCadreOrPotential = computed(
  () => cadreTitles.value.length > 0 || highPotentialTags.value.length > 0,
)

const classLine = computed(() => props.profile.className?.trim() || '—')

const dormitoryLine = computed(() => {
  const dorm = props.profile.dormitory?.trim()
  return dorm && dorm !== '—' ? dorm : '—'
})

const dutyLine = computed(() => {
  if (cadreTitles.value.length) return cadreTitles.value.join('、')
  return '无'
})

const growthTrendText = computed(() => ({
  positive: '正向上升',
  negative: '负向波动',
  stable: '总体平稳',
}[props.profile.growthTrend ?? 'stable']))

/** 学籍与帮扶：心理风险放在右侧「核心态势」 */
const managementItems = computed(() => [
  {
    label: '学籍状态',
    value: props.profile.onCampusStatus || '在校',
    tone: 'safe' as const,
    tip: '当前在校学籍状态（在校/休学等）。',
  },
  {
    label: '困难认定',
    value: props.profile.economicHardship ? '已认定' : '未认定',
    tone: (props.profile.economicHardship ? 'warn' : 'safe') as 'warn' | 'safe',
    tip: '家庭经济困难认定结果，影响资助与帮扶策略。',
  },
  {
    label: '成长趋势',
    value: growthTrendText.value,
    tone: (props.profile.growthTrend === 'negative' ? 'risk' : 'safe') as 'risk' | 'safe',
    tip: '综合成长趋势判断。',
  },
  {
    label: '征兵状态',
    value: props.careerDev.militaryNote || '无',
    tone: 'info' as const,
    tip: '应征入伍或征兵备案相关状态。',
  },
])

const counselorPhone = computed(() => props.profile.counselorPhone?.trim() || '—')
const studentPhone = computed(() => props.profile.phone?.trim() || '—')

const classClickable = computed(() => {
  const name = props.profile.className?.trim()
  return Boolean(name && name !== '—')
})

/** 近期动态：滚动展示最近一条核心信息 */
const recentDynamics = computed(() => props.profile.recentDynamics ?? [])
const dynamicIndex = ref(0)

const currentDynamic = computed(() => {
  const list = recentDynamics.value
  if (!list.length) return null
  return list[dynamicIndex.value % list.length]!
})

const currentDynamicText = computed(() => {
  const item = currentDynamic.value
  if (!item) return ''
  return `${item.time} · ${item.text}`
})

const tickerTrackRef = ref<HTMLElement | null>(null)
const tickerTextRef = ref<HTMLElement | null>(null)
const tickerMetrics = ref({ track: 0, text: 0 })
let tickerResizeObserver: ResizeObserver | null = null
let staticSwitchTimer: ReturnType<typeof setTimeout> | null = null

const hasMultipleDynamics = computed(() => recentDynamics.value.length > 1)

const dynamicNeedsScroll = computed(() => (
  tickerMetrics.value.text > tickerMetrics.value.track + 2
))

const scrollDurationSec = computed(() => {
  if (!dynamicNeedsScroll.value) return 0
  const { track, text } = tickerMetrics.value
  return Math.max(10, Math.min(32, (track + text) / 32))
})

const marqueeScrollStyle = computed(() => {
  if (!dynamicNeedsScroll.value) return undefined
  const { track, text } = tickerMetrics.value
  return {
    '--marquee-from': `${track}px`,
    '--marquee-to': `${-text}px`,
    '--ticker-duration': `${scrollDurationSec.value}s`,
  } as Record<string, string>
})

function measureTextWidth(el: HTMLElement) {
  const style = window.getComputedStyle(el)
  const clone = el.cloneNode(true) as HTMLElement
  clone.style.cssText = [
    'position:absolute',
    'visibility:hidden',
    'white-space:nowrap',
    'width:auto',
    'max-width:none',
    'pointer-events:none',
    `font:${style.font}`,
    `letter-spacing:${style.letterSpacing}`,
  ].join(';')
  document.body.appendChild(clone)
  const width = Math.ceil(clone.getBoundingClientRect().width)
  document.body.removeChild(clone)
  return width || el.scrollWidth
}

function updateTickerMetrics() {
  const track = tickerTrackRef.value
  const text = tickerTextRef.value
  if (!track || !text) {
    tickerMetrics.value = { track: 0, text: 0 }
    return
  }
  tickerMetrics.value = {
    track: track.clientWidth,
    text: measureTextWidth(text),
  }
}

function setupTickerObserver() {
  tickerResizeObserver?.disconnect()
  if (typeof ResizeObserver === 'undefined') return
  tickerResizeObserver = new ResizeObserver(() => {
    updateTickerMetrics()
    scheduleStaticSwitch()
  })
  if (tickerTrackRef.value) tickerResizeObserver.observe(tickerTrackRef.value)
  if (tickerTextRef.value) tickerResizeObserver.observe(tickerTextRef.value)
}

async function refreshTickerLayout() {
  await nextTick()
  updateTickerMetrics()
  setupTickerObserver()
  scheduleStaticSwitch()
}

function stopStaticSwitch() {
  if (staticSwitchTimer) {
    clearTimeout(staticSwitchTimer)
    staticSwitchTimer = null
  }
}

function advanceDynamic() {
  if (recentDynamics.value.length <= 1) return
  dynamicIndex.value = (dynamicIndex.value + 1) % recentDynamics.value.length
}

function scheduleStaticSwitch() {
  stopStaticSwitch()
  if (!hasMultipleDynamics.value || dynamicNeedsScroll.value) return
  staticSwitchTimer = setTimeout(() => {
    advanceDynamic()
  }, 3600)
}

function onMarqueeAnimationEnd(event: AnimationEvent) {
  if (event.animationName !== 'sid-ticker-marquee') return
  if (!hasMultipleDynamics.value) return
  advanceDynamic()
}

function stopDynamicTicker() {
  stopStaticSwitch()
}

function startDynamicTicker() {
  stopDynamicTicker()
  scheduleStaticSwitch()
}

watch(recentDynamics, () => {
  dynamicIndex.value = 0
  startDynamicTicker()
  void refreshTickerLayout()
})

watch([dynamicIndex, currentDynamicText], () => {
  void refreshTickerLayout()
})

onMounted(() => {
  dynamicIndex.value = 0
  startDynamicTicker()
  void refreshTickerLayout()
})

onBeforeUnmount(() => {
  stopDynamicTicker()
  tickerResizeObserver?.disconnect()
  tickerResizeObserver = null
})

async function openClassPeers() {
  if (!classClickable.value) return
  peerKind.value = 'class'
  peerTitle.value = props.profile.className
  peerSubtitle.value = `${props.profile.grade || ''} · ${props.profile.major || ''}`.trim()
  peerOpen.value = true
  peerLoading.value = true
  peers.value = []
  try {
    peers.value = await listClassPeers(props.profile.className, props.profile.studentId)
  } finally {
    peerLoading.value = false
  }
}

function closePeers() {
  peerOpen.value = false
}

function selectPeer(studentId: string) {
  if (!studentId || studentId === props.profile.studentId) return
  peerOpen.value = false
  router.push({ path: '/student', query: { studentId } })
}

function goSemesterSchedule() {
  router.push({ name: 'student-semester-schedule', query: { studentId: props.profile.studentId } })
}

function goBasicLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: props.profile.studentId } })
}

function goWarningDetail(label: string) {
  const map: Record<string, string> = {
    心理预警: 'student-psy-warning',
    学业预警: 'student-academic-warning',
    就业预警: 'student-employment-warning',
  }
  const name = map[label]
  if (name) {
    router.push({ name, query: { studentId: props.profile.studentId } })
  }
}
</script>

<template>
  <StudentTplCard
    icon="students"
    title="学生基础信息台账"
    tip="精简身份卡：学籍识别 + 三类预警入口；政治面貌、宿舍、班主任、毕设导师等详见二级台账。"
    class="stu-tpl__identity"
  >
    <div class="sid">
      <div class="sid__body">
        <div class="sid__main">
          <div class="sid__profile">
            <div class="sid__profile-top">
              <StuHint tip="照片边框颜色取三类预警中的最高等级：绿正常、黄需关注、红高危。" block class="sid__avatar-hint">
                <div class="sid__avatar" :class="`sid__avatar--${avatarRisk}`">
                  <img
                    v-if="profile.avatarUrl && !avatarError"
                    :src="profile.avatarUrl"
                    :alt="profile.name"
                    @error="avatarError = true"
                  >
                  <span v-else>{{ profile.name.slice(0, 1) }}</span>
                </div>
              </StuHint>

              <div class="sid__identity">
                <div class="sid__name">
                  <div class="sid__name-row">
                    <strong>{{ profile.name }}</strong>
                    <em>{{ profile.gender || '男' }}</em>
                    <div v-if="hasCadreOrPotential" class="sid__tags" aria-label="干部与高潜">
                      <StuHint
                        v-for="role in cadreTitles"
                        :key="`cadre-${role}`"
                        tip="班级干部职务（班长/团支书等），来自学工台账。"
                      >
                        <span class="sid__tag sid__tag--cadre">
                          <i>干部</i>{{ role }}
                        </span>
                      </StuHint>
                      <StuHint
                        v-for="tag in highPotentialTags"
                        :key="tag"
                        tip="综合表现突出，建议重点培养与跟踪。"
                      >
                        <span class="sid__tag sid__tag--potential">
                          <i>高潜</i>{{ tag.replace(/高潜$/, '') || tag }}
                        </span>
                      </StuHint>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <dl class="sid__grid">
              <StuHint tip="学生唯一学籍编号，用于查档与跨系统对表。" block>
                <div><dt>学号</dt><dd :title="profile.studentId">{{ profile.studentId }}</dd></div>
              </StuHint>
              <StuHint tip="行政班级；可点击班级查看同班同学。" block>
                <div>
                  <dt>班级</dt>
                  <dd>
                    <button
                      v-if="classClickable"
                      type="button"
                      class="sid__link"
                      :title="`查看同班同学 · ${profile.className}`"
                      @click="openClassPeers"
                    >{{ classLine }}</button>
                    <span v-else :title="classLine">{{ classLine }}</span>
                  </dd>
                </div>
              </StuHint>
              <StuHint tip="宿舍楼栋与房间号，来自学工/宿管台账。" block>
                <div>
                  <dt>宿舍</dt>
                  <dd :title="dormitoryLine">{{ dormitoryLine }}</dd>
                </div>
              </StuHint>
              <StuHint tip="班级干部职务（班长/团支书等）；无职务时显示「无」。" block>
                <div>
                  <dt>职务</dt>
                  <dd :title="dutyLine">{{ dutyLine }}</dd>
                </div>
              </StuHint>
              <StuHint tip="学生本人联系电话，来自学籍档案。" block>
                <div>
                  <dt>联系电话</dt>
                  <dd :title="studentPhone">{{ studentPhone }}</dd>
                </div>
              </StuHint>
              <StuHint tip="辅导员姓名及联系电话（电话为学工台账模拟数据，接入后自动替换）。班主任/毕设导师见二级。" block>
                <div>
                  <dt>辅导员</dt>
                  <dd :title="`${profile.counselor || '—'} ${counselorPhone}`">
                    <span class="sid__counselor-line">
                      <b>{{ profile.counselor?.trim() || '—' }}</b>
                      <span class="sid__counselor-sep" aria-hidden="true">—</span>
                      <i>{{ counselorPhone }}</i>
                    </span>
                  </dd>
                </div>
              </StuHint>
            </dl>
          </div>
        </div>

        <div class="sid__side">
          <section class="sid__panel sid__panel--core" aria-label="核心态势">
            <div class="sid__panel-head">
              <StuHint tip="三类核心预警总览：心理 / 学业 / 就业。点击进入对应二级台账。">
                <strong>核心态势</strong>
              </StuHint>
            </div>
            <div class="sid__core-grid">
              <StuHint
                v-for="item in warningCards"
                :key="item.label"
                :tip="item.tip"
              >
                <button
                  type="button"
                  class="sid__core-card"
                  :class="`sid__core-card--${item.level}`"
                  @click="goWarningDetail(item.label)"
                >
                  <span>{{ item.short }}</span>
                  <strong>{{ item.conclusion }}</strong>
                </button>
              </StuHint>
            </div>
          </section>

          <section class="sid__panel sid__panel--aid" aria-label="学籍与帮扶">
            <div class="sid__panel-head">
              <StuHint tip="学工侧关键状态总览；心理风险见上方核心态势。">
                <strong>学籍与帮扶</strong>
              </StuHint>
            </div>
            <div class="sid__aid-grid">
              <StuHint
                v-for="item in managementItems"
                :key="item.label"
                block
                :tip="item.tip"
              >
                <article
                  class="sid__aid-item"
                  :class="`sid__aid-item--${item.tone}`"
                >
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                </article>
              </StuHint>
            </div>
          </section>
        </div>
      </div>

      <StuHint tip="近期伴随式动态（获奖/预警/伴学等），轮播最近一条核心信息。" block>
        <div class="sid__ticker" :class="{ 'sid__ticker--empty': !currentDynamic }" aria-live="polite">
          <span class="sid__ticker-label">近期动态</span>
          <div ref="tickerTrackRef" class="sid__ticker-track">
            <div
              v-if="currentDynamic"
              :key="`${dynamicIndex}-${currentDynamicText}`"
              class="sid__ticker-marquee"
              :class="[
                `sid__ticker-marquee--${currentDynamic.kind}`,
                dynamicNeedsScroll && (hasMultipleDynamics ? 'sid__ticker-marquee--scroll-once' : 'sid__ticker-marquee--scroll'),
              ]"
              :style="marqueeScrollStyle"
              @animationend="onMarqueeAnimationEnd"
            >
              <span ref="tickerTextRef" class="sid__ticker-text">{{ currentDynamicText }}</span>
            </div>
            <span v-else class="sid__ticker-empty">暂无记录</span>
          </div>
        </div>
      </StuHint>

      <div class="sid__utility-row">
        <div class="sid__archive-actions">
          <StuHint tip="打开本学期课表详情。">
            <button type="button" @click="goSemesterSchedule">本学期课表 ›</button>
          </StuHint>
          <StuHint tip="打开完整学籍、政治面貌、宿舍、班主任、毕设导师与帮扶明细。">
            <button type="button" class="sid__archive-btn" @click="goBasicLedger">基础信息台账 ›</button>
          </StuHint>
        </div>
      </div>
    </div>

    <StudentPeerRosterModal
      :open="peerOpen"
      :kind="peerKind"
      :title="peerTitle"
      :subtitle="peerSubtitle"
      :peers="peers"
      :loading="peerLoading"
      @close="closePeers"
      @select="selectPeer"
    />
  </StudentTplCard>
</template>

<style scoped lang="scss">
.sid {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.sid__body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 1.05fr);
  gap: 8px;
  overflow: visible;
}

.sid__main {
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.sid__profile {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: visible;
}

.sid__profile-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;

  :deep(.sid__avatar-hint) {
    flex: 0 0 120px;
    align-self: start;
  }
}

.sid__avatar {
  flex: 0 0 120px;
  width: 120px;
  height: 120px;
  padding: 3px;
  border-radius: 50%;
  transition: background 0.25s ease;

  &--low {
    background: conic-gradient(from 210deg, #7cf4ff, #2a7fd4 35%, #4ade80 70%, #7cf4ff);
    box-shadow: none;
  }

  &--medium {
    background: conic-gradient(from 210deg, #fde68a, #f59e0b 40%, #facc15 75%, #fde68a);
    box-shadow: none;
  }

  &--high {
    background: conic-gradient(from 210deg, #fda4af, #ef4444 40%, #f87171 75%, #fda4af);
    box-shadow: none;
  }

  img,
  span {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    object-fit: cover;
    border-radius: 50%;
    border: 3px solid #031528;
    background: linear-gradient(160deg, #0c2d52, #071a34);
    color: #7ff6ff;
    font-size: 36px;
    font-weight: 800;
  }
}

.sid__identity {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
  padding-top: 4px;
}

.sid__name {
  position: relative;
  z-index: 3;
  overflow: visible;
}

.sid__name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 8px;

  strong {
    flex: 0 0 auto;
    font-size: 28px;
    line-height: 1;
    color: #8ed8ff;
    letter-spacing: 0.08em;
    text-shadow: none;
  }

  em {
    flex: 0 0 auto;
    padding: 4px 9px;
    border: 1px solid rgba(120, 210, 255, 0.45);
    border-radius: 2px;
    background: linear-gradient(135deg, rgba(0, 90, 160, 0.35), rgba(0, 40, 80, 0.4));
    color: #9ed8f5;
    font-size: 15px;
    font-style: normal;
    font-weight: 800;
    line-height: 1.25;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
}

.sid__tags {
  flex: 1 1 auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: visible;

  :deep(.stu-hint) {
    flex: 0 0 auto;
    display: inline-flex;
    max-width: none;
  }
}

.sid__tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
  padding: 4px 9px;
  border: 1px solid;
  border-radius: 2px;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.02em;
  white-space: nowrap;
  line-height: 1.25;

  i {
    font-style: normal;
    font-size: 15px;
    font-weight: 800;
    opacity: 0.9;
    letter-spacing: 0.02em;
  }

  &--cadre {
    border-color: rgba(232, 200, 120, 0.55);
    background: linear-gradient(135deg, rgba(150, 110, 30, 0.42), rgba(80, 55, 10, 0.4));
    color: #f5d78a;
    box-shadow: none;

    i { color: #ffe6a8; }
  }

  &--potential {
    border-color: rgba(100, 220, 255, 0.75);
    background: linear-gradient(135deg, rgba(0, 150, 220, 0.55), rgba(0, 80, 150, 0.5));
    color: #b8fbff;
    box-shadow: 0 0 14px rgba(80, 220, 255, 0.5);
    animation: sid-breath-potential 1.8s ease-in-out infinite;

    i { color: #e8feff; }
  }
}

.sid__grid {
  margin: 0;
  width: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;

  :deep(.stu-hint--block),
  div {
    min-width: 0;
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    align-items: center;
    font-size: 16px;
    line-height: 1.35;
  }

  :deep(.stu-hint--block > div) {
    display: contents;
  }

  dt {
    color: #7ec8f0;
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
  }

  dd {
    margin: 0;
    min-width: 0;
    color: #8ed8ff;
    font-size: 17px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.sid__counselor-line {
  display: inline-flex;
  flex-wrap: nowrap;
  align-items: baseline;
  gap: 6px 8px;
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;

  b {
    color: #8ed8ff;
    font-weight: 700;
    white-space: nowrap;
  }

  .sid__counselor-sep {
    color: #6eb4dc;
    font-weight: 600;
    flex: 0 0 auto;
  }

  i {
    color: #9ed8f5;
    font-style: normal;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    font-size: 17px;
    white-space: nowrap;
  }
}

.sid__link {
  display: inline;
  max-width: 100%;
  padding: 0;
  border: none;
  border-bottom: 1px dashed rgba(142, 216, 255, 0.45);
  background: transparent;
  color: #8ed8ff;
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #b8ecff;
    border-bottom-color: rgba(184, 236, 255, 0.75);
  }
}

.sid__side {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: visible;
}

.sid__panel {
  flex: 0 0 auto;
  min-width: 0;
  padding: 6px 8px;
  border: 1px solid rgba(120, 200, 255, 0.2);
  border-radius: 3px;
  background:
    linear-gradient(135deg, rgba(0, 80, 140, 0.2), transparent 55%),
    rgba(0, 28, 58, 0.42);
  box-shadow: none;
  filter: none;
  overflow: visible;

  &--core {
    overflow: visible;
  }

  &--aid {
    flex: 1 1 auto;
    min-height: 0;
  }
}

.sid__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;

  strong {
    color: #a8e8ff;
    font-size: 17px;
    font-weight: 700;
  }
}

.sid__core-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  overflow: visible;
  padding: 2px;

  :deep(.stu-hint) {
    min-width: 0;
    display: block;
    overflow: visible;
  }
}

.sid__core-card {
  width: 100%;
  min-height: 58px;
  padding: 6px 4px;
  border: 1px solid rgba(85, 233, 149, 0.35);
  border-radius: 4px;
  background: rgba(20, 80, 60, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  cursor: pointer;
  font: inherit;
  box-shadow: none;
  filter: none;
  text-shadow: none;

  span {
    color: #9ed8f5;
    font-size: 15px;
    font-weight: 700;
  }

  strong {
    color: #7ef0a8;
    font-size: 18px;
    font-weight: 800;
    line-height: 1.2;
  }

  &--low {
    border-color: rgba(85, 233, 149, 0.55);
    background: rgba(20, 90, 65, 0.32);
    box-shadow: 0 0 12px rgba(85, 233, 149, 0.35);
    animation: sid-breath-warn-low 2s ease-in-out infinite;

    strong { color: #9affc4; }
  }

  &--medium {
    border-color: rgba(250, 204, 21, 0.7);
    background: rgba(130, 95, 20, 0.38);
    box-shadow: 0 0 16px rgba(250, 204, 21, 0.45);
    animation: sid-breath-warn-mid 1.6s ease-in-out infinite;

    strong { color: #ffe566; }
  }

  &--high {
    border-color: rgba(255, 120, 120, 0.8);
    background: rgba(140, 40, 50, 0.42);
    box-shadow: 0 0 18px rgba(255, 90, 90, 0.55);
    animation: sid-breath-warn-high 1.2s ease-in-out infinite;

    strong { color: #ffb0b0; }
  }
}

.sid__ticker {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-height: 32px;
  padding: 5px 10px;
  border: 1px solid rgba(100, 200, 255, 0.22);
  border-radius: 3px;
  background:
    linear-gradient(90deg, rgba(0, 90, 140, 0.22), transparent 55%),
    rgba(0, 28, 58, 0.48);
  overflow: hidden;
}

.sid__ticker-label {
  flex: 0 0 auto;
  color: #7eb4d8;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.sid__ticker-track {
  min-width: 0;
  overflow: hidden;
  position: relative;
}

.sid__ticker-marquee {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  animation: sid-ticker-in 0.35s ease;

  &--award .sid__ticker-text { color: #ffe6a8; }
  &--warn .sid__ticker-text { color: #ffb4b4; }
  &--info .sid__ticker-text { color: #b8ecff; }

  &--scroll {
    max-width: none;
    width: max-content;
    overflow: visible;
    text-overflow: clip;
    will-change: transform;
    animation: sid-ticker-marquee var(--ticker-duration, 14s) linear infinite;
  }

  &--scroll-once {
    max-width: none;
    width: max-content;
    overflow: visible;
    text-overflow: clip;
    will-change: transform;
    animation: sid-ticker-marquee var(--ticker-duration, 14s) linear forwards;
  }
}

.sid__ticker-text {
  display: inline-block;
  color: #d8eeff;
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  white-space: nowrap;
}

.sid__ticker-empty {
  color: #6e9bb8;
  font-size: 14px;
  font-weight: 600;
}

.sid__ticker--empty {
  opacity: 0.85;
}

@keyframes sid-ticker-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes sid-ticker-marquee {
  0% { transform: translateX(var(--marquee-from, 0)); }
  100% { transform: translateX(var(--marquee-to, -100%)); }
}

/* 关键信息呼吸灯：高潜 / 预警（仅光晕明暗，不缩放） */
@keyframes sid-breath-potential {
  0%, 100% {
    opacity: 0.9;
    border-color: rgba(100, 220, 255, 0.5);
    box-shadow: 0 0 8px rgba(80, 210, 255, 0.28);
  }
  50% {
    opacity: 1;
    border-color: rgba(180, 250, 255, 1);
    box-shadow:
      0 0 10px rgba(120, 240, 255, 0.9),
      0 0 24px rgba(60, 200, 255, 0.55);
  }
}

@keyframes sid-breath-warn-low {
  0%, 100% {
    opacity: 0.9;
    border-color: rgba(85, 233, 149, 0.4);
    box-shadow: 0 0 6px rgba(85, 233, 149, 0.22);
  }
  50% {
    opacity: 1;
    border-color: rgba(140, 255, 190, 1);
    box-shadow:
      0 0 12px rgba(100, 255, 170, 0.75),
      0 0 22px rgba(60, 220, 140, 0.4);
  }
}

@keyframes sid-breath-warn-mid {
  0%, 100% {
    opacity: 0.9;
    border-color: rgba(250, 204, 21, 0.45);
    box-shadow: 0 0 8px rgba(250, 204, 21, 0.25);
  }
  50% {
    opacity: 1;
    border-color: rgba(255, 236, 120, 1);
    box-shadow:
      0 0 14px rgba(255, 220, 80, 0.85),
      0 0 26px rgba(250, 180, 20, 0.5);
  }
}

@keyframes sid-breath-warn-high {
  0%, 100% {
    opacity: 0.9;
    border-color: rgba(248, 113, 113, 0.5);
    box-shadow: 0 0 8px rgba(248, 113, 113, 0.28);
  }
  50% {
    opacity: 1;
    border-color: rgba(255, 170, 170, 1);
    box-shadow:
      0 0 16px rgba(255, 100, 100, 0.95),
      0 0 28px rgba(255, 60, 60, 0.55);
  }
}

@media (prefers-reduced-motion: reduce) {
  .sid__tag--potential,
  .sid__core-card--low,
  .sid__core-card--medium,
  .sid__core-card--high {
    animation: none !important;
  }
}

.sid__aid-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;

  :deep(.stu-hint--block) {
    min-width: 0;
    height: 100%;
  }
}

.sid__aid-item {
  min-width: 0;
  padding: 5px 7px;
  border-left: 2px solid currentColor;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.56);

  span,
  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span { color: #7eb4d8; font-size: 15px; font-weight: 600; }
  strong { margin-top: 2px; color: currentColor; font-size: 17px; font-weight: 700; }

  &--safe { color: #55e995; }
  &--warn { color: #facc15; }
  &--risk { color: #ff7474; }
  &--info { color: #65dfff; }
}

.sid__utility-row {
  flex: 0 0 auto;
  margin-top: auto;
}

.sid__archive-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  :deep(.stu-hint) {
    display: block;
    min-width: 0;
  }

  button {
    width: 100%;
    min-height: 36px;
    padding: 7px 10px;
    border: 1px solid rgba(100, 200, 255, 0.28);
    border-radius: 3px;
    background:
      linear-gradient(180deg, rgba(0, 90, 160, 0.28), rgba(0, 40, 80, 0.35)),
      rgba(0, 30, 60, 0.55);
    color: #b8ecff;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      border-color: rgba(120, 220, 255, 0.5);
      color: #e8f8ff;
    }
  }
}
</style>
