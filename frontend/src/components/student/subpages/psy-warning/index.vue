<script setup lang="ts">
/**
 * 心理预警详情（二级页面）
 * 路由：/student/psy-warning?studentId=xxx
 *
 * 页面结构：
 *  ① 心理状态总览（三栏：指数卡 | 四维雷达 + 异常表 | 风险状态）
 *  ② 心理风险维度分析（情绪 / 人际关系 / 学业压力 / 睡眠 四卡片，人际卡展开关联数据）
 *  ③ 关联行为分析（心理状态趋势折线 | 关联行为记录）
 *  ④ 关注与干预记录（时间轴）
 */
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import StudentDetailLayout from '../_shared/StudentDetailLayout.vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { useScope } from '@/composables/useScope'
import { studentService } from '@/api/student/services'
import type { StudentDashboardVM } from '@/types/student/view'
import type { EChartsOption } from 'echarts'
import { AXIS_LABEL, CHART_COLORS } from '@/styles/echarts-theme'

const route = useRoute()
const router = useRouter()
const { studentScope } = useScope()
const activeStudentId = computed(
  () => (route.query.studentId as string | undefined) || studentScope.value.studentId,
)

const dashboard = ref<StudentDashboardVM | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = null
  try {
    dashboard.value = await studentService.fetchDashboard(activeStudentId.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function goLedger() {
  router.push({ name: 'student-basic-ledger', query: { studentId: activeStudentId.value } })
}

const LEVEL_COLOR: Record<string, string> = { low: '#55e995', medium: '#facc15', high: '#ff7474' }
const levelColor = (level: string) => LEVEL_COLOR[level] || '#8fb7cd'
const riskText = (level: string) =>
  ({ low: '正常', medium: '需关注', high: '高危' }[level] || '—')

const mentalLevel = computed(() => dashboard.value?.profile.mentalLevelCode ?? 'low')

/* ---------- 心理记录（兜底模拟） ---------- */
const mentalRecords = computed(() => {
  const recs = dashboard.value?.mentalGrowth.records ?? []
  if (recs.length) return recs
  return [
    { date: '2024-09-15', content: '新生入学心理测评完成，SCL-90 各因子均在正常范围，未触发预警' },
    { date: '2024-12-20', content: '学期末心理状态复评，整体平稳，睡眠质量略有下降，已建议规律作息' },
    { date: '2025-03-10', content: '春季学期心理普查，焦虑因子轻度波动，辅导员已进行一对一谈话' },
    { date: '2025-06-25', content: '夏季学期心理测评，各项指标回归正常区间，无需额外干预' },
  ]
})

const lastAssessTime = computed(() => {
  const recs = mentalRecords.value
  return recs.length ? recs[recs.length - 1].date : '—'
})

/* ---------- ① 四维健康（情绪 / 人际 / 学业压力 / 睡眠） ---------- */
const psyDims = computed(() => {
  const sets: Record<string, number[]> = {
    high: [42, 38, 68, 50],
    medium: [60, 50, 56, 54],
    low: [82, 45, 60, 75],
  }
  const scores = sets[mentalLevel.value] ?? sets.low
  const names = ['情绪状态', '人际关系', '学业压力', '睡眠状态']
  return names.map((name, i) => {
    const score = scores[i]
    const level = score >= 60 ? 'low' : score >= 45 ? 'medium' : 'high'
    return { name, score, level }
  })
})

const abnormalDims = computed(() => psyDims.value.filter((d) => d.level !== 'low'))

const psyRadarOption = computed<EChartsOption>(() => ({
  tooltip: { trigger: 'item' },
  radar: {
    center: ['50%', '52%'],
    radius: '66%',
    indicator: psyDims.value.map((d) => ({ name: d.name, max: 100 })),
    axisName: { color: '#b8ecff', fontSize: 15 },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
    splitArea: { areaStyle: { color: ['rgba(0, 184, 255, 0.04)', 'rgba(0, 184, 255, 0.08)'] } },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.12)' } },
  },
  series: [{
    type: 'radar',
    data: [{
      value: psyDims.value.map((d) => d.score),
      name: '心理健康',
      symbolSize: 6,
      areaStyle: { color: 'rgba(0, 229, 255, 0.2)' },
      lineStyle: { color: '#00e5ff', width: 2 },
      itemStyle: { color: '#00e5ff' },
    }],
  }],
}))

/* ---------- 心理健康指数 / 趋势 ---------- */
const trend = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') return [58, 62, 68, 72]
  if (code === 'medium') return [48, 52, 50, 54]
  return [35, 32, 30, 28]
})

