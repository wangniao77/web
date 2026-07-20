<script setup lang="ts">
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import { mockSchoolKpis, type SchoolKpiStatus } from '@/mock/college/school-kpi'
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

const router = useRouter()
const kpis = mockSchoolKpis

const kpiIcon: Record<string, IconKind> = {
  paper: 'research',
  vertical: 'funding',
  employment: 'placement',
  'major-project': 'innovation',
  horizontal: 'contract',
  further: 'academic',
}

function statusKey(status: SchoolKpiStatus) {
  if (status === 'completed') return 'completed'
  if (status === 'attention') return 'attention'
  return 'in-progress'
}

function statusLabel(status: SchoolKpiStatus) {
  if (status === 'completed') return '已达标'
  if (status === 'attention') return '需关注'
  return '推进中'
}

function progressPercent(target: string, actual: string) {
  const t = Number.parseFloat(target)
  const a = Number.parseFloat(actual)
  if (!Number.isFinite(t) || t <= 0 || !Number.isFinite(a)) return 0
  return Math.min(100, Math.round((a / t) * 100))
}

function openDetail() {
  router.push(ROUTES.college.keyTasks)
}
</script>

<template>
  <div class="school-kpi-panel">
    <div class="school-kpi-panel__legend" aria-label="KPI 状态图例">
      <span class="school-kpi-panel__legend-item school-kpi-panel__legend-item--completed"><i /> 已达标</span>
      <span class="school-kpi-panel__legend-item school-kpi-panel__legend-item--progress"><i /> 推进中</span>
      <span class="school-kpi-panel__legend-item school-kpi-panel__legend-item--attention"><i /> 需关注</span>
    </div>

    <ul class="school-kpi-panel__list">
      <li
        v-for="kpi in kpis"
        :key="kpi.id"
        class="school-kpi-panel__row school-kpi-panel__row--clickable"
        :class="`school-kpi-panel__row--${statusKey(kpi.status)}`"
        @click="openDetail"
      >
        <span class="school-kpi-panel__icon">
          <DashIcon :kind="kpiIcon[kpi.id] || 'task'" :size="16" />
        </span>
        <span class="school-kpi-panel__name">{{ kpi.label }}</span>
        <div class="school-kpi-panel__bar">
          <i :style="{ width: `${progressPercent(kpi.target, kpi.actual)}%` }" />
        </div>
        <span class="school-kpi-panel__value">
          {{ kpi.actual }}<small>/{{ kpi.target }}{{ kpi.unit }}</small>
        </span>
        <span class="school-kpi-panel__tag" :class="`school-kpi-panel__tag--${statusKey(kpi.status)}`">
          {{ statusLabel(kpi.status) }}
        </span>
      </li>
    </ul>

    <button type="button" class="school-kpi-panel__more" @click="openDetail">查看 KPI 明细 →</button>
  </div>
</template>

<style scoped lang="scss">
.school-kpi-panel__icon svg {
  width: 16px;
  height: 16px;
  color: #55dfff;
}

.school-kpi-panel__row--clickable {
  cursor: pointer;
  transition: background 0.18s;

  &:hover {
    background: rgba(0, 130, 230, 0.12);
  }
}
</style>
