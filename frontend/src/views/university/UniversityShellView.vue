<script setup lang="ts">
import { RouterView } from 'vue-router'
import UniversityScreenLayout from '@/components/university/UniversityScreenLayout.vue'
import '@/styles/university/university.scss'
</script>

<template>
  <UniversityScreenLayout>
    <div class="university-shell">
      <RouterView />
    </div>
  </UniversityScreenLayout>
</template>

<style scoped lang="scss">
.university-shell {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
</style>
