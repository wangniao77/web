<script setup lang="ts">
import { computed } from 'vue'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { COLLEGE_MOCK_CHART_COLORS } from '@/constants/college/simulated-modules'
import type { SankeyLinkDTO, SankeyNodeDTO } from '@/types/college/api/student-dev-quality'
import type { EChartsOption } from 'echarts'

export type SankeyDrillSample = {
  name: string
  studentId?: string
  major: string
  className?: string
  educationLevel?: string
  detail: string
  salary?: string | null
  tag?: string
}

const props = withDefaults(
  defineProps<{
    title: string
    nodes: SankeyNodeDTO[]
    links: SankeyLinkDTO[]
    /** 出口桑基连线名单，key 形如「软工→其他就业」 */
    drillSamples?: Record<string, SankeyDrillSample[]>
    /** 外层已有标题时关闭组件内标题 */
    showTitle?: boolean
    /** 示意 / mock 数据时使用红色节点色 */
    mock?: boolean
  }>(),
  {
    showTitle: true,
    mock: false,
  },
)

const emit = defineEmits<{
  /** 点击桑基连线（边）；附带已解析的名单，避免父层再查 key 丢数 */
  linkClick: [
    payload: {
      source: string
      target: string
      value: number
      drillKey: string
      samples: SankeyDrillSample[]
    },
  ]
  /** 点击桑基节点 */
  nodeClick: [payload: { name: string }]
}>()

const realColors = ['#39e6ff', '#0d71ff', '#30d7a4', '#ffb82e', '#7a8cff', '#f472b6', '#a78bfa', '#34d399']
const colors = computed(() => (props.mock ? [...COLLEGE_MOCK_CHART_COLORS] : realColors))

function shortenLabel(name: string) {
  return name
    .replace('计算机科学与技术', '计科')
    .replace('软件工程', '软工')
    .replace('大数据管理与应用', '大数据')
    .replace('人工智能', '人工智能')
}

function makeDrillKey(source: string, target: string) {
  return `${source}\u2192${target}`
}

function lookupSamples(source: string, target: string): { drillKey: string; samples: SankeyDrillSample[] } {
  const map = props.drillSamples || {}
  const candidates = [
    makeDrillKey(source, target),
    `${source}->${target}`,
    target === '升学深造' ? makeDrillKey(source, '国内升学') : '',
    target === '国内升学' ? makeDrillKey(source, '升学深造') : '',
    target === '机关事业' ? makeDrillKey(source, '考公') : '',
    target === '出国升学' ? makeDrillKey(source, '出国') : '',
  ].filter(Boolean)

  for (const key of candidates) {
    const rows = map[key]
    if (rows?.length) return { drillKey: key, samples: rows }
  }

  const fuzzy = Object.keys(map).find(
    (k) => k.includes(source) && k.includes(target) && (map[k]?.length ?? 0) > 0,
  )
  if (fuzzy) return { drillKey: fuzzy, samples: map[fuzzy] || [] }

  return { drillKey: makeDrillKey(source, target), samples: [] }
}

const option = computed<EChartsOption>(() => ({
  tooltip: {
    trigger: 'item',
    triggerOn: 'mousemove',
    backgroundColor: 'rgba(2, 14, 38, 0.94)',
    borderColor: props.mock ? 'rgba(255, 77, 79, 0.65)' : 'rgba(0, 242, 255, 0.65)',
    textStyle: { color: '#f4fbff', fontSize: 18 },
    formatter: (params: unknown) => {
      const item = params as {
        data?: { source?: string | number; target?: string | number; value?: number; name?: string }
      }
      const d = item.data
      // source 可能为下标 0，不能用 truthy 判断
      if (d && d.source !== undefined && d.source !== null && d.target !== undefined && d.target !== null) {
        const source = typeof d.source === 'number' ? props.nodes[d.source]?.name ?? d.source : d.source
        const target = typeof d.target === 'number' ? props.nodes[d.target]?.name ?? d.target : d.target
        return `${source} → ${target}<br/>${d.value} 人<br/><span style="color:#9fe8ff">点击查看名单</span>`
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
        color: props.mock ? '#ffccc7' : '#d8efff',
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
        itemStyle: { color: colors.value[index % colors.value.length] },
      })),
      links: props.links.map((link) => ({
        ...link,
        drillKey: makeDrillKey(String(link.source), String(link.target)),
        // 提高连线可点性
        lineStyle: { opacity: 0.4, curveness: 0.5 },
      })),
    },
  ],
}))

function onChartClick(params: unknown) {
  const p = params as {
    dataType?: string
    data?: {
      source?: string | number
      target?: string | number
      value?: number
      name?: string
      drillKey?: string
    }
  }
  const d = p.data
  if (!d) return

  const resolveName = (ref: string | number | undefined) => {
    if (ref === undefined || ref === null) return ''
    if (typeof ref === 'number' || /^\d+$/.test(String(ref))) {
      const idx = Number(ref)
      return props.nodes[idx]?.name ?? String(ref)
    }
    return String(ref)
  }

  // sankey 边：source/target 可能是节点名，也可能是节点下标
  if (d.source !== undefined && d.target !== undefined && d.source !== '' && d.target !== '') {
    const source = resolveName(d.source)
    const target = resolveName(d.target)
    if (source && target) {
      const looked = lookupSamples(source, target)
      emit('linkClick', {
        source,
        target,
        value: Number(d.value ?? 0),
        drillKey: d.drillKey || looked.drillKey,
        samples: looked.samples,
      })
      return
    }
  }
  if (d.name) {
    emit('nodeClick', { name: String(d.name) })
  }
}
</script>

<template>
  <div
    class="student-flow-sankey-chart"
    :class="{ 'student-flow-sankey-chart--flat': !showTitle }"
  >
    <div v-if="showTitle" class="student-flow-sankey-chart__title">{{ title }}</div>
    <div class="student-flow-sankey-chart__body">
      <ChartContainer :option="option" @chart-click="onChartClick" />
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
}

.student-flow-sankey-chart--flat {
  border: none;
  background: transparent;
}

.student-flow-sankey-chart__title {
  padding: 8px 12px 0;
  color: #9fe8ff;
  font-size: 14px;
  font-weight: 700;
}

.student-flow-sankey-chart__body {
  flex: 1;
  min-height: 280px;
  height: 100%;
}
</style>
