<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CollegeDetailLayout from '@/components/college/CollegeDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { benchmarkService } from '@/api/college/services/benchmark'
import { useScope } from '@/composables/useScope'
import { ROUTES } from '@/constants/routes'
import { AXIS_LABEL, CHART_FONT } from '@/styles/echarts-theme'
import type { AchievementCategory } from '@/types/college/api/benchmark-achievements'
import type { BenchmarkAchievementsDetailVM } from '@/types/college/view/benchmark-achievements'
import type { EChartsOption } from 'echarts'

const route = useRoute()
const router = useRouter()
const { collegeScope } = useScope()

const data = ref<BenchmarkAchievementsDetailVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

type TabKey = 'overview' | 'roster' | 'highlights' | 'insights'
const TAB_KEYS: TabKey[] = ['overview', 'roster', 'highlights', 'insights']
type FilterKey = 'all' | AchievementCategory

const currentTab = ref<TabKey>('overview')
const tabBarRef = ref<HTMLElement | null>(null)
const activeSection = ref('')
const filter = ref<FilterKey>('all')
const selectedId = ref('')

function getDetailScroller() {
  const root = tabBarRef.value?.closest<HTMLElement>('.college-detail')
  return root?.querySelector<HTMLElement>('.college-detail__body') ?? null
}

function resolveFilter(raw?: string | null): FilterKey {
  const allowed: FilterKey[] = [
    'all',
    'teaching',
    'research',
    'competition',
    'platform',
    'faculty',
    'social',
  ]
  if (raw && (allowed as string[]).includes(raw)) return raw as FilterKey
  return 'all'
}

function switchTab(tab: TabKey, options?: { filter?: string; replaceQuery?: boolean }) {
  currentTab.value = tab
  activeSection.value = ''
  if (options?.filter != null) filter.value = resolveFilter(options.filter)
  if (options?.replaceQuery !== false) {
    const query: Record<string, string> = { tab }
    if (filter.value !== 'all') query.filter = filter.value
    router.replace({ path: ROUTES.college.benchmarkDetail, query })
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

function setFilter(next: FilterKey) {
  filter.value = next
  selectedId.value = ''
  if (currentTab.value === 'roster') {
    router.replace({
      path: ROUTES.college.benchmarkDetail,
      query: { tab: 'roster', ...(next !== 'all' ? { filter: next } : {}) },
    })
  }
}

const filteredAchievements = computed(() => {
  if (!data.value) return []
  if (filter.value === 'all') return data.value.achievements
  return data.value.achievements.filter((item) => item.category === filter.value)
})

const selectedItem = computed(() =>
  data.value?.achievements.find((i) => i.id === selectedId.value) ?? null,
)

function openItem(id: string) {
  selectedId.value = selectedId.value === id ? '' : id
  nextTick(() => {
    document.getElementById('bm-item-drill')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  })
}

function onCategoryChartClick(params: unknown) {
  const name = (params as { name?: string })?.name
  if (!name || !data.value) return
  const hit = data.value.byCategory.find((c) => c.label === name)
  if (hit) {
    filter.value = hit.category
    switchTab('roster', { filter: hit.category })
  }
}

const insights = computed(() => {
  if (!data.value) return []
  const topCat = [...data.value.byCategory].sort((a, b) => b.count - a.count)[0]
  const national = data.value.byLevel.find((l) => l.level.includes('国家'))?.count ?? 0
  const milestone = data.value.milestones[0]
  return [
    {
      title: '标志性突破可复制',
      detail: milestone
        ? `「${milestone.title}」被标注为${milestone.badge}：${milestone.interpretation}。建议沉淀申报路径与材料模板。`
        : '年度里程碑成果具备示范价值。',
      tone: 'good' as const,
    },
    {
      title: topCat ? `${topCat.label}贡献最大` : '类别结构清晰',
      detail: topCat
        ? `${topCat.label}占 ${topCat.count} 项，是成果矩阵主阵地；可继续向国家级/省部级跃迁。`
        : '各成果类别分布可支撑分类施策。',
      tone: 'info' as const,
    },
    {
      title: '高能级成果仍需加码',
      detail: `国家级成果约 ${national} 项，国省部级合计 ${data.value.summary.nationalProvincial} 项；竞赛金奖/特等奖 ${data.value.competitions.goldOrSpecial} 项，可与育人高光联动。`,
      tone: national >= 10 ? ('info' as const) : ('warn' as const),
    },
  ]
})

const actions = computed(() => [
  '把「历史突破」类里程碑拆成可复用的申报清单与节点日历',
  '对科研成果中的省部级项目组织冲国自然/重点专项工作坊',
  '竞赛金奖团队与一流课程、平台建设交叉赋能，形成育人闭环',
])

const categoryBarOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const items = [...data.value.byCategory].reverse()
  return {
    grid: { left: 8, right: 36, top: 8, bottom: 4, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: 'rgba(2,14,38,0.94)',
      borderColor: 'rgba(0,242,255,0.5)',
      textStyle: { color: '#f4fbff', fontSize: 18 },
      formatter: (params: unknown) => {
        const row = Array.isArray(params) ? params[0] : params
        const item = row as { name?: string; value?: number }
        return `${item.name ?? ''}<br/>${item.value ?? 0} 项<br/><span style="color:#9fe8ff">点击查看清单</span>`
      },
    },
    xAxis: { type: 'value', axisLabel: { show: false }, splitLine: { show: false } },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.label),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 16 },
      axisLine: { show: false },
      axisTick: { show: false },
      triggerEvent: true,
    },
    series: [{
      type: 'bar',
      cursor: 'pointer',
      barWidth: 14,
      data: items.map((i) => ({
        value: i.count,
        name: i.label,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#1a8cff' },
              { offset: 1, color: '#5cecff' },
            ],
          },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '{c}' },
    }],
  }
})

