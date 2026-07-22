<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { teacherService } from '@/api/college/services/teacher'
import { useScope } from '@/composables/useScope'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { TeacherAnalyticsDetailVM } from '@/types/college/view/teacher-analytics'

const route = useRoute()
const { collegeScope } = useScope()

const data = ref<TeacherAnalyticsDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Tab 切换
type TabKey = 'resource-base' | 'structure-analysis' | 'teaching-investment' | 'capacity-building' | 'performance-analysis' | 'warning-center' | 'major-support'
const currentTab = ref<TabKey>('resource-base')
const tabBarRef = ref<HTMLElement | null>(null)

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function switchTab(tab: TabKey) {
  currentTab.value = tab
  nextTick(() => {
    getDetailScroller()?.scrollTo({ top: 0, behavior: 'auto' })
  })
}

// 当前聚焦的指标（Part 1 用）
const activeSection = ref<string>('')

const sections = [
  { id: 'total-teachers', label: '专任教师', icon: '👨‍🏫' },
  { id: 'phd-ratio', label: '博士占比', icon: '🎓' },
  { id: 'senior-title', label: '高级职称占比', icon: '📊' },
  { id: 'high-talent', label: '高层次人才', icon: '🏆' },
  { id: 'student-teacher', label: '生师比', icon: '📐' },
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

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    data.value = await teacherService.fetchTeacherDetail(collegeScope.value)
    const hash = route.hash?.replace('#', '')
    if (hash) {
      // 如果在 Part 1 的 section，切换到 Part 1
      if (sections.some((s) => s.id === hash)) {
        currentTab.value = 'resource-base'
        setTimeout(() => scrollToSection(hash), 300)
      } else if (hash === 'structure-analysis') {
        currentTab.value = 'structure-analysis'
      }
    }
  } catch (e: any) {
    error.value = e?.message || '加载失败'
  } finally {
    loading.value = false
  }
})

watch(() => route.hash, (hash) => {
  const id = hash?.replace('#', '')
  if (id && sections.some((s) => s.id === id)) {
    currentTab.value = 'resource-base'
    setTimeout(() => scrollToSection(id), 100)
  }
})

// ============ Part 1 图表 ============

const titleBarOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.titleStructure
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: {
      type: 'value',
      max: Math.ceil(maxVal * 1.2),
      axisLabel: { show: false },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.title),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: items.map((i) => i.count),
      barWidth: 16,
      label: {
        show: true, position: 'right', color: '#eaf7ff',
        fontSize: CHART_FONT.label, formatter: '{c}人',
      },
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1a8cff' }, { offset: 1, color: '#5cecff' }] },
      },
    }],
  }
})

const educationPieOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.structure.education
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)', backgroundColor: 'rgba(2, 14, 38, 0.94)', borderColor: 'rgba(0, 242, 255, 0.65)', textStyle: { color: '#f4fbff', fontSize: 20 } },
    legend: { bottom: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    series: [{
      type: 'pie', radius: ['45%', '72%'], center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: 'rgba(2, 14, 38, 0.8)', borderWidth: 2 },
      label: { show: true, position: 'outside', formatter: '{b}\n{d}%', color: '#c6e6ff', fontSize: CHART_FONT.label },
      data: items.map((i, idx) => ({
        value: i.count, name: i.label,
        itemStyle: {
          color: idx === 0
            ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#00e5ff' }, { offset: 1, color: '#007acc' }] }
            : idx === 1
              ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#5c9cff' }, { offset: 1, color: '#2d6fcf' }] }
              : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#8899bb' }, { offset: 1, color: '#556688' }] },
        },
      })),
    }],
  }
})

const titlePieOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.structure.title
  const colors = [
    { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ffd56a' }, { offset: 1, color: '#d4a017' }] },
    { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#5cecff' }, { offset: 1, color: '#1a8cff' }] },
    { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#98aacc' }, { offset: 1, color: '#667799' }] },
  ]
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)', backgroundColor: 'rgba(2, 14, 38, 0.94)', borderColor: 'rgba(0, 242, 255, 0.65)', textStyle: { color: '#f4fbff', fontSize: 20 } },
    legend: { bottom: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    series: [{
      type: 'pie', radius: ['45%', '72%'], center: ['50%', '48%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 4, borderColor: 'rgba(2, 14, 38, 0.8)', borderWidth: 2 },
      label: { show: true, position: 'outside', formatter: '{b}\n{d}%', color: '#c6e6ff', fontSize: CHART_FONT.label },
      data: items.map((i, idx) => ({
        value: i.count, name: i.label,
        itemStyle: { color: colors[idx] || colors[2] },
      })),
    }],
  }
})

const stRatioBarOption = computed(() => {
  if (!data.value) return {}
  const comparisons = data.value.majorComparison
  const allItems = [
    { name: '学院整体', ratio: parseFloat(data.value.summary.studentTeacherRatio.replace('1:', '')) || 18.5 },
    ...comparisons.map((c) => ({ name: c.major, ratio: parseFloat(c.studentTeacherRatio.replace('1:', '')) || 18 })),
  ]
  return {
    grid: { left: 8, right: 30, top: 10, bottom: 6, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: { type: 'value', name: '生师比 (1:N)', nameTextStyle: { color: '#8ec8e8', fontSize: 18 }, axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' }, splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } } },
    yAxis: { type: 'category', data: allItems.map((i) => i.name), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 18 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 14,
      data: allItems.map((i, idx) => ({
        value: i.ratio,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: idx === 0
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#00e5ff' }, { offset: 1, color: '#00a0cc' }] }
            : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#5c9cff' }, { offset: 1, color: '#3068b0' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '1:{c}' },
    }],
  }
})

const highTalentCount = computed(() => data.value?.summary.highLevelTalentCount ?? 0)

// ============ 资源基础总体评价（对照学科评估 / 博士点申请标准） ============
interface StandardItem {
  key: string
  name: string
  actual: string
  requirement: string
  passed: boolean
}

// 生师比数值（如 "18:1" -> 18）
const stRatioNum = computed(() => {
  const m = (data.value?.summary.studentTeacherRatio ?? '').match(/(\d+(?:\.\d+)?)\s*:/)
  return m ? parseFloat(m[1]) : 99
})

// 学科评估（申报 / 参评）参考线：博士占比取优势学科常见目标 80%，其余为通用门槛
const disciplineEval = computed<StandardItem[]>(() => {
  const s = data.value?.summary
  if (!s) return []
  return [
    { key: 'teacher', name: '专任教师规模', actual: `${s.totalTeachers} 人`, requirement: '≥ 120 人', passed: s.totalTeachers >= 120 },
    { key: 'phd', name: '博士学历占比', actual: `${s.phdRatio}%`, requirement: '≥ 80%', passed: s.phdRatio >= 80 },
    { key: 'senior', name: '高级职称占比', actual: `${s.seniorTitleRatio}%`, requirement: '≥ 50%', passed: s.seniorTitleRatio >= 50 },
    { key: 'talent', name: '高层次人才', actual: `${s.highLevelTalentCount} 人`, requirement: '≥ 5 人', passed: s.highLevelTalentCount >= 5 },
    { key: 'st', name: '生师比', actual: s.studentTeacherRatio, requirement: '≤ 18:1', passed: stRatioNum.value <= 18 },
  ]
})

// 一级学科博士点申请参考线：高级职称取申博常见正高比例门槛 55%
const phdProgramEval = computed<StandardItem[]>(() => {
  const s = data.value?.summary
  if (!s) return []
  return [
    { key: 'teacher', name: '专任教师规模', actual: `${s.totalTeachers} 人`, requirement: '≥ 100 人', passed: s.totalTeachers >= 100 },
    { key: 'phd', name: '博士学历占比', actual: `${s.phdRatio}%`, requirement: '≥ 60%', passed: s.phdRatio >= 60 },
    { key: 'senior', name: '高级职称占比', actual: `${s.seniorTitleRatio}%`, requirement: '≥ 55%', passed: s.seniorTitleRatio >= 55 },
    { key: 'talent', name: '省部级以上人才', actual: `${s.highLevelTalentCount} 人`, requirement: '≥ 5 人', passed: s.highLevelTalentCount >= 5 },
    { key: 'st', name: '生师比', actual: s.studentTeacherRatio, requirement: '≤ 18:1', passed: stRatioNum.value <= 18 },
  ]
})

function evalSummary(items: StandardItem[]) {
  const pass = items.filter((i) => i.passed).length
  return { pass, total: items.length }
}

function levelOf(pass: number, total: number) {
  if (pass === total) return { cls: 'is-high', text: '达标' }
  if (pass >= total - 1) return { cls: 'is-mid', text: '基本达标' }
  return { cls: 'is-low', text: '未达标' }
}

const disciplineLevel = computed(() => {
  const { pass, total } = evalSummary(disciplineEval.value)
  const lv = levelOf(pass, total)
  return { ...lv, tip: lv.cls === 'is-high' ? '具备申报优势' : lv.cls === 'is-mid' ? '个别项待补强' : '多项短板需重点建设' }
})

const phdLevel = computed(() => {
  const { pass, total } = evalSummary(phdProgramEval.value)
  const lv = levelOf(pass, total)
  return { ...lv, tip: lv.cls === 'is-high' ? '满足申请门槛' : lv.cls === 'is-mid' ? '个别项待补强' : '需重点建设' }
})

// ============ 结构分析整体评价 ============
const structureEvaluation = computed(() => {
  const s = data.value?.structure
  const total = data.value?.summary.totalTeachers ?? 0
  if (!s) return ''
  const age = s.age
  const young = age[0]?.ratio ?? 0 // 35岁以下
  const mid = (age[1]?.ratio ?? 0) + (age[2]?.ratio ?? 0) // 35-55岁
  const old = age[3]?.ratio ?? 0 // 55岁以上
  const shape =
    mid > young && mid > old && young > old
      ? '呈橄榄型（中年骨干为核心、青年与资深两端递减）'
      : '年龄分布较为均衡'
  const youngLevel =
    young < 20 ? '青年师资储备略显不足' : young <= 35 ? '青年教师比例适中' : '青年教师占比偏高'
  const retire = s.retirementForecast.reduce((a, i) => a + i.count, 0)
  const retireRatio = total > 0 ? (retire / total) * 100 : 0
  const retireLevel =
    retireRatio < 8 ? '未来五年退休压力较轻' : retireRatio <= 15 ? '未来五年退休压力一般' : '未来五年退休压力较大'
  return `${shape}，${youngLevel}，${retireLevel}（近5年预计退休 ${retire} 人，占 ${retireRatio.toFixed(1)}%）。`
})

// ============ Part 2 图表 ============

const ageBarOption = computed(() => {
  if (!data.value) return {}
  const items = [...data.value.structure.age].reverse()
  const pinkColors = ['#ff6b9d', '#ff8a65', '#ffa94d', '#ffd56a']
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: items.map((i) => i.label), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 16,
      data: items.map((i, idx) => ({
        value: i.count,
        ratio: i.ratio,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: pinkColors[idx % pinkColors.length] },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: (p: any) => `${p.value}人{percent|(${p.data.ratio}%)}`, rich: { percent: { fontSize: Math.round(CHART_FONT.label * 0.7), color: '#8fb8d6', padding: [0, 0, 0, 4] } } },
    }],
  }
})

const majorDirectionBarOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.structure.majorDirection
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: { type: 'value', max: Math.ceil(maxVal * 1.25), axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: items.map((i) => i.label), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 18 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 14,
      data: items.map((i) => ({
        value: i.count,
        itemStyle: { borderRadius: [0, 4, 4, 0], color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#7c3aed' }] } },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '{c}人' },
    }],
  }
})

const retirementLineOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.structure.retirementForecast
  return {
    grid: { left: 8, right: 12, top: 20, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2, 14, 38, 0.94)', borderColor: 'rgba(255, 160, 80, 0.65)', textStyle: { color: '#f4fbff', fontSize: 20 } },
    xAxis: { type: 'category', data: items.map((i) => `${i.year}年`), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' } },
    yAxis: { type: 'value', name: '退休人数', axisLabel: { ...AXIS_LABEL, color: '#9ecae8' }, splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } } },
    series: [
      {
        type: 'bar', name: '退休人数', barWidth: 22,
        data: items.map((i) => ({
          value: i.count,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ff8a65' }, { offset: 1, color: '#e64a19' }] },
          },
        })),
        label: { show: true, position: 'top', color: '#ffab91', fontSize: CHART_FONT.label, formatter: '{c}人' },
      },
      {
        type: 'line', name: '累计退休', smooth: true,
        data: items.reduce((acc: number[], item, idx) => { acc.push((acc[idx - 1] || 0) + item.count); return acc }, []),
        lineStyle: { color: '#ffd56a', width: 2, type: 'dashed' },
        itemStyle: { color: '#ffd56a' },
        label: { show: true, position: 'top', color: '#ffd56a', fontSize: CHART_FONT.label, formatter: '{c}人' },
      },
    ],
  }
})

// ============ Part 3 图表 & 状态 ============

