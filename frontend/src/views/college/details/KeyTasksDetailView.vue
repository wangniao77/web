<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { collegeDetailService } from '@/api/college/services/details'
import { useScope } from '@/composables/useScope'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { KeyTaskDetailVM, KeyTasksDetailVM } from '@/types/college/view/details'
import type { EChartsOption } from 'echarts'

const route = useRoute()
const router = useRouter()
const { collegeScope } = useScope()

const data = ref<KeyTasksDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

type TabKey = 'overview' | 'process' | 'risk' | 'insights'
const TAB_KEYS: TabKey[] = ['overview', 'process', 'risk', 'insights']

const currentTab = ref<TabKey>('overview')
const tabBarRef = ref<HTMLElement | null>(null)
const activeSection = ref('')
const selectedTaskId = ref('')

const filterYear = ref('全部')
const filterDomain = ref('全部')
const filterType = ref('全部')
const filterOwner = ref('全部')
const filterLevel = ref('全部')
const filterMajor = ref('全部')
const filterStatus = ref('全部')

/** 重点任务快览：当前选中的分类（按钮切换） */
const overviewActiveGroup = ref('discipline')

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function switchTab(tab: TabKey, options?: { replaceQuery?: boolean }) {
  currentTab.value = tab
  activeSection.value = ''
  if (options?.replaceQuery !== false) {
    router.replace({ path: ROUTES.college.keyTasks, query: { tab } })
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

function resetFilters() {
  filterYear.value = '全部'
  filterDomain.value = '全部'
  filterType.value = '全部'
  filterOwner.value = '全部'
  filterLevel.value = '全部'
  filterMajor.value = '全部'
  filterStatus.value = '全部'
}

const filteredTasks = computed(() => {
  if (!data.value) return []
  return data.value.tasks.filter((t) => {
    if (filterYear.value !== '全部' && data.value?.year !== filterYear.value) return false
    if (filterDomain.value !== '全部') {
      const matchLabel = t.categoryLabel === filterDomain.value || t.groupTitle === filterDomain.value
      const matchCategory =
        (filterDomain.value === '学科建设' && t.category === 'discipline') ||
        (filterDomain.value === '师资队伍建设' && t.category === 'faculty') ||
        (filterDomain.value === '教学建设' && t.category === 'teaching') ||
        (filterDomain.value === '科研建设' && t.category === 'research') ||
        (filterDomain.value === '人才培养' && t.category === 'talent') ||
        (filterDomain.value === '广财AI智教专项改革' && t.category === 'ai') ||
        (filterDomain.value === '党建与综合办学保障' && t.category === 'party')
      if (!matchLabel && !matchCategory) return false
    }
    if (filterType.value !== '全部' && t.taskType !== filterType.value) return false
    if (filterOwner.value !== '全部' && t.leadDept !== filterOwner.value) return false
    if (filterLevel.value !== '全部' && t.projectLevel !== filterLevel.value) return false
    if (filterMajor.value !== '全部' && t.majorDirection !== filterMajor.value) return false
    if (filterStatus.value !== '全部' && t.statusLabel !== filterStatus.value) return false
    return true
  })
})

const riskTasks = computed(() =>
  filteredTasks.value.filter((t) => t.statusClass === 'status-delayed' || t.riskReason),
)

const disciplineTasks = computed(
  () => data.value?.tasks.filter((t) => t.category === 'discipline') ?? [],
)
const facultyTasks = computed(
  () => data.value?.tasks.filter((t) => t.category === 'faculty') ?? [],
)

/** 按一级大类分组（用于过程列表，跟随筛选） */
const groupedTasks = computed(() => groupByPlanCategory(filteredTasks.value))

/** 快览用：不受过程筛选影响 */
const overviewGroupedTasks = computed(() => groupByPlanCategory(data.value?.tasks ?? []))

/** 快览当前选中分类（按钮切换后展示对应内容） */
const activeOverviewGroup = computed(
  () => overviewGroupedTasks.value.find((g) => g.id === overviewActiveGroup.value) ?? overviewGroupedTasks.value[0] ?? null,
)

/** 快览工作台账：当前展开详情的任务 */
const overviewLedgerId = ref('')
const overviewLedgerTask = computed(
  () => data.value?.tasks.find((t) => t.id === overviewLedgerId.value) ?? null,
)

/** 各组独立指标汇总（用于横向对比，识别滞后业务线） */
const groupSummaries = computed(() =>
  overviewGroupedTasks.value.map((g) => {
    const tasks = g.tasks
    const total = tasks.length
    const completed = tasks.filter((t) => t.statusClass === 'status-completed').length
    const delayed = tasks.filter((t) => t.statusClass === 'status-delayed').length
    const ongoing = total - completed - delayed
    const avg = total ? Math.round(tasks.reduce((s, t) => s + (t.progress || 0), 0) / total) : 0
    return { id: g.id, title: g.title, total, completed, ongoing, delayed, avg }
  }),
)

function barTone(g: { avg: number; delayed: number }) {
  if (g.delayed > 0 && g.avg < 70) return 'group-compare__bar--warn'
  if (g.avg >= 90) return 'group-compare__bar--ok'
  return 'group-compare__bar--run'
}

function groupByPlanCategory(tasks: KeyTaskDetailVM[]) {
  const order = [
    { id: 'discipline', title: '学科建设', subtitle: '学院发展根基' },
    { id: 'faculty', title: '师资队伍建设', subtitle: '学院发展命脉' },
    { id: 'teaching', title: '教学建设', subtitle: '学院发展支撑' },
    { id: 'research', title: '科研建设', subtitle: '学院发展载体' },
    { id: 'talent', title: '人才培养', subtitle: '学院建设使命' },
    { id: 'ai', title: '广财AI智教专项改革', subtitle: '学院数字化攻坚任务' },
    { id: 'party', title: '党建与综合办学保障', subtitle: '学院发展保障' },
  ] as const
  return order
    .map((g) => ({
      ...g,
      tasks: tasks.filter(
        (t) => t.category === g.id || t.groupId === g.id || t.groupTitle === g.title,
      ),
    }))
    .filter((g) => g.tasks.length > 0)
}

const selectedTask = computed(() =>
  data.value?.tasks.find((t) => t.id === selectedTaskId.value) ?? null,
)

function openTask(task: KeyTaskDetailVM) {
  selectedTaskId.value = selectedTaskId.value === task.id ? '' : task.id
  nextTick(() => {
    document.getElementById('kt-task-drill')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function onProgressChartClick(params: unknown) {
  const name = (params as { name?: string })?.name
  if (!name || !data.value) return
  const task = data.value.tasks.find((t) => t.name === name)
  if (task) {
    openTask(task)
    if (currentTab.value !== 'process') switchTab('process')
  }
}

const insights = computed(() => {
  if (!data.value) return []
  const { summary } = data.value
  const attentionShare = summary.total
    ? Math.round((summary.delayed / summary.total) * 100)
    : 0
  const disciplineAvg = disciplineTasks.value.length
    ? Math.round(
        disciplineTasks.value.reduce((s, t) => s + t.progress, 0) / disciplineTasks.value.length,
      )
    : 0
  const facultyAvg = facultyTasks.value.length
    ? Math.round(facultyTasks.value.reduce((s, t) => s + t.progress, 0) / facultyTasks.value.length)
    : 0
  const lowProgress = [...(data.value.tasks)].sort((a, b) => a.progress - b.progress).slice(0, 2)

  return [
    {
      title: '总体完成节奏可控',
      detail: `年度完成率 ${summary.completionRate}%，已完成 ${summary.completed} 项、推进中 ${summary.ongoing} 项；主体任务按节点推进。`,
      tone: 'good' as const,
    },
    {
      title: '风险仍集中在少数任务',
      detail: `需关注 ${summary.delayed} 项，占比约 ${attentionShare}%。${
        riskTasks.value[0] ? `当前最紧的是「${riskTasks.value[0].name}」。` : ''
      }`,
      tone: 'warn' as const,
    },
    {
      title: '两大板块进度可对照',
      detail: `学科建设均进度 ${disciplineAvg}%、师资队伍建设均进度 ${facultyAvg}%，差距 ${Math.abs(disciplineAvg - facultyAvg)} 个百分点；低进度任务：${lowProgress.map((t) => t.name).join('、')}。`,
      tone: 'info' as const,
    },
  ]
})

const actions = computed(() => [
  '对「需关注」任务建立双周督导清单，明确责任人与补救节点',
  '把学科建设关键节点纳入学院党政联席会专题议定',
  '师资短板项（双师型等）与人事/产学研联动，按月通报进度',
])

const statusPieOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const { completed, ongoing, delayed } = data.value.summary
  return {
    tooltip: { trigger: 'item', backgroundColor: 'rgba(2,14,38,0.94)', borderColor: 'rgba(0,242,255,0.5)', textStyle: { color: '#f4fbff', fontSize: 18 } },
    legend: { bottom: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    series: [{
      type: 'pie',
      radius: ['42%', '68%'],
      center: ['50%', '46%'],
      label: { color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '{b}\n{c}项' },
      data: [
        { name: '已完成', value: completed, itemStyle: { color: '#6effc2' } },
        { name: '推进中', value: ongoing, itemStyle: { color: '#5cecff' } },
        { name: '需关注', value: delayed, itemStyle: { color: '#ffa94d' } },
      ],
    }],
  }
})

const progressBarOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const items = [...data.value.tasks].sort((a, b) => a.progress - b.progress)
  return {
    grid: { left: 8, right: 48, top: 8, bottom: 4, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2,14,38,0.94)',
      borderColor: 'rgba(0,242,255,0.5)',
      textStyle: { color: '#f4fbff', fontSize: 18 },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { dataIndex?: number }
        const raw = items[item.dataIndex ?? 0]
        return `${raw?.name ?? ''}<br/>完成率 ${raw?.progress ?? 0}% · ${raw?.statusLabel ?? ''}<br/><span style="color:#9fe8ff">点击查看过程详情</span>`
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
      data: items.map((i) => i.name),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 22 },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar',
      cursor: 'pointer',
      barWidth: '50%',
      data: items.map((i) => ({
        value: i.progress,
        name: i.name,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i.statusClass === 'status-delayed'
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#ff8a65' }, { offset: 1, color: '#ffa94d' }] }
            : i.statusClass === 'status-completed'
              ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#0d7a5c' }, { offset: 1, color: '#6effc2' }] }
              : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#1a8cff' }, { offset: 1, color: '#5cecff' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '{c}%' },
    }],
  }
})

const domainCompareOption = computed<EChartsOption>(() => {
  const disciplineAvg = disciplineTasks.value.length
    ? Math.round(
        disciplineTasks.value.reduce((s, t) => s + t.progress, 0) / disciplineTasks.value.length,
      )
    : 0
  const facultyAvg = facultyTasks.value.length
    ? Math.round(facultyTasks.value.reduce((s, t) => s + t.progress, 0) / facultyTasks.value.length)
    : 0
  return {
    grid: { left: 8, right: 16, top: 28, bottom: 8, outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    legend: { top: 0, textStyle: { color: '#c6e6ff', fontSize: CHART_FONT.legend } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(2,14,38,0.94)', borderColor: 'rgba(0,242,255,0.5)', textStyle: { color: '#f4fbff', fontSize: 18 } },
    xAxis: {
      type: 'category',
      data: ['学科建设', '师资队伍建设'],
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
        name: '任务数',
        type: 'bar',
        barWidth: 28,
        data: [disciplineTasks.value.length, facultyTasks.value.length],
        itemStyle: { color: 'rgba(92,236,255,0.45)', borderRadius: [4, 4, 0, 0] },
        label: { show: true, position: 'top', color: '#9fe8ff', fontSize: CHART_FONT.label, formatter: '{c}项' },
      },
      {
        name: '均进度',
        type: 'line',
        data: [disciplineAvg, facultyAvg],
        lineStyle: { color: '#ffd56a', width: 2 },
        itemStyle: { color: '#ffd56a' },
        label: { show: true, position: 'top', color: '#ffd56a', fontSize: CHART_FONT.label, formatter: '{c}%' },
      },
    ],
  }
})

function applyRouteQuery() {
  const tab = String(route.query.tab ?? '')
  if (TAB_KEYS.includes(tab as TabKey)) {
    currentTab.value = tab as TabKey
  }
  const taskId = String(route.query.task ?? '')
  if (taskId) selectedTaskId.value = taskId
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    data.value = await collegeDetailService.fetchKeyTasksDetail(collegeScope.value)
    applyRouteQuery()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
})

watch(() => route.query, () => applyRouteQuery())
</script>

<template>
  <CollegeDetailLayout>
    <template #nav>
      <div ref="tabBarRef" class="tab-bar tab-bar--header">
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'overview' }" @click="switchTab('overview')">📋 进展总览</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'process' }" @click="switchTab('process')">🧭 任务过程</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'risk' }" @click="switchTab('risk')">⚠️ 风险预警</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'insights' }" @click="switchTab('insights')">🔍 深度挖掘</button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <template v-else-if="data">
      <!-- ===================== 进展总览 ===================== -->
      <template v-if="currentTab === 'overview'">
        <div class="resource-summary resource-summary--5">
          <div class="resource-summary__card" @click="scrollToSection('kt-status')">
            <span class="resource-summary__icon">📌</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">重点任务</span>
              <strong class="resource-summary__value">{{ data.summary.total }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('process')">
            <span class="resource-summary__icon">✅</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">已完成</span>
              <strong class="resource-summary__value resource-summary__value--ok">{{ data.summary.completed }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('process')">
            <span class="resource-summary__icon">🚀</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">推进中</span>
              <strong class="resource-summary__value">{{ data.summary.ongoing }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('risk')">
            <span class="resource-summary__icon">⚠️</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">需关注</span>
              <strong class="resource-summary__value resource-summary__value--warn">{{ data.summary.delayed }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('kt-progress')">
            <span class="resource-summary__icon">📈</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">完成率</span>
              <strong class="resource-summary__value">{{ data.summary.completionRate }}<small>%</small></strong>
            </div>
          </div>
        </div>

        <section id="kt-status" class="resource-section" :class="{ 'resource-section--active': activeSection === 'kt-status' }">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📊</span>
            状态结构
            <span class="resource-section__badge">{{ data.year }} 年度</span>
          </h2>
          <p class="resource-section__desc">从完成 / 推进 / 关注三维看年度重点规划整体态势；点击 KPI 可跳转到过程或风险分区。</p>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>任务状态分布</h3>
              <div class="resource-card__chart"><ChartContainer :option="statusPieOption" /></div>
            </div>
            <div class="resource-card">
              <h3>一级大类对比</h3>
              <div class="resource-card__chart"><ChartContainer :option="domainCompareOption" /></div>
              <div class="resource-card__insight">
                <span class="resource-card__insight-icon">💡</span>
                <p>学科建设 {{ disciplineTasks.length }} 项 · 师资队伍建设 {{ facultyTasks.length }} 项。建议按大类抓重点、盯短板。</p>
              </div>
            </div>
          </div>
        </section>

        <section id="kt-progress" class="resource-section" :class="{ 'resource-section--active': activeSection === 'kt-progress' }">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📉</span>
            进度分布
            <em class="resource-section__hint">点击柱条下钻</em>
          </h2>
          <p class="resource-section__desc">按完成率排序，橙色为需关注任务。点击柱条可打开过程详情与里程碑。</p>
          <div class="resource-card">
            <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="progressBarOption" @chart-click="onProgressChartClick" /></div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🗂️</span>重点任务快览</h2>
          <div class="overview-switch" role="tablist">
            <button
              v-for="group in overviewGroupedTasks"
              :key="`overview-btn-${group.id}`"
              type="button"
              class="overview-switch__btn"
              :class="{ 'is-active': activeOverviewGroup?.id === group.id, 'is-feature': group.id === 'ai' }"
              @click="overviewActiveGroup = group.id"
            >
              {{ group.title }}
              <span v-if="group.id === 'ai'" class="overview-switch__tag">专项</span>
              <span class="overview-switch__count">{{ group.tasks.length }} 项</span>
            </button>
          </div>

          <div v-if="activeOverviewGroup" class="task-group">
            <header class="task-group__head">
              <div>
                <strong>{{ activeOverviewGroup.title }}</strong>
                <em>{{ activeOverviewGroup.subtitle }}</em>
              </div>
              <span>{{ activeOverviewGroup.tasks.length }} 项</span>
            </header>
            <div class="task-grid">
              <button
                v-for="task in activeOverviewGroup.tasks"
                :key="task.id"
                type="button"
                class="task-tile"
                :class="[`task-tile--${task.statusClass}`, { 'is-active': overviewLedgerId === task.id }]"
                @click="overviewLedgerId = overviewLedgerId === task.id ? '' : task.id"
              >
                <header>
                  <strong>{{ task.name }}</strong>
                  <span class="task-tile__status">{{ task.statusLabel }}</span>
                </header>
                <dl class="task-tile__fields">
                  <div><dt>年度目标</dt><dd>{{ task.target }}{{ task.unit }}</dd></div>
                  <div><dt>当前进展</dt><dd>{{ task.actual }}{{ task.unit }}</dd></div>
                  <div><dt>完成占比</dt><dd>{{ task.progress }}%</dd></div>
                  <div><dt>责任人</dt><dd>{{ task.leadDept }}</dd></div>
                  <div class="task-tile__fields--full"><dt>关键节点</dt><dd>{{ task.milestone }}</dd></div>
                </dl>
                <div class="task-tile__bar"><i :style="{ width: `${task.progress}%` }" /></div>
                <footer>
                  <span class="task-tile__detail">查看工作台账 ›</span>
                </footer>
              </button>
            </div>

            <div v-if="overviewLedgerTask" id="kt-overview-ledger" class="resource-section resource-section--drill">
              <div class="drill-head">
                <h2 class="resource-section__title">
                  <span class="resource-section__title-icon">📒</span>
                  工作台账 · {{ overviewLedgerTask.name }}
                </h2>
                <button type="button" class="drill-close" @click="overviewLedgerId = ''">收起</button>
              </div>
              <div class="resource-section__grid resource-section__grid--2">
                <div class="resource-card">
                  <h3 class="resource-card__title">⏱ 时间节点</h3>
                  <div class="ledger-meta">
                    <span class="ledger-meta__label">计划完成时间</span>
                    <span class="ledger-meta__value">{{ overviewLedgerTask.deadline }}</span>
                  </div>
                  <ul class="milestone-list">
                    <li
                      v-for="(m, idx) in overviewLedgerTask.milestones"
                      :key="idx"
                      :class="{ 'is-done': m.done }"
                    >
                      <i />
                      <span>{{ m.label }}</span>
                      <em>{{ m.done ? '已完成' : '进行中' }}</em>
                    </li>
                  </ul>
                </div>
                <div class="resource-card">
                  <h3 class="resource-card__title">责任与材料</h3>
                  <ul class="resource-list">
                    <li class="resource-list__item">
                      <span class="resource-list__label">责任人</span>
                      <span class="resource-list__value">{{ overviewLedgerTask.leadDept }}</span>
                    </li>
                    <li class="resource-list__item">
                      <span class="resource-list__label">任务类型</span>
                      <span class="resource-list__value">{{ overviewLedgerTask.taskType || '—' }}</span>
                    </li>
                    <li class="resource-list__item">
                      <span class="resource-list__label">级别 / 方向</span>
                      <span class="resource-list__value">
                        {{ overviewLedgerTask.projectLevel || '—' }} / {{ overviewLedgerTask.majorDirection || '—' }}
                      </span>
                    </li>
                  </ul>
                  <div v-if="overviewLedgerTask.description" class="resource-card__note">
                    <p>{{ overviewLedgerTask.description }}</p>
                  </div>
                  <div v-if="overviewLedgerTask.materials?.length" class="resource-card__insight">
                    <span class="resource-card__insight-icon">🗂️</span>
                    <p>支撑材料：{{ overviewLedgerTask.materials.join(' · ') }}</p>
                  </div>
                </div>
                <div class="resource-card">
                  <h3 class="resource-card__title">滞后原因</h3>
                  <div
                    v-if="overviewLedgerTask.riskReason"
                    class="resource-card__insight resource-card__insight--risk"
                  >
                    <span class="resource-card__insight-icon">⚠️</span>
                    <p>
                      {{ overviewLedgerTask.riskReason
                      }}<template v-if="overviewLedgerTask.handleStatus">（{{ overviewLedgerTask.handleStatus }}）</template>
                    </p>
                  </div>
                  <p v-else class="ledger-empty">暂无滞后，进度正常推进</p>
                </div>
                <div class="resource-card">
                  <h3 class="resource-card__title">专班跟进记录</h3>
                  <ul v-if="overviewLedgerTask.followUp?.length" class="followup-list">
                    <li v-for="(rec, idx) in overviewLedgerTask.followUp" :key="idx">
                      <span class="followup-list__date">{{ rec.date }}</span>
                      <span class="followup-list__content">{{ rec.content }}</span>
                    </li>
                  </ul>
                  <p v-else class="ledger-empty">暂无专班跟进记录</p>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="resource-card">
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">✨</span>
              <p>暂无重点任务数据。</p>
            </div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">📊</span>各组推进对比</h2>
          <p class="resource-section__desc">横向对比各业务线平均完成占比与风险分布，条形越短代表推进越滞后。</p>
          <div class="group-compare">
            <div v-for="g in groupSummaries" :key="`cmp-${g.id}`" class="group-compare__row">
              <div class="group-compare__head">
                <span class="group-compare__title">{{ g.title }}</span>
                <span class="group-compare__avg">{{ g.avg }}%</span>
              </div>
              <div class="group-compare__bar">
                <i :class="barTone(g)" :style="{ width: `${g.avg}%` }" />
              </div>
              <div class="group-compare__stats">
                <span>总 {{ g.total }}</span>
                <span class="is-ok">完成 {{ g.completed }}</span>
                <span class="is-run">推进 {{ g.ongoing }}</span>
                <span class="is-warn">关注 {{ g.delayed }}</span>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 任务过程 ===================== -->
      <template v-else-if="currentTab === 'process'">
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🎛️</span>分析维度筛选</h2>
          <div class="filter-grid">
            <label>
              <span>年度</span>
              <select v-model="filterYear">
                <option v-for="y in data.filterOptions.years" :key="y" :value="y">{{ y }}</option>
              </select>
            </label>
            <label>
              <span>一级大类</span>
              <select v-model="filterDomain">
                <option v-for="d in data.filterOptions.domains" :key="d" :value="d">{{ d }}</option>
              </select>
            </label>
            <label>
              <span>任务类型</span>
              <select v-model="filterType">
                <option v-for="t in data.filterOptions.taskTypes" :key="t" :value="t">{{ t }}</option>
              </select>
            </label>
            <label>
              <span>责任人</span>
              <select v-model="filterOwner">
                <option v-for="o in data.filterOptions.owners" :key="o" :value="o">{{ o }}</option>
              </select>
            </label>
            <label>
              <span>项目级别</span>
              <select v-model="filterLevel">
                <option v-for="l in data.filterOptions.projectLevels" :key="l" :value="l">{{ l }}</option>
              </select>
            </label>
            <label>
              <span>专业方向</span>
              <select v-model="filterMajor">
                <option v-for="m in data.filterOptions.majorDirections" :key="m" :value="m">{{ m }}</option>
              </select>
            </label>
            <label>
              <span>进度状态</span>
              <select v-model="filterStatus">
                <option v-for="s in data.filterOptions.statuses" :key="s" :value="s">{{ s }}</option>
              </select>
            </label>
            <button type="button" class="filter-reset" @click="resetFilters">重置</button>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">🧭</span>
            任务过程管理
            <span class="resource-section__badge">{{ filteredTasks.length }} 项</span>
          </h2>
          <div
            v-for="group in groupedTasks"
            :key="`process-${group.id}`"
            class="task-group"
          >
            <header class="task-group__head">
              <div>
                <strong>{{ group.title }}</strong>
                <em>{{ group.subtitle }}</em>
              </div>
              <span>{{ group.tasks.length }} 项</span>
            </header>
            <div class="task-cards">
              <article
                v-for="task in group.tasks"
                :key="task.id"
                class="task-card"
                :class="{ 'is-active': selectedTaskId === task.id, 'task-card--risk': task.statusClass === 'status-delayed' }"
                @click="openTask(task)"
              >
                <header>
                  <h3>
                    <small v-if="task.categoryLabel">{{ task.categoryLabel }}</small>
                    {{ task.name }}
                  </h3>
                  <span :class="task.statusClass">{{ task.statusLabel }}</span>
                </header>
                <div class="task-card__bar"><i :style="{ width: `${task.progress}%` }" /></div>
                <div class="task-card__grid">
                  <div><span>目标</span><strong>{{ task.target ?? '—' }}{{ task.unit }}</strong></div>
                  <div><span>完成</span><strong>{{ task.actual ?? '—' }}{{ task.unit }}</strong></div>
                  <div><span>完成率</span><strong>{{ task.progress }}%</strong></div>
                  <div><span>责任人</span><strong>{{ task.leadDept }}</strong></div>
                  <div><span>计划完成</span><strong>{{ task.deadline }}</strong></div>
                  <div><span>里程碑</span><strong>{{ task.milestone || '—' }}</strong></div>
                </div>
                <p v-if="task.materials?.length" class="task-card__materials">支撑材料：{{ task.materials.join(' · ') }}</p>
              </article>
            </div>
          </div>
        </section>

        <section
          v-if="selectedTask"
          id="kt-task-drill"
          class="resource-section resource-section--drill"
        >
          <div class="drill-head">
            <h2 class="resource-section__title">
              <span class="resource-section__title-icon">🔎</span>
              下钻详情 · {{ selectedTask.name }}
            </h2>
            <button type="button" class="drill-close" @click="selectedTaskId = ''">收起</button>
          </div>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>过程节点</h3>
              <ul class="milestone-list">
                <li v-for="(m, idx) in selectedTask.milestones" :key="idx" :class="{ 'is-done': m.done }">
                  <i />
                  <span>{{ m.label }}</span>
                  <em>{{ m.done ? '已完成' : '进行中' }}</em>
                </li>
              </ul>
            </div>
            <div class="resource-card">
              <h3>责任与材料</h3>
              <ul class="resource-list">
                <li class="resource-list__item">
                  <span class="resource-list__label">责任人</span>
                  <span class="resource-list__value">{{ selectedTask.leadDept }}</span>
                </li>
                <li class="resource-list__item">
                  <span class="resource-list__label">级别</span>
                  <span class="resource-list__value">{{ selectedTask.projectLevel || '—' }}</span>
                </li>
                <li class="resource-list__item">
                  <span class="resource-list__label">方向</span>
                  <span class="resource-list__value">{{ selectedTask.majorDirection || '—' }}</span>
                </li>
              </ul>
              <div class="resource-card__note" style="margin-top: 12px">
                <p>{{ selectedTask.description }}</p>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 风险预警 ===================== -->
      <template v-else-if="currentTab === 'risk'">
        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">⚠️</span>
            风险预警
            <span class="resource-section__badge resource-section__badge--warn">{{ riskTasks.length }} 项</span>
          </h2>
          <p class="resource-section__desc">聚焦滞后与临期任务，查看风险原因与当前处理状态，支持跳转过程管理跟进。</p>

          <div v-if="!riskTasks.length" class="resource-card">
            <div class="resource-card__insight">
              <span class="resource-card__insight-icon">✨</span>
              <p>当前筛选条件下暂无需关注任务。</p>
            </div>
          </div>

          <div v-else class="task-cards">
            <article
              v-for="task in riskTasks"
              :key="`risk-${task.id}`"
              class="task-card task-card--risk"
              @click="openTask(task); switchTab('process')"
            >
              <header>
                <h3>{{ task.name }}</h3>
                <span class="status-delayed">需关注</span>
              </header>
              <p class="task-card__desc">{{ task.riskReason || task.description }}</p>
              <div class="task-card__meta">
                <span>处理状态：{{ task.handleStatus || '跟进中' }}</span>
                <span>责任人：{{ task.leadDept }}</span>
                <span>截止：{{ task.deadline }}</span>
              </div>
            </article>
          </div>
        </section>
      </template>

      <!-- ===================== 深度挖掘 ===================== -->
      <template v-else-if="currentTab === 'insights'">
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🔍</span>深度挖掘 · 规划进展</h2>
          <p class="resource-section__desc">不只看看板数字，还给出结构结论与可执行建议；点击进度柱条可继续下钻单任务过程。</p>

          <div class="insight-grid">
            <article
              v-for="item in insights"
              :key="item.title"
              class="insight-card"
              :class="`insight-card--${item.tone}`"
            >
              <h4>{{ item.title }}</h4>
              <p>{{ item.detail }}</p>
            </article>
          </div>

          <div class="resource-card" style="margin-top: 14px">
            <h3>建议动作</h3>
            <ol class="action-list">
              <li v-for="(action, idx) in actions" :key="idx">{{ action }}</li>
            </ol>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📉</span>
            进度对比下钻
            <em class="resource-section__hint">点击柱条</em>
          </h2>
          <div class="resource-card">
            <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="progressBarOption" @chart-click="onProgressChartClick" /></div>
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

.detail-error {
  color: #ffb4a2;
}

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

.overview-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;

  &__btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 22px;
    border-radius: 8px;
    border: 1px solid rgba(0, 242, 255, 0.18);
    background: rgba(0, 60, 120, 0.18);
    color: #8ec8e8;
    font-size: 22px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.22s;

    &:hover {
      background: rgba(0, 90, 160, 0.28);
      color: #b8ecff;
    }

    &.is-active {
      background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
      color: #eaf7ff;
      border-color: rgba(0, 242, 255, 0.45);
      box-shadow: inset 0 0 18px rgba(0, 200, 255, 0.15);
    }

    &.is-feature {
      border-color: rgba(230, 190, 90, 0.55);
      background: linear-gradient(180deg, rgba(190, 150, 60, 0.28), rgba(120, 95, 35, 0.22));
      color: #ffe6a8;
      box-shadow: 0 0 14px rgba(220, 180, 80, 0.28);

      &:hover {
        background: linear-gradient(180deg, rgba(210, 170, 75, 0.36), rgba(135, 105, 40, 0.28));
        color: #fff1c9;
      }

      &.is-active {
        border-color: rgba(245, 210, 120, 0.75);
        box-shadow: 0 0 20px rgba(230, 190, 90, 0.42);
      }
    }
  }

  &__tag {
    display: inline-flex;
    align-items: center;
    padding: 1px 8px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: #fff1c9;
    background: rgba(220, 180, 80, 0.32);
    border: 1px solid rgba(245, 210, 120, 0.55);
  }

  &__count {
    font-size: 16px;
    font-weight: 600;
    color: #7fdfff;
    opacity: 0.85;
  }
}

.resource-section__desc {
  margin: -8px 0 14px;
  font-size: 18px;
  color: #8eaec8;
}

.group-compare {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__row {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    color: #eaf7ff;
  }

  &__avg {
    font-size: 22px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
  }

  &__bar {
    height: 12px;
    border-radius: 999px;
    background: rgba(7, 55, 128, 0.5);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      transition: width 0.4s;
    }

    &--ok { background: linear-gradient(90deg, #0d7a5c, #6effc2); }
    &--warn { background: linear-gradient(90deg, #e64a19, #ffa94d); }
    &--run { background: linear-gradient(90deg, #1a8cff, #5cecff); }
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    font-size: 16px;
    color: #8eaec8;

    .is-ok { color: #6effc2; }
    .is-run { color: #5cecff; }
    .is-warn { color: #ffa94d; }
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 22px;

  &--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

  &__card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 10px;
    border: 1px solid rgba(0, 200, 255, 0.16);
    background: linear-gradient(135deg, rgba(0, 70, 140, 0.28), rgba(2, 20, 48, 0.55));
    cursor: pointer;
    transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s;

    &:hover {
      transform: translateY(-1px);
      border-color: rgba(0, 242, 255, 0.4);
      box-shadow: 0 8px 24px rgba(0, 80, 160, 0.25);
    }
  }

  &__icon { font-size: 28px; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__label { font-size: 20px; color: #8ec8e8; font-weight: 600; letter-spacing: 0.04em; }
  &__value {
    font-size: 36px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    small { font-size: 20px; margin-left: 3px; color: #7fdfff; font-weight: 600; }
    &--ok { color: #6effc2; small { color: #9af5d2; } }
    &--warn { color: #ffa94d; small { color: #ffc78a; } }
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

  &--drill {
    border-color: rgba(255, 210, 90, 0.28);
    background: rgba(40, 28, 8, 0.28);
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
    letter-spacing: 0.03em;
  }

  &__title-icon { font-size: 24px; }

  &__badge {
    margin-left: 8px;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 18px;
    font-weight: 700;
    color: #8ef6ff;
    border: 1px solid rgba(0, 200, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);

    &--warn {
      color: #ffa94d;
      border-color: rgba(255, 170, 60, 0.4);
      background: rgba(160, 90, 20, 0.22);
    }
  }

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

  &__note {
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 80, 160, 0.15);
    border-left: 3px solid rgba(0, 200, 255, 0.35);
    p { margin: 0; font-size: 20px; line-height: 1.6; color: #8eaec8; }
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

    p { margin: 0; font-size: 20px; line-height: 1.6; color: #c6dcf0; strong { color: #ffd56a; font-weight: 800; } }
    &-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }

    &--risk {
      background: rgba(160, 90, 20, 0.18);
      border-color: rgba(255, 170, 60, 0.4);

      p { color: #ffd9a8; }
    }
  }
}

.ledger-meta {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px dashed rgba(0, 200, 255, 0.18);

  &__label { font-size: 16px; color: #8eaec8; flex-shrink: 0; }
  &__value { font-size: 22px; font-weight: 800; color: #eaf7ff; font-variant-numeric: tabular-nums; }
}

.ledger-empty {
  margin: 0;
  font-size: 18px;
  color: #6effc2;
}

.followup-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    font-size: 18px;
    line-height: 1.5;
  }

  &__date {
    flex-shrink: 0;
    color: #5cecff;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    width: 92px;
  }

  &__content { color: #c6dcf0; }
}

.resource-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__item {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
  }

  &__label { font-size: 20px; color: #8ec8e8; font-weight: 600; }
  &__value { font-size: 20px; color: #eaf7ff; font-weight: 700; text-align: right; white-space: nowrap; }
}

.task-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;

  &:last-child {
    margin-bottom: 0;
  }

  &__head {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    border-radius: 8px;
    border: 1px solid rgba(0, 200, 255, 0.2);
    background: linear-gradient(90deg, rgba(0, 90, 160, 0.28), rgba(0, 40, 90, 0.12));

    strong {
      display: block;
      color: #f2fbff;
      font-size: 22px;
      font-weight: 800;
      line-height: 1.2;
    }

    em {
      display: block;
      margin-top: 2px;
      color: #8ec8e8;
      font-size: 15px;
      font-style: normal;
      font-weight: 600;
    }

    > span {
      flex: 0 0 auto;
      color: #66d9ff;
      font-size: 16px;
      font-weight: 700;
      white-space: nowrap;
    }
  }
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.task-tile {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.16);
  background: rgba(0, 40, 90, 0.22);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s;

  &:hover, &.is-active {
    border-color: rgba(0, 242, 255, 0.45);
    transform: translateY(-1px);
  }

  header {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    align-items: flex-start;

    strong { font-size: 20px; color: #eaf7ff; font-weight: 800; }
    span {
      flex-shrink: 0;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 700;
      color: #9fe8ff;
      background: rgba(0, 120, 200, 0.25);
    }
  }

  &__bar {
    height: 8px;
    border-radius: 999px;
    background: rgba(7, 55, 128, 0.55);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1a8cff, #5cecff);
    }
  }

  &--status-completed header span { color: #6effc2; background: rgba(30, 160, 110, 0.25); }
  &--status-delayed header span { color: #ffa94d; background: rgba(160, 90, 20, 0.28); }
  &--status-completed .task-tile__bar i { background: linear-gradient(90deg, #0d7a5c, #6effc2); }
  &--status-delayed .task-tile__bar i { background: linear-gradient(90deg, #e64a19, #ffa94d); }

  footer {
    margin-top: 2px;
  }

  &__fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 14px;
    margin: 0;

    div {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      font-size: 16px;
    }
    dt { margin: 0; color: #8eaec8; flex-shrink: 0; }
    dd { margin: 0; color: #eaf7ff; font-weight: 700; text-align: right; }
    &--full { grid-column: 1 / -1; }
    &--full dd { text-align: left; color: #bfe6ff; }
  }

  &__detail {
    font-size: 16px;
    font-weight: 700;
    color: #5cecff;
  }
}

.filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 18px;
    color: #8ec8e8;
    font-weight: 600;

    select {
      min-height: 42px;
      padding: 6px 12px;
      border-radius: 8px;
      border: 1px solid rgba(102, 217, 255, 0.22);
      background: rgba(4, 14, 38, 0.72);
      color: #eaf7ff;
      font-size: 18px;
    }
  }
}

.filter-reset {
  align-self: end;
  min-height: 42px;
  padding: 0 18px;
  border-radius: 8px;
  border: 1px solid rgba(0, 229, 255, 0.35);
  background: rgba(0, 70, 130, 0.35);
  color: #9fe8ff;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    color: #fff;
    border-color: rgba(0, 242, 255, 0.6);
  }
}

.task-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.task-card {
  padding: 16px 18px;
  border-radius: 10px;
  border: 1px solid rgba(102, 217, 255, 0.14);
  background: rgba(4, 14, 38, 0.55);
  cursor: pointer;
  transition: border-color 0.18s, box-shadow 0.18s;

  &:hover, &.is-active {
    border-color: rgba(0, 242, 255, 0.4);
    box-shadow: 0 0 18px rgba(0, 140, 220, 0.18);
  }

  &--risk {
    border-color: rgba(255, 140, 80, 0.28);
    background: rgba(48, 22, 10, 0.45);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;

    h3 {
      margin: 0;
      font-size: 22px;
      color: #f3f8ff;
      font-weight: 800;

      small {
        display: inline-block;
        margin-right: 8px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 16px;
        color: #9fe8ff;
        background: rgba(0, 120, 200, 0.28);
      }
    }

    span {
      flex-shrink: 0;
      padding: 3px 10px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 700;
    }

    .status-ongoing { color: #5cecff; background: rgba(0, 184, 255, 0.12); }
    .status-completed { color: #6effc2; background: rgba(52, 211, 153, 0.12); }
    .status-delayed { color: #ffa94d; background: rgba(240, 160, 48, 0.12); }
  }

  &__bar {
    height: 8px;
    margin-bottom: 12px;
    border-radius: 999px;
    background: rgba(7, 55, 128, 0.55);
    overflow: hidden;

    i {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: linear-gradient(90deg, #1a8cff, #5cecff);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;

    div {
      display: flex;
      flex-direction: column;
      gap: 4px;

      span { font-size: 16px; color: #8eaec8; }
      strong { font-size: 20px; color: #eaf7ff; font-weight: 800; }
    }
  }

  &__materials,
  &__desc {
    margin: 10px 0 0;
    font-size: 18px;
    line-height: 1.6;
    color: rgba(174, 198, 230, 0.82);
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 10px;
    font-size: 18px;
    color: rgba(174, 198, 230, 0.78);
  }
}

.drill-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;

  .resource-section__title { margin-bottom: 0; }
}

.drill-close {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 210, 90, 0.35);
  background: rgba(120, 80, 20, 0.28);
  color: #ffd56a;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}

.milestone-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;

  li {
    display: grid;
    grid-template-columns: 14px 1fr auto;
    gap: 10px;
    align-items: center;

    i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: rgba(92, 236, 255, 0.35);
      box-shadow: 0 0 8px rgba(92, 236, 255, 0.35);
    }

    span { font-size: 20px; color: #d7e8f8; }
    em { font-style: normal; font-size: 18px; color: #8eaec8; }

    &.is-done {
      i { background: #6effc2; box-shadow: 0 0 8px rgba(110, 255, 194, 0.45); }
      em { color: #6effc2; }
    }
  }
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
    font-size: 22px;
    font-weight: 800;
    color: #eaf7ff;
  }

  p {
    margin: 0;
    font-size: 18px;
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
  font-size: 20px;
  line-height: 1.7;

  li + li { margin-top: 8px; }
}

@media (max-width: 1280px) {
  .resource-summary--5 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .task-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .insight-grid { grid-template-columns: 1fr; }
  .filter-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
