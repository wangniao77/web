<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import MockText from '@/components/common/MockText.vue'
import StudentFlowSankeyChart from '@/components/college/modules/student-dev/StudentFlowSankeyChart.vue'
import WordCloud from '@/components/college/modules/enrollment-employment/WordCloud.vue'
import EmploymentAnalysisReportModal from '@/components/college/modules/enrollment-employment/EmploymentAnalysisReportModal.vue'
import { analyzePage } from '@/api/agent/services'
import { enrollmentEmploymentService } from '@/api/college/services/enrollment-employment'
import { useScope } from '@/composables/useScope'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import { isMockField } from '@/composables/useMockFields'
import {
  COLLEGE_MOCK_CHART_COLORS,
  COLLEGE_MOCK_DATA_COLOR,
} from '@/constants/college/simulated-modules'
import type {
  EnrollmentEmploymentDrillSample,
  EnrollmentEmploymentFocus,
} from '@/types/college/api/enrollment-employment'
import type { EnrollmentEmploymentDetailVM } from '@/types/college/view/enrollment-employment'
import type { EmploymentAnalysisReportVM } from '@/types/college/view/employment-analysis'
import type { StudentFlowSankeyVM } from '@/types/college/view/student-dev-quality'
import type { EChartsOption } from 'echarts'
import chinaJson from '@/assets/maps/china.json'

// 保留港澳台，仅剔除南海诸岛（空名要素），避免右侧空白小框
const EXCLUDED_REGIONS = new Set([''])
const chinaMapJson = {
  ...chinaJson,
  features: (chinaJson as { features: Array<{ properties: { name: string } }> }).features.filter(
    (f) => !EXCLUDED_REGIONS.has(f.properties?.name ?? '')
  ),
}

echarts.registerMap('china', chinaMapJson as never)

const props = withDefaults(
  defineProps<{
    data: EnrollmentEmploymentDetailVM
    focus?: string | null
    flowSankey?: StudentFlowSankeyVM | null
    /** 锁定展示招生或就业，不再显示内层子 Tab */
    mode?: 'admission' | 'graduation' | 'auto'
  }>(),
  {
    mode: 'auto',
  },
)

const emit = defineEmits<{
  filterChange: [payload: { year: string; major: string }]
}>()

const { collegeScope } = useScope()

type MainTab = 'admission' | 'graduation'
type DistTab = 'industry' | 'region' | 'salary'

const mainTab = ref<MainTab>('admission')
const year = ref('')
const major = ref('')
const distTab = ref<DistTab>('industry')
const showGradSchools = ref(false)
const syncingFilters = ref(false)

const empReport = ref<EmploymentAnalysisReportVM | null>(null)
const empReportStale = ref(false)
const empReportFingerprint = ref('')
const empReportLoading = ref(false)
const empReportError = ref<string | null>(null)
const empReportAnalyzing = ref(false)
const showEmpReportModal = ref(false)

const summaryInsights = computed(() => (empReport.value?.insights || []).slice(0, 3))
const fallbackInsights = computed(() => props.data.graduation.insights || [])
const displayInsights = computed(() =>
  summaryInsights.value.length ? summaryInsights.value : fallbackInsights.value.slice(0, 3),
)
const displayHeadline = computed(
  () =>
    empReport.value?.headline ||
    (displayInsights.value[0]
      ? `${displayInsights.value[0].title}：${displayInsights.value[0].detail}`
      : '尚未生成就业深度分析，可点击「生成分析」。'),
)
const displayActions = computed(() =>
  empReport.value?.actions?.length
    ? empReport.value.actions
    : props.data.graduation.actions || [],
)

async function loadEmpAnalysisReport() {
  if (mainTab.value !== 'graduation') return
  empReportLoading.value = true
  empReportError.value = null
  try {
    const res = await enrollmentEmploymentService.fetchEmploymentAnalysisReport({
      ...collegeScope.value,
      year: year.value || props.data.filters.selectedYear || undefined,
      major:
        major.value && major.value !== '全部专业'
          ? major.value
          : undefined,
    })
    empReport.value = res.report
    empReportStale.value = Boolean(res.stale)
    empReportFingerprint.value = res.dataFingerprint || ''
  } catch (e: unknown) {
    empReportError.value = e instanceof Error ? e.message : '读取分析报告失败'
  } finally {
    empReportLoading.value = false
  }
}

async function runEmpAnalysis() {
  empReportAnalyzing.value = true
  empReportError.value = null
  try {
    const y = year.value || props.data.filters.selectedYear || ''
    const m = major.value && major.value !== '全部专业' ? major.value : ''
    const dto = await analyzePage({
      context: {
        scope: 'college',
        page: 'enrollment-employment',
        collegeId: collegeScope.value.collegeId,
        filters: {
          ...(y ? { year: y } : {}),
          ...(m ? { major: m } : {}),
        },
      },
      refresh: true,
    })
    empReport.value = {
      generatedAt: dto.generatedAt || new Date().toISOString(),
      source: dto.source,
      dataFingerprint: dto.dataFingerprint || empReportFingerprint.value,
      filters: (dto.filters as EmploymentAnalysisReportVM['filters']) || {
        year: y || null,
        major: m || null,
      },
      headline: dto.headline,
      insights: dto.insights.map((i) => ({
        title: i.title,
        detail: i.detail,
        tone: i.tone,
        evidence: i.evidence,
      })),
      actions: dto.actions,
      sections: dto.sections,
      sessionId: dto.sessionId,
      traceId: dto.traceId,
    }
    empReportStale.value = false
    if (dto.dataFingerprint) empReportFingerprint.value = dto.dataFingerprint
  } catch (e: unknown) {
    empReportError.value = e instanceof Error ? e.message : '分析失败'
  } finally {
    empReportAnalyzing.value = false
  }
}

watch(
  () => [mainTab.value, year.value, major.value, props.data.filters.selectedYear] as const,
  ([tab]) => {
    if (tab === 'graduation') void loadEmpAnalysisReport()
  },
  { immediate: true },
)

// 词云：行业 / 岗位（真实就业表）；无技能能力库故不提供技能 Tab
type CloudWord = { name: string; weight: number }
type CloudTab = 'job' | 'industry'

const cloudTab = ref<CloudTab>('industry')
const activeCloud = computed<CloudWord[]>(() => {
  const g = props.data.graduation
  const list = cloudTab.value === 'job' ? (g.jobCloud ?? []) : (g.industryCloud ?? [])
  return list.map((w) => ({ name: w.name, weight: w.weight }))
})
const CLOUD_COLORS = ['#22d3ee', '#7dd3fc', '#fbbf24', '#34d399', '#a78bfa', '#f472b6']
const wordCloudMock = computed(() => {
  if (cloudTab.value === 'job') {
    return isMockField(props.data.mockFields, 'graduation.jobCloud') || !(props.data.graduation.jobCloud?.length)
  }
  return isMockField(props.data.mockFields, 'graduation.industryCloud') || !(props.data.graduation.industryCloud?.length)
})
const activeCloudColors = computed(() =>
  wordCloudMock.value ? [...COLLEGE_MOCK_CHART_COLORS] : CLOUD_COLORS,
)

function resolveFocus(focus?: string | null): { tab: MainTab; highlight: EnrollmentEmploymentFocus } {
  switch (focus) {
    case 'admission-scale':
    case 'source-quality':
    case 'admission-trend':
    case 'entrance-flow':
      return { tab: 'admission', highlight: focus }
    case 'exit-quality':
    case 'high-quality-dest':
    case 'employment-trend':
    case 'outcome-flow':
      return { tab: 'graduation', highlight: focus }
    default:
      return {
        tab: props.mode === 'graduation' ? 'graduation' : 'admission',
        highlight: 'overview',
      }
  }
}

function scrollToFlow(id: string) {
  nextTick(() => {
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 80)
  })
}