const hourDistBarOption = computed(() => {
  if (!data.value) return {}
  const items = data.value.teachingInvestment.hourDistribution
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 16, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: { type: 'value', max: Math.ceil(maxVal * 1.25), axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: items.map((i) => i.range), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 18,
      data: items.map((i, idx) => ({
        value: i.count,
        ratio: i.ratio,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: idx >= 3
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ff6b6b' }, { offset: 1, color: '#e64a19' }] }
            : idx === 2
              ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ffa94d' }, { offset: 1, color: '#f59e0b' }] }
              : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#5cecff' }, { offset: 1, color: '#1a8cff' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: (p: any) => `${p.value}人{percent|(${p.data.ratio}%)}`, rich: { percent: { fontSize: Math.round(CHART_FONT.label * 0.7), color: '#8fb8d6', padding: [0, 0, 0, 4] } } },
    }],
  }
})

/** 教师学年课时标准差（总体），反映课时均衡度 */
const hoursStdDev = computed(() => {
  const list = data.value?.teachingInvestment.teacherCourses ?? []
  if (list.length === 0) return 0
  const mean = list.reduce((s, t) => s + t.totalHours, 0) / list.length
  const variance = list.reduce((s, t) => s + (t.totalHours - mean) ** 2, 0) / list.length
  return Math.round(Math.sqrt(variance))
})

/** 课时基尼系数（0~1），越低越均衡 */
const hoursGini = computed(() => {
  const list = (data.value?.teachingInvestment.teacherCourses ?? []).map((t) => t.totalHours).sort((a, b) => a - b)
  const n = list.length
  if (n === 0) return 0
  const sum = list.reduce((s, v) => s + v, 0)
  if (sum === 0) return 0
  let cum = 0
  list.forEach((v, i) => { cum += (i + 1) * v })
  return Math.round(((2 * cum) / (n * sum) - (n + 1) / n) * 100) / 100
})

const expandedOverload = ref<Set<number>>(new Set())

function toggleOverload(idx: number) {
  if (expandedOverload.value.has(idx)) {
    expandedOverload.value.delete(idx)
  } else {
    expandedOverload.value.add(idx)
  }
  expandedOverload.value = new Set(expandedOverload.value)
}

// ============ Part 4 图表 ============

const yearlyTrendOption = computed(() => {
  if (!data.value) return {}
  const trend = data.value.capacityBuilding.yearlyTrend
  return {
    grid: { left: 8, right: 12, top: 28, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2, 14, 38, 0.94)', borderColor: 'rgba(0, 242, 255, 0.65)', textStyle: { color: '#f4fbff', fontSize: 20 } },
    xAxis: { type: 'category', data: trend.map((i) => i.year), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff' } },
    yAxis: { type: 'value', axisLabel: { ...AXIS_LABEL, color: '#9ecae8' }, splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } } },
    series: [
      { name: '新增博士', type: 'line', smooth: true, data: trend.map((i) => i.newPhd), lineStyle: { color: '#5cecff', width: 2 }, itemStyle: { color: '#5cecff' } },
      { name: '新增教授', type: 'line', smooth: true, data: trend.map((i) => i.newProfessor), lineStyle: { color: '#ffd56a', width: 2 }, itemStyle: { color: '#ffd56a' } },
      { name: '新增人才', type: 'line', smooth: true, data: trend.map((i) => i.newTalent), lineStyle: { color: '#6effc2', width: 2 }, itemStyle: { color: '#6effc2' } },
      { name: '培训次数', type: 'bar', data: trend.map((i) => i.training), barWidth: 12, itemStyle: { color: 'rgba(167,139,250,0.45)' } },
      { name: '访学人数', type: 'bar', data: trend.map((i) => i.visiting), barWidth: 12, itemStyle: { color: 'rgba(255,160,80,0.4)' } },
    ],
  }
})

// ============ Part 4 能力建设：来源筛选 + 年份展开 ============

type SourceFilter = 'all' | 'introduced' | 'developed'

const phdFilter = ref<SourceFilter>('all')
const professorFilter = ref<SourceFilter>('all')
const talentFilter = ref<SourceFilter>('all')

const phdExpandedYear = ref<string | null>(null)
const professorExpandedYear = ref<string | null>(null)
const talentExpandedYear = ref<string | null>(null)

const phdYearRows = computed(() => {
  const cb = data.value?.capacityBuilding
  if (!cb) return []
  if (phdFilter.value === 'all') return cb.newPhds
  const map = new Map<string, number>()
  cb.newPhdPeople
    .filter((p) => p.source === phdFilter.value)
    .forEach((p) => map.set(p.year, (map.get(p.year) ?? 0) + 1))
  return [...map.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
})

const professorYearRows = computed(() => {
  const cb = data.value?.capacityBuilding
  if (!cb) return []
  if (professorFilter.value === 'all') return cb.newProfessors
  const map = new Map<string, number>()
  cb.newProfessorPeople
    .filter((p) => p.source === professorFilter.value)
    .forEach((p) => map.set(p.year, (map.get(p.year) ?? 0) + 1))
  return [...map.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
})

const talentYearRows = computed(() => {
  const cb = data.value?.capacityBuilding
  if (!cb) return []
  const map = new Map<string, number>()
  cb.newTalents
    .filter((p) => talentFilter.value === 'all' || p.source === talentFilter.value)
    .forEach((p) => map.set(p.year, (map.get(p.year) ?? 0) + 1))
  return [...map.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year.localeCompare(b.year))
})

watch(phdFilter, () => { phdExpandedYear.value = null })
watch(professorFilter, () => { professorExpandedYear.value = null })
watch(talentFilter, () => { talentExpandedYear.value = null })


// ============ Part 5 绩效分析 ============

const scatterOption = computed(() => {
  if (!data.value) return {}
  const teachers = data.value.performanceAnalysis.teachers
  const catColors: Record<string, string> = {
    'dual-excellent': '#ffd56a',
    'research-outstanding': '#5cecff',
    'teaching-outstanding': '#6effc2',
    'needs-improvement': '#ff8a65',
  }
  const catLabels: Record<string, string> = {
    'dual-excellent': '双优',
    'research-outstanding': '科研突出',
    'teaching-outstanding': '教学突出',
    'needs-improvement': '待提升',
  }
  const categories = ['dual-excellent', 'research-outstanding', 'teaching-outstanding', 'needs-improvement'] as const

  const seriesData: any[] = categories.map((cat) => ({
    type: 'scatter',
    name: catLabels[cat],
    symbolSize: cat === 'needs-improvement' ? 16 : cat === 'dual-excellent' ? 20 : 18,
    data: teachers
      .filter((t) => t.category === cat)
      .map((t) => ({
        value: [t.teachingScore, t.researchScore],
        name: t.name,
        title: t.title,
        major: t.major,
        category: t.category,
        categoryLabel: catLabels[t.category],
      })),
    itemStyle: { color: catColors[cat], shadowBlur: 6, shadowColor: catColors[cat] },
  }))

  // 分界线放在第一个系列上
  if (seriesData.length > 0) {
    seriesData[0].markLine = {
      silent: true,
      symbol: 'none',
      lineStyle: { color: 'rgba(255,255,255,0.22)', type: 'dashed', width: 1.5 },
      label: { color: '#8ec8e8', fontSize: 16 },
      data: [
        { xAxis: 60, label: { formatter: '教学 60' } },
        { yAxis: 60, label: { formatter: '科研 60' } },
      ],
    }
    seriesData[0].markArea = {
      silent: true,
      data: [
        [{ xAxis: 0, yAxis: 60, itemStyle: { color: 'rgba(255,213,106,0.04)' } }, { xAxis: 60, yAxis: 100 }],
        [{ xAxis: 60, yAxis: 0, itemStyle: { color: 'rgba(110,255,194,0.04)' } }, { xAxis: 100, yAxis: 60 }],
        [{ xAxis: 60, yAxis: 60, itemStyle: { color: 'rgba(92,236,255,0.04)' } }, { xAxis: 100, yAxis: 100 }],
      ],
    }
  }

  return {
    grid: { left: 70, right: 40, top: 30, bottom: 50 },
    legend: { bottom: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend }, itemWidth: 12, itemHeight: 12 },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 20 },
      formatter: (p: any) => {
        const d = p.data || {}
        return `<b>${d.name || ''}</b><br/>${d.title || ''} · ${d.major || ''}<br/>教学贡献：${d.value?.[0]} 分<br/>科研贡献：${d.value?.[1]} 分<br/>分类：${d.categoryLabel || ''}`
      },
    },
    xAxis: {
      type: 'value', name: '教学贡献',
      min: 25, max: 100,
      nameTextStyle: { color: '#8ec8e8', fontSize: 20 },
      axisLabel: { color: '#c6e6ff', fontSize: 18 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
      axisLine: { lineStyle: { color: 'rgba(57,230,255,0.4)' } },
    },
    yAxis: {
      type: 'value', name: '科研贡献',
      min: 25, max: 100,
      nameTextStyle: { color: '#8ec8e8', fontSize: 20 },
      axisLabel: { color: '#c6e6ff', fontSize: 18 },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
      axisLine: { lineStyle: { color: 'rgba(57,230,255,0.4)' } },
    },
    series: seriesData,
  }
})

const expandedPerfTeacher = ref<Set<string>>(new Set())

function togglePerfTeacher(name: string) {
  if (expandedPerfTeacher.value.has(name)) {
    expandedPerfTeacher.value.delete(name)
  } else {
    expandedPerfTeacher.value.add(name)
  }
  expandedPerfTeacher.value = new Set(expandedPerfTeacher.value)
}

const expandedWarnTeacher = ref<Set<string>>(new Set())

function toggleWarnTeacher(key: string) {
  if (expandedWarnTeacher.value.has(key)) {
    expandedWarnTeacher.value.delete(key)
  } else {
    expandedWarnTeacher.value.add(key)
  }
  expandedWarnTeacher.value = new Set(expandedWarnTeacher.value)
}

const perfTeachers = computed(() => {
  if (!data.value) return []
  return [...data.value.performanceAnalysis.teachers].sort(
    (a, b) => (b.teachingScore + b.researchScore) - (a.teachingScore + a.researchScore)
  )
})

// ============ Part 7 专业支撑 ============

