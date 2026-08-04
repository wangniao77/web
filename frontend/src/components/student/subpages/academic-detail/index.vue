<script setup lang="ts">
/**
 * 学情轨迹护航详情（二级页面）
 * 路由：/student/academic-detail?studentId=xxx
 *
 * 学业画像总结 + 多维度分析（成绩结构 / 学业稳定性 / 课程难度适应 /
 * 培养完成 / 帮扶轨迹 / 课程能力雷达 / 同专业对比 / 教师指导建议）。
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import StudentSectionNav from '../_shared/StudentSectionNav.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import { gpaDetailService } from '../_shared/gpa-data'
import type { StudentDashboardVM } from '@/types/student/view'
import type { GpaDetailVM, CourseCategory, CourseRecordVM } from '../_shared/gpa-data'
import { CATEGORY_LABEL } from '../_shared/gpa-data'
import CourseDifficultyBubble from './components/CourseDifficultyBubble.vue'
import StabilityGauge from './components/StabilityGauge.vue'
import AbilityRadar from './components/AbilityRadar.vue'
import MajorPositionChart from './components/MajorPositionChart.vue'
import SupportTrajectory from './components/SupportTrajectory.vue'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const sectionNav = [
  { id: 'sec-portrait', label: '学业画像' },
  { id: 'sec-structure', label: '成绩结构' },
  { id: 'sec-compare', label: '同专业对比' },
  { id: 'sec-stability', label: '学业稳定性' },
  { id: 'sec-advice', label: '指导建议' },
]

const dashboard = ref<StudentDashboardVM | null>(null)
const gpaDetail = ref<GpaDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    const [dash, gpa] = await Promise.all([
      studentService.fetchDashboard(activeStudentId.value),
      gpaDetailService.fetchDetail(),
    ])
    dashboard.value = dash
    gpaDetail.value = gpa
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push({ name: 'student', query: { studentId: activeStudentId.value } })
}

/* ─────────── 课程难度推导（课程平均分/性质/学分综合）─────────── */
const CATEGORY_DIFF: Record<CourseCategory, number> = {
  'major-core': 82,
  'major-base': 68,
  elective: 64,
  practice: 58,
  general: 46,
  humanity: 42,
  art: 36,
}

interface CoursePoint {
  id: string
  name: string
  score: number
  credit: number
  category: CourseCategory
  categoryLabel: string
  difficulty: number
}

const coursePoints = computed<CoursePoint[]>(() =>
  (gpaDetail.value?.courses ?? []).map((c: CourseRecordVM) => {
    const d = CATEGORY_DIFF[c.category] + (c.credit - 2) * 3
    return {
      id: c.id,
      name: c.name,
      score: c.score,
      credit: c.credit,
      category: c.category,
      categoryLabel: c.categoryLabel,
      difficulty: Math.max(20, Math.min(98, Math.round(d))),
    }
  }),
)

/* ─────────── 基础指标 ─────────── */
const gpa = computed(() => gpaDetail.value?.overview.cumulativeGpa ?? 0)
const majorRank = computed(() => dashboard.value?.academic.majorRank ?? 0)
const majorTotal = computed(() => dashboard.value?.academic.majorTotal ?? 0)
const courseCompletionRate = computed(() => dashboard.value?.academic.courseCompletionRate ?? 0)
const failCount = computed(() => dashboard.value?.failedCritical.length ?? 0)

const countedCourses = computed(() =>
  (gpaDetail.value?.courses ?? []).filter((c) => c.counted),
)
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const mean = arr.reduce((s, v) => s + v, 0) / arr.length
  return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
}
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

/* ─────────── 1. 学业画像总结 ─────────── */
const retakeCount = computed(() => countedCourses.value.filter((c) => c.retake).length)
const lowScoreCount = computed(() => countedCourses.value.filter((c) => c.score < 75).length)
const stabilityIndex = computed(() => {
  const vals = (gpaDetail.value?.semesters ?? []).map((s) => s.gpa)
  const std = stdDev(vals)
  const raw = 100 - std * 30 - failCount.value * 10 - retakeCount.value * 8 - lowScoreCount.value * 2.5
  return clamp(Math.round(raw), 0, 100)
})

