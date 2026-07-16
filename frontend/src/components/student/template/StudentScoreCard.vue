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
import { levelToneFromText, scoreToneFromValue } from '@/utils/scoreTone'

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
const starCount = computed(() => Math.min(5, Math.round(score.value / 18)))
const mentalLevel = computed(() => props.profile.mentalLevel || '未评估')

const passRate = computed(() => {
  const total = props.academic.totalCourses || 0
  if (!total) return '—'
  const failedHint = props.academic.failedElective?.length || 0
  return `${Math.max(0, Math.round(((total - failedHint) / total) * 100))}%`
})

const gpaDelta = computed(() => props.growthOverview.gpaDelta ?? 0)
const gradeRankDelta = computed(() => props.growthOverview.gradeRankDelta ?? 0)

const gpaTrendArrow = computed(() => {
  if (gpaDelta.value > 0.02) return { symbol: '↑', text: `+${gpaDelta.value.toFixed(2)}`, tone: 'up' as const }
  if (gpaDelta.value < -0.02) return { symbol: '↓', text: gpaDelta.value.toFixed(2), tone: 'down' as const }
  return { symbol: '→', text: '持平', tone: 'flat' as const }
})

const gpaSpark = computed(() => {
  const values = props.academic.gpaValues?.length ? props.academic.gpaValues : [props.academic.gpa]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(0.05, max - min)
  return values.map((value, index) => ({
    value,
    x: 8 + (index / Math.max(1, values.length - 1)) * 204,
    y: 52 - ((value - min) / span) * 40,
  }))
})

const gpaSparkPoints = computed(() => gpaSpark.value.map((point) => `${point.x},${point.y}`).join(' '))
const gpaSparkSummary = computed(() => {
  const values = props.academic.gpaValues?.length ? props.academic.gpaValues : [props.academic.gpa]
  return `${values[0].toFixed(2)} → ${values[values.length - 1].toFixed(2)}`
})
const gpaSparkSemesters = computed(() => {
  const labels = props.academic.semesters?.length
    ? props.academic.semesters
    : ['大一', '大二上', '大二下', '近学期'].slice(-gpaSpark.value.length)
  return labels.slice(-gpaSpark.value.length)
})

const rankTrendArrow = computed(() => {
  // gradeRankDelta < 0 means rank number improved (moved up)
  if (gradeRankDelta.value < 0) return { symbol: '↑', text: '名次前进', tone: 'up' as const }
  if (gradeRankDelta.value > 0) return { symbol: '↓', text: '名次后退', tone: 'down' as const }
  return { symbol: '→', text: '名次持平', tone: 'flat' as const }
})

const neighborsAhead = computed(() => props.growthOverview.neighborsAhead ?? [])
const neighborsBehind = computed(() => props.growthOverview.neighborsBehind ?? [])

function formatNeighbor(n: { name: string; gpa: number; rank: number }) {
  return `${n.name} ${n.gpa.toFixed(2)}`
}

const centerTip =
  '综合发展指数综合反映学业、素养、身心与生涯四维表现。配色：60分以下偏弱（红）、60–79中等（黄）、80及以上较好（蓝）。下方展示同年级 GPA 排名与邻域同学。'

