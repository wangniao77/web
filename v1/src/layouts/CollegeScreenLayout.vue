<script setup lang="ts">
import CollegeScreenHeader from '@/components/screen/college/CollegeScreenHeader.vue'
</script>

<template>
  <div class="dashboard cockpit">
    <div class="dashboard-scanline" aria-hidden="true" />
    <div class="cockpit-hud" aria-hidden="true">
      <span class="cockpit-hud__corner cockpit-hud__corner--tl" />
      <span class="cockpit-hud__corner cockpit-hud__corner--tr" />
      <span class="cockpit-hud__corner cockpit-hud__corner--bl" />
      <span class="cockpit-hud__corner cockpit-hud__corner--br" />
      <span class="cockpit-hud__ring" />
    </div>
    <CollegeScreenHeader />
    <main class="screen-main">
      <slot />
    </main>
  </div>
</template>

<style scoped lang="scss">
.dashboard.cockpit {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.screen-main {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}
</style>
