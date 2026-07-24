<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import MockText from '@/components/common/MockText.vue'
import EnrollmentEmploymentDetailContent from '@/components/college/modules/enrollment-employment/EnrollmentEmploymentDetailContent.vue'
import StudentRosterPanel from '@/components/college/modules/student-dev/StudentRosterPanel.vue'
import type { RosterStudentDTO } from '@/api/college/details'
import { collegeDetailService } from '@/api/college/services/details'
import { enrollmentEmploymentService } from '@/api/college/services/enrollment-employment'
import { studentDevService } from '@/api/college/services/student-dev'
import { useScope } from '@/composables/useScope'
import { isMockField } from '@/composables/useMockFields'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { EnrollmentEmploymentFocus } from '@/types/college/api/enrollment-employment'
import type { HighPotentialModuleId, WarningCategoryType } from '@/types/college/api/high-potential'
import type { EnrollmentEmploymentDetailVM } from '@/types/college/view/enrollment-employment'
import type {
  StudentDevDetailVM,
  StudentFlowSankeyVM,
} from '@/types/college/view/student-dev-quality'
import type { EChartsOption } from 'echarts'

const route = useRoute()
const router = useRouter()
const { collegeScope } = useScope()

const data = ref<StudentDevDetailVM | null>(null)
const eeData = ref<EnrollmentEmploymentDetailVM | null>(null)
const flowSankey = ref<StudentFlowSankeyVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

type TabKey = 'overview' | 'admission' | 'employment' | 'high-potential' | 'warning-center'

const TAB_KEYS: TabKey[] = ['overview', 'admission', 'employment', 'high-potential', 'warning-center']

const currentTab = ref<TabKey>('overview')
const eeFocus = ref<EnrollmentEmploymentFocus | string | null>('overview')
const tabBarRef = ref<HTMLElement | null>(null)
const activeSection = ref('')

type BreakdownTab = 'byMajor' | 'byGrade' | 'byType'
const hpDim = ref<BreakdownTab>('byType')
const warnDim = ref<BreakdownTab>('byType')

const WARN_NAME_TO_TYPE: Record<string, WarningCategoryType> = {
  学业预警: 'academic',
  学分预警: 'credit',
  心理关注: 'psychological',
  心理预警: 'psychological',
  就业困难: 'employment',
  academic: 'academic',
  credit: 'credit',
  psychological: 'psychological',
  employment: 'employment',
}

const HP_NAME_TO_MODULE: Record<string, HighPotentialModuleId> = {
  学业卓越: 'academic',
  竞赛创新: 'competition',
  领导实践: 'leadership',
  双百工程: 'rural',
  实习就业: 'internship',
  就业升学: 'career',
  academic: 'academic',
  competition: 'competition',
  leadership: 'leadership',
  rural: 'rural',
  internship: 'internship',
  career: 'career',
}

function isMock(path: string) {
  return isMockField(data.value?.mockFields, path) || isMockField(eeData.value?.mockFields, path) || isMockField(flowSankey.value?.mockFields, path)
}

const selectedWarnName = ref('学业预警')
const selectedHpName = ref('全部高潜')
const warnRoster = ref<RosterStudentDTO[]>([])
const hpRoster = ref<RosterStudentDTO[]>([])
const warnRosterLoading = ref(false)
const hpRosterLoading = ref(false)
const warnRosterPanelRef = ref<InstanceType<typeof StudentRosterPanel> | null>(null)
const hpRosterPanelRef = ref<InstanceType<typeof StudentRosterPanel> | null>(null)

const ADMISSION_FOCUSES = new Set([
  'overview',
  'admission-scale',
  'source-quality',
  'admission-trend',
  'entrance-flow',
])

function focusToTab(focus?: string | null): TabKey {
  if (!focus || ADMISSION_FOCUSES.has(focus)) return 'admission'
  return 'employment'
}

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function switchTab(tab: TabKey, options?: { focus?: string | null; replaceQuery?: boolean }) {
  currentTab.value = tab
  activeSection.value = ''
  if ((tab === 'admission' || tab === 'employment') && options?.focus != null) {
    eeFocus.value = options.focus
  } else if (tab === 'admission') {
    eeFocus.value = 'overview'
  } else if (tab === 'employment') {
    eeFocus.value = 'exit-quality'
  }
  if (options?.replaceQuery !== false) {
    const query: Record<string, string> = { tab }
    if ((tab === 'admission' || tab === 'employment') && options?.focus) {
      query.focus = String(options.focus)
    }
    router.replace({ path: ROUTES.college.studentDevDetail, query })
  }
  nextTick(() => {
    getDetailScroller()?.scrollTo({ top: 0, behavior: 'auto' })
    if (tab === 'warning-center') void ensureWarnRoster()
    if (tab === 'high-potential') void ensureHpRoster()
  })
}

