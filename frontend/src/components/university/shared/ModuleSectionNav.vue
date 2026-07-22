<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps<{
  sections: ReadonlyArray<{ key: string; label: string }>
}>()

const route = useRoute()
const router = useRouter()

const active = computed(() => String(route.query.section ?? props.sections[0]?.key ?? ''))

function select(key: string) {
  router.replace({ query: { ...route.query, section: key } })
}
</script>

<template>
  <nav class="section-nav">
    <button
      v-for="s in sections"
      :key="s.key"
      type="button"
      class="section-nav__item"
      :class="{ 'section-nav__item--active': active === s.key }"
      @click="select(s.key)"
    >
      {{ s.label }}
    </button>
  </nav>
</template>

<style scoped lang="scss">
.section-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 160px;
  padding-right: 12px;
  border-right: 1px solid rgba(90, 170, 255, 0.12);
}
.section-nav__item {
  text-align: left;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--uni-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { color: var(--uni-text-primary); background: rgba(51, 217, 255, 0.06); }
  &--active {
    color: var(--uni-accent-cyan);
    border-color: rgba(51, 217, 255, 0.25);
    background: rgba(51, 217, 255, 0.08);
  }
}
</style>
