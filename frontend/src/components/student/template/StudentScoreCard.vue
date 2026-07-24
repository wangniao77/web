<script setup lang="ts">
import { computed } from 'vue'
import type { IconKind } from '@/components/college/DashIcon.vue'
import CoreHeroGauge from '@/components/college/modules/center-hub/CoreHeroGauge.vue'
import StudentTplCard from './StudentTplCard.vue'
import StuHint from './StuHint.vue'
import type {
  AcademicDevVM,
  CompetitionVM,
  CreditProgressVM,
  EmploymentVM,
  GrowthOverviewVM,
  GrowthPortraitVM,
  HealthVM,
  InternshipVM,
  PersonalInfoVM,
  QualityVM,
} from '@/types/student/view'
import type { OverviewHubVM } from '@/types/college/view'
import { scoreToneFromValue, levelToneFromText } from '@/utils/scoreTone'

const props = defineProps<{
  growthOverview: GrowthOverviewVM
  growthPortrait: GrowthPortraitVM
  academic: AcademicDevVM
  health: HealthVM
  employment: EmploymentVM
  profile: PersonalInfoVM
  credit: CreditProgressVM
  competition: CompetitionVM
  internship: InternshipVM
  quality: QualityVM
  scholarships: Array<{ name: string; year: string }>
}>()

const score = computed(() => props.growthOverview.growthIndex)
const mentalLevel = computed(() => props.profile.mentalLevel || '未评估')
const gpaDelta = computed(() => props.growthOverview.gpaDelta ?? 0)

const indexTrendArrow = computed(() => {
  if (gpaDelta.value > 0.02) return { symbol: '↑', text: '指数上升', tone: 'up' as const }
  if (gpaDelta.value < -0.02) return { symbol: '↓', text: '指数回落', tone: 'down' as const }
  return { symbol: '→', text: '指数持平', tone: 'flat' as const }
})

const academicDeltaText = computed(() => {
  const d = gpaDelta.value
  if (d > 0.02) return `↑${(d * 10).toFixed(1)}`
  if (d < -0.02) return `↓${(Math.abs(d) * 10).toFixed(1)}`
  return '→0.0'
})

const academicDeltaMark = computed(() => {
  const d = gpaDelta.value
  if (d > 0.02) return `↑${(d * 10).toFixed(1)}`
  if (d < -0.02) return `↓${(Math.abs(d) * 10).toFixed(1)}`
  return ''
})

/** 用近学期 GPA 轨迹映射为综合指数走势（中心值锚定当前综合发展指数） */
const SPARK_VB = { w: 320, h: 96, padL: 28, padR: 10, padT: 22, padB: 10 }

const indexSparkMeta = computed(() => {
  const raw = props.academic.gpaValues?.length ? props.academic.gpaValues : [props.academic.gpa]
  /** 固定近 4 学期：不足则向前回填，保证折线有 4 个标注点 */
  const series = raw.length >= 4
    ? raw.slice(-4)
    : Array.from({ length: 4 }, (_, i) => {
        const src = raw[Math.min(i, raw.length - 1)] ?? props.academic.gpa ?? 3
        const drift = (i - 3) * 0.04
        return Math.max(1.5, Math.min(4.5, src + drift))
      })
  const last = series[series.length - 1] || 1
  const values = series.map((g) => Math.max(40, Math.min(100, score.value + (g - last) * 18)))
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const pad = Math.max(2, (dataMax - dataMin) * 0.35 || 4)
  const min = Math.max(40, Math.floor(dataMin - pad))
  const max = Math.min(100, Math.ceil(dataMax + pad))
  const span = Math.max(1, max - min)
  const n = Math.max(1, values.length - 1)
  const { padL, padR, padT, padB, w, h } = SPARK_VB
  const plotW = w - padL - padR
  const plotH = h - padT - padB
  const yAt = (v: number) => padT + plotH - ((v - min) / span) * plotH
  const points = values.map((value, index) => ({
    value,
    x: padL + (index / n) * plotW,
    y: yAt(value),
  }))
  const mid = Math.round((min + max) / 2)
  const yTicks = [max, mid, min]
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .map((value) => ({ value, y: yAt(value) }))
  return {
    points,
    min,
    max,
    yTicks,
    axis: {
      x1: padL,
      x2: padL + plotW,
      y1: padT,
      y2: padT + plotH,
    },
  }
})

