<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import PanelHeader from '@/domains/university/components/PanelHeader.vue'

withDefaults(
  defineProps<{
    title: string
    index?: number
    detailTo?: RouteLocationRaw
    loading?: boolean
    error?: string | null
    variant?: 'default' | 'core'
    accent?: 'cyan' | 'blue' | 'violet' | 'green' | 'gold' | 'red'
  }>(),
  { variant: 'default', accent: 'cyan' },
)

defineEmits<{ retry: [] }>()
</script>

<template>
  <article class="fp" :class="[`fp--${variant}`, `fp--accent-${accent}`]">
    <div class="fp__clip">
      <div class="fp__surface" />
      <span class="fp__corner fp__corner--tl" aria-hidden="true" />
      <span class="fp__corner fp__corner--br" aria-hidden="true" />

      <div class="fp__content">
        <PanelHeader :title="title" :index="index" :detail-to="loading || error ? undefined : detailTo">
          <template v-if="$slots.actions" #actions>
            <slot name="actions" />
          </template>
        </PanelHeader>

        <div v-if="loading" class="fp__state">
          <span class="fp__spinner" />数据加载中
        </div>
        <div v-else-if="error" class="fp__state fp__state--error">
          <span>{{ error }}</span>
          <button type="button" @click="$emit('retry')">重试</button>
        </div>
        <div v-else class="fp__body">
          <slot />
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped lang="scss">
.fp {
  position: relative;
  height: 100%;
  min-height: 0;
  filter: drop-shadow(0 10px 30px rgba(2, 8, 20, 0.45));
}

.fp__clip {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1.2px;
  clip-path: polygon(
    0 0,
    calc(100% - var(--uni-clip)) 0,
    100% var(--uni-clip),
    100% 100%,
    var(--uni-clip) 100%,
    0 calc(100% - var(--uni-clip))
  );
  background: linear-gradient(150deg, rgba(90, 170, 255, 0.22), rgba(90, 170, 255, 0.05) 45%, rgba(51, 217, 255, 0.14));
}

.fp__surface {
  position: absolute;
  inset: 1.2px;
  clip-path: inherit;
  background: var(--uni-panel-bg);
  backdrop-filter: blur(6px);
}

.fp__content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.fp__corner {
  position: absolute;
  width: 16px;
  height: 16px;
  z-index: 3;
  pointer-events: none;

  &--tl {
    top: 6px;
    left: 6px;
    border-top: 1.5px solid rgba(51, 217, 255, 0.7);
    border-left: 1.5px solid rgba(51, 217, 255, 0.7);
    filter: drop-shadow(0 0 3px rgba(51, 217, 255, 0.35));
  }

  &--br {
    right: 6px;
    bottom: 6px;
    border-bottom: 1.5px solid rgba(51, 217, 255, 0.7);
    border-right: 1.5px solid rgba(51, 217, 255, 0.7);
    filter: drop-shadow(0 0 3px rgba(51, 217, 255, 0.35));
  }
}

.fp__body {
  flex: 1;
  min-height: 0;
  padding: 4px var(--uni-pad-module) var(--uni-pad-module);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.fp__state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
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

.fp__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(140, 200, 255, 0.14);
  border-top-color: var(--uni-accent-cyan);
  border-radius: 50%;
  animation: fp-spin 0.75s linear infinite;
}

// Central data-core panel: stronger presence
.fp--core {
  filter: drop-shadow(0 14px 44px rgba(2, 12, 28, 0.6));

  .fp__clip {
    background: linear-gradient(150deg, rgba(51, 217, 255, 0.5), rgba(90, 170, 255, 0.12) 50%, rgba(124, 139, 255, 0.32));
  }

  .fp__surface {
    background:
      radial-gradient(90% 70% at 50% 30%, rgba(51, 217, 255, 0.1), transparent 62%),
      var(--uni-panel-bg);
  }
}

.fp--accent-gold {
  .fp__corner--tl,
  .fp__corner--br {
    border-color: var(--uni-status-attention);
    filter: drop-shadow(0 0 4px rgba(255, 176, 87, 0.5));
  }
}

@keyframes fp-spin { to { transform: rotate(360deg); } }
</style>