watch(
  () => [props.focus, props.mode] as const,
  ([focus, mode]) => {
    const resolved = resolveFocus(focus)
    mainTab.value = mode === 'auto' ? resolved.tab : mode
    syncingFilters.value = true
    year.value = props.data.filters.selectedYear || props.data.filters.years.at(-1) || ''
    major.value = props.data.filters.selectedMajor || props.data.filters.majors[0] || '全部专业'
    syncingFilters.value = false
    showGradSchools.value = focus === 'high-quality-dest'
    if (focus === 'entrance-flow') scrollToFlow('ee-entrance-flow')
    if (focus === 'outcome-flow' || focus === 'employment-trend') scrollToFlow('ee-outcome-flow')
  },
  { immediate: true },
)

watch(
  () => props.data.filters,
  (filters) => {
    syncingFilters.value = true
    year.value = filters.selectedYear || filters.years.at(-1) || year.value
    major.value = filters.selectedMajor || filters.majors[0] || major.value
    syncingFilters.value = false
  },
)

watch([year, major], ([y, m]) => {
  if (syncingFilters.value) return
  if (!y) return
  const selY = props.data.filters.selectedYear || props.data.filters.years.at(-1) || ''
  const selM = props.data.filters.selectedMajor || props.data.filters.majors[0] || '全部专业'
  if (y === selY && (m || '全部专业') === selM) return
  emit('filterChange', { year: y, major: m })
})

const suppressDrillReset = ref(false)

watch(mainTab, (tab) => {
  if (tab !== 'graduation') showGradSchools.value = false
  if (suppressDrillReset.value) return
  selectedDrillKey.value = ''
  selectedDestKey.value = ''
  drillRowsOverride.value = null
})

const highlight = computed(() => resolveFocus(props.focus).highlight)
const showInnerTabs = computed(() => props.mode === 'auto')
const hqDestMaxRatio = computed(() =>
  Math.max(0, ...props.data.graduation.highQualityDest.map((i) => i.ratio)),
)

function isMock(path: string) {
  return isMockField(props.data.mockFields, path) || isMockField(props.flowSankey?.mockFields, path)
}

const selectedDestKey = ref('')
const selectedDrillKey = ref('')
/** 桑基点击时直接带入的名单，避免仅靠 key 二次查找丢数 */
const drillRowsOverride = ref<EnrollmentEmploymentDrillSample[] | null>(null)

const mergedDrillSamples = computed(() => {
  const admission = props.data.admission.drillSamples || {}
  const graduation = props.data.graduation.drillSamples || {}
  const base = mainTab.value === 'admission' ? admission : graduation
  const fromFlow = props.flowSankey?.outcomeDrillSamples || {}
  const fromGraduationSankey = Object.fromEntries(
    Object.entries(graduation).filter(([k]) => k.includes('\u2192') || k.includes('->')),
  )
  return { ...base, ...fromGraduationSankey, ...fromFlow }
})

const outcomeSankeyDrillSamples = computed(() => props.flowSankey?.outcomeDrillSamples || {})

const activeInsights = computed(() =>
  mainTab.value === 'admission' ? props.data.admission.insights : props.data.graduation.insights,
)
const activeActions = computed(() =>
  mainTab.value === 'admission' ? props.data.admission.actions : props.data.graduation.actions,
)

function normalizeDrillRows(rows: EnrollmentEmploymentDrillSample[]) {
  return rows.map((s) => {
    const raw = s as EnrollmentEmploymentDrillSample & {
      student_id?: string
      class_name?: string
      education_level?: string
    }
    return {
      name: raw.name || '未知',
      studentId: raw.studentId || raw.student_id || '',
      major: raw.major || '其他',
      className: raw.className || raw.class_name || '',
      educationLevel: raw.educationLevel || raw.education_level || '',
      detail: raw.detail || '',
      salary: raw.salary ?? null,
      tag: raw.tag,
    }
  })
}

const activeDrillSamples = computed(() => {
  if (!selectedDrillKey.value) return []
  if (drillRowsOverride.value?.length) {
    return normalizeDrillRows(drillRowsOverride.value)
  }
  const map = mergedDrillSamples.value
  const key = selectedDrillKey.value
  const resolved = resolveExistingSankeyKey(map, key) || key
  const rows = map[resolved] ?? []
  return normalizeDrillRows(rows)
})

function isFurtherStudyTag(tag?: string) {
  return tag === '国内升学' || tag === '出国升学' || tag === '升学' || tag === '升学深造'
}

function salaryDisplay(s: { salary?: string | null; tag?: string }) {
  if (isFurtherStudyTag(s.tag)) return '—'
  if (s.salary && String(s.salary).trim()) return String(s.salary).trim()
  return '暂无薪资'
}

function openDrill(key: string) {
  drillRowsOverride.value = null
  selectedDrillKey.value = selectedDrillKey.value === key ? '' : key
  nextTick(() => {
    document.getElementById('ee-drill-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function resolveExistingSankeyKey(
  map: Record<string, EnrollmentEmploymentDrillSample[] | undefined>,
  sourceOrKey: string,
  target?: string,
): string | null {
  const arrow = '\u2192'
  const candidates: string[] = []
  if (target !== undefined) {
    candidates.push(
      `${sourceOrKey}${arrow}${target}`,
      `${sourceOrKey}->${target}`,
      target === '升学深造' ? `${sourceOrKey}${arrow}国内升学` : '',
      target === '国内升学' ? `${sourceOrKey}${arrow}升学深造` : '',
      target === '机关事业' ? `${sourceOrKey}${arrow}考公` : '',
      target === '出国升学' ? `${sourceOrKey}${arrow}出国` : '',
    )
  } else {
    candidates.push(
      sourceOrKey,
      sourceOrKey.replace('->', arrow),
      sourceOrKey.replace(arrow, '->'),
    )
    const parts = sourceOrKey.split(/\u2192|->/)
    if (parts.length === 2) {
      const [s, t] = parts
      candidates.push(
        t === '升学深造' ? `${s}${arrow}国内升学` : '',
        t === '国内升学' ? `${s}${arrow}升学深造` : '',
      )
    }
  }
  // 先精确命中，再模糊（避免错误优先返回其它连线）
  for (const k of candidates.filter(Boolean)) {
    if ((map[k]?.length ?? 0) > 0) return k
  }
  if (target !== undefined) {
    const fuzzy = Object.keys(map).find(
      (k) => k.includes(sourceOrKey) && k.includes(target) && (map[k]?.length ?? 0) > 0,
    )
    if (fuzzy) return fuzzy
  } else {
    const parts = sourceOrKey.split(/\u2192|->/)
    if (parts.length === 2) {
      const [s, t] = parts
      const fuzzy = Object.keys(map).find(
        (k) => k.includes(s) && k.includes(t) && (map[k]?.length ?? 0) > 0,
      )
      if (fuzzy) return fuzzy
    }
  }
  return null
}

function onOutcomeSankeyLinkClick(payload: {
  source: string
  target: string
  value: number
  drillKey?: string
  samples?: EnrollmentEmploymentDrillSample[]
}) {
  const apply = () => {
    selectedDestKey.value = ''
    const map = mergedDrillSamples.value
    const hit =
      (payload.samples?.length ? payload.drillKey : null) ||
      resolveExistingSankeyKey(map, payload.source, payload.target)
    const key = hit || payload.drillKey || `${payload.source}\u2192${payload.target}`
    selectedDrillKey.value = key
    if (payload.samples?.length) {
      drillRowsOverride.value = payload.samples
    } else {
      const resolved = resolveExistingSankeyKey(map, key) || key
      drillRowsOverride.value = map[resolved]?.length ? map[resolved]! : null
    }
    nextTick(() => {
      document.getElementById('ee-drill-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }
  if (mainTab.value !== 'graduation') {
    suppressDrillReset.value = true
    mainTab.value = 'graduation'
    nextTick(() => {
      apply()
      suppressDrillReset.value = false
    })
  } else {
    apply()
  }
}

function delta(curr: number, prev: number) {
  const d = curr - prev
  if (d > 0) return `↑${d}`
  if (d < 0) return `↓${Math.abs(d)}`
  return '→0'
}

const majorShareOption = computed<EChartsOption>(() => {
  const items = props.data.admission.majorShare
  return {
    grid: { left: 8, right: 48, top: 4, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { dataIndex?: number }
        const raw = items[item.dataIndex ?? 0]
        return `${raw?.major ?? ''}<br/>${raw?.count ?? 0} 人（${raw?.ratio ?? 0}%）<br/><span style="color:#9fe8ff">点击查看样本</span>`
      },
    },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.major.replace('科学与技术', '')),
      axisLabel: {
        ...AXIS_LABEL,
        color: '#c6e6ff',
        interval: 0,
        width: 96,
        overflow: 'truncate',
        ellipsis: '…',
      },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar',
      cursor: 'pointer',
      data: items.map((i) => ({
        value: i.ratio,
        name: i.major,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          borderWidth: selectedDrillKey.value === i.major ? 2 : 0,
          borderColor: selectedDrillKey.value === i.major ? '#fff6c8' : 'transparent',
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#126dff' },
              { offset: 1, color: '#65f7ff' },
            ],
          },
        },
      })),
      barWidth: 12,
      label: {
        show: true,
        position: 'right',
        color: '#eaf7ff',
        fontSize: CHART_FONT.label,
        formatter: '{c}%',
      },
    }],
  }
})