const levelBarOption = computed<EChartsOption>(() => {
  if (!data.value) return {}
  const items = [...data.value.byLevel].reverse()
  const maxVal = Math.max(...items.map((i) => i.count), 1)
  return {
    grid: { left: 8, right: 36, top: 8, bottom: 4, containLabel: true },
    xAxis: {
      type: 'value',
      max: Math.ceil(maxVal * 1.2),
      axisLabel: { ...AXIS_LABEL, color: '#9ecae8' },
      splitLine: { lineStyle: { color: 'rgba(57,230,255,0.08)' } },
    },
    yAxis: {
      type: 'category',
      data: items.map((i) => i.level),
      axisLabel: { ...AXIS_LABEL, color: '#c6e6ff', fontSize: 16 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barWidth: 14,
      data: items.map((i) => ({
        value: i.count,
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: i.level.includes('国家')
            ? { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#f0a020' }, { offset: 1, color: '#ffd56a' }] }
            : { type: 'linear', x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: '#126dff' }, { offset: 1, color: '#65f7ff' }] },
        },
      })),
      label: { show: true, position: 'right', color: '#eaf7ff', fontSize: CHART_FONT.label, formatter: '{c}' },
    }],
  }
})

function applyRouteQuery() {
  const tab = String(route.query.tab ?? '')
  if (TAB_KEYS.includes(tab as TabKey)) currentTab.value = tab as TabKey
  const f = String(route.query.filter ?? route.query.id ?? '')
  if (f) {
    filter.value = resolveFilter(f)
    if (!tab && f !== 'all') currentTab.value = 'roster'
  }
}

