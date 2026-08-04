<script setup lang="ts">
/**
 * 课程成绩分布（气泡图）
 * 横轴 = 课程类别
 * 纵轴 = 成绩
 * 点大小 = 学分（客观字段，不再用难定义的「课程难度」）
 * 颜色 = 风险（按成绩：红高 / 黄中 / 绿低）
 * 每个点代表一门课程。
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL } from '@/styles/echarts-theme'
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

/** 风险只看成绩，不引入难定义的「难度」 */
function riskOf(p: CoursePoint): RiskLevel {
  if (p.score < 60) return 'high'
  if (p.score < 75) return 'medium'
  return 'low'
}

/** 学分 → 直径：客观可解释，并做压缩避免过大 */
function sizeOf(credit: number): number {
  const t = (Math.max(0.5, Math.min(6, credit)) - 0.5) / 5.5 // 0~1
  return Math.round(8 + Math.sqrt(t) * 12) // 约 8~20px
}

const categories = computed(() => {
  const present = new Set(props.points.map((p) => p.category))
  return CAT_ORDER.filter((c) => present.has(c)).map((c) => CATEGORY_LABEL[c])
})

interface BubbleDatum {
  value: [number, number]
  symbolSize: number
  name: string
  risk: RiskLevel
  p: CoursePoint
}

function layoutWithJitter(points: CoursePoint[]): BubbleDatum[] {
  const catIndex = new Map(categories.value.map((label, i) => [label, i]))
  const byCat = new Map<string, CoursePoint[]>()
  for (const p of points) {
    const list = byCat.get(p.categoryLabel) ?? []
    list.push(p)
    byCat.set(p.categoryLabel, list)
  }

  const placed: BubbleDatum[] = []
  const maxHalfSpread = 0.42

  for (const [label, list] of byCat) {
    const idx = catIndex.get(label)
    if (idx == null) continue
    const sorted = [...list].sort(
      (a, b) => sizeOf(b.credit) - sizeOf(a.credit) || a.score - b.score,
    )
    const local: Array<{ x: number; y: number; rx: number; ry: number }> = []

    for (const p of sorted) {
      const risk = riskOf(p)
      const diam = sizeOf(p.credit)
      const r = diam / 2
      const rx = Math.max(0.05, r / 78)
      const ry = Math.max(1.6, r / 2.6)
      let bestX = idx
      let found = false

      for (let step = 0; step <= 16 && !found; step++) {
        const candidates = step === 0 ? [0] : [step * 0.05, -step * 0.05]
        for (const dx of candidates) {
          const x = idx + dx
          if (Math.abs(dx) > maxHalfSpread) continue
          const hit = local.some(
            (q) => Math.abs(q.x - x) < q.rx + rx && Math.abs(q.y - p.score) < q.ry + ry,
          )
          if (!hit) {
            bestX = x
            found = true
            break
          }
        }
      }
      if (!found) {
        const k = local.length
        bestX = idx + (((k % 9) - 4) * 0.08)
        bestX = Math.max(idx - maxHalfSpread, Math.min(idx + maxHalfSpread, bestX))
      }
      local.push({ x: bestX, y: p.score, rx, ry })
      placed.push({
        value: [bestX, p.score],
        symbolSize: diam,
        name: p.name,
        risk,
        p,
      })
    }
  }
  return placed
}

const laidOut = computed(() => layoutWithJitter(props.points))

const series = computed(() =>
  (['high', 'medium', 'low'] as RiskLevel[]).map((level, si) => ({
    name: RISK_LABEL[level],
    type: 'scatter' as const,
    z: 10 - si,
    symbolSize: 10,
    itemStyle: {
      color: RISK_COLOR[level],
      opacity: level === 'low' ? 0.82 : 0.92,
      borderColor: 'rgba(255,255,255,0.65)',
      borderWidth: 1,
      shadowBlur: 6,
      shadowColor: RISK_COLOR[level],
    },
    emphasis: { scale: 1.25, itemStyle: { opacity: 1, borderColor: '#fff', borderWidth: 1.5 } },
    data: laidOut.value.filter((d) => d.risk === level),
  })),
)