const compositeScore = computed(() => {
  const rp = gpaDetail.value?.overview.majorRankPercent ?? 0
  const cr = courseCompletionRate.value
  const si = stabilityIndex.value
  return clamp(Math.round(0.45 * rp + 0.25 * cr + 0.3 * si), 0, 100)
})
const portraitStatus = computed(() => {
  const s = compositeScore.value
  if (s >= 88) return '卓越领先'
  if (s >= 80) return '优秀偏稳定'
  if (s >= 70) return '良好稳健'
  if (s >= 60) return '中等待提升'
  return '偏弱需关注'
})
function toLetter(g: number): string {
  if (g >= 3.7) return 'A'
  if (g >= 3.3) return 'A-'
  if (g >= 3.0) return 'B+'
  if (g >= 2.7) return 'B'
  if (g >= 2.3) return 'B-'
  if (g >= 2.0) return 'C+'
  if (g >= 1.5) return 'C'
  if (g >= 1.0) return 'C-'
  return 'D'
}
const letterGrade = computed(() => toLetter(gpa.value))

const aiSummary = computed(() => {
  const best = bestCat.value
  const worst = worstCat.value
  const rp = gpaDetail.value?.overview.majorRankPercent ?? 0
  const rank = majorRank.value
  const total = majorTotal.value || 1
  return `该生整体学业表现${portraitStatus.value === '优秀偏稳定' || portraitStatus.value === '卓越领先' ? '良好' : '中等'}，专业排名位于前 ${rp}%（第 ${rank}/${total}）。「${best?.label ?? '专业核心'}」课程掌握能力较强（均分 ${best?.avg ?? '—'}），但「${worst?.label ?? '基础课程'}」成绩相对薄弱（均分 ${worst?.avg ?? '—'}），建议关注薄弱类别课程的持续提升。`
})

/* ─────────── 2. 成绩能力解析 ─────────── */
const catAverages = computed(() => {
  const map = new Map<CourseCategory, { sum: number; n: number }>()
  for (const c of countedCourses.value) {
    const e = map.get(c.category) ?? { sum: 0, n: 0 }
    e.sum += c.score
    e.n += 1
    map.set(c.category, e)
  }
  return [...map.entries()]
    .map(([cat, e]) => ({
      cat,
      label: CATEGORY_LABEL[cat],
      avg: Math.round((e.sum / e.n) * 10) / 10,
      n: e.n,
      courses: countedCourses.value
        .filter((x) => x.category === cat)
        .sort((a, b) => b.score - a.score)
        .map((x) => ({ name: x.name, score: x.score })),
    }))
    .sort((a, b) => b.avg - a.avg)
})
const bestCat = computed(() => catAverages.value[0])
const worstCat = computed(() => catAverages.value[catAverages.value.length - 1])
const abilityTrend = computed(() => {
  const sems = gpaDetail.value?.semesters ?? []
  if (sems.length < 2) return { first: 0, last: 0, text: '样本不足', dir: 'flat' as const }
  const first = sems[0].gpa
  const last = sems[sems.length - 1].gpa
  const d = Math.round((last - first) * 100) / 100
  const dir = d > 0.1 ? ('up' as const) : d < -0.1 ? ('down' as const) : ('flat' as const)
  const text = dir === 'up' ? '稳定上升 ↑' : dir === 'down' ? '出现下滑 ↓' : '保持平稳 →'
  return { first, last, text, dir }
})

/* ─────────── 3. 稳定性评价 ─────────── */
const stabilityAdvantages = computed<string[]>(() => {
  const list: string[] = []
  if (failCount.value === 0) list.push('无挂科记录')
  if (abilityTrend.value.dir === 'up') list.push('GPA 连续提升')
  else if (abilityTrend.value.dir === 'flat') list.push('GPA 走势平稳')
  if ((gpaDetail.value?.overview.majorRankPercent ?? 0) >= 80) list.push('专业排名靠前且稳定')
  if (!list.length) list.push('总体平稳')
  return list
})
const stabilityRisks = computed<string[]>(() => {
  const list: string[] = []
  const vals = (gpaDetail.value?.semesters ?? []).map((s) => s.gpa)
  if (stdDev(vals) > 0.25) list.push('近两学期 GPA 波动偏大')
  // 「重课」= 专业核心/专业基础（客观类别），不再使用估算难度
  const hard = coursePoints.value.filter(
    (p) => p.category === 'major-core' || p.category === 'major-base',
  )
  if (hard.length > 1) {
    const scores = hard.map((p) => p.score)
    const hi = Math.max(...scores)
    const lo = Math.min(...scores)
    const spread = hi - lo
    if (spread > 15) {
      list.push(`专业核心/基础课成绩落差大：最高 ${hi}、最低 ${lo}`)
    }
  }
  if (failCount.value > 0) list.push(`存在 ${failCount.value} 门不及格课程`)
  if (!list.length) list.push('暂未发现明显风险')
  return list
})

