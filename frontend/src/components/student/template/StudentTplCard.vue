<script setup lang="ts">
import DashIcon, { type IconKind } from '@/components/college/DashIcon.vue'
import StuHint from './StuHint.vue'

withDefaults(
  defineProps<{
    title: string
    icon?: IconKind
    extra?: string
    loading?: boolean
    error?: string | null
    /** 领导审定：中上区不要标题栏 */
    hideHeader?: boolean
    /** 面板标题悬停说明（新手友好） */
    tip?: string
  }>(),
  { icon: undefined, hideHeader: false },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <section class="ref-panel" :class="{ 'ref-panel--no-head': hideHeader }">
    <header v-if="!hideHeader" class="ref-panel__head">
      <h3 class="ref-panel__title">
        <span v-if="icon" class="ref-panel__icon" aria-hidden="true">
          <DashIcon :kind="icon" :size="18" />
        </span>
        <StuHint v-if="tip" :tip="tip">{{ title }}</StuHint>
        <template v-else>{{ title }}</template>
      </h3>
      <span v-if="extra" class="ref-panel__extra">{{ extra }}</span>
      <slot name="header-extra" />
    </header>
    <div v-if="loading" class="ref-panel__body ref-panel__placeholder">加载中…</div>
    <div v-else-if="error" class="ref-panel__body ref-panel__placeholder">
      {{ error }}
      <button type="button" @click="$emit('retry')">重试</button>
    </div>
    <div v-else class="ref-panel__body">
      <slot />
    </div>
  </section>
</template>

<style scoped lang="scss">
.ref-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 2px;
  border: 1px solid rgba(120, 210, 255, 0.32);
  background: linear-gradient(155deg, rgba(6, 36, 70, 0.82), rgba(2, 12, 30, 0.9));
  backdrop-filter: blur(10px) saturate(1.1);
  box-shadow:
    0 0 24px rgba(0, 100, 180, 0.12),
    inset 0 1px 0 rgba(160, 220, 255, 0.1);
  overflow: hidden;

  &--no-head .ref-panel__body {
    padding-top: 10px;
  }
}

.ref-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 38px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(0, 180, 255, 0.12);
}

.ref-panel__title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #e8f4ff;
  letter-spacing: 0.04em;
}

.ref-panel__icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  border: 1px solid rgba(120, 210, 255, 0.35);
  border-radius: 2px;
  background:
    linear-gradient(145deg, rgba(0, 120, 200, 0.28), rgba(0, 40, 80, 0.4));
  box-shadow:
    inset 0 1px 0 rgba(180, 230, 255, 0.12),
    0 0 12px rgba(0, 160, 220, 0.16);
}

.ref-panel__extra {
  font-size: 12px;
  color: rgba(142, 180, 216, 0.85);
  white-space: nowrap;
}

.ref-panel__body {
  flex: 1;
  min-height: 0;
  padding: 14px 16px;
}

.ref-panel__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8eb4d8;
  font-size: 14px;

  button {
    padding: 4px 12px;
    border-radius: 6px;
    border: 1px solid rgba(0, 200, 255, 0.35);
    background: rgba(0, 100, 180, 0.25);
    color: #7ff6ff;
    cursor: pointer;
  }
}
</style>
