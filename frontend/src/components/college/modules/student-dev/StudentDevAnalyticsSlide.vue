<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import ChartContainer from '@/components/charts/ChartContainer.vue'
import { ROUTES } from '@/constants/routes'
import { CHART_FONT } from '@/styles/echarts-theme'
import type { StudentDevQualityVM } from '@/types/college/view/student-dev-quality'
import type { EChartsOption } from 'echarts'

const props = defineProps<{
  data: StudentDevQualityVM
}>()

const router = useRouter()

const gpaColors = ['#39e6ff', '#0d71ff', '#30d7a4']
const GRADE_ROTATION_MS = 6000

const activeGradeIndex = ref(0)
const gradeSelectFocused = ref(false)
const gradeProgress = ref(0)

const gradeOptions = computed(() => props.data.undergradGpaByGrade ?? [])

let rotationElapsed = 0
let rotationLastTs = 0
let rotationRafId = 0

function resetGradeProgress() {
  rotationElapsed = 0
  rotationLastTs = 0
  gradeProgress.value = 0
}

function advanceGrade() {
  const count = gradeOptions.value.length
  if (count <= 1) return
  activeGradeIndex.value = (activeGradeIndex.value + 1) % count
  resetGradeProgress()
}

function rotationLoop(ts: number) {
  if (!rotationLastTs) rotationLastTs = ts

  if (!gradeSelectFocused.value && gradeOptions.value.length > 1) {
    rotationElapsed += ts - rotationLastTs
    gradeProgress.value = Math.min((rotationElapsed / GRADE_ROTATION_MS) * 100, 100)

    if (rotationElapsed >= GRADE_ROTATION_MS) {
      advanceGrade()
    }
  }

  rotationLastTs = ts
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function startGradeRotation() {
  stopGradeRotation()
  resetGradeProgress()
  if (gradeOptions.value.length <= 1) return
  rotationRafId = window.requestAnimationFrame(rotationLoop)
}

function stopGradeRotation() {
  if (rotationRafId) {
    window.cancelAnimationFrame(rotationRafId)
    rotationRafId = 0
  }
  rotationLastTs = 0
}

function onGradeSelect() {
  resetGradeProgress()
}

onMounted(startGradeRotation)
onBeforeUnmount(stopGradeRotation)

watch(() => gradeOptions.value.length, () => {
  if (activeGradeIndex.value >= gradeOptions.value.length) {
    activeGradeIndex.value = 0
  }
  startGradeRotation()
})

const activeGrade = computed(() => {
  const grades = gradeOptions.value
  if (!grades.length) return null
  const index = Math.min(activeGradeIndex.value, grades.length - 1)
  return grades[index]
})

const activeMajors = computed(() => activeGrade.value?.majors ?? [])

const gradeAvgGpa = computed(() => {
  const majors = activeMajors.value
  if (!majors.length) return 0
  return majors.reduce((sum, item) => sum + item.gpa, 0) / majors.length
})

const warnRising = computed(() => props.data.groups.academicWarning.momChange > 0)

const structureMax = computed(() => {
  const counts = props.data.highPotential.structure.map((s) => s.count)
  return Math.max(...counts, 1)
})

const structureRows = computed(() =>
  props.data.highPotential.structure.map((item) => ({
    ...item,
    ratio: (item.count / structureMax.value) * 100,
  })),
)

const gpaOption = computed<EChartsOption>(() => {
  const majors = activeMajors.value
  const avg = gradeAvgGpa.value
  const gradeLabel = activeGrade.value?.gradeLabel ?? ''

  return {
    animationDuration: 900,
    animationDurationUpdate: 900,
    animationEasing: 'cubicOut',
    animationEasingUpdate: 'cubicOut',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(2, 14, 38, 0.94)',
      borderColor: 'rgba(0, 242, 255, 0.45)',
      textStyle: { color: '#f4fbff', fontSize: CHART_FONT.tooltip },
      confine: true,
      formatter: (params: unknown) => {
        const item = params as { name?: string; value?: number }
        const major = majors.find((m) => m.shortName === item.name)
        if (!major) return ''
        return `${major.label}<br/>平均GPA ${Number(item.value).toFixed(2)}`
      },
    },
    legend: {
      orient: 'horizontal',
      bottom: 2,
      left: 'center',
      width: '96%',
      itemWidth: 6,
      itemHeight: 5,
      itemGap: 8,
      textStyle: {
        color: '#c8e4f8',
        fontSize: 10,
        fontWeight: 600,
      },
      formatter: (name: string) => {
        const major = majors.find((m) => m.shortName === name)
        return major ? `${name} ${major.gpa.toFixed(2)}` : name
      },
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: avg.toFixed(2),
          fill: '#ffffff',
          fontSize: 24,
          fontWeight: 800,
          textAlign: 'center',
          fontFamily: 'Bahnschrift, DIN Alternate, ui-monospace, monospace',
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '52%',
        style: {
          text: gradeLabel ? `${gradeLabel}均GPA` : '年级均GPA',
          fill: '#9ecae8',
          fontSize: 10,
          fontWeight: 600,
          textAlign: 'center',
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['50%', '66%'],
        center: ['50%', '40%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        data: majors.map((major, index) => ({
          name: major.shortName,
          value: major.gpa,
          itemStyle: { color: gpaColors[index % gpaColors.length] },
        })),
      },
    ],
  }
})

