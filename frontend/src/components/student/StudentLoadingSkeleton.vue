<script setup lang="ts">
import { NSkeleton } from 'naive-ui'
import StudentScreenLayout from '@/components/student/StudentScreenLayout.vue'
import '@/styles/student/student.scss'
</script>

<template>
  <StudentScreenLayout>
    <div class="student-grid skeleton-grid">
      <div class="cell-left-stack">
        <div class="skeleton-panel stack-personal">
          <NSkeleton circle :width="80" :height="80" />
          <div class="skeleton-lines">
            <NSkeleton text :repeat="2" />
            <NSkeleton text width="60%" />
          </div>
          <NSkeleton text :repeat="5" />
        </div>
        <div class="skeleton-panel stack-academic">
          <NSkeleton text width="40%" />
          <NSkeleton height="72%" />
        </div>
      </div>

      <div class="skeleton-panel cell-radar">
        <NSkeleton text width="35%" />
        <NSkeleton circle :width="160" :height="160" class="radar-ring" />
      </div>

      <div class="skeleton-panel cell-ai">
        <NSkeleton text width="50%" />
        <NSkeleton text :repeat="6" />
        <NSkeleton height="28%" />
      </div>

      <div class="cell-middle-pair">
        <div class="skeleton-panel pair-intern">
          <NSkeleton text width="45%" />
          <NSkeleton height="70%" />
        </div>
        <div class="skeleton-panel pair-comp">
          <NSkeleton text width="45%" />
          <NSkeleton height="70%" />
        </div>
      </div>

      <div class="cell-footer">
        <NSkeleton height="36px" :sharp="false" />
      </div>
    </div>
  </StudentScreenLayout>
</template>

<style scoped lang="scss">
.skeleton-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: minmax(0, 1.36fr) minmax(0, 0.62fr) minmax(0, 0.62fr) 56px;
  gap: 12px;
}

.cell-left-stack {
  grid-row: 1 / 4;
  grid-column: 1 / span 2;
  display: grid;
  grid-template-rows: minmax(0, 0.52fr) minmax(0, 0.48fr);
  gap: 12px;
  min-height: 0;
}

.cell-radar {
  grid-row: 1;
  grid-column: 3 / span 2;
}

.cell-ai {
  grid-row: 1 / 4;
  grid-column: 5 / span 2;
  min-height: 0;
}

.cell-middle-pair {
  grid-row: 2 / 4;
  grid-column: 3 / span 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  min-height: 0;
}

.cell-footer {
  grid-row: 4;
  grid-column: 1 / -1;
}

.skeleton-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
  background: rgba(6, 18, 42, 0.55);
  min-height: 0;
  min-width: 0;
}

.stack-personal {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}

.skeleton-lines {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radar-ring {
  align-self: center;
  margin-top: 8px;
}

:deep(.n-skeleton) {
  --n-color-start: rgba(0, 184, 255, 0.06);
  --n-color-end: rgba(0, 212, 255, 0.14);
}
</style>
