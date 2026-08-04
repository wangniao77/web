<script setup lang="ts">
/**
 * GPA 详情页 · 学期 GPA / 平均分 趋势（高质感双轴折线）
 */
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { AXIS_LABEL, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { SemesterSummaryVM } from '../../_shared/gpa-data'

const props = defineProps<{
  semesters: SemesterSummaryVM[]
}>()

const axisCompact = { ...AXIS_LABEL, fontSize: 15, margin: 8, color: '#8eb8d8' }

const reveal = ref(0)
let raf = 0
function playReveal() {
  cancelAnimationFrame(raf)
  reveal.value = 0
  const start = performance.now()
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / 1500)
    reveal.value = 1 - Math.pow(1 - t, 3)
    if (t < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}
onMounted(() => nextTick(playReveal))
watch(() => props.semesters, () => nextTick(playReveal), { deep: true })
onUnmounted(() => cancelAnimationFrame(raf))

const option = computed<EChartsOption>(() => {
  const gpa = props.semesters.map((s) => Math.round(s.gpa * reveal.value * 100) / 100)
  const avg = props.semesters.map((s) => Math.round(s.averageScore * reveal.value * 10) / 10)
  const last = props.semesters.length - 1
  return {
    animation: false,
    grid: { ...CHART_GRID.lineLegend, top: 36, bottom: 8, left: 10, right: 12 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      borderWidth: 1,
      textStyle: { color: '#e8f7ff', fontSize: 15 },
      extraCssText:
        'backdrop-filter:blur(8px); box-shadow:0 12px 32px rgba(0,0,0,.5); border-radius:10px; padding:10px 14px;',
      axisPointer: {
        type: 'cross',
        crossStyle: { color: 'rgba(0, 212, 255, 0.35)' },
        lineStyle: { color: 'rgba(0, 212, 255, 0.35)', type: 'dashed' },
      },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; seriesName: string; value: number; marker: string }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const lines = arr.map((p) =>
          `<div style="display:flex;justify-content:space-between;gap:18px;margin-top:4px">
            <span>${p.marker}${p.seriesName}</span>
            <b style="font-family:DIN Alternate,sans-serif;color:#7ff6ff">${typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</b>
          </div>`,
        )
        return `<div style="font-weight:700;margin-bottom:4px">${arr[0].axisValue}</div>${lines.join('')}`
      },
    },
    legend: {
      top: 2,
      right: 4,
      itemWidth: 14,
      itemHeight: 8,
      icon: 'roundRect',
      textStyle: { color: '#bfe2f5', fontSize: CHART_FONT.legend - 1, fontWeight: 650 },
      data: ['学期 GPA', '学期均分'],
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.semesters.map((s) => s.semester),
      axisLabel: { ...axisCompact, fontWeight: 650 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.22)' } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: 'value',
        name: 'GPA',
        nameTextStyle: { color: '#7eb4d8', fontSize: 13, padding: [0, 0, 0, 8] },
        min: 2.0,
        max: 4.0,
        interval: 0.5,
        axisLabel: { ...axisCompact, formatter: '{value}' },
        splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.08)', type: 'dashed' } },
      },
      {
        type: 'value',
        name: '均分',
        nameTextStyle: { color: '#7eb4d8', fontSize: 13 },
        min: 60,
        max: 100,
        interval: 10,
        axisLabel: axisCompact,
        splitLine: { show: false },
      },
    ],
    series: [
      {
        name: '学期 GPA',
        type: 'line',
        smooth: 0.35,
        yAxisIndex: 0,
        data: gpa,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 9,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#34d399' },
              { offset: 1, color: '#6ee7b7' },
            ],
          },
          shadowColor: 'rgba(52, 211, 153, 0.55)',
          shadowBlur: 12,
        },
        itemStyle: {
          color: '#04101f',
          borderColor: '#6ee7b7',
          borderWidth: 2.5,
          shadowColor: 'rgba(52, 211, 153, 0.7)',
          shadowBlur: 8,
        },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(52, 211, 153, 0.32)' },
              { offset: 1, color: 'rgba(52, 211, 153, 0)' },
            ],
          },
        },
        markPoint: last >= 0 && reveal.value > 0.92 ? {
          symbol: 'circle',
          symbolSize: 0,
          data: [{
            coord: [props.semesters[last]?.semester ?? last, gpa[last]],
            label: {
              show: true,
              formatter: `{a|${gpa[last]?.toFixed(2) ?? ''}}`,
              position: 'top',
              distance: 8,
              rich: {
                a: {
                  color: '#04101f',
                  backgroundColor: '#6ee7b7',
                  padding: [3, 8],
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  fontFamily: 'DIN Alternate, sans-serif',
                },
              },
            },
          }],
        } : undefined,
      },
      {
        name: '学期均分',
        type: 'line',
        smooth: 0.35,
        yAxisIndex: 1,
        data: avg,
        showSymbol: true,
        symbol: 'circle',
        symbolSize: 9,
        lineStyle: {
          width: 3,
          color: {
            type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#00b8ff' },
              { offset: 1, color: '#7ff6ff' },
            ],
          },
          shadowColor: 'rgba(0, 229, 255, 0.55)',
          shadowBlur: 12,
        },
        itemStyle: {
          color: '#04101f',
          borderColor: '#7ff6ff',
          borderWidth: 2.5,
          shadowColor: 'rgba(0, 229, 255, 0.7)',
          shadowBlur: 8,
        },
      },
    ],
  }
})
</script>

<template>
  <div class="chart-card">
    <div class="chart-card__glow" aria-hidden="true" />
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <div class="chart-card__titles">
        <h3 class="chart-card__title">学期 GPA / 平均分 趋势</h3>
        <p class="chart-card__hint">双轴对照 · 捕捉学业走势拐点</p>
      </div>
    </header>
    <div class="chart-card__body">
      <ChartContainer :option="option" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(102, 217, 255, 0.22);
  border-radius: 12px;
  background:
    radial-gradient(90% 70% at 0% 0%, rgba(52, 211, 153, 0.08), transparent 50%),
    radial-gradient(90% 70% at 100% 0%, rgba(0, 184, 255, 0.12), transparent 50%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 14px 16px 10px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__glow {
    position: absolute;
    inset: 20% 10% auto;
    height: 40%;
    background: radial-gradient(ellipse, rgba(0, 229, 255, 0.08), transparent 70%);
    pointer-events: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 16px;
    right: 16px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(0, 242, 255, 0.7), transparent);
  }
}

.chart-card__head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 6px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.chart-card__bar {
  width: 3px;
  height: 28px;
  margin-top: 4px;
  border-radius: 2px;
  background: linear-gradient(180deg, #7ff6ff, #00b8ff);
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.55);
  flex-shrink: 0;
}

.chart-card__titles { min-width: 0; flex: 1; }

.chart-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #f4fbff;
  text-shadow: 0 0 14px rgba(0, 242, 255, 0.22);
}

.chart-card__hint {
  margin: 4px 0 0;
  font-size: 14px;
  color: rgba(158, 202, 232, 0.72);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}
</style>
