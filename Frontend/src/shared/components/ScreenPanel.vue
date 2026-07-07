<script setup lang="ts">
import CockpitPanel from '@/domains/college/components/CockpitPanel.vue'
import CollegePanelCard from '@/domains/college/components/CollegePanelCard.vue'
import PanelCard from '@/shared/components/screen-legacy/PanelCard.vue'

withDefaults(
  defineProps<{
    variant?: 'simple' | 'glass' | 'cockpit'
    title?: string
    loading?: boolean
    error?: string | null
    number?: number
    icon?: string
    panelClass?: string
  }>(),
  {
    variant: 'simple',
    title: '',
    loading: false,
    error: null,
  },
)

defineEmits<{
  retry: []
}>()
</script>

<template>
  <CockpitPanel
    v-if="variant === 'cockpit'"
    :number="number ?? 0"
    :title="title"
    :icon="icon ?? ''"
    :panel-class="panelClass"
  >
    <slot />
  </CockpitPanel>

  <CollegePanelCard
    v-else-if="variant === 'glass'"
    :title="title"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <slot />
  </CollegePanelCard>

  <PanelCard v-else :title="title">
    <div v-if="loading" class="screen-panel__loading">加载中...</div>
    <div v-else-if="error" class="screen-panel__error">
      <p>{{ error }}</p>
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <slot v-else />
  </PanelCard>
</template>

<style scoped lang="scss">
.screen-panel__loading,
.screen-panel__error {
  display: grid;
  place-items: center;
  min-height: 80px;
  color: $color-text-muted;
  font-size: $college-fs-label;
}

.screen-panel__error button {
  margin-top: 8px;
  color: $color-accent;
  text-decoration: underline;
}
</style>