const provinceOption = computed<EChartsOption>(() => {
  const items = [...props.data.admission.sourceStructure.provinces].reverse()
  const mock = isMock('admission.sourceStructure.provinces')
  const barColor = mock ? COLLEGE_MOCK_DATA_COLOR : '#39e6ff'
  const activeColor = mock ? '#ff7875' : '#7ff0ff'
  return {
    grid: { left: 8, right: 44, top: 4, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { name?: string; value?: number }
        return `${item.name ?? ''}<br/>${item.value ?? 0} 人<br/><span style="color:#9fe8ff">点击查看样本</span>`
      },
    },
    xAxis: {
      type: 'value',
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.name),
      axisLabel: {
        ...AXIS_LABEL,
        color: '#c6e6ff',
        interval: 0,
        width: 72,
        overflow: 'truncate',
        ellipsis: '…',
      },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar',
      cursor: 'pointer',
      data: items.map((i) => ({
        value: i.count,
        name: i.name,
        itemStyle: {
          color: selectedDrillKey.value === i.name ? activeColor : barColor,
          borderRadius: [0, 4, 4, 0],
          borderWidth: selectedDrillKey.value === i.name ? 2 : 0,
          borderColor: selectedDrillKey.value === i.name ? '#fff6c8' : 'transparent',
        },
      })),
      barWidth: 10,
      label: {
        show: true,
        position: 'right',
        color: mock ? '#ffccc7' : '#c6e6ff',
        fontSize: CHART_FONT.label,
        formatter: '{c}',
      },
    }],
  }
})

const PROVINCE_NAME_MAP: Record<string, string> = {
  '广东': '广东省',
  '湖南': '湖南省',
  '江西': '江西省',
  '广西': '广西壮族自治区',
  '福建': '福建省',
  '浙江': '浙江省',
  '江苏': '江苏省',
  '湖北': '湖北省',
  '河南': '河南省',
  '山东': '山东省',
  '四川': '四川省',
  '云南': '云南省',
  '贵州': '贵州省',
  '海南': '海南省',
  '安徽': '安徽省',
  '河北': '河北省',
  '山西': '山西省',
  '陕西': '陕西省',
  '辽宁': '辽宁省',
  '吉林': '吉林省',
  '黑龙江': '黑龙江省',
  '北京': '北京市',
  '天津': '天津市',
  '上海': '上海市',
  '重庆': '重庆市',
  '内蒙古': '内蒙古自治区',
  '新疆': '新疆维吾尔自治区',
  '宁夏': '宁夏回族自治区',
  '西藏': '西藏自治区',
  '青海': '青海省',
  '甘肃': '甘肃省',
  '台湾': '台湾省',
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区',
}

const sourceMapOption = computed<EChartsOption>(() => {
  const sourceMap = new Map<string, number>()
  for (const f of chinaMapJson.features) {
    sourceMap.set(f.properties.name, 0)
  }
  for (const p of props.data.admission.sourceStructure.provinces) {
    const full = PROVINCE_NAME_MAP[p.name]
    if (full) sourceMap.set(full, p.count)
  }
  const provinces = Array.from(sourceMap, ([name, value]) => ({ name, value }))
  const max = Math.max(...provinces.map((p) => p.value), 1)
  const mock = isMock('admission.sourceStructure.provinces')
  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(3, 12, 28, 0.92)',
      borderColor: mock ? 'rgba(255, 77, 79, 0.55)' : 'rgba(0, 229, 255, 0.55)',
      textStyle: { color: '#cdf3ff', fontSize: 12 },
      formatter: (p: any) => `${p.name}<br/>生源人数：${p.value ?? 0} 人`,
    },
    visualMap: {
      min: 0,
      max,
      left: 16,
      bottom: 16,
      itemWidth: 12,
      itemHeight: 96,
      calculable: true,
      text: ['生源多', '生源少'],
      inRange: {
        color: mock
          ? ['#2a0a0a', '#a8071a', '#cf1322', '#ff4d4f', '#ffccc7']
          : ['#0b2a3a', '#0e7490', '#0891b2', '#22d3ee', '#a5f3ff'],
      },
      textStyle: { color: '#bfe9ff', fontSize: 11 },
    },
    series: [{
      type: 'map',
      map: 'china',
      roam: false,
      zoom: 1,
      aspectScale: 0.75,
      boundingCoords: [[76, 30], [135, 50]],
      layoutCenter: ['50%', '35%'],
      layoutSize: '100%',
      itemStyle: {
        borderColor: mock ? 'rgba(255, 150, 140, 0.45)' : 'rgba(120, 200, 230, 0.45)',
        borderWidth: 0.6,
        areaColor: '#0a1c2b',
      },
      emphasis: {
        label: { show: true, color: '#eaf7ff', fontWeight: 'bold' },
        itemStyle: {
          areaColor: mock ? COLLEGE_MOCK_DATA_COLOR : '#22d3ee',
          shadowBlur: 12,
          shadowColor: mock ? 'rgba(255, 77, 79, 0.7)' : 'rgba(34, 211, 238, 0.7)',
        },
      },
      label: { show: false },
      data: provinces,
    }],
  }
})

const admissionTrendOption = computed<EChartsOption>(() => {
  const t = props.data.admission.yearlyTrend
  const mockQi = isMock('admission.yearlyTrend.qualityIndex')
  const mockFc = isMock('admission.yearlyTrend.firstChoiceRate')
  const mockEnrolled = isMock('admission.yearlyTrend.enrolled')
  const bar = mockEnrolled ? COLLEGE_MOCK_DATA_COLOR : '#1a8cff'
  const lineA = mockQi ? COLLEGE_MOCK_DATA_COLOR : '#39e6ff'
  const lineB = mockFc ? '#ff7875' : '#ffd56a'
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: t.years,
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: [
      {
        type: 'value',
        name: '人数',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
      },
      {
        type: 'value',
        name: '指数/%',
        axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
        splitLine: { show: false },
      },
    ],
    series: [
      { name: '在校规模', type: 'bar', data: t.enrolled, itemStyle: { color: bar } },
      { name: '生源质量指数', type: 'line', yAxisIndex: 1, data: t.qualityIndex, itemStyle: { color: lineA }, lineStyle: { color: lineA } },
      { name: '一志愿率', type: 'line', yAxisIndex: 1, data: t.firstChoiceRate, itemStyle: { color: lineB }, lineStyle: { color: lineB } },
    ],
  }
})

