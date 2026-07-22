<script setup lang="ts">
/**
 * 学分进度页 · 各类别学分达成对比
 *
 * 横向条形图：每个类别一行
 * - 实心条 = 已修学分（按类别配色）
 * - 虚线 = 应修学分
 * - 红色高亮未达成
 */
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { CHART_COLORS, CHART_FONT, CHART_GRID } from '@/styles/echarts-theme'
import type { EChartsOption } from 'echarts'
import type { CategoryProgressDTO } from '../../_shared/credit-data'

const props = defineProps<{
  categories: CategoryProgressDTO[]
}>()

const colorByCategory: Record<string, string> = {
  general:      CHART_COLORS.lightBlue,
  'major-base': CHART_COLORS.blue,
  'major-core': CHART_COLORS.cyan,
  elective:     CHART_COLORS.purple,
  practice:     CHART_COLORS.green,
  innovation:   CHART_COLORS.gold,
}

const option = computed<EChartsOption>(() => {
  const list = props.categories
  return {
    grid: { ...CHART_GRID.barH, left: 8, right: 90, top: 12, bottom: 4 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      textStyle: { fontSize: 14 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ name: string; seriesName: string; value: number; marker: string }>
        if (!Array.isArray(arr) || !arr.length) return ''
        const lines = arr.map((p) => `${p.marker}${p.seriesName}：${p.value} 学分`)
        return `${arr[0].name}<br/>${lines.join('<br/>')}`
      },
    },
    legend: {
      top: 0,
      right: 0,
      itemWidth: 12,
      itemHeight: 10,
      textStyle: { color: '#9eefff', fontSize: CHART_FONT.legend + 1 },
      data: ['已修', '未修'],
    },
    xAxis: {
      type: 'value',
      name: '学分',
      nameTextStyle: { color: 'rgba(184, 236, 255, 0.6)', fontSize: 13 },
      axisLabel: { color: '#9bb8db', fontSize: 13 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      splitLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.06)' } },
    },
    yAxis: {
      type: 'category',
      data: list.map((c) => c.name),
      axisLabel: { color: '#d4ecff', fontSize: 15, fontWeight: 600 },
      axisLine: { lineStyle: { color: 'rgba(0, 212, 255, 0.2)' } },
      axisTick: { show: false },
    },
    series: [
      {
        name: '已修',
        type: 'bar',
        stack: 'total',
        barWidth: 16,
        data: list.map((c) => ({
          value: c.earnedCredits,
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: colorByCategory[c.id] + '66' },
                { offset: 1, color: colorByCategory[c.id] },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'insideRight',
          color: '#f4fbff',
          fontSize: 15,
          fontWeight: 700,
          formatter: (p: unknown) => {
            const it = p as { value: number; dataIndex: number }
            const c = list[it.dataIndex]
            return `${c.earnedCredits} / ${c.requiredCredits}`
          },
        },
      },
      {
        name: '未修',
        type: 'bar',
        stack: 'total',
        barWidth: 16,
        data: list.map((c) => {
          const remaining = c.requiredCredits - c.earnedCredits
          return {
            value: Math.max(0, remaining),
            itemStyle: {
              color: remaining > 0
                ? {
                    type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
                    colorStops: [
                      { offset: 0, color: 'rgba(248, 113, 113, 0.18)' },
                      { offset: 1, color: 'rgba(248, 113, 113, 0.32)' },
                    ],
                  }
                : 'rgba(52, 211, 153, 0.15)',
              borderColor: remaining > 0
                ? 'rgba(248, 113, 113, 0.4)'
                : 'rgba(52, 211, 153, 0.4)',
              borderWidth: 1,
              borderType: 'dashed',
            },
          }
        }),
        label: {
          show: true,
          position: 'right',
          color: (p: unknown) => {
            const it = p as { dataIndex: number }
            const c = list[it.dataIndex]
            return c.requiredCredits - c.earnedCredits > 0
              ? '#f87171'
              : '#34d399'
          },
          fontSize: 12,
          fontWeight: 700,
          formatter: (p: unknown) => {
            const it = p as { value: number; dataIndex: number }
            const c = list[it.dataIndex]
            if (c.requiredCredits - c.earnedCredits === 0) return '✓ 已达成'
            return `差 ${c.requiredCredits - c.earnedCredits}`
          },
        },
      },
    ],
  }
})
</script>

<template>
  <div class="chart-card">
    <header class="chart-card__head">
      <span class="chart-card__bar" aria-hidden="true" />
      <h3 class="chart-card__title">各类别学分达成对比</h3>
      <span class="chart-card__sub">实心 = 已修 · 虚线 = 缺口</span>
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
  border: 1px solid rgba(102, 217, 255, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(145deg, rgba(0, 113, 206, 0.16), rgba(3, 12, 34, 0.78)),
    rgba(5, 18, 48, 0.54);
  box-shadow:
    0 12px 26px rgba(0, 0, 0, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04),
    inset 0 0 22px rgba(0, 184, 255, 0.06);
  padding: 14px 16px 10px;
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
  gap: 10px;
  margin-bottom: 6px;
  flex-shrink: 0;
}

.chart-card__bar {
  width: 4px;
  height: 18px;
  border-radius: 2px;
  background: linear-gradient(180deg, #00e5ff, #00b8ff);
  box-shadow: 0 0 6px rgba(0, 212, 255, 0.45);
  flex-shrink: 0;
}

.chart-card__title {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
  color: #f4fbff;
  text-shadow: 0 0 12px rgba(0, 242, 255, 0.22);
  letter-spacing: 0.04em;
}

.chart-card__sub {
  margin-left: auto;
  font-size: 14px;
  color: rgba(184, 236, 255, 0.6);
}

.chart-card__body {
  flex: 1;
  min-height: 0;
}
</style>
