<script setup lang="ts">
import { RouterView } from 'vue-router'
import CollegeScreenLayout from '@/shared/layouts/ScreenShell.vue'
import '@/domains/college/styles/cockpit/index.scss'
</script>

<template>
  <CollegeScreenLayout theme="college" scale-mode="fluid" :show-hud="true">
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
