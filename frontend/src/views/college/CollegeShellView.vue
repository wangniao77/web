<script setup lang="ts">
import { RouterView } from 'vue-router'
import CollegeScreenLayout from '@/layouts/ScreenShell.vue'
import '@/styles/college/cockpit/index.scss'
</script>

<template>
  <CollegeScreenLayout :show-hud="true">
    <div class="college-shell">
      <RouterView />
    </div>
  </CollegeScreenLayout>
</template>

<style scoped lang="scss">
.college-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