const overviewSections = [
  { id: 'enrolled', label: '在校生', icon: '👥' },
  { id: 'graduate', label: '研究生', icon: '🎓' },
  { id: 'employment-rate', label: '就业率', icon: '📈' },
  { id: 'high-potential-overview', label: '高潜学生', icon: '⭐' },
  { id: 'warning-overview', label: '预警学生', icon: '⚠️' },
]

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

  scroller.scrollTo({
    top: Math.max(0, targetTop),
    behavior: 'smooth',
  })
}

function scrollToRoster(id: string) {
  nextTick(() => {
    const el = document.getElementById(id)
    const scroller = getDetailScroller()
    if (!el || !scroller) return
    const targetTop =
      scroller.scrollTop +
      el.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      8
    scroller.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' })
  })
}

function applyRouteState() {
  const tabParam = String(route.query.tab ?? route.hash?.replace('#', '') ?? '')
  const focusParam = route.query.focus ? String(route.query.focus) : null

  // 兼容旧链接
  if (tabParam === 'flow') {
    currentTab.value = focusParam === 'entrance-flow' ? 'admission' : 'employment'
    eeFocus.value = focusParam === 'entrance-flow' ? 'entrance-flow' : 'outcome-flow'
    return
  }
  if (tabParam === 'enrollment') {
    currentTab.value = focusToTab(focusParam)
    eeFocus.value = focusParam ?? (currentTab.value === 'employment' ? 'exit-quality' : 'overview')
    return
  }

  if (TAB_KEYS.includes(tabParam as TabKey)) {
    currentTab.value = tabParam as TabKey
    if (tabParam === 'admission') {
      eeFocus.value = focusParam ?? 'overview'
    }
    if (tabParam === 'employment') {
      eeFocus.value = focusParam ?? 'exit-quality'
    }
    if (tabParam === 'warning-center') void ensureWarnRoster()
    if (tabParam === 'high-potential') void ensureHpRoster()
    return
  }

  if (focusParam) {
    currentTab.value = focusToTab(focusParam)
    eeFocus.value = focusParam
    return
  }

  if (overviewSections.some((s) => s.id === tabParam)) {
    currentTab.value = 'overview'
    nextTick(() => setTimeout(() => scrollToSection(tabParam), 200))
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    const scope = collegeScope.value
    const [detail, enrollment, flow] = await Promise.all([
      studentDevService.fetchStudentDevDetail(scope),
      enrollmentEmploymentService.fetchEnrollmentEmploymentDetail(scope),
      studentDevService.fetchStudentFlowSankey(scope),
    ])
    data.value = detail
    eeData.value = enrollment
    flowSankey.value = flow
    applyRouteState()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

async function onEmploymentFilterChange(payload: { year: string; major: string }) {
  const scope = {
    ...collegeScope.value,
    year: payload.year || undefined,
    major: payload.major && payload.major !== '全部专业' ? payload.major : undefined,
  }
  try {
    const [enrollment, flow] = await Promise.all([
      enrollmentEmploymentService.fetchEnrollmentEmploymentDetail(scope),
      studentDevService.fetchStudentFlowSankey(scope),
    ])
    eeData.value = enrollment
    flowSankey.value = flow
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '就业筛选加载失败'
  }
}

watch(
  () => [route.query.tab, route.query.focus, route.hash] as const,
  () => {
    if (!loading.value) applyRouteState()
  },
)

async function ensureWarnRoster(typeName = selectedWarnName.value) {
  const type = WARN_NAME_TO_TYPE[typeName] ?? 'academic'
  selectedWarnName.value = Object.entries(WARN_NAME_TO_TYPE).find(([, v]) => v === type)?.[0] ?? typeName
  warnRosterLoading.value = true
  try {
    warnRoster.value = await collegeDetailService.fetchWarningRoster(type, collegeScope.value)
  } finally {
    warnRosterLoading.value = false
  }
}

async function ensureHpRoster(typeName: string | null = selectedHpName.value === '全部高潜' ? null : selectedHpName.value) {
  const moduleId = typeName ? HP_NAME_TO_MODULE[typeName] : undefined
  selectedHpName.value = typeName ?? '全部高潜'
  hpRosterLoading.value = true
  try {
    hpRoster.value = await collegeDetailService.fetchHighPotentialRoster({
      ...collegeScope.value,
      moduleId,
    })
  } finally {
    hpRosterLoading.value = false
  }
}

function breakdownBarOption(
  items: Array<{ name: string; count: number }>,
  tone: 'cyan' | 'gold' | 'warn' = 'cyan',
  selectedName = '',
  mockNames: Set<string> = new Set(),
): EChartsOption {
  const sorted = [...items].sort((a, b) => a.count - b.count)
  const baseColors =
    tone === 'gold'
      ? [{ offset: 0, color: '#c98c20' }, { offset: 1, color: '#ffd56a' }]
      : tone === 'warn'
        ? [{ offset: 0, color: '#c45a2a' }, { offset: 1, color: '#ff8a65' }]
        : [{ offset: 0, color: '#126dff' }, { offset: 1, color: '#65f7ff' }]
  const activeColors =
    tone === 'gold'
      ? [{ offset: 0, color: '#e0a020' }, { offset: 1, color: '#ffe08a' }]
      : tone === 'warn'
        ? [{ offset: 0, color: '#e06030' }, { offset: 1, color: '#ffb08a' }]
        : [{ offset: 0, color: '#1a8cff' }, { offset: 1, color: '#8af7ff' }]
  const mockColors = [{ offset: 0, color: '#a8071a' }, { offset: 1, color: '#ff4d4f' }]
  const mockActiveColors = [{ offset: 0, color: '#cf1322' }, { offset: 1, color: '#ff7875' }]

  return {
    grid: { left: 8, right: 28, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { name?: string; value?: number }
        return `${item.name ?? ''}<br/>${item.value ?? 0} 人<br/><span style="color:#9fe8ff">点击查看学生名单</span>`
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: sorted.map((i) => i.name),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar',
      cursor: 'pointer',
      data: sorted.map((i) => {
        const isMockBar = mockNames.has(i.name)
        const stops = isMockBar
          ? (selectedName === i.name ? mockActiveColors : mockColors)
          : (selectedName === i.name ? activeColors : baseColors)
        return {
          value: i.count,
          name: i.name,
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            borderWidth: selectedName === i.name ? 2 : 0,
            borderColor: selectedName === i.name ? '#fff6c8' : 'transparent',
            shadowBlur: selectedName === i.name ? 12 : 0,
            shadowColor: selectedName === i.name ? 'rgba(255, 220, 120, 0.45)' : 'transparent',
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: stops,
            },
          },
        }
      }),
      barWidth: 14,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        fontWeight: 700,
      },
      emphasis: {
        focus: 'self',
        itemStyle: {
          shadowBlur: 14,
          shadowColor: 'rgba(0, 220, 255, 0.45)',
        },
      },
    }],
  }
}

  function undergradBarOption(items: Array<{ name: string; count: number }>): EChartsOption {
    const palette = ['#00e5ff', '#1f8bff', '#36f1cd', '#7c5cff']
    const total = items.reduce((s, i) => s + i.count, 0) || 1
    const max = Math.max(...items.map((i) => i.count), 1) * 1.12
    return {
      grid: { left: 14, right: 132, top: 16, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(3, 12, 28, 0.92)',
        borderColor: 'rgba(0, 229, 255, 0.55)',
        textStyle: { color: '#cdf3ff', fontSize: 12 },
        formatter: (p: any) => `${p.name}<br/>人数：${p.value}<br/>占比：${((p.value / total) * 100).toFixed(1)}%`,
      },
      xAxis: {
        type: 'value', max,
        axisLabel: { show: false },
        splitLine: { show: true, lineStyle: { color: 'rgba(0, 229, 255, 0.10)', type: 'dashed' } },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category',
        data: items.map((i) => i.name),
        axisLabel: { color: '#bfe9ff', fontSize: 13, fontWeight: 'bold' },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      series: [{
        type: 'bar',
        barWidth: '44%',
        data: items.map((i, idx) => {
          const c = palette[idx % palette.length]
          return {
            value: i.count,
            itemStyle: {
              borderRadius: [0, 8, 8, 0],
              shadowBlur: 16,
              shadowColor: c,
              color: {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: c + '33' },
                  { offset: 1, color: c },
                ],
              },
            },
          }
        }),
        label: {
          show: true,
          position: 'right',
          color: '#eafdff',
          fontSize: 12,
          fontWeight: 'bold',
          textShadowColor: 'rgba(0, 229, 255, 0.6)',
          textShadowBlur: 6,
          formatter: (p: any) => `${p.value}人 · ${((p.value / total) * 100).toFixed(1)}%`,
        },
      }],
    }
  }

  function undergradPieOption(items: Array<{ name: string; count: number }>): EChartsOption {
    const palette = ['#00e5ff', '#1f8bff', '#36f1cd']
    const total = items.reduce((s, i) => s + i.count, 0) || 1
    return {
      color: palette,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(3, 12, 28, 0.92)',
        borderColor: 'rgba(0, 229, 255, 0.55)',
        textStyle: { color: '#cdf3ff', fontSize: 12 },
        formatter: (p: any) => `${p.name}<br/>人数：${p.value}<br/>占比：${p.percent}%`,
      },
      title: {
        text: String(total),
        subtext: '本科生总数',
        left: 'center',
        top: 'center',
        textStyle: { color: '#5ff4ff', fontSize: 30, fontWeight: 'bolder', textShadowColor: '#00e5ff', textShadowBlur: 18 },
        subtextStyle: { color: '#8fd0e6', fontSize: 12 },
        itemGap: 6,
      },
      legend: {
        bottom: 4,
        left: 'center',
        icon: 'circle',
        itemWidth: 9,
        itemHeight: 9,
        itemGap: 14,
        textStyle: { color: '#bfe9ff', fontSize: 12 },
        data: items.map((i) => i.name),
        formatter: (name: string) => {
          const it = items.find((i) => i.name === name)
          if (!it) return name
          return `${name}  ${it.count}人 · ${((it.count / total) * 100).toFixed(1)}%`
        },
      },
      series: [{
        type: 'pie',
        radius: ['50%', '72%'],
        center: ['50%', '47%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: '#04121f', borderWidth: 3, borderRadius: 6, shadowBlur: 20, shadowColor: 'rgba(0, 229, 255, 0.5)' },
        label: {
          show: true,
          position: 'outside',
          color: '#dffaff',
          fontSize: 12,
          fontWeight: 'bold',
          lineHeight: 17,
          formatter: (p: any) => `${p.name}\n${p.value}人 · ${p.percent}%`,
        },
        labelLine: { length: 10, length2: 14, lineStyle: { color: 'rgba(0, 229, 255, 0.65)', width: 1 } },
        data: items.map((i) => ({ name: i.name, value: i.count })),
      }],
    }
  }

  const undergradByMajorOption = computed(() => {
    if (!data.value?.undergradDistribution?.byMajor?.length) return {}
    return undergradPieOption(data.value.undergradDistribution.byMajor)
  })
  const undergradByGradeOption = computed(() => {
    if (!data.value?.undergradDistribution?.byGrade?.length) return {}
    return undergradBarOption(data.value.undergradDistribution.byGrade)
  })

