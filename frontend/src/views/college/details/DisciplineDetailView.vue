<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { disciplineService } from '@/api/college/services/discipline'
import { useScope } from '@/composables/useScope'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { DisciplineOverviewDetailVM } from '@/types/college/view/discipline-overview'
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

function formatChange(change: number) {
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '→'
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

const leadMajor = computed(() => {
  if (!data.value?.majorRankings.length) return null
  return [...data.value.majorRankings].sort((a, b) => a.currentRank - b.currentRank)[0]
})

const worstMajor = computed(() => {
  if (!data.value?.majorRankings.length) return null
  return [...data.value.majorRankings].sort((a, b) => b.currentRank - a.currentRank)[0]
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
  if (!leadMajor.value || !worstMajor.value) return ''
  const gap = worstMajor.value.currentRank - leadMajor.value.currentRank
  const bestTrend = bestProfile.value?.judgment.trendSummary ?? ''
  const worstPrio = worstProfile.value?.judgment.priorities ?? []
  const lead = leadMajor.value
  const worst = worstMajor.value
  return `${bestTrend}。${lead.major} 与 ${worst.major} 全国排名相差约 ${gap} 位，呈明显梯队分布；建议以 ${lead.major} 为标杆，把增量资源向 ${worst.major} 倾斜，优先落实：${worstPrio.join('、')}。`
})

const insights = computed(() => {
  if (!data.value) return []
  const lead = leadMajor.value
  const rising = data.value.majorRankings.filter((m) => m.yoyChange > 0)
  const flat = data.value.majorRankings.filter((m) => m.yoyChange === 0)
  return [
    {
      title: '头部专业带动明显',
      detail: lead
        ? `${lead.major} 全国第 ${lead.currentRank}、${lead.grade} 级，较上年 ${formatChange(lead.yoyChange)}，是学院专业矩阵的压舱石。`
        : '头部专业贡献主要排名红利。',
      tone: 'good' as const,
    },
    {
      title: rising.length ? '上升通道仍在打开' : '部分专业进入平台期',
      detail: rising.length
        ? `${rising.map((m) => shortMajor(m.major)).join('、')} 排名上行；建议把增量资源继续投向可冲击更高等级的赛道。`
        : `${flat.map((m) => shortMajor(m.major)).join('、') || '部分专业'} 排名持平，需用标志性成果打破平台期。`,
      tone: rising.length ? ('info' as const) : ('warn' as const),
    },
    {
      title: '对标差距可拆解',
      detail: data.value.radarConclusion || data.value.benchmarkNote || '五维诊断与横向对标可定位短板优先级。',
      tone: 'info' as const,
    },
  ]
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

const provincialBarOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const items = [...data.value.provincialComparison].reverse()
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
      data: items.map((i) => i.school.replace('大学', '')),
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
  <CollegeDetailLayout>
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
        <div class="resource-summary resource-summary--4">
          <div
            v-for="item in data.majorRankings"
            :key="item.major"
            class="resource-summary__card"
            @click="switchTab('profile', { major: item.major })"
          >
            <span class="resource-summary__icon">{{ item.grade }}</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">{{ shortMajor(item.major) }}</span>
              <strong class="resource-summary__value">第{{ item.currentRank }}<small>名</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('grade-history')">
            <span class="resource-summary__icon">📈</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">上行专业</span>
              <strong class="resource-summary__value resource-summary__value--ok">
                {{ data.majorRankings.filter((m) => m.yoyChange > 0).length }}<small>个</small>
              </strong>
            </div>
          </div>
        </div>

        <section id="major-table" class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📋</span>
            三个本科专业总览
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
                <em>{{ item.grade }}级</em>
              </header>
              <div class="major-card__grid">
                <div><span>全国</span><b>第{{ item.currentRank }}</b></div>
                <div><span>较上年</span><b>{{ formatChange(item.yoyChange) }}</b></div>
                <div><span>省内</span><b>第{{ item.provincialRank }}</b></div>
                <div><span>财经类</span><b>第{{ item.financePeerRank }}</b></div>
              </div>
            </button>
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
                  全国第 {{ leadMajor?.currentRank }} 名 · {{ leadMajor?.grade }} 级 · 较上年 {{ formatChange(leadMajor?.yoyChange ?? 0) }}
                </p>
                <p class="judgment-pick__why"><b>为什么最好：</b>{{ bestReasons.join('；') }}</p>
              </div>
              <div class="judgment-pick judgment-pick--worst">
                <h4>⚠️ 待提升专业 · {{ worstMajor?.major }}</h4>
                <p class="judgment-pick__rank">
                  全国第 {{ worstMajor?.currentRank }} 名 · {{ worstMajor?.grade }} 级 · 较上年 {{ formatChange(worstMajor?.yoyChange ?? 0) }}
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
              <h2>{{ profile.name }} <em>{{ profile.grade }}级</em></h2>
              <p>{{ profile.orientation }}</p>
            </div>
            <div class="profile-hero__meta">
              <span>全国第 {{ profile.officialRank }}</span>
              <span>软科第 {{ profile.softRank }}</span>
              <span>在校 {{ profile.studentCount }} 人</span>
            </div>
          </div>

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
              <li><span>办学年限</span><strong>{{ profile.foundedYears }} 年</strong></li>
              <li><span>认证 / 评级</span><strong>{{ profile.accreditation }}</strong></li>
              <li><span>建设类型</span><strong>{{ profile.constructionType }}</strong></li>
              <li><span>官方 / 软科</span><strong>第{{ profile.officialRank }} / 第{{ profile.softRank }}</strong></li>
              <li><span>年度招生</span><strong>{{ profile.enrollmentPlan }} 人</strong></li>
              <li><span>在校生</span><strong>{{ profile.studentCount }} 人</strong></li>
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
              <li><span>去向落实率</span><strong>{{ profile.cultivation.employmentRate }}%</strong></li>
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
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📉</span>全国排名近年趋势</h2>
          <p class="resource-section__desc">排名越低越好（图中纵轴已反转）。可观察三专业全国位次演化。</p>
          <div class="resource-card">
            <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="nationalTrendOption" /></div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🗺️</span>省内位置对比</h2>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>省内高校对比</h3>
              <div class="resource-card__chart"><ChartContainer :option="provincialBarOption" /></div>
            </div>
            <div class="resource-card">
              <h3>财经类位置（前序高校）</h3>
              <ul class="rank-list">
                <li v-for="item in data.financeAheadSchools" :key="item.school">
                  <span>{{ item.school }}</span>
                  <strong>第{{ item.rank }}名</strong>
                </li>
              </ul>
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
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🔍</span>深度挖掘 · 专业发展</h2>
          <p class="resource-section__desc">在看板之外给出结构结论与可执行建议，支撑下一年度建设优先级。</p>
          <div class="insight-grid">
            <article v-for="item in insights" :key="item.title" class="insight-card" :class="`insight-card--${item.tone}`">
              <h4>{{ item.title }}</h4>
              <p>{{ item.detail }}</p>
            </article>
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

@media (max-width: 1280px) {
  .resource-summary,
  .major-cards,
  .grade-history,
  .insight-grid { grid-template-columns: 1fr; }
  .resource-section__grid--2,
  .kv-grid { grid-template-columns: 1fr; }
  .profile-hero { flex-direction: column; align-items: flex-start; }
  .judgment-bestworst { grid-template-columns: 1fr; }
}
</style>