const distItems = computed(() => props.data.graduation.distribution[distTab.value])

const distOption = computed(() => {
  const items = distItems.value
  const mock = distTab.value === 'salary' && isMock('graduation.distribution.salary')
  const c0 = mock ? '#a8071a' : '#126dff'
  const c1 = mock ? COLLEGE_MOCK_DATA_COLOR : '#65f7ff'
  // 左侧留给完整类目文字（单行不换行），柱条区域相应缩短
  const leftPad = distTab.value === 'region' ? 280 : distTab.value === 'industry' ? 260 : 100
  return {
    grid: {
      left: leftPad,
      right: 92,
      top: 4,
      bottom: 4,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { dataIndex?: number }
        const raw = items[item.dataIndex ?? 0]
        return `${raw?.name ?? ''}<br/>${raw?.count ?? 0} 人（${raw?.ratio ?? 0}%）<br/><span style="color:#9fe8ff">点击查看样本</span>`
      },
    },
    xAxis: {
      type: 'value' as const,
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category' as const,
      data: items.map((i) => i.name),
      axisLabel: {
        ...AXIS_LABEL,
        color: '#c6e6ff',
        interval: 0,
        width: leftPad - 14,
        overflow: 'none',
        align: 'right',
        margin: 10,
      },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar' as const,
      cursor: 'pointer',
      data: items.map((i) => ({
        value: i.ratio,
        name: i.name,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          borderWidth: selectedDrillKey.value === i.name ? 2 : 0,
          borderColor: selectedDrillKey.value === i.name ? '#fff6c8' : 'transparent',
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: c0 },
              { offset: 1, color: c1 },
            ],
          },
        },
      })),
      barWidth: 14,
      label: {
        show: true,
        position: 'right' as const,
        color: mock ? '#ffccc7' : '#eaf7ff',
        fontSize: CHART_FONT.label,
        formatter: (p: { dataIndex?: number }) => {
          const item = items[p.dataIndex ?? 0]
          return `${item?.count ?? ''}人 ${item?.ratio ?? ''}%`
        },
      },
    }],
  } as EChartsOption
})

const majorCompareOption = computed<EChartsOption>(() => {
  const items = props.data.graduation.majorCompare
  const shortName = (name: string) => {
    const map: Record<string, string> = {
      计算机科学与技术: '计科',
      '计算机科学与技术(实验区)': '计科实验区',
      软件工程: '软工',
      人工智能: '人工智能',
      大数据管理与应用: '大数据',
      '大数据管理与应用(佛山校区全学段)': '大数据(佛山)',
      电子商务: '电商',
      计算机技术: '计技(硕)',
      管理科学与工程: '管科(硕)',
      技术经济及管理: '技经(硕)',
    }
    return map[name] || name.replace('科学与技术', '').slice(0, 8)
  }
  return {
    grid: {
      left: 12,
      right: 12,
      top: 36,
      bottom: 8,
      containLabel: true,
    },
    legend: {
      top: 0,
      left: 'center',
      textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params]
        const idx = (list[0] as { dataIndex?: number })?.dataIndex ?? 0
        const item = items[idx]
        if (!item) return ''
        const head = `${item.major}${item.count != null ? ` · ${item.count} 人` : ''}`
        const lines = list.map((p) => {
          const row = p as { marker?: string; seriesName?: string; value?: number | string }
          return `${row.marker ?? ''}${row.seriesName ?? ''}: ${row.value ?? '—'}%`
        })
        return [head, ...lines].join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      data: items.map((i) => shortName(i.major)),
      axisTick: { alignWithLabel: true },
      axisLabel: {
        ...AXIS_LABEL,
        color: '#c6e6ff',
        interval: 0,
        rotate: 28,
        hideOverlap: false,
        margin: 12,
      },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 20,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [
      {
        name: '去向落实率',
        type: 'bar',
        barMaxWidth: 22,
        barGap: '30%',
        data: items.map((i) => i.placementRate),
        itemStyle: { color: '#39e6ff', borderRadius: [3, 3, 0, 0] },
        label: {
          show: true,
          position: 'top',
          distance: 4,
          color: '#9fe8ff',
          fontSize: 11,
          formatter: '{c}',
        },
      },
      {
        name: '高质量就业率',
        type: 'bar',
        barMaxWidth: 22,
        data: items.map((i) => i.highQualityRate),
        itemStyle: { color: '#ffd56a', borderRadius: [3, 3, 0, 0] },
        label: {
          show: true,
          position: 'top',
          distance: 4,
          color: '#ffe9a8',
          fontSize: 11,
          formatter: '{c}',
        },
      },
    ],
  }
})

const employmentTrendOption = computed<EChartsOption>(() => {
  const t = props.data.graduation.yearlyTrend
  const counts = t.cohortCounts ?? []
  const placeData = t.placementRate.map((v, i) => ({
    value: v,
    itemStyle: {
      color: isMock(`graduation.yearlyTrend.placementRate.${i}`) ? COLLEGE_MOCK_DATA_COLOR : '#39e6ff',
    },
  }))
  const hqData = t.highQualityRate.map((v, i) => ({
    value: v,
    itemStyle: {
      color: isMock(`graduation.yearlyTrend.highQualityRate.${i}`) ? '#ff7875' : '#ffd56a',
    },
  }))
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params]
        const idx = (list[0] as { dataIndex?: number })?.dataIndex ?? 0
        const year = t.years[idx] ?? ''
        const n = counts[idx]
        const head = n != null ? `${year}届 · ${n} 人` : `${year}届`
        const lines = list.map((p) => {
          const item = p as { marker?: string; seriesName?: string; value?: number | string }
          return `${item.marker ?? ''}${item.seriesName ?? ''}: ${item.value ?? '—'}%`
        })
        return [head, ...lines].join('<br/>')
      },
    },
    xAxis: {
      type: 'category',
      data: t.years.map((y) => `${y}届`),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8', formatter: '{value}%' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    series: [
      {
        name: '去向落实率',
        type: 'line',
        smooth: true,
        data: placeData,
        itemStyle: { color: '#39e6ff' },
        lineStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: t.placementRate.map((_, i) => ({
              offset: t.placementRate.length <= 1 ? 0 : i / (t.placementRate.length - 1),
              color: isMock(`graduation.yearlyTrend.placementRate.${i}`) ? COLLEGE_MOCK_DATA_COLOR : '#39e6ff',
            })),
          },
        },
      },
      {
        name: '高质量就业率',
        type: 'line',
        smooth: true,
        data: hqData,
        itemStyle: { color: '#ffd56a' },
        lineStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 0,
            colorStops: t.highQualityRate.map((_, i) => ({
              offset: t.highQualityRate.length <= 1 ? 0 : i / (t.highQualityRate.length - 1),
              color: isMock(`graduation.yearlyTrend.highQualityRate.${i}`) ? '#ff7875' : '#ffd56a',
            })),
          },
        },
      },
    ],
  }
})

function onDestClick(key: string, label: string) {
  selectedDestKey.value = selectedDestKey.value === key ? '' : key
  showGradSchools.value = key === 'domestic-grad' && selectedDestKey.value === key
  openDrill(label)
}

function onMajorShareClick(params: unknown) {
  const p = params as { data?: { name?: string }; name?: string; dataIndex?: number }
  let full = p.data?.name ?? ''
  if (!full && typeof p.dataIndex === 'number') {
    full = props.data.admission.majorShare[p.dataIndex]?.major ?? ''
  }
  if (!full && p.name) {
    full = props.data.admission.majorShare.find((i) =>
      i.major === p.name || i.major.replace('科学与技术', '') === p.name,
    )?.major ?? ''
  }
  if (full) openDrill(full)
}

