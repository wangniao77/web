<script setup lang="ts">
import { NSkeleton } from 'naive-ui'
</script>

<template>
  <div class="university-grid skeleton-grid">
    <div class="cell-ranking skeleton-panel">
      <NSkeleton text width="40%" />
      <NSkeleton text :repeat="6" />
    </div>
    <div class="cell-hub skeleton-panel">
      <NSkeleton text width="35%" />
      <NSkeleton circle :width="140" :height="140" class="hub-ring" />
    </div>
    <div class="cell-employ skeleton-panel">
      <NSkeleton text width="45%" />
      <NSkeleton text :repeat="4" />
      <NSkeleton height="60%" />
    </div>
    <div class="cell-news skeleton-panel">
      <NSkeleton text width="50%" />
      <NSkeleton text :repeat="5" />
    </div>
    <div class="cell-tasks skeleton-panel">
      <NSkeleton text width="45%" />
      <NSkeleton text :repeat="6" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.skeleton-grid {
  flex: 1;
  min-height: 0;
}

.skeleton-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 8px;
  background: rgba(4, 14, 38, 0.45);
  border: 1px solid rgba(0, 212, 255, 0.1);
  min-height: 0;
}

.hub-ring {
  margin: auto;
}
</style>
