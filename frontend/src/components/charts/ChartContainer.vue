<script setup lang="ts">
import * as echarts from 'echarts/core'
import { BarChart, GaugeChart, LineChart, PieChart, RadarChart, ScatterChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { EChartsOption } from 'echarts'
import { onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { useScreenStore } from '@/stores/screen'

echarts.use([
  BarChart,
  GaugeChart,
  LineChart,
  PieChart,
  RadarChart,
  ScatterChart,
  GridComponent,
  LegendComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  CanvasRenderer,
])

const props = defineProps<{
  option: EChartsOption
}>()

const emit = defineEmits<{
  chartClick: [params: unknown]
}>()

const chartRef = ref<HTMLElement | null>(null)
const chartInstance = shallowRef<echarts.ECharts | null>(null)
const screenStore = useScreenStore()
let resizeObserver: ResizeObserver | null = null

function initChart() {
  if (!chartRef.value) return
  chartInstance.value?.dispose()
  chartInstance.value = echarts.init(chartRef.value, undefined, { renderer: 'canvas' })
  chartInstance.value.setOption(props.option, { notMerge: true })
  chartInstance.value.on('click', (params) => emit('chartClick', params))
}

function resizeChart() {
  chartInstance.value?.resize()
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', resizeChart)
  if (chartRef.value) {
    resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(resizeChart)
    })
    resizeObserver.observe(chartRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeChart)
  resizeObserver?.disconnect()
  chartInstance.value?.dispose()
})

watch(
  () => props.option,
  () => {
    chartInstance.value?.setOption(props.option, { notMerge: true })
  },
  { deep: true },
)

watch(
  () => screenStore.scale,
  () => {
    requestAnimationFrame(resizeChart)
  },
)

defineExpose({
  getInstance: () => chartInstance.value,
  resize: resizeChart,
})
</script>

<template>
  <div ref="chartRef" class="chart-container" />
</template>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 100%;
  min-height: 80px;
}
</style>
