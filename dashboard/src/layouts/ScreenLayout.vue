<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import ScreenHeader from '@/components/screen/ScreenHeader.vue'

defineProps<{
  title?: string
  subtitle?: string
  principles?: string[]
}>()

const { scaleStyle } = useScreenScale()
</script>

<template>
  <div class="screen-wrapper">
    <div class="screen-scale" :style="scaleStyle">
      <ScreenHeader :title="title" :subtitle="subtitle" :principles="principles" />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>
