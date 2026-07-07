<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'

defineProps<{
  title: string
  subtitle?: string
}>()

const router = useRouter()

function goBack() {
  router.push(ROUTES.university.root)
}
</script>

<template>
  <div class="university-detail">
    <header class="university-detail__header">
      <button type="button" class="university-detail__back" @click="goBack">← 返回驾驶舱</button>
      <div class="university-detail__title">
        <h1>{{ title }}</h1>
        <span v-if="subtitle">{{ subtitle }}</span>
      </div>
    </header>
    <main class="university-detail__body">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.university-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.university-detail__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 4px 12px;
  border-bottom: 1px solid rgba(102, 217, 255, 0.1);
  flex-shrink: 0;
}

.university-detail__back {
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid rgba(0, 184, 255, 0.25);
  background: rgba(0, 184, 255, 0.08);
  color: #55dfff;
  cursor: pointer;
  font-size: $college-fs-body;
}

.university-detail__title {
  h1 {
    font-size: 20px;
    color: #f3f8ff;
    margin-bottom: 2px;
  }

  span {
    font-size: $college-fs-label;
    color: rgba(174, 198, 230, 0.68);
  }
}

.university-detail__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding-top: 12px;
}
</style>