const mentalIndex = computed(() => {
  const arr = trend.value
  if (!arr.length) return 70
  return Math.max(0, Math.min(100, 100 - arr[arr.length - 1]))
})

const trendSummary = computed(() => {
  const v = trend.value
  if (v.length < 2) return '—'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '风险上升'
  if (d < -4) return '持续改善'
  return '总体平稳'
})

const mentalStatusText = computed(() => {
  const lv = mentalLevel.value
  if (lv === 'high') return '心理状态多项异常，已触发高危预警，须立即介入心理干预。'
  if (lv === 'medium') return '存在心理波动与风险因素，需持续关注并安排心理疏导。'
  return '整体心理状态平稳，保持常规关注即可。'
})

const mentalTrendOption = computed<EChartsOption>(() => {
  const semesters = ['大一上', '大一下', '大二上', '大二下']
  const values = trend.value
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const yMin = Math.max(0, Math.floor((lo - 4) / 5) * 5)
  const yMax = Math.min(100, Math.ceil((hi + 4) / 5) * 5)
  return {
    grid: { top: 16, bottom: 18, left: 4, right: 12 },
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; marker: string; value: number }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const p = arr[0]
        return `${p.axisValue}<br/>${p.marker}心理健康指数：${p.value}`
      },
    },
    xAxis: {
      type: 'category',
      data: semesters,
      boundaryGap: false,
      axisLabel: { ...AXIS_LABEL, fontSize: 13, margin: 6 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLabel: { ...AXIS_LABEL, fontSize: 13 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    series: [{
      name: '心理健康指数',
      type: 'line',
      smooth: true,
      data: values,
      lineStyle: { color: CHART_COLORS.cyan, width: 2.5 },
      itemStyle: { color: CHART_COLORS.cyan },
      symbol: 'circle',
      symbolSize: 7,
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 229, 255, 0.28)' },
            { offset: 1, color: 'rgba(0, 229, 255, 0)' },
          ],
        },
      },
    }],
  }
})

const trendDesc = computed(() => {
  const v = trend.value
  if (v.length < 2) return '暂无足够测评数据判断趋势'
  const d = v[v.length - 1] - v[0]
  if (d > 4) return '指数呈上升趋势，心理状况需重点关注'
  if (d < -4) return '指数持续下降，心理状况逐步改善'
  return '指数总体平稳，波动较小'
})

/* ---------- 危机干预指引（页面底部行动建议） ---------- */
const crisisGuide = computed(() => {
  const lv = mentalLevel.value
  if (lv === 'high') {
    return {
      level: 'high',
      title: '高危干预',
      icon: '🔴',
      text: '建议立即上报学院，启动实时监护。'
    }
  }
  if (lv === 'medium') {
    return {
      level: 'medium',
      title: '重点关注',
      icon: '🟡',
      text: '建议本周内进行一次谈心谈话，重点关注室友关系或家庭关系等。'
    }
  }
  return {
    level: 'low',
    title: '常规关注',
    icon: '🟢',
    text: '心理状态平稳，保持常规关注，定期开展心理健康宣教即可。'
  }
})

/* ---------- ② 人际关系关联数据（卡片展开） ---------- */
const interpersonalDetail = computed(() => {
  const lvl = psyDims.value.find((d) => d.name === '人际关系')?.level
  if (lvl === 'high') return { dormConflict: 3, aloneMeals: 24, social: '极少' }
  if (lvl === 'medium') return { dormConflict: 0, aloneMeals: 18, social: '较少' }
  return { dormConflict: 0, aloneMeals: 6, social: '活跃' }
})

/* 维度卡片点击展开关联数据 */
const expandedDim = ref<string | null>(null)
function toggleDim(name: string) {
  expandedDim.value = expandedDim.value === name ? null : name
}

