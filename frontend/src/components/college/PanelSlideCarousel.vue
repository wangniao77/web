<script setup lang="ts">
import { usePanelCarousel } from '@/composables/usePanelCarousel'

const props = withDefaults(
  defineProps<{
    slides: { id: string; label: string }[]
    interval?: number
  }>(),
  { interval: 10000 },
)

const { activeIndex, goTo, pause, resume } = usePanelCarousel(props.slides.length, props.interval)
</script>

<template>
  <div class="panel-carousel" @mouseenter="pause" @mouseleave="resume">
    <div class="panel-carousel__chrome">
      <span class="panel-carousel__badge">{{ slides[activeIndex]?.label }}</span>
      <div class="panel-carousel__dots" role="tablist" aria-label="面板轮播">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          type="button"
          class="panel-carousel__dot"
          :class="{ 'panel-carousel__dot--active': index === activeIndex }"
          :aria-label="slide.label"
          :aria-selected="index === activeIndex"
          @click="goTo(index)"
        />
      </div>
    </div>

    <div class="panel-carousel__viewport">
      <div
        class="panel-carousel__track"
        :style="{ transform: `translateX(-${activeIndex * 100}%)` }"
      >
        <div v-for="slide in slides" :key="slide.id" class="panel-carousel__slide">
          <slot :name="slide.id" />
        </div>
      </div>
    </div>
  </div>
</template>
