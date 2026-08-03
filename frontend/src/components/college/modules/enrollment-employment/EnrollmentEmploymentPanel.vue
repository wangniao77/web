<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import MockText from '@/components/common/MockText.vue'
import { ROUTES } from '@/constants/routes'
import { isMockField } from '@/composables/useMockFields'
import type { EnrollmentEmploymentFocus } from '@/types/college/api/enrollment-employment'
import type { EnrollmentEmploymentOverviewVM } from '@/types/college/view/enrollment-employment'
import type { EChartsOption } from 'echarts'

type FlowEduMode = 'undergrad' | 'graduate'

const props = defineProps<{
  data: EnrollmentEmploymentOverviewVM
}>()

const router = useRouter()

const FLOW_ROTATION_MS = 6000
const flowMode = ref<FlowEduMode>('undergrad')
const tabsPaused = ref(false)
const tabProgress = ref(0)

let rotationElapsed = 0
let rotationLastTs = 0
let rotationRafId = 0

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

const flowModes = computed<FlowEduMode[]>(() => {
  const previews = props.data.flowPreviews
  if (!previews) return ['undergrad']
  const modes: FlowEduMode[] = []
  if ((previews.undergrad?.links?.length || 0) > 0 || (previews.undergrad?.sampleCount || 0) > 0) {
    modes.push('undergrad')
  }
  if ((previews.graduate?.links?.length || 0) > 0 || (previews.graduate?.sampleCount || 0) > 0) {
    modes.push('graduate')
  }
  return modes.length ? modes : ['undergrad']
})

const activeFlow = computed(() => {
  const previews = props.data.flowPreviews
  if (previews?.[flowMode.value]) return previews[flowMode.value]
  return props.data.flowPreview
})

const sankeyOption = computed<EChartsOption>(() => {
  const { nodes, links } = activeFlow.value
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

function resetTabProgress() {
  rotationElapsed = 0
  rotationLastTs = 0
  tabProgress.value = 0
}

function advanceFlowMode() {
  const modes = flowModes.value
  if (modes.length <= 1) return
  const idx = modes.indexOf(flowMode.value)
  flowMode.value = modes[(idx + 1) % modes.length]
  resetTabProgress()
}

function rotationLoop(ts: number) {
  if (!rotationLastTs) rotationLastTs = ts
  if (!tabsPaused.value && flowModes.value.length > 1) {
    rotationElapsed += ts - rotationLastTs
    tabProgress.value = Math.min((rotationElapsed / FLOW_ROTATION_MS) * 100, 100)
    if (rotationElapsed >= FLOW_ROTATION_MS) {
      advanceFlowMode()
    }
  }
  rotationLastTs = ts
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function startFlowRotation() {
  stopFlowRotation()
  resetTabProgress()
  if (flowModes.value.length <= 1) return
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function stopFlowRotation() {
  if (rotationRafId) {
    window.cancelAnimationFrame(rotationRafId)
    rotationRafId = 0
  }
  rotationLastTs = 0
}

function onSelectFlowMode(mode: FlowEduMode, event: Event) {
  event.stopPropagation()
  flowMode.value = mode
  resetTabProgress()
}

watch(
  flowModes,
  (modes) => {
    if (!modes.includes(flowMode.value)) {
      flowMode.value = modes[0] || 'undergrad'
    }
    startFlowRotation()
  },
  { immediate: true },
)

onMounted(startFlowRotation)
onBeforeUnmount(stopFlowRotation)
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

    <div
      class="enrollment-employment__sankey"
      role="button"
      tabindex="0"
      @click="openDetail('outcome-flow')"
      @keydown.enter.prevent="openDetail('outcome-flow')"
      @mouseenter="tabsPaused = true"
      @mouseleave="tabsPaused = false"
    >
      <div class="enrollment-employment__sankey-head">
        <div class="enrollment-employment__sankey-title">{{ activeFlow.title }}</div>
        <div
          v-if="flowModes.length > 1"
          class="enrollment-employment__edu-switch"
          role="tablist"
          aria-label="学历流向切换"
        >
          <button
            type="button"
            role="tab"
            class="enrollment-employment__edu-btn"
            :class="{ 'is-active': flowMode === 'undergrad' }"
            :aria-selected="flowMode === 'undergrad'"
            @click="onSelectFlowMode('undergrad', $event)"
          >
            本科生
          </button>
          <button
            type="button"
            role="tab"
            class="enrollment-employment__edu-btn"
            :class="{ 'is-active': flowMode === 'graduate' }"
            :aria-selected="flowMode === 'graduate'"
            @click="onSelectFlowMode('graduate', $event)"
          >
            研究生
          </button>
        </div>
      </div>
      <div
        v-if="flowModes.length > 1"
        class="enrollment-employment__edu-progress"
        aria-hidden="true"
      >
        <i :style="{ width: `${tabProgress}%` }" />
      </div>
      <div class="enrollment-employment__sankey-chart">
        <ChartContainer
          v-if="activeFlow.links?.length"
          :key="flowMode"
          :option="sankeyOption"
        />
        <div v-else class="enrollment-employment__sankey-empty">
          暂无{{ flowMode === 'graduate' ? '研究生' : '本科生' }}毕业去向样本
        </div>
      </div>
    </div>
  </div>
</template>