function dimAssoc(name: string): { label: string; value: string }[] {
  if (name === '人际关系') {
    const it = interpersonalDetail.value
    return [
      { label: '宿舍矛盾记录', value: `${it.dormConflict} 次` },
      { label: '独处就餐', value: `${it.aloneMeals} 次/月` },
      { label: '社交活动', value: it.social },
    ]
  }
  const d = psyDims.value.find((x) => x.name === name)
  const level = d?.level ?? 'low'
  if (name === '情绪状态') {
    return [
      { label: '自评情绪波动', value: level === 'high' ? '明显' : level === 'medium' ? '偶有' : '平稳' },
      { label: '主要表现', value: level === 'high' ? '焦虑 / 低落' : level === 'medium' ? '紧张' : '无明显表现' },
    ]
  }
  if (name === '学业压力') {
    return [
      { label: '压力来源', value: level === 'high' ? '考试 + 就业' : level === 'medium' ? '课业为主' : '较轻' },
      { label: '应对状态', value: level === 'high' ? '需疏导' : '可自我调节' },
    ]
  }
  return [
    { label: '平均睡眠时长', value: level === 'high' ? '< 5h' : level === 'medium' ? '5–6h' : '> 7h' },
    { label: '入睡情况', value: level === 'high' ? '困难' : level === 'medium' ? '偏慢' : '正常' },
  ]
}

/* ---------- ③ 关联行为记录 ---------- */
const behaviorRecords = computed(() => {
  const code = mentalLevel.value
  if (code === 'high') {
    return [
      { name: '宿舍互动', status: '明显减少', level: 'high' },
      { name: '考勤情况', status: '偶发缺勤', level: 'medium' },
      { name: '消费情况', status: '波动较大', level: 'medium' },
      { name: '运动情况', status: '下降', level: 'high' },
    ]
  }
  if (code === 'medium') {
    return [
      { name: '宿舍互动', status: '一般', level: 'medium' },
      { name: '考勤情况', status: '正常', level: 'low' },
      { name: '消费情况', status: '正常', level: 'low' },
      { name: '运动情况', status: '下降', level: 'medium' },
    ]
  }
  return [
    { name: '宿舍互动', status: '正常', level: 'low' },
    { name: '考勤情况', status: '正常', level: 'low' },
    { name: '消费情况', status: '正常', level: 'low' },
    { name: '运动情况', status: '正常', level: 'low' },
  ]
})

/* ---------- ④ 关注与干预记录（时间轴） ---------- */
interface InterventionNode {
  kind: 'record' | 'status'
  date: string
  method: string
  focus: string
  content: string
}

const interventionStages = computed<InterventionNode[]>(() => {
  const recs = mentalRecords.value
  const code = mentalLevel.value
  const methods = ['SCL-90 量表测评', '一对一谈心谈话', '个体心理咨询', '季度心理复评']
  const focuses = ['入学基线筛查', '情绪波动关注', '人际与睡眠问题', '干预效果评估']
  const nodes: InterventionNode[] = recs.map((r, i) => ({
    kind: 'record',
    date: r.date,
    method: methods[i] || '心理访谈',
    focus: focuses[i] || '综合心理状况',
    content: r.content,
  }))
  if (code === 'high') {
    nodes.push({ kind: 'status', date: '—', method: '重点关注', focus: '干预启动', content: '已启动重点关注，辅导员与心理老师联合跟进中' })
    nodes.push({ kind: 'status', date: '—', method: '谈话完成', focus: '干预措施', content: '已完成一对一谈心谈话，建立家校协同关注机制' })
  }
  nodes.push({
    kind: 'status',
    date: lastAssessTime.value,
    method: '当前状态',
    focus: '干预状态',
    content: `当前干预状态：${dashboard.value?.mentalGrowth.supportStatus || riskText(code)}`,
  })
  return nodes
})

onMounted(load)
</script>

