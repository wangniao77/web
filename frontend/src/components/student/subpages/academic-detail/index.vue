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
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import { gpaDetailService } from '../_shared/gpa-data'
import type { StudentDashboardVM } from '@/types/student/view'
import type { GpaDetailVM, CourseCategory, CourseRecordVM } from '../_shared/gpa-data'
import { CATEGORY_LABEL } from '../_shared/gpa-data'
import GradeStructureChart from './components/GradeStructureChart.vue'
import StabilityGauge from './components/StabilityGauge.vue'
import DifficultyScatter from './components/DifficultyScatter.vue'
import AbilityRadar from './components/AbilityRadar.vue'
import MajorPositionChart from './components/MajorPositionChart.vue'
import SupportTrajectory from './components/SupportTrajectory.vue'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const activeQuadrantKey = ref('advantage')

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
  return `该生整体学业表现${portraitStatus.value === '优秀偏稳定' || portraitStatus.value === '卓越领先' ? '良好' : '中等'}，专业排名位于前 ${rp}%（第 ${rank}/${total}）。「${best?.label ?? '专业核心'}」课程掌握能力较强（均分 ${best?.avg ?? '—'}），但「${worst?.label ?? '基础课程'}」成绩相对薄弱（均分 ${worst?.avg ?? '—'}），建议关注高难度专业课程与基础课程的持续提升。`
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
  if (abilityTrend.value.dir !== 'down') list.push('GPA 连续提升')
  if ((gpaDetail.value?.overview.majorRankPercent ?? 0) >= 80) list.push('专业排名稳定')
  if (!list.length) list.push('总体平稳')
  return list
})
const stabilityRisks = computed<string[]>(() => {
  const list: string[] = []
  const vals = (gpaDetail.value?.semesters ?? []).map((s) => s.gpa)
  if (stdDev(vals) > 0.25) list.push('近两学期部分课程波动')
  const hard = coursePoints.value.filter((p) => p.difficulty >= 65)
  if (hard.length > 1) {
    const spread = Math.max(...hard.map((p) => p.score)) - Math.min(...hard.map((p) => p.score))
    if (spread > 15) list.push('高难课程成绩差异较大')
  }
  if (failCount.value > 0) list.push(`存在 ${failCount.value} 门不及格课程`)
  if (!list.length) list.push('暂未发现明显风险')
  return list
})

