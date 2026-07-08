<script setup lang="ts">
import { NSkeleton } from 'naive-ui'
</script>

<template>
  <main class="uni-overview-grid skeleton-main">
    <div class="uni-overview-goals skeleton-panel"><NSkeleton text width="50%" /><NSkeleton text :repeat="4" /></div>
    <div class="uni-overview-hero skeleton-panel skeleton-panel--hero"><NSkeleton text width="40%" /><NSkeleton circle :width="120" :height="120" /></div>
    <div class="uni-overview-benchmark skeleton-panel"><NSkeleton text width="55%" /><NSkeleton text :repeat="3" /></div>
    <div class="uni-overview-discipline skeleton-panel"><NSkeleton text width="60%" /><NSkeleton text :repeat="3" /></div>
    <div class="uni-overview-research skeleton-panel"><NSkeleton text width="45%" /><NSkeleton text :repeat="3" /></div>
    <div class="uni-overview-employment skeleton-panel"><NSkeleton text width="55%" /><NSkeleton text :repeat="3" /></div>
  </main>
</template>

<style scoped lang="scss">
.skeleton-main { flex: 1; min-height: 0; }
.skeleton-panel {
  display: flex; flex-direction: column; gap: 10px; padding: 12px;
  background: rgba(4, 14, 38, 0.45); border: 1px solid rgba(0, 212, 255, 0.1); min-height: 0;
  &--hero { align-items: center; }
}
</style>