function onProvinceClick(params: unknown) {
  const name = (params as { name?: string })?.name
  if (name && name !== '其他') openDrill(name)
}

function onDistClick(params: unknown) {
  const p = params as { name?: string; data?: { name?: string }; dataIndex?: number }
  let name = p.data?.name ?? ''
  if (!name && typeof p.dataIndex === 'number') {
    name = distItems.value[p.dataIndex]?.name ?? ''
  }
  if (!name && p.name) {
    name = distItems.value.find((i) => i.name === p.name)?.name ?? p.name
  }
  if (name) openDrill(name)
}
</script>

<template>
  <div class="ee-detail">
    <div class="ee-detail__toolbar">
      <div v-if="showInnerTabs" class="ee-detail__tabs">
        <button
          type="button"
          class="ee-detail__tab"
          :class="{ 'is-active': mainTab === 'admission' }"
          @click="mainTab = 'admission'"
        >
          招生入口分析
        </button>
        <button
          type="button"
          class="ee-detail__tab"
          :class="{ 'is-active': mainTab === 'graduation' }"
          @click="mainTab = 'graduation'"
        >
          毕业出口分析
        </button>
      </div>
      <div v-else class="ee-detail__mode-label">
        {{ mainTab === 'admission' ? '招生质量专题' : '就业分析专题' }}
      </div>
      <div class="ee-detail__filters">
        <label>
          年份
          <select v-model="year">
            <option v-for="item in data.filters.years" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
        <label>
          专业
          <select v-model="major">
            <option v-for="item in data.filters.majors" :key="item" :value="item">{{ item }}</option>
          </select>
        </label>
      </div>
    </div>

    <template v-if="mainTab === 'admission'">
      <div class="ee-detail__grid ee-detail__grid--admission">
        <div class="ee-detail__top-row">
          <section class="ee-detail__card ee-detail__card--map">
            <h3>生源省份分布</h3>
            <div class="ee-detail__chart ee-detail__chart--map" :class="{ 'is-mock-chart': isMock('admission.sourceStructure.provinces') }">
              <ChartContainer :option="sourceMapOption" />
            </div>
            <p class="ee-detail__map-note">未标注省份生源为 0 人</p>
          </section>

          <div class="ee-detail__right-stack">
            <section class="ee-detail__card ee-detail__card--scale" :class="{ 'is-focus': highlight === 'admission-scale' }">
              <h3>招生规模与吸引力 <small v-if="isMock('admission.scale.firstChoiceRate')" class="mock-tag">示意</small></h3>
              <div class="ee-detail__metrics">
                <div><span>在校本科</span><strong>{{ data.admission.scale.enrolledCount.toLocaleString('zh-CN') }}<small>人</small></strong></div>
                <div>
                  <span>一志愿报考率</span>
                  <strong>
                    <MockText :mock="isMock('admission.scale.firstChoiceRate')">{{ data.admission.scale.firstChoiceRate }}</MockText><small>%</small>
                  </strong>
                </div>
              </div>
            </section>

            <section class="ee-detail__card ee-detail__card--side" :class="{ 'is-focus': highlight === 'source-quality' }">
              <h3>
                生源质量
                <small
                  v-if="isMock('admission.quality.sourceQualityIndex') || isMock('admission.quality.avgRank')"
                  class="mock-tag"
                >部分示意</small>
              </h3>
              <div class="ee-detail__metrics ee-detail__metrics--quality">
                <div>
                  <span>生源质量指数</span>
                  <strong><MockText :mock="isMock('admission.quality.sourceQualityIndex') || isMock('sourceQualityIndex')">{{ data.admission.quality.sourceQualityIndex }}</MockText></strong>
                </div>
                <div>
                  <span>录取均分</span>
                  <strong><MockText :mock="isMock('admission.quality.avgScore')">{{ data.admission.quality.avgScore }}</MockText></strong>
                  <em>{{ delta(data.admission.quality.avgScore, data.admission.quality.prevAvgScore) }}</em>
                </div>
                <div>
                  <span>最低录取分</span>
                  <strong><MockText :mock="isMock('admission.quality.minScore')">{{ data.admission.quality.minScore }}</MockText></strong>
                  <em>{{ delta(data.admission.quality.minScore, data.admission.quality.prevMinScore) }}</em>
                </div>
                <div>
                  <span>平均录取位次</span>
                  <strong><MockText :mock="isMock('admission.quality.avgRank')">{{ data.admission.quality.avgRank.toLocaleString('zh-CN') }}</MockText></strong>
                  <em>{{ delta(data.admission.quality.prevAvgRank, data.admission.quality.avgRank) }}</em>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section class="ee-detail__card ee-detail__card--half">
          <h3>专业结构 <em class="ee-detail__hint">点击柱条下钻</em></h3>
          <div class="ee-detail__chart">
            <ChartContainer :option="majorShareOption" @chart-click="onMajorShareClick" />
          </div>
        </section>

        <section class="ee-detail__card ee-detail__card--half">
          <h3>
            生源结构
            <em class="ee-detail__hint">点击省份下钻</em>
          </h3>
          <div class="ee-detail__structure">
            <div class="ee-detail__bars">
              <div class="ee-detail__dual">
                <span>省内外比例</span>
                <div class="ee-detail__dual-track">
                  <i :style="{ width: `${data.admission.sourceStructure.inOutProvince.inProvince}%` }" />
                  <b :style="{ width: `${data.admission.sourceStructure.inOutProvince.outProvince}%` }" />
                </div>
                <em>
                  省内 {{ data.admission.sourceStructure.inOutProvince.inProvince }}%
                  · 省外 {{ data.admission.sourceStructure.inOutProvince.outProvince }}%
                </em>
              </div>
              <div class="ee-detail__dual">
                <span>男女比例</span>
                <div class="ee-detail__dual-track ee-detail__dual-track--gender">
                  <i :style="{ width: `${data.admission.sourceStructure.gender.male}%` }" />
                  <b :style="{ width: `${data.admission.sourceStructure.gender.female}%` }" />
                </div>
                <em>男 {{ data.admission.sourceStructure.gender.male }}% · 女 {{ data.admission.sourceStructure.gender.female }}%</em>
              </div>
            </div>
            <div
              class="ee-detail__chart ee-detail__chart--province"
              :class="{ 'is-mock-chart': isMock('admission.sourceStructure.provinces') }"
            >
              <ChartContainer :option="provinceOption" @chart-click="onProvinceClick" />
            </div>
          </div>
        </section>
      </div>

      <section class="ee-detail__card ee-detail__card--wide ee-detail__insights">
        <h3>深度挖掘 · 招生质量</h3>
        <div class="ee-detail__insight-grid">
          <article
            v-for="item in activeInsights"
            :key="item.title"
            class="ee-detail__insight"
            :class="`ee-detail__insight--${item.tone || 'info'}`"
          >
            <h4>{{ item.title }}</h4>
            <p>{{ item.detail }}</p>
          </article>
        </div>
        <div class="ee-detail__actions">
          <h4>建议动作</h4>
          <ol>
            <li v-for="(action, idx) in activeActions" :key="idx">{{ action }}</li>
          </ol>
        </div>
      </section>

      <section
        v-if="selectedDrillKey"
        id="ee-drill-panel"
        class="ee-detail__card ee-detail__card--wide ee-detail__drill"
      >
        <div class="ee-detail__drill-head">
          <h3>下钻样本 · {{ selectedDrillKey }}</h3>
          <button type="button" class="ee-detail__drill-close" @click="selectedDrillKey = ''; drillRowsOverride = null">收起</button>
        </div>
        <div v-if="activeDrillSamples.length" class="ee-detail__drill-table-wrap">
          <table class="ee-detail__drill-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>学历</th>
                <th>班级</th>
                <th>专业</th>
                <th>去向明细</th>
                <th>薪资</th>
                <th>标签</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, idx) in activeDrillSamples" :key="`${s.studentId || s.name}-${idx}`">
                <td class="ee-detail__drill-name">{{ s.name }}</td>
                <td class="ee-detail__drill-sid">{{ s.studentId || '—' }}</td>
                <td>{{ s.educationLevel || '—' }}</td>
                <td>{{ s.className || '—' }}</td>
                <td>{{ s.major }}</td>
                <td class="ee-detail__drill-detail">{{ s.detail }}</td>
                <td
                  class="ee-detail__drill-salary"
                  :class="{ 'ee-detail__drill-salary--empty': salaryDisplay(s) === '—' || salaryDisplay(s) === '暂无薪资' }"
                >{{ salaryDisplay(s) }}</td>
                <td><b v-if="s.tag">{{ s.tag }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="ee-detail__drill-empty">暂无该维度重点样本，可切换其他柱条继续挖掘。</p>
      </section>

      <div class="ee-detail__trend-flow">
        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'admission-trend' }">
          <h3>
            招生历年趋势
            <small
              v-if="isMock('admission.yearlyTrend.qualityIndex') || isMock('admission.yearlyTrend.firstChoiceRate')"
              class="mock-tag"
            >指数示意</small>
          </h3>
          <div class="ee-detail__chart ee-detail__chart--trend">
            <ChartContainer :option="admissionTrendOption" />
          </div>
        </section>

        <section
          v-if="flowSankey"
          id="ee-entrance-flow"
          class="ee-detail__card"
          :class="{ 'is-focus': highlight === 'entrance-flow' }"
        >
          <h3>入口流向 · 生源地 → 录取专业</h3>
          <p class="ee-detail__flow-desc">
            招生总数 {{ flowSankey.summary.entranceTotal }} 人 · 录取均分
            <MockText :mock="isMock('summary.avgEntranceScore')">{{ flowSankey.summary.avgEntranceScore }}</MockText>
          </p>
          <div class="ee-detail__flow-chart">
            <StudentFlowSankeyChart
              :show-title="false"
              title=""
              :mock="isMock('entrance')"
              :nodes="flowSankey.entrance.nodes"
              :links="flowSankey.entrance.links"
            />
          </div>
        </section>
      </div>
    </template>

    <template v-else>
      <div class="ee-detail__grid">
        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'exit-quality' }">
          <h3>出口质量</h3>
          <div class="ee-detail__metrics">
            <div><span>毕业去向落实率</span><strong>{{ data.graduation.exitQuality.placementRate }}<small>%</small></strong></div>
            <div><span>高质量毕业去向率</span><strong>{{ data.graduation.exitQuality.highQualityEmploymentRate }}<small>%</small></strong></div>
          </div>
          <div class="ee-detail__wordcloud">
            <div class="ee-detail__subtabs">
              <button type="button" :class="{ 'is-active': cloudTab === 'industry' }" @click="cloudTab = 'industry'">就业行业</button>
              <button type="button" :class="{ 'is-active': cloudTab === 'job' }" @click="cloudTab = 'job'">就业岗位</button>
            </div>
            <div class="ee-detail__cloud" :class="{ 'is-mock-chart': wordCloudMock }">
              <small v-if="wordCloudMock" class="mock-tag mock-tag--float">词云示意</small>
              <WordCloud v-if="activeCloud.length" :words="activeCloud" :colors="activeCloudColors" />
              <p v-else class="ee-detail__drill-empty">暂无词云数据</p>
            </div>
          </div>
        </section>

        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'high-quality-dest' }">
          <h3>高质量去向结构 <em class="ee-detail__hint">点击条目下钻</em></h3>
          <div class="ee-detail__dests">
            <button
              v-for="item in data.graduation.highQualityDest"
              :key="item.key"
              type="button"
              class="ee-detail__dest"
              :class="{ 'is-active': selectedDestKey === item.key || selectedDrillKey === item.label }"
              @click="onDestClick(item.key, item.label)"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}人</strong>
              <em>{{ item.ratio }}%</em>
              <div class="ee-detail__dest-bar">
                <i :style="{ width: `${hqDestMaxRatio ? (item.ratio / hqDestMaxRatio) * 100 : 0}%` }" />
              </div>
            </button>
          </div>
          <div v-if="showGradSchools" class="ee-detail__schools">
            <h4>高质量国内升学院校</h4>
            <ul>
              <li v-for="item in data.graduation.gradSchools" :key="item.name">
                <span>{{ item.name }}</span>
                <strong>{{ item.count }}人 · {{ item.ratio }}%</strong>
              </li>
            </ul>
          </div>
        </section>

        <section class="ee-detail__card ee-detail__card--chart-fill">
          <h3>就业分布 <em class="ee-detail__hint">点击柱条下钻</em> <small v-if="distTab === 'salary' && isMock('graduation.distribution.salary')" class="mock-tag">薪资示意</small></h3>
          <div class="ee-detail__subtabs">
            <button type="button" :class="{ 'is-active': distTab === 'industry' }" @click="distTab = 'industry'; selectedDrillKey = ''; drillRowsOverride = null">行业</button>
            <button type="button" :class="{ 'is-active': distTab === 'region' }" @click="distTab = 'region'; selectedDrillKey = ''; drillRowsOverride = null">地区</button>
            <button type="button" :class="{ 'is-active': distTab === 'salary' }" @click="distTab = 'salary'; selectedDrillKey = ''; drillRowsOverride = null">薪资</button>
          </div>
          <div class="ee-detail__chart ee-detail__chart--major" :class="{ 'is-mock-chart': distTab === 'salary' && isMock('graduation.distribution.salary') }">
            <ChartContainer :option="distOption" @chart-click="onDistClick" />
          </div>
        </section>

        <section class="ee-detail__card ee-detail__card--chart-fill">
          <h3>专业就业对比 <em class="ee-detail__hint">按本届人数 · 样本过少专业不入图</em></h3>
          <div class="ee-detail__chart ee-detail__chart--major">
            <ChartContainer :option="majorCompareOption" />
          </div>
        </section>
      </div>

      <section class="ee-detail__card ee-detail__card--wide ee-detail__insights">
        <div class="ee-detail__insights-head">
          <div>
            <h3>深度挖掘 · 就业分析</h3>
            <p class="ee-detail__insights-desc">
              缓存报告 · 来源
              <em>{{ empReport?.source || '未生成' }}</em>
              <span v-if="empReportStale" class="ee-detail__stale">数据已更新，建议重新分析</span>
            </p>
          </div>
          <div class="ee-detail__insights-actions">
            <button
              type="button"
              class="ee-detail__btn"
              :disabled="empReportAnalyzing || empReportLoading"
              @click="runEmpAnalysis"
            >
              {{ empReportAnalyzing ? '分析中…' : empReport ? '重新分析' : '生成分析' }}
            </button>
            <button
              type="button"
              class="ee-detail__btn ee-detail__btn--ghost"
              :disabled="!empReport"
              @click="showEmpReportModal = true"
            >
              查看完整报告
            </button>
          </div>
        </div>

        <p v-if="empReportError" class="ee-detail__insights-error">{{ empReportError }}</p>
        <p v-if="empReportLoading && !empReport" class="ee-detail__insights-loading">正在读取分析报告…</p>
        <p v-else class="ee-detail__insights-headline">{{ displayHeadline }}</p>

        <div class="ee-detail__insight-grid">
          <article
            v-for="item in displayInsights"
            :key="item.title"
            class="ee-detail__insight"
            :class="`ee-detail__insight--${item.tone || 'info'}`"
          >
            <h4>{{ item.title }}</h4>
            <p>{{ item.detail }}</p>
          </article>
        </div>
        <div v-if="!displayInsights.length && !empReportLoading" class="ee-detail__insights-empty">
          暂无缓存洞察。点击「生成分析」基于就业库表产出可核对报告。
        </div>
        <div class="ee-detail__actions">
          <h4>建议动作</h4>
          <ol>
            <li v-for="(action, idx) in displayActions" :key="idx">{{ action }}</li>
          </ol>
        </div>
      </section>

      <EmploymentAnalysisReportModal
        :open="showEmpReportModal"
        :report="empReport"
        @close="showEmpReportModal = false"
      />

      <div class="ee-detail__trend-flow">
        <section class="ee-detail__card" :class="{ 'is-focus': highlight === 'employment-trend' }">
          <h3>就业历年趋势 <em class="ee-detail__hint">按毕业届次 · 样本不足年份不入图</em></h3>
          <div class="ee-detail__chart ee-detail__chart--trend">
            <ChartContainer :option="employmentTrendOption" />
          </div>
        </section>

        <section
          v-if="flowSankey"
          id="ee-outcome-flow"
          class="ee-detail__card"
          :class="{ 'is-focus': highlight === 'outcome-flow' || highlight === 'employment-trend' }"
        >
          <h3>出口流向 · 专业 → 毕业去向 <em class="ee-detail__hint">点击连线查看学生名单</em></h3>
          <p class="ee-detail__flow-desc">
            毕业生 {{ flowSankey.summary.graduateTotal }} 人 · 就业率 {{ flowSankey.summary.employmentRate }}% · 升学率 {{ flowSankey.summary.furtherRate }}%
          </p>
          <div class="ee-detail__flow-chart">
            <StudentFlowSankeyChart
              :show-title="false"
              title=""
              :nodes="flowSankey.outcome.nodes"
              :links="flowSankey.outcome.links"
              :drill-samples="outcomeSankeyDrillSamples"
              @link-click="onOutcomeSankeyLinkClick"
            />
          </div>
        </section>
      </div>

      <section
        v-if="selectedDrillKey"
        id="ee-drill-panel"
        class="ee-detail__card ee-detail__card--wide ee-detail__drill"
      >
        <div class="ee-detail__drill-head">
          <h3>下钻样本 · {{ selectedDrillKey }}</h3>
          <button type="button" class="ee-detail__drill-close" @click="selectedDrillKey = ''; selectedDestKey = ''; drillRowsOverride = null">收起</button>
        </div>
        <div v-if="activeDrillSamples.length" class="ee-detail__drill-table-wrap">
          <table class="ee-detail__drill-table">
            <thead>
              <tr>
                <th>姓名</th>
                <th>学号</th>
                <th>学历</th>
                <th>班级</th>
                <th>专业</th>
                <th>去向明细</th>
                <th>薪资</th>
                <th>标签</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, idx) in activeDrillSamples" :key="`${s.studentId || s.name}-${idx}`">
                <td class="ee-detail__drill-name">{{ s.name }}</td>
                <td class="ee-detail__drill-sid">{{ s.studentId || '—' }}</td>
                <td>{{ s.educationLevel || '—' }}</td>
                <td>{{ s.className || '—' }}</td>
                <td>{{ s.major }}</td>
                <td class="ee-detail__drill-detail">{{ s.detail }}</td>
                <td
                  class="ee-detail__drill-salary"
                  :class="{ 'ee-detail__drill-salary--empty': salaryDisplay(s) === '—' || salaryDisplay(s) === '暂无薪资' }"
                >{{ salaryDisplay(s) }}</td>
                <td><b v-if="s.tag">{{ s.tag }}</b></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p v-else class="ee-detail__drill-empty">暂无该流向学生名单，可点击其他连线继续查看。</p>
      </section>
    </template>
  </div>
