<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    text: string
    /** 滚完一轮大约秒数 */
    duration?: number
  }>(),
  { duration: 8 },
)

const rootRef = ref<HTMLElement | null>(null)
const itemRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)

let loopDistance = 0
let running = false
let lastTs = 0
let rafId = 0
let resizeObserver: ResizeObserver | null = null

function measure() {
  const root = rootRef.value
  const item = itemRef.value
  if (!root || !item) {
    loopDistance = 0
    running = false
    isOverflowing.value = false
    return
  }
  // 用 offsetWidth 取完整文字自然宽度，不受父级裁切影响
  const textW = item.offsetWidth
  const viewW = root.clientWidth
  const gap = 32
  if (textW > viewW + 2) {
    loopDistance = textW + gap
    running = true
    isOverflowing.value = true
  } else {
    loopDistance = 0
    running = false
    isOverflowing.value = false
    root.scrollLeft = 0
  }
}

function tick(now: number) {
  rafId = requestAnimationFrame(tick)
  const root = rootRef.value
  if (!root || !running || loopDistance < 4) {
    lastTs = now
    return
  }
  if (!lastTs) lastTs = now
  const dt = Math.min(0.05, Math.max(0, (now - lastTs) / 1000))
  lastTs = now
  const speed = loopDistance / Math.max(3, props.duration)
  let next = root.scrollLeft + speed * dt
  if (next >= loopDistance) next -= loopDistance
  root.scrollLeft = next
}

function remountMeasure() {
  nextTick(() => {
    measure()
    lastTs = 0
    if (rootRef.value) rootRef.value.scrollLeft = 0
  })
}

onMounted(() => {
  remountMeasure()
  // 等字体/布局稳定后再量一次
  window.setTimeout(remountMeasure, 80)
  window.setTimeout(remountMeasure, 320)
  resizeObserver = new ResizeObserver(() => remountMeasure())
  if (rootRef.value) resizeObserver.observe(rootRef.value)
  rafId = requestAnimationFrame(tick)
})

watch(
  () => props.text,
  () => remountMeasure(),
)

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  resizeObserver?.disconnect()
  resizeObserver = null
  running = false
})
</script>

<template>
  <div ref="rootRef" class="bm-marquee" :title="text">
    <div class="bm-marquee__track">
      <span ref="itemRef" class="bm-marquee__item">{{ text }}</span>
      <span v-if="isOverflowing" class="bm-marquee__item" aria-hidden="true">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.bm-marquee {
  display: block;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    width: 0;
    height: 0;
    display: none;
  }
}

.bm-marquee__track {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 32px;
  width: max-content;
  max-width: none;
  white-space: nowrap;
}

.bm-marquee__item {
  display: inline-block;
  flex: 0 0 auto;
  white-space: nowrap;
}
</style>