const option = computed<EChartsOption>(() => {
  const cats = categories.value
  const n = Math.max(1, cats.length)
  return {
    grid: { left: 22, right: 20, top: 48, bottom: 48, containLabel: true },
    tooltip: {
      trigger: 'item',
      confine: true,
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      textStyle: { color: '#e8f7ff', fontSize: 18 },
      extraCssText: 'border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.45);',
      formatter: (p: unknown) => {
        const it = p as { data: BubbleDatum }
        const c = it.data.p
        const color = RISK_COLOR[it.data.risk]
        return `<div style="line-height:1.65">
        <b style="color:#8ef6ff;font-size:19px">${c.name}</b><br/>
        课程类别：${c.categoryLabel}<br/>
        成绩：<b style="color:${c.score < 75 ? '#f87171' : '#f0c040'}">${c.score}</b> 分<br/>
        学分：${c.credit}（气泡越大学分越高）<br/>
        风险：<b style="color:${color}">${RISK_LABEL[it.data.risk]}</b>
      </div>`
      },
    },
    legend: {
      top: 2,
      right: 0,
      left: 'auto',
      itemWidth: 14,
      itemHeight: 14,
      itemGap: 20,
      icon: 'circle',
      textStyle: { color: '#cfe8ff', fontSize: 18, fontWeight: 650 },
      data: (['high', 'medium', 'low'] as RiskLevel[]).map((l) => RISK_LABEL[l]),
    },
    xAxis: {
      type: 'value',
      min: -0.55,
      max: n - 0.45,
      interval: 1,
      name: '课程类别',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: { color: '#9ecae8', fontSize: 19, fontWeight: 650 },
      axisTick: { show: false },
      axisLabel: {
        ...AXIS_LABEL,
        fontSize: 18,
        fontWeight: 650,
        color: '#d7ecff',
        formatter: (v: number) => {
          const i = Math.round(v)
          return i >= 0 && i < cats.length ? cats[i]! : ''
        },
      },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
      splitLine: {
        show: true,
        interval: 0,
        lineStyle: { color: 'rgba(0, 212, 255, 0.06)' },
      },
    },
    yAxis: {
      type: 'value',
      name: '成绩',
      nameLocation: 'middle',
      nameGap: 50,
      nameRotate: 90,
      min: 40,
      max: 100,
      interval: 10,
      nameTextStyle: { color: '#9ecae8', fontSize: 19, fontWeight: 650 },
      axisLabel: { ...AXIS_LABEL, fontSize: 18, color: '#b8d6ec', fontWeight: 650 },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)', type: 'dashed' } },
    },
    series: series.value,
  }
})

const insight = computed(() => {
  const total = props.points.length
  if (!total) return '暂无课程成绩数据'
  const high = props.points.filter((p) => riskOf(p) === 'high').length
  const medium = props.points.filter((p) => riskOf(p) === 'medium').length
  const low = props.points.filter((p) => riskOf(p) === 'low').length
  return `共 ${total} 门课程：高风险 ${high} 门、中风险 ${medium} 门、低风险 ${low} 门。气泡越大代表学分越高，红色/黄色为偏低分课程，建议优先关注。`
})
</script>

<template>
  <ChartCard
    title="课程成绩分布"
    sub="每点一门课 · 横轴类别 · 纵轴成绩 · 大小=学分 · 颜色=风险"
    tall
  >
    <ChartContainer :option="option" />
    <template #footer>
      <p class="insight"><span class="insight__tag">分析</span>{{ insight }}</p>
    </template>
  </ChartCard>
</template>

<style scoped lang="scss">
.insight {
  margin: 0;
  font-size: 18px;
  line-height: 1.6;
  color: #cfe8ff;

  &__tag {
    display: inline-block;
    margin-right: 8px;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 800;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #34d399);
    box-shadow: 0 0 10px rgba(52, 211, 153, 0.3);
    vertical-align: middle;
  }
}
</style>