</template>

<style scoped lang="scss">
.mock-tag {
  margin-left: 8px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid rgba(255, 77, 79, 0.45);
  background: rgba(255, 77, 79, 0.12);
  color: #ff4d4f;
  font-size: 12px;
  font-weight: 600;
  font-style: normal;

  &--float {
    position: absolute;
    top: 6px;
    right: 8px;
    z-index: 2;
    margin-left: 0;
  }
}

.is-mock-chart {
  outline: 1px dashed rgba(255, 77, 79, 0.45);
  outline-offset: 2px;
  border-radius: 8px;
}

.ee-detail__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.ee-detail__tabs {
  display: inline-flex;
  gap: 6px;
  padding: 3px;
  border-radius: 8px;
  background: rgba(0, 40, 90, 0.35);
  border: 1px solid rgba(0, 200, 255, 0.18);
}

.ee-detail__tab {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #9ecae8;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;

  &.is-active {
    background: rgba(0, 140, 255, 0.35);
    color: #eaf7ff;
    box-shadow: 0 0 12px rgba(0, 200, 255, 0.25);
  }
}

.ee-detail__mode-label {
  color: #9fe8ff;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ee-detail__filters {
  display: flex;
  gap: 10px;

  label {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: #9ecae8;
    font-size: 16px;
    font-weight: 600;
  }

  select {
    min-width: 110px;
    padding: 6px 10px;
    border-radius: 4px;
    border: 1px solid rgba(0, 200, 255, 0.28);
    background: rgba(0, 40, 90, 0.45);
    color: #eaf7ff;
    font-size: 16px;
  }
}

