<script setup lang="ts">
import type { AttentionItemVM } from '@/types/student/view'

defineProps<{
  items: AttentionItemVM[]
}>()

const levelClass: Record<string, string> = {
  high: 'warn--high',
  medium: 'warn--medium',
  low: 'warn--low',
}
</script>

<template>
  <div class="stu-ticker" aria-label="学生风险预警滚动">
    <span class="stu-ticker__label">
      <i class="stu-ticker__pulse" />
      实时预警
    </span>
    <div class="stu-ticker__track">
      <div class="stu-ticker__content">
        <span
          v-for="(item, idx) in [...items, ...items]"
          :key="`${item.id}-${idx}`"
          class="stu-ticker__item"
          :class="levelClass[item.level]"
        >
          <em>{{ item.category }}</em>
          {{ item.label }}
        </span>
      </div>
    </div>
  </div>
</template>
