<script setup lang="ts">
// Ambient depth glow that sits behind the central data core.
// Pure layered radial gradients + blur, pointer-events none.
withDefaults(defineProps<{ variant?: 'center' | 'edge' }>(), { variant: 'center' })
</script>

<template>
  <div class="glow-layer" :class="`glow-layer--${variant}`" aria-hidden="true">
    <span class="glow-layer__core" />
    <span class="glow-layer__ring" />
  </div>
</template>

<style scoped lang="scss">
.glow-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}

.glow-layer--center {
  display: grid;
  place-items: center;

  .glow-layer__core {
    position: absolute;
    top: 45%;
    left: 50%;
    width: 1140px;
    height: 920px;
    transform: translate(-50%, -50%);
    background:
      radial-gradient(circle at 50% 48%, rgba(51, 217, 255, 0.32), transparent 56%),
      radial-gradient(circle at 50% 42%, rgba(45, 150, 255, 0.2), transparent 66%),
      radial-gradient(circle at 50% 60%, rgba(124, 139, 255, 0.12), transparent 72%);
    filter: blur(62px);
    animation: glow-breathe 8s ease-in-out infinite;
  }

  .glow-layer__ring {
    position: absolute;
    top: 45%;
    left: 50%;
    width: 520px;
    height: 520px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle, transparent 55%, rgba(51, 217, 255, 0.13) 64%, transparent 76%);
    filter: blur(10px);
  }
}

@keyframes glow-breathe {
  0%, 100% { opacity: 0.82; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.06); }
}
</style>
