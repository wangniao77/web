<script setup lang="ts">
/**
 * 课程难度适应分析（融合气泡图）
 * 横轴 = 课程类别（分类）
 * 纵轴 = 成绩表现
 * 点大小 = 课程难度
 * 颜色 = 风险（红=高风险 / 黄=中风险 / 绿=低风险）
 * 每个点代表一门课程。
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_FONT, AXIS_LABEL } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CourseCategory } from '../../_shared/gpa-data'
import { CATEGORY_LABEL } from '../../_shared/gpa-data'
import type { CoursePoint } from './DifficultyScatter.vue'
import ChartCard from './ChartCard.vue'

type RiskLevel = 'high' | 'medium' | 'low'
const RISK_COLOR: Record<RiskLevel, string> = {
  high: '#f87171',
  medium: '#f0c040',
  low: '#34d399',
}
const RISK_LABEL: Record<RiskLevel, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险',
}

const props = defineProps<{ points: CoursePoint[] }>()

const CAT_ORDER: CourseCategory[] = [
  'general', 'major-base', 'major-core', 'elective', 'humanity', 'art', 'practice',
]

function riskOf(p: CoursePoint): RiskLevel {
  if (p.score < 60) return 'high'
  // 高难度课程却未取得良好（<75），视为适应不足的高风险
  if (p.score < 75 && p.difficulty >= 65) return 'high'
  if (p.score < 75) return 'medium'
  // 高难度课程仅达良好（75-79），需持续关注
  if (p.difficulty >= 65 && p.score < 80) return 'medium'
  return 'low'
}

// 难度(约 20~98) → 气泡直径(px)
function sizeOf(d: number): number {
  return Math.round(12 + ((Math.max(20, Math.min(98, d)) - 20) / 78) * 28)
}

const categories = computed(() => {
  const present = new Set(props.points.map((p) => p.category))
  return CAT_ORDER.filter((c) => present.has(c)).map((c) => CATEGORY_LABEL[c])
})

interface BubbleDatum {
  value: [string, number]
  symbolSize: number
  name: string
  risk: RiskLevel
  p: CoursePoint
}

function toData(level: RiskLevel): BubbleDatum[] {
  return props.points
    .filter((p) => riskOf(p) === level)
    .map((p) => ({
      value: [p.categoryLabel, p.score] as [string, number],
      symbolSize: sizeOf(p.difficulty),
      name: p.name,
      risk: level,
      p,
    }))
}

const series = computed(() =>
  (['high', 'medium', 'low'] as RiskLevel[]).map((level) => ({
    name: RISK_LABEL[level],
    type: 'scatter' as const,
    symbolSize: 14,
    itemStyle: {
      color: RISK_COLOR[level],
      opacity: 0.82,
      borderColor: 'rgba(255,255,255,0.55)',
      borderWidth: 0.6,
    },
    emphasis: { scale: 1.35, itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 1.5 } },
    data: toData(level),
  })),
)

const option = computed<EChartsOption>(() => ({
  grid: { left: 8, right: 18, top: 40, bottom: 26, containLabel: true },
  tooltip: {
    trigger: 'item',
    confine: true,
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    textStyle: { color: '#e2edff', fontSize: 13 },
    formatter: (p: unknown) => {
      const it = p as { data: BubbleDatum }
      const c = it.data.p
      const color = RISK_COLOR[it.data.risk]
      return `<div style="line-height:1.6">
        <b style="color:#8ef6ff">${c.name}</b><br/>
        课程类别：${c.categoryLabel}<br/>
        成绩：<b style="color:${c.score < 75 ? '#f87171' : '#f0c040'}">${c.score}</b> 分<br/>
        课程难度：${c.difficulty}（气泡越大越难）<br/>
        风险：<b style="color:${color}">${RISK_LABEL[it.data.risk]}</b>
      </div>`
    },
  },
  legend: {
    top: 4,
    left: 0,
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 14,
    icon: 'circle',
    textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend - 2 },
    data: (['high', 'medium', 'low'] as RiskLevel[]).map((l) => RISK_LABEL[l]),
  },
  xAxis: {
    type: 'category',
    data: categories.value,
    name: '课程类别',
    nameLocation: 'middle',
    nameGap: 28,
    nameTextStyle: { color: '#7fb4d4', fontSize: 12 },
    axisTick: { show: false },
    axisLabel: { ...AXIS_LABEL, fontSize: 12, color: '#cfe8ff' },
    axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.18)' } },
    splitLine: { show: false },
  },
  yAxis: {
    type: 'value',
    name: '成绩',
    min: 40,
    max: 100,
    interval: 10,
    nameTextStyle: { color: '#7fb4d4', fontSize: 12 },
    axisLabel: { ...AXIS_LABEL, fontSize: 12, color: '#9ec7e0' },
    splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
  },
  series: series.value,
}))

const insight = computed(() => {
  const total = props.points.length
  if (!total) return '暂无课程成绩数据'
  const high = props.points.filter((p) => riskOf(p) === 'high').length
  const medium = props.points.filter((p) => riskOf(p) === 'medium').length
  const low = props.points.filter((p) => riskOf(p) === 'low').length
  return `共 ${total} 门课程：高风险 ${high} 门、中风险 ${medium} 门、低风险 ${low} 门。气泡越大代表课程难度越高，红色为风险课程，建议优先关注低分高难课程。`
})
</script>

<template>
  <ChartCard title="课程难度适应分析" sub="课程类别 × 成绩 × 难度 × 风险">
    <ChartContainer :option="option" />
    <template #footer>
      <p class="insight"><span class="insight__tag">分析</span>{{ insight }}</p>
    </template>
  </ChartCard>
</template>

<style scoped lang="scss">
.insight {
  margin: 0;
  font-size: 13px;
  line-height: 1.55;
  color: #bfe2f5;

  &__tag {
    display: inline-block;
    margin-right: 6px;
    padding: 1px 7px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    vertical-align: middle;
  }
}
</style>