const hpBarOption = computed(() => {
  if (!data.value) return {}
  const selected = hpDim.value === 'byType' ? selectedHpName.value : ''
  return breakdownBarOption(data.value.highPotentialBreakdown[hpDim.value], 'gold', selected)
})

const warnBarOption = computed(() => {
  if (!data.value) return {}
  const selected = warnDim.value === 'byType' ? selectedWarnName.value : ''
  const mockNames = new Set<string>()
  if (warnDim.value === 'byType') {
    for (const item of data.value.warningBreakdown.byType) {
      if (item.name === '心理关注' || isMock(`warningBreakdown.byType.${item.name}`)) {
        mockNames.add(item.name)
      }
    }
  }
  return breakdownBarOption(data.value.warningBreakdown[warnDim.value], 'warn', selected, mockNames)
})

async function onWarnChartClick(params: unknown) {
  const name = (params as { name?: string })?.name
  if (!name) return

  if (warnDim.value === 'byType') {
    await ensureWarnRoster(name)
    warnRosterPanelRef.value?.resetFilters()
  } else if (warnDim.value === 'byMajor') {
    await ensureWarnRoster(selectedWarnName.value)
    warnRosterPanelRef.value?.setMajorFilter(name)
  } else if (warnDim.value === 'byGrade') {
    await ensureWarnRoster(selectedWarnName.value)
    warnRosterPanelRef.value?.setGradeFilter(name)
  }
  scrollToRoster('warning-roster')
}

