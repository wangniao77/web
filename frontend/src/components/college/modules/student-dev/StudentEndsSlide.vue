<script setup lang="ts">
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { openCollegeDetail } from '@/components/college/modules/detail-modal/useCollegeDetail'
import type { HighPotentialOverviewVM } from '@/types/college/view/details'
import type { WarningOverviewVM } from '@/types/college/view'

defineProps<{
  highPotential: HighPotentialOverviewVM
  warning: WarningOverviewVM
}>()

const moduleIcon: Record<string, IconKind> = {
  academic: 'academic',
  competition: 'trophy',
  leadership: 'community',
  rural: 'event',
  internship: 'briefcase',
  career: 'placement',
}

const typeMeta: Record<string, { icon: IconKind; tone: string }> = {
  academic: { icon: 'failRate', tone: 'red' },
  psychological: { icon: 'mental', tone: 'amber' },
  employment: { icon: 'jobSupport', tone: 'orange' },
  credit: { icon: 'credit', tone: 'yellow' },
}

function openHpModule(id: string) {
  openCollegeDetail({ kind: 'high-potential', id })
}

function openHpOverview() {
  openCollegeDetail({ kind: 'high-potential-overview' })
}

function openWarning(type: string) {
  openCollegeDetail({ kind: 'warning', id: type })
}

function deltaText(change: number) {
  if (change > 0) return `↑${change}`
  if (change < 0) return `↓${Math.abs(change)}`
  return '—'
}
</script>

<template>
  <div class="student-ends-slide">
    <section class="student-ends-slide__zone student-ends-slide__zone--high">
      <div class="student-ends-slide__zone-head">
        <span class="student-ends-slide__zone-tag student-ends-slide__zone-tag--high">上端 · 亮点</span>
        <span class="student-ends-slide__zone-title">高潜学生</span>
        <button type="button" class="student-ends-slide__zone-link" @click="openHpOverview">
          共 {{ highPotential.summary.total }} 人 ›
        </button>
      </div>
      <div class="student-ends-slide__hp-stats" @click="openHpOverview">
        <div>
          <span>本学期变化</span>
          <strong class="up">{{ highPotential.summary.change }}</strong>
        </div>
        <div>
          <span>覆盖率</span>
          <strong>{{ highPotential.summary.coverage }}</strong>
        </div>
      </div>
      <div class="student-ends-slide__hp-grid">
        <button
          v-for="module in highPotential.modules.slice(0, 4)"
          :key="module.id"
          type="button"
          class="student-ends-slide__hp-card"
          @click="openHpModule(module.id)"
        >
          <DashIcon :kind="moduleIcon[module.id] || 'potential'" :size="16" />
          <span class="student-ends-slide__hp-card-title">{{ module.title }}</span>
          <strong>
            {{ module.cardMetric.value }}
            <small v-if="module.cardMetric.unit">{{ module.cardMetric.unit }}</small>
          </strong>
        </button>
      </div>
    </section>

    <section class="student-ends-slide__zone student-ends-slide__zone--warn">
      <div class="student-ends-slide__zone-head">
        <span class="student-ends-slide__zone-tag student-ends-slide__zone-tag--warn">下端 · 预警</span>
        <span class="student-ends-slide__zone-title">风险监测</span>
      </div>
      <ul class="student-ends-slide__warn-list">
        <li v-for="cat in warning.categories" :key="cat.type">
          <button
            type="button"
            class="student-ends-slide__warn-item"
            :class="`student-ends-slide__warn-item--${typeMeta[cat.type]?.tone || 'amber'}`"
            @click="openWarning(cat.type)"
          >
            <DashIcon :kind="typeMeta[cat.type]?.icon || 'warning'" :size="18" />
            <span class="student-ends-slide__warn-label">{{ cat.label }}</span>
            <strong>{{ cat.count }}<small>人</small></strong>
            <em>{{ deltaText(cat.momChange) }}</em>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped lang="scss">
.student-ends-slide__hp-stats {
  cursor: pointer;
  transition: background 0.18s;
  border-radius: 6px;

  &:hover {
    background: rgba(0, 130, 230, 0.08);
  }
}
</style>