const indexSpark = computed(() => indexSparkMeta.value.points)
const indexSparkPoints = computed(() => indexSpark.value.map((point) => `${point.x},${point.y}`).join(' '))
const indexSparkSummary = computed(() => {
  const values = indexSpark.value.map((p) => p.value)
  return `${values[0].toFixed(0)} → ${values[values.length - 1].toFixed(0)}`
})
const indexSparkAxis = computed(() => indexSparkMeta.value.axis)
const indexSparkYTicks = computed(() => indexSparkMeta.value.yTicks)

/** 与数据点数值重合的 Y 轴刻度不再重复标注，避免左侧数字叠在一起 */
const indexSparkVisibleYTicks = computed(() => {
  const pointValues = indexSpark.value.map((point) => Math.round(point.value))
  return indexSparkYTicks.value.filter((tick) => (
    !pointValues.some((value) => Math.abs(value - tick.value) < 1.5)
  ))
})

function sparkValStyle(point: { x: number; y: number }, index: number, total: number) {
  const left = (point.x / SPARK_VB.w) * 100
  const top = (point.y / SPARK_VB.h) * 100
  let transform = 'translate(-50%, calc(-100% - 5px))'
  if (index === 0) transform = 'translate(0, calc(-100% - 5px))'
  else if (index === total - 1) transform = 'translate(-100%, calc(-100% - 5px))'
  return { left: `${left}%`, top: `${top}%`, transform }
}

/** 近 4 学期横轴：优先用接口学期名，否则按「大X上/下」回填 */
const TERM_LABELS = ['大一上', '大一下', '大二上', '大二下'] as const

function normalizeSemesterLabel(raw: string, fallbackIndex: number): string {
  const t = raw.trim()
  if (/大[一二三四][上下]/.test(t)) return t.match(/大[一二三四][上下]/)![0]
  if (/大[一二三四]/.test(t) && /[上下]/.test(t)) {
    const y = t.match(/大[一二三四]/)![0]
    const half = t.includes('下') ? '下' : '上'
    return `${y}${half}`
  }
  if (/^[一二三四]年级/.test(t) || /^大[一二三四]$/.test(t)) {
    const map: Record<string, string> = { 一: '大一', 二: '大二', 三: '大三', 四: '大四' }
    const key = (t.match(/[一二三四]/) || [])[0]
    const year = key ? map[key] : TERM_LABELS[fallbackIndex % 4].slice(0, 2)
    const half = /下|春|第2|第二/.test(t) ? '下' : '上'
    return `${year}${half}`
  }
  return TERM_LABELS[fallbackIndex] ?? `第${fallbackIndex + 1}学期`
}

const indexSparkSemesters = computed(() => {
  const fromApi = (props.academic.semesters ?? []).filter(Boolean)
  if (fromApi.length >= 4) {
    return fromApi.slice(-4).map((s, i) => normalizeSemesterLabel(s, i))
  }
  return [...TERM_LABELS]
})

const scholarshipCountText = computed(() => `${props.scholarships.length}次`)

const competitionCountText = computed(() => {
  const n = props.competition.awardCount || props.competition.highlights.filter((h) => h.label && !h.label.includes('暂无')).length
  return `${n}次`
})

function padPeers(
  list: Array<{ name: string; rank: number }> | undefined,
  count: number,
  mode: 'top' | 'bottom',
  total: number,
) {
  const base = (list ?? []).slice(0, count).map((p) => ({ name: p.name, rank: p.rank }))
  while (base.length < count) {
    const i = base.length + 1
    if (mode === 'top') {
      base.push({ name: `同学甲${i}`, rank: i })
    } else {
      base.push({ name: `同学乙${i}`, rank: Math.max(1, total - count + i) })
    }
  }
  return base
}