async function onHpChartClick(params: unknown) {
  const name = (params as { name?: string })?.name
  if (!name) return

  if (hpDim.value === 'byType') {
    await ensureHpRoster(name)
    hpRosterPanelRef.value?.resetFilters()
  } else if (hpDim.value === 'byMajor') {
    await ensureHpRoster(selectedHpName.value === '全部高潜' ? null : selectedHpName.value)
    hpRosterPanelRef.value?.setMajorFilter(name)
  } else if (hpDim.value === 'byGrade') {
    await ensureHpRoster(selectedHpName.value === '全部高潜' ? null : selectedHpName.value)
    hpRosterPanelRef.value?.setGradeFilter(name)
  }
  scrollToRoster('hp-roster')
}

async function selectWarnSummary(name: string) {
  warnDim.value = 'byType'
  await ensureWarnRoster(name)
  warnRosterPanelRef.value?.resetFilters()
  scrollToRoster('warning-roster')
}

async function selectHpSummary(name: string | null) {
  hpDim.value = 'byType'
  await ensureHpRoster(name)
  hpRosterPanelRef.value?.resetFilters()
  scrollToRoster('hp-roster')
}

function goEmploymentPage() {
  router.push(ROUTES.college.studentEmployment)
}
</script>

<template>
  <CollegeDetailLayout>
    <template #nav>
      <div ref="tabBarRef" class="tab-bar tab-bar--header">
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'overview' }" @click="switchTab('overview')">📋 画像总览</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'admission' }" @click="switchTab('admission')">📝 招生质量</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'employment' }" @click="switchTab('employment')">💼 就业分析</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'high-potential' }" @click="switchTab('high-potential')">⭐ 高潜分析</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'warning-center' }" @click="switchTab('warning-center')">🚨 预警中心</button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <template v-else-if="data">
      <p class="mock-legend">
        <span class="mock-legend__swatch" />红色数字/图表为示意或缺源数据（mock），主题色为真实库表聚合
      </p>
      <!-- ===================== 画像总览 ===================== -->
      <template v-if="currentTab === 'overview'">
        <div class="resource-summary">
          <div class="resource-summary__card" @click="scrollToSection('enrolled')">
            <span class="resource-summary__icon">🧑‍🎓</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">本科生</span>
              <strong class="resource-summary__value">
                <MockText>{{ data.summary.enrolledUndergrad }}</MockText><small>人</small>
              </strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('graduate')">
            <span class="resource-summary__icon">🎓</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">研究生</span>
              <strong class="resource-summary__value">
                <MockText :mock="isMock('summary.enrolledGraduate')">{{ data.summary.enrolledGraduate }}</MockText><small>人</small>
              </strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('employment', { focus: 'exit-quality' })">
            <span class="resource-summary__icon">📈</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">就业率</span>
              <strong class="resource-summary__value">{{ data.summary.employmentRate }}<small>%</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('high-potential')">
            <span class="resource-summary__icon">⭐</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">高潜学生</span>
              <strong class="resource-summary__value">{{ data.summary.highPotential }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('warning-center')">
            <span class="resource-summary__icon">⚠️</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">预警学生</span>
              <strong class="resource-summary__value">{{ data.summary.warning }}<small>人</small></strong>
            </div>
          </div>
        </div>

        <section id="enrolled" class="resource-section" :class="{ 'resource-section--active': activeSection === 'enrolled' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🧑‍🎓</span>本科生规模<span class="resource-section__badge">{{ data.summary.enrolledUndergrad }} 人</span></h2>
          <p class="resource-section__desc">本科在校生是学院人才培养的主体规模，反映学院办学体量与专业承载能力。规模稳定增长是保证教学投入与学生发展资源配置的基础。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>专业概览</h3>
              <div class="resource-card__chart resource-card__chart--tall"><ChartContainer :option="undergradByMajorOption" /></div>
            </div>
            <div class="resource-card">
              <h3>年级概览</h3>
              <div class="resource-card__chart resource-card__chart--tall"><ChartContainer :option="undergradByGradeOption" /></div>
            </div>
          </div>
        </section>

        <section id="graduate" class="resource-section" :class="{ 'resource-section--active': activeSection === 'graduate' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🎓</span>研究生培养<span class="resource-section__badge resource-section__badge--accent"><MockText :mock="isMock('summary.enrolledGraduate')">{{ data.summary.enrolledGraduate }}</MockText> 人</span></h2>
          <p class="resource-section__desc">研究生规模体现学院科研育人与学科支撑能力。结合高潜学生结构，可观察拔尖创新人才从本科到研究生阶段的衔接情况。</p>
          <div class="resource-card">
            <div class="resource-card__note">
              <p>可切换至「高潜分析」查看按类型 / 专业 / 年级的细分结构，支撑精准培养策略。</p>
            </div>
          </div>
        </section>

        <section id="employment-rate" class="resource-section" :class="{ 'resource-section--active': activeSection === 'employment-rate' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📈</span>就业率<span class="resource-section__badge">{{ data.summary.employmentRate }}%</span></h2>
          <p class="resource-section__desc">就业率是人才培养出口质量的核心指标。完整专题见「就业分析」，招生入口见「招生质量」。</p>
          <div class="resource-section__grid resource-section__grid--3">
            <div v-for="item in data.outcomes" :key="item.key" class="resource-card resource-card--talent">
              <div class="resource-card__talent-icon">{{ item.key === 'employment' ? '💼' : item.key === 'furtherStudy' ? '🎓' : '🏛️' }}</div>
              <strong class="resource-card__talent-count">{{ item.ratio }}<small>%</small></strong>
              <span class="resource-card__talent-label">{{ item.label }}</span>
              <p class="resource-card__talent-desc">{{ item.count }} 人</p>
            </div>
          </div>
          <div class="resource-card" style="margin-top: 14px">
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">💡</span>
              <p>
                <button type="button" class="inline-link" @click="switchTab('employment', { focus: 'exit-quality' })">打开就业分析</button>
                ·
                <button type="button" class="inline-link" @click="switchTab('admission', { focus: 'entrance-flow' })">查看入口流向</button>
                ·
                <button type="button" class="inline-link" @click="goEmploymentPage">就业单位明细页</button>
              </p>
            </div>
          </div>
        </section>

        <section id="high-potential-overview" class="resource-section" :class="{ 'resource-section--active': activeSection === 'high-potential-overview' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">⭐</span>高潜学生<span class="resource-section__badge resource-section__badge--gold">{{ data.summary.highPotential }} 人</span></h2>
          <p class="resource-section__desc">高潜学生是学院拔尖创新人才培养的核心群体，覆盖学业卓越、竞赛创新、领导实践与实习就业等多类画像。</p>
          <div class="resource-card">
            <div class="resource-tags">
              <span v-for="item in data.highPotentialBreakdown.byType" :key="item.name" class="resource-tag resource-tag--highlight">
                {{ item.name }}：{{ item.count }}人
              </span>
            </div>
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">💡</span>
              <p>
                <button type="button" class="inline-link" @click="switchTab('high-potential')">进入高潜分析并查看名单</button>
              </p>
            </div>
          </div>
        </section>

        <section id="warning-overview" class="resource-section" :class="{ 'resource-section--active': activeSection === 'warning-overview' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">⚠️</span>预警学生<span class="resource-section__badge">{{ data.summary.warning }} 人</span></h2>
          <p class="resource-section__desc">预警学生数量反映学业风险与发展困难群体规模。建议结合类型分布制定分层帮扶与跟踪机制。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>预警类型</h3>
              <ul class="resource-list">
                <li v-for="item in data.warningBreakdown.byType" :key="item.name" class="resource-list__item">
                  <span class="resource-list__label">{{ item.name }}</span>
                  <div class="resource-list__bar-track">
                    <div
                      class="resource-list__bar-fill"
                      :style="{ width: `${Math.max(8, (item.count / Math.max(...data.warningBreakdown.byType.map((i) => i.count))) * 100)}%` }"
                    />
                  </div>
                  <span class="resource-list__value">
                    <MockText :mock="item.name === '心理关注' || isMock('warningBreakdown.byType.心理关注')">{{ item.count }}</MockText> 人
                  </span>
                </li>
              </ul>
            </div>
            <div class="resource-card">
              <h3>处置入口</h3>
              <div class="resource-card__insight resource-card__insight--large">
                <span class="resource-card__insight-icon">🚨</span>
                <p>
                  <button type="button" class="inline-link" @click="switchTab('warning-center')">进入预警中心并查看名单</button>
                </p>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 招生质量 ===================== -->
      <template v-else-if="currentTab === 'admission'">
        <EnrollmentEmploymentDetailContent
          v-if="eeData"
          mode="admission"
          :data="eeData"
          :focus="eeFocus"
          :flow-sankey="flowSankey"
          @filter-change="onEmploymentFilterChange"
        />
        <div v-else class="detail-placeholder">招生质量数据加载中...</div>
      </template>

      <!-- ===================== 就业分析 ===================== -->
      <template v-else-if="currentTab === 'employment'">
        <EnrollmentEmploymentDetailContent
          v-if="eeData"
          mode="graduation"
          :data="eeData"
          :focus="eeFocus"
          :flow-sankey="flowSankey"
          @filter-change="onEmploymentFilterChange"
        />
        <div v-else class="detail-placeholder">就业分析数据加载中...</div>
      </template>

      <!-- ===================== 高潜分析 ===================== -->
      <template v-else-if="currentTab === 'high-potential'">
        <div class="resource-summary resource-summary--4">
          <div class="resource-summary__card" @click="selectHpSummary(null)">
            <span class="resource-summary__icon">⭐</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">高潜总数</span>
              <strong class="resource-summary__value">{{ data.summary.highPotential }}<small>人</small></strong>
            </div>
          </div>
          <div
            v-for="item in data.highPotentialBreakdown.byType"
            :key="item.name"
            class="resource-summary__card"
            :class="{ 'resource-summary__card--active': selectedHpName === item.name }"
            @click="selectHpSummary(item.name)"
          >
            <span class="resource-summary__icon">✨</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">{{ item.name }}</span>
              <strong class="resource-summary__value">{{ item.count }}<small>人</small></strong>
            </div>
          </div>
        </div>

        <section class="resource-section resource-section--active">
          <div class="resource-section__head-row">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">⭐</span>高潜学生分布</h2>
            <button type="button" class="section-link" @click="scrollToRoster('hp-roster')">名单 ↓</button>
          </div>
          <p class="resource-section__desc">点击柱条可直接查看对应同学名单。按类型切换维度名单，按专业 / 年级则在当前名单内筛选。</p>

          <div class="dim-tabs">
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': hpDim === 'byType' }" @click="hpDim = 'byType'">按类型</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': hpDim === 'byMajor' }" @click="hpDim = 'byMajor'">按专业</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': hpDim === 'byGrade' }" @click="hpDim = 'byGrade'">按年级</button>
          </div>

      <div class="resource-card">
        <div class="resource-card__chart"><ChartContainer :option="hpBarOption" @chart-click="onHpChartClick" /></div>
      </div>

      <div id="hp-roster">
        <StudentRosterPanel
          ref="hpRosterPanelRef"
          :title="`${selectedHpName}学生名单`"
          mode="high-potential"
          :students="hpRoster"
          :loading="hpRosterLoading"
          :total-hint="data.summary.highPotential"
        >
          <template #headExtra>
            <p class="hp-roster-tip"><span class="hp-roster-tip__icon">💡</span>当前名单：<strong>{{ selectedHpName }}</strong>。点击柱条切换；也可点顶部摘要卡。</p>
          </template>
        </StudentRosterPanel>
      </div>
        </section>
      </template>

      <!-- ===================== 预警中心 ===================== -->
      <template v-else-if="currentTab === 'warning-center'">
        <div class="resource-summary resource-summary--4">
          <div class="resource-summary__card" @click="selectWarnSummary('学业预警')">
            <span class="resource-summary__icon">🚨</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">预警总数</span>
              <strong class="resource-summary__value">{{ data.summary.warning }}<small>人</small></strong>
            </div>
          </div>
          <div
            v-for="item in data.warningBreakdown.byType.slice(0, 3)"
            :key="item.name"
            class="resource-summary__card"
            :class="{ 'resource-summary__card--active': selectedWarnName === item.name }"
            @click="selectWarnSummary(item.name)"
          >
            <span class="resource-summary__icon">⚠️</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">{{ item.name }}</span>
              <strong class="resource-summary__value">{{ item.count }}<small>人</small></strong>
            </div>
          </div>
        </div>

        <section class="resource-section resource-section--active">
          <div class="resource-section__head-row">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🚨</span>预警学生分布</h2>
            <button type="button" class="section-link" @click="scrollToRoster('warning-roster')">名单 ↓</button>
          </div>
          <p class="resource-section__desc">点击柱条即可在本页查看具体同学。按类型切换预警类别名单；按专业 / 年级则在当前类别名单内筛选。</p>

          <div class="dim-tabs">
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': warnDim === 'byType' }" @click="warnDim = 'byType'">按类型</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': warnDim === 'byMajor' }" @click="warnDim = 'byMajor'">按专业</button>
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': warnDim === 'byGrade' }" @click="warnDim = 'byGrade'">按年级</button>
          </div>

          <div class="resource-card">
            <div class="resource-card__chart"><ChartContainer :option="warnBarOption" @chart-click="onWarnChartClick" /></div>
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">💡</span>
              <p>当前名单：<strong>{{ selectedWarnName }}</strong>。学业预警仍是主体，建议与课程完成率、学分进度联动干预。</p>
            </div>
          </div>

          <div id="warning-roster">
            <StudentRosterPanel
              ref="warnRosterPanelRef"
              :title="`${selectedWarnName}学生名单`"
              mode="warning"
              :students="warnRoster"
              :loading="warnRosterLoading"
              :total-hint="data.warningBreakdown.byType.find((i) => i.name === selectedWarnName)?.count ?? warnRoster.length"
            />
          </div>
        </section>
      </template>
    </template>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
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
  font-size: 20px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;

  &:last-child { border-right: none; }
  &:hover { background: rgba(0, 90, 160, 0.28); color: #b8ecff; }

  &--active {
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
    color: #eaf7ff;
    box-shadow: inset 0 0 18px rgba(0, 200, 255, 0.15);
  }
}

