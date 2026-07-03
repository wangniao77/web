<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="placeholder">
    <h1>{{ title }}</h1>
    <p>页面迁移中…</p>
    <router-link to="/">返回门户</router-link>
  </div>
</template>

<style scoped lang="scss">
.placeholder {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: $color-bg-root;
  color: $color-text-primary;

  h1 {
    font-size: $college-fs-xl;
    color: $color-accent-cyan;
  }

  p {
    color: $color-text-muted;
  }

  a {
    color: $color-accent-cyan;
    text-decoration: underline;
  }
}
</style>
