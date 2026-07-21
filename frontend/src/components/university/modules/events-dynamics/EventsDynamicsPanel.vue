<script setup lang="ts">
import FuturisticPanel from '@/components/university/FuturisticPanel.vue'
import AlertSignalCard from '@/components/university/AlertSignalCard.vue'
import { ROUTES } from '@/constants/routes'
import type { SchoolEventVM } from '@/types/university/view'

defineProps<{
  events: SchoolEventVM[]
  loading?: boolean
  error?: string | null
}>()

defineEmits<{ retry: [] }>()
</script>

<template>
  <FuturisticPanel
    :index="10"
    title="学校事件与动态"
    :detail-to="ROUTES.university.events"
    accent="gold"
    :loading="loading"
    :error="error"
    @retry="$emit('retry')"
  >
    <div class="events">
      <AlertSignalCard
        v-for="item in events.slice(0, 4)"
        :key="item.id"
        :event="item"
      />
      <p v-if="!events.length" class="events__empty">暂无动态</p>
    </div>
  </FuturisticPanel>
</template>

<style scoped lang="scss">
.events {
  display: flex;
  flex-direction: column;
  gap: 6px;
  height: 100%;
  min-height: 0;
  overflow-y: auto;
}

.events__empty {
  flex: 1;
  display: grid;
  place-items: center;
  color: var(--uni-text-muted);
  font-size: 13px;
}
</style>