/* ─────────── 4. 课程难度四象限 ─────────── */
function diffStars(d: number): string {
  return '★'.repeat(Math.max(1, Math.min(5, Math.round(d / 20))))
}
const quadrants = computed(() => {
  const pts = coursePoints.value
  const pick = (arr: CoursePoint[], asc = false) =>
    [...arr]
      .sort((a, b) => (asc ? a.score - b.score : b.score - a.score))
      .slice(0, 3)
      .map((p) => ({ name: p.name, score: p.score, stars: diffStars(p.difficulty) }))
  return [
    {
      key: 'advantage',
      title: '优势课程',
      cls: 'good',
      hint: '高难 · 高分',
      desc: '难度大且成绩突出，是核心竞争力的体现，建议保持。',
      items: pick(pts.filter((p) => p.difficulty >= 65 && p.score >= 80)),
    },
    {
      key: 'potential',
      title: '潜力课程',
      cls: 'blue',
      hint: '低难 · 高分',
      desc: '难度不高但掌握扎实，可作为稳分基本盘。',
      items: pick(pts.filter((p) => p.difficulty < 65 && p.score >= 80)),
    },
    {
      key: 'weak',
      title: '基础薄弱',
      cls: 'warn',
      hint: '低难 · 低分',
      desc: '本应易拿分却偏低，多为态度或方法问题，需重点补强。',
      items: pick(pts.filter((p) => p.difficulty < 65 && p.score < 75), true),
    },
    {
      key: 'risk',
      title: '风险课程',
      cls: 'risk',
      hint: '高难 · 低分',
      desc: '难度大且成绩不理想，挂科风险最高，需优先干预。',
      items: pick(pts.filter((p) => p.difficulty >= 65 && p.score < 75), true),
    },
  ]
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
      <!-- 1. 学业画像总结 -->
      <section class="portrait">
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

      <!-- 2. 成绩结构分析 + 成绩能力解析 | 3. 学业稳定性分析 + 稳定性评价 -->
      <div class="detail-grid">
        <section class="composite">
          <GradeStructureChart :courses="gpaDetail.courses" />
          <div class="analysis-cards">
            <div class="analysis-card analysis-card--good">
              <span class="analysis-card__badge">优势领域</span>
              <div class="analysis-card__main">{{ bestCat?.label ?? '—' }}</div>
              <div class="analysis-card__sub">平均成绩 <b>{{ bestCat?.avg ?? '—' }}</b></div>
              <div class="analysis-card__courses">
                涉及课程：{{ (bestCat?.courses ?? []).slice(0, 3).map((c) => c.name).join('、') || '—' }}
              </div>
            </div>
            <div class="analysis-card analysis-card--warn">
              <span class="analysis-card__badge">待提升领域</span>
              <div class="analysis-card__main">{{ worstCat?.label ?? '—' }}</div>
              <div class="analysis-card__sub">平均成绩 <b>{{ worstCat?.avg ?? '—' }}</b></div>
              <div class="analysis-card__courses">
                主要课程：{{ (worstCat?.courses ?? []).slice(0, 3).map((c) => c.name).join('、') || '—' }}
              </div>
            </div>
            <div class="analysis-card analysis-card--blue">
              <span class="analysis-card__badge">能力趋势</span>
              <div class="analysis-card__main">近 {{ gpaDetail.semesters.length }} 学期</div>
              <div class="analysis-card__sub">
                GPA <b>{{ abilityTrend.first.toFixed(2) }} → {{ abilityTrend.last.toFixed(2) }}</b>
              </div>
              <div class="analysis-card__courses">趋势：{{ abilityTrend.text }}</div>
            </div>
          </div>
        </section>

        <section class="composite">
          <StabilityGauge
            :gpa-values="gpaDetail.semesters.map((s) => s.gpa)"
            :fail-count="failCount"
            :retake-count="retakeCount"
            :low-score-count="lowScoreCount"
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
      </div>

      <!-- 4. 课程难度适应分析 + 四象限 | 7. 培养完成情况 + 毕业达成预测 -->
      <div class="detail-grid">
        <section class="composite">
          <DifficultyScatter :points="coursePoints" />
          <div class="quadrant">
            <div class="quadrant__tabs">
              <button
                v-for="q in quadrants"
                :key="q.key"
                class="quadrant__tab"
                :class="{
                  'quadrant__tab--active': activeQuadrantKey === q.key,
                  [`quadrant__tab--${q.cls}`]: true,
                }"
                @click="activeQuadrantKey = q.key"
              >
                <span class="quadrant__tab-title">{{ q.title }}</span>
                <span class="quadrant__tab-hint">{{ q.hint }}</span>
                <span v-if="q.items.length" class="quadrant__tab-badge">{{ q.items.length }}</span>
              </button>
            </div>
            <div
              v-for="q in quadrants"
              v-show="activeQuadrantKey === q.key"
              :key="`${q.key}-panel`"
              class="quadrant__panel"
              :class="`quadrant__panel--${q.cls}`"
            >
              <p class="quadrant__desc">{{ q.desc }}</p>
              <ul v-if="q.items.length" class="quadrant__list">
                <li v-for="it in q.items" :key="it.name" class="quadrant__item">
                  <span class="quadrant__name">{{ it.name }}</span>
                  <span class="quadrant__score">{{ it.score }}分</span>
                  <span class="quadrant__stars" :title="`难度 ${it.stars.length}/5`">{{ it.stars }}</span>
                </li>
              </ul>
              <div v-else class="quadrant__empty">暂无此类课程</div>
            </div>
            <p class="quadrant__legend">★ 星级表示课程难度，★ 越多难度越高（满分 5 星）</p>
          </div>
        </section>

        <section class="composite">
          <div class="warn-section">
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

      <!-- 5. 同专业对比分析 · 专业位置分析 | 6. 课程能力雷达图 -->
      <div class="detail-grid">
        <MajorPositionChart
          :student-gpa="gpa"
          :major-avg-gpa="gpaDetail.overview.majorAvgGpa"
          :major-rank="majorRank"
          :major-total="majorTotal"
          :major-rank-percent="gpaDetail.overview.majorRankPercent"
        />
        <AbilityRadar :points="coursePoints" :stability-index="stabilityIndex" />
      </div>

      <!-- 帮扶轨迹（横向时间轴） -->
      <SupportTrajectory />

      <!-- 8. 教师指导建议 -->
      <section class="advice">
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
  gap: 12px;
}

