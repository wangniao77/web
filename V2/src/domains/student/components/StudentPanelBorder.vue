<script setup lang="ts">
/**
 * 学生大屏面板外框（科技风，与学院驾驶舱对齐）。
 * 切角边框 + 呼吸辉光 + 顶部扫描光线 + 渐变标题栏。
 * 保留 variant 入参以兼容各面板调用，不再使用 DataV 边框。
 */
withDefaults(
  defineProps<{
    variant?: '8' | '13'
  }>(),
  { variant: '8' },
)
</script>

<template>
  <div class="cockpit-frame" :class="`cockpit-frame--${variant}`">
    <span class="cockpit-frame__scan" aria-hidden="true" />
    <slot />
  </div>
</template>

<style scoped lang="scss">
.cockpit-frame {
  position: relative;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 200, 255, 0.45);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0) 15%),
    linear-gradient(150deg, rgba(24, 60, 116, 0.4) 0%, rgba(8, 24, 60, 0.26) 46%, rgba(3, 13, 38, 0.36) 100%);
  backdrop-filter: blur(16px) saturate(1.25);
  -webkit-backdrop-filter: blur(16px) saturate(1.25);
  clip-path: polygon(
    0 12px, 12px 0,
    calc(100% - 12px) 0, 100% 12px,
    100% calc(100% - 12px), calc(100% - 12px) 100%,
    12px 100%, 0 calc(100% - 12px)
  );
  box-shadow:
    0 0 16px rgba(0, 180, 255, 0.26),
    inset 0 0 26px rgba(0, 127, 255, 0.12);
  animation: framePulse 4.5s ease-in-out infinite;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border: 1px solid rgba(57, 230, 255, 0.16);
    clip-path: inherit;
  }
}

// 顶部扫描光线
.cockpit-frame__scan {
  position: absolute;
  top: 0;
  left: 14px;
  right: 14px;
  height: 1px;
  z-index: 3;
  pointer-events: none;
  background: linear-gradient(90deg, transparent, #39e6ff, transparent);
  box-shadow: 0 0 12px rgba(57, 230, 255, 0.9);
  animation: frameTopScan 3.5s ease-in-out infinite;
}

// ── 让内层 CollegePanelCard 透明，露出本层科技风外框 ──
:deep(.panel) {
  height: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;

  &::before,
  &::after {
    display: none;
  }

  &:hover {
    border: 0;
    background: transparent;
    box-shadow: none;
    transform: none;
  }
}

:deep(.panel-glow) {
  display: none;
}

// ── 标题栏：渐变条 + 分隔线（对齐学院驾驶舱） ──
:deep(.panel-header) {
  height: 40px;
  border-bottom: 1px solid rgba(57, 230, 255, 0.24);
  background: linear-gradient(90deg, rgba(0, 131, 255, 0.32), rgba(2, 16, 45, 0.28) 62%);
}

:deep(.panel-num) {
  color: #77ddff;
  text-shadow: 0 0 8px rgba(57, 230, 255, 0.55);
}

:deep(.panel-title) {
  color: #f4fbff;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(0, 12, 36, 0.95), 0 0 8px rgba(57, 230, 255, 0.35);
}

// ── 标题图标做成发光小方框（对齐学院 .panel__icon） ──
:deep(.header-icon) {
  width: 24px;
  height: 24px;
  padding: 4px;
  border-radius: 5px;
  background: rgba(0, 171, 255, 0.16);
  color: #5cecff;
  box-shadow: inset 0 0 8px rgba(57, 230, 255, 0.28), 0 0 10px rgba(57, 230, 255, 0.22);
  filter: none;
}

@keyframes framePulse {
  0%, 100% {
    box-shadow: 0 0 14px rgba(0, 180, 255, 0.26), inset 0 0 20px rgba(0, 127, 255, 0.18);
  }
  50% {
    box-shadow: 0 0 22px rgba(0, 200, 255, 0.46), inset 0 0 26px rgba(0, 150, 255, 0.26);
  }
}

@keyframes frameTopScan {
  0%, 100% { opacity: 0.5; filter: brightness(1); }
  50%      { opacity: 1;   filter: brightness(1.4); }
}

@media (prefers-reduced-motion: reduce) {
  .cockpit-frame,
  .cockpit-frame__scan {
    animation: none;
  }
}
</style>