function formatCount(n: number) {
  return n.toLocaleString('zh-CN')
}

function openDetail(tab: 'overview' | 'high-potential' | 'warning-center' = 'overview') {
  router.push({
    path: ROUTES.college.studentDevDetail,
    query: { tab },
  })
}

function openHp() {
  openDetail('high-potential')
}

function openWarning() {
  openDetail('warning-center')
}

function openHpModule(_key: string) {
  openDetail('high-potential')
}
</script>

<template>
  <div class="talent-portrait">
    <!-- 顶栏 1×4：上标签 / 下数字 -->
    <div class="talent-portrait__kpis">
      <button type="button" class="talent-portrait__kpi" @click="openDetail">
        <span>在校生人数</span>
        <strong>{{ formatCount(data.enrolledUndergrad) }}</strong>
      </button>
      <button type="button" class="talent-portrait__kpi" @click="openDetail">
        <span>研究生人数</span>
        <strong>{{ formatCount(data.enrolledGraduate) }}</strong>
      </button>
      <button type="button" class="talent-portrait__kpi talent-portrait__kpi--hp" @click="openHp">
        <span>高潜学生</span>
        <strong>{{ formatCount(data.highPotential.total) }}</strong>
      </button>
      <button
        type="button"
        class="talent-portrait__kpi talent-portrait__kpi--warn"
        :class="{ 'talent-portrait__kpi--pulse': warnRising }"
        @click="openWarning()"
      >
        <span>预警学生</span>
        <strong>{{ formatCount(data.groups.academicWarning.count) }}</strong>
      </button>
    </div>

    <!-- 中部：左成长指数（无预警明细）| 右高潜结构 -->
    <div class="talent-portrait__mid">
      <section class="talent-portrait__block talent-portrait__block--gpa">
        <header class="talent-portrait__block-head">
          <h3 class="talent-portrait__block-title">平均GPA</h3>
          <label
            v-if="gradeOptions.length"
            class="talent-portrait__grade-select"
            :class="{ 'is-paused': gradeSelectFocused }"
          >
            <span class="sr-only">年级切换</span>
            <div class="talent-portrait__grade-select-box">
              <select
                v-model.number="activeGradeIndex"
                class="talent-portrait__grade-select-input"
                aria-label="年级切换"
                @change="onGradeSelect"
                @focus="gradeSelectFocused = true"
                @blur="gradeSelectFocused = false"
              >
                <option
                  v-for="(grade, index) in gradeOptions"
                  :key="grade.gradeKey"
                  :value="index"
                >
                  {{ grade.gradeLabel }}
                </option>
              </select>
            </div>
            <div class="talent-portrait__grade-progress-wrap" aria-hidden="true">
              <span
                class="talent-portrait__grade-progress"
                :style="{ width: `${gradeProgress}%` }"
              />
            </div>
          </label>
        </header>
        <Transition name="gpa-chart-fade" mode="out-in">
          <div
            :key="activeGrade?.gradeKey ?? 'gpa'"
            class="talent-portrait__gpa-chart"
          >
            <ChartContainer :option="gpaOption" />
          </div>
        </Transition>
      </section>

      <section class="talent-portrait__block">
        <header class="talent-portrait__block-title">高潜学生结构</header>
        <ul class="talent-portrait__structure">
          <li v-for="item in structureRows" :key="item.key">
            <button type="button" class="talent-portrait__row" @click="openHpModule(item.key)">
              <div class="talent-portrait__row-head">
                <span class="talent-portrait__row-label">{{ item.label }}</span>
                <span class="talent-portrait__row-count">{{ item.count }}</span>
              </div>
              <span class="talent-portrait__bar">
                <i :style="{ width: `${item.ratio}%` }" />
              </span>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
