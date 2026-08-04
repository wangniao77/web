<script setup lang="ts">
/**
 * GPA 详情页 · 课程类别 GPA 对比（高质感横向条）
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { EChartsOption } from 'echarts'
import type { CategoryStatDTO } from '../../_shared/gpa-data'

const props = defineProps<{
  data: CategoryStatDTO[]
}>()

const maxGpa = computed(() => Math.max(4, ...props.data.map((d) => d.gpa)))

const barOption = computed<EChartsOption>(() => {
  const sorted = [...props.data]
  const topName = [...sorted].sort((a, b) => b.gpa - a.gpa)[0]?.categoryLabel
  return {
    animation: true,
    animationDuration: 1400,
    animationEasing: 'cubicOut',
    grid: { left: 118, right: 56, top: 8, bottom: 6 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0, 184, 255, 0.08)' } },
      backgroundColor: 'rgba(4, 16, 40, 0.94)',
      borderColor: 'rgba(85, 224, 255, 0.4)',
      textStyle: { color: '#e8f7ff', fontSize: 15 },
      extraCssText: 'border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.45);',
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; value: number; marker: string }>
        const p = arr?.[0]
        if (!p) return ''
        const hit = props.data.find((d) => d.categoryLabel === p.name)
        return `${p.marker}<b>${p.name}</b><br/>GPA <b style="color:#7ff6ff">${Number(p.value).toFixed(2)}</b>`
          + (hit ? ` · 均分 ${hit.averageScore} · ${hit.courseCount} 门` : '')
      },
    },
    xAxis: {
      type: 'value',
      min: 0,
      max: Math.min(4, Math.ceil(maxGpa.value * 10) / 10 + 0.2),
      splitNumber: 4,
      axisLabel: { color: '#8eb8d8', fontSize: 14, fontWeight: 650 },
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: 'rgba(102,217,255,.1)', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: props.data.map((item) => item.categoryLabel),
      axisLabel: {
        color: '#d7ecff',
        fontSize: 16,
        fontWeight: 700,
        width: 100,
        overflow: 'truncate',
      },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      barWidth: 16,
      data: props.data.map((item) => ({
        value: item.gpa,
        itemStyle: {
          borderRadius: [0, 999, 999, 0],
          color: item.categoryLabel === topName
            ? {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#0d9488' },
                  { offset: 1, color: '#5eead4' },
                ],
              }
            : {
                type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: '#0369a1' },
                  { offset: 1, color: '#67e8f9' },
                ],
              },
          shadowColor: item.categoryLabel === topName
            ? 'rgba(94, 234, 212, 0.45)'
            : 'rgba(103, 232, 249, 0.35)',
          shadowBlur: 10,
        },
      })),
      showBackground: true,
      backgroundStyle: {
        color: 'rgba(0, 40, 80, 0.45)',
        borderRadius: [0, 999, 999, 0],
      },
      label: {
        show: true,
        position: 'right',
        distance: 8,
        formatter: (p: { value?: number }) => Number(p.value ?? 0).toFixed(2),
        color: '#e8f7ff',
        fontSize: 16,
        fontWeight: 800,
        fontFamily: 'DIN Alternate, sans-serif',
        backgroundColor: 'rgba(0, 30, 60, 0.72)',
        padding: [3, 8],
        borderRadius: 999,
        borderColor: 'rgba(102, 217, 255, 0.28)',
        borderWidth: 1,
      },
      animationDuration: 1400,
      animationDelay: (idx: number) => idx * 90,
    }],
  }
})

const strongCategory = computed(() => [...props.data].sort((a, b) => b.gpa - a.gpa)[0])
const weakCategory = computed(() => [...props.data].sort((a, b) => a.gpa - b.gpa)[0])
</script>

<template>
  <div class="chart-card">
    <div class="chart-card__glow" aria-hidden="true" />
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <div class="chart-card__titles">
        <h3 class="chart-card__title">课程类别 GPA 对比</h3>
        <p class="chart-card__hint">学科能力剖面 · 高亮优势赛道</p>
      </div>
    </header>
    <div class="chart-card__body">
      <ChartContainer :key="`cat-bar-${props.data.map((d) => d.gpa).join('-')}`" :option="barOption" />
    </div>
    <footer class="chart-card__foot">
      <div class="foot-item is-strong">
        <span class="foot-item__tag">擅长</span>
        <span class="foot-item__name">{{ strongCategory?.categoryLabel }}</span>
        <b class="foot-item__num">{{ strongCategory?.gpa.toFixed(2) }}</b>
      </div>
      <div class="foot-item is-weak">
        <span class="foot-item__tag">潜力</span>
        <span class="foot-item__name">{{ weakCategory?.categoryLabel }}</span>
        <b class="foot-item__num">{{ weakCategory?.gpa.toFixed(2) }}</b>
      </div>
    </footer>
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
    radial-gradient(90% 70% at 100% 100%, rgba(0, 184, 255, 0.1), transparent 55%),
    linear-gradient(160deg, rgba(8, 42, 86, 0.72), rgba(3, 12, 34, 0.88));
  box-shadow:
    0 16px 36px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  padding: 14px 16px 12px;
  height: 100%;
  min-height: 0;
  overflow: hidden;

  &__glow {
    position: absolute;
    inset: auto -10% -30% 40%;
    height: 55%;
    background: radial-gradient(circle, rgba(94, 234, 212, 0.1), transparent 70%);
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

.chart-card__foot {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(0, 212, 255, 0.12);
  position: relative;
  z-index: 1;
}

.foot-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  border-radius: 10px;
  border: 1px solid rgba(102, 217, 255, 0.16);
  background: rgba(0, 36, 72, 0.4);

  &.is-strong {
    border-color: rgba(94, 234, 212, 0.35);
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.18), rgba(0, 36, 72, 0.4));
  }
  &.is-weak {
    border-color: rgba(103, 232, 249, 0.3);
    background: linear-gradient(135deg, rgba(3, 105, 161, 0.18), rgba(0, 36, 72, 0.4));
  }

  &__tag {
    font-size: 12px;
    font-weight: 800;
    padding: 2px 8px;
    border-radius: 999px;
    color: #04101f;
    background: linear-gradient(90deg, #7ef0d0, #55e0ff);
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    color: #e8f7ff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__num {
    font-family: 'DIN Alternate', sans-serif;
    font-size: 22px;
    font-weight: 900;
    line-height: 1;
  }

  &.is-strong &__num { color: #5eead4; text-shadow: 0 0 10px rgba(94, 234, 212, 0.35); }
  &.is-weak &__num { color: #67e8f9; text-shadow: 0 0 10px rgba(103, 232, 249, 0.35); }
}
</style>