.mock-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 77, 79, 0.08);
  border: 1px solid rgba(255, 77, 79, 0.28);
  color: #ffb4b4;
  font-size: 13px;
  line-height: 1.4;
}

.mock-legend__swatch {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background: #ff4d4f;
  flex: 0 0 auto;
}

.resource-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;

  &--4 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
  &--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(0, 242, 255, 0.18);
    background: linear-gradient(160deg, rgba(0, 80, 160, 0.2), rgba(2, 14, 40, 0.75));
    cursor: pointer;
    transition: all 0.25s;

    &:hover {
      border-color: rgba(0, 242, 255, 0.5);
      background: linear-gradient(160deg, rgba(0, 120, 220, 0.28), rgba(2, 18, 48, 0.85));
      box-shadow: 0 0 22px rgba(0, 180, 255, 0.2);
      transform: translateY(-2px);
    }

    &--active {
      border-color: rgba(255, 213, 106, 0.65);
      box-shadow: 0 0 22px rgba(255, 200, 80, 0.22);
    }
  }

  &__icon { font-size: 28px; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__label { font-size: 20px; color: #8ec8e8; font-weight: 600; }
  &__value {
    font-size: 28px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
    small { margin-left: 3px; font-size: 20px; color: #7fdfff; font-weight: 600; }
  }
}

.resource-section {
  margin-bottom: 28px;
  padding: 18px 20px;
  border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.12);
  background: linear-gradient(180deg, rgba(4, 22, 52, 0.65), rgba(2, 12, 32, 0.8));
  scroll-margin-top: 20px;
  transition: border-color 0.4s, box-shadow 0.4s;

  &--active {
    border-color: rgba(0, 242, 255, 0.55);
    box-shadow: 0 0 30px rgba(0, 200, 255, 0.16), inset 0 0 30px rgba(0, 180, 255, 0.06);
  }

  &__head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;

    .resource-section__title { margin-bottom: 0; }
  }

  &__title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 10px;
    font-size: 24px;
    font-weight: 800;
    color: #eaf7ff;
    letter-spacing: 0.03em;

    &-icon { font-size: 24px; }
  }

  &__badge {
    margin-left: 8px;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 18px;
    font-weight: 700;
    color: #8ef6ff;
    border: 1px solid rgba(0, 200, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);

    &--accent { color: #6effc2; border-color: rgba(46, 230, 168, 0.35); background: rgba(30, 180, 120, 0.18); }
    &--gold { color: #ffd56a; border-color: rgba(255, 210, 90, 0.4); background: rgba(200, 160, 40, 0.18); }
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
    &--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
    &--lg { height: 340px; }
    &--tall { height: 320px; }
  }

  &__tag {
    display: inline-block;
    margin-left: 6px;
    padding: 1px 8px;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 500;
    color: #9fe6ff;
    background: rgba(34, 211, 238, 0.14);
    border: 1px solid rgba(34, 211, 238, 0.3);
    vertical-align: middle;
  }

  &__note {
    margin-top: 4px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 80, 160, 0.15);
    border-left: 3px solid rgba(0, 200, 255, 0.35);
    p { margin: 0; font-size: 18px; line-height: 1.6; color: #8eaec8; }
  }

  &__insight {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-top: 14px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(0, 120, 200, 0.12);
    border: 1px solid rgba(0, 200, 255, 0.16);

    p { margin: 0; font-size: 18px; line-height: 1.6; color: #c6dcf0; strong { color: #ffd56a; font-weight: 800; } }
    &-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
    &--large { padding: 16px; }
  }

  &--talent {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 20px 16px;
    gap: 6px;
  }

  &__talent-icon { font-size: 36px; margin-bottom: 4px; }
  &__talent-count {
    font-size: 34px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
    small { font-size: 20px; color: #7fdfff; margin-left: 2px; }
  }
  &__talent-label { font-size: 20px; font-weight: 700; color: #eaf7ff; }
  &__talent-desc { margin: 4px 0 0; font-size: 18px; color: #8eaec8; line-height: 1.5; }
}

.resource-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__item {
    display: grid;
    grid-template-columns: 110px 1fr auto;
    align-items: center;
    gap: 12px;
  }

  &__label { font-size: 18px; color: #8ec8e8; font-weight: 600; }
  &__bar-track { height: 8px; border-radius: 999px; background: rgba(7, 55, 128, 0.55); overflow: hidden; }
  &__bar-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #1a8cff, #5cecff);
    box-shadow: 0 0 8px rgba(0, 242, 255, 0.35);
    &--phd { background: linear-gradient(90deg, #0d7a5c, #6effc2); }
  }
  &__value { font-size: 18px; color: #eaf7ff; font-weight: 700; white-space: nowrap; text-align: right; }
}

.resource-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 18px;
  font-weight: 700;
  white-space: nowrap;

  &--highlight {
    color: #ffd56a;
    border: 1px solid rgba(255, 210, 90, 0.35);
    background: rgba(200, 160, 40, 0.12);
  }
}

.resource-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.dim-tabs {
  display: inline-flex;
  gap: 0;
  margin-bottom: 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  overflow: hidden;
}

.dim-tab {
  padding: 8px 18px;
  border: none;
  border-right: 1px solid rgba(0, 242, 255, 0.12);
  background: rgba(0, 60, 120, 0.18);
  color: #8ec8e8;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;

  &:last-child { border-right: none; }
  &:hover { color: #b8ecff; background: rgba(0, 90, 160, 0.28); }

  &--active {
    color: #041428;
    background: linear-gradient(90deg, #3ec8ff, #7ff0ff);
  }
}

.section-link,
.inline-link {
  border: none;
  background: none;
  color: #7fe9ff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;

  &:hover { color: #c8fbff; text-decoration: underline; }
}

.detail-placeholder {
  display: grid;
  min-height: 220px;
  place-items: center;
  color: rgba(184, 236, 255, 0.72);
  font-size: 24px;
}

.detail-error { color: rgba(255, 160, 140, 0.85); }

@media (max-width: 1400px) {
  .resource-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .resource-summary--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .resource-section__grid--2,
  .resource-section__grid--3 { grid-template-columns: 1fr; }
}
.hp-roster-tip {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: #8eaec8;

  strong {
    color: #9fe8ff;
    font-weight: 700;
  }

  &__icon {
    margin-right: 4px;
  }
}
</style>
