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
        <div class="core__hud-wrap">
          <CircularHud :value="data.completionRate" :planned="data.plannedProgress" />
        </div>
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
            :size="50"
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
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.5fr) minmax(0, 0.9fr);
  gap: 8px;
  align-items: stretch;
}

.core__pods {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 5px;
  align-content: center;
  padding-right: 2px;

  :deep(.pill) {
    padding: 4px 8px;
    column-gap: 6px;
  }

  :deep(.pill__value) {
    font-size: var(--uni-fs-caption);
  }

  :deep(.pill__label) {
    font-size: var(--uni-fs-meta);
  }
}

.core__center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 0;
  min-width: 0;
  gap: 4px;
}

.core__hud-wrap {
  flex: 1 1 0;
  min-height: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  :deep(.hud) {
    height: 100%;
    width: auto;
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1;
    margin: 0;
  }
}

.core__tracks {
  flex-shrink: 0;
  width: 100%;
  max-width: 100%;
  padding: 0 2px;
}

.track-row {
  display: grid;
  grid-template-columns: 68px 1fr 48px;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;

  span { font-size: var(--uni-fs-label); color: var(--uni-text-secondary); }
  em {
    font-style: normal;
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-caption);
    text-align: right;
    color: var(--uni-text-primary);
  }
}

.track-gap {
  text-align: center;
  font-size: var(--uni-fs-meta);
  color: var(--uni-text-secondary);
  margin-top: 0;

  strong { font-family: var(--uni-font-number); font-size: var(--uni-fs-caption); margin-left: 4px; }
  &.is-up strong { color: var(--uni-status-normal); }
  &.is-down strong { color: var(--uni-status-attention); }
}

.core__dims {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px 6px;
  align-content: center;
  justify-items: center;
  padding-left: 2px;
}

.dim {
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  transition: transform 0.2s;
  max-width: 100%;

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
