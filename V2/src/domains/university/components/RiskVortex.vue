<script setup lang="ts">
withDefaults(
  defineProps<{
    value: string | number
    label?: string
    caption?: string
    tone?: 'gold' | 'red'
  }>(),
  { tone: 'gold', label: '风险解除率' },
)
</script>

<template>
  <div class="vortex" :class="`vortex--${tone}`">
    <div class="vortex__glow" aria-hidden="true" />
    <div class="vortex__swirl" aria-hidden="true" />
    <div class="vortex__ring vortex__ring--1" aria-hidden="true" />
    <div class="vortex__ring vortex__ring--2" aria-hidden="true" />
    <div class="vortex__core">
      <strong>{{ value }}</strong>
      <span>{{ label }}</span>
    </div>
    <p v-if="caption" class="vortex__caption">{{ caption }}</p>
  </div>
</template>

<style scoped lang="scss">
.vortex {
  --v-color: #ffb057;
  --v-glow: rgba(255, 176, 87, 0.5);
  position: relative;
  width: 88px;
  height: 88px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &--red {
    --v-color: #ff6b78;
    --v-glow: rgba(255, 107, 120, 0.5);
  }
}

.vortex__glow {
  position: absolute;
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--v-glow), transparent 62%);
  filter: blur(6px);
}

.vortex__swirl {
  position: absolute;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(from 0deg, transparent, var(--v-glow), transparent 55%, var(--v-glow), transparent);
  mask: radial-gradient(circle, transparent 34%, #000 36%, #000 68%, transparent 70%);
  animation: v-spin 8s linear infinite;
  opacity: 0.8;
}

.vortex__ring {
  position: absolute;
  border-radius: 50%;
  border: 1px dashed color-mix(in srgb, var(--v-color) 55%, transparent);

  &--1 { width: 72px; height: 72px; animation: v-spin 14s linear infinite; }
  &--2 { width: 96px; height: 96px; animation: v-spin 22s linear infinite reverse; border-color: color-mix(in srgb, var(--v-color) 30%, transparent); }
}

.vortex__core {
  position: relative;
  z-index: 2;
  text-align: center;

  strong {
    display: block;
    font-family: var(--uni-font-number);
    font-size: var(--uni-fs-body);
    font-weight: 700;
    line-height: 1;
    color: #eaf4ff;
    text-shadow: 0 0 16px var(--v-glow);
  }

  span {
    display: block;
    margin-top: 5px;
    font-size: var(--uni-fs-meta);
    color: var(--uni-text-secondary);
    letter-spacing: 0.06em;
  }
}

.vortex__caption {
  display: none;
}

@keyframes v-spin { to { transform: rotate(360deg); } }
</style>