const hub = computed<OverviewHubVM>(() => {
  const academicScore = props.growthPortrait.personal[0] ?? 0
  const qualityScore = props.growthOverview.qualityScore
  const careerScore = props.employment.jobReadiness
  const total = props.growthOverview.overallTotal || 120
  const rank = props.growthOverview.overallRank || 1

  const ahead = (props.growthOverview.neighborsAhead ?? []).map((n) => ({
    name: n.name,
    rank: n.rank,
  }))
  const behind = (props.growthOverview.neighborsBehind ?? []).map((n) => ({
    name: n.name,
    rank: n.rank,
  }))

  return {
    developmentIndex: score.value,
    maxScore: 100,
    starLevel: 0,
    centerRankText: `年级排名 ${rank}/${total}`,
    centerDelta: academicDeltaMark.value || '→0.0',
    rankPeers: {
      tip: '同年级排名示意（前三 / 后三），名单为演示占位',
      top: padPeers(ahead.length ? ahead : undefined, 3, 'top', total),
      bottom: padPeers(behind.length ? behind : undefined, 3, 'bottom', total),
    },
    kpis: [
      {
        label: '学业发展',
        value: academicScore.toFixed(1),
        valueDelta: academicDeltaMark.value || undefined,
        icon: 'academic' as IconKind,
        position: 'tl',
        scoreTone: scoreToneFromValue(academicScore),
        tip: `推免参考：学分进度与专业排名。变化 ${academicDeltaText.value}`,
        details: [
          {
            label: '已修学分',
            value: `${props.credit.earned}/${props.credit.required}`,
            tip: '已获学分 / 毕业要求学分。',
          },
          {
            label: '专业排名',
            value: props.academic.majorTotal
              ? `${props.academic.majorRank}/${props.academic.majorTotal}`
              : '—',
            tip: '本专业内相对位置；名次越小越好。',
          },
        ],
      },
      {
        label: '综合素养',
        value: `${qualityScore.toFixed(1)}`,
        icon: 'trophy' as IconKind,
        position: 'tr',
        scoreTone: scoreToneFromValue(qualityScore),
        tip: '由综测、奖学金、竞赛综合测算（科研低权重计入，暂不展示）。',
        details: [
          {
            label: '奖学金',
            value: scholarshipCountText.value,
            tip: '已获得奖学金次数。',
          },
          {
            label: '竞赛获奖',
            value: competitionCountText.value,
            tip: '学科竞赛、创新创业等获奖次数。',
          },
        ],
      },
      {
        label: '身心状态',
        value: String(props.health.mentalHealth),
        levelText: mentalLevel.value,
        icon: 'mental' as IconKind,
        position: 'bl',
        scoreTone: levelToneFromText(mentalLevel.value),
        tip: '体测与心理测评；及格率等学业指标已挪到学业模块。',
        details: [
          {
            label: '体测',
            value: props.academic.physicalTestScore ? String(props.academic.physicalTestScore) : '未接入',
            tip: '体质健康测试成绩；未接入表示体测数据尚未同步。',
          },
          {
            label: '心理测评',
            value: mentalLevel.value,
            tip: '心理测评结论/关注结论；中高关注需辅导员跟进。',
          },
        ],
      },
      {
        label: '生涯发展',
        value: careerScore.toFixed(1),
        icon: 'employment' as IconKind,
        position: 'br',
        scoreTone: scoreToneFromValue(careerScore),
        tip: '实习与证书准备度；实习可由学生自填。',
        details: [
          {
            label: '实习经历',
            value: props.internship.internshipCount
              ? `${props.internship.internshipCount}项`
              : '待自填',
            tip: '已登记实习次数。',
          },
          {
            label: '专业证书',
            value: `${props.internship.certificateCount}项`,
            tip: '与专业相关的资格/技能证书数量。',
          },
        ],
      },
    ],
  }
})

const centerTip =
  '综合发展指数综合反映学业、素养与生涯表现。悬停中心可查看同专业排名前三/后三（示意）。'
</script>

