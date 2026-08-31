<script setup lang="ts">
import { usePanelCarousel } from '@/composables/usePanelCarousel'

const props = withDefaults(
  defineProps<{
    slides: { id: string; label: string }[]
    interval?: number
    /** 隐藏顶栏徽章/工具/圆点行（内容区最大化，仍自动轮播） */
    hideChrome?: boolean
    /** hideChrome 时，圆点旁用字标出当前页 */
    overlayCaption?: boolean
  }>(),
  { interval: 10000, hideChrome: false, overlayCaption: false },
)

const { activeIndex, goTo, pause, resume } = usePanelCarousel(props.slides.length, props.interval)
</script>

<template>
  <div
    class="panel-carousel"
    :class="{ 'panel-carousel--bare': hideChrome }"
    @mouseenter="pause"
    @mouseleave="resume"
  >
    <div v-if="!hideChrome" class="panel-carousel__chrome">
      <Transition name="panel-carousel-fade" mode="out-in">
        <span :key="slides[activeIndex]?.id" class="panel-carousel__badge">
          {{ slides[activeIndex]?.label }}
        </span>
      </Transition>
      <div class="panel-carousel__tools">
        <Transition name="panel-carousel-fade" mode="out-in">
          <div :key="slides[activeIndex]?.id" class="panel-carousel__extra">
            <slot
              name="chrome-extra"
              :slide="slides[activeIndex]"
              :index="activeIndex"
            />
          </div>
        </Transition>
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
    </div>

    <div class="panel-carousel__viewport">
      <div
        class="panel-carousel__track"
        :style="{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }"
      >
        <div
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="panel-carousel__slide"
          :class="{ 'panel-carousel__slide--active': index === activeIndex }"
        >
          <slot :name="slide.id" />
        </div>
      </div>

      <div
        v-if="hideChrome"
        class="panel-carousel__dots panel-carousel__dots--overlay"
        :class="{ 'panel-carousel__dots--named': overlayCaption }"
        role="tablist"
        aria-label="面板轮播"
      >
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
        <span v-if="overlayCaption" class="panel-carousel__name">
          {{ slides[activeIndex]?.label }}
        </span>
      </div>
    </div>
  </div>
</template>