<template>
  <StudentDetailLayout
    title="心理预警详情"
    :subtitle="dashboard ? `${dashboard.profile.name} · ${dashboard.profile.studentId}` : ''"
    back-text="← 返回基础信息台账"
    :back-to="{ name: 'student-basic-ledger', query: { studentId: activeStudentId } }"
    mock-badge="模拟数据"
  >
    <div v-if="loading" class="placeholder"><span class="spinner" /> 正在加载...</div>
    <div v-else-if="error" class="placeholder error"><span>{{ error }}</span><button @click="load">重试</button></div>

    <div v-else-if="dashboard" class="psy-warning">
      <!-- ① 心理状态总览 -->
      <section class="warn-section sec-full overview">
        <h3 class="warn-section__title">心理状态总览</h3>
        <div class="overview-2col">
          <!-- 左：指数 -->
          <div class="ov-index">
            <div class="ov-index__num" :style="{ color: levelColor(mentalLevel) }">{{ mentalIndex }}</div>
            <div class="ov-index__label">心理健康指数</div>
            <div class="ov-index__status" :class="`lvl-bg--${mentalLevel}`">{{ riskText(mentalLevel) }}</div>
            <div class="ov-index__meta">
              <div class="ov-index__meta-row"><span>最近评估</span><b>{{ lastAssessTime }}</b></div>
              <div class="ov-index__meta-row">
                <span>变化趋势</span><b :class="`lvl--${mentalLevel}`">↑ {{ trendSummary }}</b>
              </div>
            </div>
          </div>

          <!-- 右：风险分析（等级 + 维度 + 最近异常 合并） -->
          <div class="ov-detail">
            <div class="ov-risk__block">
              <div class="ov-risk__sub">风险维度</div>
              <div class="ov-radar">
                <div class="ov-radar__chart">
                  <ChartContainer :option="psyRadarOption" />
                </div>
                <table class="ov-dim-table">
                  <thead><tr><th>维度</th><th>分数</th><th>状态</th></tr></thead>
                  <tbody>
                    <tr v-for="d in psyDims" :key="d.name" :class="`row--${d.level}`">
                      <td>{{ d.name }}</td>
                      <td class="num">{{ d.score }}</td>
                      <td><span class="dim-badge" :class="`dim-badge--${d.level}`">{{ riskText(d.level) }}</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div class="ov-risk__block">
              <div class="ov-risk__sub">最近异常</div>
              <div v-if="abnormalDims.length" class="ov-risk__recents">
                <span v-for="d in abnormalDims" :key="d.name" class="ov-risk__recent" :class="`lvl-bd--${d.level}`">
                  {{ d.name }} {{ d.score }}
                </span>
              </div>
              <div v-else class="ov-risk__recent ok">暂无</div>
            </div>
          </div>
        </div>
      </section>

      <!-- ② 心理风险维度分析 -->
      <section class="warn-section sec-full">
        <h3 class="warn-section__title">心理风险维度分析</h3>
        <div class="dim-cards">
          <div
            v-for="d in psyDims"
            :key="d.name"
            class="dim-card"
            :class="[`dim-card--${d.level}`, { 'dim-card--open': expandedDim === d.name }]"
            role="button"
            tabindex="0"
            @click="toggleDim(d.name)"
            @keydown.enter.prevent="toggleDim(d.name)"
            @keydown.space.prevent="toggleDim(d.name)"
          >
            <div class="dim-card__name">{{ d.name }}</div>
            <div class="dim-card__score" :style="{ color: levelColor(d.level) }">{{ d.score }}</div>
            <div class="dim-card__status" :class="`lvl--${d.level}`">
              {{ riskText(d.level) }}<span v-if="d.level !== 'low'" class="dim-card__warn">⚠</span>
            </div>
            <div class="dim-card__toggle">
              <span>关联数据</span>
              <span class="dim-card__chev" :class="{ 'is-open': expandedDim === d.name }">▾</span>
            </div>

            <div v-if="expandedDim === d.name" class="dim-card__expand">
              <div class="dim-card__expand-title">关联数据</div>
              <div v-for="row in dimAssoc(d.name)" :key="row.label" class="dim-card__row">
                <span>{{ row.label }}</span><b>{{ row.value }}</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ③ 关联行为分析 -->
      <section class="warn-section sec-full">
        <h3 class="warn-section__title">关联行为分析</h3>
        <div class="behave-2col">
          <div class="behave-col">
            <h4 class="behave-sub">心理状态趋势</h4>
            <div class="trend-wrap"><ChartContainer :option="mentalTrendOption" /></div>
            <div class="trend-desc" :class="`trend-desc--${mentalLevel}`">
              <span class="trend-desc__icon">↗</span><span>{{ trendDesc }}</span>
            </div>
          </div>
          <div class="behave-col">
            <h4 class="behave-sub">关联行为记录</h4>
            <div class="behave-list">
              <div v-for="b in behaviorRecords" :key="b.name" class="behave-item" :class="`row--${b.level}`">
                <span class="behave-item__name">{{ b.name }}</span>
                <span class="behave-item__status" :class="`lvl--${b.level}`">{{ b.status }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ④ 关注与干预记录 -->
      <section class="warn-section sec-full">
        <h3 class="warn-section__title">关注与干预记录</h3>
        <div class="closure">
          <div
            v-for="(node, idx) in interventionStages"
            :key="idx"
            class="closure__item"
            :class="`closure__item--${node.kind}`"
          >
            <div class="closure__dot" />
            <div class="closure__head">
              <span class="closure__label">{{ node.method }}</span>
            </div>
            <div class="closure__time">{{ node.date }}</div>
            <div class="closure__focus">关注问题：{{ node.focus }}</div>
            <div class="closure__content">{{ node.content }}</div>
          </div>
          <div v-if="!interventionStages.length" class="empty-cell">暂无干预记录</div>
        </div>
      </section>

      <!-- ⑤ 危机干预指引 -->
      <section class="warn-section sec-full crisis-guide">
        <h3 class="warn-section__title">危机干预指引</h3>
        <div class="crisis-guide__box" :class="`crisis-guide__box--${crisisGuide.level}`">
          <span class="crisis-guide__icon">{{ crisisGuide.icon }}</span>
          <div class="crisis-guide__main">
            <div class="crisis-guide__head">
              <span class="crisis-guide__tag">{{ crisisGuide.title }}</span>
              <span class="crisis-guide__level" :class="`lvl--${crisisGuide.level}`">{{ riskText(crisisGuide.level) }}</span>
            </div>
            <div class="crisis-guide__text">{{ crisisGuide.text }}</div>
          </div>
        </div>
      </section>

      <div class="footer-actions">
        <button type="button" class="footer-actions__btn" @click="goLedger">返回基础信息台账</button>
      </div>
    </div>
  </StudentDetailLayout>
</template>

<style scoped lang="scss">
.psy-warning {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 10px;
}

.sec-full { grid-column: 1 / -1; }

.warn-section {
  padding: 12px 16px;
  border-radius: 5px;
  min-width: 0;
  background:
    linear-gradient(180deg, rgba(12, 35, 76, 0.5), rgba(5, 17, 45, 0.4)),
    rgba(6, 17, 52, 0.32);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

.warn-section__title {
  margin: 0 0 10px;
  font-size: 16px;
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

/* 通用等级色（文字） */
.lvl--low { color: #55e995; }
.lvl--medium { color: #facc15; }
.lvl--high { color: #ff7474; }

/* 等级底色块（圆点 / 状态胶囊） */
.lvl-bg--low { background: #55e995; }
.lvl-bg--medium { background: #facc15; }
.lvl-bg--high { background: #ff7474; }

/* ---------- ① 两栏总览（左指数 / 右风险分析） ---------- */
.overview-2col {
  display: grid;
  grid-template-columns: 1fr 2.2fr;
  gap: 14px;
  align-items: stretch;
}

.ov-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 14px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.1);
}

/* 左：指数卡 */
.ov-index {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 12px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__num {
    font-size: 46px;
    font-weight: 900;
    line-height: 1;
    color: #f6fbff;
  }
  &__label {
    font-size: 14px;
    color: #7eb4d8;
    font-weight: 600;
  }
  &__status {
    margin-top: 4px;
    padding: 3px 14px;
    border-radius: 999px;
    font-size: 14px;
    font-weight: 800;
    color: #06122e;
  }
  &__meta {
    margin-top: 12px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  &__meta-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    color: #7eb4d8;
    border-top: 1px dashed rgba(102, 217, 255, 0.12);
    padding-top: 6px;

    b { color: #d0e8f8; font-weight: 700; }
  }
}

/* 中：雷达 + 表 */
.ov-radar {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
  align-items: center;
}
.ov-radar__chart {
  height: 240px;
  :deep(.chart-container) { height: 240px; }
}
.ov-dim-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 15px;

  th {
    text-align: left;
    padding: 8px 10px;
    font-size: 14px;
    font-weight: 700;
    color: #9ecae8;
    border-bottom: 1px solid rgba(102, 217, 255, 0.12);
  }
  td {
    padding: 8px 10px;
    border-bottom: 1px solid rgba(102, 217, 255, 0.05);
    color: #d0e8f8;
  }
  .num { font-weight: 800; font-variant-numeric: tabular-nums; color: #f6fbff; }
  .row--low td:first-child { border-left: 2px solid rgba(74, 222, 128, 0.5); }
  .row--medium td:first-child { border-left: 2px solid rgba(250, 204, 21, 0.5); }
  .row--high td:first-child { border-left: 2px solid rgba(248, 91, 91, 0.5); }

  .dim-badge {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 700;
    &--low { background: rgba(74, 222, 128, 0.12); color: #55e995; }
    &--medium { background: rgba(250, 204, 21, 0.12); color: #facc15; }
    &--high { background: rgba(248, 91, 91, 0.12); color: #ff7474; }
  }
}

/* 右：风险状态 */
.ov-risk {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.1);

  &__level {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  &__dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  }
  &__title { font-size: 13px; color: #7eb4d8; font-weight: 600; }
  &__state { font-size: 22px; font-weight: 900; }

  &__block { display: flex; flex-direction: column; gap: 6px; }
  &__sub {
    font-size: 13px;
    color: #9ecae8;
    font-weight: 700;
    padding-bottom: 2px;
    border-bottom: 1px dashed rgba(102, 217, 255, 0.12);
  }
  &__dims { display: flex; flex-direction: column; gap: 4px; }
  &__dim {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 9px;
    border-radius: 3px;
    font-size: 13px;
    background: rgba(0, 38, 73, 0.35);
    border-left: 2px solid transparent;
    b { font-weight: 800; }
    &.row--low { border-color: rgba(74, 222, 128, 0.5); }
    &.row--medium { border-color: rgba(250, 204, 21, 0.5); }
    &.row--high { border-color: rgba(248, 91, 91, 0.5); }
  }

  &__recents { display: flex; flex-wrap: wrap; gap: 6px; }
  &__recent {
    font-size: 12px;
    font-weight: 700;
    padding: 3px 10px;
    border-radius: 999px;
    color: #06122e;
    &.lvl-bd--low { background: #55e995; }
    &.lvl-bd--medium { background: #facc15; }
    &.lvl-bd--high { background: #ff7474; color: #fff; }
    &.ok { background: rgba(85, 233, 149, 0.14); color: #55e995; }
  }
  &__recent.ok { background: rgba(85, 233, 149, 0.14); color: #55e995; }
}

/* ---------- ② 维度卡片 ---------- */
.dim-cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.dim-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.1);
  border-top: 3px solid #65dfff;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  outline: none;

  &:hover { background: rgba(0, 38, 73, 0.55); }
  &:focus-visible { border-color: rgba(0, 229, 255, 0.6); }
  &--open { background: rgba(0, 38, 73, 0.6); }

  &--low { border-top-color: #55e995; }
  &--medium { border-top-color: #facc15; }
  &--high { border-top-color: #ff7474; }

  &__name { font-size: 14px; color: #b8ecff; font-weight: 700; }
  &__score { font-size: 30px; font-weight: 900; color: #f6fbff; line-height: 1.1; }
  &__status { font-size: 13px; font-weight: 800; }
  &__warn { margin-left: 3px; }
  &__toggle {
    margin-top: 2px;
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 12px;
    color: #7eb4d8;
  }
  &__chev {
    font-size: 13px;
    transition: transform 0.2s, color 0.2s;
    &.is-open { transform: rotate(180deg); color: #8ef6ff; }
  }

  &__expand {
    width: 100%;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed rgba(102, 217, 255, 0.15);
  }
  &__expand-title {
    font-size: 12px;
    color: #9ecae8;
    font-weight: 700;
    margin-bottom: 5px;
  }
  &__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #9ecae8;
    padding: 3px 0;
    span { white-space: nowrap; }
    b { color: #d0e8f8; font-weight: 700; white-space: nowrap; }
  }
}

/* ---------- ③ 关联行为 ---------- */
.behave-2col {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}
.behave-sub {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 700;
  color: #9ecae8;
}
.trend-wrap {
  height: 160px;
  :deep(.chart-container) { height: 160px; }
}
.trend-desc {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  border-radius: 3px;
  background: rgba(0, 38, 73, 0.3);
  font-size: 14px;
  color: #d0e8f8;
  &__icon { font-size: 16px; font-weight: 900; }
  &--low &__icon { color: #55e995; }
  &--medium &__icon { color: #facc15; }
  &--high &__icon { color: #ff7474; }
}
.behave-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.behave-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 14px;
  border-radius: 4px;
  background: rgba(0, 38, 73, 0.35);
  border-left: 3px solid #65dfff;
  &.row--low { border-color: #55e995; }
  &.row--medium { border-color: #facc15; }
  &.row--high { border-color: #ff7474; }

  &__name { font-size: 14px; color: #d0e8f8; font-weight: 600; }
  &__status { font-size: 14px; font-weight: 800; }
}

/* ---------- ④ 干预时间轴（横向） ---------- */
.closure {
  position: relative;
  display: flex;
  gap: 10px;
  padding-top: 30px;
  overflow-x: auto;

  &::before {
    content: '';
    position: absolute;
    left: 18px;
    right: 18px;
    top: 44px;
    height: 2px;
    background: rgba(0, 184, 255, 0.18);
  }

  &__item {
    position: relative;
    flex: 1 1 0;
    min-width: 200px;
    display: flex;
    flex-direction: column;
    gap: 5px;
    padding: 14px 14px 12px;
    border-radius: 5px;
    background: rgba(0, 38, 73, 0.35);
    border: 1px solid rgba(102, 217, 255, 0.1);
  }
  &__dot {
    position: absolute;
    top: 8px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.55);
  }
  &__item--record &__dot { background: #00d4ff; }
  &__item--status &__dot { background: #34d399; }

  &__head {
    margin-top: 10px;
    display: flex;
    align-items: center;
  }
  &__label { font-size: 14px; font-weight: 800; color: #f6fbff; }
  &__time { font-size: 12px; color: #7eb4d8; font-weight: 700; }
  &__focus { font-size: 13px; color: #8ef6ff; font-weight: 700; }
  &__content { font-size: 13.5px; color: #d0e8f8; line-height: 1.5; }
}

.empty-cell {
  padding: 16px;
  text-align: center;
  color: #5a7d96;
  font-size: 14px;
}

/* ---------- ⑤ 危机干预指引 ---------- */
.crisis-guide__box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border-radius: 5px;
  background: rgba(0, 38, 73, 0.4);
  border: 1px solid rgba(102, 217, 255, 0.12);
  border-left: 4px solid #65dfff;

  &--high { border-color: #ff7474; background: rgba(255, 116, 116, 0.08); }
  &--medium { border-color: #facc15; background: rgba(250, 204, 21, 0.06); }
  &--low { border-color: #55e995; background: rgba(85, 233, 149, 0.06); }
}
.crisis-guide__icon {
  flex-shrink: 0;
  font-size: 28px;
  line-height: 1;
}
.crisis-guide__main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.crisis-guide__head { display: flex; align-items: center; gap: 10px; }
.crisis-guide__tag {
  font-size: 14px;
  font-weight: 800;
  color: #f6fbff;
}
.crisis-guide__level { font-size: 13px; font-weight: 800; }
.crisis-guide__text {
  font-size: 14.5px;
  line-height: 1.6;
  color: #d6ecff;
}

/* Footer */
.footer-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
  padding: 6px 0 12px;

  &__btn {
    padding: 7px 18px;
    border-radius: 4px;
    border: 1px solid rgba(0, 184, 255, 0.35);
    background: rgba(0, 184, 255, 0.1);
    color: #8ef6ff;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    &:hover { background: rgba(0, 184, 255, 0.18); border-color: rgba(0, 184, 255, 0.6); }
  }
}

/* Placeholder */
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
    cursor: pointer;
    font-size: 15px;
    color: #55dfff;
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

@media (max-width: 1080px) {
  .psy-warning { grid-template-columns: 1fr; }
  .overview-2col { grid-template-columns: 1fr; }
  .ov-radar { grid-template-columns: 1fr; }
  .dim-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .behave-2col { grid-template-columns: 1fr; }
}
</style>
