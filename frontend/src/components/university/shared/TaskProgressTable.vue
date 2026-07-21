<script setup lang="ts">
import type { ModuleTableRowDTO } from '@/types/university/api/modules'

defineProps<{ rows: ModuleTableRowDTO[]; limit?: number }>()
</script>

<template>
  <table class="task-table">
    <thead>
      <tr><th>核心任务名称</th><th>责任单位</th><th>当前进度</th></tr>
    </thead>
    <tbody>
      <tr v-for="row in rows.slice(0, limit ?? 4)" :key="row.name">
        <td>{{ row.name }}</td>
        <td>{{ row.dept ?? '—' }}</td>
        <td>
          <div class="bar"><span :style="{ width: `${row.progress ?? 0}%` }" /></div>
          <em>{{ row.progress ?? 0 }}%</em>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped lang="scss">
.task-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--uni-fs-small);
  th, td { padding: 5px 8px; text-align: left; border-bottom: 1px solid rgba(90,170,255,0.08); }
  th { color: var(--uni-text-muted); font-weight: 500; }
  td { color: var(--uni-text-primary); }
  .bar {
    display: inline-block; width: 56px; height: 5px; background: rgba(90,170,255,0.14); vertical-align: middle; margin-right: 6px;
    span { display: block; height: 100%; background: var(--uni-accent-cyan); }
  }
  em { font-style: normal; color: var(--uni-accent-cyan); font-size: var(--uni-fs-micro); }
}
</style>