/* ─────────── 7. 毕业达成预测 ─────────── */
const gradCompletion = computed(() => credit.value?.earnedPercent ?? courseCompletionRate.value)
const gradProbability = computed(() => {
  const base = 65 + gradCompletion.value * 0.3 + (failCount.value === 0 ? 8 : 0)
  const p = base - failCount.value * 6 - retakeCount.value * 3
  return clamp(Math.round(p), 40, 99)
})
const gradRiskFactors = computed(() => {
  if (failCount.value === 0 && retakeCount.value === 0) return ['无']
  return [
    ...(failCount.value > 0 ? [`${failCount.value} 门不及格`] : []),
    ...(retakeCount.value > 0 ? [`${retakeCount.value} 门重修`] : []),
  ]
})
const gradFocus = computed(() => {
  const f = ['毕业设计', '就业准备']
  if (failCount.value > 0) f.unshift('补修课程')
  return f
})

/* ─────────── 培养完成情况 ─────────── */
const credit = computed(() => dashboard.value?.creditProgress)
const creditBuckets = computed(() => {
  if (credit.value?.buckets?.length) return credit.value.buckets
  const required = credit.value?.required || 160
  const earned = credit.value?.earned || 0
  return [
    { label: '必修学分', earned: Math.round(earned * 0.7 * 10) / 10, required: Math.round(required * 0.7) },
    { label: '选修学分', earned: Math.round(earned * 0.2 * 10) / 10, required: Math.round(required * 0.2) },
    { label: '通识学分', earned: Math.round(earned * 0.1 * 10) / 10, required: Math.max(1, Math.round(required * 0.1)) },
  ]
})
const progressAbnormal = computed(() => {
  const rate = courseCompletionRate.value
  if (rate < 60) return '进度异常：培养计划完成率不足 60%，需重点关注'
  if (rate < 80) return '进度偏慢：培养计划完成率低于 80%，建议加快选课进度'
  return '进度正常'
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="学情轨迹护航详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回学生发展概览"
    :back-to="{ name: 'student', query: { studentId: activeStudentId } }"
  >
    <div v-if="loading" class="placeholder">
      <span class="spinner" /> 正在加载...
    </div>
    <div v-else-if="error" class="placeholder error">
      <span>{{ error }}</span><button @click="load">重试</button>
    </div>

    <div v-else-if="dashboard && gpaDetail" class="academic-detail">
      <StudentSectionNav :items="sectionNav" />

      <!-- 1. 学业画像总结 -->
      <section id="sec-portrait" class="portrait">
        <div class="portrait__glow" aria-hidden="true" />
        <div class="portrait__left">
          <div class="portrait__status">{{ portraitStatus }}</div>
          <div class="portrait__score">
            综合评分 <b>{{ compositeScore }}</b> 分
          </div>
          <div class="portrait__metrics">
            <div class="portrait__metric">
              <span class="portrait__metric-label">专业排名</span>
              <strong class="portrait__metric-value">{{ majorRank }} / {{ majorTotal || '—' }}</strong>
            </div>
            <div class="portrait__metric">
              <span class="portrait__metric-label">学业等级</span>
              <strong class="portrait__metric-value">{{ letterGrade }}</strong>
            </div>
            <div class="portrait__metric">
              <span class="portrait__metric-label">培养完成</span>
              <strong class="portrait__metric-value">{{ courseCompletionRate }}%</strong>
            </div>
          </div>
        </div>
        <div class="portrait__right">
          <span class="portrait__ai-tag">AI 学业分析</span>
          <p class="portrait__ai-text">{{ aiSummary }}</p>
        </div>
      </section>

      <!-- 2. 课程成绩分布 + 培养完成情况 -->
      <div id="sec-structure" class="detail-grid">
        <section class="composite">
          <CourseDifficultyBubble :points="coursePoints" />
          <div class="analysis-cards">
            <div class="analysis-card analysis-card--good">
              <span class="analysis-card__badge">优势领域</span>
              <div class="analysis-card__main">{{ bestCat?.label ?? '—' }}</div>
              <div class="analysis-card__sub">
                <span>平均成绩</span>
                <b>{{ bestCat ? Number(bestCat.avg).toFixed(1) : '—' }}</b>
              </div>
              <div class="analysis-card__courses">
                <span class="analysis-card__courses-label">涉及课程</span>
                <p>{{ (bestCat?.courses ?? []).slice(0, 3).map((c) => c.name).join('、') || '—' }}</p>
              </div>
            </div>
            <div class="analysis-card analysis-card--warn">
              <span class="analysis-card__badge">待提升领域</span>
              <div class="analysis-card__main">{{ worstCat?.label ?? '—' }}</div>
              <div class="analysis-card__sub">
                <span>平均成绩</span>
                <b>{{ worstCat ? Number(worstCat.avg).toFixed(1) : '—' }}</b>
              </div>
              <div class="analysis-card__courses">
                <span class="analysis-card__courses-label">主要课程</span>
                <p>{{ (worstCat?.courses ?? []).slice(0, 3).map((c) => c.name).join('、') || '—' }}</p>
              </div>
            </div>
            <div class="analysis-card analysis-card--blue">
              <span class="analysis-card__badge">能力趋势</span>
              <div class="analysis-card__main">近 {{ gpaDetail.semesters.length }} 学期</div>
              <div class="analysis-card__sub">
                <span>GPA</span>
                <b>{{ abilityTrend.first.toFixed(2) }} → {{ abilityTrend.last.toFixed(2) }}</b>
              </div>
              <div class="analysis-card__courses">
                <span class="analysis-card__courses-label">趋势</span>
                <p>{{ abilityTrend.text }}</p>
              </div>
            </div>
          </div>
        </section>

        <section class="composite">
          <div class="warn-section">
            <div class="warn-section__glow" aria-hidden="true" />
            <h3 class="warn-section__title">培养完成情况</h3>
            <div class="completion-summary">
              <div class="completion-kpi">
                <span class="completion-kpi__label">总学分</span>
                <strong class="completion-kpi__value">{{ credit?.earned ?? 0 }}/{{ credit?.required ?? 160 }}</strong>
              </div>
              <div class="completion-kpi">
                <span class="completion-kpi__label">完成率</span>
                <strong class="completion-kpi__value">{{ credit?.earnedPercent ?? 0 }}%</strong>
              </div>
            </div>
            <div class="completion-progress">
              <div class="completion-progress__label">培养计划进度</div>
              <div class="completion-progress__bar">
                <div class="completion-progress__inner" :style="{ width: `${Math.min(100, courseCompletionRate)}%` }" />
              </div>
              <div class="completion-progress__percent">{{ courseCompletionRate }}%</div>
            </div>
            <div class="completion-status">
              <span class="completion-status__label">进度评估</span>
              <span class="completion-status__value" :class="courseCompletionRate < 80 ? 'is-warn' : 'is-safe'">{{ progressAbnormal }}</span>
            </div>
            <div class="credit-bucket-list">
              <div v-for="bucket in creditBuckets" :key="bucket.label" class="credit-bucket">
                <span class="credit-bucket__label">{{ bucket.label }}</span>
                <div class="credit-bucket__bar">
                  <div class="credit-bucket__inner" :style="{ width: `${Math.min(100, Math.round((bucket.earned / Math.max(1, bucket.required)) * 100))}%` }" />
                </div>
                <span class="credit-bucket__value">{{ bucket.earned }}/{{ bucket.required }}</span>
              </div>
            </div>
          </div>

          <div class="grad-predict">
            <h4 class="grad-predict__title">毕业达成预测</h4>
            <div class="grad-predict__bar">
              <span class="grad-predict__bar-label">毕业要求</span>
              <div class="grad-predict__track">
                <div class="grad-predict__fill" :style="{ width: `${Math.min(100, gradCompletion)}%` }" />
              </div>
              <span class="grad-predict__bar-value">{{ gradCompletion }}%</span>
            </div>
            <div class="grad-predict__row">
              <span class="grad-predict__label">正常毕业概率</span>
              <b class="grad-predict__value">{{ gradProbability }}%</b>
            </div>
            <div class="grad-predict__row">
              <span class="grad-predict__label">风险因素</span>
              <span class="grad-predict__risk">{{ gradRiskFactors.join('、') }}</span>
            </div>
            <div class="grad-predict__tags">
              <span class="grad-predict__tag-label">剩余关注</span>
              <span v-for="f in gradFocus" :key="f" class="grad-predict__tag">{{ f }}</span>
            </div>
          </div>
        </section>
      </div>

      <!-- 7. 学业稳定性分析 | 课程能力雷达图 -->
      <div id="sec-stability" class="detail-grid">
        <section class="composite">
          <StabilityGauge
            :gpa-values="gpaDetail.semesters.map((s) => s.gpa)"
            :fail-count="failCount"
            :retake-count="retakeCount"
            :low-score-count="lowScoreCount"
            :index="stabilityIndex"
          />
          <div class="stab-eval">
            <div class="stab-eval__index">
              稳定指数 <b>{{ stabilityIndex }}</b>
            </div>
            <div class="stab-eval__col">
              <h4 class="stab-eval__title stab-eval__title--good">优势</h4>
              <ul class="stab-eval__list">
                <li v-for="a in stabilityAdvantages" :key="a" class="stab-eval__item stab-eval__item--good">✓ {{ a }}</li>
              </ul>
            </div>
            <div class="stab-eval__col">
              <h4 class="stab-eval__title stab-eval__title--warn">风险</h4>
              <ul class="stab-eval__list">
                <li v-for="r in stabilityRisks" :key="r" class="stab-eval__item stab-eval__item--warn">⚠ {{ r }}</li>
              </ul>
            </div>
          </div>
        </section>
        <section class="composite">
          <AbilityRadar :points="coursePoints" :stability-index="stabilityIndex" />
        </section>
      </div>

      <!-- 5. 同专业对比分析 · 专业位置分析 | 帮扶轨迹 -->
      <div id="sec-compare" class="detail-grid">
        <MajorPositionChart
          :student-gpa="gpa"
          :major-avg-gpa="gpaDetail.overview.majorAvgGpa"
          :major-rank="majorRank"
          :major-total="majorTotal"
          :major-rank-percent="gpaDetail.overview.majorRankPercent"
        />
        <SupportTrajectory />
      </div>

      <!-- 8. 教师指导建议 -->
      <section id="sec-advice" class="advice">
        <h3 class="advice__title">教师指导建议</h3>
        <div class="advice__grid">
          <div class="advice-card advice-card--green">
            <span class="advice-card__tag">保持</span>
            <h4 class="advice-card__head">继续保持专业课程优势</h4>
            <p class="advice-card__text">建议：参与科研项目，提升工程实践能力</p>
          </div>
          <div class="advice-card advice-card--yellow">
            <span class="advice-card__tag">关注</span>
            <h4 class="advice-card__head">{{ worstCat?.label ?? '基础课程' }}提升</h4>
            <p class="advice-card__text">
              建议：完成{{ (worstCat?.courses?.[0]?.name) || '基础课程' }}补强训练
            </p>
          </div>
          <div class="advice-card advice-card--blue">
            <span class="advice-card__tag">规划</span>
            <h4 class="advice-card__head">未来方向：研究生 / 就业</h4>
            <p class="advice-card__text">建议提前准备：竞赛、项目、论文</p>
          </div>
        </div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goBack">返回学生发展概览</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.academic-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;

  :deep([id^='sec-']) {
    scroll-margin-top: 64px;
  }
}

/* ── 1. 学业画像 ── */
.portrait {
  position: relative;
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 22px;
  padding: 20px 22px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(90% 80% at 0% 0%, rgba(0, 184, 255, 0.14), transparent 55%),
    linear-gradient(140deg, rgba(8, 48, 98, 0.72), rgba(3, 12, 34, 0.9));
  border: 1px solid rgba(102, 217, 255, 0.28);
  box-shadow:
    0 18px 40px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);

  &__glow {
    position: absolute;
    inset: auto -12% -40% 40%;
    height: 70%;
    background: radial-gradient(circle, rgba(85, 233, 149, 0.12), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
  }

  &__left {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__status {
    align-self: flex-start;
    padding: 5px 16px;
    border-radius: 999px;
    font-size: 18px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    box-shadow: 0 0 16px rgba(52, 211, 153, 0.4);
  }

  &__score {
    font-size: 22px;
    color: #cfe8ff;
    font-weight: 650;

    b {
      font-size: 52px;
      font-weight: 900;
      color: #f6fbff;
      font-family: 'DIN Alternate', sans-serif;
      margin: 0 4px;
      text-shadow: 0 0 22px rgba(0, 242, 255, 0.45);
    }
  }

  &__metrics {
    display: flex;
    gap: 10px;
  }

  &__metric {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 12px;
    border-radius: 12px;
    background: rgba(0, 28, 58, 0.5);
    border: 1px solid rgba(102, 217, 255, 0.16);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

    &-label {
      font-size: 16px;
      color: #7eb4d8;
      font-weight: 650;
    }

    &-value {
      font-size: 26px;
      font-weight: 900;
      color: #f6fbff;
      font-family: 'DIN Alternate', sans-serif;
      line-height: 1.15;
    }
  }

  &__right {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 12px;
    background:
      radial-gradient(80% 70% at 0% 0%, rgba(0, 184, 255, 0.12), transparent 55%),
      rgba(0, 32, 68, 0.42);
    border: 1px solid rgba(102, 217, 255, 0.2);
  }

  &__ai-tag {
    align-self: flex-start;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #55e0ff);
    box-shadow: 0 0 12px rgba(85, 224, 255, 0.3);
  }

  &__ai-text {
    margin: 0;
    font-size: 19px;
    line-height: 1.75;
    color: #dbeeff;
  }
}

/* ── 两两对齐网格 ── */
.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: stretch;
}

.composite {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;

  /* 右侧单卡时撑满与左侧等高，避免下半空白 */
  > :only-child {
    flex: 1;
    min-height: 0;
  }

  /* 左侧气泡图 + 分析卡：分析卡参与撑满 */
  > .analysis-cards {
    flex: 1;
  }
}

/* ── 2. 成绩能力解析 ── */
.analysis-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  flex: 1;
  min-height: 168px;
}

