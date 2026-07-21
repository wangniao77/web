<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import type { SankeyLinkDTO, SankeyNodeDTO } from '@/types/college/api/student-dev-quality'
import type { EChartsOption } from 'echarts'

const props = withDefaults(
  defineProps<{
    title: string
    nodes: SankeyNodeDTO[]
    links: SankeyLinkDTO[]
    /** 外层已有标题时关闭组件内标题 */
    showTitle?: boolean
  }>(),
  {
    showTitle: true,
  },
)

const colors = ['#39e6ff', '#0d71ff', '#30d7a4', '#ffb82e', '#7a8cff', '#f472b6', '#a78bfa', '#34d399']

function shortenLabel(name: string) {
  return name
    .replace('计算机科学与技术', '计科')
    .replace('软件工程', '软工')
    .replace('大数据管理与应用', '大数据')
    .replace('人工智能', '人工智能')
}

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: 18 },
    formatter: (params: unknown) => {
      const item = params as { data?: { source?: string; target?: string; value?: number; name?: string } }
      const d = item.data
      if (d?.source && d?.target) {
        return `${d.source} → ${d.target}<br/>${d.value} 人`
      }
      return d?.name ?? ''
    },
    confine: true,
  },
  series: [
    {
      type: 'sankey' as const,
      layout: 'none',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'justify',
      nodeGap: 12,
      nodeWidth: 12,
      left: 88,
      right: 108,
      top: 12,
      bottom: 12,
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.35 },
      itemStyle: { borderWidth: 0 },
      label: {
        color: '#d8efff',
        fontSize: 16,
        fontWeight: 600,
        formatter: (params: { name?: string }) => shortenLabel(params.name ?? ''),
      },
      levels: [
        {
          depth: 0,
          label: {
            position: 'left',
            distance: 8,
            align: 'right',
          },
        },
        {
          depth: 1,
          label: {
            position: 'right',
            distance: 8,
            align: 'left',
          },
        },
      ],
      data: props.nodes.map((node, index) => ({
        name: node.name,
        itemStyle: { color: colors[index % colors.length] },
      })),
      links: props.links.map((link) => ({ ...link })),
    },
  ],
}))
</script>

<template>
  <div
    class="student-flow-sankey-chart"
    :class="{ 'student-flow-sankey-chart--flat': !showTitle }"
  >
    <div v-if="showTitle" class="student-flow-sankey-chart__title">{{ title }}</div>
    <div class="student-flow-sankey-chart__body">
      <ChartContainer :option="option" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.student-flow-sankey-chart {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  border: 1px solid rgba(0, 200, 255, 0.14);
  border-radius: 8px;
  background: rgba(0, 40, 90, 0.18);
  overflow: visible;

  &--flat {
    border: none;
    border-radius: 0;
    background: transparent;
  }
}

.student-flow-sankey-chart__title {
  flex-shrink: 0;
  padding: 8px 12px;
  font-size: 24px;
  font-weight: 700;
  color: #9fe8ff;
  border-bottom: 1px solid rgba(0, 200, 255, 0.12);
}

.student-flow-sankey-chart__body {
  flex: 1;
  min-height: 320px;
  overflow: visible;
}
</style>
