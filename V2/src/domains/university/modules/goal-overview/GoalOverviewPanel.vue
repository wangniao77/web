<script setup lang="ts">
import { useRouter } from 'vue-router'
import CircularHud from '@/domains/university/components/CircularHud.vue'
import RingStat from '@/domains/university/components/RingStat.vue'
import FloatingMetricPill from '@/domains/university/components/FloatingMetricPill.vue'
import HudSectionLabel from '@/domains/university/components/HudSectionLabel.vue'
import BackgroundGlowLayer from '@/domains/university/components/BackgroundGlowLayer.vue'
import ProgressTrack from '@/domains/university/components/ProgressTrack.vue'
import { ROUTES } from '@/constants/routes'
import type { GoalOverviewVM } from '@/domains/university/types/view'

const props = defineProps<{
  data: GoalOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const router = useRouter()

const pods = [
  { label: '任务总数', key: 'totalTasks', tone: 'cyan' },
  { label: '已完成', key: 'completedTasks', tone: 'green' },
  { label: '推进中', key: 'inProgressTasks', tone: 'ongoing' },
  { label: '需关注', key: 'riskTasks', tone: 'warn' },
  { label: '逾期', key: 'overdueTasks', tone: 'danger' },
  { label: '本月新增', key: 'monthlyCompleted', tone: 'cyan', plus: true },
] as const

function podValue(key: keyof GoalOverviewVM, plus?: boolean) {
  const v = props.data[key] as number
  return plus ? `+${v}` : v
}

function goDimension(key: string) {
  const map: Record<string, string> = {
    research: ROUTES.university.research,
    discipline: ROUTES.university.disciplines,
    employment: ROUTES.university.employment,
    talent: ROUTES.university.academicRisk,
  }
  const target = map[key]
  if (target) router.push(target)
}
</script>

<template>
  <section class="core">
    <BackgroundGlowLayer class="core__bg" variant="center" />
    <header class="core__label">
      <HudSectionLabel :index="2" title="年度高质量发展总体态势" />
    </header>

    <div v-if="loading" class="core__state">数据加载中</div>
    <div v-else-if="error" class="core__state core__state--error">
      <span>{{ error }}</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>

    <div v-else class="core__grid">
      <div class="core__pods">
        <FloatingMetricPill
          v-for="pod in pods"
          :key="pod.key"
          :label="pod.label"
          :value="podValue(pod.key, (pod as { plus?: boolean }).plus)"
          :tone="pod.tone"
        />
      </div>

      <div class="core__center">
        <CircularHud :value="data.completionRate" :planned="data.plannedProgress" />
        <div class="core__tracks">
          <div class="track-row">
            <span>计划进度</span>
            <ProgressTrack :value="data.plannedProgress" tone="ongoing" :height="5" />
            <em>{{ data.plannedProgress }}%</em>
          </div>
          <div class="track-row">
            <span>实际进度</span>
            <ProgressTrack :value="data.completionRate" tone="normal" :height="5" />
            <em>{{ data.completionRate }}%</em>
          </div>
          <div class="track-gap" :class="data.progressGap >= 0 ? 'is-up' : 'is-down'">
            进度差 <strong>{{ data.progressGapLabel }}</strong>
          </div>
        </div>
      </div>

      <div class="core__dims">
        <button
          v-for="dim in data.dimensions"
          :key="dim.key"
          type="button"
          class="dim"
          @click="goDimension(dim.key)"
        >
          <RingStat
            :label="dim.label"
            :value="Math.round(dim.completion)"
            :level="dim.riskLevel"
            :trend-label="dim.trendLabel"
            :size="66"
          />
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.core {
  position: relative;
  z-index: 3;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 2px 8px 2px;
}

.core__bg {
  z-index: 0;
}

.core__label {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  padding: 2px 4px 0;
}

.core__grid {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 0.86fr 1.62fr 0.94fr;
  gap: 4px;
  align-items: center;
}

.core__pods {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  justify-content: center;

  // arc toward the core: middle rows hug the ring closest
  > :nth-child(1),
  > :nth-child(6) { transform: translateX(0); }
  > :nth-child(2),
  > :nth-child(5) { transform: translateX(11px); }
  > :nth-child(3),
  > :nth-child(4) { transform: translateX(22px); }
}

.core__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  position: relative;
}

.core__tracks {
  width: 100%;
  max-width: 320px;
  margin-top: 4px;
}

.track-row {
  display: grid;
  grid-template-columns: 60px 1fr 46px;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;

  span { font-size: 12px; color: var(--uni-text-secondary); }
  em {
    font-style: normal;
    font-family: var(--uni-font-number);
    font-size: 15px;
    text-align: right;
    color: var(--uni-text-primary);
  }
}

.track-gap {
  text-align: center;
  font-size: 13px;
  color: var(--uni-text-secondary);
  margin-top: 1px;

  strong { font-family: var(--uni-font-number); font-size: 17px; margin-left: 4px; }
  &.is-up strong { color: var(--uni-status-normal); }
  &.is-down strong { color: var(--uni-status-attention); }
}

.core__dims {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px 4px;
  align-content: center;
  justify-items: start;

  // arc toward the core: middle row hugs the ring closest
  // (margin, not transform, so :hover lift stays intact)
  > :nth-child(1),
  > :nth-child(2),
  > :nth-child(5),
  > :nth-child(6) { margin-left: -6px; }
  > :nth-child(3),
  > :nth-child(4) { margin-left: -18px; }
}

.dim {
  background: none;
  border: none;
  padding: 4px 0;
  cursor: pointer;
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }
}

.core__state {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--uni-text-secondary);
  font-size: var(--uni-fs-body);

  &--error { color: var(--uni-status-attention); }

  button {
    padding: 4px 14px;
    color: var(--uni-accent-cyan);
    background: rgba(51, 217, 255, 0.08);
    border: 1px solid var(--uni-border);
    cursor: pointer;
  }
}
</style>