.analysis-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 168px;
  padding: 16px;
  border-radius: 14px;
  background:
    radial-gradient(100% 80% at 100% 0%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(0, 48, 96, 0.5), rgba(3, 14, 38, 0.78));
  border: 1px solid rgba(102, 217, 255, 0.18);
  box-shadow:
    0 12px 28px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }

  &--good {
    border-color: rgba(52, 211, 153, 0.35);
    &:hover { border-color: rgba(52, 211, 153, 0.55); }
  }
  &--warn {
    border-color: rgba(240, 192, 64, 0.35);
    &:hover { border-color: rgba(240, 192, 64, 0.55); }
  }
  &--blue {
    border-color: rgba(102, 217, 255, 0.35);
    &:hover { border-color: rgba(102, 217, 255, 0.55); }
  }

  &__badge {
    align-self: flex-start;
    font-size: 14px;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 999px;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.3);

    .analysis-card--warn & {
      background: linear-gradient(90deg, #fde68a, #f0c040);
      box-shadow: 0 0 12px rgba(240, 192, 64, 0.3);
    }
    .analysis-card--blue & {
      background: linear-gradient(90deg, #7ef0ff, #66d9ff);
      box-shadow: 0 0 12px rgba(102, 217, 255, 0.3);
    }
  }

  &__main {
    font-size: 26px;
    font-weight: 900;
    color: #f6fbff;
    letter-spacing: 0.02em;
    line-height: 1.2;
  }

  &__sub {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 10px;
    background: rgba(0, 24, 52, 0.45);
    border: 1px solid rgba(102, 217, 255, 0.12);

    span {
      font-size: 16px;
      color: #8fbdd8;
      font-weight: 650;
      flex-shrink: 0;
    }

    b {
      color: #7ff6ff;
      font-family: 'DIN Alternate', sans-serif;
      font-size: 28px;
      font-weight: 900;
      line-height: 1;
      text-shadow: 0 0 12px rgba(103, 232, 249, 0.3);
    }
  }

  &__courses {
    margin-top: auto;
    display: flex;
    flex-direction: column;
    gap: 4px;

    &-label {
      font-size: 14px;
      color: #7eb4d8;
      font-weight: 650;
    }

    p {
      margin: 0;
      font-size: 16px;
      line-height: 1.55;
      color: #cfe8ff;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

/* ── 3. 稳定性评价 ── */
.stab-eval {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    'index index'
    'good warn';
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  background:
    radial-gradient(90% 70% at 50% 0%, rgba(85, 233, 149, 0.08), transparent 60%),
    rgba(0, 28, 58, 0.48);
  border: 1px solid rgba(102, 217, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  &__index {
    grid-area: index;
    font-size: 20px;
    color: #cfe8ff;
    font-weight: 650;

    b {
      font-size: 44px;
      font-weight: 900;
      color: #7ff6c4;
      font-family: 'DIN Alternate', sans-serif;
      margin: 0 4px;
      text-shadow: 0 0 16px rgba(85, 233, 149, 0.4);
    }
  }

  &__col {
    min-width: 0;
  }

  &__title {
    margin: 0 0 8px;
    font-size: 18px;
    font-weight: 800;

    &--good { color: #34d399; }
    &--warn { color: #f0c040; }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  &__item {
    font-size: 16px;
    line-height: 1.5;
    color: #d0e8f8;
  }
}

/* ── 4. 课程难度四象限 ── */
.quadrant {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__tabs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  &__tab {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.32);
    border: 1px solid rgba(102, 217, 255, 0.12);
    cursor: pointer;
    transition: background 0.2s, border-color 0.2s;
    color: inherit;

    &:hover {
      background: rgba(0, 38, 73, 0.5);
    }

    &--active {
      background: rgba(0, 38, 73, 0.55);
    }

    &--good {
      border-color: rgba(52, 211, 153, 0.25);
      &.quadrant__tab--active { border-color: rgba(52, 211, 153, 0.6); background: rgba(52, 211, 153, 0.08); }
    }
    &--blue {
      border-color: rgba(102, 217, 255, 0.25);
      &.quadrant__tab--active { border-color: rgba(102, 217, 255, 0.6); background: rgba(102, 217, 255, 0.08); }
    }
    &--warn {
      border-color: rgba(240, 192, 64, 0.25);
      &.quadrant__tab--active { border-color: rgba(240, 192, 64, 0.6); background: rgba(240, 192, 64, 0.08); }
    }
    &--risk {
      border-color: rgba(248, 113, 113, 0.25);
      &.quadrant__tab--active { border-color: rgba(248, 113, 113, 0.6); background: rgba(248, 113, 113, 0.08); }
    }
  }

  &__tab-title {
    font-size: 19px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__tab-hint {
    font-size: 10.5px;
    color: #7eb4d8;
  }

  &__tab-badge {
    font-size: 10.5px;
    font-weight: 700;
    color: #f6fbff;
    background: rgba(102, 217, 255, 0.2);
    border-radius: 8px;
    padding: 1px 6px;
    margin-top: 2px;
  }

  &__panel {
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.32);
    border: 1px solid rgba(102, 217, 255, 0.12);

    &--good { border-color: rgba(52, 211, 153, 0.25); }
    &--blue { border-color: rgba(102, 217, 255, 0.25); }
    &--warn { border-color: rgba(240, 192, 64, 0.25); }
    &--risk { border-color: rgba(248, 113, 113, 0.25); }
  }

  &__desc {
    margin: 0 0 6px;
    font-size: 18px;
    line-height: 1.5;
    color: #b8d6ec;
  }

  &__legend {
    margin: 2px 0 0;
    font-size: 11.5px;
    color: #7eb4d8;
    text-align: center;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__item {
    display: grid;
    grid-template-columns: 1fr 48px 56px;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
  }

  &__name {
    color: #d0e8f8;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__score {
    color: #7ff6ff;
    font-weight: 700;
    font-family: 'DIN Alternate', sans-serif;
    text-align: right;
    white-space: nowrap;
  }

  &__stars {
    color: #9ec7e0;
    font-size: 17px;
    letter-spacing: -1px;
    text-align: left;
    white-space: nowrap;
  }

  &__empty {
    font-size: 18px;
    color: #5a7d96;
  }
}

/* ── 7. 毕业达成预测 ── */
.grad-predict {
  position: relative;
  padding: 16px 18px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(90% 70% at 0% 0%, rgba(85, 233, 149, 0.08), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.55), rgba(3, 12, 34, 0.82));
  border: 1px solid rgba(102, 217, 255, 0.2);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);

  &__title {
    margin: 0 0 12px;
    font-size: 20px;
    font-weight: 800;
    color: #f4fbff;
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 12px;
  }

  &__bar-label {
    font-size: 16px;
    color: #7eb4d8;
    width: 72px;
    flex-shrink: 0;
    font-weight: 650;
  }

  &__track {
    flex: 1;
    height: 10px;
    border-radius: 999px;
    background: rgba(0, 24, 52, 0.75);
    border: 1px solid rgba(102, 217, 255, 0.1);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0d9488, #5eead4);
    box-shadow: 0 0 12px rgba(94, 234, 212, 0.4);
  }

  &__bar-value {
    font-size: 20px;
    color: #7ff6ff;
    font-weight: 800;
    width: 48px;
    text-align: right;
    flex-shrink: 0;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 0;
    font-size: 17px;
  }

  &__label {
    color: #7eb4d8;
    font-weight: 650;
  }

  &__value {
    font-size: 26px;
    font-weight: 900;
    color: #7ff6c4;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__risk {
    color: #ffd27a;
    font-weight: 700;
  }

  &__tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 10px;
  }

  &__tag-label {
    font-size: 16px;
    color: #7eb4d8;
    font-weight: 650;
  }

  &__tag {
    font-size: 15px;
    padding: 4px 12px;
    border-radius: 999px;
    color: #cfe8ff;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.28);
  }
}

/* ── 培养完成 ── */
.warn-section {
  position: relative;
  padding: 16px 18px;
  border-radius: 12px;
  overflow: hidden;
  background:
    radial-gradient(120% 80% at 100% 0%, rgba(0, 180, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.7), rgba(3, 12, 34, 0.86));
  border: 1px solid rgba(102, 217, 255, 0.22);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &__glow {
    position: absolute;
    inset: auto -15% -35% auto;
    width: 50%;
    height: 65%;
    background: radial-gradient(circle, rgba(0, 229, 255, 0.1), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.65), transparent);
  }
}

.warn-section__title {
  position: relative;
  z-index: 1;
  margin: 0 0 14px;
  font-size: 24px;
  font-weight: 800;
  color: #f4fbff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.18);

  &::before {
    content: '';
    width: 3px;
    height: 18px;
    border-radius: 2px;
    background: linear-gradient(180deg, #7ff6ff, #00b8ff);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
  }
}

.completion-summary {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.completion-kpi {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px;
  border-radius: 12px;
  background: rgba(0, 28, 58, 0.5);
  border: 1px solid rgba(102, 217, 255, 0.16);

  &__label { font-size: 16px; color: #7eb4d8; font-weight: 650; }
  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #f6fbff;
    font-family: 'DIN Alternate', sans-serif;
    line-height: 1.1;
  }
}

.completion-progress {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;

  &__label { font-size: 17px; color: #9ecae8; font-weight: 700; width: 110px; flex-shrink: 0; }
  &__bar {
    flex: 1;
    height: 10px;
    border-radius: 999px;
    background: rgba(0, 24, 52, 0.75);
    border: 1px solid rgba(102, 217, 255, 0.12);
    overflow: hidden;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.35);
  }
  &__inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0369a1, #67e8f9);
    box-shadow: 0 0 12px rgba(103, 232, 249, 0.45);
  }
  &__percent {
    font-size: 20px;
    color: #7ff6ff;
    font-weight: 800;
    font-family: 'DIN Alternate', sans-serif;
    width: 48px;
    text-align: right;
    flex-shrink: 0;
  }
}

.completion-status {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0 4px;
  font-size: 17px;

  &__label { color: #7eb4d8; font-weight: 650; width: 110px; flex-shrink: 0; }
  &__value {
    color: #d0e8f8;
    font-weight: 700;
    &.is-safe { color: #55e995; }
    &.is-warn { color: #ff9b7a; }
  }
}

.credit-bucket-list {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.credit-bucket {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(0, 28, 58, 0.42);
  border: 1px solid rgba(102, 217, 255, 0.12);
  font-size: 17px;

  &__label { color: #9ecae8; width: 80px; flex-shrink: 0; font-weight: 650; }
  &__bar {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 24, 52, 0.75);
    border: 1px solid rgba(102, 217, 255, 0.1);
    overflow: hidden;
  }
  &__inner {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #0d9488, #5eead4);
    box-shadow: 0 0 10px rgba(94, 234, 212, 0.4);
  }
  &__value {
    color: #e8f7ff;
    font-weight: 800;
    font-family: 'DIN Alternate', sans-serif;
    font-size: 18px;
    width: 72px;
    text-align: right;
    flex-shrink: 0;
  }
}

/* ── 8. 教师指导建议 ── */
.advice {
  position: relative;
  padding: 18px 20px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(90% 80% at 0% 0%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.65), rgba(3, 12, 34, 0.88));
  border: 1px solid rgba(102, 217, 255, 0.24);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.65), transparent);
  }

  &__title {
    position: relative;
    z-index: 1;
    margin: 0 0 14px;
    font-size: 24px;
    font-weight: 800;
    color: #f4fbff;
    text-shadow: 0 0 12px rgba(0, 242, 255, 0.18);
  }

  &__grid {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

.advice-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  border-radius: 12px;
  background:
    radial-gradient(80% 60% at 0% 0%, rgba(0, 184, 255, 0.08), transparent 55%),
    rgba(0, 32, 68, 0.48);
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-top: 3px solid #34d399;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition: transform 0.2s, border-color 0.2s;

  &:hover { transform: translateY(-1px); }

  &--green { border-top-color: #34d399; }
  &--yellow { border-top-color: #f0c040; }
  &--blue { border-top-color: #66d9ff; }

  &__tag {
    align-self: flex-start;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);

    .advice-card--yellow & { background: linear-gradient(90deg, #fde68a, #f0c040); }
    .advice-card--blue & { background: linear-gradient(90deg, #7ef0ff, #66d9ff); }
  }

  &__head {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__text {
    margin: 0;
    font-size: 17px;
    line-height: 1.6;
    color: #cfe8ff;
  }
}

/* Footer */
.footer-actions {
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: rgba(0, 184, 255, 0.1);
    color: #8ef6ff;
    font-size: 21px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
      background: rgba(0, 184, 255, 0.18);
      border-color: rgba(0, 184, 255, 0.6);
    }
  }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 20px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 21px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 21px;

    &:hover { background: rgba(0, 184, 255, 0.2); }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top-color: #00b8ff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ── 板块外框统一加亮，区分各个板块 ── */
.portrait,
.advice {
  border-color: rgba(102, 217, 255, 0.28);
}

.detail-grid > .composite {
  position: relative;
  padding: 14px;
  border-radius: 14px;
  overflow: hidden;
  background:
    radial-gradient(100% 80% at 100% 0%, rgba(0, 184, 255, 0.08), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.45), rgba(3, 12, 34, 0.7));
  border: 1px solid rgba(102, 217, 255, 0.24);
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.55), transparent);
    pointer-events: none;
  }
}

:deep(.chart-card),
:deep(.support-card) {
  border-color: rgba(102, 217, 255, 0.22);
}

@media (max-width: 1280px) {
  .portrait { grid-template-columns: 1fr; }
  .portrait__right { padding-top: 4px; }
  .detail-grid { grid-template-columns: 1fr; }
  .advice__grid { grid-template-columns: 1fr; }
}
</style>
