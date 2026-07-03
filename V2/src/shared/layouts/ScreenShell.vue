<script setup lang="ts">
import { computed } from 'vue'
import { useScreenScale, type ScreenScaleMode } from '@/shared/composables/useScreenScale'
import CollegeScreenHeader from '@/domains/college/components/CollegeScreenHeader.vue'
import StudentScreenHeader from '@/domains/student/components/StudentScreenHeader.vue'
import ScreenHeader from '@/shared/components/screen-legacy/ScreenHeader.vue'

export type ScreenTheme = 'college' | 'student' | 'university'
export type ShellScaleMode = ScreenScaleMode | 'none'

const props = withDefaults(
  defineProps<{
    theme?: ScreenTheme
    scaleMode?: ShellScaleMode
    showHud?: boolean
    title?: string
    subtitle?: string
    principles?: string[]
  }>(),
  {
    theme: 'college',
    scaleMode: 'none',
    showHud: false,
    title: '',
    subtitle: '',
    principles: () => [],
  },
)

const scaleOptions = computed(() =>
  props.scaleMode === 'none' ? undefined : { mode: props.scaleMode as ScreenScaleMode },
)

const { scaleStyle, canvasStyle } = useScreenScale(scaleOptions.value ?? { mode: 'contain' })
const useScale = computed(() => props.scaleMode !== 'none')

const wrapperClass = computed(() => [
  'screen-shell',
  `screen-shell--${props.theme}`,
  { 'screen-shell--scaled': useScale.value },
])

const scaleStyles = computed(() =>
  useScale.value ? { ...canvasStyle.value, ...scaleStyle.value } : {},
)
</script>

<template>
  <div v-if="theme === 'college'" class="dashboard cockpit" :class="wrapperClass">
    <div v-if="showHud" class="dashboard-scanline" aria-hidden="true" />
    <div v-if="showHud" class="cockpit-hud" aria-hidden="true">
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

  <div v-else-if="theme === 'student'" class="screen-wrapper student-screen" :class="wrapperClass">
    <div class="screen-scale" :style="scaleStyles">
      <StudentScreenHeader />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>

  <div v-else class="screen-wrapper" :class="wrapperClass">
    <div class="screen-scale" :style="scaleStyles">
      <ScreenHeader :title="title" :subtitle="subtitle" :principles="principles" />
      <main class="screen-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard.cockpit,
.screen-shell {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.screen-wrapper {
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.screen-scale {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transform-origin: center center;
}

.screen-main {
  flex: 1;
  min-height: 0;
  position: relative;
  z-index: 1;
}
</style>