onMounted(async () => {
  loading.value = true
  error.value = null
  try {
    data.value = await benchmarkService.fetchBenchmarkDetail(collegeScope.value)
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
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'overview' }" @click="switchTab('overview')">📋 成果总览</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'roster' }" @click="switchTab('roster')">🗂️ 成果清单</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'highlights' }" @click="switchTab('highlights')">✨ 亮点专栏</button>
        <button type="button" class="tab-btn" :class="{ 'tab-btn--active': currentTab === 'insights' }" @click="switchTab('insights')">🔍 深度挖掘</button>
      </div>
    </template>

    <div v-if="loading" class="detail-placeholder">加载中...</div>
    <div v-else-if="error" class="detail-placeholder detail-error">{{ error }}</div>
    <template v-else-if="data">
      <!-- ===================== 成果总览 ===================== -->
      <template v-if="currentTab === 'overview'">
        <div class="resource-summary resource-summary--6">
          <div class="resource-summary__card" @click="switchTab('roster')">
            <span class="resource-summary__icon">🏅</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">年度荣誉</span>
              <strong class="resource-summary__value">{{ data.summary.annualHonors }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('roster', { filter: 'competition' })">
            <span class="resource-summary__icon">🏆</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">竞赛获奖</span>
              <strong class="resource-summary__value">{{ data.summary.competitionAwards }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('roster', { filter: 'research' })">
            <span class="resource-summary__icon">📄</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">科研成果</span>
              <strong class="resource-summary__value">{{ data.summary.researchOutputs }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="scrollToSection('bm-level')">
            <span class="resource-summary__icon">⭐</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">国省部级</span>
              <strong class="resource-summary__value resource-summary__value--gold">{{ data.summary.nationalProvincial }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('roster', { filter: 'platform' })">
            <span class="resource-summary__icon">🏛️</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">平台成果</span>
              <strong class="resource-summary__value">{{ data.summary.platformOutputs }}<small>项</small></strong>
            </div>
          </div>
          <div class="resource-summary__card" @click="switchTab('roster', { filter: 'faculty' })">
            <span class="resource-summary__icon">👨‍🏫</span>
            <div class="resource-summary__info">
              <span class="resource-summary__label">师资成果</span>
              <strong class="resource-summary__value">{{ data.summary.facultyAchievements }}<small>项</small></strong>
            </div>
          </div>
        </div>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">✨</span>年度里程碑</h2>
          <p class="resource-section__desc">{{ data.subtitle }} · 点击可进入亮点专栏查看解读。</p>
          <div class="milestone-grid">
            <button
              v-for="item in data.milestones"
              :key="item.id"
              type="button"
              class="milestone-card"
              @click="switchTab('highlights')"
            >
              <em>{{ item.badge }}</em>
              <strong>{{ item.title }}</strong>
              <span>{{ item.interpretation }}</span>
              <b v-if="item.yearLabel">{{ item.yearLabel }}</b>
            </button>
          </div>
        </section>

        <section id="bm-level" class="resource-section" :class="{ 'resource-section--active': activeSection === 'bm-level' }">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📊</span>
            结构分布
            <em class="resource-section__hint">点击类别柱条下钻清单</em>
          </h2>
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>成果类别分布</h3>
              <div class="resource-card__chart"><ChartContainer :option="categoryBarOption" @chart-click="onCategoryChartClick" /></div>
            </div>
            <div class="resource-card">
              <h3>成果级别分布</h3>
              <div class="resource-card__chart"><ChartContainer :option="levelBarOption" /></div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 成果清单 ===================== -->
      <template v-else-if="currentTab === 'roster'">
        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">🗂️</span>
            代表性成果清单
            <span class="resource-section__badge">{{ filteredAchievements.length }} 项</span>
          </h2>
          <div class="dim-tabs">
            <button type="button" class="dim-tab" :class="{ 'dim-tab--active': filter === 'all' }" @click="setFilter('all')">全部</button>
            <button
              v-for="item in data.byCategory"
              :key="item.category"
              type="button"
              class="dim-tab"
              :class="{ 'dim-tab--active': filter === item.category }"
              @click="setFilter(item.category)"
            >
              {{ item.label }}
            </button>
          </div>

          <div class="ach-list">
            <button
              v-for="item in filteredAchievements"
              :key="item.id"
              type="button"
              class="ach-item"
              :class="{ 'is-active': selectedId === item.id }"
              @click="openItem(item.id)"
            >
              <div class="ach-item__main">
                <strong>{{ item.title }}</strong>
                <span>{{ item.categoryLabel }} · {{ item.level }}</span>
              </div>
              <div class="ach-item__meta">
                <em>{{ item.date }}</em>
                <b>{{ item.leader || '—' }}</b>
              </div>
            </button>
          </div>
        </section>

        <section
          v-if="selectedItem"
          id="bm-item-drill"
          class="resource-section resource-section--drill"
        >
          <div class="drill-head">
            <h2 class="resource-section__title">
              <span class="resource-section__title-icon">🔎</span>
              下钻详情
            </h2>
            <button type="button" class="drill-close" @click="selectedId = ''">收起</button>
          </div>
          <div class="resource-card">
            <h3>{{ selectedItem.title }}</h3>
            <ul class="kv-grid">
              <li><span>类别</span><strong>{{ selectedItem.categoryLabel }}</strong></li>
              <li><span>级别</span><strong>{{ selectedItem.level }}</strong></li>
              <li><span>时间</span><strong>{{ selectedItem.date }}</strong></li>
              <li><span>负责人</span><strong>{{ selectedItem.leader || '—' }}</strong></li>
            </ul>
          </div>
        </section>
      </template>

      <!-- ===================== 亮点专栏 ===================== -->
      <template v-else-if="currentTab === 'highlights'">
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">✨</span>里程碑解读</h2>
          <div class="milestone-grid">
            <article v-for="item in data.milestones" :key="`h-${item.id}`" class="milestone-card milestone-card--static">
              <em>{{ item.badge }}</em>
              <strong>{{ item.title }}</strong>
              <span>{{ item.interpretation }}</span>
              <b v-if="item.yearLabel">{{ item.yearLabel }}</b>
            </article>
          </div>
        </section>

        <section class="resource-section">
          <div class="resource-section__grid resource-section__grid--2">
            <div class="resource-card">
              <h3>高层次人才</h3>
              <div class="stat-line">
                <strong>{{ data.facultyLeaders.total }}</strong>
                <span>人 · 国家 {{ data.facultyLeaders.national }} / 省级 {{ data.facultyLeaders.provincial }}</span>
              </div>
              <ul class="rank-list">
                <li v-for="(p, idx) in data.facultyLeaders.roster" :key="`${p.name}-${idx}`">
                  <span>{{ p.name }}</span>
                  <strong>{{ p.honor }}</strong>
                </li>
              </ul>
            </div>
            <div class="resource-card">
              <h3>重点项目与论文</h3>
              <ul class="kv-grid">
                <li><span>国家级项目</span><strong>{{ data.keyProjects.national }} 项</strong></li>
                <li><span>省部级项目</span><strong>{{ data.keyProjects.provincial }} 项</strong></li>
                <li><span>到账经费</span><strong>{{ data.keyProjects.fundingWan.toLocaleString('zh-CN') }} 万</strong></li>
                <li><span>高水平论文</span><strong>{{ data.topPapers.count }} 篇</strong></li>
                <li><span>他引</span><strong>{{ data.topPapers.citations }}</strong></li>
                <li><span>代表期刊</span><strong>{{ data.topPapers.journals.join(' · ') }}</strong></li>
              </ul>
            </div>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🏆</span>竞赛高光</h2>
          <div class="resource-summary resource-summary--2">
            <div class="resource-summary__card" @click="switchTab('roster', { filter: 'competition' })">
              <span class="resource-summary__icon">🥇</span>
              <div class="resource-summary__info">
                <span class="resource-summary__label">A 类国奖</span>
                <strong class="resource-summary__value">{{ data.competitions.nationalAwards }}<small>项</small></strong>
              </div>
            </div>
            <div class="resource-summary__card" @click="switchTab('roster', { filter: 'competition' })">
              <span class="resource-summary__icon">🌟</span>
              <div class="resource-summary__info">
                <span class="resource-summary__label">特等 / 金奖</span>
                <strong class="resource-summary__value resource-summary__value--gold">{{ data.competitions.goldOrSpecial }}<small>项</small></strong>
              </div>
            </div>
          </div>
        </section>
      </template>

      <!-- ===================== 深度挖掘 ===================== -->
      <template v-else-if="currentTab === 'insights'">
        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">🔍</span>深度挖掘 · 精品成果</h2>
          <p class="resource-section__desc">从结构、能级与里程碑三条线提炼结论，并给出可落地的建设动作。</p>
          <div class="insight-grid">
            <article v-for="item in insights" :key="item.title" class="insight-card" :class="`insight-card--${item.tone}`">
              <h4>{{ item.title }}</h4>
              <p>{{ item.detail }}</p>
            </article>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title"><span class="resource-section__title-icon">✅</span>建议动作</h2>
          <div class="resource-card">
            <ol class="action-list">
              <li v-for="(action, idx) in actions" :key="idx">{{ action }}</li>
            </ol>
          </div>
        </section>

        <section class="resource-section">
          <h2 class="resource-section__title">
            <span class="resource-section__title-icon">📉</span>
            类别结构下钻
            <em class="resource-section__hint">点击柱条</em>
          </h2>
          <div class="resource-card">
            <div class="resource-card__chart resource-card__chart--lg"><ChartContainer :option="categoryBarOption" @chart-click="onCategoryChartClick" /></div>
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
  border-radius: 8px;
  border: 1px solid rgba(0, 242, 255, 0.18);
  overflow: hidden;
  width: fit-content;
  max-width: 100%;

  &--header {
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
  gap: 12px;
  margin-bottom: 22px;

  &--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  &--6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }

  &__card {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 12px;
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

  &__icon { font-size: 26px; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  &__label { font-size: 16px; color: #8ec8e8; font-weight: 600; }
  &__value {
    font-size: 30px;
    font-weight: 900;
    color: #5cecff;
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
    small { font-size: 16px; margin-left: 2px; color: #7fdfff; }
    &--gold { color: #ffd56a; small { color: #ffc978; } }
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
  }

  &__title-icon { font-size: 24px; }
  &__badge {
    margin-left: 4px;
    padding: 3px 12px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    color: #8ef6ff;
    border: 1px solid rgba(0, 200, 255, 0.3);
    background: rgba(0, 100, 200, 0.2);
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
    height: 260px;
    &--lg { height: 340px; }
  }
}

.milestone-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.milestone-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border-radius: 10px;
  border: 1px solid rgba(255, 210, 90, 0.22);
  background: linear-gradient(160deg, rgba(90, 60, 10, 0.28), rgba(2, 18, 48, 0.5));
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.18s, transform 0.18s;

  &:hover:not(.milestone-card--static) {
    border-color: rgba(255, 210, 90, 0.5);
    transform: translateY(-1px);
  }

  &--static { cursor: default; }

  em {
    align-self: flex-start;
    font-style: normal;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    color: #ffd56a;
    background: rgba(200, 140, 30, 0.25);
  }

  strong { font-size: 20px; color: #eaf7ff; line-height: 1.35; }
  span { font-size: 16px; color: #9fb6d2; line-height: 1.55; }
  b { margin-top: auto; font-size: 15px; color: #7fdfff; font-weight: 700; }
}

.dim-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.dim-tab {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid rgba(0, 200, 255, 0.22);
  background: rgba(0, 40, 90, 0.3);
  color: #9ecae8;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;

  &--active {
    color: #eaf7ff;
    border-color: rgba(0, 242, 255, 0.5);
    background: linear-gradient(180deg, rgba(0, 140, 220, 0.35), rgba(0, 70, 140, 0.3));
  }
}

.ach-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ach-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid rgba(0, 200, 255, 0.14);
  background: rgba(0, 40, 90, 0.22);
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.18s;

  &:hover, &.is-active {
    border-color: rgba(0, 242, 255, 0.45);
  }

  &__main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;

    strong { font-size: 18px; color: #eaf7ff; }
    span { font-size: 15px; color: #8eaec8; }
  }

  &__meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    flex-shrink: 0;

    em { font-style: normal; font-size: 15px; color: #7fdfff; }
    b { font-size: 16px; color: #c6dcf0; font-weight: 700; }
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
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
}

.kv-grid {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    background: rgba(0, 40, 90, 0.22);
    border: 1px solid rgba(0, 200, 255, 0.12);

    span { font-size: 16px; color: #8ec8e8; font-weight: 600; }
    strong { font-size: 17px; color: #eaf7ff; text-align: right; font-weight: 800; }
  }
}

.stat-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;

  strong { font-size: 36px; color: #ffd56a; font-weight: 900; }
  span { font-size: 16px; color: #8eaec8; }
}

.rank-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow: auto;

  li {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    background: rgba(0, 40, 90, 0.22);

    span { font-size: 17px; color: #c6dcf0; }
    strong { font-size: 16px; color: #5cecff; font-weight: 800; }
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

@media (max-width: 1400px) {
  .resource-summary--6 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 1100px) {
  .resource-summary--6,
  .resource-summary--2,
  .milestone-grid,
  .insight-grid,
  .resource-section__grid--2,
  .kv-grid { grid-template-columns: 1fr; }
}
</style>