.ee-detail__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;

  &--admission {
    grid-template-columns: repeat(4, 1fr);
  }
}

.ee-detail__top-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) 1fr;
  gap: 12px;
  align-items: start;
}

.ee-detail__right-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  align-self: stretch;
}

.ee-detail__card--scale {
  grid-column: span 1;
  align-self: stretch;
}

.ee-detail__card--map {
  align-items: center;
  padding-top: 4px;

  h3 {
    margin-bottom: 2px;
  }
}

.ee-detail__card--half {
  grid-column: span 2;
}

.ee-detail__card--side {
  grid-column: span 1;
  align-self: stretch;
  flex: 1 1 auto;

  .ee-detail__metrics > div {
    display: flex;
    flex-flow: row wrap;
    align-items: baseline;
    row-gap: 4px;

    span {
      flex-basis: 100%;
    }

    strong {
      flex: 1 1 auto;
    }
  }

  .ee-detail__metrics strong {
    font-size: 30px;
  }

  .ee-detail__metrics span {
    font-size: 17px;
  }

  .ee-detail__metrics em {
    font-size: 19px;
    margin-left: auto;
  }
}

.ee-detail__card {
  display: flex;
  flex-direction: column;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.22);

  &--wide {
    margin-top: 12px;
    overflow: visible;
  }

  &.is-focus {
    border-color: rgba(255, 213, 106, 0.55);
    box-shadow: 0 0 16px rgba(255, 213, 106, 0.18);
  }

  h3 {
    margin: 0 0 6px;
    color: #d8f0ff;
    font-size: 24px;
    font-weight: 700;
  }

  h4 {
    margin: 10px 0 6px;
    color: #9fe8ff;
    font-size: 24px;
  }
}

.ee-detail__metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  &--stack {
    grid-template-columns: 1fr;
  }

  &--quality {
    grid-template-columns: 1fr;
    flex: 1;
    grid-template-rows: repeat(4, 1fr);
    gap: 10px;
  }

  > div {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px;
    border-radius: 6px;
    background: rgba(0, 60, 120, 0.22);

    span {
      color: #9ecae8;
      font-size: 20px;
    }

    strong {
      color: #eaf7ff;
      font-size: 40px;
      font-weight: 800;

      small {
        margin-left: 2px;
        font-size: 20px;
        color: #9ecae8;
      }
    }

    em {
      color: #63ffe1;
      font-style: normal;
      font-size: 16px;
    }
  }
}

.ee-detail__chart {
  height: 300px;

  &--province {
    height: 220px;
  }

  &--trend {
    height: 400px;
    min-height: 360px;
  }

  &--major {
    height: 360px;
    min-height: 320px;
  }

  &--map {
    width: 1200px;
    max-width: 100%;
    height: 600px;
    flex: 0 0 auto;
    margin: 0 auto;
  }
}

