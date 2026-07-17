<script setup lang="ts">
/**
 * GPA 详情页 · 成绩等级分布（环形图 + 底部 5 个等级卡片）
 *
 * 排版要点：
 * - 移除 ECharts 内置 legend（容易挤占图表空间）
 * - 环形图整体居中、半径收紧，留出充足留白
 * - 5 个等级卡片放在图表下方，永远可见
 * - tooltip 设置 confine: true + appendTo: 'body'，保证鼠标悬浮内容不超出可视范围
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { GpaOverviewVM } from '../../_shared/gpa-data'

const props = defineProps<{
  data: GpaOverviewVM
}>()

interface Bucket {
  key: string
  label: string
  value: number
  color: string
  range: string
}

const buckets = computed<Bucket[]>(() => [
  { key: 'excellent', label: '优秀',  value: props.data.excellentCount, color: CHART_COLORS.green,  range: '≥ 90' },
  { key: 'good',      label: '良好',  value: props.data.goodCount,      color: CHART_COLORS.blue,   range: '80-89' },
  { key: 'medium',    label: '中等',  value: props.data.mediumCount,    color: CHART_COLORS.gold,   range: '70-79' },
  { key: 'pass',      label: '及格',  value: props.data.passCount,      color: CHART_COLORS.orange, range: '60-69' },
  { key: 'fail',      label: '不及格', value: props.data.failCount,      color: CHART_COLORS.red,    range: '< 60' },
])

const total = computed(() => buckets.value.reduce((s, b) => s + b.value, 0))

/** 给每个 bucket 计算占比，供底部卡片使用 */
const bucketsWithPercent = computed(() =>
  buckets.value.map((b) => ({
    ...b,
    percent: total.value > 0 ? (b.value / total.value) * 100 : 0,
  })),
)

const option = computed<EChartsOption>(() => ({
  // 关键 1：tooltip 限制在容器内 + 浮在 body 顶层，避免被父容器 overflow 裁切
  tooltip: {
    trigger: 'item',
    confine: true,
    appendTo: 'body',
    extraCssText:
      'max-width: 220px; padding: 8px 12px; box-shadow: 0 6px 20px rgba(0, 0, 0, 0.55); ' +
      'border-radius: 6px; border: 1px solid rgba(0, 212, 255, 0.32); white-space: nowrap;',
    backgroundColor: 'rgba(6, 17, 52, 0.96)',
    borderColor: 'rgba(0, 212, 255, 0.3)',
    textStyle: { color: '#e2edff', fontSize: 13, lineHeight: 20 },
    formatter: (p: unknown) => {
      const it = p as { name: string; value: number; percent: number; marker: string }
      const b = buckets.value.find((x) => x.label === it.name)
      return [
        `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">`,
        `  ${it.marker}`,
        `  <span style="font-weight:700;color:#f4fbff">${it.name}</span>`,
        `  <span style="color:rgba(184,236,255,0.6);font-size:12px">（${b?.range}）</span>`,
        `</div>`,
        `<div style="color:rgba(184,236,255,0.85)">`,
        `  <b style="color:#f0c040;font-family:DIN Alternate,sans-serif;font-size:15px">${it.value}</b> 门`,
        `  <span style="color:rgba(184,236,255,0.5)">·</span>`,
        `  <b style="color:#f0c040">${it.percent.toFixed(1)}%</b>`,
        `</div>`,
      ].join('')
    },
  },
  // 关键 2：环形图中央放固定汇总信息（不随悬浮变化，永远不被 tooltip 挡住）
  graphic: {
    elements: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: '累计',
          fill: 'rgba(184, 236, 255, 0.55)',
          font: '12px HarmonyOS Sans SC, sans-serif',
          textAlign: 'center',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '48%',
        style: {
          text: `${total.value}`,
          fill: '#f4fbff',
          font: 'bold 28px DIN Alternate, Bahnschrift, sans-serif',
          textAlign: 'center',
          textShadowColor: 'rgba(57, 230, 255, 0.5)',
          textShadowBlur: 8,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '60%',
        style: {
          text: '门课程',
          fill: 'rgba(184, 236, 255, 0.65)',
          font: '12px HarmonyOS Sans SC, sans-serif',
          textAlign: 'center',
        },
      },
    ],
  },
  // 关键 3：不再使用 ECharts 内置 legend，留给底部卡片
  series: [
    {
      name: '成绩分布',
      type: 'pie',
      radius: ['44%', '68%'],
      center: ['50%', '46%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 4,
        borderColor: 'rgba(6, 17, 52, 0.85)',
        borderWidth: 2,
      },
      label: { show: false },
      labelLine: { show: false },
      // 关键 4：放大悬浮扇区，**关闭 emphasis 中央文字**（避免和 tooltip 重复 + 互相遮挡）
      emphasis: {
        scale: true,
        scaleSize: 8,
        focus: 'self',
        label: { show: false },
      },
      data: buckets.value.map((b) => ({
        name: b.label,
        value: b.value,
        itemStyle: { color: b.color },
      })),
    },
  ],
}))

