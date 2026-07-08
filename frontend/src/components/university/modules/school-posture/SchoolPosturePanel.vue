<script setup lang="ts">
import CircularHud from '@/components/university/CircularHud.vue'
import GlowMetricCard from '@/components/university/GlowMetricCard.vue'
import HudSectionLabel from '@/components/university/HudSectionLabel.vue'
import BackgroundGlowLayer from '@/components/university/BackgroundGlowLayer.vue'
import type { SchoolPostureVM } from '@/types/university/view'

defineProps<{
  data: SchoolPostureVM
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()

const kpiTones = ['cyan', 'ongoing', 'violet', 'green', 'cyan', 'ongoing'] as const
</script>

<template>
  <section class="posture">
    <BackgroundGlowLayer class="posture__bg" variant="center" />
    <header class="posture__label">
      <HudSectionLabel :index="1" title="学校综合态势" />
    </header>

    <div v-if="loading" class="posture__state">数据加载中</div>
    <div v-else-if="error" class="posture__state posture__state--error">
      <span>{{ error }}</span>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>

    <div v-else class="posture__body">
      <div class="posture__hero">
        <CircularHud :value="data.developmentIndex" :planned="data.developmentIndex" label="发展指数" />
        <div class="posture__hero-label">
          <strong>核心发展指数</strong>
          <span>{{ data.developmentIndexLabel }}</span>
        </div>
      </div>

      <div class="posture__grid">
        <GlowMetricCard
          v-for="(m, i) in data.metrics"
          :key="m.label"
          :label="m.label"
          :value="m.value"
          :unit="m.unit"
          :tone="kpiTones[i % kpiTones.length]"
          size="sm"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.posture {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 10px 12px;
  background: rgba(6, 18, 36, 0.55);
  border: 1px solid rgba(51, 217, 255, 0.18);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%);
}

.posture__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.posture__label {
  position: relative;
  z-index: 1;
  margin-bottom: 8px;
}

.posture__state {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--uni-text-muted);
  font-size: 14px;

  &--error { color: var(--uni-status-attention); gap: 8px; }
  button {
    padding: 4px 12px;
    border: 1px solid rgba(51, 217, 255, 0.3);
    background: transparent;
    color: var(--uni-accent-cyan);
    cursor: pointer;
  }
}

.posture__body {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.posture__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.posture__hero-label {
  text-align: center;

  strong {
    display: block;
    font-size: 14px;
    color: var(--uni-text-primary);
    letter-spacing: 0.08em;
  }

  span {
    font-family: var(--uni-font-number);
    font-size: 22px;
    color: var(--uni-accent-cyan);
    text-shadow: 0 0 12px rgba(51, 217, 255, 0.4);
  }
}

.posture__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  overflow-y: auto;
  scrollbar-width: thin;
}
</style>
