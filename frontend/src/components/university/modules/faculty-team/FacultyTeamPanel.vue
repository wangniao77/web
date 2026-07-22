<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import ProgressTrack from '@/components/university/ProgressTrack.vue'
import { ROUTES } from '@/constants/routes'
import type { FacultySummaryVM } from '@/types/university/view'

defineProps<{
  data: FacultySummaryVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="5"
    title="师资队伍"
    :detail-to="ROUTES.university.faculty"
    accent="gold"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="faculty">
      <div class="faculty__top">
        <GlowMetricCard label="教师总量" :value="String(data.total)" unit="人" tone="cyan" size="lg" />
        <GlowMetricCard label="专任教师" :value="String(data.fullTime)" unit="人" tone="ongoing" />
        <GlowMetricCard label="高层次人才" :value="String(data.highLevelTalent)" unit="人" tone="violet" />
      </div>

      <div class="faculty__ratios">
        <div class="ratio">
          <div class="ratio__head">
            <span>博士教师比例</span>
            <strong>{{ data.phdRatio.toFixed(1) }}%</strong>
          </div>
          <ProgressTrack :value="data.phdRatio" tone="ongoing" :height="6" />
        </div>
        <div class="ratio">
          <div class="ratio__head">
            <span>教授比例</span>
            <strong>{{ data.professorRatio.toFixed(1) }}%</strong>
          </div>
          <ProgressTrack :value="data.professorRatio" tone="normal" :height="6" />
        </div>
      </div>

      <div class="faculty__foot">
        <GlowMetricCard label="青年教师培养" :value="String(data.youngFaculty)" unit="人" tone="green" size="sm" />
      </div>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.faculty {
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  min-height: 0;
}

.faculty__top {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 6px;
}

.faculty__ratios {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(8, 22, 42, 0.4);
  border: 1px solid rgba(90, 170, 255, 0.1);
}

.ratio__head {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--uni-text-secondary);

  strong {
    font-family: var(--uni-font-number);
    color: var(--uni-accent-cyan);
  }
}

.faculty__foot {
  margin-top: auto;
}
</style>