/* ── 1. 学业画像 ── */
.portrait {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
  padding: 16px 20px;
  border-radius: 8px;
  background:
    linear-gradient(120deg, rgba(0, 113, 206, 0.22), rgba(3, 12, 34, 0.7)),
    rgba(5, 18, 48, 0.55);
  border: 1px solid rgba(102, 217, 255, 0.2);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.2), inset 0 0 22px rgba(0, 184, 255, 0.07);

  &__left {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  &__status {
    align-self: flex-start;
    padding: 4px 14px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    box-shadow: 0 0 14px rgba(52, 211, 153, 0.35);
  }

  &__score {
    font-size: 16px;
    color: #cfe8ff;
    font-weight: 600;

    b {
      font-size: 34px;
      font-weight: 900;
      color: #f6fbff;
      font-family: 'DIN Alternate', sans-serif;
      margin: 0 2px;
      text-shadow: 0 0 16px rgba(0, 242, 255, 0.4);
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
    gap: 2px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(0, 38, 73, 0.4);
    border: 1px solid rgba(102, 217, 255, 0.12);

    &-label {
      font-size: 12px;
      color: #7eb4d8;
    }

    &-value {
      font-size: 18px;
      font-weight: 800;
      color: #f6fbff;
      font-family: 'DIN Alternate', sans-serif;
    }
  }

  &__right {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-left: 18px;
    border-left: 1px dashed rgba(102, 217, 255, 0.2);
  }

  &__ai-tag {
    align-self: flex-start;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 700;
    color: #8ef6ff;
    background: rgba(0, 184, 255, 0.14);
    border: 1px solid rgba(0, 184, 255, 0.3);
  }

  &__ai-text {
    margin: 0;
    font-size: 15px;
    line-height: 1.8;
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
  gap: 10px;
  min-width: 0;
}

/* ── 2. 成绩能力解析 ── */
.analysis-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.analysis-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.36);
  border: 1px solid rgba(102, 217, 255, 0.12);

  &--good { border-color: rgba(52, 211, 153, 0.3); }
  &--warn { border-color: rgba(240, 192, 64, 0.3); }
  &--blue { border-color: rgba(102, 217, 255, 0.3); }

  &__badge {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 700;
    padding: 1px 8px;
    border-radius: 999px;
    color: #04101f;
    background: #34d399;

    .analysis-card--warn & { background: #f0c040; }
    .analysis-card--blue & { background: #66d9ff; }
  }

  &__main {
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__sub {
    font-size: 13px;
    color: #cfe8ff;

    b { color: #7ff6ff; font-family: 'DIN Alternate', sans-serif; }
  }

  &__courses {
    font-size: 12px;
    line-height: 1.5;
    color: #9ec7e0;
  }
}

/* ── 3. 稳定性评价 ── */
.stab-eval {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    'index index'
    'good warn';
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.36);
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__index {
    grid-area: index;
    font-size: 14px;
    color: #cfe8ff;
    font-weight: 600;

    b {
      font-size: 26px;
      font-weight: 900;
      color: #7ff6c4;
      font-family: 'DIN Alternate', sans-serif;
      margin: 0 4px;
    }
  }

  &__col {
    min-width: 0;
  }

  &__title {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 700;

    &--good { color: #34d399; }
    &--warn { color: #f0c040; }
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  &__item {
    font-size: 12.5px;
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
    font-size: 13px;
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
    font-size: 12px;
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
    font-size: 11px;
    letter-spacing: -1px;
    text-align: left;
    white-space: nowrap;
  }

  &__empty {
    font-size: 12px;
    color: #5a7d96;
  }
}

/* ── 7. 毕业达成预测 ── */
.grad-predict {
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(0, 38, 73, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.12);

  &__title {
    margin: 0 0 8px;
    font-size: 14px;
    font-weight: 700;
    color: #b8ecff;
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  &__bar-label {
    font-size: 13px;
    color: #7eb4d8;
    width: 64px;
    flex-shrink: 0;
  }

  &__track {
    flex: 1;
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 60, 120, 0.45);
    overflow: hidden;
  }

  &__fill {
    height: 100%;
    border-radius: 999px;
    background: linear-gradient(90deg, #34d399, #52e8bf);
  }

  &__bar-value {
    font-size: 13px;
    color: #7ff6ff;
    font-weight: 700;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 3px 0;
    font-size: 13px;
  }

  &__label {
    color: #7eb4d8;
  }

  &__value {
    font-size: 16px;
    font-weight: 800;
    color: #7ff6c4;
    font-family: 'DIN Alternate', sans-serif;
  }

  &__risk {
    color: #ffd27a;
    font-weight: 600;
  }

  &__tags {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 6px;
  }

  &__tag-label {
    font-size: 12px;
    color: #7eb4d8;
  }

  &__tag {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    color: #cfe8ff;
    background: rgba(0, 184, 255, 0.12);
    border: 1px solid rgba(0, 184, 255, 0.25);
  }
}

/* ── 培养完成 ── */
.warn-section {
  padding: 10px 14px;
  border-radius: 5px;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #b8ecff;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 6px;

  &::before {
    content: '';
    width: 3px;
    height: 13px;
    border-radius: 2px;
    background: linear-gradient(180deg, #00e5ff, #00b8ff);
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.45);
  }
}

.completion-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.completion-kpi {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.3);

  &__label { font-size: 13px; color: #7eb4d8; }
  &__value { font-size: 14px; font-weight: 800; color: #f6fbff; }
}

.completion-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;

  &__label { font-size: 14px; color: #7eb4d8; font-weight: 600; width: 90px; flex-shrink: 0; }
  &__bar { flex: 1; height: 6px; border-radius: 999px; background: rgba(0, 60, 120, 0.45); overflow: hidden; }
  &__inner { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #00b8ff, #00e5ff); }
  &__percent { font-size: 14px; color: #7ff6ff; font-weight: 700; font-family: var(--student-font-number); width: 40px; text-align: right; flex-shrink: 0; }
}

.completion-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 14px;

  &__label { color: #7eb4d8; font-weight: 600; width: 90px; flex-shrink: 0; }
  &__value { color: #d0e8f8;
    &.is-safe { color: #55e995; }
    &.is-warn { color: #ff9b7a; }
  }
}

.credit-bucket-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 6px;
}

.credit-bucket {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.25);
  font-size: 13px;

  &__label { color: #7eb4d8; width: 70px; flex-shrink: 0; }
  &__bar { flex: 1; height: 5px; border-radius: 999px; background: rgba(0, 60, 120, 0.45); overflow: hidden; }
  &__inner { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #20c997, #52e8bf); }
  &__value { color: #d0e8f8; font-weight: 700; font-family: var(--student-font-number); width: 50px; text-align: right; flex-shrink: 0; }
}

/* ── 8. 教师指导建议 ── */
.advice {
  padding: 14px 16px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.14), rgba(3, 12, 34, 0.7)),
    rgba(5, 18, 48, 0.5);
  border: 1px solid rgba(102, 217, 255, 0.18);

  &__title {
    margin: 0 0 12px;
    font-size: 17px;
    font-weight: 700;
    color: #f4fbff;
    text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
}

.advice-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px;
  border-radius: 8px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.14);
  border-top: 3px solid #34d399;

  &--green { border-top-color: #34d399; }
  &--yellow { border-top-color: #f0c040; }
  &--blue { border-top-color: #66d9ff; }

  &__tag {
    align-self: flex-start;
    padding: 2px 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 800;
    color: #04101f;
    background: #34d399;

    .advice-card--yellow & { background: #f0c040; }
    .advice-card--blue & { background: #66d9ff; }
  }

  &__head {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
    color: #f6fbff;
  }

  &__text {
    margin: 0;
    font-size: 13px;
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
    font-size: 15px;
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
  font-size: 14px;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 320px;
  font-size: 15px;
  color: rgba(184, 236, 255, 0.7);

  &.error { color: #f87171; flex-direction: column; }

  button {
    padding: 4px 14px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.3);
    background: rgba(0, 184, 255, 0.1);
    color: #55dfff;
    cursor: pointer;
    font-size: 15px;

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
  border-color: rgba(0, 206, 255, 0.42);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.2),
    inset 0 0 24px rgba(0, 184, 255, 0.12);
}

.detail-grid > .composite {
  padding: 12px;
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.1), rgba(3, 12, 34, 0.5)),
    rgba(5, 18, 48, 0.32);
  border: 1px solid rgba(0, 206, 255, 0.42);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.2),
    inset 0 0 24px rgba(0, 184, 255, 0.1);
}

:deep(.chart-card),
:deep(.support-card) {
  border-color: rgba(0, 206, 255, 0.42);
}

@media (max-width: 1280px) {
  .portrait { grid-template-columns: 1fr; }
  .portrait__right { padding-left: 0; border-left: none; border-top: 1px dashed rgba(102, 217, 255, 0.2); padding-top: 12px; }
  .detail-grid { grid-template-columns: 1fr; }
  .advice__grid { grid-template-columns: 1fr; }
}
</style>