<template>
  <StudentTplCard title="" hide-header class="stu-tpl__score">
    <div class="cockpit-hero stu-score-hero">
      <CoreHeroGauge
        :data="hub"
        center-label="综合发展指数"
        :center-tip="centerTip"
      />

      <div class="stu-rank-band">
        <StuHint tip="近 4 学期综合指数折线；横轴按学期（大一上/下等）；每个数据点上方标注具体指数值。" block class="stu-rank-band__spark-wrap">
          <div class="stu-rank-band__spark-card">
            <div class="stu-rank-band__spark-head">
              <span>近4学期综合指数</span>
              <strong :class="`is-${indexTrendArrow.tone}`">{{ indexSparkSummary }}</strong>
            </div>
            <div class="stu-rank-band__legend" aria-label="字色语义">
              <i class="is-up">绿升/平稳</i>
              <i class="is-down">红降</i>
              <i class="is-ok">青正常</i>
              <i class="is-warn">黄关注</i>
            </div>
            <div class="stu-rank-band__chart">
              <svg
                class="stu-rank-band__spark"
                :viewBox="`0 0 ${SPARK_VB.w} ${SPARK_VB.h}`"
                preserveAspectRatio="none"
                role="img"
                aria-label="综合指数趋势"
              >
                <!-- 网格 -->
                <line
                  v-for="tick in indexSparkYTicks"
                  :key="`grid-${tick.value}`"
                  :x1="indexSparkAxis.x1"
                  :x2="indexSparkAxis.x2"
                  :y1="tick.y"
                  :y2="tick.y"
                  class="stu-rank-band__spark-grid"
                />
                <!-- Y 轴 -->
                <line
                  :x1="indexSparkAxis.x1"
                  :y1="indexSparkAxis.y1"
                  :x2="indexSparkAxis.x1"
                  :y2="indexSparkAxis.y2"
                  class="stu-rank-band__spark-axis"
                />
                <!-- X 轴 -->
                <line
                  :x1="indexSparkAxis.x1"
                  :y1="indexSparkAxis.y2"
                  :x2="indexSparkAxis.x2"
                  :y2="indexSparkAxis.y2"
                  class="stu-rank-band__spark-axis"
                />
                <!-- 刻度短线 -->
                <line
                  v-for="tick in indexSparkYTicks"
                  :key="`ytick-${tick.value}`"
                  :x1="indexSparkAxis.x1 - 3"
                  :x2="indexSparkAxis.x1"
                  :y1="tick.y"
                  :y2="tick.y"
                  class="stu-rank-band__spark-axis"
                />
                <line
                  v-for="point in indexSpark"
                  :key="`xtick-${point.x}`"
                  :x1="point.x"
                  :x2="point.x"
                  :y1="indexSparkAxis.y2"
                  :y2="indexSparkAxis.y2 + 3"
                  class="stu-rank-band__spark-axis"
                />
                <polyline
                  :points="indexSparkPoints"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <circle
                  v-for="point in indexSpark"
                  :key="`${point.x}-${point.value}`"
                  :cx="point.x"
                  :cy="point.y"
                  r="3.4"
                />
              </svg>
              <!-- Y 轴刻度文字（HTML，避免被拉伸变形） -->
              <span
                v-for="tick in indexSparkVisibleYTicks"
                :key="`ylab-${tick.value}`"
                class="stu-rank-band__y-label"
                :style="{ top: `${(tick.y / SPARK_VB.h) * 100}%` }"
              >{{ tick.value }}</span>
              <span
                v-for="(point, idx) in indexSpark"
                :key="`val-${point.x}-${point.value}`"
                class="stu-rank-band__spark-val"
                :class="{
                  'is-first': idx === 0,
                  'is-last': idx === indexSpark.length - 1,
                }"
                :style="sparkValStyle(point, idx, indexSpark.length)"
              >{{ point.value.toFixed(0) }}</span>
            </div>
            <div
              class="stu-rank-band__spark-labels"
              :style="{
                gridTemplateColumns: `repeat(${indexSparkSemesters.length || 1}, minmax(0, 1fr))`,
                paddingLeft: `${(SPARK_VB.padL / SPARK_VB.w) * 100}%`,
                paddingRight: `${(SPARK_VB.padR / SPARK_VB.w) * 100}%`,
              }"
            >
              <span v-for="(label, idx) in indexSparkSemesters" :key="`${label}-${idx}`">{{ label }}</span>
            </div>
          </div>
        </StuHint>
      </div>
    </div>
  </StudentTplCard>
</template>
