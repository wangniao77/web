<script setup lang="ts">
import { useRouter } from 'vue-router'
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import CircularHud from '@/components/university/CircularHud.vue'
import FloatingMetricPill from '@/components/university/FloatingMetricPill.vue'
import ProgressTrack from '@/components/university/ProgressTrack.vue'
import { ROUTES } from '@/constants/routes'
import type { GoalOverviewVM } from '@/types/university/view'

const props = defineProps<{
  data: GoalOverviewVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const router = useRouter()

const pods = [
  { label: '年度重点目标', key: 'totalTasks', tone: 'cyan' },
  { label: '风险任务', key: 'riskTasks', tone: 'warn' },
  { label: '逾期事项', key: 'overdueTasks', tone: 'danger' },
] as const

function podValue(key: keyof GoalOverviewVM) {
  return props.data[key] as number
}
</script>

<template>
  <FuturisticPanel
    :index="2"
    title="目标总览"
    :detail-to="ROUTES.university.tasks"
    accent="cyan"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="goal">
      <div class="goal__main">
        <div class="goal__ring">
          <CircularHud :value="data.completionRate" :planned="data.plannedProgress" />
          <span class="goal__ring-label">年度完成率</span>
        </div>

        <div class="goal__metrics">
          <FloatingMetricPill
            v-for="pod in pods"
            :key="pod.key"
            :label="pod.label"
            :value="podValue(pod.key)"
            :tone="pod.tone"
          />
          <div class="goal__tracks">
            <div class="track-row">
              <span>计划进度</span>
              <ProgressTrack :value="data.plannedProgress" tone="ongoing" :height="4" />
              <em>{{ data.plannedProgress }}%</em>
            </div>
            <div class="track-row">
              <span>进度差距</span>
              <ProgressTrack :value="Math.abs(data.progressGap)" :tone="data.progressGap >= 0 ? 'normal' : 'attention'" :height="4" />
              <em :class="data.progressGap >= 0 ? 'is-up' : 'is-down'">{{ data.progressGapLabel }}</em>
            </div>
          </div>
        </div>
      </div>

      <div v-if="data.dimensions.length" class="goal__dims">
        <button
          v-for="dim in data.dimensions.slice(0, 4)"
          :key="dim.key"
          type="button"
          class="goal__dim"
          @click="router.push(ROUTES.university.tasks)"
        >
          <span>{{ dim.label }}</span>
          <strong>{{ dim.completionLabel }}</strong>
        </button>
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.goal {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.goal__main {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
}

.goal__ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  :deep(.circular-hud) { transform: scale(0.72); transform-origin: center; }
}

.goal__ring-label {
  font-size: 11px;
  color: var(--uni-text-muted);
  letter-spacing: 0.06em;
}

.goal__metrics {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal__tracks {
  padding-top: 4px;
}

.track-row {
  display: grid;
  grid-template-columns: 56px 1fr 42px;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;

  span { font-size: 11px; color: var(--uni-text-secondary); }
  em {
    font-style: normal;
    font-family: var(--uni-font-number);
    font-size: 13px;
    text-align: right;
    color: var(--uni-text-primary);

    &.is-up { color: var(--uni-status-normal); }
    &.is-down { color: var(--uni-status-attention); }
  }
}

.goal__dims {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.goal__dim {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s;

  span { font-size: 11px; color: var(--uni-text-muted); }
  strong {
    font-family: var(--uni-font-number);
    font-size: 14px;
    color: var(--uni-accent-cyan);
  }

  &:hover { border-color: rgba(51, 217, 255, 0.35); }
}
</style>