const hub = computed<OverviewHubVM>(() => {
  const academicScore = props.growthPortrait.personal[0] ?? 0
  const qualityScore = props.growthOverview.qualityScore
  const careerScore = props.employment.jobReadiness

  return {
    developmentIndex: score.value,
    maxScore: 100,
    starLevel: starCount.value,
    centerDelta: undefined,
    kpis: [
      {
        label: '学业发展',
        value: academicScore.toFixed(1),
        icon: 'academic' as IconKind,
        position: 'tl',
        scoreTone: scoreToneFromValue(academicScore),
        tip: '看学习成果：成绩、及格情况、学分进度和专业排名。分数越低越需要学业帮扶。',
        details: [
          {
            label: 'GPA',
            value: props.academic.gpa.toFixed(2),
            tip: '平均学分绩点，反映课程学习质量。一般 3.0 以上较稳，过低需重点关注。',
          },
          {
            label: '年级排名',
            value: props.growthOverview.overallTotal
              ? `${props.growthOverview.overallRank}/${props.growthOverview.overallTotal}`
              : '—',
            tip: '同年级 GPA 排名。分子是名次，分母是年级人数，名次越小越好。',
          },
          {
            label: '学分完成率',
            value: `${props.credit.earnedPercent}%`,
            tip: '相对毕业要求已完成的学分比例，用于判断学业进度是否落后。',
          },
          {
            label: '专业排名',
            value: props.academic.majorTotal
              ? `${props.academic.majorRank}/${props.academic.majorTotal}`
              : '—',
            tip: '本专业内相对位置。分子是名次，分母是专业人数，名次越小越好。',
          },
        ],
      },
      {
        label: '综合素养',
        value: qualityScore.toFixed(1),
        icon: 'trophy' as IconKind,
        position: 'tr',
        scoreTone: scoreToneFromValue(qualityScore),
        tip: '看综合素质：奖学金、竞赛、科研与志愿服务等第二课堂表现。',
        details: [
          {
            label: '奖学金',
            value: `${props.scholarships.length}项`,
            tip: '已获得的奖学金次数，体现学业与综合表现的阶段性共鸣。',
          },
          {
            label: '竞赛获奖',
            value: `${props.competition.awardCount}项`,
            tip: '学科竞赛、创新创业等获奖次数，反映实践创新能力。',
          },
          {
            label: '科研项目',
            value: `${props.competition.researchCount}项`,
            tip: '参与科研/大创等项目数量，体现研究与团队协作经历。',
          },
          {
            label: '志愿服务',
            value: `${props.quality.volunteerHours}小时`,
            tip: '累计志愿服务时长，体现社会责任与公益参与。',
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
        tip: '看体能与心理关注情况。显示「未评估」表示相关数据尚未接入或暂无等级。',
        details: [
          {
            label: '体测',
            value: props.academic.physicalTestScore ? String(props.academic.physicalTestScore) : '未接入',
            tip: '体质健康测试成绩。未接入表示体测数据尚未同步到本驾驶舱。',
          },
          {
            label: '关注等级',
            value: mentalLevel.value,
            tip: '心理工作关注分级。正常/低关注较安全；中高关注需辅导员跟进。',
          },
          {
            label: '及格率',
            value: passRate.value,
            tip: '已修课程中及格课程占比。',
          },
        ],
      },
      {
        label: '生涯发展',
        value: careerScore.toFixed(1),
        icon: 'employment' as IconKind,
        position: 'br',
        scoreTone: scoreToneFromValue(careerScore),
        tip: '看就业准备度：实习、证书与项目经历，反映从校园迈向职场的就绪程度。',
        details: [
          {
            label: '实习经历',
            value: `${props.internship.internshipCount}项`,
            tip: '已登记的实习/实践次数。有岗位实战经历更有利于求职与升学。',
          },
          {
            label: '专业证书',
            value: `${props.internship.certificateCount}项`,
            tip: '与专业相关的资格/技能证书数量，是简历中的硬能力证明。',
          },
          {
            label: '项目经历',
            value: `${props.internship.projectCount}项`,
            tip: '课程/竞赛/企业等项目经历条数，体现动手与协作能力。',
          },
        ],
      },
    ],
  }
})
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
        <div class="stu-rank-band__main">
          <StuHint tip="同年级按 GPA 的 dense rank；箭头表示 GPA 与名次近期变化。" block>
            <div class="stu-rank-band__head">
              <span>年级排名</span>
              <strong>
                {{ growthOverview.overallRank }}
                <small>/ {{ growthOverview.overallTotal || '—' }}</small>
              </strong>
              <em class="stu-rank-band__trend" :class="`is-${gpaTrendArrow.tone}`">
                GPA {{ gpaTrendArrow.symbol }}{{ gpaTrendArrow.text }}
              </em>
              <em class="stu-rank-band__trend" :class="`is-${rankTrendArrow.tone}`">
                {{ rankTrendArrow.symbol }}{{ rankTrendArrow.text }}
              </em>
            </div>
          </StuHint>

          <div class="stu-rank-band__rows">
            <StuHint tip="成绩更好、排在该生前面的同学（最多 3 人）。" block>
              <p>
                <em>前三名</em>
                <span v-if="neighborsAhead.length">{{ neighborsAhead.map(formatNeighbor).join(' · ') }}</span>
                <span v-else>暂无（已接近年级前列）</span>
              </p>
            </StuHint>
            <StuHint tip="成绩稍弱、排在该生后面的同学（最多 3 人）。" block>
              <p>
                <em>后三名</em>
                <span v-if="neighborsBehind.length">{{ neighborsBehind.map(formatNeighbor).join(' · ') }}</span>
                <span v-else>暂无（已接近年级末位）</span>
              </p>
            </StuHint>
          </div>
        </div>

        <StuHint :tip="`GPA 近学期趋势：${academic.gpaValues.join(' → ') || academic.gpa.toFixed(2)}`" block class="stu-rank-band__spark-wrap">
          <div class="stu-rank-band__spark-card">
            <div class="stu-rank-band__spark-head">
              <span>近{{ gpaSpark.length }}学期 GPA</span>
              <strong :class="`is-${gpaTrendArrow.tone}`">{{ gpaSparkSummary }}</strong>
            </div>
            <svg class="stu-rank-band__spark" viewBox="0 0 220 60" preserveAspectRatio="none" role="img" aria-label="近学期 GPA 趋势">
              <path d="M8 52H212" class="stu-rank-band__spark-axis" />
              <polyline :points="gpaSparkPoints" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
              <circle
                v-for="point in gpaSpark"
                :key="`${point.x}-${point.value}`"
                :cx="point.x"
                :cy="point.y"
                r="3.2"
              />
            </svg>
            <div class="stu-rank-band__spark-labels" :style="{ gridTemplateColumns: `repeat(${gpaSparkSemesters.length || 1}, minmax(0, 1fr))` }">
              <span v-for="(label, idx) in gpaSparkSemesters" :key="`${label}-${idx}`">{{ label }}</span>
            </div>
          </div>
        </StuHint>
      </div>
    </div>
  </StudentTplCard>
</template>
