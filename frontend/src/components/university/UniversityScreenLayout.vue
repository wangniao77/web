<script setup lang="ts">
import { useScreenScale } from '@/composables/useScreenScale'
import UniversityScreenHeader from '@/components/university/UniversityScreenHeader.vue'
import StarfieldBackdrop from '@/components/university/StarfieldBackdrop.vue'
import ParticleRainBackground from '@/components/university/ParticleRainBackground.vue'
import type { DashboardMetaVM } from '@/types/university/view'

defineProps<{
  meta?: DashboardMetaVM | null
}>()

const { scaleStyle, canvasStyle, wrapperStyle } = useScreenScale({ mode: 'fluid' })
</script>

<template>
  <div class="screen-wrapper university-screen" :style="wrapperStyle">
    <div class="screen-scale" :style="{ ...canvasStyle, ...scaleStyle }">
      <StarfieldBackdrop />
      <ParticleRainBackground :count="96" />
      <UniversityScreenHeader :meta="meta" />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>