.ee-detail__card--chart-fill {
  display: flex;
  flex-direction: column;
  min-height: 0;

  .ee-detail__chart--major {
    flex: 1 1 auto;
  }
}

.ee-detail__map-note {
  margin: 4px 2px 0;
  color: #8fb8d6;
  font-size: 12px;
  text-align: right;
}

.ee-detail__structure {
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 10px;
}

.ee-detail__trend-flow {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ee-detail__dual {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;

  span,
  em {
    color: #9ecae8;
    font-size: 24px;
  }

  em {
    font-style: normal;
  }
}

.ee-detail__dual-track {
  display: flex;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(0, 40, 90, 0.4);

  i,
  b {
    display: block;
    height: 100%;
  }

  i {
    background: linear-gradient(90deg, #1a8cff, #39e6ff);
  }

  b {
    background: linear-gradient(90deg, #5a7a9a, #9ecae8);
  }

  &--gender {
    i {
      background: linear-gradient(90deg, #1a8cff, #4db8ff);
    }

    b {
      background: linear-gradient(90deg, #ff7eb3, #ffb3d1);
    }
  }
}

.ee-detail__dests {
  display: grid;
  gap: 10px;
}

.ee-detail__dest {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 8px 12px;
  align-items: center;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 50, 100, 0.2);
  color: #c6e6ff;
  text-align: left;
  cursor: pointer;

  &.is-active,
  &:hover {
    border-color: rgba(0, 242, 255, 0.45);
  }

  > span {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: #eaf7ff;
  }

  strong,
  em {
    color: #7fe9ff;
    font-style: normal;
    white-space: nowrap;
    font-size: 18px;
    font-weight: 700;
  }

  .ee-detail__dest-bar {
    grid-column: 1 / -1;
    height: 8px;
    border-radius: 999px;
    background: rgba(0, 40, 90, 0.45);

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #126dff, #65f7ff);
    }
  }
}

.ee-detail__schools ul {
  margin: 0;
  padding: 0;
  list-style: none;

  li {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    padding: 5px 0;
    border-bottom: 1px solid rgba(0, 200, 255, 0.1);
    color: #c6e6ff;
    font-size: 24px;

    strong {
      color: #7fe9ff;
      white-space: nowrap;
    }
  }
}

.ee-detail__subtabs {
  display: inline-flex;
  gap: 6px;
  margin-bottom: 8px;

  button {
    padding: 6px 14px;
    border-radius: 6px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: transparent;
    color: #9ecae8;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;

    &.is-active {
      background: rgba(0, 140, 255, 0.3);
      color: #eaf7ff;
    }
  }
}

.ee-detail__flow-desc {
  margin: -4px 0 10px;
  color: #9ecae8;
  font-size: 20px;
  line-height: 1.5;
}

.ee-detail__flow-chart {
  height: 400px;
  min-height: 360px;
  overflow: visible;
}

.ee-detail__wordcloud {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(0, 200, 255, 0.18);

  .ee-detail__subtabs {
    margin-bottom: 2px;
  }
}

.ee-detail__cloud {
  position: relative;
  height: 280px;
  margin-top: 8px;

  .wordcloud {
    height: 100%;
  }
}

.ee-detail__hint {
  margin-left: 8px;
  font-style: normal;
  font-size: 16px;
  font-weight: 600;
  color: #7fe9ff;
}

.ee-detail__insights {
  h3 {
    margin-bottom: 12px;
  }
}

.ee-detail__insights-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;

  h3 {
    margin: 0;
  }
}

.ee-detail__insights-desc {
  margin: 6px 0 0;
  color: rgba(184, 236, 255, 0.72);
  font-size: 14px;

  em {
    font-style: normal;
    color: #7dd3fc;
  }
}

.ee-detail__stale {
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
  font-size: 12px;
}

.ee-detail__insights-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ee-detail__btn {
  border: 1px solid rgba(0, 242, 255, 0.35);
  background: rgba(0, 80, 120, 0.35);
  color: #e8f7ff;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 14px;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    border-color: rgba(0, 242, 255, 0.7);
  }

  &--ghost {
    background: transparent;
  }
}

.ee-detail__insights-headline {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 80, 0.28);
  color: rgba(220, 240, 255, 0.9);
  font-size: 14px;
  line-height: 1.55;
}

.ee-detail__insights-error {
  margin: 0 0 10px;
  color: #fca5a5;
  font-size: 14px;
}

.ee-detail__insights-loading,
.ee-detail__insights-empty {
  margin: 0 0 12px;
  color: rgba(184, 236, 255, 0.72);
  font-size: 14px;
}

.ee-detail__insight-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.ee-detail__insight {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 50, 100, 0.22);

  h4 {
    margin: 0 0 6px;
    color: #eaf7ff;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #9ecae8;
    font-size: 16px;
    line-height: 1.55;
  }

  &--good {
    border-color: rgba(46, 230, 168, 0.35);
    background: rgba(20, 90, 70, 0.22);
  }

  &--warn {
    border-color: rgba(255, 180, 90, 0.4);
    background: rgba(90, 60, 20, 0.22);
  }
}

.ee-detail__actions {
  margin-top: 12px;
  padding: 12px;
  border-radius: 8px;
  border: 1px dashed rgba(0, 200, 255, 0.28);
  background: rgba(0, 40, 90, 0.2);

  h4 {
    margin: 0 0 8px;
    color: #9fe8ff;
    font-size: 18px;
  }

  ol {
    margin: 0;
    padding-left: 20px;
    color: #c6e6ff;
    font-size: 16px;
    line-height: 1.6;
  }
}

.ee-detail__drill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;

  h3 {
    margin: 0;
  }
}

.ee-detail__drill-close {
  border: 1px solid rgba(0, 200, 255, 0.28);
  border-radius: 6px;
  background: rgba(0, 80, 140, 0.25);
  color: #9fe8ff;
  font-size: 16px;
  font-weight: 700;
  padding: 4px 12px;
  cursor: pointer;

  &:hover {
    background: rgba(0, 120, 200, 0.35);
  }
}

.ee-detail__drill-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.ee-detail__drill-table {
  width: max-content;
  min-width: 100%;
  border-collapse: collapse;
  table-layout: auto;

  th,
  td {
    padding: 10px 14px;
    text-align: left;
    vertical-align: middle;
    border-bottom: 1px solid rgba(0, 200, 255, 0.12);
    font-size: 15px;
    color: #c6e6ff;
    white-space: nowrap;
    word-break: keep-all;
  }

  th {
    color: #9fe8ff;
    font-size: 14px;
    font-weight: 700;
    background: rgba(0, 60, 120, 0.28);
  }
}

.ee-detail__drill-name {
  color: #eaf7ff;
  font-weight: 800;
}

.ee-detail__drill-sid {
  color: #7fe9ff;
  font-family: ui-monospace, Consolas, monospace;
  font-size: 14px;
}

.ee-detail__drill-detail {
  color: #9ecae8;
  line-height: 1.4;
}

.ee-detail__drill-salary {
  color: #63ffe1;
  font-weight: 700;

  &--empty {
    color: rgba(158, 202, 232, 0.55);
    font-weight: 500;
  }
}

.ee-detail__drill-table b {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #ffd56a;
  border: 1px solid rgba(255, 210, 90, 0.35);
  background: rgba(200, 160, 40, 0.14);
}

.ee-detail__drill-list {
  display: none;
}

.ee-detail__drill-empty {
  margin: 0;
  padding: 16px;
  text-align: center;
  color: #8eaec8;
  font-size: 16px;
}

@media (max-width: 1100px) {
  .ee-detail__grid,
  .ee-detail__structure,
  .ee-detail__insight-grid {
    grid-template-columns: 1fr;
  }
}
</style>
