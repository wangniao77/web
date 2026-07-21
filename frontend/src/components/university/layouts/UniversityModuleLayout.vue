<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ROUTES } from '@/constants/routes'
import ModuleSectionNav from '@/components/university/shared/ModuleSectionNav.vue'

defineProps<{
  title: string
  subtitle?: string
  sections: ReadonlyArray<{ key: string; label: string }>
}>()

const router = useRouter()
</script>

<template>
  <div class="module-layout">
    <header class="module-layout__header">
      <button type="button" class="module-layout__back" @click="router.push(ROUTES.university.root)">← 返回驾驶舱</button>
      <div>
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
    </header>
    <div class="module-layout__body">
      <ModuleSectionNav :sections="sections" />
      <main class="module-layout__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.module-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 4px;
}
.module-layout__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(90, 170, 255, 0.12);
  flex-shrink: 0;
  h1 { font-size: 18px; color: var(--uni-text-primary); margin: 0; }
  p { font-size: 13px; color: var(--uni-text-muted); margin: 4px 0 0; }
}
.module-layout__back {
  padding: 6px 12px;
  border: 1px solid rgba(51, 217, 255, 0.3);
  background: rgba(51, 217, 255, 0.08);
  color: var(--uni-accent-cyan);
  cursor: pointer;
  font-size: 13px;
}
.module-layout__body {
  flex: 1;
  min-height: 0;
  display: flex;
  gap: 16px;
  padding-top: 12px;
}
.module-layout__main {
  flex: 1;
  min-height: 0;
  min-width: 0;
}
</style>