const supportIndexBarOption = computed(() => {
  if (!data.value) return {}
  const items = [...data.value.majorComparison].sort((a, b) => b.supportIndex - a.supportIndex)
  return {
    grid: { left: 8, right: 20, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    xAxis: { type: 'value', min: 0, max: 100, axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: { type: 'category', data: items.map((i) => i.major), axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 20 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      type: 'bar', barWidth: 18,
      data: items.map((i) => ({
        value: i.supportIndex,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i.supportIndex >= 80
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#6effc2' }, { offset: 1, color: '#2ea87a' }] }
            : i.supportIndex >= 60
              ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ffd56a' }, { offset: 1, color: '#d4a017' }] }
              : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ff8a65' }, { offset: 1, color: '#e64a19' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, fontWeight: 'bold', formatter: '{c}分' },
    }],
  }
})

const supportRadarOption = computed(() => {
  if (!data.value) return {}
  const list = data.value.majorComparison
  const maxTalent = Math.max(...list.map((m) => m.highTalentCount)) || 1
  const maxNew = Math.max(...list.map((m) => m.newTeachers5yr)) || 1
  const palette = ['#5cecff', '#ffd56a', '#6effc2', '#ff8a65', '#a78bfa', '#ff6b9d']
  return {
    tooltip: { trigger: 'item' },
    legend: {
      type: 'scroll', top: 0,
      data: list.map((m) => m.major),
      textStyle: { color: '#9fc4e0', fontSize: CHART_FONT.legend },
      itemWidth: 14, itemHeight: 8,
    },
    radar: {
      indicator: [
        { name: '博士占比', max: 100 },
        { name: '高级职称比', max: 100 },
        { name: '核心课程支撑', max: 100 },
        { name: '青年活力', max: 100 },
        { name: '高层次人才', max: 100 },
        { name: '近5年新增', max: 100 },
      ],
      radius: '64%',
      center: ['50%', '58%'],
      axisName: { color: '#cfe6f5', fontSize: 17 },
      splitLine: { lineStyle: { color: 'rgba(120, 200, 255, 0.15)' } },
      splitArea: { areaStyle: { color: ['rgba(0,120,220,0.04)', 'rgba(0,120,220,0.09)'] } },
      axisLine: { lineStyle: { color: 'rgba(120, 200, 255, 0.2)' } },
    },
    series: [{
      type: 'radar',
      data: list.map((m, i) => {
        const c = palette[i % palette.length]
        return {
          name: m.major,
          value: [
            m.phdRatio,
            m.seniorRatio,
            m.coreCourseSupportRate,
            m.youngTeacherRatio,
            Math.round((m.highTalentCount / maxTalent) * 100),
            Math.round((m.newTeachers5yr / maxNew) * 100),
          ],
          symbolSize: 4,
          lineStyle: { color: c, width: 2 },
          itemStyle: { color: c },
          areaStyle: { color: c, opacity: 0.05 },
        }
      }),
    }],
  }
})
</script>

<template>
  <CollegeDetailLayout>
    <template #nav>
      <div ref="tabBarRef" class="tab-bar tab-bar--header">
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'resource-base' }"
          @click="switchTab('resource-base')"
        >
          📋 资源基础
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'structure-analysis' }"
          @click="switchTab('structure-analysis')"
        >
          🔬 结构分析
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'teaching-investment' }"
          @click="switchTab('teaching-investment')"
        >
          📚 教学投入
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'capacity-building' }"
          @click="switchTab('capacity-building')"
        >
          🌱 能力建设
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'performance-analysis' }"
          @click="switchTab('performance-analysis')"
        >
          🎯 绩效分析
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'warning-center' }"
          @click="switchTab('warning-center')"
        >
          🚨 预警中心
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ 'tab-btn--active': currentTab === 'major-support' }"
          @click="switchTab('major-support')"
        >
          🏛️ 专业支撑
        </button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <template v-else-if="data">
      <!-- ===================== Part 1: 资源基础 ===================== -->
      <template v-if="currentTab === 'resource-base'">
        <div class="resource-summary">
          <div class="resource-summary__card" @click="scrollToSection('total-teachers')">
            <span class="resource-summary__icon">👨‍🏫</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">专任教师</span>
              <strong class="resource-summary__value">{{ data.summary.totalTeachers }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('phd-ratio')">
            <span class="resource-summary__icon">🎓</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">博士占比</span>
              <strong class="resource-summary__value">{{ data.summary.phdRatio }}<small>%</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('senior-title')">
            <span class="resource-summary__icon">📊</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">高级职称占比</span>
              <strong class="resource-summary__value">{{ data.summary.seniorTitleRatio }}<small>%</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('high-talent')">
            <span class="resource-summary__icon">🏆</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">高层次人才</span>
              <strong class="resource-summary__value">{{ highTalentCount }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('student-teacher')">
            <span class="resource-summary__icon">📐</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">生师比</span>
              <strong class="resource-summary__value">{{ data.summary.studentTeacherRatio }}</strong>
            </div>
          </div>
        </div>

        <!-- ===== 资源基础总体评价（对照标准） ===== -->
        <section class="resource-eval">
          <h2 class="resource-eval__title"><span class="resource-eval__title-icon">📊</span>资源基础总体评价<span class="resource-eval__badge" :class="disciplineLevel.cls">{{ disciplineLevel.text }}</span></h2>
          <p class="resource-eval__tip">{{ disciplineLevel.tip }}<span class="resource-eval__sep">｜</span>博士点申请：<b :class="phdLevel.cls">{{ phdLevel.text }}</b>（{{ phdLevel.tip }}）</p>
          <div class="resource-eval__cols">
            <div class="resource-eval__col">
              <h3 class="resource-eval__col-title">学科评估申报参考</h3>
              <ul class="eval-list">
                <li v-for="it in disciplineEval" :key="it.key" class="eval-list__item" :class="{ 'is-fail': !it.passed }">
                  <span class="eval-list__name">{{ it.name }}</span>
                  <span class="eval-list__val">{{ it.actual }} <em class="eval-list__req">/ {{ it.requirement }}</em></span>
                  <span class="eval-list__flag">{{ it.passed ? '✓' : '✗' }}</span>
                </li>
              </ul>
            </div>
            <div class="resource-eval__col">
              <h3 class="resource-eval__col-title">一级学科博士点申请</h3>
              <ul class="eval-list">
                <li v-for="it in phdProgramEval" :key="it.key" class="eval-list__item" :class="{ 'is-fail': !it.passed }">
                  <span class="eval-list__name">{{ it.name }}</span>
                  <span class="eval-list__val">{{ it.actual }} <em class="eval-list__req">/ {{ it.requirement }}</em></span>
                  <span class="eval-list__flag">{{ it.passed ? '✓' : '✗' }}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- 专任教师 -->
        <section id="total-teachers" class="resource-section" :class="{ 'resource-section--active': activeSection === 'total-teachers' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">👨‍🏫</span>专任教师<span class="resource-section__badge">总计 {{ data.summary.totalTeachers }} 人</span></h2>
          <p class="resource-section__desc">专任教师是学院教学与科研的核心力量，反映师资队伍的整体规模与结构合理性。合理的教师规模是保障教学质量、推进学科建设的基础条件。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card"><h3>职称结构分布</h3><div class="resource-card__chart resource-card__chart--bar"><ChartContainer :option="titleBarOption" /></div></div>
            <div class="resource-card">
              <h3>年龄结构</h3>
              <ul class="resource-list">
                <li v-for="item in data.structure.age" :key="item.label" class="resource-list__item">
                  <span class="resource-list__label">{{ item.label }}</span>
                  <div class="resource-list__bar-track"><div class="resource-list__bar-fill" :style="{ width: `${item.ratio}%` }" /></div>
                  <strong class="resource-list__value">{{ item.count }}人<small class="resource-list__pct">（{{ item.ratio }}%）</small></strong>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <!-- 博士占比 -->
        <section id="phd-ratio" class="resource-section" :class="{ 'resource-section--active': activeSection === 'phd-ratio' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🎓</span>博士占比<span class="resource-section__badge resource-section__badge--accent">{{ data.summary.phdRatio }}%</span></h2>
          <p class="resource-section__desc">博士学位教师占比是衡量师资队伍学术水平的重要指标，反映学院在高层次人才培养和科研创新方面的基础实力。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card"><h3>学历结构</h3><div class="resource-card__chart"><ChartContainer :option="educationPieOption" /></div></div>
            <div class="resource-card">
              <h3>学缘结构</h3>
              <ul class="resource-list">
                <li v-for="item in data.structure.academicOrigin" :key="item.label" class="resource-list__item">
                  <span class="resource-list__label">{{ item.label }}</span>
                  <div class="resource-list__bar-track"><div class="resource-list__bar-fill resource-list__bar-fill--phd" :style="{ width: `${item.ratio}%` }" /></div>
                  <strong class="resource-list__value">{{ item.count }}人<small class="resource-list__pct">（{{ item.ratio }}%）</small></strong>
                </li>
              </ul>
              <div class="resource-card__note"><p>学缘结构反映师资来源的多样性，"海外博士"与"985/211高校"占比越高，师资学缘质量越好。</p></div>
            </div>
          </div>
          <div class="resource-card resource-card--mt">
            <h3>各专业博士占比对比</h3>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>专业</th><th>博士占比</th><th>优秀教师数</th><th>博士占比水平</th></tr></thead>
                <tbody>
                  <tr v-for="item in data.majorComparison" :key="item.major">
                    <td>{{ item.major }}</td>
                    <td><span class="resource-table__ratio">{{ item.phdRatio }}%</span><div class="resource-table__mini-bar"><div class="resource-table__mini-fill" :style="{ width: `${item.phdRatio}%` }" /></div></td>
                    <td>{{ item.highTalentCount }}人</td>
                    <td><span class="resource-tag" :class="{ 'resource-tag--high': item.phdRatio >= 80, 'resource-tag--mid': item.phdRatio >= 70 && item.phdRatio < 80, 'resource-tag--low': item.phdRatio < 70 }">{{ item.phdRatio >= 80 ? '优秀' : item.phdRatio >= 70 ? '良好' : '待提升' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- 高级职称占比 -->
        <section id="senior-title" class="resource-section" :class="{ 'resource-section--active': activeSection === 'senior-title' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📊</span>高级职称占比<span class="resource-section__badge resource-section__badge--gold">{{ data.summary.seniorTitleRatio }}%</span></h2>
          <p class="resource-section__desc">高级职称（教授、副教授）占比是衡量师资队伍学术层次和教学水平的关键指标，直接影响学科评估和专业建设水平。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card"><h3>职称结构</h3><div class="resource-card__chart"><ChartContainer :option="titlePieOption" /></div></div>
            <div class="resource-card">
              <h3>职称分布明细</h3>
              <ul class="resource-list">
                <li v-for="item in data.structure.title" :key="item.label" class="resource-list__item">
                  <span class="resource-list__label">{{ item.label }}</span>
                  <div class="resource-list__bar-track"><div class="resource-list__bar-fill resource-list__bar-fill--senior" :style="{ width: `${item.ratio}%` }" /></div>
                  <strong class="resource-list__value">{{ item.count }}人<small class="resource-list__pct">（{{ item.ratio }}%）</small></strong>
                </li>
              </ul>
              <div class="resource-card__insight">
                <span class="resource-card__insight-icon">💡</span>
                <p>高级职称（教授+副教授）合计占比 <strong>{{ data.summary.seniorTitleRatio }}%</strong>，其中教授 {{ data.structure.title[0]?.count ?? 0 }} 人，副教授 {{ data.structure.title[1]?.count ?? 0 }} 人。</p>
              </div>
            </div>
          </div>
        </section>

        <!-- 高层次人才 -->
        <section id="high-talent" class="resource-section" :class="{ 'resource-section--active': activeSection === 'high-talent' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🏆</span>高层次人才<span class="resource-section__badge resource-section__badge--gold">{{ highTalentCount }}人</span></h2>
          <p class="resource-section__desc">高层次人才是学院发展的核心驱动力，包括国家级、省部级人才计划入选者，以及在各领域具有突出贡献和影响力的专家学者。</p>
          <div class="resource-section__grid resource-section__grid--3">
            <div class="resource-card resource-card--talent"><div class="resource-card__talent-icon">🏅</div><strong class="resource-card__talent-count">3<small>人</small></strong><span class="resource-card__talent-label">国家级人才</span><p class="resource-card__talent-desc">长江学者、国家杰青、万人计划等</p></div>
            <div class="resource-card resource-card--talent"><div class="resource-card__talent-icon">🎖️</div><strong class="resource-card__talent-count">5<small>人</small></strong><span class="resource-card__talent-label">省级人才</span><p class="resource-card__talent-desc">省级教学名师、省杰青、省特支计划等</p></div>
            <div class="resource-card resource-card--talent"><div class="resource-card__talent-icon">⭐</div><strong class="resource-card__talent-count">4<small>人</small></strong><span class="resource-card__talent-label">市级/校级人才</span><p class="resource-card__talent-desc">市级领军人才、校级拔尖人才等</p></div>
          </div>
          <div class="resource-card resource-card--mt">
            <h3>优秀教师代表</h3>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>姓名</th><th>职称</th><th>专业</th><th>人才层次</th></tr></thead>
                <tbody>
                  <tr v-for="(item, idx) in data.excellentSamples" :key="item.name">
                    <td class="resource-table__name">{{ item.name }}</td><td>{{ item.title }}</td><td>{{ item.major }}</td>
                    <td><span class="resource-tag" :class="{ 'resource-tag--high': idx === 0, 'resource-tag--mid': idx === 1, 'resource-tag--low': idx >= 2 }">{{ idx === 0 ? '国家级' : idx === 1 ? '省级' : '校级' }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div class="resource-card resource-card--mt"><h3>师资荣誉亮点</h3><div class="resource-tags"><span v-for="h in data.highlights" :key="h.label" class="resource-tag resource-tag--highlight">{{ h.label }}：{{ h.value }}</span></div></div>
        </section>

        <!-- 生师比 -->
        <section id="student-teacher" class="resource-section" :class="{ 'resource-section--active': activeSection === 'student-teacher' }">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📐</span>生师比<span class="resource-section__badge">{{ data.summary.studentTeacherRatio }}</span></h2>
          <p class="resource-section__desc">生师比是衡量教育资源配置效率的重要指标，反映每位教师平均承担的学生教学工作量。教育部规定普通高校生师比合格标准为 18:1，低于此值表明师资配置较为充裕。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card"><h3>各专业生师比对比</h3><div style="height:260px;"><ChartContainer :option="stRatioBarOption" /></div></div>
            <div class="resource-card">
              <h3>生师比分析</h3>
              <div class="resource-card__insight resource-card__insight--large">
                <span class="resource-card__insight-icon">📋</span>
                <div>
                  <p><strong>学院整体生师比：{{ data.summary.studentTeacherRatio }}</strong></p>
                  <p>该比值表示每位专任教师平均对应 {{ data.summary.studentTeacherRatio.replace('1:', '') }} 名学生。</p>
                  <p><span v-if="parseFloat(data.summary.studentTeacherRatio.replace('1:', '')) <= 18" class="resource-tag resource-tag--high">✅ 优于国家标准（≤18:1）</span><span v-else class="resource-tag resource-tag--low">⚠️ 高于国家标准（>18:1）</span></p>
                </div>
              </div>
              <ul class="resource-list resource-list--mt">
                <li class="resource-list__item"><span class="resource-list__label">专任教师总数</span><strong class="resource-list__value">{{ data.summary.totalTeachers }}人</strong></li>
                <li class="resource-list__item"><span class="resource-list__label">在校学生总数</span><strong class="resource-list__value">约 {{ Math.round(data.summary.totalTeachers * parseFloat(data.summary.studentTeacherRatio.replace('1:', ''))) }}人</strong></li>
                <li class="resource-list__item"><span class="resource-list__label">国家标准线</span><strong class="resource-list__value">1:18</strong></li>
              </ul>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== Part 2: 结构分析 ===================== -->
      <template v-if="currentTab === 'structure-analysis'">
        <!-- 结构整体评价 -->
        <div class="structure-eval">
          <span class="structure-eval__icon">🧬</span>
          <p class="structure-eval__text">{{ structureEvaluation }}</p>
        </div>

        <!-- 年龄结构 & 学历结构 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom: 20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">👥</span>年龄结构</h2>
            <p class="resource-section__desc">师资队伍年龄分布反映梯队合理性与可持续发展能力。35-45岁中青年教师是主力，55岁以上教师面临退休更替需求。</p>
            <div class="resource-card__chart resource-card__chart--bar" style="height:200px;"><ChartContainer :option="ageBarOption" /></div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🎓</span>学历结构</h2>
            <p class="resource-section__desc">博士学历占比 {{ data.summary.phdRatio }}%，是衡量学术梯队质量的核心指标。</p>
            <div class="resource-card__chart" style="height:240px;"><ChartContainer :option="educationPieOption" /></div>
          </section>
        </div>

        <!-- 职称结构 & 专业方向 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom: 20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📊</span>职称结构</h2>
            <p class="resource-section__desc">高级职称（教授+副教授）占比 {{ data.summary.seniorTitleRatio }}%，教授 {{ data.structure.title[0]?.count ?? 0 }} 人、副教授 {{ data.structure.title[1]?.count ?? 0 }} 人、讲师 {{ data.structure.title[2]?.count ?? 0 }} 人。</p>
            <div class="resource-card__chart" style="height:240px;"><ChartContainer :option="titlePieOption" /></div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🔀</span>专业方向</h2>
            <p class="resource-section__desc">师资在各专业方向的分布反映学科布局的均衡性与重点方向的人才储备。</p>
            <div class="resource-card__chart resource-card__chart--bar" style="height:240px;"><ChartContainer :option="majorDirectionBarOption" /></div>
          </section>
        </div>

        <!-- 梯队结构 -->
        <section class="resource-section" style="margin-bottom: 20px;">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🏗️</span>梯队结构<span class="resource-section__badge">学术带头人 · 骨干 · 青年 · 新进</span></h2>
          <p class="resource-section__desc">师资梯队结构反映学术传承与可持续发展能力。学术带头人引领学科方向，骨干教师支撑核心教学科研，青年教师是未来的中坚力量。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div>
              <div class="resource-section__grid resource-section__grid--2" style="gap:10px;">
                <div v-for="(item, idx) in data.structure.echelon" :key="item.label" class="resource-card resource-card--talent" :style="{ borderColor: ['rgba(255,210,90,0.4)','rgba(0,200,255,0.35)','rgba(46,230,168,0.3)','rgba(167,139,250,0.3)'][idx] }">
                  <div class="resource-card__talent-icon">{{ ['🏅','🎖️','⭐','🌱'][idx] }}</div>
                  <strong class="resource-card__talent-count">{{ item.count }}<small>人</small></strong>
                  <span class="resource-card__talent-label">{{ item.label }}</span>
                  <span class="resource-tag" :class="{ 'resource-tag--high': idx===0, 'resource-tag--mid': idx===1, 'resource-tag--low': idx>=2 }">{{ item.ratio }}%</span>
                  <p class="resource-card__talent-desc">{{ item.description }}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 style="margin:0 0 10px;color:#b8ecff;font-size:22px;">近5年退休人数预测</h3>
              <p style="margin:0 0 12px;color:#9fb6d2;font-size:20px;line-height:1.6;">基于当前55岁以上教师（{{ data.structure.age[3]?.count ?? 0 }}人）年龄分布测算，未来5年逐年退休人数如下。累计退休 {{ data.structure.retirementForecast.reduce((s, i) => s + i.count, 0) }} 人，需提前规划人才引进与补充。</p>
              <div style="height:240px;"><ChartContainer :option="retirementLineOption" /></div>
              <!-- 临近退休·人员与课程接续 -->
              <div class="retire-list">
                <h3 class="retire-list__title">临近退休·人员与课程接续</h3>
                <p class="retire-list__desc">下列教师临近退休，其承担的核心课程需提前安排接续人选；标 <b class="retire-list__crit">★</b> 者为关键课程 / 高负荷，须重点保障。</p>
                <ul class="retire-list__ul">
                  <li v-for="t in data.structure.retiringTeachers" :key="t.name" class="retire-list__item" :class="{ 'is-critical': t.critical }">
                    <div class="retire-list__head">
                      <span class="retire-list__name">{{ t.name }}</span>
                      <span class="retire-list__meta">{{ t.title }} · {{ t.major }}</span>
                      <span class="retire-list__year">{{ t.retireYear }}年退休</span>
                      <span v-if="t.critical" class="retire-list__flag">★ 关键课程</span>
                    </div>
                    <div class="retire-list__courses">
                      <span v-for="(c, ci) in t.courses" :key="ci" class="retire-list__course">
                        {{ c.name }}（{{ c.semester }} · {{ c.studentCount }}人）
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- 学缘结构 -->
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🌐</span>学缘结构</h2>
          <p class="resource-section__desc">学缘结构反映教师最高学历（博士）毕业院校的分布情况，多样性学缘有利于学术交叉融合与创新。"海外博士"占比是国际化水平的重要指标。</p>
          <div class="academic-origin-layout">
            <div class="resource-card">
              <h3>学缘分布</h3>
              <ul class="resource-list">
                <li v-for="item in data.structure.academicOrigin" :key="item.label" class="resource-list__item">
                  <span class="resource-list__label">{{ item.label }}</span>
                  <div class="resource-list__bar-track"><div class="resource-list__bar-fill resource-list__bar-fill--senior" :style="{ width: `${item.ratio}%` }" /></div>
                  <strong class="resource-list__value">{{ item.count }}人 · {{ item.ratio }}%</strong>
                </li>
              </ul>
            </div>
            <div class="resource-card">
              <h3>学缘结构评估</h3>
              <div class="resource-card__insight resource-card__insight--large" style="margin-top:0;">
                <span class="resource-card__insight-icon">💡</span>
                <div>
                  <p>海外博士 + 985/211 占比：<strong>{{ (data.structure.academicOrigin.slice(0, 3).reduce((s, i) => s + i.ratio, 0)).toFixed(1) }}%</strong></p>
                  <p>本校博士占比：<strong>{{ data.structure.academicOrigin[4]?.ratio ?? 0 }}%</strong></p>
                  <p style="color:#8eaec8;font-size:20px;">控制本校比例有利于避免"近亲繁殖"，促进学术交叉融合。</p>
                  <p style="margin-top:8px;">
                    <span v-if="data.structure.academicOrigin[4] && data.structure.academicOrigin[4].ratio <= 20" class="resource-tag resource-tag--high">✅ 本校比例合理</span>
                    <span v-else class="resource-tag resource-tag--mid">⚠️ 本校比例偏高，建议加大外校引才</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== Part 3: 教学投入 ===================== -->
      <template v-if="currentTab === 'teaching-investment'">
        <!-- 课时分布 & 超负荷概览 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom:20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📈</span>课时分布</h2>
            <p class="resource-section__desc">教师学年课时分布情况，标准课时为240学时/年。红色区域为超负荷区间（>300学时），需重点关注。</p>
            <div class="ti-metrics">
              <div class="ti-metric">
                <span class="ti-metric__label">平均学年课时</span>
                <strong class="ti-metric__value">{{ data.teachingInvestment.avgHours }}<small>学时</small></strong>
                <span class="ti-metric__sub">标准差 ±{{ hoursStdDev }} ｜ 均衡度(基尼) {{ hoursGini }}</span>
              </div>
              <div class="ti-metric">
                <span class="ti-metric__label">最高课时</span>
                <strong class="ti-metric__value" style="color:#ff8a65;">{{ data.teachingInvestment.maxTeacher.hours }}<small>学时</small></strong>
                <span class="ti-metric__sub">{{ data.teachingInvestment.maxTeacher.name }} · {{ data.teachingInvestment.maxTeacher.title }}</span>
              </div>
              <div class="ti-metric">
                <span class="ti-metric__label">最低课时</span>
                <strong class="ti-metric__value" style="color:#6effc2;">{{ data.teachingInvestment.minTeacher.hours }}<small>学时</small></strong>
                <span class="ti-metric__sub">{{ data.teachingInvestment.minTeacher.name }} · {{ data.teachingInvestment.minTeacher.title }}</span>
              </div>
            </div>
            <div style="height:240px;"><ChartContainer :option="hourDistBarOption" /></div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🚨</span>超课时教师名单</h2>
            <p class="resource-section__desc">超过标准课时（240学时）的教师，点击可展开查看课程详情。共计 {{ data.teachingInvestment.overloadedTeachers.length }} 人超负荷。</p>
            <div class="ti-metrics">
              <div class="ti-metric">
                <span class="ti-metric__label">超负荷教师</span>
                <strong class="ti-metric__value" style="color:#ff9b6a;">{{ data.teachingInvestment.overloadedTeachers.length }}<small>人</small></strong>
                <span class="ti-metric__sub">标准课时240学时</span>
              </div>
              <div class="ti-metric">
                <span class="ti-metric__label">教师总人数</span>
                <strong class="ti-metric__value">{{ data.teachingInvestment.teacherCourses.length }}<small>人</small></strong>
              </div>
            </div>
            <div class="overload-list">
              <div
                v-for="(item, idx) in data.teachingInvestment.overloadedTeachers"
                :key="item.name"
                class="overload-card"
                :class="{ 'overload-card--expanded': expandedOverload.has(idx) }"
              >
                <button type="button" class="overload-card__header" @click="toggleOverload(idx)">
                  <div class="overload-card__info">
                    <strong>{{ item.name }}</strong>
                    <span>{{ item.title }} · {{ item.major }}</span>
                  </div>
                  <div class="overload-card__metrics">
                    <em class="overload-card__hours">{{ item.totalHours }}<small>学时</small></em>
                    <span class="overload-card__over">超标 +{{ item.overloadAmount }}</span>
                  </div>
                  <span class="overload-card__arrow">{{ expandedOverload.has(idx) ? '▾' : '▸' }}</span>
                </button>
                <div v-if="expandedOverload.has(idx)" class="overload-card__body">
                  <p class="overload-card__reason">📌 {{ item.reason }}</p>
                  <table class="resource-table">
                    <thead><tr><th>课程名称</th><th>学时</th></tr></thead>
                    <tbody>
                      <tr v-for="c in item.courses" :key="c.name">
                        <td>{{ c.name }}</td>
                        <td>{{ c.hours }}学时</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 每位教师课程明细 -->
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📖</span>教师课程明细</h2>
          <p class="resource-section__desc">全部专任教师的学年授课安排及课时统计，按总课时从高到低排列。</p>
          <div class="resource-table-wrap">
            <table class="resource-table">
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>职称</th>
                  <th>专业</th>
                  <th>总课时</th>
                  <th>课程列表</th>
                  <th>课时状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in [...data.teachingInvestment.teacherCourses].sort((a, b) => b.totalHours - a.totalHours)"
                  :key="row.name"
                  :class="{ 'row--overload': row.totalHours > 300, 'row--warn': row.totalHours > 240 && row.totalHours <= 300 }"
                >
                  <td class="resource-table__name">{{ row.name }}</td>
                  <td>{{ row.title }}</td>
                  <td>{{ row.major }}</td>
                  <td>
                    <strong :style="{ color: row.totalHours > 300 ? '#ff8a65' : row.totalHours > 240 ? '#ffd56a' : '#6effc2' }">
                      {{ row.totalHours }}<small>学时</small>
                    </strong>
                  </td>
                  <td class="course-cell">
                    <span v-for="c in row.courses" :key="c.name" class="course-tag">
                      {{ c.name }}<em>{{ c.hours }}h</em>
                    </span>
                  </td>
                  <td>
                    <span v-if="row.totalHours > 300" class="resource-tag resource-tag--low">⚠ 严重超负荷</span>
                    <span v-else-if="row.totalHours > 240" class="resource-tag resource-tag--mid">⚡ 超课时</span>
                    <span v-else class="resource-tag resource-tag--high">✓ 正常</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <!-- ===================== Part 4: 能力建设 ===================== -->
      <template v-if="currentTab === 'capacity-building'">
        <!-- 核心指标 -->
        <div class="resource-summary">
          <div class="resource-summary__card">
            <span class="resource-summary__icon">🎓</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">近5年新增博士</span>
              <strong class="resource-summary__value">{{ data.capacityBuilding.newPhdTotal }}<small>人</small></strong>
              <span class="resource-summary__plan">规划 {{ data.capacityBuilding.plans.newPhd }}<small>人</small></span>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">📊</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">近5年新增教授</span>
              <strong class="resource-summary__value">{{ data.capacityBuilding.newProfessorTotal }}<small>人</small></strong>
              <span class="resource-summary__plan">规划 {{ data.capacityBuilding.plans.newProfessor }}<small>人</small></span>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">🏆</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">近年新增人才</span>
              <strong class="resource-summary__value" style="color:#ffd56a;">{{ data.capacityBuilding.newTalentTotal }}<small>人</small></strong>
              <span class="resource-summary__plan">规划 {{ data.capacityBuilding.plans.newTalent }}<small>人</small></span>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">📋</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">年度培训</span>
              <strong class="resource-summary__value">{{ data.capacityBuilding.trainingCount }}<small>次</small></strong>
              <span class="resource-summary__plan">规划 {{ data.capacityBuilding.plans.training }}<small>次</small></span>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">🌍</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">访学人数</span>
              <strong class="resource-summary__value">{{ data.capacityBuilding.visitingTotal }}<small>人</small></strong>
              <span class="resource-summary__plan">规划 {{ data.capacityBuilding.plans.visiting }}<small>人</small></span>
            </div>
          </div>
        </div>

        <!-- 能力建设趋势 -->
        <section class="resource-section" style="margin-bottom:20px;">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📈</span>能力建设趋势（近5年）</h2>
          <p class="resource-section__desc">折线为新增博士/教授/人才数量趋势，柱状为年度培训次数与访学人数。整体呈现稳步增长态势，2025年各项指标达到峰值。</p>
          <div style="height:280px;"><ChartContainer :option="yearlyTrendOption" /></div>
        </section>

        <!-- 青年教师导师制 & 培训统计 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom:20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🤝</span>青年教师导师制</h2>
            <p class="resource-section__desc">为青年教师（35岁以下或入职不满3年）配备资深导师，实行"一对一"培养指导。当前覆盖率 <strong style="color:#6effc2;">{{ data.capacityBuilding.mentorshipCoverage }}%</strong>。</p>
            <div style="margin-bottom:14px;">
              <div v-for="item in data.capacityBuilding.mentorshipDetail" :key="item.label" class="resource-list__item" style="margin-bottom:8px;">
                <span class="resource-list__label">{{ item.label }}</span>
                <div class="resource-list__bar-track"><div class="resource-list__bar-fill resource-list__bar-fill--phd" :style="{ width: `${item.ratio}%` }" /></div>
                <strong class="resource-list__value">{{ item.count }}人 · {{ item.ratio }}%</strong>
              </div>
            </div>
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">💡</span>
              <div>
                <p>青年教师总数 {{ data.structure.age[0]?.count ?? 0 }} 人（35岁以下）</p>
                <p>已配备导师 {{ data.capacityBuilding.mentorshipDetail[0]?.count ?? 0 }} 人</p>
                <p>待配备 {{ data.capacityBuilding.mentorshipDetail[3]?.count ?? 0 }} 人，建议本学年内完成匹配</p>
              </div>
            </div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📋</span>培训统计</h2>
            <p class="resource-section__desc">年度共组织各类培训 <strong style="color:#a78bfa;">{{ data.capacityBuilding.trainingCount }} 次</strong>，覆盖教师 {{ data.capacityBuilding.trainingByType.reduce((s, i) => s + i.participants, 0) }} 人次。</p>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>培训类型</th><th>次数</th><th>参与人次</th></tr></thead>
                <tbody>
                  <tr v-for="item in data.capacityBuilding.trainingByType" :key="item.type">
                    <td>{{ item.type }}</td>
                    <td><strong style="color:#a78bfa;">{{ item.count }}次</strong></td>
                    <td>{{ item.participants }}人次</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- 访学进修 & 新增教授/副教授 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom:20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🌍</span>访学进修</h2>
            <p class="resource-section__desc">近年共选派 <strong style="color:#ffa94d;">{{ data.capacityBuilding.visitingTotal }} 人</strong>赴国内外知名高校访学进修，其中国外访学 {{ data.capacityBuilding.visitingScholars.filter((v) => !v.destination.includes('清华') && !v.destination.includes('香港')).length }} 人、国内访学 {{ data.capacityBuilding.visitingScholars.filter((v) => v.destination.includes('清华') || v.destination.includes('香港')).length }} 人。</p>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>姓名</th><th>职称</th><th>访学单位</th><th>时长</th><th>年份</th></tr></thead>
                <tbody>
                  <tr v-for="item in data.capacityBuilding.visitingScholars" :key="item.name">
                    <td class="resource-table__name">{{ item.name }}</td>
                    <td>{{ item.title }}</td>
                    <td>{{ item.destination }}</td>
                    <td>{{ item.duration }}</td>
                    <td>{{ item.year }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📊</span>新增教授/副教授</h2>
            <p class="resource-section__desc">近5年共晋升或引进高级职称 <strong style="color:#ffd56a;">{{ data.capacityBuilding.newProfessorTotal }} 人</strong>（教授 {{ Math.round(data.capacityBuilding.newProfessorTotal * 0.45) }} 人、副教授 {{ Math.round(data.capacityBuilding.newProfessorTotal * 0.55) }} 人），高级职称教师持续充实。</p>
            <div class="filter-bar">
              <button type="button" :class="['filter-btn', { 'is-active': professorFilter === 'all' }]" @click="professorFilter = 'all'">全部 {{ data.capacityBuilding.newProfessorTotal }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': professorFilter === 'introduced' }]" @click="professorFilter = 'introduced'">引进 {{ data.capacityBuilding.newProfessorIntroduced }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': professorFilter === 'developed' }]" @click="professorFilter = 'developed'">发展 {{ data.capacityBuilding.newProfessorDeveloped }} 人</button>
            </div>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>年度</th><th>新增高级职称</th><th>累计</th><th>增幅</th></tr></thead>
                <tbody>
                  <template v-for="(item, idx) in professorYearRows" :key="item.year">
                    <tr :class="{ 'is-clickable': professorFilter !== 'all', 'is-expanded': professorExpandedYear === item.year }" @click="professorFilter !== 'all' && (professorExpandedYear = professorExpandedYear === item.year ? null : item.year)">
                      <td>{{ item.year }}</td>
                      <td><strong style="color:#ffd56a;">{{ item.count }}人</strong></td>
                      <td>{{ professorYearRows.slice(0, idx + 1).reduce((s, i) => s + i.count, 0) }}人</td>
                      <td>
                        <span v-if="idx === 0">—</span>
                        <span v-else :class="item.count >= professorYearRows[idx-1].count ? 'resource-tag resource-tag--high' : 'resource-tag resource-tag--low'">
                          {{ item.count >= professorYearRows[idx-1].count ? '↑' : '↓' }} {{ item.count - professorYearRows[idx-1].count }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="professorExpandedYear === item.year" class="row-detail">
                      <td :colspan="4">
                        <div class="row-detail__inner">
                          <table class="resource-table resource-table--sub">
                            <thead><tr><th>姓名</th><th>职称</th></tr></thead>
                            <tbody>
                              <tr v-for="p in data.capacityBuilding.newProfessorPeople.filter(p => p.year === item.year && p.source === professorFilter)" :key="p.name">
                                <td class="resource-table__name">{{ p.name }}</td>
                                <td>{{ p.title }}</td>
                              </tr>
                              <tr v-if="data.capacityBuilding.newProfessorPeople.filter(p => p.year === item.year && p.source === professorFilter).length === 0">
                                <td colspan="2" class="row-detail__empty">暂无人员数据</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <!-- 近年新增高层次人才 & 新增博士 -->
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom:20px;">
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🏆</span>近年新增高层次人才</h2>
            <p class="resource-section__desc">近年新增各级各类人才 {{ data.capacityBuilding.newTalentTotal }} 人，涵盖国家级、省级、市级及校级层次。</p>
            <div class="filter-bar">
              <button type="button" :class="['filter-btn', { 'is-active': talentFilter === 'all' }]" @click="talentFilter = 'all'">全部 {{ data.capacityBuilding.newTalentTotal }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': talentFilter === 'introduced' }]" @click="talentFilter = 'introduced'">引进 {{ data.capacityBuilding.newTalentIntroduced }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': talentFilter === 'developed' }]" @click="talentFilter = 'developed'">发展 {{ data.capacityBuilding.newTalentDeveloped }} 人</button>
            </div>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>年度</th><th>新增人才</th><th>累计</th><th>增幅</th></tr></thead>
                <tbody>
                  <template v-for="(item, idx) in talentYearRows" :key="item.year">
                    <tr :class="{ 'is-clickable': talentFilter !== 'all', 'is-expanded': talentExpandedYear === item.year }" @click="talentFilter !== 'all' && (talentExpandedYear = talentExpandedYear === item.year ? null : item.year)">
                      <td>{{ item.year }}</td>
                      <td><strong style="color:#ffd56a;">{{ item.count }}人</strong></td>
                      <td>{{ talentYearRows.slice(0, idx + 1).reduce((s, i) => s + i.count, 0) }}人</td>
                      <td>
                        <span v-if="idx === 0">—</span>
                        <span v-else :class="item.count >= talentYearRows[idx-1].count ? 'resource-tag resource-tag--high' : 'resource-tag resource-tag--low'">
                          {{ item.count >= talentYearRows[idx-1].count ? '↑' : '↓' }} {{ item.count - talentYearRows[idx-1].count }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="talentExpandedYear === item.year" class="row-detail">
                      <td :colspan="4">
                        <div class="row-detail__inner">
                          <table class="resource-table resource-table--sub">
                            <thead><tr><th>姓名</th><th>职称</th><th>人才类型</th></tr></thead>
                            <tbody>
                              <tr v-for="p in data.capacityBuilding.newTalents.filter(p => p.year === item.year && p.source === talentFilter)" :key="p.name">
                                <td class="resource-table__name">{{ p.name }}</td>
                                <td>{{ p.title }}</td>
                                <td><span class="resource-tag" :class="{ 'resource-tag--high': p.talentType.includes('国家级'), 'resource-tag--mid': p.talentType.includes('省级'), 'resource-tag--low': p.talentType.includes('市级') || p.talentType.includes('校级') }">{{ p.talentType }}</span></td>
                              </tr>
                              <tr v-if="data.capacityBuilding.newTalents.filter(p => p.year === item.year && p.source === talentFilter).length === 0">
                                <td colspan="3" class="row-detail__empty">暂无人员数据</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </section>
          <section class="resource-section" style="margin-bottom:0;">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🎓</span>新增博士</h2>
            <p class="resource-section__desc">近5年共引进或培养博士 <strong style="color:#5cecff;">{{ data.capacityBuilding.newPhdTotal }} 人</strong>，博士学位教师从2022年的 {{ data.structure.education[0]?.count ? data.structure.education[0].count - data.capacityBuilding.newPhdTotal + data.capacityBuilding.newPhds[0].count : 0 }} 人增至目前的 {{ data.structure.education[0]?.count ?? 0 }} 人，博士占比达 {{ data.summary.phdRatio }}%。</p>
            <div class="filter-bar">
              <button type="button" :class="['filter-btn', { 'is-active': phdFilter === 'all' }]" @click="phdFilter = 'all'">全部 {{ data.capacityBuilding.newPhdTotal }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': phdFilter === 'introduced' }]" @click="phdFilter = 'introduced'">引进 {{ data.capacityBuilding.newPhdIntroduced }} 人</button>
              <button type="button" :class="['filter-btn', { 'is-active': phdFilter === 'developed' }]" @click="phdFilter = 'developed'">发展 {{ data.capacityBuilding.newPhdDeveloped }} 人</button>
            </div>
            <div class="resource-table-wrap">
              <table class="resource-table">
                <thead><tr><th>年度</th><th>新增博士</th><th>累计</th><th>增幅</th></tr></thead>
                <tbody>
                  <template v-for="(item, idx) in phdYearRows" :key="item.year">
                    <tr :class="{ 'is-clickable': phdFilter !== 'all', 'is-expanded': phdExpandedYear === item.year }" @click="phdFilter !== 'all' && (phdExpandedYear = phdExpandedYear === item.year ? null : item.year)">
                      <td>{{ item.year }}</td>
                      <td><strong style="color:#5cecff;">{{ item.count }}人</strong></td>
                      <td>{{ phdYearRows.slice(0, idx + 1).reduce((s, i) => s + i.count, 0) }}人</td>
                      <td>
                        <span v-if="idx === 0">—</span>
                        <span v-else :class="item.count >= phdYearRows[idx-1].count ? 'resource-tag resource-tag--high' : 'resource-tag resource-tag--low'">
                          {{ item.count >= phdYearRows[idx-1].count ? '↑' : '↓' }} {{ item.count - phdYearRows[idx-1].count }}
                        </span>
                      </td>
                    </tr>
                    <tr v-if="phdExpandedYear === item.year" class="row-detail">
                      <td :colspan="4">
                        <div class="row-detail__inner">
                          <table class="resource-table resource-table--sub">
                            <thead><tr><th>姓名</th><th>职称</th></tr></thead>
                            <tbody>
                              <tr v-for="p in data.capacityBuilding.newPhdPeople.filter(p => p.year === item.year && p.source === phdFilter)" :key="p.name">
                                <td class="resource-table__name">{{ p.name }}</td>
                                <td>{{ p.title }}</td>
                              </tr>
                              <tr v-if="data.capacityBuilding.newPhdPeople.filter(p => p.year === item.year && p.source === phdFilter).length === 0">
                                <td colspan="2" class="row-detail__empty">暂无人员数据</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </template>

      <!-- ===================== Part 5: 绩效分析 ===================== -->
      <template v-if="currentTab === 'performance-analysis'">
        <!-- 四象限概览 -->
        <div class="resource-summary">
          <div class="resource-summary__card">
            <span class="resource-summary__icon">⭐</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">双优</span>
              <strong class="resource-summary__value" style="color:#ffd56a;">{{ data.performanceAnalysis.summary.dualExcellent }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">🔬</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">科研突出</span>
              <strong class="resource-summary__value" style="color:#5cecff;">{{ data.performanceAnalysis.summary.researchOutstanding }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">📖</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">教学突出</span>
              <strong class="resource-summary__value" style="color:#6effc2;">{{ data.performanceAnalysis.summary.teachingOutstanding }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">⚠️</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">待提升</span>
              <strong class="resource-summary__value" style="color:#ff8a65;">{{ data.performanceAnalysis.summary.needsImprovement }}<small>人</small></strong>
            </div>
          </div>
          <div class="resource-summary__card">
            <span class="resource-summary__icon">📊</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">均分（教学/科研）</span>
              <strong class="resource-summary__value">{{ data.performanceAnalysis.summary.avgTeaching }}<small>/{{ data.performanceAnalysis.summary.avgResearch }}</small></strong>
            </div>
          </div>
        </div>

        <!-- 散点图 -->
        <section class="resource-section" style="margin-bottom:20px;">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🎯</span>教学-科研贡献二维分布</h2>
          <p class="resource-section__desc">
            横轴为教学贡献评分（课时量×评教分数），纵轴为科研贡献评分（论文×项目×经费）。虚线（60分）为分界线。
            <strong style="color:#ffd56a;">右上：双优</strong> ·
            <strong style="color:#6effc2;">右下：教学突出</strong> ·
            <strong style="color:#5cecff;">左上：科研突出</strong> ·
            <strong style="color:#ff8a65;">左下：待提升</strong>
          </p>
          <div style="height:420px;"><ChartContainer :option="scatterOption" /></div>
        </section>

        <!-- 教师绩效卡片列表 -->
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">👥</span>教师绩效详情</h2>
          <p class="resource-section__desc">按综合评分排序，点击可展开查看教学与科研明细。共 {{ perfTeachers.length }} 名教师。</p>
          <div class="resource-card__note" style="margin-bottom:14px;">
            <p><strong>评分计算方法：</strong>教学贡献 = 学年课时（标准化）× 0.6 + 学生评教分数 × 0.2 + 教学获奖加分；科研贡献 = 论文数 × 0.35 + 在研项目 × 0.3 + 科研经费（标准化）× 0.25 + 科研获奖加分。满分均为 100 分，60 分以上为合格线。</p>
          </div>
          <div class="perf-cards">
            <div
              v-for="t in perfTeachers"
              :key="t.name"
              class="perf-card"
              :class="{
                'perf-card--dual': t.category === 'dual-excellent',
                'perf-card--research': t.category === 'research-outstanding',
                'perf-card--teaching': t.category === 'teaching-outstanding',
                'perf-card--improve': t.category === 'needs-improvement',
                'perf-card--expanded': expandedPerfTeacher.has(t.name),
              }"
            >
              <button type="button" class="perf-card__header" @click="togglePerfTeacher(t.name)">
                <div class="perf-card__rank">
                  <span class="perf-card__cat-dot" :style="{
                    background: t.category === 'dual-excellent' ? '#ffd56a' : t.category === 'research-outstanding' ? '#5cecff' : t.category === 'teaching-outstanding' ? '#6effc2' : '#ff8a65',
                  }" />
                  {{ t.category === 'dual-excellent' ? '双优' : t.category === 'research-outstanding' ? '科研突出' : t.category === 'teaching-outstanding' ? '教学突出' : '待提升' }}
                </div>
                <div class="perf-card__info">
                  <strong>{{ t.name }}</strong>
                  <span>{{ t.title }} · {{ t.major }}</span>
                </div>
                <div class="perf-card__scores">
                  <div class="perf-card__score">
                    <span class="perf-card__score-label">教学</span>
                    <em class="perf-card__score-val" style="color:#6effc2;">{{ t.teachingScore }}</em>
                  </div>
                  <div class="perf-card__score">
                    <span class="perf-card__score-label">科研</span>
                    <em class="perf-card__score-val" style="color:#5cecff;">{{ t.researchScore }}</em>
                  </div>
                  <div class="perf-card__score">
                    <span class="perf-card__score-label">综合</span>
                    <em class="perf-card__score-val" style="color:#ffd56a;">{{ Math.round((t.teachingScore + t.researchScore) / 2) }}</em>
                  </div>
                </div>
                <span class="perf-card__arrow">{{ expandedPerfTeacher.has(t.name) ? '▾' : '▸' }}</span>
              </button>
              <div v-if="expandedPerfTeacher.has(t.name)" class="perf-card__body">
                <div class="perf-card__detail-grid">
                  <div class="perf-card__detail">
                    <h4>📖 教学详情</h4>
                    <ul>
                      <li><span>学年课时</span><strong>{{ t.teachingDetail.avgHours }} 学时</strong></li>
                      <li><span>授课门数</span><strong>{{ t.teachingDetail.courseCount }} 门</strong></li>
                      <li><span>学生评教</span><strong :style="{ color: t.teachingDetail.studentEvalScore >= 90 ? '#6effc2' : t.teachingDetail.studentEvalScore >= 80 ? '#ffd56a' : '#ff8a65' }">{{ t.teachingDetail.studentEvalScore }} 分</strong></li>
                      <li v-if="t.teachingDetail.teachingAwards.length"><span>教学获奖</span><strong>{{ t.teachingDetail.teachingAwards.join('、') }}</strong></li>
                    </ul>
                  </div>
                  <div class="perf-card__detail">
                    <h4>🔬 科研详情</h4>
                    <ul>
                      <li><span>论文数</span><strong>{{ t.researchDetail.papers }} 篇</strong></li>
                      <li><span>在研项目</span><strong>{{ t.researchDetail.projects }} 项</strong></li>
                      <li><span>科研经费</span><strong>{{ t.researchDetail.funding }} 万元</strong></li>
                      <li v-if="t.researchDetail.researchAwards.length"><span>科研获奖</span><strong>{{ t.researchDetail.researchAwards.join('、') }}</strong></li>
                    </ul>
                  </div>
                </div>
                <div v-if="t.category === 'needs-improvement'" class="perf-card__suggestion">
                  <span class="resource-card__insight-icon">💡</span>
                  <div>
                    <p><strong>提升建议</strong></p>
                    <p v-if="t.teachingScore < 50">教学方面：建议减少授课门数（当前 {{ t.teachingDetail.courseCount }} 门），聚焦核心课程，参加教学能力提升培训。</p>
                    <p v-if="t.researchScore < 50">科研方面：建议加入现有科研团队，申请校级/省级青年基金项目，明确研究方向。</p>
                    <p v-if="t.teachingScore < 50 && t.researchScore < 50">综合建议：优先聚焦一个方向突破，建议与资深教师结对指导，制定个人发展计划。</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== Part 6: 预警中心 ===================== -->
      <template v-if="currentTab === 'warning-center'">
        <!-- 预警概览 -->
        <div class="resource-summary">
          <div class="resource-summary__card" style="border-color:rgba(255,80,80,0.35);">
            <span class="resource-summary__icon">🚨</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">预警总数</span>
              <strong class="resource-summary__value" style="color:#ff8a65;">{{ data.warningCenter.summary.totalWarnings }}<small>条</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" style="border-color:rgba(255,80,80,0.35);">
            <span class="resource-summary__icon">🔴</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">红色预警</span>
              <strong class="resource-summary__value" style="color:#ff6b6b;">{{ data.warningCenter.summary.redCount }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" style="border-color:rgba(255,200,60,0.3);">
            <span class="resource-summary__icon">🟡</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">黄色预警</span>
              <strong class="resource-summary__value" style="color:#ffd56a;">{{ data.warningCenter.summary.yellowCount }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" style="border-color:rgba(0,200,255,0.3);">
            <span class="resource-summary__icon">🔵</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">蓝色提示</span>
              <strong class="resource-summary__value" style="color:#5cecff;">{{ data.warningCenter.summary.blueCount }}<small>项</small></strong>
            </div>
          </div>
        </div>

        <!-- 预警分类卡片 -->
        <div class="warn-grid">
          <section
            v-for="cat in data.warningCenter.categories"
            :key="cat.id"
            class="warn-category"
            :class="{
              'warn-category--red': cat.level === 'red',
              'warn-category--yellow': cat.level === 'yellow',
              'warn-category--blue': cat.level === 'blue',
            }"
          >
            <div class="warn-category__head">
              <div class="warn-category__title">
                <span class="warn-category__dot" :class="'warn-category__dot--' + cat.level" />
                <h2>{{ cat.label }}</h2>
                <span class="warn-category__badge" :class="'warn-category__badge--' + cat.level">
                  {{ cat.count }}人
                </span>
              </div>
              <p class="warn-category__desc">{{ cat.description }}</p>
            </div>
            <div class="warn-category__list">
              <div
                v-for="t in cat.teachers"
                :key="t.name"
                class="warn-item"
                :class="{ 'is-expanded': expandedWarnTeacher.has(cat.id + '-' + t.name) }"
                @click="toggleWarnTeacher(cat.id + '-' + t.name)"
              >
                <div class="warn-item__head">
                  <div class="warn-item__info">
                    <strong>{{ t.name }}</strong>
                    <span>{{ t.title }} · {{ t.major }}</span>
                  </div>
                  <div class="warn-item__meta">
                    <span class="warn-item__index" :class="'warn-item__index--' + t.riskLevel">
                      风险指数 {{ t.riskIndex }}（{{ t.riskLevel === 'red' ? '红' : t.riskLevel === 'yellow' ? '黄' : '蓝' }}）
                    </span>
                    <span class="warn-item__status" :class="{
                      'warn-item__status--new': t.status === '新发现',
                      'warn-item__status--tracking': t.status === '跟踪中',
                      'warn-item__status--done': t.status === '已约谈',
                    }">{{ t.status }}</span>
                    <span class="warn-item__toggle">{{ expandedWarnTeacher.has(cat.id + '-' + t.name) ? '▾' : '▸' }}</span>
                  </div>
                </div>

                <template v-if="expandedWarnTeacher.has(cat.id + '-' + t.name)">
                  <p class="warn-item__detail">{{ t.detail }}</p>

                  <div class="warn-item__block">
                    <span class="warn-item__block-label">⚠ 为什么预警（风险原因）</span>
                    <ul class="warn-item__reasons">
                      <li v-for="(r, i) in t.reasons" :key="i">{{ r }}</li>
                    </ul>
                  </div>

                  <div class="warn-item__block">
                    <span class="warn-item__block-label">✓ 建议措施（怎么解决）</span>
                    <ul class="warn-item__suggestions">
                      <li v-for="(s, i) in t.suggestions" :key="i">{{ s }}</li>
                    </ul>
                  </div>

                  <div class="warn-item__loop">
                    <span class="warn-item__block-label">🔄 闭环管理</span>
                    <div class="warn-item__loop-row">
                      <span class="warn-item__loop-tag">整改期 {{ t.closedLoop.rectifyMonths }} 个月</span>
                      <span class="warn-item__loop-outcome" :class="'warn-item__loop-outcome--' + (
                        t.closedLoop.outcome === '风险加重' ? 'up' :
                        t.closedLoop.outcome === '减轻' ? 'down' :
                        t.closedLoop.outcome === '解除' ? 'clear' : 'same'
                      )">当前：{{ t.closedLoop.outcome }}</span>
                      <span class="warn-item__loop-next">下次评价：{{ t.closedLoop.nextEvaluation }}</span>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </section>
        </div>
      </template>

      <!-- ===================== Part 7: 专业支撑 ===================== -->
      <template v-if="currentTab === 'major-support'">
        <div class="resource-section__grid resource-section__grid--2" style="margin-bottom:20px;">
          <!-- 支撑指数排行 -->
          <section class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">📊</span>专业支撑综合指数</h2>
            <p class="resource-section__desc">
              综合考量师资规模、博士占比、高级职称、核心课程支撑率、青年教师比例、高层次人才覆盖、近五年新增教师等维度。
              <strong style="color:#6effc2;">≥80 良好</strong> ·
              <strong style="color:#ffd56a;">60-79 一般</strong> ·
              <strong style="color:#ff8a65;">< 60 薄弱</strong>
            </p>
            <div style="height:380px;"><ChartContainer :option="supportIndexBarOption" /></div>
          </section>

          <!-- 多维支撑能力雷达对比 -->
          <section class="resource-section">
            <h2 class="resource-section__title"><span class="resource-section__title-icon">🕸️</span>多维支撑能力对比</h2>
            <p class="resource-section__desc">
              从 <strong style="color:#5cecff;">博士占比</strong>、<strong style="color:#ffd56a;">高级职称</strong>、<strong style="color:#6effc2;">核心课程支撑</strong>、<strong style="color:#ff8a65;">青年活力</strong>、<strong style="color:#a78bfa;">高层次人才</strong>、<strong style="color:#ff6b9d;">近五年新增</strong> 六个维度对比各专业师资支撑能力（高层次人才、近五年新增按最大值归一化至 0-100）。
            </p>
            <div style="height:380px;"><ChartContainer :option="supportRadarOption" /></div>
          </section>
        </div>

        <!-- 分专业详情卡片 -->
        <div class="major-cards">
          <section
            v-for="m in [...data.majorComparison].sort((a, b) => b.supportIndex - a.supportIndex)"
            :key="m.major"
            class="major-card"
            :class="{
              'major-card--good': m.supportIndex >= 80,
              'major-card--mid': m.supportIndex >= 60 && m.supportIndex < 80,
              'major-card--weak': m.supportIndex < 60,
            }"
          >
            <div class="major-card__head">
              <div class="major-card__title">
                <h3>{{ m.major }}</h3>
                <div class="major-card__index" :class="{
                  'major-card__index--good': m.supportIndex >= 80,
                  'major-card__index--mid': m.supportIndex >= 60 && m.supportIndex < 80,
                  'major-card__index--weak': m.supportIndex < 60,
                }">
                  <span>支撑指数</span>
                  <em>{{ m.supportIndex }}</em>
                </div>
              </div>
            </div>
            <div class="major-card__metrics">
              <div class="major-metric">
                <span>专任教师</span>
                <strong>{{ m.headcount }}<small>人</small></strong>
              </div>
              <div class="major-metric">
                <span>博士占比</span>
                <strong :style="{ color: m.phdRatio >= 80 ? '#6effc2' : m.phdRatio >= 65 ? '#ffd56a' : '#ff8a65' }">{{ m.phdRatio }}<small>%</small></strong>
              </div>
              <div class="major-metric">
                <span>高级职称</span>
                <strong :style="{ color: m.seniorRatio >= 50 ? '#6effc2' : m.seniorRatio >= 35 ? '#ffd56a' : '#ff8a65' }">{{ m.seniorRatio }}<small>%</small></strong>
              </div>
              <div class="major-metric">
                <span>平均课时</span>
                <strong>{{ m.avgHours }}<small>h</small></strong>
              </div>
              <div class="major-metric">
                <span>生师比</span>
                <strong>{{ m.studentTeacherRatio }}</strong>
              </div>
              <div class="major-metric">
                <span>核心课程支撑率</span>
                <strong :style="{ color: m.coreCourseSupportRate >= 80 ? '#6effc2' : m.coreCourseSupportRate >= 50 ? '#ffd56a' : '#ff8a65' }">{{ m.coreCourseSupportRate }}<small>%</small></strong>
              </div>
              <div class="major-metric">
                <span>青年教师比例</span>
                <strong>{{ m.youngTeacherRatio }}<small>%</small></strong>
              </div>
              <div class="major-metric">
                <span>高层次人才</span>
                <strong :style="{ color: m.highTalentCount >= 3 ? '#6effc2' : m.highTalentCount >= 1 ? '#ffd56a' : '#ff8a65' }">{{ m.highTalentCount }}<small>人</small></strong>
              </div>
              <div class="major-metric">
                <span>近5年新增</span>
                <strong>{{ m.newTeachers5yr }}<small>人</small></strong>
              </div>
            </div>
            <div class="major-card__insight">
              <span class="resource-card__insight-icon">💡</span>
              <div class="major-card__suggestions">
                <span class="major-card__suggestions-label">专业支撑建议（怎么做）</span>
                <ul>
                  <li v-for="(s, i) in m.suggestions" :key="i">{{ s }}</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </template>
    </template>
  </CollegeDetailLayout>
</template>

<style scoped lang="scss">
// ===== Tab 切换 =====
.tab-bar {
  display: flex;
  gap: 0;
  margin-bottom: 20px;
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  overflow: hidden;
  width: fit-content;

  &--header {
    margin-bottom: 0;
    flex-wrap: nowrap;
    background: rgba(0, 40, 90, 0.35);
  }
}

.tab-btn {
  padding: 10px 28px;
  border: none;
  background: rgba(0, 60, 120, 0.18);
  color: #8ec8e8;
  font-size: 22px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.22s;

  &:first-child { border-right: 1px solid rgba(0, 242, 255, 0.12); }

  &:hover { background: rgba(0, 90, 160, 0.28); color: #b8ecff; }

  &--active {
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
    color: #eaf7ff;
    box-shadow: inset 0 0 18px rgba(0, 200, 255, 0.15);
  }
}

// ===== 顶部指标概览 =====
.resource-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;

  &__card {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px; border-radius: 10px;
    border: 1px solid rgba(0, 242, 255, 0.18);
    background: linear-gradient(160deg, rgba(0, 80, 160, 0.2), rgba(2, 14, 40, 0.75));
    cursor: pointer; transition: all 0.25s;

    &:hover { border-color: rgba(0, 242, 255, 0.5); background: linear-gradient(160deg, rgba(0, 120, 220, 0.28), rgba(2, 18, 48, 0.85)); box-shadow: 0 0 22px rgba(0, 180, 255, 0.2); transform: translateY(-2px); }
  }

  &__icon { font-size: 28px; flex-shrink: 0; }

  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

  &__label { font-size: 22px; color: #8ec8e8; font-weight: 600; }

  &__value { font-size: 28px; font-weight: 900; color: #5cecff; small { margin-left: 3px; font-size: 22px; color: #7fdfff; font-weight: 600; } }
  &__value &__pct { font-size: 18px; color: #7fb8d6; font-weight: 600; }

  &__plan { font-size: 16px; color: #9ecae8; small { margin-left: 2px; font-size: 13px; color: #7e9bb5; } }
}

// ===== 各指标分区 =====
.resource-section {
  margin-bottom: 28px; padding: 18px 20px; border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.12);
  background: linear-gradient(180deg, rgba(4, 22, 52, 0.65), rgba(2, 12, 32, 0.8));
  scroll-margin-top: 20px; transition: border-color 0.4s, box-shadow 0.4s;

  &--active { border-color: rgba(0, 242, 255, 0.55); box-shadow: 0 0 30px rgba(0, 200, 255, 0.16), inset 0 0 30px rgba(0, 180, 255, 0.06); }

  &__title {
    display: flex; align-items: center; gap: 10px; margin: 0 0 10px;
    font-size: 24px; font-weight: 800; color: #eaf7ff; letter-spacing: 0.03em;

    &-icon { font-size: 24px; }
  }

  &__badge {
    margin-left: 8px; padding: 3px 12px; border-radius: 999px; font-size: 20px; font-weight: 700;
    color: #8ef6ff; border: 1px solid rgba(0, 200, 255, 0.3); background: rgba(0, 100, 200, 0.2);

    &--accent { color: #6effc2; border-color: rgba(46, 230, 168, 0.35); background: rgba(30, 180, 120, 0.18); }
    &--gold { color: #ffd56a; border-color: rgba(255, 210, 90, 0.4); background: rgba(200, 160, 40, 0.18); }
  }

  &__desc { margin: 0 0 16px; font-size: 22px; line-height: 1.7; color: #9fb6d2; }

  &__grid { display: grid; gap: 14px; &--2 { grid-template-columns: 1fr 1fr; } &--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
}

// ===== 卡片 =====
.resource-card {
  padding: 14px 16px; border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.14); background: rgba(0, 40, 90, 0.18);

  &--mt { margin-top: 14px; }

  h3 { margin: 0 0 12px; font-size: 22px; font-weight: 700; color: #b8ecff; }

  &__chart { height: 260px; &--bar { height: 160px; } }

  &__note { margin-top: 12px; padding: 10px 12px; border-radius: 8px; background: rgba(0, 80, 160, 0.15); border-left: 3px solid rgba(0, 200, 255, 0.35); p { margin: 0; font-size: 20px; line-height: 1.6; color: #8eaec8; } }

  &__insight {
    display: flex; align-items: flex-start; gap: 10px; margin-top: 14px; padding: 12px 14px;
    border-radius: 8px; background: rgba(0, 120, 200, 0.12); border: 1px solid rgba(0, 200, 255, 0.16);
    p { margin: 0; font-size: 20px; line-height: 1.6; color: #c6dcf0; strong { color: #ffd56a; font-weight: 800; } }
    &-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
    &--large { padding: 16px; }
  }

  &--talent { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px 16px; gap: 6px; }

  &__talent-icon { font-size: 36px; margin-bottom: 4px; }
  &__talent-count { font-size: 34px; font-weight: 900; color: #ffd56a; small { font-size: 22px; color: #c9a84b; margin-left: 2px; } }
  &__talent-label { font-size: 22px; font-weight: 700; color: #eaf7ff; }
  &__talent-desc { margin: 4px 0 0; font-size: 20px; color: #8eaec8; line-height: 1.5; }
}

// ===== 列表 =====
.resource-list {
  margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px;
  &--mt { margin-top: 14px; }
  &__item { display: grid; grid-template-columns: 110px 1fr auto; align-items: center; gap: 12px; }
  &__label { font-size: 20px; color: #8ec8e8; font-weight: 600; }
  &__bar-track { height: 8px; border-radius: 999px; background: rgba(7, 55, 128, 0.55); overflow: hidden; }
  &__bar-fill {
    height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1a8cff, #5cecff);
    box-shadow: 0 0 8px rgba(0, 242, 255, 0.35); transition: width 0.8s ease;
    &--phd { background: linear-gradient(90deg, #0d7a5c, #6effc2); box-shadow: 0 0 8px rgba(46, 230, 168, 0.35); }
    &--senior { background: linear-gradient(90deg, #c98c20, #ffd56a); box-shadow: 0 0 8px rgba(255, 210, 90, 0.4); }
  }
  &__value { font-size: 20px; color: #eaf7ff; font-weight: 700; white-space: nowrap; text-align: right; }
}

// ===== 表格 =====
.resource-table-wrap { overflow-x: auto; scrollbar-width: thin; scrollbar-color: rgba(0, 200, 255, 0.3) transparent; }
.resource-table {
  width: 100%; border-collapse: collapse; font-size: 20px;
  thead th { padding: 10px 14px; text-align: left; font-weight: 700; color: #9fd6f5; background: rgba(0, 90, 180, 0.2); border-bottom: 1px solid rgba(0, 242, 255, 0.2); white-space: nowrap; }
  tbody td { padding: 10px 14px; color: #d6e6f5; border-bottom: 1px solid rgba(0, 150, 255, 0.08); }
  tbody tr:hover td { background: rgba(0, 120, 220, 0.1); }
  &__name { font-weight: 700; color: #eaf7ff; }
  &__ratio { display: inline-block; margin-right: 10px; font-weight: 700; color: #6effc2; }
  &__mini-bar { display: inline-block; vertical-align: middle; width: 80px; height: 6px; border-radius: 999px; background: rgba(7, 55, 128, 0.55); overflow: hidden; }
  &__mini-fill { height: 100%; border-radius: inherit; background: linear-gradient(90deg, #1a8cff, #5cecff); }
}

// ===== 标签 =====
.resource-tag {
  display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 999px; font-size: 20px; font-weight: 700; white-space: nowrap;
  &--high { color: #6effc2; border: 1px solid rgba(46, 230, 168, 0.35); background: rgba(30, 180, 120, 0.15); }
  &--mid { color: #8ef6ff; border: 1px solid rgba(0, 200, 255, 0.3); background: rgba(0, 120, 220, 0.15); }
  &--low { color: #ffc19a; border: 1px solid rgba(255, 150, 80, 0.35); background: rgba(220, 120, 40, 0.15); }
  &--highlight { color: #ffd56a; border: 1px solid rgba(255, 210, 90, 0.35); background: rgba(200, 160, 40, 0.12); }
}
.resource-tags { display: flex; flex-wrap: wrap; gap: 10px; }

// ===== Placeholder =====
.detail-placeholder { display: grid; min-height: 220px; place-items: center; color: rgba(184, 236, 255, 0.72); font-size: 24px; }
.detail-error { color: rgba(255, 160, 140, 0.85); }

// ===== Part 3 教学投入 =====
.ti-metrics { display: flex; flex-wrap: wrap; gap: 10px; margin: 4px 0 16px; }
.ti-metric {
  flex: 1 1 0; min-width: 150px;
  display: flex; flex-direction: column; gap: 3px;
  padding: 10px 14px; border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(0, 242, 255, 0.12);
  &__label { font-size: 16px; color: #9ecae8; }
  &__value { font-size: 26px; font-weight: 800; color: #d6ecff; line-height: 1.1; }
  &__sub { font-size: 15px; color: #8fb8d6; }
}

.overload-list { display: flex; flex-direction: column; gap: 8px; }

.overload-card {
  border-radius: 8px; border: 1px solid rgba(255, 140, 80, 0.2); background: rgba(40, 20, 10, 0.5);
  overflow: hidden; transition: border-color 0.2s;

  &--expanded { border-color: rgba(255, 140, 80, 0.5); }

  &__header {
    display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 12px;
    width: 100%; padding: 12px 14px; border: none; background: none; color: inherit;
    cursor: pointer; font-size: 20px; transition: background 0.18s;

    &:hover { background: rgba(255, 140, 80, 0.08); }
  }

  &__info {
    display: flex; flex-direction: column; gap: 2px; text-align: left;
    strong { color: #eaf7ff; font-size: 22px; }
    span { color: #9ecae8; font-size: 18px; }
  }

  &__metrics {
    display: flex; align-items: center; gap: 10px; text-align: right;
  }

  &__hours { font-size: 22px; font-weight: 800; color: #ff8a65; font-style: normal;
    small { font-size: 16px; color: #c0846e; margin-left: 2px; }
  }

  &__over { font-size: 18px; color: #ff9b6a; padding: 2px 10px; border-radius: 999px; border: 1px solid rgba(255, 140, 80, 0.3); background: rgba(255, 100, 40, 0.12); }

  &__arrow { font-size: 20px; color: #8ec8e8; width: 24px; text-align: center; }

  &__body { padding: 0 14px 14px; border-top: 1px solid rgba(255, 140, 80, 0.15); }

  &__reason { margin: 10px 0; font-size: 20px; color: #c6dcf0; line-height: 1.6; }
}

.course-cell { max-width: 360px; }

.course-tag {
  display: inline-block; margin: 2px 4px 2px 0; padding: 2px 8px; border-radius: 4px;
  font-size: 18px; color: #b8d4f0; background: rgba(0, 120, 200, 0.14); border: 1px solid rgba(0, 180, 255, 0.15);
  white-space: nowrap;
  em { margin-left: 4px; color: #7fdfff; font-style: normal; font-weight: 700; }
}

.row--overload td { background: rgba(255, 80, 40, 0.08); }
.row--warn td { background: rgba(255, 200, 60, 0.05); }

// ===== Part 5 绩效分析 =====
.perf-cards { display: flex; flex-direction: column; gap: 8px; }

.perf-card {
  border-radius: 10px; border: 1px solid rgba(0, 200, 255, 0.14); background: rgba(0, 40, 90, 0.16);
  overflow: hidden; transition: border-color 0.2s;

  &--dual { border-left: 3px solid #ffd56a; }
  &--research { border-left: 3px solid #5cecff; }
  &--teaching { border-left: 3px solid #6effc2; }
  &--improve { border-left: 3px solid #ff8a65; }
  &--expanded { border-color: rgba(0, 200, 255, 0.4); }

  &__header {
    display: grid; grid-template-columns: 100px 1fr auto auto; align-items: center; gap: 12px;
    width: 100%; padding: 12px 14px; border: none; background: none; color: inherit;
    cursor: pointer; font-size: 20px; transition: background 0.18s;
    &:hover { background: rgba(0, 100, 200, 0.1); }
  }

  &__rank { font-size: 18px; font-weight: 700; display: flex; align-items: center; gap: 6px; }

  &__cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

  &__info { display: flex; flex-direction: column; gap: 2px; text-align: left;
    strong { color: #eaf7ff; font-size: 22px; }
    span { color: #9ecae8; font-size: 18px; }
  }

  &__scores { display: flex; gap: 16px; }

  &__score { display: flex; flex-direction: column; align-items: center; gap: 2px; }

  &__score-label { font-size: 16px; color: #8ec8e8; }

  &__score-val { font-size: 22px; font-weight: 800; font-style: normal; }

  &__arrow { font-size: 20px; color: #8ec8e8; width: 24px; text-align: center; }

  &__body { padding: 0 14px 14px; border-top: 1px solid rgba(0, 200, 255, 0.12); }

  &__detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }

  &__detail {
    h4 { margin: 0 0 8px; font-size: 20px; color: #b8ecff; }
    ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 6px; }
    li { display: flex; justify-content: space-between; align-items: center; font-size: 18px; color: #9ecae8;
      span { color: #8eaec8; }
      strong { color: #eaf7ff; font-size: 18px; }
    }
  }

  &__suggestion {
    display: flex; align-items: flex-start; gap: 10px; margin-top: 12px; padding: 12px 14px;
    border-radius: 8px; background: rgba(255, 140, 80, 0.08); border: 1px solid rgba(255, 140, 80, 0.2);
    p { margin: 0 0 4px; font-size: 18px; line-height: 1.6; color: #c6dcf0; strong { color: #ffd56a; } }
    p:last-child { margin-bottom: 0; }
  }
}

// ===== Part 6 预警中心 =====
.warn-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }

.warn-category {
  border-radius: 12px; overflow: hidden; background: linear-gradient(180deg, rgba(4, 22, 52, 0.7), rgba(2, 12, 32, 0.85));

  &--red, &--yellow, &--blue { border: 1px solid rgba(0, 200, 255, 0.18); }

  &__head { padding: 14px 16px 10px; }

  &__title { display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
    h2 { margin: 0; font-size: 22px; font-weight: 800; color: #eaf7ff; }
  }

  &__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: #5c8db0; }

  &__badge { padding: 2px 10px; border-radius: 999px; font-size: 18px; font-weight: 700;
    color: #9fc4e0; border: 1px solid rgba(0, 200, 255, 0.25); background: rgba(0, 120, 220, 0.12);
  }

  &__desc { margin: 0; font-size: 18px; line-height: 1.55; color: #8eaec8; }

  &__list { padding: 8px 16px 14px; display: flex; flex-direction: column; gap: 10px; }
}

.warn-item {
  padding: 12px 14px; border-radius: 8px;
  background: rgba(0, 40, 90, 0.2); border: 1px solid rgba(0, 180, 255, 0.1);
  display: flex; flex-direction: column; gap: 10px;
  cursor: pointer; transition: background 0.15s ease, border-color 0.15s ease;

  &:hover { background: rgba(0, 50, 110, 0.3); border-color: rgba(0, 200, 255, 0.3); }
  &.is-expanded { background: rgba(0, 50, 110, 0.32); border-color: rgba(0, 200, 255, 0.35); }

  &__head {
    display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
  }

  &__info {
    min-width: 0;
    strong { display: block; font-size: 20px; color: #eaf7ff; margin-bottom: 2px; }
    span { font-size: 17px; color: #8ec8e8; }
  }

  &__meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

  &__index {
    padding: 3px 10px; border-radius: 999px; font-size: 16px; font-weight: 800; white-space: nowrap;
    &--red { color: #ff6b6b; border: 1px solid rgba(255, 80, 80, 0.4); background: rgba(255, 60, 60, 0.14); }
    &--yellow { color: #ffd56a; border: 1px solid rgba(255, 200, 60, 0.4); background: rgba(200, 160, 40, 0.14); }
    &--blue { color: #5cecff; border: 1px solid rgba(0, 200, 255, 0.35); background: rgba(0, 120, 220, 0.14); }
  }

  &__status { padding: 3px 10px; border-radius: 999px; font-size: 16px; font-weight: 700;
    &--new { color: #ff8a65; border: 1px solid rgba(255, 138, 101, 0.35); background: rgba(255, 100, 40, 0.1); }
    &--tracking { color: #ffd56a; border: 1px solid rgba(255, 213, 106, 0.35); background: rgba(200, 160, 40, 0.1); }
    &--done { color: #6effc2; border: 1px solid rgba(110, 255, 194, 0.3); background: rgba(40, 200, 120, 0.1); }
  }

  &__toggle { margin-left: 2px; font-size: 18px; line-height: 1; color: #9fc4e0; align-self: center; transition: transform 0.15s ease; }

  &__detail { margin: 0; font-size: 17px; line-height: 1.5; color: #9fb6d2; }

  &__block { display: flex; flex-direction: column; gap: 6px;
    & + & { margin-top: 2px; }
  }

  &__block-label {
    font-size: 17px; font-weight: 700; color: #b8ecff;
    padding-left: 2px; border-left: 3px solid rgba(0, 200, 255, 0.4);
  }

  &__reasons, &__suggestions {
    margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px;
    li { font-size: 17px; line-height: 1.5; color: #d6e6f5; }
  }
  &__reasons li { color: #ffc7b0; }
  &__suggestions li { color: #b8f0d4; }

  &__loop {
    margin-top: 2px; padding: 10px 12px; border-radius: 8px;
    background: rgba(0, 120, 200, 0.1); border: 1px solid rgba(0, 200, 255, 0.16);
    display: flex; flex-direction: column; gap: 8px;
    .warn-item__block-label { color: #9fd6f5; }
  }

  &__loop-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }

  &__loop-tag {
    padding: 3px 10px; border-radius: 999px; font-size: 16px; font-weight: 700;
    color: #9fd6f5; border: 1px solid rgba(0, 200, 255, 0.3); background: rgba(0, 100, 200, 0.16);
  }

  &__loop-outcome {
    padding: 3px 10px; border-radius: 999px; font-size: 16px; font-weight: 700;
    &--up { color: #ff6b6b; border: 1px solid rgba(255, 80, 80, 0.4); background: rgba(255, 60, 60, 0.14); }
    &--down { color: #6effc2; border: 1px solid rgba(110, 255, 194, 0.35); background: rgba(40, 200, 120, 0.12); }
    &--same { color: #ffd56a; border: 1px solid rgba(255, 200, 60, 0.4); background: rgba(200, 160, 40, 0.12); }
    &--clear { color: #6effc2; border: 1px solid rgba(110, 255, 194, 0.4); background: rgba(40, 200, 120, 0.18); }
  }

  &__loop-next { font-size: 16px; color: #9fb6d2; }
}

@media (max-width: 1100px) {
  .warn-grid { grid-template-columns: 1fr 1fr; }
}

// ===== Part 7 专业支撑 =====
.major-cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }

.major-card {
  border-radius: 12px; overflow: hidden;
  background: linear-gradient(180deg, rgba(4, 22, 52, 0.7), rgba(2, 12, 32, 0.85));

  &--good { border: 1px solid rgba(110, 255, 194, 0.3); }
  &--mid { border: 1px solid rgba(255, 213, 106, 0.3); }
  &--weak { border: 1px solid rgba(255, 138, 101, 0.3); }

  &__head {
    padding: 14px 16px 10px;
    .major-card--good & { background: rgba(46, 180, 120, 0.08); }
    .major-card--mid & { background: rgba(200, 160, 40, 0.06); }
    .major-card--weak & { background: rgba(255, 100, 40, 0.06); }
  }

  &__title {
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    h3 { margin: 0; font-size: 22px; font-weight: 800; color: #eaf7ff; }
  }

  &__index {
    display: flex; flex-direction: column; align-items: center; padding: 6px 14px; border-radius: 8px;
    span { font-size: 16px; }
    em { font-size: 26px; font-weight: 900; font-style: normal; }
    &--good { background: rgba(46, 180, 120, 0.12); border: 1px solid rgba(110, 255, 194, 0.25); span { color: #6effc2; } em { color: #6effc2; } }
    &--mid { background: rgba(200, 160, 40, 0.12); border: 1px solid rgba(255, 213, 106, 0.25); span { color: #ffd56a; } em { color: #ffd56a; } }
    &--weak { background: rgba(255, 100, 40, 0.12); border: 1px solid rgba(255, 138, 101, 0.25); span { color: #ff8a65; } em { color: #ff8a65; } }
  }

  &__metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; padding: 14px 16px; }

  &__insight {
    display: flex; align-items: flex-start; gap: 8px; margin: 0 16px 14px; padding: 10px 12px;
    border-radius: 8px; background: rgba(255, 200, 60, 0.06); border: 1px solid rgba(255, 200, 60, 0.15);
    p { margin: 0; font-size: 18px; line-height: 1.55; color: #c6dcf0; }
  }

  &__suggestions {
    flex: 1; min-width: 0;
    &-label { display: block; font-size: 18px; font-weight: 700; color: #ffd56a; margin-bottom: 6px; }
    ul { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 4px; }
    li { font-size: 18px; line-height: 1.5; color: #d6e6f5; }
  }
}

.major-metric {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 8px 6px; border-radius: 6px; background: rgba(0, 40, 90, 0.15);
  text-align: center;

  span { font-size: 17px; color: #8ec8e8; font-weight: 600; }
  strong { font-size: 22px; font-weight: 800; color: #eaf7ff;
    small { font-size: 17px; color: #7fa9c8; margin-left: 1px; }
  }
}

@media (max-width: 1100px) {
  .major-cards { grid-template-columns: 1fr 1fr; }
}

// ===== 学缘结构左右布局 =====
.academic-origin-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 14px;
}

@media (max-width: 1100px) {
  .academic-origin-layout { grid-template-columns: 1fr; }
  .resource-summary { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .resource-section__grid--2,
  .resource-section__grid--3 { grid-template-columns: 1fr; }
}

// ===== 来源筛选按钮 =====
.filter-bar { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 14px; }
.filter-btn {
  padding: 7px 16px; font-size: 16px; font-weight: 600; cursor: pointer;
  color: #bfe6ff; background: rgba(8, 36, 64, 0.55);
  border: 1px solid rgba(0, 200, 255, 0.28); border-radius: 999px;
  transition: all 0.18s ease;
}
.filter-btn:hover { border-color: rgba(92, 236, 255, 0.6); color: #eaf7ff; box-shadow: 0 0 10px rgba(92, 236, 255, 0.3); }
.filter-btn.is-active { color: #06121f; border-color: #5cecff; background: #5cecff; box-shadow: 0 0 14px rgba(92, 236, 255, 0.5); }

// ===== 可展开行 =====
.is-clickable { cursor: pointer; transition: background 0.15s ease; }
.is-clickable:hover { background: rgba(92, 236, 255, 0.1); }
.is-expanded { background: rgba(92, 236, 255, 0.16); }
.row-detail > td { padding: 0 12px 12px; background: rgba(2, 14, 38, 0.55); }
.row-detail__inner {
  border: 1px dashed rgba(92, 236, 255, 0.35); border-radius: 10px;
  padding: 10px 12px; background: rgba(8, 30, 56, 0.5);
}
.resource-table--sub { margin: 0; }
.resource-table--sub th,
.resource-table--sub td { font-size: 18px; padding: 8px 10px; }
.row-detail__empty { text-align: center; color: #7e9bb5; font-style: italic; padding: 12px 0; }

// ===== 资源基础总体评价（对照学科评估 / 博士点标准） =====
.resource-eval {
  margin: 10px 0 28px; padding: 18px 20px; border-radius: 12px;
  border: 1px solid rgba(0, 242, 255, 0.16);
  background: linear-gradient(180deg, rgba(6, 28, 64, 0.7), rgba(2, 12, 32, 0.82));

  &__title { display: flex; align-items: center; gap: 8px; margin: 0 0 6px; font-size: 22px; font-weight: 800; color: #cfeaff; }
  &__title-icon { font-size: 22px; }
  &__badge { margin-left: 6px; padding: 3px 12px; border-radius: 999px; font-size: 18px; font-weight: 700;
    &.is-high { color: #6effc2; border: 1px solid rgba(46, 230, 168, 0.35); background: rgba(30, 180, 120, 0.18); }
    &.is-mid { color: #ffd56a; border: 1px solid rgba(255, 210, 90, 0.4); background: rgba(200, 160, 40, 0.18); }
    &.is-low { color: #ff8a65; border: 1px solid rgba(255, 120, 90, 0.4); background: rgba(200, 70, 40, 0.18); }
  }
  &__tip { margin: 0 0 16px; font-size: 18px; color: #8fb4d4; line-height: 1.6; b { color: #ffd56a; } }
  &__sep { margin: 0 6px; color: #5a7a96; }
  &__cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
  &__col {
    padding: 14px 16px; border-radius: 10px;
    border: 1px solid rgba(0, 242, 255, 0.14);
    background: rgba(3, 16, 40, 0.6);
  }
  &__col-title { margin: 0 0 12px; padding-bottom: 10px; border-bottom: 1px dashed rgba(0, 242, 255, 0.18);
    font-size: 19px; font-weight: 700; color: #d6ecff; }
}

.eval-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.eval-list__item {
  display: grid; grid-template-columns: 1.1fr 1fr 1.1fr 32px; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 8px; font-size: 18px;
  background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.06);
  &.is-fail { border-color: #ff4d4f; background: rgba(255, 77, 79, 0.1); box-shadow: inset 0 0 6px rgba(255, 77, 79, 0.3); }
  &:not(.is-fail) { border-color: #22c55e; background: rgba(34, 197, 94, 0.08); box-shadow: inset 0 0 6px rgba(34, 197, 94, 0.3); }
  .eval-list__name { color: #cfe6f7; font-weight: 600; }
  .eval-list__val { color: #8fe0ff; font-weight: 700; }
  .eval-list__req { color: #7e9bb5; font-size: 16px; font-style: normal; }
  .eval-list__flag {
    display: inline-flex; align-items: center; justify-content: center;
    width: 26px; height: 26px; border-radius: 6px;
    font-size: 18px; font-weight: 900; color: #fff; line-height: 1;
    .eval-list__item.is-fail & { background: #ff4d4f; box-shadow: 0 0 8px rgba(255, 77, 79, 0.55); }
    .eval-list__item:not(.is-fail) & { background: #22c55e; box-shadow: 0 0 8px rgba(34, 197, 94, 0.55); }
  }
}

// ===== 结构分析整体评价横幅 =====
.structure-eval {
  display: flex; align-items: center; gap: 14px; margin-bottom: 20px; padding: 14px 18px;
  border-radius: 12px; border: 1px solid rgba(0, 242, 255, 0.22);
  background: linear-gradient(90deg, rgba(0, 160, 255, 0.14), rgba(2, 12, 32, 0.6));
  box-shadow: 0 0 18px rgba(0, 200, 255, 0.08) inset;
  &__icon { font-size: 24px; }
  &__text { margin: 0; font-size: 20px; font-weight: 700; color: #e6f6ff; line-height: 1.6; letter-spacing: 0.3px; }
}

// ===== 临近退休人员与课程接续 =====
.retire-list {
  max-height: 320px; overflow-y: auto; padding: 4px 6px 4px 2px;
  display: flex; flex-direction: column; gap: 10px;
  border-radius: 10px; border: 1px solid rgba(0, 242, 255, 0.1);
  background: rgba(2, 12, 32, 0.45);
  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-thumb { border-radius: 8px; background: rgba(0, 200, 255, 0.3); }
  &::-webkit-scrollbar-track { background: transparent; }
  &__title { margin: 0 0 4px; font-size: 20px; font-weight: 700; color: #e6f6ff; }
  &__desc { margin: 0 0 12px; font-size: 17px; color: #8fb4d4; line-height: 1.6; }
  &__crit { color: #ff8a65; }
  &__ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
  &__item {
    padding: 10px 14px; border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.07); background: rgba(255, 255, 255, 0.03);
    &.is-critical { border-color: rgba(255, 120, 90, 0.4); background: rgba(255, 90, 60, 0.06); }
  }
  &__head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; margin-bottom: 6px; }
  &__name { font-size: 18px; font-weight: 800; color: #e6f6ff; }
  &__meta { font-size: 16px; color: #9fc0dc; }
  &__year { font-size: 16px; color: #ffcf8a; }
  &__flag { font-size: 16px; font-weight: 700; color: #ff8a65; padding: 1px 9px; border-radius: 999px; background: rgba(255, 90, 60, 0.15); border: 1px solid rgba(255, 120, 90, 0.4); }
  &__courses { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; font-size: 17px; color: #9ecae8; }
}
</style>