const topBucket = computed(() => {
  return [...bucketsWithPercent.value].sort((a, b) => b.value - a.value)[0]
})
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">成绩等级分布</h3>
      <span class="chart-card__sub">共 {{ total }} 门课程</span>
    </header>

    <!-- 图表区：占满中间部分 -->
    <div class="chart-card__body">
      <ChartContainer :option="option" />
    </div>

    <!-- 5 个等级卡片：替代 ECharts legend，永远可见、不挤 -->
    <footer class="bucket-grid">
      <div
        v-for="b in bucketsWithPercent"
        :key="b.key"
        class="bucket"
        :class="['bucket--' + b.key, { 'bucket--top': b.key === topBucket.key }]"
      >
        <span class="bucket-dot" :style="{ background: b.color, boxShadow: `0 0 8px ${b.color}` }" />
        <span class="bucket-label">{{ b.label }}</span>
        <span class="bucket-range">{{ b.range }}</span>
        <span class="bucket-num" :style="{ color: b.color }">
          {{ b.value }}<small>门</small>
        </span>
        <span class="bucket-pct">{{ b.percent.toFixed(0) }}%</span>
      </div>
    </footer>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 12px 14px 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 12px;
    right: 12px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.62), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f4fbff;
  text-shadow: 0 0 10px rgba(0, 242, 255, 0.18);
}

.chart-card__sub {
  margin-left: auto;
  font-size: 12px;
  color: rgba(184, 236, 255, 0.6);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
  /* 留出上下空间，避免环形图贴近头部/卡片 */
  padding: 2px 0 4px;
}

/* ── 5 个等级卡片网格 ────────────────────────────────── */
.bucket-grid {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
  padding-top: 6px;
  border-top: 1px dashed rgba(0, 212, 255, 0.1);
}

.bucket {
  display: grid;
  grid-template-areas:
    'dot label label'
    'dot range range'
    'num num  pct';
  grid-template-columns: auto 1fr auto;
  align-items: center;
  column-gap: 4px;
  row-gap: 1px;
  padding: 5px 7px;
  border-radius: 5px;
  background: rgba(0, 184, 255, 0.04);
  border: 1px solid rgba(0, 184, 255, 0.08);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;

  &:hover {
    background: rgba(0, 184, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    transform: translateY(-1px);
  }

  &--top {
    background: rgba(240, 192, 64, 0.08);
    border-color: rgba(240, 192, 64, 0.32);
  }
}

.bucket-dot {
  grid-area: dot;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  align-self: center;
}

.bucket-label {
  grid-area: label;
  font-size: 12px;
  font-weight: 700;
  color: #f4f8ff;
  white-space: nowrap;
}

.bucket-range {
  grid-area: range;
  font-size: 10px;
  color: rgba(184, 236, 255, 0.5);
  white-space: nowrap;
}

.bucket-num {
    grid-area: num;
    font-family: 'DIN Alternate', sans-serif;
    font-size: 18px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.02em;

  small {
    font-size: 9px;
    color: rgba(184, 236, 255, 0.6);
    font-weight: 500;
    margin-left: 1px;
    font-family: inherit;
  }
}

.bucket-pct {
  grid-area: pct;
  font-size: 10px;
  color: rgba(184, 236, 255, 0.7);
  font-weight: 600;
  align-self: end;
}
</style>
