<script setup lang="ts">
import { computed } from 'vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { StudentDevQualityVM } from '@/types/college/view/student-dev-quality'

const props = defineProps<{
  data: StudentDevQualityVM
}>()

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

const growthTrendText = computed(() => {
  const t = props.data.growthValue.trend
  const arrow = t.direction === 'up' ? '↑' : t.direction === 'down' ? '↓' : ''
  return `${arrow}${t.value}`
})

function formatCount(n: number) {
  return n.toLocaleString('zh-CN')
}

function openDetail() {
  openCollegeDetail({ kind: 'student-dev-detail' })
}

function openHp() {
  openCollegeDetail({ kind: 'high-potential-overview' })
}

function openWarning(type?: string) {
  openCollegeDetail({ kind: 'warning', id: type ?? 'academic' })
}

function openHpModule(key: string) {
  const map: Record<string, string> = {
    competition: 'competition',
    academic: 'academic',
    research: 'competition',
    practice: 'internship',
  }
  openCollegeDetail({ kind: 'high-potential', id: map[key] ?? 'academic' })
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
      <section class="talent-portrait__block talent-portrait__block--growth">
        <header class="talent-portrait__block-title">成长增值指数</header>
        <div class="talent-portrait__growth">
          <strong class="talent-portrait__growth-score">{{ data.growthValue.score }}</strong>
          <p class="talent-portrait__growth-meta">
            <em>{{ data.growthValue.level }}</em>
            <span>{{ growthTrendText }}</span>
          </p>
        </div>
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

    <!-- 底栏 1×3 转化卡片 -->
    <div class="talent-portrait__conversion">
      <button
        v-for="c in data.outcomeConversion"
        :key="c.key"
        type="button"
        class="talent-portrait__conv"
        @click="openDetail"
      >
        <span>{{ c.label }}</span>
        <strong>{{ c.rate }}<small>%</small></strong>
      </button>
    </div>
  </div>
</template>
