<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import MockText from '@/components/common/MockText.vue'
import { ROUTES } from '@/constants/routes'
import { isMockField } from '@/composables/useMockFields'
import type { EnrollmentEmploymentFocus } from '@/types/college/api/enrollment-employment'
import type { EnrollmentEmploymentOverviewVM } from '@/types/college/view/enrollment-employment'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: EnrollmentEmploymentOverviewVM
}>()

const router = useRouter()

function isMock(path: string) {
  return isMockField(props.data.mockFields, path)
}

function openDetail(focus: EnrollmentEmploymentFocus = 'overview') {
  const admissionFocuses = new Set([
    'overview',
    'admission-scale',
    'source-quality',
    'admission-trend',
    'entrance-flow',
  ])
  const tab = admissionFocuses.has(focus) ? 'admission' : 'employment'
  router.push({
    path: ROUTES.college.studentDevDetail,
    query: { tab, focus },
  })
}

const colors = ['#39e6ff', '#0d71ff', '#30d7a4', '#ffb82e', '#7a8cff', '#f472b6', '#a78bfa', '#34d399']

const sankeyOption = computed<EChartsOption>(() => {
  const { nodes, links } = props.data.flowPreview
  return {
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.65)',
      textStyle: { color: '#f4fbff', fontSize: 20 },
      formatter: (params: unknown) => {
        const item = params as { data?: { source?: string; target?: string; value?: number; name?: string } }
        const d = item.data
        if (d?.source && d?.target) return `${d.source} → ${d.target}<br/>${d.value} 人`
        return d?.name ?? ''
      },
      confine: true,
    },
    series: [{
      type: 'sankey',
      emphasis: { focus: 'adjacency' },
      nodeAlign: 'justify',
      nodeGap: 10,
      nodeWidth: 12,
      left: 16,
      right: 16,
      top: 10,
      bottom: 10,
      lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.4 },
      itemStyle: { borderWidth: 0 },
      label: {
        color: '#d8efff',
        fontSize: 12,
        fontWeight: 600,
      },
      levels: [
        {
          depth: 0,
          label: {
            position: 'right',
            distance: 6,
            color: '#d8efff',
            fontSize: 12,
            fontWeight: 600,
          },
        },
        {
          depth: 1,
          label: {
            position: 'left',
            distance: 6,
            color: '#d8efff',
            fontSize: 12,
            fontWeight: 600,
          },
        },
      ],
      data: nodes.map((node, index) => ({
        name: node.name,
        itemStyle: { color: colors[index % colors.length] },
      })),
      links: links.map((link) => ({ ...link })),
    }],
  } as EChartsOption
})

const enrolledText = computed(() => props.data.enrolledCount.toLocaleString('zh-CN'))
</script>

<template>
  <div class="enrollment-employment">
    <div class="enrollment-employment__kpis">
      <button type="button" class="enrollment-employment__kpi" @click="openDetail('admission-scale')">
        <span>在校本科</span>
        <strong>{{ enrolledText }}<small>人</small></strong>
      </button>
      <button type="button" class="enrollment-employment__kpi" @click="openDetail('source-quality')">
        <span>生源质量指数</span>
        <strong><MockText :mock="isMock('sourceQualityIndex')">{{ data.sourceQualityIndex }}</MockText></strong>
      </button>
      <button type="button" class="enrollment-employment__kpi" @click="openDetail('exit-quality')">
        <span>毕业去向落实率</span>
        <strong>{{ data.placementRate }}<small>%</small></strong>
      </button>
      <button type="button" class="enrollment-employment__kpi enrollment-employment__kpi--accent" @click="openDetail('high-quality-dest')">
        <span>高质量毕业去向率</span>
        <strong>{{ data.highQualityEmploymentRate }}<small>%</small></strong>
      </button>
    </div>

    <button
      type="button"
      class="enrollment-employment__sankey"
      @click="openDetail('outcome-flow')"
    >
      <div class="enrollment-employment__sankey-title">{{ data.flowPreview.title }}</div>
      <div class="enrollment-employment__sankey-chart">
        <ChartContainer :option="sankeyOption" />
      </div>
    </button>
  </div>
</template>
